/**
 * 🎤 Voice AI Routes - Text-to-Speech & Voice Processing
 * RESTful endpoints dla systemu Voice AI
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../shared/middleware/auth';
import { coquiTTSService } from '../services/voice/CoquiTTSService';
// Temporary disable complex voice services for basic TTS
// import { getAIVoiceProcessor } from '../services/voice/AIVoiceProcessor';
// import { getEnhancedAIVoiceProcessor } from '../services/voice/EnhancedAIVoiceProcessor';
// import { getVectorStore } from '../services/voice/VectorStore';
// import { getDataIngestionPipeline } from '../services/voice/DataIngestionPipeline';
import { prisma } from '../config/database';

import multer from 'multer';

const router = Router();

// Multer dla voice file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files allowed'));
    }
  },
});

// Validation schemas
const synthesizeSchema = z.object({
  text: z.string().min(1).max(1000, 'Text too long'),
  language: z.enum(['pl', 'en']).optional().default('pl'),
  personalityLevel: z.number().min(1).max(10).optional().default(5),
  emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'surprised']).optional(),
  speed: z.number().min(0.5).max(2.0).optional().default(1.0),
});

const voiceCloneSchema = z.object({
  text: z.string().min(1).max(1000),
  language: z.enum(['pl', 'en']).optional().default('pl'),
  emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'surprised']).optional(),
});

/**
 * POST /api/v1/voice/test-synthesis-public
 * Quick test endpoint bez autoryzacji (development only)
 */
router.post('/test-synthesis-public', async (req, res) => {
  try {
    const testText = req.body.text || 'Test polskiej syntezy mowy dla CRM';
    
    console.log(`🧪 Public TTS test: "${testText}"`);

    const result = await coquiTTSService.synthesizeText(testText, 'pl');

    res.json({
      success: true,
      data: {
        audioSize: result.audioBuffer.length,
        duration: result.duration,
        sampleRate: result.sampleRate,
        format: result.format,
        base64Audio: result.audioBuffer.toString('base64').substring(0, 100) + '...', // First 100 chars only
      },
    });

  } catch (error) {
    console.error('Public TTS test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test synthesis failed',
    });
  }
});

// Apply authentication middleware
// router.use(authenticateToken); // For protected endpoints

/**
 * GET /api/v1/voice/health
 * Check TTS service health
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await coquiTTSService.healthCheck();
    
    res.json({
      success: true,
      data: {
        ttsService: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Voice health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/v1/voice/models
 * Get available TTS models
 */
router.get('/models', async (req, res) => {
  try {
    const models = await coquiTTSService.getAvailableModels();
    
    res.json({
      success: true,
      data: {
        models,
        count: models.length,
      },
    });
  } catch (error) {
    console.error('Failed to get TTS models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve TTS models',
    });
  }
});

/**
 * POST /api/v1/voice/synthesize
 * Basic text-to-speech synthesis
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, language, personalityLevel, emotion, speed } = synthesizeSchema.parse(req.body);

    console.log(`🎤 TTS Request from ${req.user.email}: "${text.substring(0, 50)}..."`);

    // Use personality-aware synthesis
    const result = await coquiTTSService.synthesizeWithPersonality(
      text,
      personalityLevel,
      language
    );

    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', result.audioBuffer.length);
    res.setHeader('X-Audio-Duration', result.duration.toString());
    res.setHeader('X-Sample-Rate', result.sampleRate.toString());
    res.setHeader('Content-Disposition', 'inline; filename="tts_output.wav"');

    // Send audio data
    res.send(result.audioBuffer);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('TTS synthesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Text-to-speech synthesis failed',
    });
  }
});

/**
 * POST /api/v1/voice/synthesize-clone
 * Voice cloning synthesis
 */
router.post('/synthesize-clone', upload.single('speaker_wav'), async (req, res) => {
  try {
    const { text, language, emotion } = voiceCloneSchema.parse(req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Speaker audio file is required',
      });
    }

    console.log(`🎭 Voice cloning request: "${text.substring(0, 50)}..."`);

    const result = await coquiTTSService.synthesizeWithVoiceCloning(
      text,
      req.file.buffer,
      language,
      { emotion }
    );

    // Set headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', result.audioBuffer.length);
    res.setHeader('X-Audio-Duration', result.duration.toString());
    res.setHeader('Content-Disposition', 'inline; filename="cloned_voice.wav"');

    res.send(result.audioBuffer);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Voice cloning error:', error);
    res.status(500).json({
      success: false,
      error: 'Voice cloning synthesis failed',
    });
  }
});

/**
 * POST /api/v1/voice/synthesize-stream
 * Streaming text-to-speech (for real-time responses)
 */
router.post('/synthesize-stream', async (req, res) => {
  try {
    const { text, language } = synthesizeSchema.parse(req.body);

    console.log(`🌊 Streaming TTS: "${text.substring(0, 50)}..."`);

    // Set streaming headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    // Start streaming synthesis
    await coquiTTSService.synthesizeStreaming(
      text,
      language,
      (chunk: Buffer) => {
        res.write(chunk);
      }
    );

    res.end();

  } catch (error) {
    console.error('Streaming TTS error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Streaming synthesis failed',
      });
    }
  }
});

/**
 * POST /api/v1/voice/test-synthesis
 * Quick test endpoint dla development
 */
router.post('/test-synthesis', async (req, res) => {
  try {
    const testText = req.body.text || 'Witaj! To jest test polskiego systemu text-to-speech. Jak się słyszę?';
    
    console.log(`🧪 Test TTS synthesis: "${testText}"`);

    const result = await coquiTTSService.synthesizeText(testText, 'pl');

    res.json({
      success: true,
      data: {
        audioSize: result.audioBuffer.length,
        duration: result.duration,
        sampleRate: result.sampleRate,
        format: result.format,
        base64Audio: result.audioBuffer.toString('base64'),
      },
    });

  } catch (error) {
    console.error('Test synthesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Test synthesis failed',
    });
  }
});

/**
 * GET /api/v1/voice/demo-voices
 * Demo różnych personality levels
 */
router.get('/demo-voices', async (req, res) => {
  try {
    const demoText = 'Cześć! Jestem asystentem AI systemu CRM. Mogę mówić z różną osobowością.';
    
    const demos = await Promise.all([
      { level: 1, name: 'Bardzo spokojny' },
      { level: 5, name: 'Neutralny' },
      { level: 8, name: 'Energiczny' },
      { level: 10, name: 'Sarkastyczny' },
    ].map(async (demo) => {
      const result = await coquiTTSService.synthesizeWithPersonality(
        demoText,
        demo.level,
        'pl'
      );
      
      return {
        personalityLevel: demo.level,
        name: demo.name,
        audioBase64: result.audioBuffer.toString('base64'),
        duration: result.duration,
      };
    }));

    res.json({
      success: true,
      data: {
        demoText,
        voices: demos,
      },
    });

  } catch (error) {
    console.error('Demo voices error:', error);
    res.status(500).json({
      success: false,
      error: 'Demo voices generation failed',
    });
  }
});

/**
 * POST /api/v1/voice/process-command
 * Process voice command with AI
 */
router.post('/process-command', async (req, res) => {
  try {
    const { transcript, conversationId } = z.object({
      transcript: z.string().min(1).max(1000),
      conversationId: z.string().optional()
    }).parse(req.body);

    console.log(`🎤 Voice command from ${req.user.email}: "${transcript}"`);

    const aiProcessor = getAIVoiceProcessor(prisma);
    
    // Process command with AI
    const result = await aiProcessor.processCommand(transcript, {
      userId: req.user.id,
      organizationId: req.user.organizationId,
      conversationId,
      userPreferences: {
        language: 'pl',
        personalityLevel: 5
      }
    });

    // Generate contextual response
    const finalResponse = await aiProcessor.generateResponse(result, {
      userId: req.user.id,
      organizationId: req.user.organizationId,
      userPreferences: {
        language: 'pl',
        personalityLevel: 5
      }
    });

    res.json({
      success: true,
      data: {
        ...result,
        response: finalResponse,
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
 * POST /api/v1/voice/start-conversation
 * Start a new voice conversation
 */
router.post('/start-conversation', async (req, res) => {
  try {
    const conversationId = `conv_${Date.now()}_${req.user.id.substring(0, 8)}`;
    
    res.json({
      success: true,
      data: {
        conversationId,
        message: 'Cześć! Jestem twoim asystentem głosowym. W czym mogę pomóc?',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
});

/**
 * GET /api/v1/voice/conversation/:id
 * Get conversation history
 */
router.get('/conversation/:id', async (req, res) => {
  try {
    // In production, this would fetch from a conversation store
    // For now, return mock data
    const conversationId = req.params.id;
    
    res.json({
      success: true,
      data: {
        conversationId,
        messages: [],
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    });
  }
});

/**
 * POST /api/v1/voice/speech-to-text
 * Convert speech to text (if not using client-side recognition)
 */
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    // In production, this would use a speech-to-text service
    // For now, return mock data
    res.json({
      success: true,
      data: {
        transcript: 'Mock transcription of audio',
        confidence: 0.95,
        language: 'pl-PL',
        duration: 3.5
      }
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert speech to text'
    });
  }
});

/**
 * POST /api/v1/voice/process-command-enhanced
 * Process voice command with RAG (semantic search in knowledge base)
 */
router.post('/process-command-enhanced', async (req, res) => {
  try {
    const { transcript, conversationId } = z.object({
      transcript: z.string().min(1).max(1000),
      conversationId: z.string().optional()
    }).parse(req.body);

    console.log(`🧠 Enhanced voice command from ${req.user.email}: "${transcript}"`);

    const vectorStore = getVectorStore(prisma);
    const enhancedProcessor = getEnhancedAIVoiceProcessor(prisma, vectorStore);
    
    // Process command with RAG
    const result = await enhancedProcessor.processCommandWithRAG(transcript, {
      userId: req.user.id,
      organizationId: req.user.organizationId,
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
 * POST /api/v1/voice/initialize-knowledge
 * Initialize vector store with user's data
 */
router.post('/initialize-knowledge', async (req, res) => {
  try {
    const vectorStore = getVectorStore(prisma);
    const enhancedProcessor = getEnhancedAIVoiceProcessor(prisma, vectorStore);
    
    await enhancedProcessor.initializeUserVectorStore(req.user.organizationId);
    
    res.json({
      success: true,
      data: {
        message: 'Knowledge initialization started',
        organizationId: req.user.organizationId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Knowledge initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize knowledge base'
    });
  }
});

/**
 * GET /api/v1/voice/knowledge-stats
 * Get vector store statistics
 */
router.get('/knowledge-stats', async (req, res) => {
  try {
    const vectorStore = getVectorStore(prisma);
    const stats = await vectorStore.getStats(req.user.organizationId);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Knowledge stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge stats'
    });
  }
});

/**
 * POST /api/v1/voice/search-knowledge
 * Manual search in knowledge base
 */
router.post('/search-knowledge', async (req, res) => {
  try {
    const { query, limit, threshold } = z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(10),
      threshold: z.number().optional().default(0.6)
    }).parse(req.body);

    const vectorStore = getVectorStore(prisma);
    const results = await vectorStore.search(query, {
      userId: req.user.id,
      organizationId: req.user.organizationId,
      limit,
      threshold
    });
    
    res.json({
      success: true,
      data: {
        query,
        results: results.map(r => ({
          id: r.document.id,
          content: r.document.content.substring(0, 200) + '...',
          type: r.document.metadata.type,
          similarity: r.similarity,
          relevanceScore: r.relevanceScore,
          source: r.document.metadata.source
        })),
        totalFound: results.length
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

    console.error('Knowledge search error:', error);
    res.status(500).json({
      success: false,
      error: 'Knowledge search failed'
    });
  }
});

/**
 * GET /api/v1/voice/ingestion-status
 * Get current data ingestion job status
 */
router.get('/ingestion-status', async (req, res) => {
  try {
    const vectorStore = getVectorStore(prisma);
    const pipeline = getDataIngestionPipeline(prisma, vectorStore);
    
    const currentJob = pipeline.getCurrentJob();
    const isRunning = pipeline.isIngestionRunning();
    
    res.json({
      success: true,
      data: {
        isRunning,
        currentJob,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ingestion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ingestion status'
    });
  }
});

export default router;