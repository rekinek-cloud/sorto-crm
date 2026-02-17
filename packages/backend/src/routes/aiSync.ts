import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { prisma } from '../config/database';
import {
  AiConversationsService,
  SyncOrchestratorService,
} from '../modules/ai-conversations-sync/services';
import { AiSourceType } from '../modules/ai-conversations-sync/types';

const router = Router();

// Services
const conversationsService = new AiConversationsService(prisma);
const syncOrchestrator = new SyncOrchestratorService(prisma);

// Validation schemas
const syncSchema = z.object({
  source: z.enum(['CHATGPT', 'CLAUDE', 'DEEPSEEK']),
  jsonContent: z.string().min(1, 'JSON content is required'),
});

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(100).optional().default(10),
  appName: z.string().optional(),
  source: z.enum(['CHATGPT', 'CLAUDE', 'DEEPSEEK']).optional(),
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * POST /api/v1/ai-sync/import
 * Import conversations from JSON file
 * Uses existing vector_documents table via VectorService
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { source, jsonContent } = syncSchema.parse(req.body);
    const organizationId = req.user.organizationId;

    const result = await syncOrchestrator.syncFromJson(
      organizationId,
      source as AiSourceType,
      jsonContent
    );

    return res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('AI Sync import error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
});

/**
 * POST /api/v1/ai-sync/search
 * Search conversations using VectorService
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

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('AI Sync search error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/conversations
 * List conversations from vector_documents
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const source = req.query.source as AiSourceType | undefined;
    const appName = req.query.appName as string | undefined;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const take = req.query.take ? Number(req.query.take) : 50;

    const conversations = await conversationsService.getConversations(organizationId, {
      source,
      appName,
      skip,
      take,
    });

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('AI Sync list error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'List failed',
    });
  }
});

/**
 * GET /api/v1/ai-sync/conversations/:id
 * Get single conversation
 */
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const conversation = await conversationsService.getConversation(organizationId, id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('AI Sync get conversation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Get failed',
    });
  }
});

/**
 * DELETE /api/v1/ai-sync/conversations/:id
 * Delete conversation
 */
router.delete('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    await conversationsService.deleteConversation(organizationId, id);

    return res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('AI Sync delete error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
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

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('AI Sync summary error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Summary failed',
    });
  }
});

/**
 * DELETE /api/v1/ai-sync/source/:source
 * Delete all conversations from a source
 */
router.delete('/source/:source', async (req: Request, res: Response) => {
  try {
    const source = req.params.source as AiSourceType;
    const organizationId = req.user.organizationId;

    if (!['CHATGPT', 'CLAUDE', 'DEEPSEEK'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source',
      });
    }

    const count = await syncOrchestrator.deleteBySource(organizationId, source);

    return res.json({
      success: true,
      data: {
        deletedCount: count,
      },
    });
  } catch (error) {
    console.error('AI Sync delete source error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete source failed',
    });
  }
});

export default router;
