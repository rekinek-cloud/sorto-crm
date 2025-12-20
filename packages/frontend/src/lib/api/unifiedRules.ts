import { apiClient } from './client';

export interface UnifiedRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'PROCESSING' | 'EMAIL_FILTER' | 'AUTO_REPLY' | 'AI_RULE' | 'SMART_MAILBOX' | 'WORKFLOW' | 'NOTIFICATION' | 'INTEGRATION';
  category?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'TESTING' | 'ERROR' | 'DEPRECATED';
  priority: number;
  triggerType: string;
  triggerEvents: string[];
  conditions: any;
  actions: any;
  maxExecutionsPerHour?: number;
  maxExecutionsPerDay?: number;
  cooldownPeriod?: number;
  activeFrom?: string;
  activeTo?: string;
  timezone?: string;
  channelId?: string;
  aiModelId?: string;
  aiPromptTemplate?: string;
  fallbackModelIds: string[];
  executionCount: number;
  successCount: number;
  errorCount: number;
  avgExecutionTime?: number;
  lastExecuted?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface UnifiedRuleExecution {
  id: string;
  ruleId: string;
  triggeredBy?: string;
  triggerData?: any;
  executionTime: number;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  result?: any;
  error?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface UnifiedRulesStats {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  executions24h: number;
  successRate: number;
  avgExecutionTime: number;
  rulesByType: Array<{ ruleType: string; _count: number }>;
}

export interface CreateUnifiedRuleData {
  name: string;
  description?: string;
  ruleType: UnifiedRule['ruleType'];
  category?: string;
  status?: UnifiedRule['status'];
  priority?: number;
  triggerType: string;
  triggerEvents?: string[];
  conditions: any;
  actions: any;
  maxExecutionsPerHour?: number;
  maxExecutionsPerDay?: number;
  cooldownPeriod?: number;
  activeFrom?: string;
  activeTo?: string;
  timezone?: string;
  channelId?: string;
  aiModelId?: string;
  aiPromptTemplate?: string;
  fallbackModelIds?: string[];
}

// GET /api/v1/unified-rules
export const getUnifiedRules = async (params?: {
  type?: string;
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  rules: UnifiedRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const response = await apiClient.get(`/unified-rules?${searchParams.toString()}`);
  return response.data.data;
};

// GET /api/v1/unified-rules/:id
export const getUnifiedRule = async (id: string): Promise<UnifiedRule> => {
  const response = await apiClient.get(`/unified-rules/${id}`);
  return response.data.data;
};

// POST /api/v1/unified-rules
export const createUnifiedRule = async (data: CreateUnifiedRuleData): Promise<UnifiedRule> => {
  const response = await apiClient.post('/unified-rules', data);
  return response.data.data;
};

// PUT /api/v1/unified-rules/:id
export const updateUnifiedRule = async (id: string, data: Partial<CreateUnifiedRuleData>): Promise<UnifiedRule> => {
  const response = await apiClient.put(`/unified-rules/${id}`, data);
  return response.data.data;
};

// DELETE /api/v1/unified-rules/:id
export const deleteUnifiedRule = async (id: string): Promise<void> => {
  await apiClient.delete(`/unified-rules/${id}`);
};

// POST /api/v1/unified-rules/:id/toggle
export const toggleUnifiedRule = async (id: string): Promise<UnifiedRule> => {
  const response = await apiClient.post(`/unified-rules/${id}/toggle`);
  return response.data.data;
};

// POST /api/v1/unified-rules/:id/execute
export const executeUnifiedRule = async (
  id: string, 
  data: {
    entityType?: string;
    entityId?: string;
    triggerData?: any;
  }
): Promise<UnifiedRuleExecution> => {
  const response = await apiClient.post(`/unified-rules/${id}/execute`, data);
  return response.data.data;
};

// GET /api/v1/unified-rules/:id/executions
export const getUnifiedRuleExecutions = async (
  id: string,
  params?: { page?: number; limit?: number }
): Promise<{
  executions: UnifiedRuleExecution[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const response = await apiClient.get(`/unified-rules/${id}/executions?${searchParams.toString()}`);
  return response.data.data;
};

// GET /api/v1/unified-rules/stats/overview
export const getUnifiedRulesStats = async (): Promise<UnifiedRulesStats> => {
  const response = await apiClient.get('/unified-rules/stats/overview');
  return response.data.data;
};

// GET /api/v1/unified-rules/templates
export const getUnifiedRuleTemplates = async (): Promise<any[]> => {
  const response = await apiClient.get('/unified-rules/templates');
  return response.data.data;
};

// POST /api/v1/unified-rules/process-message
export const processMessageThroughRules = async (messageData: any): Promise<{
  messageId: string;
  rulesExecuted: number;
  results: any[];
}> => {
  const response = await apiClient.post('/unified-rules/process-message', { messageData });
  return response.data.data;
};

// POST /api/v1/unified-rules/process-project
export const processProjectThroughRules = async (projectData: any): Promise<{
  projectId: string;
  rulesExecuted: number;
  results: any[];
}> => {
  const response = await apiClient.post('/unified-rules/process-project', { projectData });
  return response.data.data;
};

// POST /api/v1/unified-rules/process-task
export const processTaskThroughRules = async (taskData: any): Promise<{
  taskId: string;
  rulesExecuted: number;
  results: any[];
}> => {
  const response = await apiClient.post('/unified-rules/process-task', { taskData });
  return response.data.data;
};

export default {
  getUnifiedRules,
  getUnifiedRule,
  createUnifiedRule,
  updateUnifiedRule,
  deleteUnifiedRule,
  toggleUnifiedRule,
  executeUnifiedRule,
  getUnifiedRuleExecutions,
  getUnifiedRulesStats,
  getUnifiedRuleTemplates,
  processMessageThroughRules,
  processProjectThroughRules,
  processTaskThroughRules
};