import { apiClient } from './client';

export interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'prediction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  data: Record<string, any>;
  actions?: {
    type: string;
    label: string;
    data: Record<string, any>;
  }[];
  context: Record<string, any>;
  createdAt: string;
  streamName?: string;
}

export interface StreamInsightsResponse {
  success: boolean;
  data: {
    insights: AIInsight[];
    stream: {
      id: string;
      name: string;
    };
    meta: {
      total: number;
      highPriority: number;
      avgConfidence: number;
    };
  };
}

export interface GlobalInsightsResponse {
  success: boolean;
  data: {
    insights: AIInsight[];
    meta: {
      total: number;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
      avgConfidence: number;
      streamsAnalyzed: number;
    };
  };
}

export interface ActionExecutionResponse {
  success: boolean;
  data: {
    action: string;
    result: any;
    message: string;
  };
}

export const aiInsightsApi = {
  // Get insights for a specific stream
  async getStreamInsights(
    streamId: string,
    params?: {
      types?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      limit?: number;
    }
  ): Promise<StreamInsightsResponse> {
    const response = await apiClient.get<StreamInsightsResponse>(
      `/ai-insights/streams/${streamId}`,
      { params }
    );
    return response.data;
  },

  // Get global organization-wide insights
  async getGlobalInsights(params?: {
    types?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
    timeframe?: 'today' | 'week' | 'month';
  }): Promise<GlobalInsightsResponse> {
    const response = await apiClient.get<GlobalInsightsResponse>(
      '/ai-insights/global',
      { params }
    );
    return response.data;
  },

  // Execute an AI-suggested action
  async executeAction(data: {
    actionType: 'call' | 'email' | 'schedule' | 'create_task' | 'update_deal' | 'notify';
    actionData: Record<string, any>;
    insightId: string;
  }): Promise<ActionExecutionResponse> {
    const response = await apiClient.post<ActionExecutionResponse>(
      '/ai-insights/actions',
      data
    );
    return response.data;
  },

  // Get communication insights for a channel
  async getCommunicationInsights(channelId: string): Promise<{
    success: boolean;
    data: {
      channel: { id: string; name: string; type: string };
      insights: AIInsight[];
      stats: {
        totalMessages: number;
        uniqueContacts: number;
        avgResponseTime: number;
        sentimentTrend: string;
      };
    };
  }> {
    const response = await apiClient.get(`/ai-insights/communication/${channelId}`);
    return response.data;
  }
};
