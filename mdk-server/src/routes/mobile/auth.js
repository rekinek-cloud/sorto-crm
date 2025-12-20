const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireDeviceInfo } = require('../../middleware/device');
const logger = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route POST /api/v1/mobile/auth/login
 * @desc Mobile app login with device registration
 */
router.post('/login', requireDeviceInfo, asyncHandler(async (req, res) => {
  const { email, password, biometricId, pushToken } = req.body;
  const { deviceId, platform, appVersion } = req.device;

  // Validate input
  if (!email || (!password && !biometricId)) {
    return res.status(400).json({
      success: false,
      error: 'Email and password or biometric ID required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      organization: {
        include: {
          subscription: true
        }
      }
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
  }

  // Verify password or biometric
  let isValid = false;
  if (password) {
    isValid = await bcrypt.compare(password, user.password);
  } else if (biometricId) {
    // Verify biometric ID against stored hash
    const deviceSession = await prisma.deviceSession.findUnique({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId: deviceId
        }
      }
    });
    
    if (deviceSession && deviceSession.biometricHash) {
      isValid = await bcrypt.compare(biometricId, deviceSession.biometricHash);
    }
  }

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      deviceId: deviceId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, deviceId: deviceId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Create or update device session
  await prisma.deviceSession.upsert({
    where: {
      userId_deviceId: {
        userId: user.id,
        deviceId: deviceId
      }
    },
    update: {
      platform: platform,
      appVersion: appVersion,
      lastActiveAt: new Date(),
      isActive: true,
      pushToken: pushToken,
      refreshToken: refreshToken
    },
    create: {
      userId: user.id,
      deviceId: deviceId,
      platform: platform,
      appVersion: appVersion,
      lastActiveAt: new Date(),
      isActive: true,
      pushToken: pushToken,
      refreshToken: refreshToken
    }
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  logger.info(`Mobile login successful: ${user.email} on ${platform} device ${deviceId}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          planType: user.organization.subscription?.planType || 'BASIC'
        }
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      device: {
        id: deviceId,
        platform: platform,
        registered: true
      }
    }
  });
}));

/**
 * @route POST /api/v1/mobile/auth/register
 * @desc Mobile app user registration
 */
router.post('/register', requireDeviceInfo, asyncHandler(async (req, res) => {
  const { email, password, name, organizationName, pushToken } = req.body;
  const { deviceId, platform, appVersion } = req.device;

  // Validate input
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and name are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email',
      code: 'USER_EXISTS'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create organization if provided
  let organization = null;
  if (organizationName) {
    organization = await prisma.organization.create({
      data: {
        name: organizationName,
        planType: 'BASIC',
        isActive: true
      }
    });
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name,
      role: organization ? 'OWNER' : 'STAFF',
      organizationId: organization?.id,
      isActive: true
    },
    include: {
      organization: true
    }
  });

  // Generate tokens
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      deviceId: deviceId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, deviceId: deviceId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Create device session
  await prisma.deviceSession.create({
    data: {
      userId: user.id,
      deviceId: deviceId,
      platform: platform,
      appVersion: appVersion,
      lastActiveAt: new Date(),
      isActive: true,
      pushToken: pushToken,
      refreshToken: refreshToken
    }
  });

  logger.info(`Mobile registration successful: ${user.email} on ${platform}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      device: {
        id: deviceId,
        platform: platform,
        registered: true
      }
    }
  });
}));

/**
 * @route POST /api/v1/mobile/auth/refresh
 * @desc Refresh access token
 */
router.post('/refresh', requireDeviceInfo, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const { deviceId } = req.device;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token required',
      code: 'REFRESH_TOKEN_REQUIRED'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Verify device session
    const deviceSession = await prisma.deviceSession.findUnique({
      where: {
        userId_deviceId: {
          userId: decoded.userId,
          deviceId: deviceId
        }
      },
      include: {
        user: {
          include: {
            organization: {
              include: {
                subscription: true
              }
            }
          }
        }
      }
    });

    if (!deviceSession || !deviceSession.isActive || deviceSession.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = deviceSession.user;

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        deviceId: deviceId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last active time
    await prisma.deviceSession.update({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId: deviceId
        }
      },
      data: {
        lastActiveAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
}));

/**
 * @route POST /api/v1/mobile/auth/logout
 * @desc Mobile app logout
 */
router.post('/logout', requireDeviceInfo, asyncHandler(async (req, res) => {
  const { deviceId } = req.device;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Deactivate device session
      await prisma.deviceSession.updateMany({
        where: {
          userId: decoded.userId,
          deviceId: deviceId
        },
        data: {
          isActive: false,
          refreshToken: null,
          pushToken: null
        }
      });

      logger.info(`Mobile logout: user ${decoded.userId} on device ${deviceId}`);
    } catch (error) {
      // Token might be expired, continue with logout
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * @route POST /api/v1/mobile/auth/biometric/setup
 * @desc Setup biometric authentication
 */
router.post('/biometric/setup', requireDeviceInfo, asyncHandler(async (req, res) => {
  const { biometricId } = req.body;
  const { deviceId } = req.device;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token || !biometricId) {
    return res.status(400).json({
      success: false,
      error: 'Authentication token and biometric ID required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Hash biometric ID
  const biometricHash = await bcrypt.hash(biometricId, 12);

  // Update device session with biometric hash
  await prisma.deviceSession.update({
    where: {
      userId_deviceId: {
        userId: decoded.userId,
        deviceId: deviceId
      }
    },
    data: {
      biometricHash: biometricHash,
      biometricEnabled: true
    }
  });

  res.json({
    success: true,
    message: 'Biometric authentication setup successfully'
  });
}));

module.exports = router;