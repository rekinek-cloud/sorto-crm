/**
 * AI Chat API Routes
 * Unlimited chat with Qwen API
 * Integrated with SORTO Streams
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { QwenChatService, QWEN_MODELS } from '../services/ai/QwenChatService';
import logger from '../config/logger';

const router = Router();

// Initialize service lazily
let chatService: QwenChatService | null = null;

function isConfigured(): boolean {
  return !!process.env.QWEN_API_KEY;
}

function getService(): QwenChatService {
  if (!chatService) {
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }
    chatService = new QwenChatService(apiKey);
  }
  return chatService;
}

// ===================
// CONVERSATIONS
// ===================

/**
 * GET /api/v1/ai-chat/conversations
 * List all conversations for user
 */
router.get('/conversations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return empty array if not configured
    if (!isConfigured()) {
      return res.json({
        success: true,
        data: [],
        warning: 'AI Chat not configured (QWEN_API_KEY missing)',
      });
    }

    const { limit, includeArchived, streamId } = req.query;

    const service = getService();
    const conversations = await service.listConversations(organizationId, userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      includeArchived: includeArchived === 'true',
      streamId: streamId as string | undefined,
    });

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    logger.error('AI Chat list conversations error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/ai-chat/conversations
 * Create a new conversation
 */
router.post('/conversations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, model, systemPrompt, streamId } = req.body;

    const service = getService();
    const conversation = await service.createConversation(organizationId, userId, {
      title,
      model,
      systemPrompt,
      streamId,
    });

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    logger.error('AI Chat create conversation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/ai-chat/conversations/:id
 * Get conversation with messages
 */
router.get('/conversations/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const service = getService();
    const conversation = await service.getConversation(id, organizationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    logger.error('AI Chat get conversation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/ai-chat/conversations/:id
 * Update conversation (title, archive, pin, etc.)
 */
router.patch('/conversations/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, isArchived, isPinned, systemPrompt, streamId } = req.body;

    const service = getService();
    await service.updateConversation(id, organizationId, {
      title,
      isArchived,
      isPinned,
      systemPrompt,
      streamId,
    });

    return res.json({
      success: true,
      message: 'Conversation updated',
    });
  } catch (error: any) {
    logger.error('AI Chat update conversation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/ai-chat/conversations/:id
 * Delete conversation
 */
router.delete('/conversations/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const service = getService();
    await service.deleteConversation(id, organizationId);

    return res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error: any) {
    logger.error('AI Chat delete conversation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ===================
// MESSAGES
// ===================

/**
 * POST /api/v1/ai-chat/conversations/:id/messages
 * Send message to conversation (with streaming)
 */
router.post('/conversations/:id/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content, model, temperature, maxTokens } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Setup SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const service = getService();

    try {
      const stream = service.sendMessage(id, organizationId, content, {
        model,
        temperature,
        maxTokens,
      });

      let result: any;
      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        } else {
          result = chunk;
        }
      }

      // Send final stats
      if (result) {
        res.write(`data: ${JSON.stringify({ done: true, usage: result.usage, latencyMs: result.latencyMs })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (streamError: any) {
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      return res.end();
    }
  } catch (error: any) {
    logger.error('AI Chat send message error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      return res.end();
    }
  }
});

// ===================
// SIMPLE CHAT (no history)
// ===================

/**
 * POST /api/v1/ai-chat/chat
 * Simple chat without history (one-shot)
 */
router.post('/chat', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { messages, model, temperature, maxTokens, systemPrompt } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const service = getService();

    // Add system prompt if provided
    const chatMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await service.chat(chatMessages, {
      model,
      temperature,
      maxTokens,
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    logger.error('AI Chat simple chat error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/ai-chat/chat/stream
 * Simple streaming chat without history
 */
router.post('/chat/stream', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { messages, model, temperature, maxTokens, systemPrompt } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const service = getService();

    // Add system prompt if provided
    const chatMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    try {
      for await (const chunk of service.chatStream(chatMessages, {
        model,
        temperature,
        maxTokens,
      })) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (streamError: any) {
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      return res.end();
    }
  } catch (error: any) {
    logger.error('AI Chat stream error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      return res.end();
    }
  }
});

// ===================
// STATUS & MODELS
// ===================

/**
 * GET /api/v1/ai-chat/models
 * Get available models
 */
router.get('/models', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Return models even if not configured (just list what would be available)
    if (!isConfigured()) {
      return res.json({
        success: true,
        data: QWEN_MODELS,
        warning: 'AI Chat not configured (QWEN_API_KEY missing)',
      });
    }

    const service = getService();
    const models = service.getAvailableModels();

    return res.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    logger.error('AI Chat get models error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/ai-chat/status
 * Check service status
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.QWEN_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        data: {
          configured: false,
          message: 'QWEN_API_KEY not configured',
        },
      });
    }

    const service = getService();
    const status = await service.checkStatus();

    return res.json({
      success: true,
      data: {
        configured: true,
        ...status,
        models: service.getAvailableModels(),
      },
    });
  } catch (error: any) {
    return res.json({
      success: true,
      data: {
        configured: true,
        isAvailable: false,
        errorMessage: error.message,
      },
    });
  }
});

export default router;
