require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticateDevice } = require('./middleware/mobileAuth');
const { deviceMiddleware } = require('./middleware/device');
const { syncMiddleware } = require('./middleware/sync');
const logger = require('./utils/logger');

// Import mobile-specific routes
const mobileAuthRoutes = require('./routes/mobile/auth');
const mobileCustomerRoutes = require('./routes/mobile/customers');
const mobileReservationRoutes = require('./routes/mobile/reservations');
const mobileMenuRoutes = require('./routes/mobile/menu');
const mobileOrderRoutes = require('./routes/mobile/orders');
const mobileNotificationRoutes = require('./routes/mobile/notifications');
const mobileAnalyticsRoutes = require('./routes/mobile/analytics');
const mobileSyncRoutes = require('./routes/mobile/sync');
const mobileConfigRoutes = require('./routes/mobile/config');

// Import services
// const { initializeDatabase } = require('../../backend-api/src/services/database');
const socketService = require('./services/socket');
const pushNotificationService = require('./services/pushNotification');
const syncService = require('./services/sync');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.WEBSOCKET_ORIGINS ? 
      process.env.WEBSOCKET_ORIGINS.split(',') : 
      ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3006;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware - mobile optimized
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    }
  }
}));

// CORS configuration - mobile app friendly
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, native apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Device-ID',
    'X-App-Version',
    'X-Platform',
    'X-Sync-Token'
  ]
};

app.use(cors(corsOptions));

// Rate limiting - higher limits for mobile apps
const mobileLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MOBILE_RATE_LIMIT_MAX_REQUESTS) || 500, // Higher limit for mobile
  message: {
    error: 'Too many requests from this device, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use device ID if available, fallback to IP
    return req.headers['x-device-id'] || req.ip;
  }
});

app.use('/api/', mobileLimiter);

// Body parsing middleware - higher limits for mobile uploads
app.use(compression());
app.use(express.json({ limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.UPLOAD_LIMIT || '10mb' }));

// Device tracking middleware
app.use(deviceMiddleware);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint - mobile specific
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RestaurantAI MDK Server',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    features: {
      websocket: process.env.WEBSOCKET_ENABLED === 'true',
      pushNotifications: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
      offlineSync: process.env.FEATURE_OFFLINE_MODE === 'true',
      realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES === 'true'
    }
  });
});

// API routes - mobile optimized
const apiPrefix = `/api/${process.env.API_VERSION || 'v1'}`;

// Public routes (no auth required)
app.use(`${apiPrefix}/mobile/auth`, mobileAuthRoutes);
app.use(`${apiPrefix}/mobile/config`, mobileConfigRoutes);

// Protected routes (require mobile auth)
app.use(`${apiPrefix}/mobile/customers`, authenticateDevice, mobileCustomerRoutes);
app.use(`${apiPrefix}/mobile/reservations`, authenticateDevice, mobileReservationRoutes);
app.use(`${apiPrefix}/mobile/menu`, mobileMenuRoutes); // Mixed access
app.use(`${apiPrefix}/mobile/orders`, authenticateDevice, mobileOrderRoutes);
app.use(`${apiPrefix}/mobile/notifications`, authenticateDevice, mobileNotificationRoutes);
app.use(`${apiPrefix}/mobile/analytics`, authenticateDevice, mobileAnalyticsRoutes);
app.use(`${apiPrefix}/mobile/sync`, authenticateDevice, syncMiddleware, mobileSyncRoutes);

// Mobile API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'RestaurantAI Mobile Development Kit (MDK)',
    version: process.env.API_VERSION || 'v1',
    description: 'Mobile-optimized API for restaurant management applications',
    features: [
      'Real-time updates via WebSocket',
      'Push notifications (Expo + FCM)',
      'Offline synchronization',
      'Mobile-optimized responses',
      'Image compression and optimization',
      'Background sync support'
    ],
    endpoints: {
      auth: `${apiPrefix}/mobile/auth`,
      config: `${apiPrefix}/mobile/config`,
      customers: `${apiPrefix}/mobile/customers`,
      reservations: `${apiPrefix}/mobile/reservations`,
      menu: `${apiPrefix}/mobile/menu`,
      orders: `${apiPrefix}/mobile/orders`,
      notifications: `${apiPrefix}/mobile/notifications`,
      analytics: `${apiPrefix}/mobile/analytics`,
      sync: `${apiPrefix}/mobile/sync`
    },
    websocket: {
      url: `ws://localhost:${PORT}`,
      events: ['reservation_update', 'order_update', 'notification', 'table_status']
    },
    documentation: 'https://docs.restaurantai.pl/mobile'
  });
});

// WebSocket connection handling
if (process.env.WEBSOCKET_ENABLED === 'true') {
  socketService.initialize(io);
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database connection
    // await initializeDatabase();
    logger.info('✅ Database connection skipped (demo mode)');

    // Initialize push notification service
    if (process.env.FEATURE_PUSH_NOTIFICATIONS === 'true') {
      await pushNotificationService.initialize();
      logger.info('✅ Push notification service initialized');
    }

    // Initialize sync service (temporarily disabled - requires additional DB tables)
    if (process.env.FEATURE_OFFLINE_MODE === 'true') {
      try {
        await syncService.initialize();
        logger.info('✅ Sync service initialized');
      } catch (error) {
        logger.warn('⚠️ Sync service initialization failed (missing DB tables) - continuing without sync features');
      }
    }

    // Start HTTP server with WebSocket support
    server.listen(PORT, () => {
      logger.info(`🚀 RestaurantAI MDK Server running on port ${PORT}`);
      logger.info(`📖 API documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket: ${process.env.WEBSOCKET_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      logger.info(`📱 Push Notifications: ${process.env.FEATURE_PUSH_NOTIFICATIONS === 'true' ? 'Enabled' : 'Disabled'}`);
      logger.info(`🔄 Offline Sync: ${process.env.FEATURE_OFFLINE_MODE === 'true' ? 'Enabled' : 'Disabled'}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start MDK server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };