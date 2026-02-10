/**
 * 🧠 Voice RAG Routes - Enhanced AI Voice Processing
 * RAG endpoints for semantic search and knowledge integration
 */

import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { getAIVoiceProcessor } from '../services/voice/AIVoiceProcessor';
import { getEnhancedAIVoiceProcessor } from '../services/voice/EnhancedAIVoiceProcessor';
import { getVectorStore } from '../services/voice/VectorStore';
import { getDataIngestionPipeline } from '../services/voice/DataIngestionPipeline';
import { prisma } from '../config/database';


const router = Router();

// Extended Request interface for auth
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    organizationId: string;
  };
}

/**
 * POST /api/v1/voice/rag/process-command
 * Basic voice command processing with AI
 */
router.post('/process-command', authenticateUser, async (req: any, res) => {
  try {
    const { transcript } = z.object({
      transcript: z.string().min(1).max(1000)
    }).parse(req.body);

    const userId = req.user?.id || 'test-user';
    const organizationId = req.user?.organizationId || 'test-org';
    const userEmail = req.user?.email || 'test@example.com';

    console.log(`🤖 Basic voice command from ${userEmail}: "${transcript}"`);

    const aiVoiceProcessor = getAIVoiceProcessor(prisma);
    
    // Process command without RAG
    const result = await aiVoiceProcessor.processCommand(transcript, {
      userId,
      organizationId,
      userPreferences: {
        language: 'pl',
        personalityLevel: 5
      }
    });

    res.json({
      success: true,
      data: {
        ...result,
        enhanced: false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Voice command processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command'
    });
  }
});

/**
 * POST /api/v1/voice/rag/process-command-enhanced
 * Enhanced voice command processing with RAG
 */
router.post('/process-command-enhanced', authenticateUser, async (req: any, res) => {
  try {
    const { transcript, conversationId } = z.object({
      transcript: z.string().min(1).max(1000),
      conversationId: z.string().optional()
    }).parse(req.body);

    const userId = req.user?.id || 'test-user';
    const organizationId = req.user?.organizationId || 'test-org';
    const userEmail = req.user?.email || 'test@example.com';

    console.log(`🧠 Enhanced voice command from ${userEmail}: "${transcript}"`);

    const vectorStore = getVectorStore(prisma);
    const enhancedProcessor = getEnhancedAIVoiceProcessor(prisma, vectorStore);
    
    // Process command with RAG
    const result = await enhancedProcessor.processCommandWithRAG(transcript, {
      userId,
      organizationId,
      conversationId,
      userPreferences: {
        language: 'pl',
        personalityLevel: 5
      }
    });

    res.json({
      success: true,
      data: {
        ...result,
        enhanced: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Enhanced voice command processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process enhanced voice command'
    });
  }
});

/**
 * POST /api/v1/voice/rag/initialize-knowledge
 * Initialize vector store with user's data
 */
router.post('/initialize-knowledge', authenticateUser, async (req: any, res) => {
  try {
    const { entityTypes, forceRebuild } = z.object({
      entityTypes: z.array(z.enum(['tasks', 'projects', 'contacts', 'companies', 'deals', 'communications'])).optional(),
      forceRebuild: z.boolean().default(false)
    }).parse(req.body);

    const userId = req.user?.id || 'test-user';
    const organizationId = req.user?.organizationId || 'test-org';
    const userEmail = req.user?.email || 'test@example.com';

    console.log(`📚 Initializing knowledge base for ${userEmail}`);

    const vectorStore = getVectorStore(prisma);
    const pipeline = getDataIngestionPipeline(prisma, vectorStore);
    
    // Start ingestion job
    const jobId = await pipeline.ingestUserData(
      organizationId,
      userId,
      entityTypes || ['tasks', 'projects', 'contacts', 'companies', 'deals'],
      forceRebuild
    );

    res.json({
      success: true,
      data: {
        jobId,
        status: 'started',
        message: 'Knowledge base initialization started',
        estimatedTime: '2-5 minutes',
        entityTypes: entityTypes || ['tasks', 'projects', 'contacts', 'companies', 'deals']
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Knowledge base initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize knowledge base'
    });
  }
});

/**
 * GET /api/v1/voice/rag/knowledge-status
 * Get knowledge base status
 */
router.get('/knowledge-status', authenticateUser, async (req: any, res) => {
  try {
    const organizationId = req.user?.organizationId || 'test-org';
    
    const vectorStore = getVectorStore(prisma);
    
    // Get vector store stats
    const stats = await vectorStore.getStats(organizationId);
    
    res.json({
      success: true,
      data: {
        ...stats,
        isInitialized: stats.totalDocuments > 0,
        status: stats.totalDocuments > 0 ? 'ready' : 'empty',
        lastUpdated: stats.lastUpdated
      }
    });

  } catch (error) {
    console.error('Knowledge status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check knowledge base status'
    });
  }
});

/**
 * GET /api/v1/voice/rag/test-public
 * Test RAG system without auth
 */
router.get('/test-public', async (req, res) => {
  try {
    console.log('🧪 Testing RAG system components...');
    
    const vectorStore = getVectorStore(prisma);
    const pipeline = getDataIngestionPipeline(prisma, vectorStore);
    
    // Test vector store
    const stats = await vectorStore.getStats();
    
    res.json({
      success: true,
      data: {
        message: 'RAG system components loaded successfully',
        vectorStore: stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('RAG test error:', error);
    res.status(500).json({
      success: false,
      error: `RAG test failed: ${error}`
    });
  }
});

export default router;