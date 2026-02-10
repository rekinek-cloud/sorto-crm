import { apiClient } from './client';

export interface DayDashboardData {
  briefing: {
    greeting: string;
    date: string;
    summary: string[];
    tip: string;
    urgencyLevel: 'calm' | 'busy' | 'critical';
  };
  source: {
    unprocessedCount: number;
    awaitingDecisionCount: number;
  };
  focusTasks: Array<{
    id: string;
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'NEW' | 'IN_PROGRESS';
    dueDate: string | null;
    isOverdue: boolean;
    estimatedHours: number | null;
    projectName: string | null;
    streamName: string | null;
    streamColor: string | null;
    companyName: string | null;
  }>;
  streams: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    streamType: string;
    activeTasks: number;
    completedTasks: number;
    totalTasks: number;
    completionPercent: number;
  }>;
  upcomingDeals: Array<{
    id: string;
    title: string;
    value: number | null;
    currency: string;
    stage: string;
    expectedCloseDate: string | null;
    companyName: string;
    companyId: string;
  }>;
  followups: Array<{
    companyId: string;
    companyName: string;
    lastInteractionAt: string | null;
    daysSinceContact: number;
    activeDealsCount: number;
    topDeal: {
      id: string;
      title: string;
      value: number | null;
      stage: string;
    } | null;
  }>;
  weekProgress: {
    days: Array<{
      dayName: string;
      date: string;
      completed: number;
      isToday: boolean;
    }>;
    totalCompleted: number;
    totalCreated: number;
  };
  generatedAt: string;
}

export const dayDashboardApi = {
  getDayDashboard: async (): Promise<DayDashboardData> => {
    const response = await apiClient.get('/dashboard/day');
    return response.data;
  }
};
