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

// Manager dashboard types
export interface TeamActivity {
  type: 'TASK_COMPLETED' | 'DEAL_UPDATED';
  userId: string;
  userName: string;
  title: string;
  timestamp: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface Risk {
  type: 'PROJECT_BEHIND' | 'TASK_OVERDUE';
  title: string;
  deadline: string | null;
  progress?: number;
  assignee?: string;
}

export interface ManagerDashboardData {
  teamActivity: { activities: TeamActivity[] };
  productivity: { members: TeamMember[] };
  risks: { risks: Risk[] };
}

export const dayDashboardApi = {
  getDayDashboard: async (): Promise<DayDashboardData> => {
    const response = await apiClient.get('/dashboard/day');
    return response.data;
  },

  getManagerTeamActivity: async (): Promise<{ activities: TeamActivity[] }> => {
    const response = await apiClient.get('/dashboard/manager/team-activity');
    return response.data;
  },

  getManagerProductivity: async (): Promise<{ members: TeamMember[] }> => {
    const response = await apiClient.get('/dashboard/manager/productivity');
    return response.data;
  },

  getManagerRisks: async (): Promise<{ risks: Risk[] }> => {
    const response = await apiClient.get('/dashboard/manager/risks');
    return response.data;
  },

  getManagerDashboard: async (): Promise<ManagerDashboardData> => {
    const [teamActivity, productivity, risks] = await Promise.all([
      dayDashboardApi.getManagerTeamActivity(),
      dayDashboardApi.getManagerProductivity(),
      dayDashboardApi.getManagerRisks(),
    ]);
    return { teamActivity, productivity, risks };
  },
};
