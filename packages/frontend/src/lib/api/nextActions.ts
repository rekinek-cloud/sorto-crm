/**
 * Next Actions API Client
 * GTD Next Actions endpoints
 */

import { apiClient } from './client';

export interface NextAction {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  context?: string;
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedTime?: string;
  stream?: {
    name: string;
    color: string;
  };
  project?: {
    name: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

export interface CreateNextActionData {
  title: string;
  description?: string;
  context: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  energy: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedTime?: string;
}

export const nextActionsApi = {
  /**
   * Get all next actions with filters
   */
  async getNextActions(filters?: {
    priority?: string;
    energy?: string;
    context?: string;
  }): Promise<NextAction[]> {
    const response = await apiClient.get('/nextactions', { params: filters });
    return response.data;
  },

  /**
   * Create a new next action
   */
  async createNextAction(data: CreateNextActionData): Promise<NextAction> {
    const response = await apiClient.post('/nextactions', data);
    return response.data;
  },

  /**
   * Complete a next action
   */
  async completeNextAction(id: string): Promise<void> {
    await apiClient.post(`/nextactions/${id}/complete`);
  },

  /**
   * Update context of a next action
   */
  async updateContext(id: string, context: string): Promise<void> {
    await apiClient.put(`/nextactions/${id}/context`, { context });
  },

  /**
   * Get list of available contexts
   */
  async getContextsList(): Promise<string[]> {
    const response = await apiClient.get('/tasks/contexts/list-public');
    return response.data;
  },
};
