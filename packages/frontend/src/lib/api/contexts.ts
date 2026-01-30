import { apiClient } from './client';

export interface Context {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    project?: { id: string; name: string };
    assignedTo?: { id: string; firstName: string; lastName: string };
  }[];
}

export interface CreateContextData {
  name: string; // Must start with @ and contain only letters, numbers, _ or -
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateContextData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export const contextsApi = {
  // Get all contexts
  async getContexts(isActive?: boolean): Promise<Context[]> {
    const params = isActive !== undefined ? { isActive: String(isActive) } : undefined;
    const response = await apiClient.get('/contexts', { params });
    return response.data;
  },

  // Get single context with tasks
  async getContext(id: string): Promise<Context> {
    const response = await apiClient.get(`/contexts/${id}`);
    return response.data;
  },

  // Create new context
  async createContext(data: CreateContextData): Promise<Context> {
    const response = await apiClient.post('/contexts', data);
    return response.data;
  },

  // Update context
  async updateContext(id: string, data: UpdateContextData): Promise<Context> {
    const response = await apiClient.put(`/contexts/${id}`, data);
    return response.data;
  },

  // Delete context
  async deleteContext(id: string): Promise<void> {
    await apiClient.delete(`/contexts/${id}`);
  }
};
