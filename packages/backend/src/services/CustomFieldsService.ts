/**
 * CustomFieldsService - Manages custom field definitions and values
 */

import { prisma } from '../config/database';
import logger from '../config/logger';

// These types are not yet in the Prisma schema - define locally
type CustomFieldType = 'TEXT' | 'TEXTAREA' | 'URL' | 'EMAIL' | 'PHONE' | 'SELECT' | 'NUMBER' | 'CURRENCY' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'MULTISELECT' | 'FILE' | 'USER' | 'CONTACT' | 'COMPANY';
type EntityType = string;
type CustomFieldDefinition = any;
type CustomFieldValue = any;

// Cast prisma for models not yet in schema
const prismaAny = prisma as any;

export interface CustomFieldInput {
  name: string;
  label: string;
  description?: string;
  fieldType: CustomFieldType;
  entityType: EntityType;
  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  showInList?: boolean;
  showInCard?: boolean;
  options?: string[];
  validation?: Record<string, any>;
  defaultValue?: string;
  sortOrder?: number;
}

export interface CustomFieldValueInput {
  fieldId: string;
  entityId: string;
  entityType: EntityType;
  value: any;
}

export class CustomFieldsService {
  /**
   * Get all custom field definitions for an organization
   */
  async getDefinitions(
    organizationId: string,
    entityType?: EntityType
  ): Promise<CustomFieldDefinition[]> {
    return prismaAny.customFieldDefinition.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(entityType && { entityType }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a single custom field definition
   */
  async getDefinition(id: string, organizationId: string): Promise<CustomFieldDefinition | null> {
    return prismaAny.customFieldDefinition.findFirst({
      where: { id, organizationId },
    });
  }

  /**
   * Create a new custom field definition
   */
  async createDefinition(
    organizationId: string,
    input: CustomFieldInput
  ): Promise<CustomFieldDefinition> {
    // Sanitize name to be a valid identifier
    const sanitizedName = input.name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');

    const definition = await prismaAny.customFieldDefinition.create({
      data: {
        organizationId,
        name: sanitizedName,
        label: input.label,
        description: input.description,
        fieldType: input.fieldType,
        entityType: input.entityType,
        isRequired: input.isRequired ?? false,
        isSearchable: input.isSearchable ?? true,
        isFilterable: input.isFilterable ?? true,
        showInList: input.showInList ?? false,
        showInCard: input.showInCard ?? true,
        options: input.options || [],
        validation: input.validation || {},
        defaultValue: input.defaultValue,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    logger.info(`Created custom field "${input.label}" for organization ${organizationId}`);
    return definition;
  }

  /**
   * Update a custom field definition
   */
  async updateDefinition(
    id: string,
    organizationId: string,
    input: Partial<CustomFieldInput>
  ): Promise<CustomFieldDefinition> {
    const definition = await prismaAny.customFieldDefinition.update({
      where: { id },
      data: {
        ...(input.label && { label: input.label }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
        ...(input.isSearchable !== undefined && { isSearchable: input.isSearchable }),
        ...(input.isFilterable !== undefined && { isFilterable: input.isFilterable }),
        ...(input.showInList !== undefined && { showInList: input.showInList }),
        ...(input.showInCard !== undefined && { showInCard: input.showInCard }),
        ...(input.options && { options: input.options }),
        ...(input.validation && { validation: input.validation }),
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });

    logger.info(`Updated custom field ${id}`);
    return definition;
  }

  /**
   * Delete a custom field definition (soft delete)
   */
  async deleteDefinition(id: string, organizationId: string): Promise<void> {
    await prismaAny.customFieldDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Deleted custom field ${id}`);
  }

  /**
   * Get custom field values for an entity
   */
  async getValues(entityId: string, entityType: EntityType): Promise<Record<string, any>> {
    const values = await prismaAny.customFieldValue.findMany({
      where: { entityId, entityType },
      include: { field: true },
    });

    const result: Record<string, any> = {};
    for (const value of values) {
      result[value.field.name] = this.extractValue(value);
    }

    return result;
  }

  /**
   * Set custom field values for an entity
   */
  async setValues(
    organizationId: string,
    entityId: string,
    entityType: EntityType,
    values: Record<string, any>
  ): Promise<void> {
    // Get field definitions
    const definitions = await this.getDefinitions(organizationId, entityType);
    const fieldMap = new Map(definitions.map((d) => [d.name, d]));

    for (const [fieldName, value] of Object.entries(values)) {
      const definition = fieldMap.get(fieldName);
      if (!definition) continue;

      await this.setValue({
        fieldId: definition.id,
        entityId,
        entityType,
        value,
      });
    }
  }

  /**
   * Set a single custom field value
   */
  async setValue(input: CustomFieldValueInput): Promise<CustomFieldValue> {
    const { fieldId, entityId, entityType, value } = input;

    const field = await prismaAny.customFieldDefinition.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new Error('Field not found');
    }

    const valueData = this.prepareValueData(field.fieldType, value);

    return prismaAny.customFieldValue.upsert({
      where: {
        fieldId_entityId: { fieldId, entityId },
      },
      update: valueData,
      create: {
        fieldId,
        entityId,
        entityType,
        ...valueData,
      },
    });
  }

  /**
   * Delete a custom field value
   */
  async deleteValue(fieldId: string, entityId: string): Promise<void> {
    await prismaAny.customFieldValue.deleteMany({
      where: { fieldId, entityId },
    });
  }

  /**
   * Get entities with custom field filters
   */
  async filterByCustomFields(
    organizationId: string,
    entityType: EntityType,
    filters: Record<string, any>
  ): Promise<string[]> {
    const conditions: any[] = [];

    for (const [fieldName, filterValue] of Object.entries(filters)) {
      const field = await prismaAny.customFieldDefinition.findFirst({
        where: { organizationId, entityType, name: fieldName, isFilterable: true },
      });

      if (!field) continue;

      const valueCondition = this.buildFilterCondition(field.fieldType, filterValue);
      if (valueCondition) {
        conditions.push({
          fieldId: field.id,
          ...valueCondition,
        });
      }
    }

    if (conditions.length === 0) return [];

    const results = await prismaAny.customFieldValue.findMany({
      where: {
        entityType,
        OR: conditions,
      },
      select: { entityId: true },
      distinct: ['entityId'],
    });

    return results.map((r: any) => r.entityId);
  }

  /**
   * Reorder custom fields
   */
  async reorderFields(
    organizationId: string,
    entityType: EntityType,
    fieldIds: string[]
  ): Promise<void> {
    const updates = fieldIds.map((id, index) =>
      prismaAny.customFieldDefinition.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);
    logger.info(`Reordered ${fieldIds.length} custom fields for ${entityType}`);
  }

  // Helper methods

  private extractValue(value: CustomFieldValue): any {
    if (value.textValue !== null) return value.textValue;
    if (value.numberValue !== null) return value.numberValue;
    if (value.booleanValue !== null) return value.booleanValue;
    if (value.dateValue !== null) return value.dateValue;
    if (value.jsonValue !== null) return value.jsonValue;
    return null;
  }

  private prepareValueData(
    fieldType: CustomFieldType,
    value: any
  ): Partial<CustomFieldValue> {
    const data: Partial<CustomFieldValue> = {
      textValue: null,
      numberValue: null,
      booleanValue: null,
      dateValue: null,
      jsonValue: null,
    };

    if (value === null || value === undefined) return data;

    switch (fieldType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'URL':
      case 'EMAIL':
      case 'PHONE':
      case 'SELECT':
        data.textValue = String(value);
        break;
      case 'NUMBER':
      case 'CURRENCY':
        data.numberValue = Number(value);
        break;
      case 'BOOLEAN':
        data.booleanValue = Boolean(value);
        break;
      case 'DATE':
      case 'DATETIME':
        data.dateValue = new Date(value);
        break;
      case 'MULTISELECT':
      case 'FILE':
        data.jsonValue = Array.isArray(value) ? value : [value];
        break;
      case 'USER':
      case 'CONTACT':
      case 'COMPANY':
        data.textValue = String(value);
        break;
      default:
        data.textValue = String(value);
    }

    return data;
  }

  private buildFilterCondition(fieldType: CustomFieldType, filterValue: any): any {
    switch (fieldType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'URL':
      case 'EMAIL':
      case 'PHONE':
      case 'SELECT':
        return { textValue: { contains: String(filterValue), mode: 'insensitive' } };
      case 'NUMBER':
      case 'CURRENCY':
        if (typeof filterValue === 'object') {
          return {
            numberValue: {
              ...(filterValue.min !== undefined && { gte: filterValue.min }),
              ...(filterValue.max !== undefined && { lte: filterValue.max }),
            },
          };
        }
        return { numberValue: Number(filterValue) };
      case 'BOOLEAN':
        return { booleanValue: Boolean(filterValue) };
      case 'DATE':
      case 'DATETIME':
        if (typeof filterValue === 'object') {
          return {
            dateValue: {
              ...(filterValue.from && { gte: new Date(filterValue.from) }),
              ...(filterValue.to && { lte: new Date(filterValue.to) }),
            },
          };
        }
        return { dateValue: new Date(filterValue) };
      default:
        return null;
    }
  }
}

export const customFieldsService = new CustomFieldsService();
