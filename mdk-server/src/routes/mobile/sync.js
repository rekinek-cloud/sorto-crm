const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');
const syncService = require('../../services/sync');
const logger = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route POST /api/v1/mobile/sync/pull
 * @desc Pull changes from server to mobile device
 */
router.post('/pull', asyncHandler(async (req, res) => {
  const { user } = req;
  const { lastSyncTime, entityTypes = [] } = req.body;
  const deviceId = req.headers['x-device-id'];

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'Device ID required for sync',
      code: 'DEVICE_ID_REQUIRED'
    });
  }

  try {
    // Process sync request
    const syncResult = await syncService.processDeviceSync(
      user.id,
      deviceId,
      lastSyncTime ? new Date(lastSyncTime) : null
    );

    // Filter by requested entity types if specified
    if (entityTypes.length > 0) {
      const filteredData = {};
      for (const entityType of entityTypes) {
        if (syncResult.data[entityType]) {
          filteredData[entityType] = syncResult.data[entityType];
        }
      }
      syncResult.data = filteredData;
    }

    res.json({
      success: true,
      data: syncResult.data,
      meta: {
        syncToken: syncResult.syncToken,
        serverTime: syncResult.serverTime,
        hasMore: syncResult.hasMore,
        deviceId: deviceId,
        userId: user.id
      }
    });

  } catch (error) {
    logger.error('Sync pull error:', error);
    res.status(500).json({
      success: false,
      error: 'Sync operation failed',
      code: 'SYNC_FAILED',
      details: error.message
    });
  }
}));

/**
 * @route POST /api/v1/mobile/sync/push
 * @desc Push changes from mobile device to server
 */
router.post('/push', asyncHandler(async (req, res) => {
  const { user } = req;
  const { changes, syncToken } = req.body;
  const deviceId = req.headers['x-device-id'];

  if (!changes || !Array.isArray(changes)) {
    return res.status(400).json({
      success: false,
      error: 'Changes array required',
      code: 'CHANGES_REQUIRED'
    });
  }

  try {
    // Process client changes
    const result = await syncService.processClientChanges(
      user.id,
      deviceId,
      changes
    );

    // Generate new sync token if any changes were applied
    let newSyncToken = syncToken;
    if (result.applied.length > 0) {
      newSyncToken = syncService.generateSyncToken();
    }

    res.json({
      success: true,
      data: {
        applied: result.applied,
        conflicts: result.conflicts,
        errors: result.errors,
        stats: {
          totalChanges: changes.length,
          applied: result.applied.length,
          conflicts: result.conflicts.length,
          errors: result.errors.length
        }
      },
      meta: {
        syncToken: newSyncToken,
        serverTime: new Date().toISOString(),
        deviceId: deviceId,
        userId: user.id
      }
    });

  } catch (error) {
    logger.error('Sync push error:', error);
    res.status(500).json({
      success: false,
      error: 'Sync operation failed',
      code: 'SYNC_FAILED',
      details: error.message
    });
  }
}));

/**
 * @route POST /api/v1/mobile/sync/resolve-conflicts
 * @desc Resolve sync conflicts
 */
router.post('/resolve-conflicts', asyncHandler(async (req, res) => {
  const { user } = req;
  const { conflicts, resolutions } = req.body;
  const deviceId = req.headers['x-device-id'];

  if (!conflicts || !resolutions) {
    return res.status(400).json({
      success: false,
      error: 'Conflicts and resolutions required',
      code: 'MISSING_RESOLUTION_DATA'
    });
  }

  try {
    const resolvedChanges = [];
    const remainingConflicts = [];

    for (let i = 0; i < conflicts.length; i++) {
      const conflict = conflicts[i];
      const resolution = resolutions[i];

      if (!resolution || !resolution.strategy) {
        remainingConflicts.push(conflict);
        continue;
      }

      try {
        const resolvedChange = await resolveConflict(conflict, resolution, user.id);
        resolvedChanges.push(resolvedChange);
      } catch (error) {
        logger.error('Conflict resolution error:', error);
        remainingConflicts.push({
          ...conflict,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        resolved: resolvedChanges,
        remaining: remainingConflicts,
        stats: {
          totalConflicts: conflicts.length,
          resolved: resolvedChanges.length,
          remaining: remainingConflicts.length
        }
      },
      meta: {
        serverTime: new Date().toISOString(),
        deviceId: deviceId,
        userId: user.id
      }
    });

  } catch (error) {
    logger.error('Conflict resolution error:', error);
    res.status(500).json({
      success: false,
      error: 'Conflict resolution failed',
      code: 'RESOLUTION_FAILED',
      details: error.message
    });
  }
}));

/**
 * @route GET /api/v1/mobile/sync/status
 * @desc Get sync status for device
 */
router.get('/status', asyncHandler(async (req, res) => {
  const { user } = req;
  const deviceId = req.headers['x-device-id'];

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'Device ID required',
      code: 'DEVICE_ID_REQUIRED'
    });
  }

  try {
    // Get sync session
    const syncSession = await prisma.syncSession.findUnique({
      where: {
        deviceId_userId: {
          deviceId: deviceId,
          userId: user.id
        }
      }
    });

    if (!syncSession) {
      return res.status(404).json({
        success: false,
        error: 'Sync session not found',
        code: 'SYNC_SESSION_NOT_FOUND'
      });
    }

    // Get pending operations
    const pendingOperations = await prisma.syncOperation.findMany({
      where: {
        syncSessionId: syncSession.id,
        status: 'IN_PROGRESS'
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Calculate sync statistics
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const operationsLastHour = await prisma.syncOperation.count({
      where: {
        syncSessionId: syncSession.id,
        timestamp: { gte: lastHour }
      }
    });

    res.json({
      success: true,
      data: {
        session: {
          id: syncSession.id,
          lastSyncAt: syncSession.lastSyncAt,
          syncToken: syncSession.syncToken,
          conflictResolutionStrategy: syncSession.conflictResolutionStrategy
        },
        status: {
          isOnline: true, // Since we're responding, device is online
          lastSyncAgo: Date.now() - new Date(syncSession.lastSyncAt).getTime(),
          pendingOperations: pendingOperations.length,
          operationsLastHour: operationsLastHour
        },
        pendingOperations: pendingOperations.map(op => ({
          id: op.id,
          operation: op.operation,
          endpoint: op.endpoint,
          timestamp: op.timestamp,
          status: op.status
        }))
      },
      meta: {
        serverTime: new Date().toISOString(),
        deviceId: deviceId,
        userId: user.id
      }
    });

  } catch (error) {
    logger.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      code: 'SYNC_STATUS_FAILED',
      details: error.message
    });
  }
}));

/**
 * @route POST /api/v1/mobile/sync/reset
 * @desc Reset sync session (force full sync)
 */
router.post('/reset', asyncHandler(async (req, res) => {
  const { user } = req;
  const deviceId = req.headers['x-device-id'];

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'Device ID required',
      code: 'DEVICE_ID_REQUIRED'
    });
  }

  try {
    // Reset sync session
    await prisma.syncSession.upsert({
      where: {
        deviceId_userId: {
          deviceId: deviceId,
          userId: user.id
        }
      },
      update: {
        lastSyncAt: new Date(0), // Reset to epoch
        syncToken: syncService.generateSyncToken(),
        conflictResolutionStrategy: 'SERVER_WINS'
      },
      create: {
        deviceId: deviceId,
        userId: user.id,
        lastSyncAt: new Date(0),
        syncToken: syncService.generateSyncToken(),
        conflictResolutionStrategy: 'SERVER_WINS'
      }
    });

    // Clear pending operations
    await prisma.syncOperation.deleteMany({
      where: {
        syncSession: {
          deviceId: deviceId,
          userId: user.id
        },
        status: 'IN_PROGRESS'
      }
    });

    logger.info(`Sync reset for user ${user.id} device ${deviceId}`);

    res.json({
      success: true,
      message: 'Sync session reset successfully',
      meta: {
        serverTime: new Date().toISOString(),
        deviceId: deviceId,
        userId: user.id
      }
    });

  } catch (error) {
    logger.error('Sync reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset sync session',
      code: 'SYNC_RESET_FAILED',
      details: error.message
    });
  }
}));

/**
 * @route GET /api/v1/mobile/sync/health
 * @desc Check sync service health
 */
router.get('/health', asyncHandler(async (req, res) => {
  const { user } = req;
  
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Get sync service statistics
    const totalSessions = await prisma.syncSession.count();
    const activeSessions = await prisma.syncSession.count({
      where: {
        lastSyncAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        totalSessions: totalSessions,
        activeSessions: activeSessions,
        features: {
          conflictResolution: true,
          batchSync: true,
          incrementalSync: true,
          offlineSupport: process.env.FEATURE_OFFLINE_MODE === 'true'
        }
      },
      meta: {
        serverTime: new Date().toISOString(),
        userId: user.id
      }
    });

  } catch (error) {
    logger.error('Sync health check error:', error);
    res.status(503).json({
      success: false,
      error: 'Sync service unhealthy',
      code: 'SYNC_SERVICE_UNHEALTHY',
      details: error.message
    });
  }
}));

// Helper function to resolve conflicts
async function resolveConflict(conflict, resolution, userId) {
  const { strategy, data } = resolution;
  const { entityType, entityId, operation } = conflict;

  switch (strategy) {
    case 'SERVER_WINS':
      // Keep server data, ignore client changes
      return {
        entityType,
        entityId,
        operation: 'RESOLVED',
        resolution: 'server_wins',
        data: conflict.serverData
      };

    case 'CLIENT_WINS':
      // Apply client changes, overwrite server
      const result = await syncService.processChange(userId, {
        ...conflict,
        operation: operation,
        data: data || conflict.data,
        forceUpdate: true
      });
      
      return {
        entityType,
        entityId,
        operation: 'RESOLVED',
        resolution: 'client_wins',
        data: result
      };

    case 'MERGE':
      // Merge server and client data
      const mergedData = mergeEntityData(conflict.serverData, data || conflict.data);
      const mergeResult = await syncService.processChange(userId, {
        ...conflict,
        operation: 'UPDATE',
        data: mergedData,
        forceUpdate: true
      });
      
      return {
        entityType,
        entityId,
        operation: 'RESOLVED',
        resolution: 'merged',
        data: mergeResult
      };

    default:
      throw new Error(`Unknown resolution strategy: ${strategy}`);
  }
}

// Helper function to merge entity data
function mergeEntityData(serverData, clientData) {
  // Simple merge strategy - can be enhanced based on entity type
  return {
    ...serverData,
    ...clientData,
    // Keep server metadata
    id: serverData.id,
    createdAt: serverData.createdAt,
    version: serverData.version + 1,
    updatedAt: new Date()
  };
}

module.exports = router;