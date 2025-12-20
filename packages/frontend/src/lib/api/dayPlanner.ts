/**
 * Day Planner API Client
 * Metodologia SORTO STREAMS (ex smartDayPlanner)
 */

import { apiClient } from './client';
import { Task } from '@/types/streams';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'TASK' | 'MEETING' | 'BREAK' | 'FOCUS' | 'CUSTOM';
  taskId?: string;
  task?: Task;
  color?: string;
  isCompleted: boolean;
}

export interface DayPlan {
  date: string;
  blocks: TimeBlock[];
  suggestedTasks: Task[];
  stats: {
    plannedHours: number;
    completedHours: number;
    tasksPlanned: number;
    tasksCompleted: number;
  };
}

export interface DayPlannerSettings {
  workStartTime: string;
  workEndTime: string;
  breakDuration: number;
  focusBlockDuration: number;
  autoSchedule: boolean;
}

export const dayPlannerApi = {
  /**
   * Pobierz plan dnia
   */
  async getDayPlan(date?: string): Promise<DayPlan> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const response = await apiClient.get(`/day-planner?date=${queryDate}`);
    return response.data;
  },

  /**
   * Pobierz plan tygodnia
   */
  async getWeekPlan(startDate?: string): Promise<DayPlan[]> {
    const queryParams = startDate ? `?startDate=${startDate}` : '';
    const response = await apiClient.get(`/day-planner/week${queryParams}`);
    return response.data;
  },

  /**
   * Dodaj blok czasowy
   */
  async addTimeBlock(data: Omit<TimeBlock, 'id' | 'isCompleted'>): Promise<TimeBlock> {
    const response = await apiClient.post('/day-planner/blocks', data);
    return response.data;
  },

  /**
   * Aktualizuj blok czasowy
   */
  async updateTimeBlock(id: string, data: Partial<TimeBlock>): Promise<TimeBlock> {
    const response = await apiClient.put(`/day-planner/blocks/${id}`, data);
    return response.data;
  },

  /**
   * Usuń blok czasowy
   */
  async deleteTimeBlock(id: string): Promise<void> {
    await apiClient.delete(`/day-planner/blocks/${id}`);
  },

  /**
   * Oznacz blok jako ukończony
   */
  async completeBlock(id: string): Promise<TimeBlock> {
    const response = await apiClient.post(`/day-planner/blocks/${id}/complete`);
    return response.data;
  },

  /**
   * Pobierz sugestie AI dla dnia
   */
  async getAISuggestions(date?: string): Promise<{
    suggestedTasks: Task[];
    suggestedSchedule: TimeBlock[];
    tips: string[];
  }> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const response = await apiClient.get(`/day-planner/suggestions?date=${queryDate}`);
    return response.data;
  },

  /**
   * Auto-zaplanuj dzień
   */
  async autoSchedule(date?: string): Promise<DayPlan> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const response = await apiClient.post(`/day-planner/auto-schedule?date=${queryDate}`);
    return response.data;
  },

  /**
   * Pobierz ustawienia
   */
  async getSettings(): Promise<DayPlannerSettings> {
    const response = await apiClient.get('/day-planner/settings');
    return response.data;
  },

  /**
   * Zapisz ustawienia
   */
  async saveSettings(settings: Partial<DayPlannerSettings>): Promise<DayPlannerSettings> {
    const response = await apiClient.put('/day-planner/settings', settings);
    return response.data;
  },
};

export default dayPlannerApi;
