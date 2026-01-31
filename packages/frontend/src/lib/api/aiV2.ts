import { apiClient } from './client';

// Provider types
export interface AIProvider {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  config: {
    apiKey?: string;
    timeout?: number;
    maxRetries?: number;
  };
  limits?: {
    requestsPerMinute?: number;
    tokensPerDay?: number;
  };
  priority: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  models?: AIModel[];
  _count?: {
    executions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderData {
  name: string;
  displayName: string;
  baseUrl: string;
  config: {
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
  };
  limits?: {
    requestsPerMinute?: number;
    tokensPerDay?: number;
  };
  priority?: number;
}

// Model types
export type AIModelType =
  | 'TEXT_GENERATION'
  | 'TEXT_CLASSIFICATION'
  | 'TEXT_EMBEDDING'
  | 'IMAGE_GENERATION'
  | 'IMAGE_ANALYSIS'
  | 'AUDIO_TRANSCRIPTION'
  | 'AUDIO_GENERATION'
  | 'CODE_GENERATION'
  | 'FUNCTION_CALLING'
  | 'MULTIMODAL';

export interface AIModel {
  id: string;
  providerId: string;
  name: string;
  displayName: string;
  type: AIModelType;
  maxTokens?: number;
  inputCost?: number;
  outputCost?: number;
  capabilities: string[];
  config: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE';
  provider?: AIProvider;
  _count?: {
    executions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateModelData {
  providerId: string;
  name: string;
  displayName: string;
  type: AIModelType;
  maxTokens?: number;
  inputCost?: number;
  outputCost?: number;
  capabilities?: string[];
  config?: Record<string, any>;
}

// Template types
export interface AITemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  systemPrompt?: string;
  userPromptTemplate: string;
  variables: Record<string, {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
    required: boolean;
    description?: string;
    enumValues?: string[];
    defaultValue?: any;
  }>;
  outputSchema?: any;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

// Rule types
export type AITriggerType =
  | 'MESSAGE_RECEIVED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'PROJECT_CREATED'
  | 'CONTACT_UPDATED'
  | 'DEAL_STAGE_CHANGED'
  | 'MANUAL_TRIGGER'
  | 'SCHEDULED'
  | 'WEBHOOK';

export interface AIRule {
  id: string;
  name: string;
  description?: string;
  category?: string;
  triggerType: AITriggerType;
  triggerConditions: any;
  templateId?: string;
  modelId?: string;
  fallbackModelIds: string[];
  actions: any;
  priority: number;
  maxExecutionsPerHour?: number;
  maxExecutionsPerDay?: number;
  status: 'ACTIVE' | 'INACTIVE';
  template?: { id: string; name: string; category: string };
  model?: { id: string; name: string; displayName: string; provider?: { id: string; name: string; displayName: string } };
  createdAt: string;
  updatedAt: string;
}

// Execution types
export interface AIExecution {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  tokensUsed?: number;
  cost?: number;
  executionTime?: number;
  input?: any;
  output?: any;
  error?: string;
  rule?: { id: string; name: string };
  model?: { id: string; name: string; displayName: string };
  provider?: { id: string; name: string; displayName: string };
  template?: { id: string; name: string };
  createdAt: string;
}

export interface AIUsageStats {
  totalExecutions: number;
  totalTokens: number;
  totalCost: number;
  avgExecutionTime: number;
  dailyStats: Array<{
    date: string;
    executions: number;
    tokens: number;
    cost: number;
  }>;
}

export const aiV2Api = {
  // ========== PROVIDERS ==========

  async getProviders(): Promise<{ data: AIProvider[] }> {
    const response = await apiClient.get('/ai-v2/providers');
    return response.data;
  },

  async createProvider(data: CreateProviderData): Promise<{ data: AIProvider }> {
    const response = await apiClient.post('/ai-v2/providers', data);
    return response.data;
  },

  async updateProvider(id: string, data: Partial<CreateProviderData>): Promise<{ data: AIProvider }> {
    const response = await apiClient.put(`/ai-v2/providers/${id}`, data);
    return response.data;
  },

  async testProvider(id: string): Promise<{ data: { isConnected: boolean; latency: number } }> {
    const response = await apiClient.post(`/ai-v2/providers/${id}/test`);
    return response.data;
  },

  // ========== MODELS ==========

  async getModels(): Promise<{ data: AIModel[] }> {
    const response = await apiClient.get('/ai-v2/models');
    return response.data;
  },

  async createModel(data: CreateModelData): Promise<{ data: AIModel }> {
    const response = await apiClient.post('/ai-v2/models', data);
    return response.data;
  },

  // ========== TEMPLATES ==========

  async getTemplates(params?: { category?: string; status?: string; search?: string }): Promise<{ data: AITemplate[] }> {
    const response = await apiClient.get('/ai-v2/templates', { params });
    return response.data;
  },

  async getTemplate(id: string): Promise<{ data: AITemplate }> {
    const response = await apiClient.get(`/ai-v2/templates/${id}`);
    return response.data;
  },

  async createTemplate(data: Partial<AITemplate>): Promise<{ data: { id: string } }> {
    const response = await apiClient.post('/ai-v2/templates', data);
    return response.data;
  },

  async testTemplate(id: string, variables: Record<string, any>): Promise<{ data: any }> {
    const response = await apiClient.post(`/ai-v2/templates/${id}/test`, { variables });
    return response.data;
  },

  async getTemplateCategories(): Promise<{ data: string[] }> {
    const response = await apiClient.get('/ai-v2/templates-categories');
    return response.data;
  },

  async importDefaultTemplates(): Promise<void> {
    await apiClient.post('/ai-v2/templates/import-defaults');
  },

  // ========== RULES ==========

  async getRules(): Promise<{ data: AIRule[] }> {
    const response = await apiClient.get('/ai-v2/rules');
    return response.data;
  },

  async createRule(data: Partial<AIRule>): Promise<{ data: AIRule }> {
    const response = await apiClient.post('/ai-v2/rules', data);
    return response.data;
  },

  async updateRule(id: string, data: Partial<AIRule>): Promise<{ data: AIRule }> {
    const response = await apiClient.put(`/ai-v2/rules/${id}`, data);
    return response.data;
  },

  async testRule(id: string, testData: any): Promise<{ data: any }> {
    const response = await apiClient.post(`/ai-v2/rules/${id}/test`, { testData });
    return response.data;
  },

  // ========== EXECUTIONS ==========

  async getExecutions(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    ruleId?: string;
    modelId?: string;
  }): Promise<{
    data: AIExecution[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const response = await apiClient.get('/ai-v2/executions', { params });
    return response.data;
  },

  async getUsageStats(days?: number): Promise<{ data: AIUsageStats }> {
    const response = await apiClient.get('/ai-v2/usage-stats', { params: { days } });
    return response.data;
  },

  async executeManual(data: {
    modelId: string;
    messages: Array<{ role: string; content: string; name?: string }>;
    config?: { temperature?: number; maxTokens?: number; topP?: number };
  }): Promise<{ data: any }> {
    const response = await apiClient.post('/ai-v2/execute', data);
    return response.data;
  }
};
