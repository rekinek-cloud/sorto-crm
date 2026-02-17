import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import config from '../../config';
import logger from '../../config/logger';

// Extended Request interface to include user and organization
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    firstName: string;
    lastName: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    limits: any;
  };
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN' 
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    // Get user from database with organization
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND' 
      });
      return;
    }

    // Check if organization is active
    if (!user.organization) {
      res.status(401).json({ 
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND' 
      });
      return;
    }

    // Attach user and organization to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    req.organization = {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      limits: user.organization.limits,
    };

    // Set organization context for RLS
    await prisma.$executeRaw`SELECT set_config('app.current_org_id', ${user.organizationId}::text, true)`;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED' 
      });
    } else {
      logger.error('Authentication error:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR' 
      });
    }
  }
};

/**
 * Middleware to check user roles
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role 
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check organization limits
 */
export const checkOrganizationLimits = (resource: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.organization) {
        res.status(401).json({ 
          error: 'Organization context required',
          code: 'ORG_CONTEXT_REQUIRED' 
        });
        return;
      }

      const limits = req.organization.limits || {};
      const organizationId = req.organization.id;

      // Check specific resource limits
      switch (resource) {
        case 'users':
          const userCount = await prisma.user.count({
            where: { organizationId, isActive: true }
          });
          if (limits.max_users && userCount >= limits.max_users) {
            res.status(403).json({
              error: 'User limit reached',
              code: 'USER_LIMIT_REACHED',
              current: userCount,
              limit: limits.max_users
            });
            return;
          }
          break;

        case 'streams':
          const streamCount = await prisma.stream.count({
            where: { organizationId }
          });
          if (limits.max_streams && streamCount >= limits.max_streams) {
            res.status(403).json({
              error: 'Stream limit reached',
              code: 'STREAM_LIMIT_REACHED',
              current: streamCount,
              limit: limits.max_streams
            });
            return;
          }
          break;

        case 'tasks':
          const taskCount = await prisma.task.count({
            where: { 
              organizationId,
              createdById: req.user!.id 
            }
          });
          if (limits.max_tasks_per_user && taskCount >= limits.max_tasks_per_user) {
            res.status(403).json({
              error: 'Task limit reached',
              code: 'TASK_LIMIT_REACHED',
              current: taskCount,
              limit: limits.max_tasks_per_user
            });
            return;
          }
          break;

        case 'projects':
          const projectCount = await prisma.project.count({
            where: { organizationId }
          });
          if (limits.max_projects && projectCount >= limits.max_projects) {
            res.status(403).json({
              error: 'Project limit reached',
              code: 'PROJECT_LIMIT_REACHED',
              current: projectCount,
              limit: limits.max_projects
            });
            return;
          }
          break;
      }

      next();
    } catch (error) {
      logger.error('Error checking organization limits:', error);
      res.status(500).json({ 
        error: 'Failed to check limits',
        code: 'LIMIT_CHECK_ERROR' 
      });
    }
  };
};

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true,
        },
        include: {
          organization: true,
        },
      });

      if (user && user.organization) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          firstName: user.firstName,
          lastName: user.lastName,
        };

        req.organization = {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          limits: user.organization.limits,
        };

        // Set organization context for RLS
        await prisma.$executeRaw`SELECT set_config('app.current_org_id', ${user.organizationId}, true)`;
      }
    }

    next();
  } catch (error) {
    // In optional auth, we don't fail on invalid tokens
    logger.debug('Optional auth failed:', error);
    next();
  }
};

// Alias for backward compatibility
export const authenticateUser = authenticateToken;
