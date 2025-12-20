const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');
const { optionalMobileAuth } = require('../../middleware/mobileAuth');
const logger = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/config
 * @desc Get mobile app configuration and feature flags
 */
router.get('/', optionalMobileAuth, asyncHandler(async (req, res) => {
  const { user } = req;
  const appVersion = req.headers['x-app-version'] || '1.0.0';
  const platform = req.headers['x-platform'] || 'unknown';

  // Base configuration for all users
  const baseConfig = {
    app: {
      name: 'RestaurantAI Mobile',
      version: process.env.API_VERSION || 'v1',
      minSupportedVersion: process.env.MIN_APP_VERSION || '1.0.0',
      latestVersion: process.env.LATEST_APP_VERSION || '1.0.0',
      updateRequired: isUpdateRequired(appVersion),
      updateUrl: getUpdateUrl(platform)
    },
    features: {
      // Core features (always enabled)
      authentication: true,
      reservations: true,
      menu: true,
      orders: true,
      
      // Premium features (depends on subscription)
      realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES === 'true',
      pushNotifications: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
      offlineMode: process.env.FEATURE_OFFLINE_MODE === 'true',
      backgroundSync: process.env.FEATURE_BACKGROUND_SYNC === 'true',
      imageCompression: process.env.FEATURE_IMAGE_COMPRESSION === 'true',
      analytics: false,
      advancedReporting: false,
      multiLocation: false
    },
    ui: {
      theme: {
        primaryColor: '#2196F3',
        secondaryColor: '#FFC107',
        errorColor: '#F44336',
        warningColor: '#FF9800',
        successColor: '#4CAF50',
        darkMode: true
      },
      layout: {
        tabBarPosition: 'bottom',
        navigationStyle: 'drawer',
        showFAB: true
      }
    },
    api: {
      baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3006}`,
      version: process.env.API_VERSION || 'v1',
      timeout: 30000,
      retryAttempts: 3,
      rateLimits: {
        requests: parseInt(process.env.MOBILE_RATE_LIMIT_MAX_REQUESTS) || 500,
        window: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000
      }
    },
    sync: {
      enabled: process.env.FEATURE_OFFLINE_MODE === 'true',
      batchSize: parseInt(process.env.SYNC_BATCH_SIZE) || 50,
      retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3,
      timeout: parseInt(process.env.SYNC_TIMEOUT) || 30000,
      intervals: {
        background: 300000, // 5 minutes
        foreground: 60000,  // 1 minute
        manual: 0
      }
    },
    notifications: {
      enabled: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
      channels: [
        {
          id: 'reservations',
          name: 'Reservations',
          description: 'Reservation confirmations and reminders',
          importance: 'high'
        },
        {
          id: 'orders',
          name: 'Orders',
          description: 'Order status updates',
          importance: 'high'
        },
        {
          id: 'promotions',
          name: 'Promotions',
          description: 'Special offers and promotions',
          importance: 'normal'
        },
        {
          id: 'general',
          name: 'General',
          description: 'General notifications',
          importance: 'normal'
        }
      ]
    },
    upload: {
      maxFileSize: process.env.UPLOAD_LIMIT || '10mb',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      imageCompression: {
        enabled: process.env.FEATURE_IMAGE_COMPRESSION === 'true',
        quality: parseInt(process.env.IMAGE_QUALITY) || 80,
        maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH) || 1200,
        maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT) || 1200
      }
    }
  };

  // User-specific configuration
  if (user) {
    const subscription = user.organization?.subscription;
    const isPremium = subscription && 
      subscription.status === 'ACTIVE' && 
      ['PREMIUM', 'ENTERPRISE'].includes(subscription.planType);

    // Enable premium features based on subscription
    if (isPremium) {
      baseConfig.features.analytics = true;
      baseConfig.features.advancedReporting = true;
      
      if (subscription.planType === 'ENTERPRISE') {
        baseConfig.features.multiLocation = true;
      }
    }

    // Add user-specific settings
    baseConfig.user = {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
      subscription: {
        planType: subscription?.planType || 'BASIC',
        status: subscription?.status || 'INACTIVE',
        features: subscription?.features || []
      },
      preferences: await getUserPreferences(user.id)
    };

    // Add organization settings
    if (user.organization) {
      baseConfig.organization = {
        id: user.organization.id,
        name: user.organization.name,
        settings: await getOrganizationSettings(user.organization.id)
      };
    }
  }

  // Platform-specific adjustments
  if (platform === 'ios') {
    baseConfig.features.biometricAuth = true;
    baseConfig.ui.layout.navigationStyle = 'tabs';
  } else if (platform === 'android') {
    baseConfig.features.biometricAuth = true;
    baseConfig.ui.layout.showFAB = true;
  }

  res.json({
    success: true,
    data: baseConfig,
    meta: {
      serverTime: new Date().toISOString(),
      configVersion: '1.0.0',
      platform: platform,
      appVersion: appVersion
    }
  });
}));

/**
 * @route GET /api/v1/mobile/config/features
 * @desc Get feature flags only
 */
router.get('/features', optionalMobileAuth, asyncHandler(async (req, res) => {
  const { user } = req;
  
  const features = {
    // Base features
    authentication: true,
    reservations: true,
    menu: true,
    orders: true,
    realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES === 'true',
    pushNotifications: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
    offlineMode: process.env.FEATURE_OFFLINE_MODE === 'true',
    backgroundSync: process.env.FEATURE_BACKGROUND_SYNC === 'true',
    imageCompression: process.env.FEATURE_IMAGE_COMPRESSION === 'true',
    
    // Premium features
    analytics: false,
    advancedReporting: false,
    multiLocation: false
  };

  // Enable premium features for premium users
  if (user?.isPremium) {
    features.analytics = true;
    features.advancedReporting = true;
    
    if (user.organization?.subscription?.planType === 'ENTERPRISE') {
      features.multiLocation = true;
    }
  }

  res.json({
    success: true,
    data: features
  });
}));

/**
 * @route POST /api/v1/mobile/config/preferences
 * @desc Update user preferences
 */
router.post('/preferences', asyncHandler(async (req, res) => {
  const { user } = req;
  const { preferences } = req.body;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Update user preferences
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {
      preferences: preferences,
      updatedAt: new Date()
    },
    create: {
      userId: user.id,
      preferences: preferences
    }
  });

  res.json({
    success: true,
    message: 'Preferences updated successfully'
  });
}));

/**
 * @route GET /api/v1/mobile/config/app-info
 * @desc Get app information for updates
 */
router.get('/app-info', asyncHandler(async (req, res) => {
  const platform = req.headers['x-platform'] || 'unknown';
  const currentVersion = req.headers['x-app-version'] || '1.0.0';

  const appInfo = {
    currentVersion: currentVersion,
    latestVersion: process.env.LATEST_APP_VERSION || '1.0.0',
    minSupportedVersion: process.env.MIN_APP_VERSION || '1.0.0',
    updateRequired: isUpdateRequired(currentVersion),
    updateAvailable: isUpdateAvailable(currentVersion),
    updateUrl: getUpdateUrl(platform),
    releaseNotes: getReleaseNotes(),
    features: getVersionFeatures()
  };

  res.json({
    success: true,
    data: appInfo
  });
}));

// Helper functions

function isUpdateRequired(currentVersion) {
  const minVersion = process.env.MIN_APP_VERSION || '1.0.0';
  return compareVersions(currentVersion, minVersion) < 0;
}

function isUpdateAvailable(currentVersion) {
  const latestVersion = process.env.LATEST_APP_VERSION || '1.0.0';
  return compareVersions(currentVersion, latestVersion) < 0;
}

function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }

  return 0;
}

function getUpdateUrl(platform) {
  switch (platform) {
    case 'ios':
      return process.env.IOS_APP_STORE_URL || 'https://apps.apple.com/app/restaurantai';
    case 'android':
      return process.env.ANDROID_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.restaurantai';
    default:
      return process.env.DEFAULT_DOWNLOAD_URL || 'https://restaurantai.com/download';
  }
}

function getReleaseNotes() {
  return [
    {
      version: '1.0.0',
      date: '2024-01-15',
      features: [
        'Initial release',
        'Reservation management',
        'Menu browsing',
        'Real-time updates'
      ]
    }
  ];
}

function getVersionFeatures() {
  return {
    '1.0.0': [
      'Basic reservation management',
      'Menu viewing',
      'Push notifications'
    ],
    '1.1.0': [
      'Offline mode',
      'Background sync',
      'Enhanced analytics'
    ]
  };
}

async function getUserPreferences(userId) {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: userId }
    });
    
    return preferences?.preferences || {
      notifications: {
        reservations: true,
        orders: true,
        promotions: false,
        general: true
      },
      ui: {
        darkMode: false,
        language: 'en'
      },
      sync: {
        autoSync: true,
        wifiOnly: false
      }
    };
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    return {};
  }
}

async function getOrganizationSettings(organizationId) {
  try {
    const settings = await prisma.organizationSettings.findUnique({
      where: { organizationId: organizationId }
    });
    
    return settings?.settings || {
      businessHours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '22:00', closed: false },
        sunday: { open: '09:00', close: '22:00', closed: true }
      },
      reservations: {
        advanceBookingDays: 30,
        minimumPartySize: 1,
        maximumPartySize: 20,
        defaultDuration: 120,
        allowOnlineBooking: true
      },
      notifications: {
        confirmationSMS: true,
        reminderSMS: true,
        emailNotifications: true
      }
    };
  } catch (error) {
    logger.error('Error getting organization settings:', error);
    return {};
  }
}

module.exports = router;