import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { PrismaClient } from '@prisma/client';
import {
  AiConversationsService,
  SyncOrchestratorService,
} from '../modules/ai-conversations-sync/services';
import { AiSourceType, SyncStatusType } from '../modules/ai-conversations-sync/types';

const router = Router();
const prisma = new PrismaClient();

// Services
const conversationsService = new AiConversationsService(prisma);
const syncOrchestrator = new SyncOrchestratorService(prisma);

// Validation schemas
const syncSchema = z.object({
  source: z.enum(['CHATGPT', 'CLAUDE', 'DEEPSEEK']),
  jsonContent: z.string().min(1, 'JSON content is required'),
  indexAfterImport: z.boolean().optional().default(false),
  createStreams: z.boolean().optional().default(true),
});

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(100).optional().default(10),
  appName: z.string().optional(),
  source: z.enum(['CHATGPT', 'CLAUDE', 'DEEPSEEK']).optional(),
});

const listSchema = z.object({
  source: z.enum(['CHATGPT', 'CLAUDE', 'DEEPSEEK']).optional(),
  appName: z.string().optional(),
  streamId: z.string().optional(),
  isIndexed: z.boolean().optional(),
  skip: z.number().min(0).optional().default(0),
  take: z.number().min(1).max(100).optional().default(50),
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * POST /api/v1/ai-sync/import
 * Import conversations from JSON file
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { source, jsonContent, indexAfterImport, createStreams } = syncSchema.parse(req.body);
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const result = await syncOrchestrator.syncFromJson(
      organizationId,
      userId,
      source as AiSourceType,
      jsonContent,
      {
        indexAfterImport,
        createStreams,
      }
    );

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('AI Sync import error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
});

/**
 * POST /api/v1/ai-sync/search
 * Search conversations using vector similarity
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit, appName, source } = searchSchema.parse(req.body);
    const organizationId = req.user.organizationId;

    const results = await conversationsService.searchConversations(organizationId, query, {
      limit,
      appName,
      source: source as AiSourceType | undefined,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('AI Sync search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/conversations
 * List conversations
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const params = listSchema.parse({
      source: req.query.source,
      appName: req.query.appName,
      streamId: req.query.streamId,
      isIndexed: req.query.isIndexed === 'true' ? true : req.query.isIndexed === 'false' ? false : undefined,
      skip: req.query.skip ? Number(req.query.skip) : 0,
      take: req.query.take ? Number(req.query.take) : 50,
    });

    const organizationId = req.user.organizationId;

    const conversations = await conversationsService.getConversations(organizationId, {
      source: params.source as AiSourceType | undefined,
      appName: params.appName,
      streamId: params.streamId,
      isIndexed: params.isIndexed,
      skip: params.skip,
      take: params.take,
    });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('AI Sync list error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'List failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/conversations/:id
 * Get single conversation with messages
 */
router.get('/conversations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const conversation = await conversationsService.getConversation(id);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Check organization access
    if (conversation.organizationId !== req.user.organizationId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('AI Sync get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Get failed',
    });
  }
});

/**
 * DELETE /api/v1/ai-sync/conversations/:id
 * Delete conversation
 */
router.delete('/conversations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify ownership
    const conversation = await conversationsService.getConversation(id);
    if (!conversation || conversation.organizationId !== organizationId) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    await conversationsService.deleteConversation(id);

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('AI Sync delete error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    });
  }
});

/**
 * POST /api/v1/ai-sync/conversations/:id/index
 * Index conversation for RAG
 */
router.post('/conversations/:id/index', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify ownership
    const conversation = await conversationsService.getConversation(id);
    if (!conversation || conversation.organizationId !== organizationId) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    const chunksCount = await conversationsService.indexConversation(id);

    res.json({
      success: true,
      data: {
        conversationId: id,
        chunksCreated: chunksCount,
      },
    });
  } catch (error) {
    console.error('AI Sync index error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Index failed',
    });
  }
});

/**
 * POST /api/v1/ai-sync/index-all
 * Index all unindexed conversations
 */
router.post('/index-all', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await syncOrchestrator.indexAllUnindexed(organizationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI Sync index-all error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Index all failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/status
 * Get sync status for all sources
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const source = req.query.source as AiSourceType | undefined;

    const status = await conversationsService.getSyncStatus(organizationId, source);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('AI Sync status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/summary
 * Get sync summary statistics
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    const summary = await syncOrchestrator.getSyncSummary(organizationId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('AI Sync summary error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Summary failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/app-mappings
 * Get app mappings
 */
router.get('/app-mappings', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    const mappings = await conversationsService.getAppMappings(organizationId);

    res.json({
      success: true,
      data: mappings,
    });
  } catch (error) {
    console.error('AI Sync app-mappings error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'App mappings failed',
    });
  }
});

/**
 * POST /api/v1/ai-sync/reclassify
 * Re-classify all conversations
 */
router.post('/reclassify', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await syncOrchestrator.reclassifyAll(organizationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI Sync reclassify error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Reclassify failed',
    });
  }
});

/**
 * DELETE /api/v1/ai-sync/source/:source
 * Delete all conversations from a source
 */
router.delete('/source/:source', async (req: Request, res: Response): Promise<void> => {
  try {
    const source = req.params.source as AiSourceType;
    const organizationId = req.user.organizationId;

    if (!['CHATGPT', 'CLAUDE', 'DEEPSEEK'].includes(source)) {
      res.status(400).json({
        success: false,
        error: 'Invalid source',
      });
      return;
    }

    const count = await syncOrchestrator.deleteBySource(organizationId, source);

    res.json({
      success: true,
      data: {
        deletedCount: count,
      },
    });
  } catch (error) {
    console.error('AI Sync delete source error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete source failed',
    });
  }
});

export default router;
