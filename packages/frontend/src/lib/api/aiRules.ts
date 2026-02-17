import { apiClient } from './client';

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'ai-analysis' | 'add-tag' | 'send-notification' | 'create-task' | 'update-status' | 'custom-webhook';
  config: Record<string, any>;
}

export interface AIRule {
  id: string;
  name: string;
  description: string;
  module: 'projects' | 'tasks' | 'deals' | 'contacts' | 'communication';
  component?: string;
  trigger: 'manual' | 'automatic' | 'both';
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  aiPrompt?: string;
  aiSystemPrompt?: string;
  aiModel?: string;
  aiModelName?: string;
  category?: string;
  dataType?: string;
  status?: string;
  isSystem?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
  organizationId?: string;
  createdBy?: string;
}

export interface CreateRuleRequest {
  name: string;
  description: string;
  module: 'projects' | 'tasks' | 'deals' | 'contacts' | 'communication';
  component?: string;
  trigger: 'manual' | 'automatic' | 'both';
  enabled?: boolean;
  priority?: number;
  conditions: RuleCondition[] | { operator: string; conditions: any[] };
  actions: RuleAction[] | Record<string, any>;
  aiPrompt?: string;
  aiSystemPrompt?: string;
  aiModel?: string;
  modelId?: string;
  category?: string;
  dataType?: string;
  status?: string;
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {}

export interface ModuleField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  options?: string[];
}

export interface ExecutionHistoryItem {
  id: string;
  ruleId: string;
  triggeredBy: 'manual' | 'automatic';
  success: boolean;
  executionTime: number;
  timestamp: string;
  itemId: string;
  module: string;
  aiResponses: number;
  actionsExecuted: number;
  error?: string;
}

export interface RulesFilters {
  module?: string;
  enabled?: boolean;
  trigger?: string;
  page?: number;
  limit?: number;
}

class AIRulesAPI {
  /**
   * Pobierz wszystkie reguły AI
   */
  async getRules(filters: RulesFilters = {}): Promise<{
    rules: AIRule[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters.module) params.append('module', filters.module);
    if (filters.enabled !== undefined) params.append('enabled', filters.enabled.toString());
    if (filters.trigger) params.append('trigger', filters.trigger);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/ai-rules?${params}`);
    
    return {
      rules: response.data.data,
      pagination: response.data.pagination
    };
  }

  /**
   * Pobierz konkretną regułę
   */
  async getRule(id: string): Promise<AIRule> {
    const response = await apiClient.get(`/ai-rules/${id}`);
    return response.data.data;
  }

  /**
   * Utwórz nową regułę
   */
  async createRule(data: CreateRuleRequest): Promise<AIRule> {
    const response = await apiClient.post('/ai-rules', data);
    return response.data.data;
  }

  /**
   * Zaktualizuj regułę
   */
  async updateRule(id: string, data: UpdateRuleRequest): Promise<AIRule> {
    const response = await apiClient.put(`/ai-rules/${id}`, data);
    return response.data.data;
  }

  /**
   * Usuń regułę
   */
  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/ai-rules/${id}`);
  }

  /**
   * Włącz/wyłącz regułę
   */
  async toggleRule(id: string, enabled: boolean): Promise<void> {
    await apiClient.post(`/ai-rules/${id}/toggle`, { enabled });
  }

  /**
   * Pobierz dostępne pola dla modułu
   */
  async getModuleFields(module: string): Promise<ModuleField[]> {
    const response = await apiClient.get(`/ai-rules/fields/${module}`);
    return response.data.data;
  }

  /**
   * Pobierz historię wykonań reguły
   */
  async getExecutionHistory(
    ruleId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    history: ExecutionHistoryItem[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await apiClient.get(`/ai-rules/execution-history/${ruleId}?${params}`);
    
    return {
      history: response.data.data,
      pagination: response.data.pagination
    };
  }

  /**
   * Testuj regułę na przykładowych danych
   */
  async testRule(ruleId: string, testData: Record<string, any>): Promise<{
    success: boolean;
    results: any[];
    executionTime: number;
  }> {
    const response = await apiClient.post(`/ai-rules/${ruleId}/test`, { testData });
    return response.data;
  }

  /**
   * Duplikuj regułę
   */
  async duplicateRule(id: string, newName?: string): Promise<AIRule> {
    const response = await apiClient.post(`/ai-rules/${id}/duplicate`, { 
      newName: newName || `Kopia reguły`
    });
    return response.data.data;
  }

  /**
   * Eksportuj reguły
   */
  async exportRules(ruleIds?: string[]): Promise<{
    rules: AIRule[];
    exportedAt: string;
    version: string;
  }> {
    const response = await apiClient.post('/ai-rules/export', { ruleIds });
    return response.data;
  }

  /**
   * Importuj reguły
   */
  async importRules(rulesData: {
    rules: CreateRuleRequest[];
    overwriteExisting?: boolean;
  }): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const response = await apiClient.post('/ai-rules/import', rulesData);
    return response.data;
  }
}

export const aiRulesApi = new AIRulesAPI();