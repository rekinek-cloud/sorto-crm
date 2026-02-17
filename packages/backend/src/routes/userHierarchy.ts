import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import UserHierarchyService, { CreateUserRelationInput, UserAccessCheckInput, HierarchyQuery } from '../services/UserHierarchyService';
import { z } from 'zod';


const router = express.Router();

// Wszystkie endpointy wymagają autentyfikacji
router.use(authenticateToken);

// === USER HIERARCHY MANAGEMENT ===

/**
 * POST /user-hierarchy/relations
 * Tworzy nową relację hierarchiczną między użytkownikami
 */
router.post('/relations', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const relation = await UserHierarchyService.createRelation(req.body as CreateUserRelationInput, userId);
    
    return res.status(201).json({
      success: true,
      data: relation
    });
  } catch (error: any) {
    console.error('Error creating user relation:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create user relation'
    });
  }
});

/**
 * GET /user-hierarchy/:userId/hierarchy
 * Pobiera hierarchię użytkownika
 */
router.get('/:userId/hierarchy', async (req, res) => {
  try {
    const { userId } = req.params;
    const query: HierarchyQuery = {
      direction: req.query.direction as any || 'both',
      depth: parseInt(req.query.depth as string) || 3,
      includePermissions: req.query.includePermissions === 'true',
      includeInactive: req.query.includeInactive === 'true'
    };

    const hierarchy = await UserHierarchyService.getUserHierarchy(userId, query);
    
    return res.json({
      success: true,
      data: hierarchy
    });
  } catch (error: any) {
    console.error('Error getting user hierarchy:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user hierarchy'
    });
  }
});

/**
 * GET /user-hierarchy/:userId/managed-users
 * Pobiera użytkowników zarządzanych przez użytkownika
 */
router.get('/:userId/managed-users', async (req, res) => {
  try {
    const { userId } = req.params;
    const query: HierarchyQuery = {
      direction: 'down',
      depth: parseInt(req.query.depth as string) || 3,
      includePermissions: req.query.includePermissions === 'true',
      includeInactive: req.query.includeInactive === 'true'
    };

    const managedUsers = await UserHierarchyService.getManagedUsers(userId, query);
    
    return res.json({
      success: true,
      data: managedUsers
    });
  } catch (error: any) {
    console.error('Error getting managed users:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get managed users'
    });
  }
});

/**
 * GET /user-hierarchy/:userId/managers
 * Pobiera managerów użytkownika
 */
router.get('/:userId/managers', async (req, res) => {
  try {
    const { userId } = req.params;
    const query: HierarchyQuery = {
      direction: 'up',
      depth: parseInt(req.query.depth as string) || 3,
      includePermissions: req.query.includePermissions === 'true',
      includeInactive: req.query.includeInactive === 'true'
    };

    const managers = await UserHierarchyService.getUserManagers(userId, query);
    
    return res.json({
      success: true,
      data: managers
    });
  } catch (error: any) {
    console.error('Error getting user managers:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user managers'
    });
  }
});

/**
 * DELETE /user-hierarchy/relations/:relationId
 * Usuwa relację hierarchiczną
 */
router.delete('/relations/:relationId', async (req, res) => {
  try {
    const { relationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    await UserHierarchyService.deleteRelation(relationId, userId);
    
    return res.json({
      success: true,
      message: 'Relation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user relation:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete user relation'
    });
  }
});

/**
 * GET /user-hierarchy/stats
 * Pobiera statystyki hierarchii dla organizacji
 */
router.get('/stats', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, error: 'Organization not found' });
    }

    const stats = await UserHierarchyService.getHierarchyStats(organizationId);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting hierarchy stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get hierarchy stats'
    });
  }
});

// === ACCESS CONTROL ===

/**
 * POST /user-hierarchy/access-check
 * Sprawdza uprawnienia użytkownika do innego użytkownika
 */
router.post('/access-check', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const accessCheckInput: UserAccessCheckInput = {
      userId,
      ...req.body
    };

    const accessResult = await UserHierarchyService.checkUserAccess(accessCheckInput);
    
    // Log access attempt
    await UserHierarchyService.logAccess(
      userId,
      req.body.targetUserId,
      req.body.action,
      req.body.dataScope,
      accessResult.hasAccess,
      accessResult.directAccess ? 'DIRECT' : 'RELATION_BASED',
      accessResult.via,
      req.ip,
      req.get('User-Agent'),
      req.originalUrl
    );
    
    return res.json({
      success: true,
      data: accessResult
    });
  } catch (error: any) {
    console.error('Error checking user access:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check user access'
    });
  }
});

// === USER MANAGEMENT ===

/**
 * GET /user-hierarchy/users
 * Pobiera listę użytkowników w organizacji z informacjami o hierarchii
 */
router.get('/users', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, error: 'Organization not found' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const role = req.query.role as string;
    const includeInactive = req.query.includeInactive === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId,
      isActive: includeInactive ? undefined : true
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          user_relations_user_relations_managerIdTousers: {
            where: { isActive: true },
            select: {
              id: true,
              relationType: true,
              users_user_relations_employeeIdTousers: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          user_relations_user_relations_employeeIdTousers: {
            where: { isActive: true },
            select: {
              id: true,
              relationType: true,
              users_user_relations_managerIdTousers: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users'
    });
  }
});

/**
 * GET /user-hierarchy/users/:userId
 * Pobiera szczegóły użytkownika z informacjami o hierarchii
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!requestingUserId || !organizationId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check access to view this user's details
    const accessCheck = await UserHierarchyService.checkUserAccess({
      userId: requestingUserId,
      targetUserId: userId,
      dataScope: 'PROFILE',
      action: 'VIEW'
    });

    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        reason: accessCheck.reason
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        user_relations_user_relations_managerIdTousers: {
          where: { isActive: true },
          include: {
            users_user_relations_employeeIdTousers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true
              }
            },
            user_permissions: true
          }
        },
        user_relations_user_relations_employeeIdTousers: {
          where: { isActive: true },
          include: {
            users_user_relations_managerIdTousers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true
              }
            },
            user_permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Log access
    await UserHierarchyService.logAccess(
      requestingUserId,
      userId,
      'view_profile',
      'PROFILE',
      true,
      accessCheck.directAccess ? 'DIRECT' : 'RELATION_BASED',
      accessCheck.via,
      req.ip,
      req.get('User-Agent'),
      req.originalUrl
    );

    return res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error getting user details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user details'
    });
  }
});

// === DELEGATION & APPROVAL ===

/**
 * POST /user-hierarchy/delegate
 * Deleguje zadanie do użytkownika w hierarchii
 */
router.post('/delegate', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { targetUserId, taskId, projectId, delegationType, instructions } = req.body;

    // Check delegation permissions
    const accessCheck = await UserHierarchyService.checkUserAccess({
      userId,
      targetUserId,
      dataScope: 'TASKS',
      action: 'DELEGATE'
    });

    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'Delegation not allowed',
        reason: accessCheck.reason
      });
    }

    // TODO: Implement actual delegation logic
    // This would involve creating delegation records, updating task assignments, etc.

    return res.json({
      success: true,
      message: 'Delegation successful',
      data: {
        delegatedTo: targetUserId,
        type: delegationType,
        instructions
      }
    });
  } catch (error: any) {
    console.error('Error delegating:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delegate'
    });
  }
});

// === VALIDATION SCHEMAS ===

const CreateRelationSchema = z.object({
  managerId: z.string().uuid(),
  employeeId: z.string().uuid(),
  relationType: z.enum(['MANAGES', 'LEADS', 'SUPERVISES', 'MENTORS', 'COLLABORATES', 'SUPPORTS', 'REPORTS_TO']),
  description: z.string().optional(),
  inheritanceRule: z.enum(['NO_INHERITANCE', 'INHERIT_DOWN', 'INHERIT_UP', 'INHERIT_BIDIRECTIONAL']).default('INHERIT_DOWN'),
  canDelegate: z.boolean().default(true),
  canApprove: z.boolean().default(false),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional()
});

// Add validation middleware for specific routes
router.use('/relations', (req, res, next) => {
  if (req.method === 'POST') {
    try {
      CreateRelationSchema.parse(req.body);
      return next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
  } else {
    return next();
  }
});

export default router;
