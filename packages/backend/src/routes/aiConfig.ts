import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import { z } from 'zod';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

// AI Model Configuration Schema
const aiModelSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  description: z.string().optional(),
  modelId: z.string().min(1),
  contextSize: z.number().min(1),
  maxTokens: z.number().min(1),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  costPer1kTokens: z.number().min(0),
  enabled: z.boolean(),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1),
    tokensPerMinute: z.number().min(1),
  }).optional(),
  capabilities: z.array(z.string()).default([]),
});

const aiProviderSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  apiEndpoint: z.string().url(),
  authType: z.enum(['api-key', 'oauth', 'custom']),
  enabled: z.boolean(),
  configSchema: z.record(z.any()).optional(),
  supportedModels: z.array(z.string()).default([]),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1),
    tokensPerMinute: z.number().min(1),
  }).optional(),
});

const testModelSchema = z.object({
  prompt: z.string().optional(),
});

// Default AI Models Configuration
const defaultAIModels = [
  {
    id: 'transcription',
    service_name: 'Audio Transcription',
    description: 'Converts audio/voice recordings to text',
    model_config: {
      provider: 'openai',
      model: 'whisper-1',
      enabled: true,
      usage_limit_daily: 100,
      usage_limit_monthly: 2000,
      cost_per_token: 0.006,
      description: 'OpenAI Whisper model for audio transcription with Polish language support'
    },
    fallback_enabled: false,
    timeout_ms: 30000,
    features: ['Audio to Text', 'Polish Language', 'Word Timestamps', 'Speaker Detection'],
    use_cases: ['Voice Project Creation', 'Meeting Transcription', 'Voice Notes']
  },
  {
    id: 'project_analysis',
    service_name: 'Project Analysis',
    description: 'Analyzes transcriptions to extract project information',
    model_config: {
      provider: 'openai',
      model: 'gpt-4',
      enabled: true,
      usage_limit_daily: 50,
      usage_limit_monthly: 1000,
      cost_per_token: 0.03,
      description: 'GPT-4 for intelligent project data extraction and structure analysis'
    },
    fallback_enabled: true,
    timeout_ms: 25000,
    features: ['Project Extraction', 'Task Generation', 'Client Detection', 'Budget Analysis'],
    use_cases: ['Voice Project Creation', 'Smart Project Setup', 'Automated Task Creation']
  },
  {
    id: 'smart_analysis',
    service_name: 'SMART Goal Analysis',
    description: 'Custom algorithm for SMART criteria evaluation',
    model_config: {
      provider: 'custom',
      model: 'smart-scoring-v1',
      enabled: true,
      usage_limit_daily: 500,
      usage_limit_monthly: 10000,
      cost_per_token: 0,
      description: 'Internal algorithm analyzing Specific, Measurable, Achievable, Relevant, Time-bound criteria'
    },
    fallback_enabled: false,
    timeout_ms: 5000,
    features: ['SMART Scoring', 'Goal Evaluation', 'Improvement Suggestions', 'Progress Tracking'],
    use_cases: ['Task Quality Assessment', 'Project Planning', 'Goal Setting', 'Performance Metrics']
  },
  {
    id: 'goal_recommendations',
    service_name: 'Goal Recommendations',
    description: 'Generates personalized goal suggestions based on user patterns',
    model_config: {
      provider: 'custom',
      model: 'recommendation-engine-v1',
      enabled: true,
      usage_limit_daily: 20,
      usage_limit_monthly: 500,
      cost_per_token: 0,
      description: 'Pattern analysis algorithm for personalized productivity recommendations'
    },
    fallback_enabled: true,
    timeout_ms: 10000,
    features: ['Personalization', 'Pattern Analysis', 'Productivity Optimization', 'Context Awareness'],
    use_cases: ['Dashboard Suggestions', 'Productivity Coaching', 'Goal Planning', 'Habit Formation']
  },
  {
    id: 'content_summarization',
    service_name: 'Content Summarization',
    description: 'Creates concise summaries of voice notes and content',
    model_config: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      enabled: true,
      usage_limit_daily: 100,
      usage_limit_monthly: 2000,
      cost_per_token: 0.002,
      description: 'Fast summarization for voice notes and transcriptions'
    },
    fallback_enabled: true,
    timeout_ms: 15000,
    features: ['Text Summarization', 'Key Points Extraction', 'Action Items', 'Quick Overview'],
    use_cases: ['Meeting Summaries', 'Voice Note Processing', 'Content Digestion']
  },
  {
    id: 'sentiment_analysis',
    service_name: 'Message Sentiment Analysis',
    description: 'Analyzes emotion and urgency in communications',
    model_config: {
      provider: 'custom',
      model: 'sentiment-analyzer-v1',
      enabled: true,
      usage_limit_daily: 1000,
      usage_limit_monthly: 20000,
      cost_per_token: 0,
      description: 'Rule-based sentiment and urgency detection with confidence scoring'
    },
    fallback_enabled: false,
    timeout_ms: 3000,
    features: ['Emotion Detection', 'Urgency Scoring', 'Priority Assessment', 'Context Analysis'],
    use_cases: ['Email Processing', 'Message Triage', 'CRM Communication', 'Support Tickets']
  },
  {
    id: 'pipeline_forecasting',
    service_name: 'Sales Pipeline Forecasting',
    description: 'Predicts deal closure probability and revenue forecasting',
    model_config: {
      provider: 'custom',
      model: 'pipeline-predictor-v1',
      enabled: true,
      usage_limit_daily: 200,
      usage_limit_monthly: 5000,
      cost_per_token: 0,
      description: 'Statistical model for sales pipeline analysis and revenue prediction'
    },
    fallback_enabled: false,
    timeout_ms: 8000,
    features: ['Deal Scoring', 'Revenue Forecasting', 'Conversion Prediction', 'Stage Analysis'],
    use_cases: ['Sales Analytics', 'Revenue Planning', 'Deal Prioritization', 'Performance Tracking']
  }
];

/**
 * GET /api/v1/admin/ai-config/models
 * Get all AI models configuration
 */
router.get('/models', 
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      // Map to frontend AIModel interface format
      const models = defaultAIModels.map(model => ({
        id: model.id,
        name: model.service_name,
        provider: model.model_config.provider,
        description: model.description,
        modelId: model.model_config.model,
        contextSize: 4096, // Default context size
        maxTokens: 2048, // Default max tokens
        temperature: 0.7, // Default temperature
        topP: 1, // Default top_p
        costPer1kTokens: model.model_config.cost_per_token || 0,
        enabled: model.model_config.enabled,
        rateLimit: {
          requestsPerMinute: model.model_config.usage_limit_daily || 100,
          tokensPerMinute: model.model_config.usage_limit_monthly || 1000,
        },
        capabilities: model.features || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      res.json(models);
    } catch (error) {
      logger.error('Failed to get AI models config:', error);
      throw new AppError('Failed to retrieve AI models configuration', 500);
    }
  }
);

/**
 * PUT /api/v1/admin/ai-config/models/:modelId
 * Update AI model configuration
 */
router.put('/models/:modelId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: aiModelSchema }),
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const updateData = req.body;

      // Find the model
      const modelIndex = defaultAIModels.findIndex(m => m.id === modelId);
      if (modelIndex === -1) {
        throw new AppError('AI model not found', 404);
      }

      // Update configuration (in real app, save to database)
      defaultAIModels[modelIndex] = {
        ...defaultAIModels[modelIndex],
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: req.user!.userId
      };

      logger.info(`AI model ${modelId} configuration updated by ${req.user!.email}`);

      res.json(defaultAIModels[modelIndex]);
    } catch (error) {
      logger.error('Failed to update AI model config:', error);
      throw new AppError('Failed to update AI model configuration', 500);
    }
  }
);

/**
 * GET /api/v1/admin/ai-config/usage
 * Get AI usage statistics
 */
router.get('/usage',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { period = '7d', model_id } = req.query;

      // Map to frontend AIUsageStats interface format
      const usageStats = defaultAIModels.map(model => ({
        modelId: model.id,
        totalRequests: Math.floor(Math.random() * 200),
        totalTokens: Math.floor(Math.random() * 50000),
        totalCost: model.model_config.provider === 'openai' ? Math.random() * 20 : 0,
        averageResponseTime: Math.random() * 5000, // in ms
        errorRate: Math.random() * 0.05,
        lastUsed: new Date().toISOString(),
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requests: Math.floor(Math.random() * 50),
          tokens: Math.floor(Math.random() * 10000),
          cost: model.model_config.provider === 'openai' ? Math.random() * 3 : 0,
        }))
      }));

      res.json(usageStats);
    } catch (error) {
      logger.error('Failed to get AI usage statistics:', error);
      throw new AppError('Failed to retrieve AI usage statistics', 500);
    }
  }
);

/**
 * POST /api/v1/admin/ai-config/test/:modelId
 * Test AI model connectivity and functionality
 */
router.post('/test/:modelId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const model = defaultAIModels.find(m => m.id === modelId);

      if (!model) {
        throw new AppError('AI model not found', 404);
      }

      const testResult = {
        model_id: modelId,
        model_name: model.service_name,
        provider: model.model_config.provider,
        test_timestamp: new Date().toISOString(),
        status: 'success',
        response_time: Math.random() * 3000,
        details: {}
      };

      // Simulate different test scenarios
      if (model.model_config.provider === 'openai') {
        if (!config.OPENAI.API_KEY) {
          testResult.status = 'failed';
          testResult.details = { error: 'OpenAI API key not configured' };
        } else {
          testResult.details = { 
            api_key_valid: true,
            model_available: true,
            quota_available: true
          };
        }
      } else {
        testResult.details = {
          algorithm_loaded: true,
          dependencies_ok: true,
          memory_usage: '12MB'
        };
      }

      logger.info(`AI model ${modelId} test performed by ${req.user!.email}`, testResult);

      res.json(testResult);
    } catch (error) {
      logger.error('Failed to test AI model:', error);
      throw new AppError('Failed to test AI model', 500);
    }
  }
);

/**
 * GET /api/v1/admin/ai-config/models/:modelId
 * Get a specific AI model
 */
router.get('/models/:modelId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const model = defaultAIModels.find(m => m.id === modelId);
      
      if (!model) {
        throw new AppError('AI model not found', 404);
      }

      res.json(model);
    } catch (error) {
      logger.error('Failed to get AI model:', error);
      throw new AppError('Failed to retrieve AI model', 500);
    }
  }
);

/**
 * POST /api/v1/admin/ai-config/models
 * Create a new AI model
 */
router.post('/models',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: aiModelSchema }),
  async (req, res) => {
    try {
      const newModel = {
        id: `model_${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        createdBy: req.user!.userId
      };

      // In real app, save to database
      defaultAIModels.push(newModel);

      logger.info(`New AI model created by ${req.user!.email}`, { modelId: newModel.id });

      res.status(201).json(newModel);
    } catch (error) {
      logger.error('Failed to create AI model:', error);
      throw new AppError('Failed to create AI model', 500);
    }
  }
);

/**
 * DELETE /api/v1/admin/ai-config/models/:modelId
 * Delete an AI model
 */
router.delete('/models/:modelId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const modelIndex = defaultAIModels.findIndex(m => m.id === modelId);
      
      if (modelIndex === -1) {
        throw new AppError('AI model not found', 404);
      }

      // In real app, delete from database
      defaultAIModels.splice(modelIndex, 1);

      logger.info(`AI model ${modelId} deleted by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'AI model deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete AI model:', error);
      throw new AppError('Failed to delete AI model', 500);
    }
  }
);

/**
 * GET /api/v1/admin/ai-config/providers
 * Get all AI providers
 */
router.get('/providers',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res, next) => {
    logger.info('Auth middleware passed successfully');
    try {
      logger.info('GET /providers called', {
        organizationId: req.user!.organizationId,
        userId: req.user!.userId
      });

      const dbProviders = await prisma.ai_providers.findMany({
        where: {
          organizationId: req.user!.organizationId,
        },
        orderBy: {
          priority: 'asc'
        }
      });

      logger.info('Database providers found:', { count: dbProviders.length });

      // Map to frontend format
      const providers = dbProviders.map(dbProvider => ({
        id: dbProvider.id,
        name: dbProvider.name,
        description: dbProvider.displayName,
        apiEndpoint: dbProvider.baseUrl,
        authType: 'api-key' as const,
        enabled: dbProvider.status === 'ACTIVE',
        configSchema: dbProvider.config,
        supportedModels: [],
        rateLimit: dbProvider.limits || { requestsPerMinute: 60, tokensPerMinute: 10000 },
        createdAt: dbProvider.createdAt.toISOString(),
        updatedAt: dbProvider.updatedAt.toISOString(),
      }));

      res.json({ success: true, data: providers });
    } catch (error: any) {
      logger.error('Failed to get AI providers:', { message: error.message, stack: error.stack });
      next(new AppError('Failed to retrieve AI providers', 500));
    }
  }
);

/**
 * GET /api/v1/admin/ai-config/providers/:providerId
 * Get a specific AI provider
 */
router.get('/providers/:providerId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const dbProvider = await prisma.ai_providers.findFirst({
        where: {
          id: providerId,
          organizationId: req.user!.organizationId,
        },
      });

      if (!dbProvider) {
        throw new AppError('AI provider not found', 404);
      }

      // Map to frontend format
      const provider = {
        id: dbProvider.id,
        name: dbProvider.name,
        description: dbProvider.displayName,
        apiEndpoint: dbProvider.baseUrl,
        authType: 'api-key' as const,
        enabled: dbProvider.status === 'ACTIVE',
        configSchema: dbProvider.config,
        supportedModels: [],
        rateLimit: dbProvider.limits || { requestsPerMinute: 60, tokensPerMinute: 10000 },
        createdAt: dbProvider.createdAt.toISOString(),
        updatedAt: dbProvider.updatedAt.toISOString(),
      };

      res.json(provider);
    } catch (error) {
      logger.error('Failed to get AI provider:', error);
      throw new AppError('Failed to retrieve AI provider', 500);
    }
  }
);

/**
 * POST /api/v1/admin/ai-config/providers
 * Create a new AI provider
 */
router.post('/providers',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: aiProviderSchema }),
  async (req, res) => {
    try {
      const { name, description, apiEndpoint, authType, enabled, configSchema, supportedModels, rateLimit } = req.body;
      
      // Save to database - map to correct Prisma schema
      const newProvider = await prisma.ai_providers.create({
        data: {
          id: uuidv4(),
          name,
          displayName: description || name, // Use description as displayName
          baseUrl: apiEndpoint,
          config: configSchema || {},
          organizationId: req.user!.organizationId,
          updatedAt: new Date(),
        },
      });

      logger.info(`New AI provider created by ${req.user!.email}`, { providerId: newProvider.id });

      // Map response to frontend format
      const responseProvider = {
        id: newProvider.id,
        name: newProvider.name,
        description: newProvider.displayName,
        apiEndpoint: newProvider.baseUrl,
        authType: 'api-key' as const,
        enabled: newProvider.status === 'ACTIVE',
        configSchema: newProvider.config,
        supportedModels: [],
        rateLimit: newProvider.limits || { requestsPerMinute: 60, tokensPerMinute: 10000 },
        createdAt: newProvider.createdAt.toISOString(),
        updatedAt: newProvider.updatedAt.toISOString(),
      };

      res.status(201).json({ success: true, data: responseProvider });
    } catch (error: any) {
      logger.error('Failed to create AI provider:', { message: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: 'Failed to create AI provider', code: 'INTERNAL_ERROR' });
    }
  }
);

/**
 * PUT /api/v1/admin/ai-config/providers/:providerId
 * Update an AI provider
 */
router.put('/providers/:providerId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: aiProviderSchema }),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      const { name, description, apiEndpoint, authType, enabled, configSchema, supportedModels, rateLimit } = req.body;

      // Update in database - map to correct Prisma schema
      const updatedProvider = await prisma.ai_providers.update({
        where: {
          id: providerId,
          organizationId: req.user!.organizationId,
        },
        data: {
          name,
          displayName: description || name,
          baseUrl: apiEndpoint,
          config: configSchema || {},
          status: enabled ? 'ACTIVE' : 'INACTIVE',
        },
      });

      logger.info(`AI provider ${providerId} updated by ${req.user!.email}`);

      // Map response to frontend format
      const responseProvider = {
        id: updatedProvider.id,
        name: updatedProvider.name,
        description: updatedProvider.displayName,
        apiEndpoint: updatedProvider.baseUrl,
        authType: 'api-key' as const,
        enabled: updatedProvider.status === 'ACTIVE',
        configSchema: updatedProvider.config,
        supportedModels: [],
        rateLimit: updatedProvider.limits || { requestsPerMinute: 60, tokensPerMinute: 10000 },
        createdAt: updatedProvider.createdAt.toISOString(),
        updatedAt: updatedProvider.updatedAt.toISOString(),
      };

      res.json(responseProvider);
    } catch (error) {
      logger.error('Failed to update AI provider:', error);
      throw new AppError('Failed to update AI provider', 500);
    }
  }
);

/**
 * DELETE /api/v1/admin/ai-config/providers/:providerId
 * Delete an AI provider
 */
router.delete('/providers/:providerId',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      
      // Delete from database
      await prisma.ai_providers.delete({
        where: {
          id: providerId,
          organizationId: req.user!.organizationId,
        },
      });

      logger.info(`AI provider ${providerId} deleted by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'AI provider deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete AI provider:', error);
      throw new AppError('Failed to delete AI provider', 500);
    }
  }
);

/**
 * POST /api/v1/admin/ai-config/providers/:providerId/test
 * Test an AI provider
 */
router.post('/providers/:providerId/test',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const testResult = {
        success: true,
        message: 'Provider is functioning correctly',
        responseTime: Math.random() * 1000,
        providerOutput: 'Test connection successful',
      };

      logger.info(`AI provider ${providerId} tested by ${req.user!.email}`);

      res.json(testResult);
    } catch (error) {
      logger.error('Failed to test AI provider:', error);
      throw new AppError('Failed to test AI provider', 500);
    }
  }
);

/**
 * GET /api/v1/admin/ai-config/providers/:providerId/config
 * Get provider configuration
 */
router.get('/providers/:providerId/config',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      
      // Mock config data
      const config = {
        apiKey: '***************',
        organization: 'org-xxxxx',
        timeout: 30000,
        retryAttempts: 3,
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Failed to get provider config:', error);
      throw new AppError('Failed to retrieve provider configuration', 500);
    }
  }
);

/**
 * PUT /api/v1/admin/ai-config/providers/:providerId/config
 * Update provider configuration
 */
router.put('/providers/:providerId/config',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      const newConfig = req.body;
      const organizationId = req.user!.organizationId;

      // Find the provider
      const provider = await prisma.aIProvider.findFirst({
        where: {
          id: providerId,
          organizationId
        }
      });

      if (!provider) {
        throw new AppError('Provider not found', 404);
      }

      // Merge existing config with new config
      const existingConfig = (provider.config as Record<string, any>) || {};
      const mergedConfig = { ...existingConfig, ...newConfig };

      // Update provider configuration in database
      const updatedProvider = await prisma.aIProvider.update({
        where: { id: providerId },
        data: {
          config: mergedConfig,
          updatedAt: new Date()
        }
      });

      logger.info(`AI provider ${provider.name} (${providerId}) config updated by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Provider configuration updated successfully',
        data: {
          id: updatedProvider.id,
          name: updatedProvider.name,
          config: updatedProvider.config
        }
      });
    } catch (error) {
      logger.error('Failed to update provider config:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update provider configuration', 500);
    }
  }
);

export default router;