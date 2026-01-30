import { apiClient } from './client';

export interface DashboardStats {
  stats: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    totalProjects: number;
    activeProjects: number;
    totalStreams: number;
    inboxCount: number;
    urgentTasks: number;
    overdueCount: number;
  };
  recentTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    projectName?: string;
    contextName?: string;
  }[];
  timestamp: string;
}

export interface WeeklySummary {
  completedThisWeek: number;
  createdThisWeek: number;
  productivity: number;
}

export interface WeeklyReviewStats {
  currentWeek: {
    inboxItems: number;
    waitingForItems: number;
    completedThisWeek: number;
    overdueItems: number;
    nextActions: number;
    projects: number;
    somedayMaybeItems: number;
    reviewProgress: number;
    hasCurrentReview: boolean;
  };
  insights: {
    productivity: 'high' | 'medium' | 'low';
    urgency: 'high' | 'medium' | 'low';
    organization: 'good' | 'fair' | 'needs-attention';
  };
}

export interface BurndownData {
  burndownData: {
    week: number;
    weekStart: string;
    weekEnd: string;
    completedTasks: number;
    totalTasks: number;
    reviewCompletion: number;
    hasReview: boolean;
    stalledTasks: number;
    newTasks: number;
  }[];
  summary: {
    totalWeeks: number;
    weeksWithReview: number;
    reviewCompletionRate: number;
    averageTasksCompleted: number;
  };
}

export interface StreamHealth {
  id: string;
  name: string;
  type: string;
  status: string;
  color: string;
  taskCount: number;
  completedCount: number;
  overdueCount: number;
  healthScore: number;
}

export const productivityApi = {
  // Get dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  // Get weekly summary
  async getWeeklySummary(): Promise<WeeklySummary> {
    const response = await apiClient.get<WeeklySummary>('/dashboard/weekly-summary');
    return response.data;
  },

  // Get weekly review stats overview
  async getWeeklyReviewStats(): Promise<WeeklyReviewStats> {
    const response = await apiClient.get<WeeklyReviewStats>('/weekly-review/stats/overview');
    return response.data;
  },

  // Get burndown data
  async getBurndownData(weeks: number = 12): Promise<BurndownData> {
    const response = await apiClient.get<BurndownData>('/weekly-review/stats/burndown', {
      params: { weeks }
    });
    return response.data;
  },

  // Get stream health metrics
  async getStreamHealth(): Promise<StreamHealth[]> {
    try {
      const response = await apiClient.get<{ streams: StreamHealth[] }>('/streams/health');
      return response.data.streams || [];
    } catch {
      // Fallback: calculate from streams list
      const streamsRes = await apiClient.get<{ streams: any[] }>('/streams');
      const streams = streamsRes.data.streams || streamsRes.data || [];
      return streams.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type || 'CUSTOM',
        status: s.status || 'ACTIVE',
        color: s.color || '#6366f1',
        taskCount: s._count?.tasks || 0,
        completedCount: 0,
        overdueCount: 0,
        healthScore: 100
      }));
    }
  },

  // Get upcoming deadlines
  async getUpcomingDeadlines(): Promise<{ upcomingTasks: any[] }> {
    const response = await apiClient.get('/dashboard/upcoming-deadlines');
    return response.data;
  },

  // Get goals progress
  async getGoalsProgress(): Promise<any[]> {
    try {
      const response = await apiClient.get('/precise-goals');
      return response.data.goals || response.data || [];
    } catch {
      return [];
    }
  }
};
