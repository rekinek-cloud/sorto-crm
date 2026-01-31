import { apiClient } from './client';

export type AnalysisModule = 'projects' | 'tasks' | 'deals' | 'contacts' | 'communication';
export type AnalysisType = 'smart-score' | 'task-breakdown' | 'risk-assessment' | 'engagement-strategy';

export interface AnalysisResult {
  success: boolean;
  ruleId?: string;
  ruleName?: string;
  output?: any;
  error?: string;
  executionTime?: number;
}

export interface ManualAnalysisRequest {
  module: AnalysisModule;
  component?: string;
  itemId: string;
  analysisType?: AnalysisType;
  customPrompt?: string;
}

export interface ManualAnalysisResponse {
  success: boolean;
  module: AnalysisModule;
  itemId: string;
  analysisType?: AnalysisType;
  results: AnalysisResult[];
  executedRules: number;
  successfulRules: number;
}

export interface AutoTriggerRequest {
  module: AnalysisModule;
  component?: string;
  data: any;
  action: 'created' | 'updated' | 'deleted';
}

export interface AvailableAnalysis {
  type: string;
  name: string;
  description: string;
  estimatedTime: string;
  aiModel: string;
}

export interface AvailableAnalyses {
  projects: AvailableAnalysis[];
  tasks: AvailableAnalysis[];
  deals: AvailableAnalysis[];
  contacts: AvailableAnalysis[];
  communication: AvailableAnalysis[];
}

export interface ExecutionHistoryItem {
  id: string;
  ruleId: string;
  ruleName: string;
  module: string;
  itemId: string;
  trigger: 'manual' | 'automatic';
  success: boolean;
  executionTime: number;
  timestamp: string;
  user: string;
  aiResponsesCount: number;
  actionsExecuted: number;
}

export const universalRulesApi = {
  // Manual analysis trigger
  async analyze(request: ManualAnalysisRequest): Promise<ManualAnalysisResponse> {
    const response = await apiClient.post('/universal-rules/analyze', request);
    return response.data;
  },

  // Automatic trigger (used internally by the system)
  async autoTrigger(request: AutoTriggerRequest): Promise<{
    success: boolean;
    module: string;
    action: string;
    results: AnalysisResult[];
    executedRules: number;
  }> {
    const response = await apiClient.post('/universal-rules/auto-trigger', request);
    return response.data;
  },

  // Get available analysis types for each module
  async getAvailableAnalyses(): Promise<{ success: boolean; data: AvailableAnalyses }> {
    const response = await apiClient.get('/universal-rules/available');
    return response.data;
  },

  // Get execution history
  async getExecutionHistory(params?: {
    module?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data: ExecutionHistoryItem[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    const response = await apiClient.get('/universal-rules/execution-history', { params });
    return response.data;
  }
};
