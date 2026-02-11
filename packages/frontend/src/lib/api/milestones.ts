import apiClient from './client';
import { Milestone } from '@/types/gtd';

export interface MilestoneFilters {
  projectId: string;
  status?: string;
}

export interface CreateMilestoneRequest {
  projectId: string;
  name: string;
  description?: string;
  dueDate: string;
  isCritical?: boolean;
  dependsOnIds?: string[];
  responsibleId?: string;
}

export interface UpdateMilestoneRequest {
  name?: string;
  description?: string;
  dueDate?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'BLOCKED';
  isCritical?: boolean;
  dependsOnIds?: string[];
  responsibleId?: string;
}

export const milestonesApi = {
  async getMilestones(filters: MilestoneFilters): Promise<Milestone[]> {
    const params = new URLSearchParams();
    params.append('projectId', filters.projectId);
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get<Milestone[]>(`/milestones?${params.toString()}`);
    return response.data;
  },

  async getMilestone(id: string): Promise<Milestone> {
    const response = await apiClient.get<Milestone>(`/milestones/${id}`);
    return response.data;
  },

  async createMilestone(data: CreateMilestoneRequest): Promise<Milestone> {
    const response = await apiClient.post<Milestone>('/milestones', data);
    return response.data;
  },

  async updateMilestone(id: string, data: UpdateMilestoneRequest): Promise<Milestone> {
    const response = await apiClient.patch<Milestone>(`/milestones/${id}`, data);
    return response.data;
  },

  async deleteMilestone(id: string): Promise<void> {
    await apiClient.delete(`/milestones/${id}`);
  },
};

export default milestonesApi;
