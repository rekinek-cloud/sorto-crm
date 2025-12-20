import { apiClient } from './client';

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalStreams: number;
  inboxCount: number;
  urgentTasks: number;
  overdueCount: number;
}

export interface WeeklySummary {
  completedThisWeek: number;
  createdThisWeek: number;
  productivity: number;
}

export interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  projectName?: string;
  contextName?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentTasks: any[];
  timestamp: string;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardData> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  async getWeeklySummary(): Promise<WeeklySummary> {
    const response = await apiClient.get('/dashboard/weekly-summary');
    return response.data;
  },

  async getUpcomingDeadlines(): Promise<{ upcomingTasks: UpcomingTask[] }> {
    const response = await apiClient.get('/dashboard/upcoming-deadlines');
    return response.data;
  }
};
