const jwt = require('jsonwebtoken');

/**
 * Simplified mobile authentication middleware for demo
 * Compatible with generated authentication endpoints
 */
const authenticateDevice = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const deviceId = req.headers['x-device-id'];
    const appVersion = req.headers['x-app-version'];
    const platform = req.headers['x-platform'];
    
    // For public endpoints like login, continue without authentication
    if (!authHeader) {
      return next();
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
        code: 'INVALID_AUTH_FORMAT'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
      
      // Add user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        deviceId: deviceId,
        platform: platform,
        appVersion: appVersion
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: error.message
    });
  }
};

/**
 * Required authentication middleware for protected endpoints
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
  } catch (error) {
    console.error('RequireAuth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

module.exports = { authenticateDevice, requireAuth };