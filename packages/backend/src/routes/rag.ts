/**
 * RAG API Routes
 * Retrieval-Augmented Generation endpoints
 * Integrated with SORTO Streams
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { RAGService } from '../services/ai/RAGService';
import { prisma } from '../config/database';
import logger from '../config/logger';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

// Cache RAGService instances per organization
const serviceCache = new Map<string, RAGService>();

function getService(organizationId: string): RAGService {
  let service = serviceCache.get(organizationId);
  if (!service) {
    service = new RAGService(prisma, organizationId);
    serviceCache.set(organizationId, service);
  }
  return service;
}

// ==================
// SOURCES
// ==================

router.get('/sources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const service = getService(organizationId);
    const sources = await service.listSources();

    return res.json({ success: true, data: sources });
  } catch (error: any) {
    logger.error('RAG list sources error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/sources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, content, contentType, description, streamId } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'name and content are required' });
    }

    const service = getService(organizationId);
    const result = await service.addSource({
      name,
      type: type || 'document',
      content,
      contentType: contentType || 'text',
      description,
      streamId,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('RAG index document error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/sources/upload', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { type, description, streamId } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase();

    const content = fs.readFileSync(filePath, 'utf-8');

    let contentType: 'text' | 'markdown' | 'code' = 'text';
    if (['.md', '.markdown'].includes(ext)) {
      contentType = 'markdown';
    } else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php', '.go', '.rs', '.rb'].includes(ext)) {
      contentType = 'code';
    }

    const service = getService(organizationId);
    const result = await service.addSource({
      name: fileName,
      type: type || 'document',
      content,
      contentType,
      description,
      streamId,
    });

    fs.unlinkSync(filePath);

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('RAG upload file error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/sources/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const service = getService(organizationId);
    const source = await service.getSource(req.params.id);

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    return res.json({ success: true, data: source });
  } catch (error: any) {
    logger.error('RAG get source error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/sources/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const service = getService(organizationId);
    await service.deleteSource(req.params.id);

    return res.json({ success: true, message: 'Source deleted' });
  } catch (error: any) {
    logger.error('RAG delete source error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/sources/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const { isActive } = req.body;
    const service = getService(organizationId);
    await service.updateSourceStatus(req.params.id, isActive);

    return res.json({ success: true, message: 'Source updated' });
  } catch (error: any) {
    logger.error('RAG update source error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================
// QUERY & SEARCH
// ==================

router.post('/query', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const { question, sourceType, limit, threshold } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const service = getService(organizationId);
    const result = await service.query(question, {
      sourceType,
      limit: limit || 5,
      threshold: threshold || 0.5,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('RAG query error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const { query, sourceType, limit, threshold } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const service = getService(organizationId);
    const results = await service.search(query, {
      sourceType,
      limit: limit || 10,
      threshold: threshold || 0.5,
    });

    // Map results to match frontend SearchResult interface
    const mappedResults = results.map(r => ({
      content: r.content,
      similarity: typeof r.similarity === 'number' ? r.similarity : 0.5,
      sourceName: r.sourceType === 'rag_source' ? 'Knowledge Base' : r.sourceType,
      sourceType: r.sourceType,
      metadata: r.metadata || {},
    }));

    return res.json({ success: true, data: mappedResults });
  } catch (error: any) {
    logger.error('RAG search error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================
// STATUS
// ==================

router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.QWEN_API_KEY;

    return res.json({
      success: true,
      data: {
        configured: !!apiKey,
        pgvectorEnabled: true,
        message: apiKey ? 'RAG is ready' : 'QWEN_API_KEY not configured',
      },
    });
  } catch (error: any) {
    logger.error('RAG status error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
