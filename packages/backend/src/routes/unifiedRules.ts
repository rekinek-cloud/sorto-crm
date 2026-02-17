import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { UnifiedRuleType, UnifiedRuleStatus, UnifiedTriggerType, ExecutionStatus } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken } from '../shared/middleware/auth';
import { unifiedRuleEngine } from '../services/UnifiedRuleEngine';
import logger from '../config/logger';

const router = Router();

// 🔥 UNIFIED RULES SYSTEM - Zunifikowane API dla wszystkich typów reguł
// Łączy ProcessingRule, EmailRule, AutoReply, AIRule, SmartMailboxRule w jeden system

// Validation schemas
const UnifiedRuleConditionsSchema = z.object({
  // Email conditions (from EmailRule & ProcessingRule)
  sender: z.string().optional(),
  senderDomain: z.string().optional(),
  senderEmail: z.string().optional(),
  
  // Content conditions
  subject: z.string().optional(),
  subjectContains: z.array(z.string()).optional(),
  subjectPattern: z.string().optional(), // regex
  bodyContains: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  
  // Attachment conditions
  hasAttachment: z.boolean().optional(),
  attachmentTypes: z.array(z.string()).optional(),
  
  // Time conditions (from AutoReply)
  timeRange: z.object({
    start: z.string().optional(), // HH:MM
    end: z.string().optional(),   // HH:MM
    timezone: z.string().optional()
  }).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  
  // Priority/Urgency conditions
  minUrgencyScore: z.number().min(0).max(100).optional(),
  maxUrgencyScore: z.number().min(0).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  
  // Smart Mailbox conditions
  smartMailboxFilters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string(),
    logicOperator: z.enum(['AND', 'OR']).default('AND')
  })).optional(),
  
  // Custom fields
  customFields: z.record(z.any()).optional()
});

const UnifiedRuleActionsSchema = z.object({
  // Task creation (from ProcessingRule)
  createTask: z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    context: z.string().optional(),
    estimatedTime: z.number().optional(),
    dueDate: z.string().optional()
  }).optional(),
  
  // Email categorization (from EmailRule)
  categorize: z.enum(['VIP', 'SPAM', 'INVOICES', 'ARCHIVE', 'UNKNOWN']).optional(),
  skipAIAnalysis: z.boolean().optional(),
  autoArchive: z.boolean().optional(),
  autoDelete: z.boolean().optional(),
  
  // Auto-reply (from AutoReply)
  sendAutoReply: z.object({
    template: z.string(),
    subject: z.string().optional(),
    delay: z.number().min(0).default(0), // minutes
    onlyBusinessHours: z.boolean().default(false)
  }).optional(),
  
  // Forwarding
  forwardTo: z.array(z.string()).optional(), // email addresses
  
  // CRM actions
  updateContact: z.object({
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).optional(),
  
  createDeal: z.object({
    stage: z.string(),
    value: z.number().optional(),
    title: z.string().optional()
  }).optional(),
  
  // AI analysis (from AIRule)
  runAIAnalysis: z.object({
    modelId: z.string().optional(),
    promptTemplate: z.string().optional(),
    analysisType: z.string().optional()
  }).optional(),
  
  // Notifications
  notify: z.object({
    users: z.array(z.string()).optional(),
    channels: z.array(z.string()).optional(),
    message: z.string()
  }).optional(),
  
  // Custom actions
  customActions: z.record(z.any()).optional()
});

const UnifiedRuleCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  ruleType: z.nativeEnum(UnifiedRuleType),
  category: z.string().optional(),
  
  status: z.nativeEnum(UnifiedRuleStatus).default('ACTIVE'),
  priority: z.number().min(0).max(1000).default(0),
  
  triggerType: z.nativeEnum(UnifiedTriggerType),
  triggerEvents: z.array(z.string()).default([]),
  
  conditions: UnifiedRuleConditionsSchema,
  actions: UnifiedRuleActionsSchema,
  
  // Execution settings
  maxExecutionsPerHour: z.number().min(1).max(10000).optional(),
  maxExecutionsPerDay: z.number().min(1).max(100000).optional(),
  cooldownPeriod: z.number().min(0).default(0),
  
  // Schedule
  activeFrom: z.string().optional(), // ISO date
  activeTo: z.string().optional(),   // ISO date
  timezone: z.string().default('UTC'),
  
  // Channel restriction
  channelId: z.string().optional(),
  
  // AI configuration
  aiModelId: z.string().optional(),
  aiPromptTemplate: z.string().optional(),
  fallbackModelIds: z.array(z.string()).default([])
});

const UnifiedRuleUpdateSchema = UnifiedRuleCreateSchema.partial();

// ⚠️ IMPORTANT: Static routes MUST come BEFORE dynamic /:id routes!

// GET /api/v1/unified-rules/stats/overview - Statystyki przeglądu (prawdziwe dane z bazy)
router.get('/stats/overview', async (req: any, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const where: any = organizationId ? { organizationId } : {};

    const rules = await prisma.unified_rules.findMany({ where });
    const totalRules = rules.length;
    const activeRules = rules.filter((r: any) => r.status === 'ACTIVE').length;
    const inactiveRules = totalRules - activeRules;

    // Group by ruleType
    const typeMap: Record<string, number> = {};
    for (const rule of rules) {
      typeMap[rule.ruleType] = (typeMap[rule.ruleType] || 0) + 1;
    }
    const rulesByType = Object.entries(typeMap).map(([ruleType, count]) => ({
      ruleType,
      _count: count,
    }));

    // Executions in last 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const execWhere: any = { createdAt: { gte: since24h } };
    if (organizationId) execWhere.organizationId = organizationId;

    const executions = await prisma.unified_rule_executions.findMany({ where: execWhere });
    const executions24h = executions.length;
    const successCount = executions.filter((e: any) => e.status === 'SUCCESS').length;
    const successRate = executions24h > 0 ? Math.round((successCount / executions24h) * 1000) / 10 : 0;
    const avgExecutionTime = executions24h > 0
      ? Math.round(executions.reduce((sum: number, e: any) => sum + (e.executionTime || 0), 0) / executions24h)
      : 0;

    return res.json({
      success: true,
      data: {
        totalRules,
        activeRules,
        inactiveRules,
        rulesByType,
        executions24h,
        successRate,
        avgExecutionTime,
      },
    });
  } catch (error) {
    console.error('Error fetching unified rules stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rules stats'
    });
  }
});

// GET /api/v1/unified-rules/templates - Szablony reguł
router.get('/templates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const templates = [
      {
        id: 'vip-email-processing',
        name: 'VIP Email Processing',
        description: 'Automatyczne przetwarzanie emaili od VIP kontaktów',
        ruleType: 'PROCESSING',
        category: 'MESSAGE_PROCESSING',
        conditions: {
          senderDomain: 'vipcompany.com',
          priority: 'HIGH'
        },
        actions: {
          createTask: {
            title: 'Respond to VIP email',
            priority: 'HIGH',
            context: '@calls'
          },
          categorize: 'VIP',
          notify: {
            channels: ['email', 'slack'],
            message: 'VIP email received'
          }
        }
      },
      {
        id: 'spam-filter',
        name: 'Spam Email Filter',
        description: 'Automatyczne filtrowanie i usuwanie spamu',
        ruleType: 'EMAIL_FILTER',
        category: 'FILTERING',
        conditions: {
          keywords: ['viagra', 'lottery', 'winner'],
          minUrgencyScore: 0,
          maxUrgencyScore: 20
        },
        actions: {
          categorize: 'SPAM',
          autoDelete: true,
          skipAIAnalysis: true
        }
      },
      {
        id: 'out-of-office-reply',
        name: 'Out of Office Auto-Reply',
        description: 'Automatyczna odpowiedź podczas nieobecności',
        ruleType: 'AUTO_REPLY',
        category: 'COMMUNICATION',
        conditions: {
          timeRange: {
            start: '18:00',
            end: '08:00',
            timezone: 'Europe/Warsaw'
          }
        },
        actions: {
          sendAutoReply: {
            template: 'I am currently out of office. I will respond to your email as soon as possible.',
            subject: 'Out of Office',
            delay: 0
          }
        }
      }
    ];

    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching rule templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rule templates'
    });
  }
});

// GET /api/v1/unified-rules - Lista wszystkich reguł
router.get('/', async (req: any, res) => {
  try {
    const { type, status, category, search, page = '1', limit = '50' } = req.query;
    
    // Build where clause for filtering
    const where: any = {};
    
    if (type && type !== 'ALL') {
      where.ruleType = type;
    }
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Get rules from database
    const [rules, total] = await Promise.all([
      prisma.unified_rules.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: 'desc' },
          { name: 'asc' }
        ],
        include: {
          communication_channels: true,
          ai_models: true
        }
      }),
      prisma.unified_rules.count({ where })
    ]);
    
    return res.json({
      success: true,
      data: {
        rules,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching unified rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rules'
    });
  }
});

// POST /api/v1/unified-rules - Utworzenie nowej reguły
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = UnifiedRuleCreateSchema.parse(req.body);
    
    const rule = await (prisma.unified_rules.create as any)({
      data: {
        ...validatedData,
        organizationId: req.user!.organizationId,
        activeFrom: validatedData.activeFrom ? new Date(validatedData.activeFrom) : null,
        activeTo: validatedData.activeTo ? new Date(validatedData.activeTo) : null,
        createdBy: req.user!.id
      },
      include: {
        communication_channels: true,
        ai_models: true
      }
    });
    
    return res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating unified rule:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to create unified rule',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/v1/unified-rules/:id - Szczegóły reguły
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rule = await prisma.unified_rules.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      },
      include: {
        communication_channels: true,
        ai_models: true,
        unified_rule_executions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { unified_rule_executions: true }
        }
      }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    return res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching unified rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rule'
    });
  }
});

// PUT /api/v1/unified-rules/:id - Aktualizacja reguły
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = UnifiedRuleUpdateSchema.parse(req.body);
    
    const rule = await prisma.unified_rules.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    const updatedRule = await prisma.unified_rules.update({
      where: { id: req.params.id },
      data: {
        ...validatedData,
        activeFrom: validatedData.activeFrom ? new Date(validatedData.activeFrom) : undefined,
        activeTo: validatedData.activeTo ? new Date(validatedData.activeTo) : undefined
      },
      include: {
        communication_channels: true,
        ai_models: true
      }
    });

    return res.json({
      success: true,
      data: updatedRule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error updating unified rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update unified rule'
    });
  }
});

// DELETE /api/v1/unified-rules/:id - Usunięcie reguły
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rule = await prisma.unified_rules.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    await prisma.unified_rules.delete({
      where: { id: req.params.id }
    });
    
    return res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting unified rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete unified rule'
    });
  }
});

// POST /api/v1/unified-rules/:id/toggle - Włącz/wyłącz regułę
router.post('/:id/toggle', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rule = await prisma.unified_rules.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    const newStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    const updatedRule = await prisma.unified_rules.update({
      where: { id: req.params.id },
      data: { status: newStatus },
      include: {
        communication_channels: true,
        ai_models: true
      }
    });

    return res.json({
      success: true,
      data: updatedRule,
      message: `Rule ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling unified rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle unified rule'
    });
  }
});

// POST /api/v1/unified-rules/:id/execute - Ręczne wykonanie reguły
router.post('/:id/execute', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { entityType, entityId, triggerData } = req.body;
    
    const rule = await prisma.unified_rules.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
        status: 'ACTIVE'
      },
      include: {
        ai_models: true,
        communication_channels: true
      }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Active rule not found'
      });
    }
    
    const startTime = Date.now();
    
    try {
      // Wykonaj regułę używając UnifiedRuleEngine
      const executionResult = await unifiedRuleEngine.executeRule(rule, {
        entityType,
        entityId,
        entityData: triggerData,
        triggeredBy: 'manual',
        organizationId: req.user!.organizationId
      });
      
      return res.json({
        success: true,
        data: executionResult,
        message: 'Rule executed successfully'
      });
    } catch (executionError) {
      logger.error('Rule execution failed:', executionError);
      throw executionError;
    }
  } catch (error) {
    console.error('Error executing unified rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute unified rule'
    });
  }
});

// GET /api/v1/unified-rules/:id/executions - Historia wykonań reguły
router.get('/:id/executions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    
    const rule = await prisma.unified_rules.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    
    const [executions, total] = await Promise.all([
      prisma.unified_rule_executions.findMany({
        where: { ruleId: req.params.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.unified_rule_executions.count({
        where: { ruleId: req.params.id }
      })
    ]);
    
    return res.json({
      success: true,
      data: {
        executions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching rule executions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rule executions'
    });
  }
});

// POST /api/v1/unified-rules/process-message - Przetwórz wiadomość przez reguły
router.post('/process-message', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { messageData } = req.body;
    
    if (!messageData || !messageData.id) {
      return res.status(400).json({
        success: false,
        error: 'messageData with id is required'
      });
    }
    
    const results = await unifiedRuleEngine.processMessage(
      messageData,
      req.user!.organizationId
    );
    
    return res.json({
      success: true,
      data: {
        messageId: messageData.id,
        rulesExecuted: results.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error processing message through unified rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process message through unified rules'
    });
  }
});

// POST /api/v1/unified-rules/process-project - Przetwórz projekt przez reguły
router.post('/process-project', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectData } = req.body;
    
    if (!projectData || !projectData.id) {
      return res.status(400).json({
        success: false,
        error: 'projectData with id is required'
      });
    }
    
    const results = await unifiedRuleEngine.processProject(
      projectData,
      req.user!.organizationId
    );
    
    return res.json({
      success: true,
      data: {
        projectId: projectData.id,
        rulesExecuted: results.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error processing project through unified rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process project through unified rules'
    });
  }
});

// POST /api/v1/unified-rules/process-task - Przetwórz zadanie przez reguły
router.post('/process-task', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { taskData } = req.body;
    
    if (!taskData || !taskData.id) {
      return res.status(400).json({
        success: false,
        error: 'taskData with id is required'
      });
    }
    
    const results = await unifiedRuleEngine.processTask(
      taskData,
      req.user!.organizationId
    );
    
    return res.json({
      success: true,
      data: {
        taskId: taskData.id,
        rulesExecuted: results.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error processing task through unified rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process task through unified rules'
    });
  }
});

export default router;
