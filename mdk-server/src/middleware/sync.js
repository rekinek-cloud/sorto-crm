const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Synchronization middleware for offline-first mobile apps
 * Handles conflict resolution and data versioning
 */
const syncMiddleware = async (req, res, next) => {
  try {
    const syncToken = req.headers['x-sync-token'];
    const lastSyncTime = req.headers['x-last-sync'];
    const deviceId = req.headers['x-device-id'];

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID required for sync operations.',
        code: 'DEVICE_ID_REQUIRED'
      });
    }

    // Find or create sync session
    let syncSession = await prisma.syncSession.findUnique({
      where: {
        deviceId_userId: {
          deviceId: deviceId,
          userId: req.user.id
        }
      }
    });

    if (!syncSession) {
      syncSession = await prisma.syncSession.create({
        data: {
          deviceId: deviceId,
          userId: req.user.id,
          lastSyncAt: new Date(0), // Epoch time for initial sync
          syncToken: generateSyncToken(),
          conflictResolutionStrategy: 'SERVER_WINS' // Default strategy
        }
      });
    }

    // Validate sync token for conflict detection
    if (syncToken && syncToken !== syncSession.syncToken) {
      return res.status(409).json({
        success: false,
        error: 'Sync conflict detected. Please resolve conflicts and retry.',
        code: 'SYNC_CONFLICT',
        serverSyncToken: syncSession.syncToken,
        clientSyncToken: syncToken
      });
    }

    // Add sync info to request
    req.sync = {
      session: syncSession,
      lastSyncTime: lastSyncTime ? new Date(lastSyncTime) : syncSession.lastSyncAt,
      deviceId: deviceId,
      syncToken: syncSession.syncToken
    };

    // Track sync operation
    await prisma.syncOperation.create({
      data: {
        syncSessionId: syncSession.id,
        operation: req.method,
        endpoint: req.path,
        timestamp: new Date(),
        status: 'IN_PROGRESS'
      }
    });

    next();
  } catch (error) {
    logger.error('Sync middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sync service error.',
      code: 'SYNC_SERVICE_ERROR'
    });
  }
};

/**
 * Middleware to handle data versioning for optimistic updates
 */
const versioningMiddleware = async (req, res, next) => {
  try {
    const entityVersion = req.headers['x-entity-version'];
    const entityId = req.params.id;
    const entityType = req.path.split('/')[3]; // Extract entity type from path

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!entityVersion) {
        return res.status(400).json({
          success: false,
          error: 'Entity version required for updates.',
          code: 'VERSION_REQUIRED'
        });
      }

      // Check if entity exists and version matches
      const entity = await getEntityByIdAndType(entityId, entityType);
      
      if (!entity) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found.',
          code: 'ENTITY_NOT_FOUND'
        });
      }

      if (entity.version !== parseInt(entityVersion)) {
        return res.status(409).json({
          success: false,
          error: 'Entity version conflict. Entity was modified by another client.',
          code: 'VERSION_CONFLICT',
          serverVersion: entity.version,
          clientVersion: parseInt(entityVersion),
          serverData: entity
        });
      }

      // Increment version for update
      req.body.version = entity.version + 1;
    }

    req.versioning = {
      entityType: entityType,
      entityId: entityId,
      currentVersion: entityVersion ? parseInt(entityVersion) : null
    };

    next();
  } catch (error) {
    logger.error('Versioning middleware error:', error);
    next(); // Continue without versioning if it fails
  }
};

/**
 * Generate unique sync token
 */
function generateSyncToken() {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get entity by ID and type (helper function)
 */
async function getEntityByIdAndType(id, type) {
  const entityMap = {
    'reservations': 'reservation',
    'orders': 'order',
    'customers': 'customer',
    'menu': 'menuItem'
  };

  const entityName = entityMap[type];
  if (!entityName || !id) return null;

  try {
    return await prisma[entityName].findUnique({
      where: { id: id }
    });
  } catch (error) {
    logger.error(`Error fetching ${entityName}:`, error);
    return null;
  }
}

/**
 * Middleware to track successful sync operations
 */
const trackSyncSuccess = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Update sync session after successful operation
    if (res.statusCode >= 200 && res.statusCode < 300 && req.sync) {
      updateSyncSession(req.sync.session.id, req.sync.syncToken)
        .catch(error => logger.error('Failed to update sync session:', error));
    }
    
    originalSend.call(this, data);
  };

  next();
};

/**
 * Update sync session after successful operation
 */
async function updateSyncSession(sessionId, syncToken) {
  try {
    await prisma.syncSession.update({
      where: { id: sessionId },
      data: {
        lastSyncAt: new Date(),
        syncToken: generateSyncToken() // Generate new token
      }
    });

    // Update sync operation status
    await prisma.syncOperation.updateMany({
      where: {
        syncSessionId: sessionId,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error updating sync session:', error);
  }
}

module.exports = {
  syncMiddleware,
  versioningMiddleware,
  trackSyncSuccess
};