import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import { RuleProcessingPipeline } from '../services/ai/RuleProcessingPipeline';
import { seedFlowAnalysisRules } from '../seeds/seedFlowAnalysisRules';

const router = Router();

// Valid categories and data types
const VALID_CATEGORIES = ['CLASSIFICATION', 'ROUTING', 'EXTRACTION', 'INDEXING', 'FLOW_ANALYSIS'];
const VALID_DATA_TYPES = [
  'EMAIL', 'DOCUMENT', 'OFFER', 'ALL',
  'QUICK_CAPTURE', 'MEETING_NOTES', 'PHONE_CALL', 'IDEA',
  'BILL_INVOICE', 'ARTICLE', 'VOICE_MEMO', 'PHOTO', 'OTHER',
];

// =============================================================================
// System Rules Definition
// =============================================================================

const SYSTEM_RULES: Array<{
  name: string;
  description: string;
  category: string;
  dataType: string;
  priority: number;
  triggerType: 'MESSAGE_RECEIVED';
  triggerConditions: any;
  actions: any;
  aiPrompt: string | null;
}> = [
  {
    name: 'CRM Protection',
    description: 'Zawsze przepuszczaj maile od kontaktów i firm z CRM',
    category: 'CLASSIFICATION',
    dataType: 'EMAIL',
    priority: 1000,
    triggerType: 'MESSAGE_RECEIVED',
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
    triggerType: 'MESSAGE_RECEIVED',
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
    triggerType: 'MESSAGE_RECEIVED',
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
          updatedAt: new Date(),
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
    aiSystemPrompt: rule.aiSystemPrompt || '',
    aiModel: rule.modelId || '',
    aiModelName: rule.ai_models?.name || '',
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
        include: { ai_models: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      const rules = dbRules.map(mapRuleToFrontend);

      return res.json({
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
        include: { ai_models: true },
      });

      if (!rule) throw new AppError('Reguła nie znaleziona', 404);

      return res.json({ success: true, data: mapRuleToFrontend(rule) });
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
          aiSystemPrompt: d.aiSystemPrompt || null,
          modelId: d.modelId || null,
          isSystem: false,
          createdBy: req.user!.id,
          organizationId: req.user!.organizationId,
          executionCount: 0,
          successCount: 0,
          errorCount: 0,
          updatedAt: new Date(),
        },
      });

      logger.info(`AI rule created: ${dbRule.name} by ${req.user!.email}`);
      return res.status(201).json({ success: true, data: mapRuleToFrontend(dbRule) });
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
 * POST /api/v1/ai-rules/seed-flow-rules
 * Seed Flow Analysis rules with per-source-type prompts + Qwen provider
 * Idempotent — skips rules that already exist
 */
router.post('/seed-flow-rules',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const orgId = req.user!.organizationId;
      const result = await seedFlowAnalysisRules(prisma, orgId);

      logger.info(`Flow analysis rules seeded by ${req.user!.email}: ${result.rulesCreated} rules, ${result.modelsCreated} models`);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to seed flow analysis rules:', error);
      return res.status(500).json({
        success: false,
        error: 'Nie udało się utworzyć reguł Flow Analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/v1/ai-rules/seed-triage
 * Seed email triage rules (3-layer filtering).
 * Idempotent — skips rules that already exist by name.
 */
router.post('/seed-triage',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const orgId = req.user!.organizationId;

      const TRIAGE_RULES = [
        // Layer 1: High-priority filtering
        {
          name: 'Noreply / System Senders',
          description: 'Blokuj maile od noreply, mailer-daemon, system — klasyfikuj jako TRANSACTIONAL',
          priority: 900,
          triggerConditions: {
            operator: 'OR',
            conditions: [
              { field: 'from', operator: 'contains', value: 'noreply@' },
              { field: 'from', operator: 'contains', value: 'no-reply@' },
              { field: 'from', operator: 'contains', value: 'mailer-daemon@' },
              { field: 'from', operator: 'contains', value: 'system@' },
              { field: 'from', operator: 'contains', value: 'donotreply@' },
              { field: 'from', operator: 'contains', value: 'notifications@' },
              { field: 'from', operator: 'contains', value: 'alert@' },
            ],
          },
          actions: { forceClassification: 'TRANSACTIONAL' },
        },
        {
          name: 'Newsletter Prefix Senders',
          description: 'Klasyfikuj maile od newsletter@, marketing@, promo@ jako NEWSLETTER',
          priority: 850,
          triggerConditions: {
            operator: 'OR',
            conditions: [
              { field: 'from', operator: 'contains', value: 'newsletter@' },
              { field: 'from', operator: 'contains', value: 'news@' },
              { field: 'from', operator: 'contains', value: 'marketing@' },
              { field: 'from', operator: 'contains', value: 'promo@' },
              { field: 'from', operator: 'contains', value: 'info@' },
            ],
          },
          actions: { forceClassification: 'NEWSLETTER', list: { action: 'SUGGEST_BLACKLIST', target: 'DOMAIN' } },
        },
        {
          name: 'Invoices & Logistics',
          description: 'Faktura, proforma, płatność, zamówienie, tracking → TRANSACTIONAL',
          priority: 800,
          triggerConditions: {
            operator: 'OR',
            conditions: [
              { field: 'subject', operator: 'regex', value: 'faktur|invoice|rachunek|proforma|płatnoś|payment|zamówienie\\s*nr|order\\s*confirm|tracking|przesyłk|shipment|paczk' },
            ],
          },
          actions: { forceClassification: 'TRANSACTIONAL' },
        },
        {
          name: 'Auto-Replies & OOO',
          description: 'Out of office, auto-reply, nieobecność → TRANSACTIONAL',
          priority: 750,
          triggerConditions: {
            operator: 'OR',
            conditions: [
              { field: 'subject', operator: 'contains', value: 'out of office' },
              { field: 'subject', operator: 'contains', value: 'auto-reply' },
              { field: 'subject', operator: 'contains', value: 'automatyczna odpowiedź' },
              { field: 'subject', operator: 'contains', value: 'nieobecność' },
              { field: 'subject', operator: 'contains', value: 'automatic reply' },
              { field: 'subject', operator: 'contains', value: 'autoresponder' },
            ],
          },
          actions: { forceClassification: 'TRANSACTIONAL' },
        },
        // Layer 3: Buying intent
        {
          name: 'Buying Intent / Inquiry',
          description: 'Zapytanie, wycena, oferta, cennik, wymiary → BUSINESS',
          priority: 500,
          triggerConditions: {
            operator: 'OR',
            conditions: [
              { field: 'body', operator: 'regex', value: 'zapytanie|wycen|ofert|cennik|interesuj|inquiry|quote|pricing|\\d+\\s*[x×]\\s*\\d+|\\d+\\s*szt|zamówi|order|zleceni' },
              { field: 'subject', operator: 'regex', value: 'zapytanie|wycen|ofert|cennik|inquiry|quote|pricing|zamówieni|zleceni' },
            ],
          },
          actions: { forceClassification: 'BUSINESS' },
        },
        {
          name: 'Complaint / Issue',
          description: 'Reklamacja, problem, nie działa, zwrot → BUSINESS + HIGH priority',
          priority: 450,
          triggerConditions: {
            operator: 'OR',
            conditions: [
              { field: 'body', operator: 'contains', value: 'reklamacj' },
              { field: 'body', operator: 'contains', value: 'complaint' },
              { field: 'body', operator: 'contains', value: 'problem z' },
              { field: 'body', operator: 'contains', value: 'nie działa' },
              { field: 'body', operator: 'contains', value: 'zwrot' },
              { field: 'subject', operator: 'contains', value: 'reklamacj' },
              { field: 'subject', operator: 'contains', value: 'complaint' },
            ],
          },
          actions: { forceClassification: 'BUSINESS', setPriority: 'HIGH' },
        },
      ];

      let created = 0;
      let skipped = 0;

      for (const rule of TRIAGE_RULES) {
        const exists = await prisma.ai_rules.findFirst({
          where: { organizationId: orgId, name: rule.name },
        });
        if (exists) {
          skipped++;
          continue;
        }

        await prisma.ai_rules.create({
          data: {
            id: `triage-${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
            name: rule.name,
            description: rule.description,
            category: 'CLASSIFICATION',
            dataType: 'EMAIL',
            status: 'ACTIVE',
            priority: rule.priority,
            triggerType: 'MESSAGE_RECEIVED',
            triggerConditions: rule.triggerConditions,
            actions: rule.actions,
            isSystem: false,
            organizationId: orgId,
            createdBy: req.user!.id,
            executionCount: 0,
            successCount: 0,
            errorCount: 0,
            updatedAt: new Date(),
          },
        });
        created++;
      }

      logger.info(`Triage rules seeded by ${req.user!.email}: ${created} created, ${skipped} skipped`);

      return res.json({
        success: true,
        data: { created, skipped, total: TRIAGE_RULES.length },
        message: `Utworzono ${created} reguł triage (pominięto ${skipped} istniejących)`,
      });
    } catch (error) {
      logger.error('Failed to seed triage rules:', error);
      return res.status(500).json({
        success: false,
        error: 'Nie udało się utworzyć reguł triage',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
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
      if (d.aiSystemPrompt !== undefined) updateFields.aiSystemPrompt = d.aiSystemPrompt;
      if (d.modelId !== undefined) {
        let resolvedModelId = d.modelId || null;
        // If modelId looks like a name (not UUID), resolve to UUID
        if (resolvedModelId && !resolvedModelId.match(/^[0-9a-f]{8}-/)) {
          const model = await prisma.ai_models.findFirst({
            where: { name: resolvedModelId },
          });
          resolvedModelId = model?.id || null;
        }
        updateFields.modelId = resolvedModelId;
      }
      updateFields.updatedAt = new Date();

      const dbRule = await prisma.ai_rules.update({
        where: { id },
        data: updateFields,
        include: { ai_models: true },
      });

      logger.info(`AI rule updated: ${id} by ${req.user!.email}`);
      return res.json({ success: true, data: mapRuleToFrontend(dbRule) });
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
      return res.json({ success: true, message: 'Reguła usunięta' });
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
        data: { status: enabled ? 'ACTIVE' : 'INACTIVE', updatedAt: new Date() },
      });

      return res.json({ success: true, data: { id, enabled, updatedAt: dbRule.updatedAt.toISOString() } });
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
        data: { status, updatedAt: new Date() },
      });

      return res.json({ success: true, data: mapRuleToFrontend(dbRule) });
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

      return res.json({
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
      return res.json({ success: true, data: fields });
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
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 100),
      });

      const history = executions.map(e => ({
        id: e.id,
        ruleId: e.ruleId,
        status: e.status,
        executionTime: e.executionTime,
        timestamp: e.createdAt.toISOString(),
        tokensUsed: e.tokensUsed,
        cost: e.cost,
        error: e.errorMessage,
      }));

      return res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Failed to get execution history:', error);
      // Fallback to empty if table doesn't have expected columns
      return res.json({ success: true, data: [] });
    }
  }
);

export default router;
