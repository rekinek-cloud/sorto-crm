const logger = require('../utils/logger');

/**
 * Mobile-optimized error handler
 * Provides detailed error information suitable for mobile apps
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error(`Error ${err.message}:`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    deviceId: req.headers['x-device-id'],
    userId: req.user?.id,
    stack: err.stack
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = {
      message,
      code: 'INVALID_ID_FORMAT'
    };
    return res.status(400).json({
      success: false,
      error: message,
      code: 'INVALID_ID_FORMAT'
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = {
      message,
      code: 'DUPLICATE_FIELD'
    };
    return res.status(400).json({
      success: false,
      error: message,
      code: 'DUPLICATE_FIELD'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      message: message.join(', '),
      code: 'VALIDATION_ERROR',
      details: message
    };
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'Unique constraint violation',
      code: 'UNIQUE_CONSTRAINT_ERROR',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
      code: 'RECORD_NOT_FOUND'
    });
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter
    });
  }

  // Network/timeout errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File size too large',
      code: 'FILE_SIZE_EXCEEDED',
      maxSize: process.env.UPLOAD_LIMIT || '10mb'
    });
  }

  // Mobile-specific errors
  if (err.code === 'SYNC_CONFLICT') {
    return res.status(409).json({
      success: false,
      error: 'Data synchronization conflict',
      code: 'SYNC_CONFLICT',
      resolution: 'Please refresh and try again'
    });
  }

  if (err.code === 'OFFLINE_MODE_ERROR') {
    return res.status(503).json({
      success: false,
      error: 'Operation not available in offline mode',
      code: 'OFFLINE_MODE_ERROR'
    });
  }

  // Default server error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle 404 errors for mobile apps
 */
const notFound = (req, res, next) => {
  const error = new Error(`Endpoint not found - ${req.originalUrl}`);
  res.status(404);
  res.json({
    success: false,
    error: error.message,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      auth: '/api/v1/mobile/auth',
      config: '/api/v1/mobile/config',
      customers: '/api/v1/mobile/customers',
      reservations: '/api/v1/mobile/reservations',
      menu: '/api/v1/mobile/menu',
      orders: '/api/v1/mobile/orders',
      notifications: '/api/v1/mobile/notifications',
      sync: '/api/v1/mobile/sync'
    }
  });
};

/**
 * Async error wrapper for mobile route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};