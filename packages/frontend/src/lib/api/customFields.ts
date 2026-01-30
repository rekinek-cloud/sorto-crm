import { apiClient } from './client';

export type CustomFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'CURRENCY'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTISELECT'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'
  | 'FILE'
  | 'USER'
  | 'CONTACT'
  | 'COMPANY';

export type EntityType =
  | 'CONTACT'
  | 'COMPANY'
  | 'DEAL'
  | 'PROJECT'
  | 'TASK'
  | 'LEAD';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  label: string;
  description?: string;
  fieldType: CustomFieldType;
  entityType: EntityType;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  showInList: boolean;
  showInCard: boolean;
  options?: string[];
  validation?: Record<string, any>;
  defaultValue?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FieldTypeInfo {
  value: CustomFieldType;
  label: string;
  description: string;
}

export interface EntityTypeInfo {
  value: EntityType;
  label: string;
}

export interface CreateFieldData {
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

export interface UpdateFieldData {
  label?: string;
  description?: string;
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

export const customFieldsApi = {
  // Get all custom field definitions
  async getDefinitions(entityType?: EntityType): Promise<{ definitions: CustomFieldDefinition[] }> {
    const response = await apiClient.get('/custom-fields', {
      params: entityType ? { entityType } : undefined
    });
    return response.data;
  },

  // Get single definition
  async getDefinition(id: string): Promise<{ definition: CustomFieldDefinition }> {
    const response = await apiClient.get(`/custom-fields/${id}`);
    return response.data;
  },

  // Create new field definition
  async createDefinition(data: CreateFieldData): Promise<{ definition: CustomFieldDefinition }> {
    const response = await apiClient.post('/custom-fields', data);
    return response.data;
  },

  // Update field definition
  async updateDefinition(id: string, data: UpdateFieldData): Promise<{ definition: CustomFieldDefinition }> {
    const response = await apiClient.put(`/custom-fields/${id}`, data);
    return response.data;
  },

  // Delete field definition
  async deleteDefinition(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/custom-fields/${id}`);
    return response.data;
  },

  // Reorder fields
  async reorderFields(entityType: EntityType, fieldIds: string[]): Promise<{ success: boolean }> {
    const response = await apiClient.post('/custom-fields/reorder', {
      entityType,
      fieldIds
    });
    return response.data;
  },

  // Get field values for an entity
  async getValues(entityType: EntityType, entityId: string): Promise<{ values: Record<string, any> }> {
    const response = await apiClient.get(`/custom-fields/values/${entityType}/${entityId}`);
    return response.data;
  },

  // Set field values for an entity
  async setValues(entityId: string, entityType: EntityType, values: Record<string, any>): Promise<{ success: boolean }> {
    const response = await apiClient.post('/custom-fields/values', {
      entityId,
      entityType,
      values
    });
    return response.data;
  },

  // Get available field types
  async getFieldTypes(): Promise<{ types: FieldTypeInfo[] }> {
    const response = await apiClient.get('/custom-fields/types/list');
    return response.data;
  },

  // Get available entity types
  async getEntityTypes(): Promise<{ entities: EntityTypeInfo[] }> {
    const response = await apiClient.get('/custom-fields/entities/list');
    return response.data;
  }
};
