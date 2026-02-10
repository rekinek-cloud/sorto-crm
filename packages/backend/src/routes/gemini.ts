/**
 * Gemini API Routes
 * Vision, Context Caching, 1M context
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { GeminiService, GEMINI_MODELS } from '../services/ai/GeminiService';
import { GeminiCacheService } from '../services/ai/GeminiCacheService';
import { prisma } from '../config/database';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../config/logger';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

// Initialize services lazily
let geminiService: GeminiService | null = null;
let cacheService: GeminiCacheService | null = null;

function getGeminiService(): GeminiService {
  if (!geminiService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
}

function getCacheService(): GeminiCacheService {
  if (!cacheService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    cacheService = new GeminiCacheService(apiKey, prisma);
  }
  return cacheService;
}

// ===================
// CHAT
// ===================

/**
 * POST /api/v1/gemini/chat
 * Simple chat
 */
router.post('/chat', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const service = getGeminiService();
    const response = await service.chat(prompt, { model });

    res.json({
      success: true,
      data: { response },
    });
  } catch (error: any) {
    logger.error('Gemini chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/gemini/chat/stream
 * Streaming chat
 */
router.post('/chat/stream', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const service = getGeminiService();

    for await (const chunk of service.chatStream(prompt, { model })) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    logger.error('Gemini stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// ===================
// VISION
// ===================

/**
 * POST /api/v1/gemini/vision/analyze
 * Analyze uploaded image
 */
router.post('/vision/analyze', authenticateToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const prompt = req.body.prompt || 'Opisz ten obraz szczegółowo po polsku.';

    const service = getGeminiService();
    const analysis = await service.analyzeImage(req.file.path, prompt);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error: any) {
    logger.error('Gemini vision error:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/gemini/vision/analyze-base64
 * Analyze base64 image
 */
router.post('/vision/analyze-base64', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const service = getGeminiService();
    const analysis = await service.analyzeImageBuffer(
      buffer,
      mimeType || 'image/jpeg',
      prompt || 'Opisz ten obraz szczegółowo po polsku.'
    );

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error: any) {
    logger.error('Gemini vision base64 error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/gemini/vision/tags
 * Auto-tag image (for FocusPhoto)
 */
router.post('/vision/tags', authenticateToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const service = getGeminiService();
    const tags = await service.autoTagImage(req.file.path);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error: any) {
    logger.error('Gemini tags error:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/gemini/vision/ocr
 * OCR - extract text from image
 */
router.post('/vision/ocr', authenticateToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const language = req.body.language || 'polski';
    const service = getGeminiService();
    const text = await service.ocr(req.file.path, language);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: { text },
    });
  } catch (error: any) {
    logger.error('Gemini OCR error:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message });
  }
});

// ===================
// CONTEXT CACHING (90% cheaper!)
// ===================

/**
 * POST /api/v1/gemini/cache/create
 * Create RAG cache
 */
router.post('/cache/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, documents, ttlSeconds } = req.body;

    if (!name || !documents || !documents.length) {
      return res.status(400).json({ error: 'name and documents are required' });
    }

    const service = getCacheService();
    const cacheInfo = await service.createRAGCache(name, documents, { ttlSeconds });

    res.json({
      success: true,
      data: cacheInfo,
    });
  } catch (error: any) {
    logger.error('Gemini cache create error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/gemini/cache/query
 * Query with cache (90% cheaper!)
 */
router.post('/cache/query', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cacheName, question } = req.body;

    if (!cacheName || !question) {
      return res.status(400).json({ error: 'cacheName and question are required' });
    }

    const service = getCacheService();
    const answer = await service.ragQueryWithCache(cacheName, question);

    res.json({
      success: true,
      data: { answer },
    });
  } catch (error: any) {
    logger.error('Gemini cache query error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/gemini/cache/list
 * List active caches
 */
router.get('/cache/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const service = getCacheService();
    const caches = await service.listCaches();

    res.json({
      success: true,
      data: caches,
    });
  } catch (error: any) {
    logger.error('Gemini cache list error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/gemini/cache/:name
 * Delete cache
 */
router.delete('/cache/:name', authenticateToken, async (req: Request, res: Response) => {
  try {
    const service = getCacheService();
    await service.deleteCache(req.params.name);

    res.json({
      success: true,
      message: 'Cache deleted',
    });
  } catch (error: any) {
    logger.error('Gemini cache delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// LARGE CONTEXT (1M tokens)
// ===================

/**
 * POST /api/v1/gemini/analyze-context
 * Analyze large context
 */
router.post('/analyze-context', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { files, prompt } = req.body;

    if (!files || !files.length || !prompt) {
      return res.status(400).json({ error: 'files and prompt are required' });
    }

    const service = getGeminiService();
    const analysis = await service.analyzeLargeContext(files, prompt);

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error: any) {
    logger.error('Gemini analyze context error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/gemini/count-tokens
 * Count tokens in text
 */
router.post('/count-tokens', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const service = getGeminiService();
    const tokens = await service.countTokens(text);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error: any) {
    logger.error('Gemini count tokens error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================
// STATUS & MODELS
// ===================

/**
 * GET /api/v1/gemini/models
 * Get available models
 */
router.get('/models', authenticateToken, async (req: Request, res: Response) => {
  try {
    const service = getGeminiService();
    const models = service.getAvailableModels();

    res.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    logger.error('Gemini get models error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/gemini/status
 * Check service status
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        data: {
          configured: false,
          message: 'GEMINI_API_KEY not configured',
        },
      });
    }

    const service = getGeminiService();
    const status = await service.checkStatus();

    res.json({
      success: true,
      data: {
        configured: true,
        ...status,
        models: service.getAvailableModels(),
      },
    });
  } catch (error: any) {
    res.json({
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
