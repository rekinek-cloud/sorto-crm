const logger = require('../utils/logger');

/**
 * Device tracking and management middleware
 * Captures device information and user agent data
 */
const deviceMiddleware = (req, res, next) => {
  try {
    // Extract device information from headers
    const deviceInfo = {
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      platform: req.headers['x-platform'],
      osVersion: req.headers['x-os-version'],
      appBuild: req.headers['x-app-build'],
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      timestamp: new Date()
    };

    // Add device info to request object
    req.device = deviceInfo;

    // Log device access for analytics
    if (deviceInfo.deviceId) {
      logger.info(`Device access: ${deviceInfo.deviceId} - ${deviceInfo.platform} ${deviceInfo.appVersion}`);
    }

    next();
  } catch (error) {
    logger.error('Device middleware error:', error);
    next(); // Continue even if device tracking fails
  }
};

/**
 * Validate required device headers for certain endpoints
 */
const requireDeviceInfo = (req, res, next) => {
  const deviceId = req.headers['x-device-id'];
  const platform = req.headers['x-platform'];

  if (!deviceId || !platform) {
    return res.status(400).json({
      success: false,
      error: 'Device information required (X-Device-ID and X-Platform headers).',
      code: 'DEVICE_INFO_REQUIRED'
    });
  }

  next();
};

/**
 * Check if app version is supported
 */
const checkAppVersion = (req, res, next) => {
  const appVersion = req.headers['x-app-version'];
  const minSupportedVersion = process.env.MIN_APP_VERSION || '1.0.0';

  if (appVersion && isVersionOlder(appVersion, minSupportedVersion)) {
    return res.status(426).json({
      success: false,
      error: 'App version not supported. Please update your app.',
      code: 'APP_UPDATE_REQUIRED',
      minVersion: minSupportedVersion,
      currentVersion: appVersion
    });
  }

  next();
};

/**
 * Compare version strings (simple semantic versioning)
 */
function isVersionOlder(current, minimum) {
  const currentParts = current.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const minimumPart = minimumParts[i] || 0;

    if (currentPart < minimumPart) return true;
    if (currentPart > minimumPart) return false;
  }

  return false;
}

/**
 * Add mobile-specific response headers
 */
const addMobileHeaders = (req, res, next) => {
  // Add headers that help mobile apps
  res.set({
    'X-API-Version': process.env.API_VERSION || 'v1',
    'X-Server-Time': new Date().toISOString(),
    'X-Cache-Control': 'mobile-optimized',
  });

  // Add CORS headers for mobile apps
  if (req.device?.platform) {
    res.set('X-Platform-Optimized', req.device.platform);
  }

  next();
};

module.exports = {
  deviceMiddleware,
  requireDeviceInfo,
  checkAppVersion,
  addMobileHeaders
};