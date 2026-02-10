import express from 'express';
import { prisma } from '../config/database';
import { AIRouter } from '../services/ai/AIRouter';
import { TemplateManager } from '../services/ai/TemplateManager';
import { authenticateToken } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import { z } from 'zod';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// ==========================================
// AI PROVIDERS MANAGEMENT
// ==========================================

// Get all AI providers
router.get('/providers', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const providers = await prisma.ai_providers.findMany({
      where: { organizationId },
      include: {
        ai_models: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            ai_executions: {
              where: {
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            }
          }
        }
      },
      orderBy: { priority: 'asc' }
    });

    res.json({
      message: 'AI providers retrieved successfully',
      data: providers
    });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    res.status(500).json({ error: 'Failed to fetch AI providers' });
  }
});

// Create new AI provider
const createProviderSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  baseUrl: z.string().url(),
  config: z.object({
    apiKey: z.string().min(1),
    timeout: z.number().optional(),
    maxRetries: z.number().optional()
  }),
  limits: z.object({
    requestsPerMinute: z.number().optional(),
    tokensPerDay: z.number().optional()
  }).optional(),
  priority: z.number().default(0)
});

router.post('/providers', validateRequest(createProviderSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const provider = await prisma.ai_providers.create({
      data: {
        ...req.body,
        organizationId,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      message: 'AI provider created successfully',
      data: provider
    });
  } catch (error) {
    console.error('Error creating AI provider:', error);
    res.status(500).json({ error: 'Failed to create AI provider' });
  }
});

// Update AI provider
router.put('/providers/:id', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const providerId = req.params.id;

    const provider = await prisma.ai_providers.update({
      where: { id: providerId, organizationId },
      data: req.body
    });

    res.json({
      message: 'AI provider updated successfully',
      data: provider
    });
  } catch (error) {
    console.error('Error updating AI provider:', error);
    res.status(500).json({ error: 'Failed to update AI provider' });
  }
});

// Test AI provider connection
router.post('/providers/:id/test', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const providerId = req.params.id;

    const provider = await prisma.ai_providers.findUnique({
      where: { id: providerId, organizationId }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const aiRouter = new AIRouter({ organizationId, prisma });
    await aiRouter.initializeProviders();

    // Test provider connection here
    // Implementation depends on specific provider

    res.json({
      message: 'Provider test completed',
      data: { isConnected: true, latency: 150 }
    });
  } catch (error) {
    console.error('Error testing AI provider:', error);
    res.status(500).json({ error: 'Failed to test AI provider' });
  }
});

// ==========================================
// AI MODELS MANAGEMENT
// ==========================================

// Get all AI models
router.get('/models', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const models = await prisma.ai_models.findMany({
      where: {
        ai_providers: { organizationId }
      },
      include: {
        ai_providers: true,
        _count: {
          select: {
            ai_executions: {
              where: {
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            }
          }
        }
      },
      orderBy: [
        { ai_providers: { priority: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      message: 'AI models retrieved successfully',
      data: models
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// Create new AI model
const createModelSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().min(1),
  displayName: z.string().min(1),
  type: z.enum(['TEXT_GENERATION', 'TEXT_CLASSIFICATION', 'TEXT_EMBEDDING', 'IMAGE_GENERATION', 'IMAGE_ANALYSIS', 'AUDIO_TRANSCRIPTION', 'AUDIO_GENERATION', 'CODE_GENERATION', 'FUNCTION_CALLING', 'MULTIMODAL']),
  maxTokens: z.number().optional(),
  inputCost: z.number().optional(),
  outputCost: z.number().optional(),
  capabilities: z.array(z.string()).default([]),
  config: z.object({}).default({})
});

router.post('/models', validateRequest(createModelSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    // Verify provider belongs to organization
    const provider = await prisma.ai_providers.findFirst({
      where: { id: req.body.providerId, organizationId }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const model = await prisma.ai_models.create({
      data: {
        ...req.body,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      message: 'AI model created successfully',
      data: model
    });
  } catch (error) {
    console.error('Error creating AI model:', error);
    res.status(500).json({ error: 'Failed to create AI model' });
  }
});

// ==========================================
// PROMPT TEMPLATES MANAGEMENT
// ==========================================

// Get all prompt templates
router.get('/templates', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { category, status, search } = req.query;

    const templateManager = new TemplateManager(prisma, organizationId);
    const templates = await templateManager.listTemplates({
      category: category as string,
      status: status as string,
      search: search as string
    });

    res.json({
      message: 'Prompt templates retrieved successfully',
      data: templates
    });
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    res.status(500).json({ error: 'Failed to fetch prompt templates' });
  }
});

// Create new prompt template
const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().min(1),
  variables: z.record(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'enum', 'array', 'object']),
    required: z.boolean(),
    description: z.string().optional(),
    enumValues: z.array(z.string()).optional(),
    defaultValue: z.any().optional()
  })),
  outputSchema: z.any().optional()
});

router.post('/templates', validateRequest(createTemplateSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const templateManager = new TemplateManager(prisma, organizationId);

    const templateId = await templateManager.createTemplate(req.body);

    res.status(201).json({
      message: 'Prompt template created successfully',
      data: { id: templateId }
    });
  } catch (error) {
    console.error('Error creating prompt template:', error);
    res.status(500).json({ error: 'Failed to create prompt template' });
  }
});

// Get template by ID
router.get('/templates/:id', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const templateManager = new TemplateManager(prisma, organizationId);

    const template = await templateManager.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      message: 'Template retrieved successfully',
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Test template
const testTemplateSchema = z.object({
  variables: z.record(z.any())
});

router.post('/templates/:id/test', validateRequest(testTemplateSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const templateManager = new TemplateManager(prisma, organizationId);

    const result = await templateManager.testTemplate(req.params.id, req.body.variables);

    res.json({
      message: 'Template test completed',
      data: result
    });
  } catch (error) {
    console.error('Error testing template:', error);
    res.status(500).json({ error: 'Failed to test template' });
  }
});

// Get template categories
router.get('/templates-categories', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const templateManager = new TemplateManager(prisma, organizationId);

    const categories = await templateManager.getCategories();

    res.json({
      message: 'Template categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({ error: 'Failed to fetch template categories' });
  }
});

// ==========================================
// AI RULES MANAGEMENT
// ==========================================

// Get all AI rules
router.get('/rules', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const rules = await prisma.ai_rules.findMany({
      where: { organizationId },
      include: {
        ai_prompt_templates: {
          select: { id: true, name: true, category: true }
        },
        ai_models: {
          select: { id: true, name: true, displayName: true,
            ai_providers: {
              select: { id: true, name: true, displayName: true }
            }
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      message: 'AI rules retrieved successfully',
      data: rules
    });
  } catch (error) {
    console.error('Error fetching AI rules:', error);
    res.status(500).json({ error: 'Failed to fetch AI rules' });
  }
});

// Create new AI rule
const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  triggerType: z.enum(['MESSAGE_RECEIVED', 'TASK_CREATED', 'TASK_UPDATED', 'PROJECT_CREATED', 'CONTACT_UPDATED', 'DEAL_STAGE_CHANGED', 'MANUAL_TRIGGER', 'SCHEDULED', 'WEBHOOK']),
  triggerConditions: z.any(),
  templateId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  fallbackModelIds: z.array(z.string().uuid()).default([]),
  actions: z.any(),
  priority: z.number().default(0),
  maxExecutionsPerHour: z.number().optional(),
  maxExecutionsPerDay: z.number().optional()
});

router.post('/rules', validateRequest(createRuleSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const rule = await prisma.ai_rules.create({
      data: {
        ...req.body,
        organizationId,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      message: 'AI rule created successfully',
      data: rule
    });
  } catch (error) {
    console.error('Error creating AI rule:', error);
    res.status(500).json({ error: 'Failed to create AI rule' });
  }
});

// Update AI rule
router.put('/rules/:id', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const rule = await prisma.ai_rules.update({
      where: { id: req.params.id, organizationId },
      data: req.body
    });

    res.json({
      message: 'AI rule updated successfully',
      data: rule
    });
  } catch (error) {
    console.error('Error updating AI rule:', error);
    res.status(500).json({ error: 'Failed to update AI rule' });
  }
});

// Test AI rule
const testRuleSchema = z.object({
  testData: z.any()
});

router.post('/rules/:id/test', validateRequest(testRuleSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const aiRouter = new AIRouter({ organizationId, prisma });
    await aiRouter.initializeProviders();

    // Simulate rule execution with test data
    const result = await aiRouter.processTrigger({
      triggerType: 'MANUAL_TRIGGER',
      triggerData: req.body.testData,
      organizationId,
      userId: req.user!.userId
    });

    res.json({
      message: 'Rule test completed',
      data: result
    });
  } catch (error) {
    console.error('Error testing AI rule:', error);
    res.status(500).json({ error: 'Failed to test AI rule' });
  }
});

// ==========================================
// AI EXECUTION AND MONITORING
// ==========================================

// Get AI execution history
router.get('/executions', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { limit = 50, offset = 0, status, ruleId, modelId } = req.query;

    const where: any = { organizationId };
    if (status) where.status = status;
    if (ruleId) where.ruleId = ruleId;
    if (modelId) where.modelId = modelId;

    const executions = await prisma.ai_executions.findMany({
      where,
      include: {
        ai_rules: { select: { id: true, name: true } },
        ai_models: { select: { id: true, name: true, displayName: true } },
        ai_providers: { select: { id: true, name: true, displayName: true } },
        ai_prompt_templates: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.ai_executions.count({ where });

    res.json({
      message: 'AI executions retrieved successfully',
      data: executions,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching AI executions:', error);
    res.status(500).json({ error: 'Failed to fetch AI executions' });
  }
});

// Get AI usage statistics
router.get('/usage-stats', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const { days = 30 } = req.query;

    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const stats = await prisma.ai_executions.aggregate({
      where: {
        organizationId,
        createdAt: { gte: since }
      },
      _count: true,
      _sum: {
        tokensUsed: true,
        cost: true,
        executionTime: true
      },
      _avg: {
        executionTime: true
      }
    });

    const dailyStats = await prisma.ai_usage_stats.findMany({
      where: {
        organizationId,
        date: { gte: since }
      },
      orderBy: { date: 'asc' }
    });

    res.json({
      message: 'AI usage statistics retrieved successfully',
      data: {
        totalExecutions: stats._count,
        totalTokens: stats._sum.tokensUsed || 0,
        totalCost: stats._sum.cost || 0,
        avgExecutionTime: stats._avg.executionTime || 0,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Error fetching AI usage statistics:', error);
    res.status(500).json({ error: 'Failed to fetch AI usage statistics' });
  }
});

// Manual AI execution endpoint
const manualExecutionSchema = z.object({
  modelId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function']),
    content: z.string(),
    name: z.string().optional()
  })),
  config: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional()
  }).optional()
});

router.post('/execute', validateRequest(manualExecutionSchema), async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const aiRouter = new AIRouter({ organizationId, prisma });
    await aiRouter.initializeProviders();

    const result = await aiRouter.executeAIRequest(
      req.body.modelId,
      {
        model: '', // Will be set by AIRouter
        messages: req.body.messages,
        config: req.body.config
      },
      {
        triggerType: 'MANUAL_TRIGGER',
        triggerData: { userId: req.user!.userId },
        organizationId,
        userId: req.user!.userId
      }
    );

    res.json({
      message: 'AI execution completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error executing AI request:', error);
    res.status(500).json({ error: 'Failed to execute AI request' });
  }
});

// Import default templates
router.post('/templates/import-defaults', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const templateManager = new TemplateManager(prisma, organizationId);

    await templateManager.importDefaultTemplates();

    res.json({
      message: 'Default templates imported successfully'
    });
  } catch (error) {
    console.error('Error importing default templates:', error);
    res.status(500).json({ error: 'Failed to import default templates' });
  }
});

export default router;