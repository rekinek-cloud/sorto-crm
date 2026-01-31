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
import logger from '../config/logger';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

let ragService: RAGService | null = null;

function getService(): RAGService {
  if (!ragService) {
    ragService = new RAGService();
  }
  return ragService;
}

// ==================
// SOURCES
// ==================

router.get('/sources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const service = getService();
    const sources = await service.listSources(organizationId);

    res.json({ success: true, data: sources });
  } catch (error: any) {
    logger.error('RAG list sources error:', error);
    res.status(500).json({ error: error.message });
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

    const service = getService();
    const result = await service.indexDocument({
      name,
      type: type || 'document',
      content,
      contentType: contentType || 'text',
      description,
      organizationId,
      streamId,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('RAG index document error:', error);
    res.status(500).json({ error: error.message });
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

    const service = getService();
    const result = await service.indexDocument({
      name: fileName,
      type: type || 'document',
      content,
      contentType,
      description,
      organizationId,
      streamId,
    });

    fs.unlinkSync(filePath);

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('RAG upload file error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/sources/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const service = getService();
    const source = await service.getSource(req.params.id, organizationId);

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    res.json({ success: true, data: source });
  } catch (error: any) {
    logger.error('RAG get source error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/sources/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const service = getService();
    await service.deleteSource(req.params.id, organizationId);

    res.json({ success: true, message: 'Source deleted' });
  } catch (error: any) {
    logger.error('RAG delete source error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/sources/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const { isActive } = req.body;
    const service = getService();
    await service.updateSourceStatus(req.params.id, organizationId, isActive);

    res.json({ success: true, message: 'Source updated' });
  } catch (error: any) {
    logger.error('RAG update source error:', error);
    res.status(500).json({ error: error.message });
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

    const service = getService();
    const result = await service.query(question, {
      organizationId,
      sourceType,
      limit: limit || 5,
      threshold: threshold || 0.5,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('RAG query error:', error);
    res.status(500).json({ error: error.message });
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

    const service = getService();
    const results = await service.search(query, {
      organizationId,
      sourceType,
      limit: limit || 10,
      threshold: threshold || 0.5,
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    logger.error('RAG search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================
// STATUS
// ==================

router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.QWEN_API_KEY;

    res.json({
      success: true,
      data: {
        configured: !!apiKey,
        pgvectorEnabled: true,
        message: apiKey ? 'RAG is ready' : 'QWEN_API_KEY not configured',
      },
    });
  } catch (error: any) {
    logger.error('RAG status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
