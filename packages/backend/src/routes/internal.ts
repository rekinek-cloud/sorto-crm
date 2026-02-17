/**
 * Internal API Routes
 *
 * Endpointy wewnętrzne dla komunikacji service-to-service (np. RAG -> CRM).
 * Wymagają CRM_SERVICE_TOKEN zamiast JWT użytkownika.
 */

import express from 'express';
import { prisma } from '../config/database';

const router = express.Router();

// Service token validation middleware
const validateServiceToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const serviceToken = process.env.CRM_SERVICE_TOKEN;

  if (!serviceToken) {
    console.warn('CRM_SERVICE_TOKEN not configured');
    return res.status(500).json({ error: 'Service token not configured' });
  }

  // Accept both Bearer token and direct token
  const providedToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (providedToken !== serviceToken) {
    return res.status(401).json({ error: 'Invalid service token' });
  }

  return next();
};

// Apply service token validation to all internal routes
router.use(validateServiceToken);

/**
 * GET /internal/user-relations
 *
 * Pobiera relacje użytkownika dla kontroli dostępu RAG.
 *
 * Query params:
 * - employeeId: ID pracownika (znajdź jego managerów)
 * - managerId: ID managera (znajdź jego podwładnych)
 * - organizationId: ID organizacji (wymagane)
 * - isActive: tylko aktywne relacje (domyślnie true)
 */
router.get('/user-relations', async (req, res) => {
  try {
    const { employeeId, managerId, organizationId, isActive } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: 'organizationId is required'
      });
    }

    const where: any = {
      organizationId: organizationId as string,
      isActive: isActive !== 'false'
    };

    if (employeeId) {
      where.employeeId = employeeId as string;
    }

    if (managerId) {
      where.managerId = managerId as string;
    }

    const relations = await prisma.user_relations.findMany({
      where,
      select: {
        id: true,
        managerId: true,
        employeeId: true,
        relationType: true,
        isActive: true,
        canDelegate: true,
        canApprove: true,
        users_user_relations_managerIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        users_user_relations_employeeIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json(relations);
  } catch (error: any) {
    console.error('Error fetching user relations:', error);
    return res.status(500).json({
      error: 'Failed to fetch user relations',
      message: error.message
    });
  }
});

/**
 * GET /internal/user-streams
 *
 * Pobiera strumienie do których użytkownik ma dostęp.
 *
 * Query params:
 * - userId: ID użytkownika
 * - organizationId: ID organizacji (wymagane)
 */
router.get('/user-streams', async (req, res) => {
  try {
    const { userId, organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: 'organizationId is required'
      });
    }

    // Base query for streams
    const where: any = {
      organizationId: organizationId as string,
      status: 'ACTIVE'
    };

    // If userId provided, filter by membership
    if (userId) {
      where.OR = [
        { createdById: userId as string },
        {
          stream_permissions: {
            some: {
              userId: userId as string,
              isActive: true
            }
          }
        }
      ];
    }

    const streams = await prisma.stream.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        streamType: true,
        streamRole: true,
        color: true,
        createdById: true
      }
    });

    return res.json(streams);
  } catch (error: any) {
    console.error('Error fetching user streams:', error);
    return res.status(500).json({
      error: 'Failed to fetch user streams',
      message: error.message
    });
  }
});

/**
 * GET /internal/user-context
 *
 * Pobiera pełny kontekst organizacyjny użytkownika dla RAG.
 * Kombinuje relacje hierarchiczne i członkostwo w strumieniach.
 *
 * Query params:
 * - userId: ID użytkownika (wymagane)
 * - organizationId: ID organizacji (wymagane)
 */
router.get('/user-context', async (req, res) => {
  try {
    const { userId, organizationId } = req.query;

    if (!userId || !organizationId) {
      return res.status(400).json({
        error: 'userId and organizationId are required'
      });
    }

    // 1. Get user's role
    const user = await prisma.user.findFirst({
      where: {
        id: userId as string,
        organizationId: organizationId as string
      },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Get user's managers (relations where user is employee)
    const managerRelations = await prisma.user_relations.findMany({
      where: {
        employeeId: userId as string,
        organizationId: organizationId as string,
        isActive: true
      },
      select: {
        managerId: true,
        relationType: true
      }
    });

    // 3. Get user's subordinates (relations where user is manager)
    const subordinateRelations = await prisma.user_relations.findMany({
      where: {
        managerId: userId as string,
        organizationId: organizationId as string,
        isActive: true
      },
      select: {
        employeeId: true,
        relationType: true
      }
    });

    // 4. Get team members (colleagues with same manager)
    const managerIds = managerRelations.map(r => r.managerId);
    let teamMemberIds: string[] = [];

    if (managerIds.length > 0) {
      const teamRelations = await prisma.user_relations.findMany({
        where: {
          managerId: { in: managerIds },
          organizationId: organizationId as string,
          isActive: true,
          employeeId: { not: userId as string }
        },
        select: {
          employeeId: true
        }
      });
      teamMemberIds = teamRelations.map(r => r.employeeId);
    }

    // 5. Get user's streams
    const streams = await prisma.stream.findMany({
      where: {
        organizationId: organizationId as string,
        status: 'ACTIVE',
        OR: [
          { createdById: userId as string },
          {
            stream_permissions: {
              some: {
                userId: userId as string,
                isActive: true
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        streamType: true
      }
    });

    // Build accessible user IDs
    const accessibleUserIds = new Set<string>();
    accessibleUserIds.add(userId as string); // Always own data

    // Add based on role
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      // OWNER/ADMIN see everyone - return empty set (means no filter)
      return res.json({
        userId: user.id,
        userRole: user.role,
        userName: `${user.firstName} ${user.lastName}`,
        managerIds: managerRelations.map(r => r.managerId),
        subordinateIds: subordinateRelations.map(r => r.employeeId),
        teamMemberIds,
        streamIds: streams.map(s => s.id),
        accessibleUserIds: [], // Empty = no filter (full access)
        fullAccess: true
      });
    }

    // MANAGER sees subordinates
    subordinateRelations.forEach(r => accessibleUserIds.add(r.employeeId));

    // MEMBER sees team members
    teamMemberIds.forEach(id => accessibleUserIds.add(id));

    return res.json({
      userId: user.id,
      userRole: user.role,
      userName: `${user.firstName} ${user.lastName}`,
      managerIds: managerRelations.map(r => r.managerId),
      subordinateIds: subordinateRelations.map(r => r.employeeId),
      teamMemberIds,
      streamIds: streams.map(s => s.id),
      accessibleUserIds: Array.from(accessibleUserIds),
      fullAccess: false
    });

  } catch (error: any) {
    console.error('Error fetching user context:', error);
    return res.status(500).json({
      error: 'Failed to fetch user context',
      message: error.message
    });
  }
});

/**
 * GET /internal/health
 * Health check dla internal API
 */
router.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'crm-internal-api',
    timestamp: new Date().toISOString()
  });
});

export default router;
