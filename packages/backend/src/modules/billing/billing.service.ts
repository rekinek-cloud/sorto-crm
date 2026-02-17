import { prisma } from '../../config/database';
import { eventBusService } from '../events/event-bus.service';
import logger from '../../config/logger';

/**
 * Billing Service for managing organization modules and subscriptions
 * Uses PlatformModule and OrganizationModule models
 */
export class BillingService {
  /**
   * Get current subscription with purchased modules
   */
  async getCurrentSubscription(organizationId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    });

    if (!subscription) {
      return null;
    }

    // Get organization's purchased modules
    const purchasedModules = await prisma.organizationModule.findMany({
      where: { organizationId },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
            monthlyPrice: true,
            yearlyPrice: true,
          },
        },
      },
      orderBy: { activatedAt: 'asc' },
    });

    // Calculate totals
    const activeModules = purchasedModules.filter((m) => m.isActive);
    const totalMonthly = activeModules.reduce(
      (sum, m) => sum + Number(m.module.monthlyPrice),
      0
    );
    const totalYearly = activeModules.reduce(
      (sum, m) => sum + Number(m.module.yearlyPrice),
      0
    );

    return {
      ...subscription,
      modules: purchasedModules.map((pm) => ({
        id: pm.id,
        moduleId: pm.moduleId,
        isActive: pm.isActive,
        activatedAt: pm.activatedAt,
        expiresAt: pm.expiresAt,
        module: pm.module,
      })),
      summary: {
        activeModules: activeModules.length,
        totalModules: purchasedModules.length,
        totalMonthly,
        totalYearly,
        currency: 'PLN',
      },
    };
  }

  /**
   * Add a module to the organization
   */
  async addModule(organizationId: string, moduleId: string, userId: string) {
    // Check if module exists and is active
    const module = await prisma.platformModule.findFirst({
      where: { id: moduleId, isActive: true },
    });

    if (!module) {
      throw new Error('Module not found or inactive');
    }

    // Check if already purchased
    const existing = await prisma.organizationModule.findUnique({
      where: {
        organizationId_moduleId: {
          organizationId,
          moduleId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new Error('Module is already active for this organization');
      }

      // Reactivate
      const reactivated = await prisma.organizationModule.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          activatedAt: new Date(),
          expiresAt: null,
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              monthlyPrice: true,
              yearlyPrice: true,
            },
          },
        },
      });

      await this.publishEvent('module.purchased', organizationId, moduleId, userId, module.name);

      return reactivated;
    }

    // Create new organization module
    const orgModule = await prisma.organizationModule.create({
      data: {
        organizationId,
        moduleId,
        isActive: true,
        activatedAt: new Date(),
      } as any,
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            monthlyPrice: true,
            yearlyPrice: true,
          },
        },
      },
    });

    await this.publishEvent('module.purchased', organizationId, moduleId, userId, module.name);

    return orgModule;
  }

  /**
   * Remove a module from the organization (soft deactivate)
   */
  async removeModule(organizationId: string, moduleId: string, userId: string) {
    const orgModule = await prisma.organizationModule.findUnique({
      where: {
        organizationId_moduleId: {
          organizationId,
          moduleId,
        },
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    if (!orgModule) {
      throw new Error('Module not found for this organization');
    }

    if (!orgModule.isActive) {
      throw new Error('Module is already inactive');
    }

    const deactivated = await prisma.organizationModule.update({
      where: { id: orgModule.id },
      data: {
        isActive: false,
        expiresAt: new Date(),
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    await this.publishEvent('module.cancelled', organizationId, moduleId, userId, orgModule.module.name);

    return deactivated;
  }

  /**
   * Get available modules with pricing
   */
  async getAvailableModules(organizationId: string) {
    const modules = await prisma.platformModule.findMany({
      where: { isActive: true, isPublic: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        type: true,
        url: true,
        monthlyPrice: true,
        yearlyPrice: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get organization's purchased modules
    const purchasedModules = await prisma.organizationModule.findMany({
      where: { organizationId },
      select: { moduleId: true, isActive: true },
    });

    const purchasedMap = new Map(
      purchasedModules.map((m) => [m.moduleId, m.isActive])
    );

    return modules.map((module) => ({
      ...module,
      monthlyPrice: Number(module.monthlyPrice),
      yearlyPrice: Number(module.yearlyPrice),
      currency: 'PLN',
      isPurchased: purchasedMap.get(module.id) ?? false,
    }));
  }

  /**
   * Check if organization has access to a specific module
   */
  async hasModuleAccess(organizationId: string, moduleSlug: string): Promise<boolean> {
    const orgModule = await prisma.organizationModule.findFirst({
      where: {
        organizationId,
        isActive: true,
        module: {
          slug: moduleSlug,
          isActive: true,
        },
      },
    });

    return !!orgModule;
  }

  /**
   * Get organization's active modules
   */
  async getActiveModules(organizationId: string) {
    const orgModules = await prisma.organizationModule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            url: true,
            type: true,
          },
        },
      },
    });

    return orgModules.map((om) => om.module);
  }

  private async publishEvent(
    eventType: string,
    organizationId: string,
    moduleId: string,
    userId: string,
    moduleName: string
  ) {
    try {
      await eventBusService.publish({
        type: eventType,
        source: 'billing-service',
        data: { moduleId, moduleName },
        userId,
        organizationId,
      });
    } catch (error) {
      logger.error('Failed to publish billing event', { eventType, error });
    }
  }
}

export const billingService = new BillingService();
