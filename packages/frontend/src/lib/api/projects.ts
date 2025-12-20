import { apiClient } from './client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationId: string;
  streamId?: string;
  assignedToId?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  startDate?: string;
  endDate?: string;
  streamId?: string;
  assignedToId?: string;
}

export const projectsApi = {
  async getProjects(filters?: {
    status?: Project['status'];
    priority?: Project['priority'];
    streamId?: string;
    assignedToId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.streamId) params.append('streamId', filters.streamId);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const response = await apiClient.get<Project[]>(`/projects${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  async createProject(projectData: CreateProjectData): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', projectData);
    return response.data;
  },

  async updateProject(projectId: string, projectData: Partial<CreateProjectData>): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${projectId}`, projectData);
    return response.data;
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  async completeProject(projectId: string): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${projectId}/complete`);
    return response.data;
  },

  async getProjectTasks(projectId: string): Promise<any[]> {
    const response = await apiClient.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  async getProjectStats(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }> {
    const response = await apiClient.get(`/projects/${projectId}/stats`);
    return response.data;
  }
};