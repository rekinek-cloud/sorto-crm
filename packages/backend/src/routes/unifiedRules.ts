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
      prisma.unifiedRule.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: 'desc' },
          { name: 'asc' }
        ],
        include: {
          channel: true,
          aiModel: true
        }
      }),
      prisma.unifiedRule.count({ where })
    ]);
    
    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rules'
    });
  }
});

// GET /api/v1/unified-rules/mock - Lista mockowych reguł (dla testów)
router.get('/mock', async (req: any, res) => {
  try {
    const { type, status, category, search, page = '1', limit = '50' } = req.query;
    
    // Mockowe reguły dla testów
    const mockRules = [
      {
        id: 'rule-1',
        name: 'Auto-zadania z pilnych emaili',
        description: 'Automatycznie tworzy zadania HIGH priority dla wiadomości z słowami "PILNE", "URGENT"',
        ruleType: 'PROCESSING',
        category: 'EMAIL_PROCESSING',
        status: 'ACTIVE',
        priority: 90,
        triggerType: 'EVENT_BASED',
        triggerEvents: ['message_received'],
        conditions: { subjectContains: ['PILNE', 'URGENT'], minUrgencyScore: 80 },
        actions: { createTask: { priority: 'HIGH', context: '@calls' } },
        executionCount: 23,
        successCount: 22,
        errorCount: 1,
        lastExecuted: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackModelIds: []
      },
      {
        id: 'rule-2',
        name: 'Filtr newsletterów',
        description: 'Automatycznie archiwizuje newslettery z pominięciem analizy AI',
        ruleType: 'EMAIL_FILTER',
        category: 'FILTERING',
        status: 'ACTIVE',
        priority: 50,
        triggerType: 'EVENT_BASED',
        triggerEvents: ['message_received'],
        conditions: { subjectContains: ['newsletter', 'unsubscribe'], maxUrgencyScore: 30 },
        actions: { categorize: 'ARCHIVE', skipAIAnalysis: true },
        executionCount: 156,
        successCount: 156,
        errorCount: 0,
        lastExecuted: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackModelIds: []
      },
      {
        id: 'rule-3',
        name: 'Odpowiedź poza godzinami pracy',
        description: 'Auto-odpowiedź wieczorem i w weekendy',
        ruleType: 'AUTO_REPLY',
        category: 'COMMUNICATION',
        status: 'ACTIVE',
        priority: 70,
        triggerType: 'EVENT_BASED',
        triggerEvents: ['message_received'],
        conditions: { timeRange: { start: '18:00', end: '08:00' } },
        actions: { sendAutoReply: { template: 'Dziękuję za wiadomość. Odpowiem w najbliższym dniu roboczym.' } },
        executionCount: 12,
        successCount: 12,
        errorCount: 0,
        lastExecuted: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackModelIds: []
      },
      {
        id: 'rule-4',
        name: 'Analiza pilności projektów',
        description: 'Automatyczna ocena pilności nowych projektów przez AI',
        ruleType: 'AI_RULE',
        category: 'AI_ANALYSIS',
        status: 'ACTIVE',
        priority: 80,
        triggerType: 'EVENT_BASED',
        triggerEvents: ['project_created'],
        conditions: { entityType: 'project', analysisType: 'urgency' },
        actions: { runAIAnalysis: { modelId: 'gpt-4', analysisType: 'urgency' } },
        executionCount: 8,
        successCount: 7,
        errorCount: 1,
        lastExecuted: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackModelIds: []
      },
      {
        id: 'rule-5',
        name: 'VIP Mailbox Organization',
        description: 'Automatyczne sortowanie wiadomości VIP do dedykowanej skrzynki',
        ruleType: 'SMART_MAILBOX',
        category: 'ORGANIZATION',
        status: 'INACTIVE',
        priority: 85,
        triggerType: 'EVENT_BASED',
        triggerEvents: ['message_received'],
        conditions: { smartFilters: [{ name: 'VIP', condition: 'sender=@bigcorp.com' }] },
        actions: { organizeIntoMailbox: { name: 'VIP Klienci', priority: 'HIGH' } },
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
        lastExecuted: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackModelIds: []
      }
    ];

    // Apply filtering
    let filteredRules = mockRules;
    
    if (type && type !== 'ALL') {
      filteredRules = filteredRules.filter(rule => rule.ruleType === type);
    }
    
    if (status && status !== 'ALL') {
      filteredRules = filteredRules.filter(rule => rule.status === status);
    }
    
    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredRules = filteredRules.filter(rule => 
        rule.name.toLowerCase().includes(searchLower) ||
        (rule.description && rule.description.toLowerCase().includes(searchLower))
      );
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const total = filteredRules.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedRules = filteredRules.slice(skip, skip + limitNum);
    
    res.json({
      success: true,
      data: {
        rules: paginatedRules,
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rules'
    });
  }
});

// POST /api/v1/unified-rules - Utworzenie nowej reguły
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = UnifiedRuleCreateSchema.parse(req.body);
    
    const rule = await prisma.unifiedRule.create({
      data: {
        ...validatedData,
        organizationId: req.user!.organizationId,
        activeFrom: validatedData.activeFrom ? new Date(validatedData.activeFrom) : null,
        activeTo: validatedData.activeTo ? new Date(validatedData.activeTo) : null,
        createdBy: req.user!.id
      },
      include: {
        channel: true,
        aiModel: true
      }
    });
    
    res.status(201).json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to create unified rule',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/v1/unified-rules/:id - Szczegóły reguły
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rule = await prisma.unifiedRule.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      },
      include: {
        channel: true,
        aiModel: true,
        executions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { executions: true }
        }
      }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching unified rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rule'
    });
  }
});

// PUT /api/v1/unified-rules/:id - Aktualizacja reguły
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = UnifiedRuleUpdateSchema.parse(req.body);
    
    const rule = await prisma.unifiedRule.findFirst({
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
    
    const updatedRule = await prisma.unifiedRule.update({
      where: { id: req.params.id },
      data: {
        ...validatedData,
        activeFrom: validatedData.activeFrom ? new Date(validatedData.activeFrom) : undefined,
        activeTo: validatedData.activeTo ? new Date(validatedData.activeTo) : undefined
      },
      include: {
        channel: true,
        aiModel: true
      }
    });
    
    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to update unified rule'
    });
  }
});

// DELETE /api/v1/unified-rules/:id - Usunięcie reguły
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rule = await prisma.unifiedRule.findFirst({
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
    
    await prisma.unifiedRule.delete({
      where: { id: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting unified rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete unified rule'
    });
  }
});

// POST /api/v1/unified-rules/:id/toggle - Włącz/wyłącz regułę
router.post('/:id/toggle', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rule = await prisma.unifiedRule.findFirst({
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
    
    const updatedRule = await prisma.unifiedRule.update({
      where: { id: req.params.id },
      data: { status: newStatus },
      include: {
        channel: true,
        aiModel: true
      }
    });
    
    res.json({
      success: true,
      data: updatedRule,
      message: `Rule ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling unified rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle unified rule'
    });
  }
});

// POST /api/v1/unified-rules/:id/execute - Ręczne wykonanie reguły
router.post('/:id/execute', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { entityType, entityId, triggerData } = req.body;
    
    const rule = await prisma.unifiedRule.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
        status: 'ACTIVE'
      },
      include: {
        aiModel: true,
        channel: true
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
      
      res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to execute unified rule'
    });
  }
});

// GET /api/v1/unified-rules/:id/executions - Historia wykonań reguły
router.get('/:id/executions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    
    const rule = await prisma.unifiedRule.findFirst({
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
      prisma.unifiedRuleExecution.findMany({
        where: { ruleId: req.params.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.unifiedRuleExecution.count({
        where: { ruleId: req.params.id }
      })
    ]);
    
    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule executions'
    });
  }
});

// GET /api/v1/unified-rules/stats/overview - Statystyki przeglądu
router.get('/stats/overview', async (req: any, res) => {
  try {
    // Mockowe dane dla testów - pozwala na przetestowanie frontend bez bazy danych
    const mockStats = {
      totalRules: 9,
      activeRules: 6,
      inactiveRules: 3,
      rulesByType: [
        { ruleType: 'PROCESSING', _count: 3 },
        { ruleType: 'EMAIL_FILTER', _count: 2 },
        { ruleType: 'AUTO_REPLY', _count: 2 },
        { ruleType: 'AI_RULE', _count: 1 },
        { ruleType: 'SMART_MAILBOX', _count: 1 }
      ],
      executions24h: 47,
      successRate: 97.8,
      avgExecutionTime: 189
    };
    
    res.json({
      success: true,
      data: mockStats,
      message: 'TEMP: Using mock data for frontend testing'
    });
  } catch (error) {
    console.error('Error fetching unified rules stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unified rules stats'
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
    
    res.json({
      success: true,
      data: {
        messageId: messageData.id,
        rulesExecuted: results.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error processing message through unified rules:', error);
    res.status(500).json({
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
    
    res.json({
      success: true,
      data: {
        projectId: projectData.id,
        rulesExecuted: results.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error processing project through unified rules:', error);
    res.status(500).json({
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
    
    res.json({
      success: true,
      data: {
        taskId: taskData.id,
        rulesExecuted: results.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error processing task through unified rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process task through unified rules'
    });
  }
});

// GET /api/v1/unified-rules/stats/overview-test - Statystyki przeglądu (TEST - bez autoryzacji)
router.get('/stats/overview-test', async (req, res) => {
  try {
    // Mockowe dane dla testów
    const mockStats = {
      totalRules: 5,
      activeRules: 3,
      inactiveRules: 2,
      rulesByType: [
        { ruleType: 'PROCESSING', _count: 2 },
        { ruleType: 'EMAIL_FILTER', _count: 1 },
        { ruleType: 'AUTO_REPLY', _count: 1 },
        { ruleType: 'AI_ANALYSIS', _count: 1 }
      ],
      executions24h: 24,
      successRate: 95.5,
      avgExecutionTime: 234
    };
    
    res.json({
      success: true,
      data: mockStats,
      message: 'TEST ENDPOINT - Mock data for development'
    });
  } catch (error) {
    console.error('Error in test stats endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test stats'
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
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching rule templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule templates'
    });
  }
});

export default router;