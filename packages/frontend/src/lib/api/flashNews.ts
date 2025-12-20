import { apiClient } from './client';

export interface FlashNewsItem {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  source: 'ai_rule' | 'automation' | 'manual';
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface FlashNewsResponse {
  items: FlashNewsItem[];
  count: number;
  generatedAt: string;
}

export interface CreateFlashNewsRequest {
  content: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
}

export const flashNewsApi = {
  // Get all flash news for current user's organization
  getFlashNews: async (): Promise<FlashNewsResponse> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: FlashNewsResponse }>('/flash-news');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get flash news:', error);
      throw error;
    }
  },

  // Create manual flash news item
  createFlashNews: async (data: CreateFlashNewsRequest): Promise<FlashNewsItem> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: FlashNewsItem }>('/flash-news', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create flash news:', error);
      throw error;
    }
  },

  // Delete/hide flash news item
  deleteFlashNews: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/flash-news/${id}`);
    } catch (error: any) {
      console.error('Failed to delete flash news:', error);
      throw error;
    }
  },
};

export default flashNewsApi;