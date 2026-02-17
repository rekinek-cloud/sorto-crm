import { prisma } from '../../config/database';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../../shared/middleware/error';
import config from '../../config';
import logger from '../../config/logger';
import {
  UpdateOrganizationRequest,
  UpdateUserRequest,
  PaginationQuery,
  UpdateSubscriptionRequest,
  UpdateLimitsRequest,
  StatsQuery,
  BulkUserOperation,
} from './schemas';

export class OrganizationService {
  /**
   * Get organization details
   */
  async getOrganization(organizationId: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIAL'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              users: { where: { isActive: true } },
              streams: true,
              tasks: true,
              projects: true,
              contacts: true,
            },
          },
        },
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        settings: organization.settings,
        limits: organization.limits,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        subscription: organization.subscriptions[0] || null,
        usage: {
          users: organization._count.users,
          streams: organization._count.streams,
          tasks: organization._count.tasks,
          projects: organization._count.projects,
          contacts: organization._count.contacts,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get organization failed:', error);
      throw new AppError('Failed to get organization', 500, 'GET_ORGANIZATION_ERROR');
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(organizationId: string, data: UpdateOrganizationRequest) {
    try {
      const organization = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      logger.info(`Organization updated: ${organization.name} (${organization.id})`);

      return organization;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Update organization failed:', error);
      throw new AppError('Failed to update organization', 500, 'UPDATE_ORGANIZATION_ERROR');
    }
  }

  /**
   * Get organization users with pagination
   */
  async getUsers(organizationId: string, query: PaginationQuery) {
    try {
      const { page, limit, search, role, isActive } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        organizationId,
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      // Get users and total count
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Get organization users failed:', error);
      throw new AppError('Failed to get organization users', 500, 'GET_USERS_ERROR');
    }
  }

  /**
   * Get specific user
   */
  async getUser(organizationId: string, userId: string) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
        include: {
          _count: {
            select: {
              createdTasks: true,
              assignedTasks: true,
              createdProjects: true,
              assignedProjects: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        settings: user.settings,
        stats: {
          createdTasks: user._count.createdTasks,
          assignedTasks: user._count.assignedTasks,
          createdProjects: user._count.createdProjects,
          assignedProjects: user._count.assignedProjects,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get user failed:', error);
      throw new AppError('Failed to get user', 500, 'GET_USER_ERROR');
    }
  }

  /**
   * Update user
   */
  async updateUser(organizationId: string, userId: string, data: UpdateUserRequest, updatedBy: string) {
    try {
      // Check if user exists in the organization
      const existingUser = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent changing OWNER role (additional security)
      if (existingUser.role === 'OWNER' && data.role && (data.role as string) !== 'OWNER') {
        throw new ForbiddenError('Cannot change owner role');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          updatedAt: true,
        },
      });

      logger.info(`User updated: ${updatedUser.email} by ${updatedBy}`);

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Update user failed:', error);
      throw new AppError('Failed to update user', 500, 'UPDATE_USER_ERROR');
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(organizationId: string, userId: string, deactivatedBy: string) {
    try {
      // Check if user exists and is not the owner
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.role === 'OWNER') {
        throw new ForbiddenError('Cannot deactivate organization owner');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      logger.info(`User deactivated: ${updatedUser.email} by ${deactivatedBy}`);

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Deactivate user failed:', error);
      throw new AppError('Failed to deactivate user', 500, 'DEACTIVATE_USER_ERROR');
    }
  }

  /**
   * Get organization statistics
   */
  async getStatistics(organizationId: string, query: StatsQuery) {
    try {
      const { period } = query;
      
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get overall counts
      const [
        totalUsers,
        activeUsers,
        totalTasks,
        completedTasks,
        totalProjects,
        activeProjects,
        totalStreams,
        totalContacts,
      ] = await Promise.all([
        prisma.user.count({ where: { organizationId } }),
        prisma.user.count({ where: { organizationId, isActive: true } }),
        prisma.task.count({ where: { organizationId } }),
        prisma.task.count({ where: { organizationId, status: 'COMPLETED' } }),
        prisma.project.count({ where: { organizationId } }),
        prisma.project.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
        prisma.stream.count({ where: { organizationId } }),
        prisma.contact.count({ where: { organizationId } }),
      ]);

      // Get time-series data for the period
      const tasksCreated = await prisma.task.groupBy({
        by: ['createdAt'],
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      const tasksCompleted = await prisma.task.groupBy({
        by: ['completedAt'],
        where: {
          organizationId,
          completedAt: { gte: startDate },
          status: 'COMPLETED',
        },
        _count: true,
      });

      return {
        period,
        summary: {
          users: {
            total: totalUsers,
            active: activeUsers,
            activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          },
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          },
          projects: {
            total: totalProjects,
            active: activeProjects,
          },
          streams: totalStreams,
          contacts: totalContacts,
        },
        trends: {
          tasksCreated: tasksCreated.length,
          tasksCompleted: tasksCompleted.length,
        },
      };
    } catch (error) {
      logger.error('Get organization statistics failed:', error);
      throw new AppError('Failed to get organization statistics', 500, 'GET_STATS_ERROR');
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(organizationId: string, data: UpdateSubscriptionRequest) {
    try {
      // Get current subscription
      const currentSub = await prisma.subscription.findFirst({
        where: {
          organizationId,
          status: { in: ['ACTIVE', 'TRIAL'] },
        },
      });

      if (!currentSub) {
        throw new NotFoundError('No active subscription found');
      }

      // Update organization limits based on new plan
      const newLimits = config.TIER_LIMITS[data.plan];

      await prisma.$transaction(async (tx) => {
        // Update subscription
        await tx.subscription.update({
          where: { id: currentSub.id },
          data: {
            plan: data.plan,
            updatedAt: new Date(),
          },
        });

        // Update organization limits
        await tx.organization.update({
          where: { id: organizationId },
          data: {
            limits: newLimits,
            updatedAt: new Date(),
          },
        });
      });

      logger.info(`Subscription updated to ${data.plan} for organization: ${organizationId}`);

      return { message: 'Subscription updated successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Update subscription failed:', error);
      throw new AppError('Failed to update subscription', 500, 'UPDATE_SUBSCRIPTION_ERROR');
    }
  }

  /**
   * Bulk user operations
   */
  async bulkUserOperation(organizationId: string, data: BulkUserOperation, operatedBy: string) {
    try {
      const { operation, userIds, newRole } = data;

      // Verify all users belong to the organization
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          organizationId,
        },
      });

      if (users.length !== userIds.length) {
        throw new NotFoundError('Some users not found in organization');
      }

      // Prevent operations on owners
      const owners = users.filter(u => u.role === 'OWNER');
      if (owners.length > 0 && operation !== 'change_role') {
        throw new ForbiddenError('Cannot perform bulk operations on organization owners');
      }

      let updateData: any = {};
      
      switch (operation) {
        case 'activate':
          updateData = { isActive: true };
          break;
        case 'deactivate':
          updateData = { isActive: false };
          break;
        case 'change_role':
          if (!newRole) {
            throw new AppError('New role is required for change_role operation', 400, 'MISSING_ROLE');
          }
          updateData = { role: newRole };
          break;
        case 'delete':
          // For delete, we'll handle it separately
          break;
      }

      let result;
      
      if (operation === 'delete') {
        // Delete users (soft delete by deactivating)
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds.filter(id => !owners.find(o => o.id === id)) },
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });
      } else {
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
          },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
        });
      }

      logger.info(`Bulk operation ${operation} performed on ${result.count} users by ${operatedBy}`);

      return {
        message: `${operation} operation completed successfully`,
        affected: result.count,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Bulk user operation failed:', error);
      throw new AppError('Failed to perform bulk operation', 500, 'BULK_OPERATION_ERROR');
    }
  }
}
