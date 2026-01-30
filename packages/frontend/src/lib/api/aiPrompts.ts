import { apiClient } from './client';

export interface AIPrompt {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  systemPrompt?: string;
  userPromptTemplate: string;
  variables: Record<string, any>;
  defaultModel: string;
  defaultTemperature: number;
  maxTokens: number;
  outputSchema?: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PromptVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changeNote?: string;
}

export interface PromptOverride {
  modelOverride?: string | null;
  temperatureOverride?: number | null;
  languageOverride?: string | null;
  customInstructions?: string | null;
  isActive: boolean;
}

export interface CreatePromptData {
  code: string;
  name: string;
  description?: string;
  category?: string;
  systemPrompt?: string;
  userPromptTemplate: string;
  variables?: Record<string, any>;
  defaultModel?: string;
  defaultTemperature?: number;
  maxTokens?: number;
  outputSchema?: Record<string, any>;
}

export interface UpdatePromptData {
  name?: string;
  description?: string;
  category?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  variables?: Record<string, any>;
  defaultModel?: string;
  defaultTemperature?: number;
  maxTokens?: number;
  outputSchema?: Record<string, any>;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export const aiPromptsApi = {
  // Get all prompts
  async getPrompts(params?: {
    category?: string;
    isSystem?: boolean;
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  }): Promise<{ success: boolean; data: AIPrompt[]; count: number }> {
    const response = await apiClient.get('/ai/prompts', { params });
    return response.data;
  },

  // Get single prompt by code
  async getPrompt(code: string): Promise<{ success: boolean; data: AIPrompt }> {
    const response = await apiClient.get(`/ai/prompts/${code}`);
    return response.data;
  },

  // Create new prompt
  async createPrompt(data: CreatePromptData): Promise<{ success: boolean; data: AIPrompt }> {
    const response = await apiClient.post('/ai/prompts', data);
    return response.data;
  },

  // Update prompt
  async updatePrompt(code: string, data: UpdatePromptData): Promise<{ success: boolean; data: AIPrompt }> {
    const response = await apiClient.put(`/ai/prompts/${code}`, data);
    return response.data;
  },

  // Delete (archive) prompt
  async deletePrompt(code: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/ai/prompts/${code}`);
    return response.data;
  },

  // Get version history
  async getVersionHistory(code: string): Promise<{ success: boolean; data: PromptVersion[]; currentVersion: number }> {
    const response = await apiClient.get(`/ai/prompts/${code}/versions`);
    return response.data;
  },

  // Restore version
  async restoreVersion(code: string, version: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/ai/prompts/${code}/restore/${version}`);
    return response.data;
  },

  // Test prompt
  async testPrompt(code: string, data: {
    testData: Record<string, any>;
    model?: string;
    temperature?: number;
  }): Promise<{
    success: boolean;
    data: {
      systemPrompt: string;
      userPrompt: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
    processingTime: number;
  }> {
    const response = await apiClient.post(`/ai/prompts/${code}/test`, data);
    return response.data;
  },

  // Get overrides
  async getOverrides(code: string): Promise<{ success: boolean; data: PromptOverride | null }> {
    const response = await apiClient.get(`/ai/prompts/${code}/overrides`);
    return response.data;
  },

  // Set overrides
  async setOverrides(code: string, data: Partial<PromptOverride>): Promise<{ success: boolean; data: PromptOverride }> {
    const response = await apiClient.put(`/ai/prompts/${code}/overrides`, data);
    return response.data;
  },

  // Get available categories
  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    const response = await apiClient.get('/ai/prompts/meta/categories');
    return response.data;
  }
};
