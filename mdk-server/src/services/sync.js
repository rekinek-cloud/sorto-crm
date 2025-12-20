const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class SyncService {
  constructor() {
    this.syncQueue = new Map(); // deviceId -> array of pending operations
    this.conflictResolutionStrategies = {
      SERVER_WINS: 'server_wins',
      CLIENT_WINS: 'client_wins',
      MERGE: 'merge',
      MANUAL: 'manual'
    };
  }

  async initialize() {
    try {
      // Clean up old sync sessions
      await this.cleanupOldSessions();
      
      // Initialize sync queues for active devices
      await this.initializeSyncQueues();
      
      logger.info('✅ Sync service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize sync service:', error);
      throw error;
    }
  }

  /**
   * Process pending sync operations for a device
   */
  async processDeviceSync(userId, deviceId, lastSyncTime = null) {
    try {
      const syncSession = await this.getSyncSession(userId, deviceId);
      const effectiveLastSync = lastSyncTime || syncSession.lastSyncAt;

      // Get all changes since last sync
      const changes = await this.getChangesSince(userId, effectiveLastSync);

      // Process each entity type
      const syncData = {
        reservations: await this.processReservationSync(userId, effectiveLastSync),
        orders: await this.processOrderSync(userId, effectiveLastSync),
        customers: await this.processCustomerSync(userId, effectiveLastSync),
        menu: await this.processMenuSync(userId, effectiveLastSync),
        notifications: await this.processNotificationSync(userId, effectiveLastSync),
        deletions: await this.getDeletionsSince(userId, effectiveLastSync)
      };

      // Update sync session
      await this.updateSyncSession(syncSession.id, {
        lastSyncAt: new Date(),
        syncToken: this.generateSyncToken()
      });

      return {
        success: true,
        data: syncData,
        syncToken: syncSession.syncToken,
        serverTime: new Date().toISOString(),
        hasMore: false // TODO: Implement pagination
      };

    } catch (error) {
      logger.error('Error processing device sync:', error);
      throw error;
    }
  }

  /**
   * Handle client changes and resolve conflicts
   */
  async processClientChanges(userId, deviceId, changes) {
    try {
      const results = {
        applied: [],
        conflicts: [],
        errors: []
      };

      for (const change of changes) {
        try {
          const result = await this.processChange(userId, change);
          
          if (result.conflict) {
            results.conflicts.push({
              ...change,
              conflict: result.conflict,
              serverData: result.serverData
            });
          } else {
            results.applied.push({
              ...change,
              serverId: result.serverId,
              serverVersion: result.serverVersion
            });
          }
        } catch (error) {
          results.errors.push({
            ...change,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error processing client changes:', error);
      throw error;
    }
  }

  /**
   * Process individual change record
   */
  async processChange(userId, change) {
    const { entityType, entityId, operation, data, version, clientId } = change;

    switch (operation) {
      case 'CREATE':
        return await this.processCreateOperation(userId, entityType, data, clientId);
      
      case 'UPDATE':
        return await this.processUpdateOperation(userId, entityType, entityId, data, version);
      
      case 'DELETE':
        return await this.processDeleteOperation(userId, entityType, entityId, version);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Process create operation
   */
  async processCreateOperation(userId, entityType, data, clientId) {
    try {
      const entityData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        clientId: clientId
      };

      let result;
      
      switch (entityType) {
        case 'reservation':
          result = await prisma.reservation.create({
            data: {
              ...entityData,
              userId: userId
            }
          });
          break;
          
        case 'order':
          result = await prisma.order.create({
            data: {
              ...entityData,
              userId: userId
            }
          });
          break;
          
        case 'customer':
          result = await prisma.customer.create({
            data: {
              ...entityData,
              organizationId: data.organizationId
            }
          });
          break;
          
        default:
          throw new Error(`Unsupported entity type for create: ${entityType}`);
      }

      return {
        success: true,
        serverId: result.id,
        serverVersion: result.version
      };

    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation - possible duplicate
        return {
          conflict: true,
          type: 'DUPLICATE_ENTITY',
          message: 'Entity already exists'
        };
      }
      throw error;
    }
  }

  /**
   * Process update operation with conflict detection
   */
  async processUpdateOperation(userId, entityType, entityId, data, clientVersion) {
    try {
      // First, get current server version
      const currentEntity = await this.getEntityByTypeAndId(entityType, entityId);
      
      if (!currentEntity) {
        return {
          conflict: true,
          type: 'ENTITY_NOT_FOUND',
          message: 'Entity not found on server'
        };
      }

      // Check for version conflict
      if (currentEntity.version !== clientVersion) {
        return {
          conflict: true,
          type: 'VERSION_MISMATCH',
          message: 'Entity was modified by another client',
          serverData: currentEntity
        };
      }

      // Apply update
      const updateData = {
        ...data,
        updatedAt: new Date(),
        version: currentEntity.version + 1
      };

      let result;
      
      switch (entityType) {
        case 'reservation':
          result = await prisma.reservation.update({
            where: { id: entityId },
            data: updateData
          });
          break;
          
        case 'order':
          result = await prisma.order.update({
            where: { id: entityId },
            data: updateData
          });
          break;
          
        case 'customer':
          result = await prisma.customer.update({
            where: { id: entityId },
            data: updateData
          });
          break;
          
        default:
          throw new Error(`Unsupported entity type for update: ${entityType}`);
      }

      return {
        success: true,
        serverId: result.id,
        serverVersion: result.version
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Process delete operation
   */
  async processDeleteOperation(userId, entityType, entityId, clientVersion) {
    try {
      const currentEntity = await this.getEntityByTypeAndId(entityType, entityId);
      
      if (!currentEntity) {
        // Entity already deleted
        return { success: true, alreadyDeleted: true };
      }

      // Check for version conflict
      if (currentEntity.version !== clientVersion) {
        return {
          conflict: true,
          type: 'VERSION_MISMATCH',
          message: 'Entity was modified by another client',
          serverData: currentEntity
        };
      }

      // Soft delete
      let result;
      
      switch (entityType) {
        case 'reservation':
          result = await prisma.reservation.update({
            where: { id: entityId },
            data: {
              deletedAt: new Date(),
              version: currentEntity.version + 1
            }
          });
          break;
          
        case 'order':
          result = await prisma.order.update({
            where: { id: entityId },
            data: {
              deletedAt: new Date(),
              version: currentEntity.version + 1
            }
          });
          break;
          
        case 'customer':
          result = await prisma.customer.update({
            where: { id: entityId },
            data: {
              deletedAt: new Date(),
              version: currentEntity.version + 1
            }
          });
          break;
          
        default:
          throw new Error(`Unsupported entity type for delete: ${entityType}`);
      }

      return {
        success: true,
        serverId: result.id,
        serverVersion: result.version
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get entity by type and ID
   */
  async getEntityByTypeAndId(entityType, entityId) {
    switch (entityType) {
      case 'reservation':
        return await prisma.reservation.findUnique({ where: { id: entityId } });
      case 'order':
        return await prisma.order.findUnique({ where: { id: entityId } });
      case 'customer':
        return await prisma.customer.findUnique({ where: { id: entityId } });
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Get all changes since last sync
   */
  async getChangesSince(userId, lastSyncTime) {
    const changes = [];
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return changes;
    }

    // Get changes for each entity type
    const entityTypes = ['reservation', 'order', 'customer'];
    
    for (const entityType of entityTypes) {
      const entityChanges = await this.getEntityChangesSince(
        entityType, 
        user.organizationId, 
        lastSyncTime
      );
      changes.push(...entityChanges);
    }

    return changes;
  }

  /**
   * Get changes for specific entity type
   */
  async getEntityChangesSince(entityType, organizationId, lastSyncTime) {
    const whereClause = {
      organizationId: organizationId,
      updatedAt: { gt: lastSyncTime }
    };

    let entities = [];
    
    switch (entityType) {
      case 'reservation':
        entities = await prisma.reservation.findMany({ where: whereClause });
        break;
      case 'order':
        entities = await prisma.order.findMany({ where: whereClause });
        break;
      case 'customer':
        entities = await prisma.customer.findMany({ where: whereClause });
        break;
    }

    return entities.map(entity => ({
      entityType,
      entityId: entity.id,
      operation: entity.deletedAt ? 'DELETE' : 'UPDATE',
      data: entity,
      version: entity.version,
      timestamp: entity.updatedAt
    }));
  }

  /**
   * Get sync session for user and device
   */
  async getSyncSession(userId, deviceId) {
    return await prisma.syncSession.findUnique({
      where: {
        deviceId_userId: {
          deviceId: deviceId,
          userId: userId
        }
      }
    });
  }

  /**
   * Update sync session
   */
  async updateSyncSession(sessionId, data) {
    return await prisma.syncSession.update({
      where: { id: sessionId },
      data: data
    });
  }

  /**
   * Generate unique sync token
   */
  generateSyncToken() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old sync sessions
   */
  async cleanupOldSessions() {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    await prisma.syncSession.deleteMany({
      where: {
        lastSyncAt: { lt: cutoffDate }
      }
    });
  }

  /**
   * Initialize sync queues for active devices
   */
  async initializeSyncQueues() {
    const activeSessions = await prisma.syncSession.findMany({
      where: {
        lastSyncAt: { 
          gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    for (const session of activeSessions) {
      this.syncQueue.set(session.deviceId, []);
    }
  }

  // Entity-specific sync methods
  async processReservationSync(userId, lastSyncTime) {
    // Implementation for reservation sync
    return [];
  }

  async processOrderSync(userId, lastSyncTime) {
    // Implementation for order sync
    return [];
  }

  async processCustomerSync(userId, lastSyncTime) {
    // Implementation for customer sync
    return [];
  }

  async processMenuSync(userId, lastSyncTime) {
    // Implementation for menu sync
    return [];
  }

  async processNotificationSync(userId, lastSyncTime) {
    // Implementation for notification sync
    return [];
  }

  async getDeletionsSince(userId, lastSyncTime) {
    // Implementation for getting deletions
    return [];
  }
}

module.exports = new SyncService();