import { apiClient } from './client';

export interface AISuggestion {
  id: string;
  organizationId: string;
  userId: string | null;
  suggestionType: string;
  title: string;
  description: string;
  data: Record<string, any>;
  inputData?: Record<string, any>;
  confidence: number;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export const aiSuggestionsApi = {
  async getSuggestions(filters: { status?: string; type?: string; limit?: number } = {}): Promise<AISuggestion[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/ai-suggestions?${params}`);
    return response.data.data;
  },

  async acceptSuggestion(id: string, modifications?: Record<string, any>): Promise<{ createdEntity?: { id: string; type: string } }> {
    const response = await apiClient.post(`/ai-suggestions/${id}/accept`, { modifications });
    return response.data;
  },

  async rejectSuggestion(id: string, data?: {
    note?: string;
    correctClassification?: string;
    correctAction?: string;
    feedback?: string;
  }): Promise<void> {
    await apiClient.post(`/ai-suggestions/${id}/reject`, data || {});
  },

  async editSuggestion(id: string, data: {
    suggestion?: Record<string, any>;
    reasoning?: string;
    confidence?: number;
  }): Promise<AISuggestion> {
    const response = await apiClient.put(`/ai-suggestions/${id}`, data);
    return response.data.data;
  },
};
