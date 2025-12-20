import { apiClient } from './client';

export interface InboxItem {
  id: string;
  content: string;
  note?: string;
  source: string;
  sourceUrl?: string;
  capturedAt: string;
  processed: boolean;
  processedAt?: string;
  processingDecision?: 'DO' | 'DEFER' | 'DELEGATE' | 'DELETE' | 'REFERENCE' | 'PROJECT' | 'SOMEDAY';
  resultingTaskId?: string;
  resultingTask?: {
    id: string;
    title: string;
    status: string;
  };
  organizationId: string;
  capturedById: string;
  capturedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InboxStats {
  total: number;
  unprocessed: number;
  processed: number;
  processingRate: number;
  bySource: Array<{
    source: string;
    count: number;
  }>;
  byDecision: Array<{
    decision: string;
    count: number;
  }>;
  lastProcessed: string | null;
}

export interface CreateInboxItemInput {
  content: string;
  note?: string;
  source?: string;
  sourceUrl?: string;
}

export interface ProcessInboxItemInput {
  decision: 'DO' | 'DEFER' | 'DELEGATE' | 'DELETE' | 'REFERENCE' | 'PROJECT' | 'SOMEDAY';
  taskData?: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    context?: string;
    streamId?: string;
    assignedToId?: string;
    estimatedHours?: number;
  };
  projectData?: {
    name: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    startDate?: string;
    endDate?: string;
  };
  somedayMaybeData?: {
    title: string;
    description?: string;
    category?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  };
  referenceData?: {
    title: string;
    content?: string;
    topic?: string;
    importance?: string;
  };
}

export const gtdInboxApi = {
  // Get all inbox items
  async getItems(filters?: {
    processed?: boolean;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<InboxItem[]> {
    const params = new URLSearchParams();
    if (filters?.processed !== undefined) {
      params.append('processed', String(filters.processed));
    }
    if (filters?.source) {
      params.append('source', filters.source);
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    if (filters?.offset) {
      params.append('offset', String(filters.offset));
    }

    const url = `/gtd-inbox?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get inbox statistics
  async getStats(): Promise<InboxStats> {
    const response = await apiClient.get('/gtd-inbox/stats');
    return response.data;
  },

  // Create new inbox item
  async createItem(input: CreateInboxItemInput): Promise<InboxItem> {
    const response = await apiClient.post('/gtd-inbox', input);
    return response.data.item;
  },

  // Quick capture
  async quickCapture(content: string): Promise<InboxItem> {
    const response = await apiClient.post('/gtd-inbox/quick-capture', { content });
    return response.data.item;
  },

  // Process inbox item
  async processItem(itemId: string, input: ProcessInboxItemInput): Promise<InboxItem> {
    const response = await apiClient.post(`/gtd-inbox/${itemId}/process`, input);
    return response.data.item;
  },

  // Bulk process items (mainly for deletion)
  async bulkProcess(items: Array<{ itemId: string; decision: 'DELETE' }>): Promise<void> {
    await apiClient.post('/gtd-inbox/bulk-process', { items });
  },

  // Quick action on inbox item
  async quickAction(itemId: string, action: 'DO' | 'DEFER' | 'DELETE'): Promise<InboxItem> {
    const actionMap = {
      'DO': 'QUICK_DO',
      'DEFER': 'QUICK_DEFER', 
      'DELETE': 'QUICK_DELETE'
    };
    const response = await apiClient.post(`/gtd-inbox/${itemId}/quick-action`, { 
      action: actionMap[action] 
    });
    return response.data.item;
  },

  // Clear old processed items
  async clearProcessedItems(olderThanDays: number = 30): Promise<{ message: string }> {
    const response = await apiClient.delete(`/gtd-inbox/clear-processed?olderThanDays=${olderThanDays}`);
    return response.data;
  },

  // Get AI analysis for planning without creating time block
  async analyzeForPlanning(itemId: string): Promise<{
    success: boolean;
    aiAnalysis: {
      suggestedEnergyLevel: string;
      suggestedContext: string;
      alternativeContexts: string[];
      estimatedMinutes: number;
      confidence: number;
    };
    item: {
      id: string;
      content: string;
      note?: string;
      urgencyScore?: number;
    };
  }> {
    const response = await apiClient.post(`/gtd-inbox/${itemId}/analyze-for-planning`);
    return response.data;
  },

  // Plan as time block - convert inbox item to Smart Day Planner time block
  async planAsTimeBlock(itemId: string, options: {
    scheduledDate?: string;
    energyLevel?: string;
    context?: string;
    estimatedMinutes?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      timeBlock: any;
      scheduledTask: any;
      aiAnalysis: {
        suggestedEnergyLevel: string;
        suggestedContext: string;
        alternativeContexts: string[];
        estimatedMinutes: number;
        confidence: number;
      };
    };
  }> {
    const response = await apiClient.post(`/gtd-inbox/${itemId}/plan-as-time-block`, options);
    return response.data;
  }
};