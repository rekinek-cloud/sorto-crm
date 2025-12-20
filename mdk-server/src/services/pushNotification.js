const { Expo } = require('expo-server-sdk');
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
    this.fcm = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize Firebase Admin if credentials are provided
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.fcm = admin.messaging();
        logger.info('✅ Firebase FCM service initialized');
      }

      // Validate Expo configuration
      if (process.env.EXPO_ACCESS_TOKEN) {
        this.expo.accessToken = process.env.EXPO_ACCESS_TOKEN;
        logger.info('✅ Expo push service initialized');
      }

      this.initialized = true;
      logger.info('✅ Push notification service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize push notification service:', error);
      throw error;
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendToUser(userId, notification) {
    try {
      const deviceSessions = await prisma.deviceSession.findMany({
        where: {
          userId: userId,
          isActive: true,
          pushToken: { not: null }
        }
      });

      if (deviceSessions.length === 0) {
        logger.warn(`No active devices found for user ${userId}`);
        return { success: false, error: 'No active devices' };
      }

      const results = await Promise.allSettled(
        deviceSessions.map(session => 
          this.sendToDevice(session.pushToken, notification, session.platform)
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      logger.info(`Push notification sent to ${successCount}/${deviceSessions.length} devices for user ${userId}`);

      return { success: true, sent: successCount, total: deviceSessions.length };
    } catch (error) {
      logger.error('Error sending push notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to specific device
   */
  async sendToDevice(pushToken, notification, platform = 'expo') {
    try {
      if (!this.initialized) {
        throw new Error('Push notification service not initialized');
      }

      let result;
      
      if (platform === 'expo' || Expo.isExpoPushToken(pushToken)) {
        result = await this.sendExpoNotification(pushToken, notification);
      } else {
        result = await this.sendFCMNotification(pushToken, notification);
      }

      // Log notification
      await this.logNotification(pushToken, notification, result);

      return result;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send Expo push notification
   */
  async sendExpoNotification(pushToken, notification) {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        priority: notification.priority || 'normal',
        ttl: notification.ttl || 3600,
        ...(notification.channelId && { channelId: notification.channelId })
      };

      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      
      if (ticket[0].status === 'error') {
        throw new Error(ticket[0].message);
      }

      return { success: true, ticket: ticket[0] };
    } catch (error) {
      logger.error('Expo notification error:', error);
      throw error;
    }
  }

  /**
   * Send FCM push notification
   */
  async sendFCMNotification(pushToken, notification) {
    try {
      if (!this.fcm) {
        throw new Error('FCM service not initialized');
      }

      const message = {
        token: pushToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data ? 
          Object.keys(notification.data).reduce((acc, key) => {
            acc[key] = String(notification.data[key]);
            return acc;
          }, {}) : {},
        android: {
          priority: notification.priority || 'normal',
          ttl: notification.ttl || 3600000
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              badge: notification.badge
            }
          }
        }
      };

      const result = await this.fcm.send(message);
      return { success: true, result };
    } catch (error) {
      logger.error('FCM notification error:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications) {
    try {
      const results = await Promise.allSettled(
        notifications.map(({ userId, notification }) => 
          this.sendToUser(userId, notification)
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      logger.info(`Bulk notifications: ${successCount}/${notifications.length} successful`);

      return { success: true, sent: successCount, total: notifications.length };
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to organization users
   */
  async sendToOrganization(organizationId, notification, excludeUserId = null) {
    try {
      const users = await prisma.user.findMany({
        where: {
          organizationId: organizationId,
          isActive: true,
          ...(excludeUserId && { id: { not: excludeUserId } })
        },
        select: { id: true }
      });

      const notifications = users.map(user => ({
        userId: user.id,
        notification
      }));

      return await this.sendBulkNotifications(notifications);
    } catch (error) {
      logger.error('Error sending notifications to organization:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log notification for analytics
   */
  async logNotification(pushToken, notification, result) {
    try {
      await prisma.pushNotificationLog.create({
        data: {
          pushToken: pushToken,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          success: result.success,
          error: result.success ? null : result.error,
          sentAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log notification:', error);
    }
  }

  /**
   * Handle receipt and update delivery status
   */
  async handleReceipts(receipts) {
    try {
      for (const receipt of receipts) {
        if (receipt.status === 'error') {
          logger.error('Push notification error:', receipt.message);
          
          // Handle token errors
          if (receipt.details?.error === 'DeviceNotRegistered') {
            await this.handleInvalidToken(receipt.id);
          }
        }
      }
    } catch (error) {
      logger.error('Error handling receipts:', error);
    }
  }

  /**
   * Handle invalid push tokens
   */
  async handleInvalidToken(pushToken) {
    try {
      await prisma.deviceSession.updateMany({
        where: { pushToken: pushToken },
        data: { pushToken: null }
      });
      
      logger.info(`Removed invalid push token: ${pushToken}`);
    } catch (error) {
      logger.error('Error handling invalid token:', error);
    }
  }

  /**
   * Get notification templates
   */
  getNotificationTemplates() {
    return {
      reservation: {
        confirmed: {
          title: 'Reservation Confirmed',
          body: 'Your reservation has been confirmed',
          channelId: 'reservations'
        },
        reminder: {
          title: 'Reservation Reminder',
          body: 'Your reservation is in 1 hour',
          channelId: 'reservations'
        },
        cancelled: {
          title: 'Reservation Cancelled',
          body: 'Your reservation has been cancelled',
          channelId: 'reservations'
        }
      },
      order: {
        confirmed: {
          title: 'Order Confirmed',
          body: 'Your order has been confirmed',
          channelId: 'orders'
        },
        ready: {
          title: 'Order Ready',
          body: 'Your order is ready for pickup',
          channelId: 'orders'
        },
        delivered: {
          title: 'Order Delivered',
          body: 'Your order has been delivered',
          channelId: 'orders'
        }
      },
      general: {
        welcome: {
          title: 'Welcome!',
          body: 'Thank you for joining us',
          channelId: 'general'
        },
        promotion: {
          title: 'Special Offer',
          body: 'Don\'t miss our latest promotion',
          channelId: 'promotions'
        }
      }
    };
  }
}

module.exports = new PushNotificationService();