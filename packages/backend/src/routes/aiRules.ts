import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import { RuleProcessingPipeline } from '../services/ai/RuleProcessingPipeline';

const router = Router();

// =============================================================================
// System Rules Definition
// =============================================================================

const SYSTEM_RULES = [
  {
    name: 'CRM Protection',
    description: 'Zawsze przepuszczaj maile od kontaktów i firm z CRM',
    category: 'CLASSIFICATION',
    dataType: 'EMAIL',
    priority: 1000,
    triggerType: 'MESSAGE_RECEIVED' as const,
    triggerConditions: { operator: 'AND', conditions: [] },
    actions: { forceClassification: 'BUSINESS' },
    aiPrompt: null,
  },
  {
    name: 'Newsletter Patterns',
    description: 'Wykrywaj newslettery po wzorcach (unsubscribe, view in browser)',
    category: 'CLASSIFICATION',
    dataType: 'EMAIL',
    priority: 500,
    triggerType: 'MESSAGE_RECEIVED' as const,
    triggerConditions: {
      operator: 'OR',
      conditions: [
        { field: 'body', operator: 'contains', value: 'unsubscribe' },
        { field: 'body', operator: 'contains', value: 'view in browser' },
        { field: 'body', operator: 'contains', value: 'opt-out' },
      ],
    },
    actions: { forceClassification: 'NEWSLETTER', list: { action: 'SUGGEST_BLACKLIST', target: 'DOMAIN' } },
    aiPrompt: null,
  },
  {
    name: 'Auto-Reply Detection',
    description: 'Wykrywaj automatyczne odpowiedzi',
    category: 'CLASSIFICATION',
    dataType: 'EMAIL',
    priority: 500,
    triggerType: 'MESSAGE_RECEIVED' as const,
    triggerConditions: {
      operator: 'OR',
      conditions: [
        { field: 'subject', operator: 'contains', value: 'out of office' },
        { field: 'subject', operator: 'contains', value: 'automatic reply' },
        { field: 'subject', operator: 'contains', value: 'auto-reply' },
        { field: 'subject', operator: 'contains', value: 'automatyczna odpowiedź' },
      ],
    },
    actions: { forceClassification: 'TRANSACTIONAL' },
    aiPrompt: null,
  },
];

/**
 * Seed system rules if they don't exist for this org
 */
async function ensureSystemRules(organizationId: string): Promise<void> {
  for (const rule of SYSTEM_RULES) {
    const exists = await prisma.ai_rules.findFirst({
      where: { organizationId, name: rule.name, isSystem: true },
    });

    if (!exists) {
      await prisma.ai_rules.create({
        data: {
          id: `sys-${rule.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: rule.name,
          description: rule.description,
          category: rule.category,
          dataType: rule.dataType,
          status: 'ACTIVE',
          priority: rule.priority,
          triggerType: rule.triggerType,
          triggerConditions: rule.triggerConditions,
          actions: rule.actions,
          aiPrompt: rule.aiPrompt,
          isSystem: true,
          organizationId,
          executionCount: 0,
          successCount: 0,
          errorCount: 0,
        },
      }).catch((err: any) => {
        // Ignore unique constraint violation (already exists with different ID)
        if (err.code !== 'P2002') {
          logger.warn(`Failed to seed system rule ${rule.name}:`, err.message);
        }
      });
    }
  }
}

// =============================================================================
// Helper: map DB rule to frontend format
// =============================================================================

function mapRuleToFrontend(rule: any): any {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || '',
    category: rule.category || 'CLASSIFICATION',
    dataType: rule.dataType || 'EMAIL',
    status: rule.status,
    enabled: rule.status === 'ACTIVE',
    priority: rule.priority,
    conditions: typeof rule.triggerConditions === 'string'
      ? JSON.parse(rule.triggerConditions)
      : rule.triggerConditions || {},
    actions: typeof rule.actions === 'string'
      ? JSON.parse(rule.actions)
      : rule.actions || {},
    aiPrompt: rule.aiPrompt || '',
    aiModel: rule.modelId || '',
    isSystem: rule.isSystem || false,
    createdBy: rule.createdBy || null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    executionCount: rule.executionCount,
    successCount: rule.successCount,
    errorCount: rule.errorCount,
    successRate: rule.executionCount > 0
      ? Math.round((rule.successCount / rule.executionCount) * 100)
      : 0,
    lastExecuted: rule.lastExecuted?.toISOString() || null,
  };
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/v1/ai-rules
 * List all AI rules (seeds system rules on first call)
 */
router.get('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']),
  async (req, res) => {
    try {
      const orgId = req.user!.organizationId;
      const { category, status, dataType } = req.query;

      // Seed system rules if needed
      await ensureSystemRules(orgId);

      const where: any = { organizationId: orgId };
      if (category) where.category = category;
      if (status) where.status = status;
      if (dataType) where.dataType = dataType;

      const dbRules = await prisma.ai_rules.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      const rules = dbRules.map(mapRuleToFrontend);

      res.json({
        success: true,
        data: rules,
        pagination: { total: rules.length, page: 1, limit: 100, pages: 1 },
      });
    } catch (error) {
      logger.error('Failed to get AI rules:', error);
      throw new AppError('Nie udało się pobrać reguł AI', 500);
    }
  }
);

/**
 * GET /api/v1/ai-rules/:id
 * Get single rule by ID
 */
router.get('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const rule = await prisma.ai_rules.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId },
      });

      if (!rule) throw new AppError('Reguła nie znaleziona', 404);

      res.json({ success: true, data: mapRuleToFrontend(rule) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get AI rule:', error);
      throw new AppError('Nie udało się pobrać reguły', 500);
    }
  }
);

/**
 * POST /api/v1/ai-rules
 * Create a new rule
 */
router.post('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const d = req.body;

      if (!d.name) throw new AppError('Nazwa jest wymagana', 400);

      const dbRule = await prisma.ai_rules.create({
        data: {
          id: `rule-${Date.now()}`,
          name: d.name,
          description: d.description || '',
          category: d.category || 'CLASSIFICATION',
          dataType: d.dataType || 'EMAIL',
          status: d.enabled === false ? 'INACTIVE' : 'ACTIVE',
          priority: d.priority || 100,
          triggerType: d.triggerType || 'MESSAGE_RECEIVED',
          triggerConditions: d.conditions || { operator: 'AND', conditions: [] },
          actions: d.actions || {},
          aiPrompt: d.aiPrompt || null,
          isSystem: false,
          createdBy: req.user!.userId,
          organizationId: req.user!.organizationId,
          executionCount: 0,
          successCount: 0,
          errorCount: 0,
        },
      });

      logger.info(`AI rule created: ${dbRule.name} by ${req.user!.email}`);
      res.status(201).json({ success: true, data: mapRuleToFrontend(dbRule) });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('Reguła o tej nazwie już istnieje', 409);
      }
      if (error instanceof AppError) throw error;
      logger.error('Failed to create AI rule:', error);
      throw new AppError('Nie udało się utworzyć reguły AI', 500);
    }
  }
);

/**
 * PUT /api/v1/ai-rules/:id
 * Update a rule
 */
router.put('/:id',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const d = req.body;

      // Check if system rule
      const existing = await prisma.ai_rules.findFirst({
        where: { id, organizationId: req.user!.organizationId },
      });
      if (!existing) throw new AppError('Reguła nie znaleziona', 404);

      const updateFields: any = {};
      if (d.name !== undefined) updateFields.name = d.name;
      if (d.description !== undefined) updateFields.description = d.description;
      if (d.category !== undefined) updateFields.category = d.category;
      if (d.dataType !== undefined) updateFields.dataType = d.dataType;
      if (d.enabled !== undefined) updateFields.status = d.enabled ? 'ACTIVE' : 'INACTIVE';
      if (d.status !== undefined) updateFields.status = d.status;
      if (d.priority !== undefined) updateFields.priority = d.priority;
      if (d.conditions !== undefined) updateFields.triggerConditions = d.conditions;
      if (d.actions !== undefined) updateFields.actions = d.actions;
      if (d.aiPrompt !== undefined) updateFields.aiPrompt = d.aiPrompt;

      const dbRule = await prisma.ai_rules.update({
        where: { id },
        data: updateFields,
      });

      logger.info(`AI rule updated: ${id} by ${req.user!.email}`);
      res.json({ success: true, data: mapRuleToFrontend(dbRule) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update AI rule:', error);
      throw new AppError('Nie udało się zaktualizować reguły', 500);
    }
  }
);

/**
 * DELETE /api/v1/ai-rules/:id
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if system rule
      const rule = await prisma.ai_rules.findFirst({
        where: { id, organizationId: req.user!.organizationId },
      });
      if (!rule) throw new AppError('Reguła nie znaleziona', 404);
      if (rule.isSystem) throw new AppError('Nie można usunąć reguły systemowej', 403);

      await prisma.ai_rules.delete({ where: { id } });

      logger.info(`AI rule deleted: ${id} by ${req.user!.email}`);
      res.json({ success: true, message: 'Reguła usunięta' });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete AI rule:', error);
      throw new AppError('Nie udało się usunąć reguły', 500);
    }
  }
);

/**
 * POST /api/v1/ai-rules/:id/toggle
 * Toggle rule status (ON/OFF)
 */
router.post('/:id/toggle',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') throw new AppError('enabled musi być boolean', 400);

      const dbRule = await prisma.ai_rules.update({
        where: { id, organizationId: req.user!.organizationId },
        data: { status: enabled ? 'ACTIVE' : 'INACTIVE' },
      });

      res.json({ success: true, data: { id, enabled, updatedAt: dbRule.updatedAt.toISOString() } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to toggle AI rule:', error);
      throw new AppError('Nie udało się zmienić statusu', 500);
    }
  }
);

/**
 * PATCH /api/v1/ai-rules/:id/status
 * Change rule status (ACTIVE/INACTIVE/TESTING)
 */
router.patch('/:id/status',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['ACTIVE', 'INACTIVE', 'TESTING'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Status musi być: ACTIVE, INACTIVE lub TESTING', 400);
      }

      const dbRule = await prisma.ai_rules.update({
        where: { id, organizationId: req.user!.organizationId },
        data: { status },
      });

      res.json({ success: true, data: mapRuleToFrontend(dbRule) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to change rule status:', error);
      throw new AppError('Nie udało się zmienić statusu', 500);
    }
  }
);

/**
 * POST /api/v1/ai-rules/:id/test
 * Test a rule against sample entity data
 */
router.post('/:id/test',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { entityType = 'EMAIL', entityData } = req.body;

      if (!entityData) throw new AppError('entityData jest wymagane', 400);

      const rule = await prisma.ai_rules.findFirst({
        where: { id, organizationId: req.user!.organizationId },
      });
      if (!rule) throw new AppError('Reguła nie znaleziona', 404);

      // Run through the processing pipeline
      const pipeline = new RuleProcessingPipeline(prisma);
      const testEntityId = `test-${Date.now()}`;

      const result = await pipeline.processEntity(
        req.user!.organizationId,
        entityType,
        testEntityId,
        entityData
      );

      // Clean up test processing record
      await prisma.data_processing.deleteMany({
        where: { entityId: testEntityId },
      }).catch(() => {});

      res.json({
        success: true,
        data: {
          ruleId: id,
          ruleName: rule.name,
          testResult: result,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to test AI rule:', error);
      throw new AppError('Nie udało się przetestować reguły', 500);
    }
  }
);

/**
 * GET /api/v1/ai-rules/fields/:module
 * Get available fields for module conditions
 */
router.get('/fields/:module',
  authenticateToken,
  async (req, res) => {
    try {
      const { module } = req.params;

      const moduleFields: Record<string, any[]> = {
        EMAIL: [
          { name: 'from', label: 'Nadawca (email)', type: 'string' },
          { name: 'senderDomain', label: 'Domena nadawcy', type: 'string' },
          { name: 'senderName', label: 'Nazwa nadawcy', type: 'string' },
          { name: 'subject', label: 'Temat', type: 'string' },
          { name: 'body', label: 'Treść', type: 'string' },
          { name: 'bodyHtml', label: 'Treść HTML', type: 'string' },
        ],
        DOCUMENT: [
          { name: 'title', label: 'Tytuł', type: 'string' },
          { name: 'content', label: 'Treść', type: 'string' },
          { name: 'type', label: 'Typ', type: 'enum', options: ['INVOICE', 'CONTRACT', 'OFFER', 'OTHER'] },
        ],
      };

      const fields = moduleFields[module.toUpperCase()] || [];
      res.json({ success: true, data: fields });
    } catch (error) {
      logger.error('Failed to get module fields:', error);
      throw new AppError('Nie udało się pobrać pól', 500);
    }
  }
);

/**
 * GET /api/v1/ai-rules/execution-history/:id
 * Get execution history for a rule (from ai_executions table)
 */
router.get('/execution-history/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = '50' } = req.query;

      const executions = await prisma.ai_executions.findMany({
        where: { ruleId: id },
        orderBy: { executedAt: 'desc' },
        take: Math.min(parseInt(limit as string), 100),
      });

      const history = executions.map(e => ({
        id: e.id,
        ruleId: e.ruleId,
        status: e.status,
        executionTime: e.executionTimeMs,
        timestamp: e.executedAt.toISOString(),
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
        error: e.error,
      }));

      res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Failed to get execution history:', error);
      // Fallback to empty if table doesn't have expected columns
      res.json({ success: true, data: [] });
    }
  }
);

export default router;
