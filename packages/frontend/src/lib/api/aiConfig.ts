import api from './client';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  modelId: string;
  contextSize: number;
  maxTokens: number;
  temperature: number;
  topP: number;
  costPer1kTokens: number;
  enabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  capabilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  authType: 'api-key' | 'oauth' | 'custom';
  enabled: boolean;
  configSchema?: Record<string, any>;
  supportedModels: string[];
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AIUsageStats {
  modelId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: string;
  dailyStats: {
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }[];
}

export interface TestModelResponse {
  success: boolean;
  message: string;
  responseTime: number;
  modelOutput?: string;
  error?: string;
}

export const aiConfigApi = {
  // AI Models
  async getModels(): Promise<AIModel[]> {
    const response = await api.get('/admin/ai-config/models');
    return response.data || [];
  },

  async getModel(modelId: string): Promise<AIModel> {
    const response = await api.get(`/admin/ai-config/models/${modelId}`);
    return response.data;
  },

  async createModel(model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel> {
    const response = await api.post('/admin/ai-config/models', model);
    return response.data;
  },

  async updateModel(modelId: string, updates: Partial<AIModel>): Promise<AIModel> {
    const response = await api.put(`/admin/ai-config/models/${modelId}`, updates);
    return response.data;
  },

  async deleteModel(modelId: string): Promise<void> {
    await api.delete(`/admin/ai-config/models/${modelId}`);
  },

  async testModel(modelId: string, testPrompt?: string): Promise<TestModelResponse> {
    const response = await api.post(`/admin/ai-config/test/${modelId}`, { 
      prompt: testPrompt || 'Hello, this is a test message. Please respond briefly.' 
    });
    return response.data;
  },

  // AI Providers
  async getProviders(): Promise<AIProvider[]> {
    console.log('getProviders called, making API request...');
    const response = await api.get('/admin/ai-config/providers');
    console.log('getProviders response:', response);
    return response.data || [];
  },

  async getProvider(providerId: string): Promise<AIProvider> {
    const response = await api.get(`/admin/ai-config/providers/${providerId}`);
    return response.data;
  },

  async createProvider(provider: Omit<AIProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIProvider> {
    const response = await api.post('/admin/ai-config/providers', provider);
    return response.data;
  },

  async updateProvider(providerId: string, updates: Partial<AIProvider>): Promise<AIProvider> {
    const response = await api.put(`/admin/ai-config/providers/${providerId}`, updates);
    return response.data;
  },

  async deleteProvider(providerId: string): Promise<void> {
    await api.delete(`/admin/ai-config/providers/${providerId}`);
  },

  async testProvider(providerId: string): Promise<TestModelResponse> {
    const response = await api.post(`/admin/ai-config/providers/${providerId}/test`);
    return response.data;
  },

  // Usage Statistics
  async getUsageStats(modelId?: string): Promise<AIUsageStats[]> {
    const params = modelId ? { modelId } : {};
    const response = await api.get('/admin/ai-config/usage', { params });
    return response.data || [];
  },

  // Provider Configuration
  async getProviderConfig(providerId: string): Promise<Record<string, any>> {
    const response = await api.get(`/admin/ai-config/providers/${providerId}/config`);
    return response.data;
  },

  async updateProviderConfig(providerId: string, config: Record<string, any>): Promise<void> {
    await api.put(`/admin/ai-config/providers/${providerId}/config`, config);
  },
};