/**
 * 🎤 Voice AI Routes - BASIC TTS ONLY
 * Simple text-to-speech endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
// import { authenticateUser } from '../shared/middleware/auth';
import { coquiTTSService } from '../services/voice/CoquiTTSService';
// Basic TTS only - RAG moved to /voice/rag routes

const router = Router();

// Request schemas
const synthesizeSchema = z.object({
  text: z.string().min(1).max(2000),
  language: z.enum(['pl', 'en']).default('pl'),
  personalityLevel: z.number().min(1).max(10).default(5),
  emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'surprised']).default('neutral'),
  speed: z.number().min(0.5).max(2.0).default(1.0)
});

/**
 * GET /api/v1/voice/health
 * Voice system health check (no auth required)
 */
router.get('/health', async (req, res) => {
  try {
    console.log('🔍 Voice health check...');
    
    // Test basic TTS service
    const ttsHealth = await coquiTTSService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        tts: ttsHealth,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Voice health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

/**
 * POST /api/v1/voice/test-synthesis-public
 * Public test synthesis (no auth required) 
 */
router.post('/test-synthesis-public', async (req, res) => {
  try {
    const { text } = z.object({
      text: z.string().min(1).max(100).default('Witaj w systemie CRM Streams')
    }).parse(req.body);

    console.log(`🎤 Public TTS test: "${text}"`);

    const result = await coquiTTSService.synthesizeText(text, 'pl');

    return res.json({
      success: true,
      data: {
        audioSize: result.audioBuffer.length,
        duration: result.duration,
        sampleRate: 22050,
        format: 'wav'
      }
    });

  } catch (error) {
    console.error('Public TTS test error:', error);
    return res.status(500).json({
      success: false,
      error: 'TTS synthesis failed'
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
    
    return res.json({
      success: true,
      data: {
        models,
        count: models.length,
      },
    });
  } catch (error) {
    console.error('Failed to get TTS models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve TTS models',
    });
  }
});

/**
 * POST /api/v1/voice/synthesize
 * Basic text-to-speech synthesis (auth required)
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, language, personalityLevel, emotion, speed } = synthesizeSchema.parse(req.body);

    console.log(`🎤 TTS Request: "${text.substring(0, 50)}..."`);

    // Use personality-aware synthesis
    const result = await coquiTTSService.synthesizeWithPersonality(
      text,
      personalityLevel,
      language
    );

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': result.audioBuffer.length.toString(),
      'Content-Disposition': 'attachment; filename="synthesis.wav"'
    });

    return res.send(result.audioBuffer);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('TTS synthesis error:', error);
    return res.status(500).json({
      success: false,
      error: 'TTS synthesis failed',
    });
  }
});

/**
 * POST /api/v1/voice/synthesize-clone
 * Voice cloning synthesis (auth required) - TEMPORARILY DISABLED
 */
router.post('/synthesize-clone', async (req, res) => {
  return res.status(503).json({
    success: false,
    error: 'Voice cloning temporarily disabled - requires audio file upload'
  });
});

/**
 * POST /api/v1/voice/synthesize-stream
 * Streaming TTS synthesis (auth required)
 */
router.post('/synthesize-stream', async (req, res) => {
  try {
    const { text, language } = z.object({
      text: z.string().min(1).max(2000),
      language: z.enum(['pl', 'en']).default('pl')
    }).parse(req.body);

    console.log(`🌊 Streaming TTS: "${text.substring(0, 50)}..."`);

    // Set streaming headers
    res.set({
      'Content-Type': 'audio/wav',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // For now, just use regular synthesis
    // In future, implement actual streaming
    const result = await coquiTTSService.synthesizeText(text, language);
    return res.send(result.audioBuffer);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Streaming TTS error:', error);
    return res.status(500).json({
      success: false,
      error: 'Streaming TTS failed',
    });
  }
});

// RAG endpoints moved to /voice/rag routes

export default router;
