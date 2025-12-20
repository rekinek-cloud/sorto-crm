import { apiClient } from './client';

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const knowledgeApi = {
  // Get all reference materials
  async getKnowledgeBase(params?: {
    category?: string;
    search?: string;
  }): Promise<KnowledgeBaseItem[]> {
    const response = await apiClient.get<KnowledgeBaseItem[]>('/knowledge/knowledge-base', {
      params
    });
    return response.data;
  },

  // Get single reference material
  async getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem> {
    const response = await apiClient.get<KnowledgeBaseItem>(`/knowledge/knowledge-base/${id}`);
    return response.data;
  },

  // Delete reference material
  async deleteKnowledgeBaseItem(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/knowledge/knowledge-base/${id}`);
    return response.data;
  }
};