import { apiClient } from './client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  context?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationId: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  context?: string;
  dueDate?: string;
}

export const tasksApi = {
  async getTasks(filters?: {
    status?: Task['status'];
    priority?: Task['priority'];
    context?: string;
    limit?: number;
    offset?: number;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.context) params.append('context', filters.context);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const response = await apiClient.get<Task[]>(`/gtd/tasks${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/gtd/tasks/${taskId}`);
    return response.data;
  },

  async createTask(taskData: CreateTaskData): Promise<Task> {
    const response = await apiClient.post<Task>('/gtd/tasks', taskData);
    return response.data;
  },

  async updateTask(taskId: string, taskData: Partial<CreateTaskData>): Promise<Task> {
    const response = await apiClient.put<Task>(`/gtd/tasks/${taskId}`, taskData);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/gtd/tasks/${taskId}`);
  },

  async completeTask(taskId: string): Promise<Task> {
    const response = await apiClient.put<Task>(`/gtd/tasks/${taskId}/complete`);
    return response.data;
  },

  async delegateTask(taskId: string, assigneeId: string, notes?: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/gtd/tasks/${taskId}/delegate`, {
      assigneeId,
      notes
    });
    return response.data;
  }
};