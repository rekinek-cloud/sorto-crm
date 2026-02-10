/**
 * Custom Fields Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CustomFieldType, EntityType } from '@prisma/client';
import { authenticateToken as authMiddleware } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

// Validation schemas
const createFieldSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  fieldType: z.nativeEnum(CustomFieldType),
  entityType: z.nativeEnum(EntityType),
  isRequired: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  showInList: z.boolean().optional(),
  showInCard: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  validation: z.record(z.any()).optional(),
  defaultValue: z.string().optional(),
  sortOrder: z.number().optional(),
});

const updateFieldSchema = createFieldSchema.partial().omit({ name: true, entityType: true });

const setValuesSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.nativeEnum(EntityType),
  values: z.record(z.any()),
});

/**
 * GET /api/v1/custom-fields
 * Get all custom field definitions
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // CustomFieldDefinition model not yet in schema - return empty for now
    res.json({ definitions: [] });
  } catch (error) {
    logger.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

/**
 * GET /api/v1/custom-fields/:id
 * Get a single custom field definition
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const definition = await customFieldsService.getDefinition(id, organizationId);

    if (!definition) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    res.json({ definition });
  } catch (error) {
    logger.error('Error fetching custom field:', error);
    res.status(500).json({ error: 'Failed to fetch custom field' });
  }
});

/**
 * POST /api/v1/custom-fields
 * Create a new custom field definition
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    // Check feature access
    const featureCheck = await subscriptionService.checkFeature(organizationId, 'customFields');
    if (!featureCheck.allowed) {
      return res.status(403).json({ error: featureCheck.message });
    }

    const validation = createFieldSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const definition = await customFieldsService.createDefinition(organizationId, validation.data);
    res.status(201).json({ definition });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A field with this name already exists' });
    }
    logger.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

/**
 * PUT /api/v1/custom-fields/:id
 * Update a custom field definition
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const validation = updateFieldSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const existing = await customFieldsService.getDefinition(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    const definition = await customFieldsService.updateDefinition(id, organizationId, validation.data);
    res.json({ definition });
  } catch (error) {
    logger.error('Error updating custom field:', error);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

/**
 * DELETE /api/v1/custom-fields/:id
 * Delete a custom field definition
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const existing = await customFieldsService.getDefinition(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    await customFieldsService.deleteDefinition(id, organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting custom field:', error);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

/**
 * POST /api/v1/custom-fields/reorder
 * Reorder custom fields
 */
router.post('/reorder', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { entityType, fieldIds } = req.body;

    if (!entityType || !Array.isArray(fieldIds)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    await customFieldsService.reorderFields(organizationId, entityType, fieldIds);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error reordering custom fields:', error);
    res.status(500).json({ error: 'Failed to reorder custom fields' });
  }
});

/**
 * GET /api/v1/custom-fields/values/:entityType/:entityId
 * Get custom field values for an entity
 */
router.get('/values/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const values = await customFieldsService.getValues(entityId, entityType as EntityType);
    res.json({ values });
  } catch (error) {
    logger.error('Error fetching custom field values:', error);
    res.status(500).json({ error: 'Failed to fetch values' });
  }
});

/**
 * POST /api/v1/custom-fields/values
 * Set custom field values for an entity
 */
router.post('/values', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    const validation = setValuesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { entityId, entityType, values } = validation.data;

    await customFieldsService.setValues(organizationId, entityId, entityType, values);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error setting custom field values:', error);
    res.status(500).json({ error: 'Failed to set values' });
  }
});

/**
 * GET /api/v1/custom-fields/types
 * Get available field types
 */
router.get('/types/list', authMiddleware, async (req: Request, res: Response) => {
  const types = Object.values(CustomFieldType).map((type) => ({
    value: type,
    label: type.replace(/_/g, ' '),
    description: getFieldTypeDescription(type),
  }));

  res.json({ types });
});

/**
 * GET /api/v1/custom-fields/entities
 * Get available entity types
 */
router.get('/entities/list', authMiddleware, async (req: Request, res: Response) => {
  const entities = Object.values(EntityType).map((type) => ({
    value: type,
    label: type.charAt(0) + type.slice(1).toLowerCase(),
  }));

  res.json({ entities });
});

function getFieldTypeDescription(type: CustomFieldType): string {
  const descriptions: Record<CustomFieldType, string> = {
    TEXT: 'Single line text input',
    TEXTAREA: 'Multi-line text input',
    NUMBER: 'Numeric value',
    CURRENCY: 'Money value with currency',
    DATE: 'Date picker',
    DATETIME: 'Date and time picker',
    BOOLEAN: 'Yes/No toggle',
    SELECT: 'Dropdown with single selection',
    MULTISELECT: 'Dropdown with multiple selections',
    URL: 'Web address',
    EMAIL: 'Email address',
    PHONE: 'Phone number',
    FILE: 'File attachment',
    USER: 'Reference to a user',
    CONTACT: 'Reference to a contact',
    COMPANY: 'Reference to a company',
  };

  return descriptions[type] || '';
}

export default router;
