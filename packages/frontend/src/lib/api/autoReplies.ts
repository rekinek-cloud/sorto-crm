import { apiClient } from './client';

export interface AutoReplyConditions {
  fromEmail?: string;
  fromDomain?: string;
  subject?: string;
  subjectContains?: string[];
  bodyContains?: string[];
  hasAttachment?: boolean;
  timeRange?: {
    start?: string;
    end?: string;
    timezone?: string;
  };
  daysOfWeek?: number[];
}

export interface AutoReplyConfig {
  template: string;
  subject?: string;
  delay?: number;
  onlyBusinessHours?: boolean;
  maxRepliesPerSender?: number;
  cooldownPeriod?: number;
}

export interface AutoReplyActions {
  markAsRead?: boolean;
  addLabel?: string;
  createTask?: boolean;
  taskTitle?: string;
  taskContext?: string;
  notifyUsers?: string[];
}

export interface AutoReply {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  conditions: AutoReplyConditions;
  replyConfig: AutoReplyConfig;
  actions?: AutoReplyActions;
  _count?: {
    executions: number;
  };
  executions?: AutoReplyExecution[];
  createdAt: string;
  updatedAt: string;
}

export interface AutoReplyExecution {
  id: string;
  createdAt: string;
  message?: {
    id: string;
    subject: string;
    fromEmail: string;
    createdAt: string;
  };
}

export interface CreateAutoReplyData {
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  conditions: AutoReplyConditions;
  replyConfig: AutoReplyConfig;
  actions?: AutoReplyActions;
}

export interface AutoReplyStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  recentExecutions: AutoReplyExecution[];
  timeframe: number;
}

export interface TestAutoReplyResult {
  matches: boolean;
  matchResults: Record<string, boolean>;
  wouldReply: boolean;
  replyTemplate: string | null;
  replySubject: string | null;
}

export const autoRepliesApi = {
  // Get all auto-reply rules
  async getAutoReplies(params?: {
    enabled?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    autoReplies: AutoReply[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const response = await apiClient.get('/auto-replies', { params });
    return response.data;
  },

  // Get single auto-reply
  async getAutoReply(id: string): Promise<AutoReply> {
    const response = await apiClient.get(`/auto-replies/${id}`);
    return response.data;
  },

  // Create auto-reply
  async createAutoReply(data: CreateAutoReplyData): Promise<AutoReply> {
    const response = await apiClient.post('/auto-replies', data);
    return response.data;
  },

  // Update auto-reply
  async updateAutoReply(id: string, data: Partial<CreateAutoReplyData>): Promise<AutoReply> {
    const response = await apiClient.put(`/auto-replies/${id}`, data);
    return response.data;
  },

  // Delete auto-reply
  async deleteAutoReply(id: string): Promise<void> {
    await apiClient.delete(`/auto-replies/${id}`);
  },

  // Toggle auto-reply enabled status
  async toggleAutoReply(id: string): Promise<AutoReply> {
    const response = await apiClient.post(`/auto-replies/${id}/toggle`);
    return response.data;
  },

  // Test auto-reply with sample message
  async testAutoReply(id: string, sampleMessage: {
    fromEmail?: string;
    subject?: string;
    body?: string;
  }): Promise<TestAutoReplyResult> {
    const response = await apiClient.post(`/auto-replies/${id}/test`, { sampleMessage });
    return response.data;
  },

  // Get statistics
  async getStats(timeframe?: number): Promise<AutoReplyStats> {
    const response = await apiClient.get('/auto-replies/stats/overview', {
      params: { timeframe }
    });
    return response.data;
  }
};
