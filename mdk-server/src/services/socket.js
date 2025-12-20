const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set of socketIds
    this.userSockets = new Map(); // socketId -> userId
  }

  initialize(io) {
    this.io = io;
    this.setupSocketHandlers();
    logger.info('✅ WebSocket service initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          await this.authenticateSocket(socket, data);
        } catch (error) {
          logger.error('Socket authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle join organization room
      socket.on('join_organization', async (data) => {
        try {
          await this.joinOrganizationRoom(socket, data);
        } catch (error) {
          logger.error('Join organization error:', error);
          socket.emit('error', { message: 'Failed to join organization room' });
        }
      });

      // Handle join table room (for staff)
      socket.on('join_table', async (data) => {
        try {
          await this.joinTableRoom(socket, data);
        } catch (error) {
          logger.error('Join table error:', error);
          socket.emit('error', { message: 'Failed to join table room' });
        }
      });

      // Handle real-time typing indicators
      socket.on('typing_start', (data) => {
        this.handleTyping(socket, data, true);
      });

      socket.on('typing_stop', (data) => {
        this.handleTyping(socket, data, false);
      });

      // Handle user status updates
      socket.on('status_update', async (data) => {
        try {
          await this.handleStatusUpdate(socket, data);
        } catch (error) {
          logger.error('Status update error:', error);
        }
      });

      // Handle location updates (for delivery)
      socket.on('location_update', async (data) => {
        try {
          await this.handleLocationUpdate(socket, data);
        } catch (error) {
          logger.error('Location update error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async authenticateSocket(socket, data) {
    const { token, deviceId } = data;

    if (!token) {
      throw new Error('Token required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true
      }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Store user info in socket
    socket.userId = user.id;
    socket.organizationId = user.organizationId;
    socket.userRole = user.role;
    socket.deviceId = deviceId;

    // Track connected user
    if (!this.connectedUsers.has(user.id)) {
      this.connectedUsers.set(user.id, new Set());
    }
    this.connectedUsers.get(user.id).add(socket.id);
    this.userSockets.set(socket.id, user.id);

    // Join user's personal room
    socket.join(`user_${user.id}`);
    
    // Join organization room if exists
    if (user.organizationId) {
      socket.join(`org_${user.organizationId}`);
    }

    // Update user online status
    await this.updateUserOnlineStatus(user.id, true);

    socket.emit('authenticated', {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role
    });

    logger.info(`Socket authenticated: ${user.email} (${socket.id})`);
  }

  async joinOrganizationRoom(socket, data) {
    const { organizationId } = data;

    if (!socket.userId || !socket.organizationId) {
      throw new Error('Socket not authenticated');
    }

    // Verify user belongs to organization
    if (socket.organizationId !== organizationId) {
      throw new Error('Not authorized for this organization');
    }

    socket.join(`org_${organizationId}`);
    socket.emit('joined_organization', { organizationId });

    logger.info(`User ${socket.userId} joined organization room: ${organizationId}`);
  }

  async joinTableRoom(socket, data) {
    const { tableId } = data;

    if (!socket.userId || !socket.organizationId) {
      throw new Error('Socket not authenticated');
    }

    // Verify table belongs to user's organization
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        organizationId: socket.organizationId
      }
    });

    if (!table) {
      throw new Error('Table not found or not authorized');
    }

    socket.join(`table_${tableId}`);
    socket.emit('joined_table', { tableId });

    logger.info(`User ${socket.userId} joined table room: ${tableId}`);
  }

  handleTyping(socket, data, isTyping) {
    if (!socket.userId) return;

    const { roomId, context } = data;
    
    socket.to(roomId).emit('typing_indicator', {
      userId: socket.userId,
      isTyping: isTyping,
      context: context
    });
  }

  async handleStatusUpdate(socket, data) {
    if (!socket.userId) return;

    const { status, metadata } = data;
    
    // Update user status in database
    await prisma.user.update({
      where: { id: socket.userId },
      data: {
        status: status,
        lastActiveAt: new Date()
      }
    });

    // Broadcast status update to organization
    if (socket.organizationId) {
      socket.to(`org_${socket.organizationId}`).emit('user_status_update', {
        userId: socket.userId,
        status: status,
        metadata: metadata
      });
    }
  }

  async handleLocationUpdate(socket, data) {
    if (!socket.userId) return;

    const { latitude, longitude, orderId } = data;

    // Update location in database if needed
    if (orderId) {
      await prisma.deliveryTracking.upsert({
        where: { orderId: orderId },
        update: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastUpdatedAt: new Date()
        },
        create: {
          orderId: orderId,
          deliveryPersonId: socket.userId,
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastUpdatedAt: new Date()
        }
      });

      // Emit location update to interested parties
      this.io.to(`order_${orderId}`).emit('delivery_location_update', {
        orderId: orderId,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date()
      });
    }
  }

  handleDisconnect(socket) {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      // Remove socket from user's set
      const userSocketSet = this.connectedUsers.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        
        // If no more sockets for this user, mark as offline
        if (userSocketSet.size === 0) {
          this.connectedUsers.delete(userId);
          this.updateUserOnlineStatus(userId, false);
        }
      }
      
      this.userSockets.delete(socket.id);
    }

    logger.info(`Client disconnected: ${socket.id}`);
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline: isOnline,
          lastActiveAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update user online status:', error);
    }
  }

  // Public methods for emitting events

  /**
   * Send real-time notification to specific user
   */
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Send real-time notification to organization
   */
  emitToOrganization(organizationId, event, data, excludeUserId = null) {
    if (this.io) {
      const socket = this.io.to(`org_${organizationId}`);
      
      if (excludeUserId) {
        socket.except(`user_${excludeUserId}`);
      }
      
      socket.emit(event, data);
    }
  }

  /**
   * Send real-time notification to table
   */
  emitToTable(tableId, event, data) {
    if (this.io) {
      this.io.to(`table_${tableId}`).emit(event, data);
    }
  }

  /**
   * Send real-time notification to order (for delivery tracking)
   */
  emitToOrder(orderId, event, data) {
    if (this.io) {
      this.io.to(`order_${orderId}`).emit(event, data);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get user's connected sockets count
   */
  getUserSocketsCount(userId) {
    const userSockets = this.connectedUsers.get(userId);
    return userSockets ? userSockets.size : 0;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = new SocketService();