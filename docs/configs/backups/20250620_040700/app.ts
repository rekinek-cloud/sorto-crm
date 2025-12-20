import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import expressWinston from 'express-winston';
import { connectDatabases, setupRowLevelSecurity } from './config/database';
import config from './config';
import logger, { morganStream } from './config/logger';
import { errorHandler, notFoundHandler } from './shared/middleware/error';
import { generalRateLimit } from './shared/middleware/rateLimit';
import { scheduledTasksService } from './services/scheduledTasks';

// Import routes
import authRoutes from './modules/auth/routes';
import organizationRoutes from './modules/organizations/routes';
import tasksRoutes from './routes/tasks';
import projectsRoutes from './routes/projects';
import contextsRoutes from './routes/contexts';
import companiesRoutes from './routes/companies';
import contactsRoutes from './routes/contacts';
import dealsRoutes from './routes/deals';
import streamsRoutes from './routes/streams';
import smartRoutes from './routes/smart';
import communicationRoutes from './routes/communication';
import gtdRoutes from './routes/gtd';
import analysisRoutes from './routes/analysis';
import dashboardRoutes from './routes/dashboard';
// import aiRoutes from './routes/ai';
import knowledgeRoutes from './routes/knowledge';
import aiConfigRoutes from './routes/aiConfig';
import areasRoutes from './routes/areas';
import habitsRoutes from './routes/habits';
import meetingsRoutes from './routes/meetings';
import delegatedRoutes from './routes/delegated';
import recurringRoutes from './routes/recurring';
import tagsRoutes from './routes/tags';
import timelineRoutes from './routes/timeline';
import errorsRoutes from './routes/errors';
import productsRoutes from './routes/products';
import servicesRoutes from './routes/services';
import offersRoutes from './routes/offers';
import invoicesRoutes from './routes/invoices';
import bugReportsRoutes from './routes/bugReports';
// import filesRoutes from './routes/files';
import pipelineAnalyticsRoutes from './routes/pipelineAnalytics';

const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // For development with hot reload
}));

/**
 * CORS Configuration
 */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  logger.info(`CORS Debug: Origin=${origin}, Allowed=${JSON.stringify(config.CORS_ORIGINS)}`);
  next();
});

app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * General Middleware
 */
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON format in request body',
      code: 'INVALID_JSON',
      message: 'Please check your request body for proper JSON formatting'
    });
  }
  next(error);
});

/**
 * Rate Limiting
 */
app.use(generalRateLimit);

/**
 * Logging Middleware
 */
if (!config.IS_TEST) {
  app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: false,
    ignoreRoute: (req) => {
      // Ignore health check and static routes
      return req.url === '/health' || req.url.startsWith('/static');
    },
  }));
}

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
  });
});

/**
 * API Routes
 */
const apiRouter = express.Router();

// API versioning
app.use('/api/v1', apiRouter);

// Route modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/organizations', organizationRoutes);
apiRouter.use('/tasks', tasksRoutes);
apiRouter.use('/projects', projectsRoutes);
apiRouter.use('/contexts', contextsRoutes);
apiRouter.use('/companies', companiesRoutes);
apiRouter.use('/contacts', contactsRoutes);
apiRouter.use('/deals', dealsRoutes);
apiRouter.use('/streams', streamsRoutes);
apiRouter.use('/smart', smartRoutes);
apiRouter.use('/communication', communicationRoutes);
apiRouter.use('/gtd', gtdRoutes);
apiRouter.use('/analysis', analysisRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
// apiRouter.use('/ai', aiRoutes);
apiRouter.use('/knowledge', knowledgeRoutes);
apiRouter.use('/admin/ai-config', aiConfigRoutes);
apiRouter.use('/areas', areasRoutes);
apiRouter.use('/habits', habitsRoutes);
apiRouter.use('/meetings', meetingsRoutes);
apiRouter.use('/delegated', delegatedRoutes);
apiRouter.use('/recurring-tasks', recurringRoutes);
apiRouter.use('/tags', tagsRoutes);
apiRouter.use('/timeline', timelineRoutes);
apiRouter.use('/errors', errorsRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/offers', offersRoutes);
apiRouter.use('/invoices', invoicesRoutes);
apiRouter.use('/bug-reports', bugReportsRoutes);
// apiRouter.use('/files', filesRoutes);
apiRouter.use('/pipeline-analytics', pipelineAnalyticsRoutes);

// Temporary welcome route for development
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'CRM-GTD SaaS API v1',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    documentation: '/api/v1/docs',
  });
});

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Graceful Shutdown
 */
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop scheduled tasks
  scheduledTasksService.stopAll();
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDatabases();
    
    // Setup Row Level Security (disabled in development to avoid postgres type issues)
    if (config.IS_PRODUCTION) {
      try {
        await setupRowLevelSecurity();
      } catch (error) {
        logger.warn('RLS setup failed:', error);
      }
    }

    // Start scheduled tasks
    scheduledTasksService.startAll();

    // Start HTTP server - bind to 0.0.0.0 for network access
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Local: http://localhost:${config.PORT}/health`);
      logger.info(`🌐 Network: http://YOUR_IP:${config.PORT}/health`);
      logger.info(`📚 API docs: http://localhost:${config.PORT}/api/v1`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;