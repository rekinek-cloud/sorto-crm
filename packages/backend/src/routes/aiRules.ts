import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import { z } from 'zod';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Zod schemas for validation
const ruleConditionSchema = z.object({
  id: z.string(),
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']),
  value: z.string(),
  logicalOperator: z.enum(['AND', 'OR']).optional(),
});

const ruleActionSchema = z.object({
  id: z.string(),
  type: z.enum(['ai-analysis', 'add-tag', 'send-notification', 'create-task', 'update-status', 'custom-webhook']),
  config: z.record(z.any()),
});

const aiRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  module: z.enum(['projects', 'tasks', 'deals', 'contacts', 'communication']),
  component: z.string().optional(),
  trigger: z.enum(['manual', 'automatic', 'both']),
  enabled: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(5),
  conditions: z.array(ruleConditionSchema),
  actions: z.array(ruleActionSchema),
  aiPrompt: z.string().optional(),
  aiModel: z.string().optional(),
});

const updateRuleSchema = aiRuleSchema.partial();

// Helper functions for mapping database fields to frontend format
function mapCategoryToModule(category: string | null): string {
  const mapping: Record<string, string> = {
    'PRODUCTIVITY': 'projects',
    'COMMUNICATION': 'communication',
    'TASKS': 'tasks',
    'DEALS': 'deals',
    'CONTACTS': 'contacts'
  };
  return mapping[category || ''] || 'projects';
}

function mapTriggerType(triggerType: string): string {
  const mapping: Record<string, string> = {
    'MANUAL_TRIGGER': 'manual',
    'SCHEDULED': 'automatic',
    'MESSAGE_RECEIVED': 'automatic',
    'TASK_CREATED': 'automatic',
    'TASK_UPDATED': 'automatic',
    'PROJECT_CREATED': 'automatic',
    'CONTACT_UPDATED': 'automatic',
    'DEAL_STAGE_CHANGED': 'automatic',
    'WEBHOOK': 'automatic'
  };
  return mapping[triggerType] || 'manual';
}

function parseConditions(triggerConditions: any): any[] {
  try {
    if (typeof triggerConditions === 'string') {
      const parsed = JSON.parse(triggerConditions);
      return parsed.conditions || [];
    }
    return triggerConditions?.conditions || [];
  } catch {
    return [];
  }
}

function parseActions(actions: any): any[] {
  try {
    if (typeof actions === 'string') {
      const parsed = JSON.parse(actions);
      // Jeśli parsed to już tablica akcji, zwróć ją
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // Jeśli to stary format (config obiektu), konwertuj
      return [{
        id: 'action-1',
        type: 'ai-analysis',
        config: parsed
      }];
    }
    return Array.isArray(actions) ? actions : [];
  } catch {
    return [];
  }
}

function mapModuleToCategory(module: string): string {
  const mapping: Record<string, string> = {
    'projects': 'PRODUCTIVITY',
    'communication': 'COMMUNICATION', 
    'tasks': 'TASKS',
    'deals': 'DEALS',
    'contacts': 'CONTACTS'
  };
  return mapping[module] || 'PRODUCTIVITY';
}

function mapTriggerToType(trigger: string): string {
  const mapping: Record<string, string> = {
    'manual': 'MANUAL_TRIGGER',
    'automatic': 'SCHEDULED',
    'both': 'MANUAL_TRIGGER' // For now, default to manual since there's no "both" in enum
  };
  return mapping[trigger] || 'MANUAL_TRIGGER';
}

/**
 * GET /api/v1/ai-rules
 * Pobierz wszystkie reguły AI
 */
router.get('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'USER']),
  async (req, res) => {
    try {
      const { module, enabled, trigger } = req.query;

      // Pobierz reguły z bazy danych
      const dbRules = await prisma.aIRule.findMany({
        where: {
          organizationId: req.user!.organizationId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Mapuj do formatu frontendowego
      let rules: any[] = dbRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || '',
        module: mapCategoryToModule(rule.category),
        trigger: mapTriggerType(rule.triggerType),
        enabled: rule.status === 'ACTIVE',
        priority: rule.priority,
        conditions: parseConditions(rule.triggerConditions),
        actions: parseActions(rule.actions),
        aiPrompt: '', // TODO: dodać do schematu bazy
        aiModel: rule.modelId || '',
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        executionCount: rule.executionCount,
        successRate: rule.successCount > 0 ? (rule.successCount / rule.executionCount) * 100 : 0,
        organizationId: rule.organizationId,
        createdBy: req.user!.userId
      }));

      // Apply filters
      if (module) {
        rules = rules.filter(rule => rule.module === module);
      }
      if (enabled !== undefined) {
        rules = rules.filter(rule => rule.enabled === (enabled === 'true'));
      }
      if (trigger) {
        rules = rules.filter(rule => rule.trigger === trigger || rule.trigger === 'both');
      }

      res.json({
        success: true,
        data: rules,
        pagination: {
          total: rules.length,
          page: 1,
          limit: 100,
          pages: 1
        }
      });

    } catch (error) {
      logger.error('Failed to get AI rules:', error);
      throw new AppError('Nie udało się pobrać reguł AI', 500);
    }
  }
);

/**
 * POST /api/v1/ai-rules
 * Utwórz nową regułę AI
 */
router.post('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const ruleData = req.body;

      // Manual validation for POST
      const validationErrors: string[] = [];
      
      if (!ruleData.name || typeof ruleData.name !== 'string') {
        validationErrors.push('name is required and must be a string');
      }
      if (!ruleData.description || typeof ruleData.description !== 'string') {
        validationErrors.push('description is required and must be a string');
      }
      if (!ruleData.module || !['projects', 'tasks', 'deals', 'contacts', 'communication'].includes(ruleData.module)) {
        validationErrors.push('module is required and must be one of: projects, tasks, deals, contacts, communication');
      }
      if (!ruleData.trigger || !['manual', 'automatic', 'both'].includes(ruleData.trigger)) {
        validationErrors.push('trigger is required and must be one of: manual, automatic, both');
      }
      if (ruleData.enabled !== undefined && typeof ruleData.enabled !== 'boolean') {
        validationErrors.push('enabled must be a boolean');
      }
      if (ruleData.priority !== undefined && (typeof ruleData.priority !== 'number' || ruleData.priority < 1 || ruleData.priority > 10)) {
        validationErrors.push('priority must be a number between 1 and 10');
      }
      if (!ruleData.conditions || !Array.isArray(ruleData.conditions)) {
        validationErrors.push('conditions is required and must be an array');
      }
      if (!ruleData.actions || !Array.isArray(ruleData.actions)) {
        validationErrors.push('actions is required and must be an array');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors.map(error => ({ message: error }))
        });
      }
      
      // Map frontend format to database format
      const dbRule = await prisma.aIRule.create({
        data: {
          id: `rule-${Date.now()}`,
          name: ruleData.name,
          description: ruleData.description || '',
          category: mapModuleToCategory(ruleData.module),
          status: ruleData.enabled ? 'ACTIVE' : 'INACTIVE',
          priority: ruleData.priority || 5,
          triggerType: mapTriggerToType(ruleData.trigger),
          triggerConditions: JSON.stringify({
            conditions: ruleData.conditions || []
          }),
          actions: JSON.stringify(ruleData.actions || []),
          modelId: null, // Zawsze null na początku - będzie ustawiony przez walidację
          organizationId: req.user!.organizationId,
          executionCount: 0,
          successCount: 0,
          errorCount: 0
        }
      });

      // Convert back to frontend format
      const newRule = {
        id: dbRule.id,
        name: dbRule.name,
        description: dbRule.description || '',
        module: mapCategoryToModule(dbRule.category),
        trigger: mapTriggerType(dbRule.triggerType),
        enabled: dbRule.status === 'ACTIVE',
        priority: dbRule.priority,
        conditions: parseConditions(dbRule.triggerConditions),
        actions: parseActions(dbRule.actions),
        aiPrompt: ruleData.aiPrompt || '',
        aiModel: dbRule.modelId || '',
        createdAt: dbRule.createdAt.toISOString(),
        updatedAt: dbRule.updatedAt.toISOString(),
        executionCount: dbRule.executionCount,
        successRate: 0,
        organizationId: dbRule.organizationId,
        createdBy: req.user!.userId
      };

      logger.info(`AI rule created in DB: ${newRule.name} by ${req.user!.email}`);

      res.status(201).json({
        success: true,
        data: newRule
      });

    } catch (error) {
      logger.error('Failed to create AI rule:', error);
      throw new AppError('Nie udało się utworzyć reguły AI', 500);
    }
  }
);

/**
 * PUT /api/v1/ai-rules/:id
 * Zaktualizuj regułę AI
 */
router.put('/:id',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Manual validation for partial updates
      const validationErrors: string[] = [];
      
      if (updateData.name !== undefined && typeof updateData.name !== 'string') {
        validationErrors.push('name must be a string');
      }
      if (updateData.description !== undefined && typeof updateData.description !== 'string') {
        validationErrors.push('description must be a string');
      }
      if (updateData.module !== undefined && !['projects', 'tasks', 'deals', 'contacts', 'communication'].includes(updateData.module)) {
        validationErrors.push('module must be one of: projects, tasks, deals, contacts, communication');
      }
      if (updateData.trigger !== undefined && !['manual', 'automatic', 'both'].includes(updateData.trigger)) {
        validationErrors.push('trigger must be one of: manual, automatic, both');
      }
      if (updateData.enabled !== undefined && typeof updateData.enabled !== 'boolean') {
        validationErrors.push('enabled must be a boolean');
      }
      if (updateData.priority !== undefined && (typeof updateData.priority !== 'number' || updateData.priority < 1 || updateData.priority > 10)) {
        validationErrors.push('priority must be a number between 1 and 10');
      }
      if (updateData.conditions !== undefined && !Array.isArray(updateData.conditions)) {
        validationErrors.push('conditions must be an array');
      }
      if (updateData.actions !== undefined && !Array.isArray(updateData.actions)) {
        validationErrors.push('actions must be an array');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors.map(error => ({ message: error }))
        });
      }

      // Prepare update data - only include defined fields
      const updateFields: any = {};
      
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.module !== undefined) updateFields.category = mapModuleToCategory(updateData.module);
      if (updateData.enabled !== undefined) updateFields.status = updateData.enabled ? 'ACTIVE' : 'INACTIVE';
      if (updateData.priority !== undefined) updateFields.priority = updateData.priority;
      if (updateData.trigger !== undefined) updateFields.triggerType = mapTriggerToType(updateData.trigger);
      if (updateData.conditions !== undefined) updateFields.triggerConditions = JSON.stringify({ conditions: updateData.conditions });
      if (updateData.actions !== undefined) updateFields.actions = JSON.stringify(updateData.actions);
      // Validate modelId if provided
      if (updateData.aiModel !== undefined) {
        if (updateData.aiModel && updateData.aiModel !== '') {
          // Check if model exists
          const modelExists = await prisma.aIModel.findFirst({
            where: {
              id: updateData.aiModel,
              organizationId: req.user!.organizationId
            }
          });
          
          if (!modelExists) {
            logger.warn(`Attempted to update rule with non-existent model: ${updateData.aiModel}`);
            // Set to null instead of invalid ID
            updateFields.modelId = null;
          } else {
            updateFields.modelId = updateData.aiModel;
          }
        } else {
          // If empty string or falsy, set to null
          updateFields.modelId = null;
        }
      }

      // Update in database
      const dbRule = await prisma.aIRule.update({
        where: { 
          id,
          organizationId: req.user!.organizationId 
        },
        data: updateFields
      });

      // Convert back to frontend format
      const updatedRule = {
        id: dbRule.id,
        name: dbRule.name,
        description: dbRule.description || '',
        module: mapCategoryToModule(dbRule.category),
        trigger: mapTriggerType(dbRule.triggerType),
        enabled: dbRule.status === 'ACTIVE',
        priority: dbRule.priority,
        conditions: parseConditions(dbRule.triggerConditions),
        actions: parseActions(dbRule.actions),
        aiPrompt: updateData.aiPrompt || '',
        aiModel: dbRule.modelId || '',
        createdAt: dbRule.createdAt.toISOString(),
        updatedAt: dbRule.updatedAt.toISOString(),
        executionCount: dbRule.executionCount,
        successRate: dbRule.successCount > 0 ? (dbRule.successCount / dbRule.executionCount) * 100 : 0,
        organizationId: dbRule.organizationId,
        createdBy: req.user!.userId
      };

      logger.info(`AI rule updated in DB: ${id} by ${req.user!.email}`);

      res.json({
        success: true,
        data: updatedRule
      });

    } catch (error) {
      logger.error('Failed to update AI rule:', error);
      throw new AppError('Nie udało się zaktualizować reguły AI', 500);
    }
  }
);

/**
 * DELETE /api/v1/ai-rules/:id
 * Usuń regułę AI
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Delete from database
      await prisma.aIRule.delete({
        where: { 
          id,
          organizationId: req.user!.organizationId 
        }
      });

      logger.info(`AI rule deleted from DB: ${id} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Reguła została usunięta'
      });

    } catch (error) {
      logger.error('Failed to delete AI rule:', error);
      throw new AppError('Nie udało się usunąć reguły AI', 500);
    }
  }
);

/**
 * POST /api/v1/ai-rules/:id/toggle
 * Włącz/wyłącz regułę AI
 */
router.post('/:id/toggle',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        throw new AppError('Pole enabled musi być boolean', 400);
      }

      // Update status in database
      const dbRule = await prisma.aIRule.update({
        where: { 
          id,
          organizationId: req.user!.organizationId 
        },
        data: {
          status: enabled ? 'ACTIVE' : 'INACTIVE'
        }
      });

      logger.info(`AI rule ${enabled ? 'enabled' : 'disabled'} in DB: ${id} by ${req.user!.email}`);

      res.json({
        success: true,
        data: {
          id,
          enabled,
          updatedAt: dbRule.updatedAt.toISOString()
        }
      });

    } catch (error) {
      logger.error('Failed to toggle AI rule:', error);
      throw new AppError('Nie udało się zmienić statusu reguły AI', 500);
    }
  }
);

/**
 * GET /api/v1/ai-rules/fields/:module
 * Pobierz dostępne pola dla modułu do warunków
 */
router.get('/fields/:module',
  authenticateToken,
  async (req, res) => {
    try {
      const { module } = req.params;

      const moduleFields = {
        projects: [
          { name: 'name', label: 'Nazwa', type: 'string' },
          { name: 'description', label: 'Opis', type: 'string' },
          { name: 'status', label: 'Status', type: 'enum', options: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
          { name: 'priority', label: 'Priorytet', type: 'enum', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
          { name: 'progress', label: 'Postęp (%)', type: 'number' },
          { name: 'budget', label: 'Budżet', type: 'number' },
          { name: 'teamSize', label: 'Rozmiar zespołu', type: 'number' },
          { name: 'endDate', label: 'Data zakończenia', type: 'date' },
          { name: 'createdAt', label: 'Data utworzenia', type: 'date' }
        ],
        tasks: [
          { name: 'title', label: 'Tytuł', type: 'string' },
          { name: 'description', label: 'Opis', type: 'string' },
          { name: 'status', label: 'Status', type: 'enum', options: ['TODO', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED'] },
          { name: 'priority', label: 'Priorytet', type: 'enum', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
          { name: 'estimatedHours', label: 'Szacowane godziny', type: 'number' },
          { name: 'actualHours', label: 'Rzeczywiste godziny', type: 'number' },
          { name: 'dueDate', label: 'Termin', type: 'date' },
          { name: 'context', label: 'Kontekst', type: 'string' }
        ],
        deals: [
          { name: 'clientName', label: 'Nazwa klienta', type: 'string' },
          { name: 'value', label: 'Wartość', type: 'number' },
          { name: 'stage', label: 'Etap', type: 'enum', options: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] },
          { name: 'probability', label: 'Prawdopodobieństwo (%)', type: 'number' },
          { name: 'daysInPipeline', label: 'Dni w pipeline', type: 'number' },
          { name: 'lastContact', label: 'Ostatni kontakt', type: 'date' }
        ],
        contacts: [
          { name: 'firstName', label: 'Imię', type: 'string' },
          { name: 'lastName', label: 'Nazwisko', type: 'string' },
          { name: 'email', label: 'Email', type: 'string' },
          { name: 'company', label: 'Firma', type: 'string' },
          { name: 'position', label: 'Stanowisko', type: 'string' },
          { name: 'status', label: 'Status', type: 'enum', options: ['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER'] },
          { name: 'lastContactDate', label: 'Data ostatniego kontaktu', type: 'date' },
          { name: 'relationshipType', label: 'Typ relacji', type: 'string' }
        ],
        communication: [
          { name: 'type', label: 'Typ', type: 'enum', options: ['email', 'slack', 'teams', 'phone', 'meeting'] },
          { name: 'direction', label: 'Kierunek', type: 'enum', options: ['incoming', 'outgoing'] },
          { name: 'subject', label: 'Temat', type: 'string' },
          { name: 'content', label: 'Treść', type: 'string' },
          { name: 'sender', label: 'Nadawca', type: 'string' },
          { name: 'recipient', label: 'Odbiorca', type: 'string' },
          { name: 'priority', label: 'Priorytet', type: 'enum', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
          { name: 'hasAttachments', label: 'Ma załączniki', type: 'boolean' }
        ]
      };

      const fields = moduleFields[module as keyof typeof moduleFields] || [];

      res.json({
        success: true,
        data: fields
      });

    } catch (error) {
      logger.error('Failed to get module fields:', error);
      throw new AppError('Nie udało się pobrać pól modułu', 500);
    }
  }
);

/**
 * GET /api/v1/ai-rules/execution-history/:id
 * Pobierz historię wykonań reguły
 */
router.get('/execution-history/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Mock history data
      const history = Array.from({ length: Number(limit) }, (_, i) => ({
        id: `exec_${Date.now()}_${i}`,
        ruleId: id,
        triggeredBy: i % 3 === 0 ? 'manual' : 'automatic',
        success: Math.random() > 0.1,
        executionTime: Math.floor(Math.random() * 5000),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        itemId: `item_${i + 1}`,
        module: 'projects',
        aiResponses: Math.floor(Math.random() * 3),
        actionsExecuted: Math.floor(Math.random() * 5),
        error: Math.random() > 0.9 ? 'Przykładowy błąd wykonania' : null
      }));

      res.json({
        success: true,
        data: history,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: 500 // Mock total
        }
      });

    } catch (error) {
      logger.error('Failed to get rule execution history:', error);
      throw new AppError('Nie udało się pobrać historii wykonań', 500);
    }
  }
);

export default router;