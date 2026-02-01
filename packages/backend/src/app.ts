import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import expressWinston from 'express-winston';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { connectDatabases, setupRowLevelSecurity } from './config/database';
import config from './config';
import logger, { morganStream } from './config/logger';
import {
  createTerminalSession,
  handleTerminalInput,
  resizeTerminal,
  killTerminalSession,
} from './services/terminalService';
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
import gtdStreamsRoutes from './routes/gtdStreams';
import analysisRoutes from './routes/analysis';
import calendarRoutes from './routes/calendar';

// STREAMS Migration - nowe routery
import sourceRoutes from './routes/source';
import streamsMapRoutes from './routes/streamsMap';
import goalsRoutes from './routes/goals';
import dayPlannerRoutes from './routes/dayPlanner';
import smartMailboxesRoutes from './routes/smartMailboxes';
import preciseGoalsRoutes from './routes/preciseGoals';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import aiAssistantRoutes from './routes/aiAssistant';
import knowledgeRoutes from './routes/knowledge';
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
import aiConfigRoutes from './routes/aiConfig';
import aiPromptsRoutes from './routes/aiPrompts';
import aiKnowledgeRoutes from './routes/aiKnowledge';
import vectorSearchRoutes from './routes/vectorSearch';
import flowRoutes from './routes/flow';
import flowConversationRoutes from './routes/flowConversation';
import userHierarchyRoutes from './routes/userHierarchy';
import internalRoutes from './routes/internal';
import aiInsightsRoutes from './routes/aiInsights';
import usersRoutes from './routes/users';
import industriesRoutes from './routes/industries';
import devHubRoutes from './routes/devHub';
import infrastructureRoutes from './routes/infrastructure';
import aiSyncRoutes from './routes/aiSync';
import codingCenterRoutes from './routes/codingCenter';
import aiChatRoutes from './routes/aiChat';
import ragRoutes from './routes/rag';
import geminiRoutes from './routes/gemini';
import unifiedRulesRoutes from './routes/unifiedRules';
import searchRoutes from './routes/search';
// TODO: Fix import issues in these routes
// import customFieldsRoutes from './routes/customFields';
// import brandingRoutes from './routes/branding';
// import emailAccountsRoutes from './routes/emailAccounts';
// import autoRepliesRoutes from './routes/autoReplies';
// import aiV2Routes from './routes/aiV2';
// import pipelineAnalyticsRoutes from './routes/pipelineAnalytics';
// import universalRulesRoutes from './routes/universalRules';
// import graphRoutes from './routes/graph';
// import realVectorSearchRoutes from './routes/realVectorSearch';
// import modernEmailRoutes from './routes/modernEmail';
// import voiceSimpleRoutes from './routes/voice-simple';
// import bugReportsRoutes from './routes/bugReports';
import aiRulesRoutes from './routes/aiRules';
// import filesRoutes from './routes/files';
import weeklyReviewRoutes from './routes/weeklyReview';

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
apiRouter.use('/gtd-streams', gtdStreamsRoutes);
apiRouter.use('/analysis', analysisRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/ai-assistant', aiAssistantRoutes);  // AI Human-in-the-Loop (spec.md)
apiRouter.use('/knowledge', knowledgeRoutes);
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
apiRouter.use('/calendar', calendarRoutes);
apiRouter.use('/admin/ai-config', aiConfigRoutes);
apiRouter.use('/ai/prompts', aiPromptsRoutes);
apiRouter.use('/ai-knowledge', aiKnowledgeRoutes);  // AI Knowledge Chat
apiRouter.use('/ai-insights', aiInsightsRoutes);    // AI Insights dla Dashboard
apiRouter.use('/vector-search', vectorSearchRoutes);
apiRouter.use('/flow', flowRoutes);  // Flow Engine - GTD AI Processing
apiRouter.use('/flow/conversation', flowConversationRoutes);  // Flow Conversation - Dialogowe przetwarzanie
apiRouter.use('/user-hierarchy', userHierarchyRoutes);  // Zarządzanie użytkownikami w organizacji
apiRouter.use('/internal', internalRoutes);  // Internal API dla service-to-service (RAG)
apiRouter.use('/users', usersRoutes);  // Zarządzanie użytkownikami
apiRouter.use('/industries', industriesRoutes);  // Industry templates
apiRouter.use('/dev-hub', devHubRoutes);  // Dev Hub - zarządzanie kontenerami
apiRouter.use('/infrastructure', infrastructureRoutes);  // Infrastructure Dashboard
apiRouter.use('/ai-sync', aiSyncRoutes);  // AI Conversations Sync (ChatGPT/Claude/DeepSeek)
apiRouter.use('/coding-center', codingCenterRoutes);  // Coding Center - projekty i narzędzia
apiRouter.use('/ai-chat', aiChatRoutes);  // AI Chat - Qwen API (unlimited)
apiRouter.use('/rag', ragRoutes);  // RAG - Retrieval-Augmented Generation
apiRouter.use('/gemini', geminiRoutes);  // Gemini - Vision, Caching, 1M context
apiRouter.use('/unified-rules', unifiedRulesRoutes);  // Unified Rules - zunifikowany system reguł
apiRouter.use('/search', searchRoutes);  // Search - wyszukiwanie
// TODO: Fix import issues in these routes
// apiRouter.use('/custom-fields', customFieldsRoutes);  // Custom Fields - pola niestandardowe
// apiRouter.use('/branding', brandingRoutes);  // Branding - logo i kolory
// apiRouter.use('/email-accounts', emailAccountsRoutes);  // Email Accounts - IMAP/SMTP
// apiRouter.use('/auto-replies', autoRepliesRoutes);  // Auto Replies - automatyczne odpowiedzi
// apiRouter.use('/ai-v2', aiV2Routes);  // AI V2 - providers & models
// apiRouter.use('/pipeline-analytics', pipelineAnalyticsRoutes);  // Pipeline Analytics
// apiRouter.use('/universal-rules', universalRulesRoutes);  // Universal Rules
// apiRouter.use('/graph', graphRoutes);  // Graph - relacje między encjami
// apiRouter.use('/real-vector-search', realVectorSearchRoutes);  // Real Vector Search - semantyczne
// apiRouter.use('/modern-email', modernEmailRoutes);  // Modern Email - wysyłanie
// apiRouter.use('/voice', voiceSimpleRoutes);  // Voice TTS - synteza mowy
// apiRouter.use('/admin/bug-reports', bugReportsRoutes);  // Bug Reports
apiRouter.use('/ai-rules', aiRulesRoutes);  // AI Rules
// apiRouter.use('/files', filesRoutes);  // Files - zarządzanie plikami
apiRouter.use('/weekly-review', weeklyReviewRoutes);  // Weekly Review
apiRouter.use('/weekly-reviews', weeklyReviewRoutes);  // Weekly Review (plural alias)

// STREAMS Migration - nowe endpointy
apiRouter.use('/source', sourceRoutes);           // Źródło (ex gtdInbox)
apiRouter.use('/streams-map', streamsMapRoutes);  // Mapa strumieni (ex gtdMapViews)
apiRouter.use('/horizons', goalsRoutes);          // GTD Horizons (legacy) - przeniesione z /goals
apiRouter.use('/goals', preciseGoalsRoutes);      // Cele Precyzyjne (RZUT) - główny endpoint
apiRouter.use('/precise-goals', preciseGoalsRoutes); // Alias dla /goals
apiRouter.use('/day-planner', dayPlannerRoutes);  // Day Planner (ex smartDayPlanner)
apiRouter.use('/mailboxes', smartMailboxesRoutes);     // Skrzynki (ex smartMailboxes)
apiRouter.use('/smart-mailboxes', smartMailboxesRoutes); // Smart Mailboxes

// Aliasy dla kompatybilności wstecznej (deprecated)
apiRouter.use('/gtdinbox', sourceRoutes);         // deprecated -> use /source
apiRouter.use('/gtdmapviews', streamsMapRoutes);  // deprecated -> use /streams-map
apiRouter.use('/gtdhorizons', goalsRoutes);       // deprecated -> use /horizons
apiRouter.use('/smartdayplanner', dayPlannerRoutes); // deprecated -> use /day-planner
apiRouter.use('/smartmailboxes', smartMailboxesRoutes);   // deprecated -> use /mailboxes

// Temporary welcome route for development
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'streams.work API v1',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    documentation: '/api/v1/docs',
    methodology: 'SORTO STREAMS',
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

    // Create HTTP server
    const server = createServer(app);

    // Setup WebSocket server for terminal
    const wss = new WebSocketServer({ server, path: '/ws/terminal' });

    wss.on('connection', (ws: WebSocket, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const projectPath = url.searchParams.get('path') || '/home/dev/apps';
      const sessionId = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.info(`Terminal WebSocket connected: ${sessionId} -> ${projectPath}`);

      createTerminalSession(sessionId, ws, projectPath);

      ws.on('message', (message: Buffer) => {
        try {
          const msg = JSON.parse(message.toString());
          if (msg.type === 'input') {
            handleTerminalInput(sessionId, msg.data);
          } else if (msg.type === 'resize') {
            resizeTerminal(sessionId, msg.cols, msg.rows);
          }
        } catch (e) {
          // Raw input (for backwards compatibility)
          handleTerminalInput(sessionId, message.toString());
        }
      });

      ws.on('close', () => {
        logger.info(`Terminal WebSocket closed: ${sessionId}`);
        killTerminalSession(sessionId);
      });

      ws.on('error', (error) => {
        logger.error(`Terminal WebSocket error: ${sessionId}`, error);
        killTerminalSession(sessionId);
      });
    });

    // Start HTTP server - bind to 0.0.0.0 for network access
    server.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Local: http://localhost:${config.PORT}/health`);
      logger.info(`🌐 Network: http://YOUR_IP:${config.PORT}/health`);
      logger.info(`📚 API docs: http://localhost:${config.PORT}/api/v1`);
      logger.info(`🖥️  Terminal WebSocket: ws://localhost:${config.PORT}/ws/terminal`);
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
