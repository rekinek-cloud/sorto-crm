import { apiClient } from './client';

export interface AISuggestion {
  id: string;
  organizationId: string;
  userId: string | null;
  suggestionType: string;
  title: string;
  description: string;
  data: Record<string, any>;
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

  async acceptSuggestion(id: string): Promise<void> {
    await apiClient.post(`/ai-suggestions/${id}/accept`);
  },

  async rejectSuggestion(id: string, note?: string): Promise<void> {
    await apiClient.post(`/ai-suggestions/${id}/reject`, { note });
  },
};
