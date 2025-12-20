/**
 * Goals API Client - Cele Precyzyjne (RZUT)
 * Metodologia SORTO STREAMS
 */

import { apiClient } from './client';
import {
  PreciseGoal,
  GoalsResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalStatus,
} from '@/types/streams';

export const goalsApi = {
  /**
   * Pobierz listę celów
   */
  async getGoals(params?: {
    status?: GoalStatus;
    streamId?: string;
    page?: number;
    limit?: number;
  }): Promise<GoalsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.streamId) queryParams.append('streamId', params.streamId);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const response = await apiClient.get(`/goals?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Pobierz pojedynczy cel
   */
  async getGoal(id: string): Promise<PreciseGoal> {
    const response = await apiClient.get(`/goals/${id}`);
    return response.data;
  },

  /**
   * Utwórz nowy cel (RZUT)
   */
  async createGoal(data: CreateGoalRequest): Promise<PreciseGoal> {
    const response = await apiClient.post('/goals', data);
    return response.data;
  },

  /**
   * Aktualizuj cel
   */
  async updateGoal(id: string, data: UpdateGoalRequest): Promise<PreciseGoal> {
    const response = await apiClient.put(`/goals/${id}`, data);
    return response.data;
  },

  /**
   * Usuń cel
   */
  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },

  /**
   * Aktualizuj postęp celu
   */
  async updateProgress(id: string, currentValue: number): Promise<PreciseGoal> {
    const response = await apiClient.patch(`/goals/${id}/progress`, { currentValue });
    return response.data;
  },

  /**
   * Oznacz cel jako osiągnięty
   */
  async achieveGoal(id: string): Promise<PreciseGoal> {
    const response = await apiClient.post(`/goals/${id}/achieve`);
    return response.data;
  },

  /**
   * Pobierz statystyki celów
   */
  async getGoalsStats(): Promise<{
    total: number;
    active: number;
    achieved: number;
    failed: number;
    paused: number;
    averageProgress: number;
  }> {
    const response = await apiClient.get('/goals/stats');
    return response.data;
  },
};

export default goalsApi;
