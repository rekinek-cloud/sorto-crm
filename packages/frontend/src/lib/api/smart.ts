import apiClient from './client';

export interface SmartCriteria {
  specific: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  measurable: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  achievable: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  relevant: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  timeBound: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
}

export interface SmartAnalysisResult {
  overallScore: number;
  criteria: SmartCriteria;
  summary: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface SmartReportStats {
  averageScore: number;
  minScore: number;
  maxScore: number;
  totalAnalyzed: number;
  distribution: {
    excellent: number; // 80-100
    good: number; // 60-79
    fair: number; // 40-59
    poor: number; // 0-39
  };
}

export interface TaskAnalysisResponse {
  task: any;
  analysis: SmartAnalysisResult;
}

export interface ProjectAnalysisResponse {
  project: any;
  analysis: SmartAnalysisResult;
}

export interface BulkAnalysisResult {
  taskId?: string;
  projectId?: string;
  taskTitle?: string;
  projectName?: string;
  analysis: SmartAnalysisResult;
}

export interface BulkAnalysisResponse {
  message: string;
  results: BulkAnalysisResult[];
}

export interface SmartReportsResponse {
  tasks?: any[];
  projects?: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: SmartReportStats;
}

export const smartApi = {
  // Analyze single task
  async analyzeTask(taskId: string): Promise<TaskAnalysisResponse> {
    const response = await apiClient.post<TaskAnalysisResponse>(`/smart/analyze/task/${taskId}`);
    return response.data;
  },

  // Analyze single project
  async analyzeProject(projectId: string): Promise<ProjectAnalysisResponse> {
    const response = await apiClient.post<ProjectAnalysisResponse>(`/smart/analyze/project/${projectId}`);
    return response.data;
  },

  // Bulk analyze tasks
  async bulkAnalyzeTasks(taskIds: string[]): Promise<BulkAnalysisResponse> {
    const response = await apiClient.post<BulkAnalysisResponse>('/smart/bulk-analyze/tasks', { taskIds });
    return response.data;
  },

  // Bulk analyze projects
  async bulkAnalyzeProjects(projectIds: string[]): Promise<BulkAnalysisResponse> {
    const response = await apiClient.post<BulkAnalysisResponse>('/smart/bulk-analyze/projects', { projectIds });
    return response.data;
  },

  // Get task analysis reports
  async getTaskReports(filters?: {
    page?: number;
    limit?: number;
    scoreRange?: string; // e.g., "60-80"
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SmartReportsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.scoreRange) params.append('scoreRange', filters.scoreRange);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<SmartReportsResponse>(`/smart/reports/tasks?${params.toString()}`);
    return response.data;
  },

  // Get project analysis reports
  async getProjectReports(filters?: {
    page?: number;
    limit?: number;
    scoreRange?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SmartReportsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.scoreRange) params.append('scoreRange', filters.scoreRange);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<SmartReportsResponse>(`/smart/reports/projects?${params.toString()}`);
    return response.data;
  }
};

export default smartApi;