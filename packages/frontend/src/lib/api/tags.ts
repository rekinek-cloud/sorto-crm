import { apiClient } from './client';

export interface Tag {
  id: string;
  name: string;
  color: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

export const tagsApi = {
  // Get all tags
  async getTags(): Promise<{ data: Tag[]; total: number }> {
    const response = await apiClient.get('/tags');
    return response.data;
  },

  // Create tag
  async createTag(data: CreateTagData): Promise<Tag> {
    const response = await apiClient.post('/tags', data);
    return response.data;
  },

  // Update tag
  async updateTag(id: string, data: UpdateTagData): Promise<Tag> {
    const response = await apiClient.put(`/tags/${id}`, data);
    return response.data;
  },

  // Delete tag
  async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/tags/${id}`);
  }
};
