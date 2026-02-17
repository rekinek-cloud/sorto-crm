import express from 'express';
import { z } from 'zod';
import StreamAccessControlService from '../services/StreamAccessControlService';
import { authenticateToken } from '../shared/middleware/auth';
import { DataScope } from '@prisma/client';

const router = express.Router();

// Middleware uwierzytelniania dla wszystkich routes
router.use(authenticateToken);

// Validation schemas
const AccessCheckSchema = z.object({
  dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']),
  action: z.enum(['read', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'AUDIT'])
});

const AccessFiltersSchema = z.object({
  dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']).optional(),
  relationType: z.enum(['OWNS', 'MANAGES', 'BELONGS_TO', 'RELATED_TO', 'DEPENDS_ON', 'SUPPORTS']).optional(),
  includeInherited: z.coerce.boolean().default(true),
  maxDepth: z.coerce.number().int().min(1).max(10).default(5)
});

const AuditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  userId: z.string().uuid().optional(),
  action: z.enum(['read', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'AUDIT']).optional(),
  dataScope: z.enum(['BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS']).optional(),
  granted: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

/**
 * POST /api/v1/streams/:id/access-check
 * Sprawdza uprawnienia użytkownika do strumienia
 */
router.post('/:streamId/access-check', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja danych wejściowych
    const validationResult = AccessCheckSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
    }

    const { dataScope, action } = validationResult.data;

    // Sprawdzenie bezpośredniego dostępu
    const directAccess = await StreamAccessControlService.checkDirectAccess(
      userId,
      streamId,
      dataScope as DataScope,
      action
    );

    // Sprawdzenie dostępu przez relacje
    const relationalAccess = await StreamAccessControlService.checkRelationalAccess(
      userId,
      streamId,
      dataScope as DataScope,
      action
    );

    // Wybierz najlepszy wynik
    const bestAccess = directAccess.hasAccess ? directAccess : relationalAccess;

    // Logowanie sprawdzenia dostępu
    await StreamAccessControlService.logAccess(
      userId,
      streamId,
      action,
      dataScope as DataScope,
      bestAccess.hasAccess,
      bestAccess.via,
      bestAccess.via
    );

    return res.json({
      success: true,
      data: {
        hasAccess: bestAccess.hasAccess,
        accessLevel: bestAccess.accessLevel,
        directAccess: directAccess.hasAccess,
        relationalAccess: relationalAccess.hasAccess,
        grantedScopes: bestAccess.grantedScopes,
        deniedScopes: bestAccess.deniedScopes,
        via: bestAccess.via,
        inheritanceChain: bestAccess.inheritanceChain,
        reason: bestAccess.reason,
        expiresAt: bestAccess.expiresAt
      }
    });

  } catch (error: any) {
    console.error('Error checking stream access:', error);
    
    const userId = (req as any).user?.id;
    const { streamId } = req.params;
    if (userId && streamId) {
      const { dataScope, action } = req.body;
      await StreamAccessControlService.logAccess(
        userId,
        streamId,
        action,
        dataScope,
        false
      ).catch(console.error);
    }

    return res.status(500).json({ 
      error: 'Failed to check stream access',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/:id/accessible-streams
 * Pobiera strumienie dostępne przez relacje
 */
router.get('/:streamId/accessible-streams', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja query parameters
    const queryResult = AccessFiltersSchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: queryResult.error.issues 
      });
    }

    const filters = queryResult.data;

    // Sprawdzenie czy użytkownik ma dostęp do bazowego strumienia
    const baseAccess = await StreamAccessControlService.checkRelationalAccess(
      userId,
      streamId,
      DataScope.BASIC_INFO,
      'read'
    );

    if (!baseAccess.hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to view accessible streams' 
      });
    }

    // Pobranie dostępnych strumieni
    const accessibleStreams = await StreamAccessControlService.getAccessibleRelatedStreams(
      userId,
      streamId,
      filters
    );

    // Logowanie dostępu
    await StreamAccessControlService.logAccess(
      userId,
      streamId,
      'read',
      DataScope.BASIC_INFO,
      true
    );

    return res.json({
      success: true,
      data: accessibleStreams,
      count: accessibleStreams.length,
      filters: filters
    });

  } catch (error: any) {
    console.error('Error fetching accessible streams:', error);
    
    const userId = (req as any).user?.id;
    const { streamId } = req.params;
    if (userId && streamId) {
      await StreamAccessControlService.logAccess(
        userId,
        streamId,
        'read',
        DataScope.BASIC_INFO,
        false
      ).catch(console.error);
    }

    return res.status(500).json({ 
      error: 'Failed to fetch accessible streams',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/user-accessible
 * Pobiera wszystkie strumienie dostępne dla użytkownika
 */
router.get('/user-accessible', async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja query parameters
    const queryResult = AccessFiltersSchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: queryResult.error.issues 
      });
    }

    const filters = queryResult.data;

    // Pobranie wszystkich dostępnych strumieni
    const accessibleStreams = await StreamAccessControlService.getUserAccessibleStreams(
      userId,
      filters
    );

    return res.json({
      success: true,
      data: accessibleStreams,
      count: accessibleStreams.length,
      filters: filters
    });

  } catch (error: any) {
    console.error('Error fetching user accessible streams:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user accessible streams',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/:id/audit-log
 * Pobiera logi dostępu do strumienia
 */
router.get('/:streamId/audit-log', async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Walidacja query parameters
    const queryResult = AuditLogQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: queryResult.error.issues 
      });
    }

    const query = queryResult.data;

    // Sprawdzenie uprawnień do audytu
    const canAudit = await StreamAccessControlService.checkRelationalAccess(
      userId,
      streamId,
      DataScope.AUDIT_LOGS,
      'read'
    );

    if (!canAudit.hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to view audit logs' 
      });
    }

    // Pobranie logów dostępu
    const auditLogs = await StreamAccessControlService.getStreamAccessLogs(
      streamId,
      query.limit,
      query.offset
    );

    // Filtrowanie logów jeśli podano kryteria
    let filteredLogs = auditLogs;
    
    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }
    
    if (query.action) {
      filteredLogs = filteredLogs.filter(log => log.action === query.action);
    }
    
    if (query.dataScope) {
      filteredLogs = filteredLogs.filter(log => log.dataScope.includes(query.dataScope as DataScope));
    }

    if (query.granted !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === query.granted);
    }

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filteredLogs = filteredLogs.filter(log => log.accessedAt >= startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filteredLogs = filteredLogs.filter(log => log.accessedAt <= endDate);
    }

    // Logowanie dostępu do audytu
    await StreamAccessControlService.logAccess(
      userId,
      streamId,
      'read',
      DataScope.AUDIT_LOGS,
      true
    );

    return res.json({
      success: true,
      data: filteredLogs,
      count: filteredLogs.length,
      totalCount: auditLogs.length,
      query: query
    });

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    
    const userId = (req as any).user?.id;
    const { streamId } = req.params;
    if (userId && streamId) {
      await StreamAccessControlService.logAccess(
        userId,
        streamId,
        'read',
        DataScope.AUDIT_LOGS,
        false
      ).catch(console.error);
    }

    return res.status(500).json({ 
      error: 'Failed to fetch audit logs',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/streams/access/clear-cache
 * Czyści cache uprawnień
 */
router.post('/access/clear-cache', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Tylko administratorzy mogą czyścić cache
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      return res.status(403).json({ 
        error: 'Only administrators can clear access cache' 
      });
    }

    const { targetUserId, clearAll } = req.body;

    if (clearAll) {
      StreamAccessControlService.clearAllCache();
    } else if (targetUserId) {
      StreamAccessControlService.clearUserCache(targetUserId);
    } else {
      StreamAccessControlService.clearUserCache(userId);
    }

    return res.json({
      success: true,
      message: 'Access cache cleared successfully'
    });

  } catch (error: any) {
    console.error('Error clearing access cache:', error);
    return res.status(500).json({ 
      error: 'Failed to clear access cache',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/streams/access/clear-expired-cache
 * Czyści przestarzały cache uprawnień
 */
router.post('/access/clear-expired-cache', async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    StreamAccessControlService.clearExpiredCache();

    return res.json({
      success: true,
      message: 'Expired access cache cleared successfully'
    });

  } catch (error: any) {
    console.error('Error clearing expired cache:', error);
    return res.status(500).json({ 
      error: 'Failed to clear expired cache',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/streams/access/cache-stats
 * Pobiera statystyki cache uprawnień
 */
router.get('/access/cache-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Tylko administratorzy mogą przeglądać statystyki cache
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      return res.status(403).json({ 
        error: 'Only administrators can view cache statistics' 
      });
    }

    // Pobranie statystyk z prywatnej właściwości (hack dla demo)
    const cacheSize = (StreamAccessControlService as any).permissionCache?.size || 0;

    return res.json({
      success: true,
      data: {
        cacheSize,
        cacheExpiryMinutes: 15 // wartość hardcoded z serwisu
      }
    });

  } catch (error: any) {
    console.error('Error fetching cache stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch cache statistics',
      message: error.message 
    });
  }
});

export default router;
