import { apiClient } from './client';

export interface WeeklyReview {
  id: string;
  organizationId: string;
  reviewDate: string;
  notes?: string;
  nextActions?: string;
  collectLoosePapers: boolean;
  processNotes: boolean;
  emptyInbox: boolean;
  processVoicemails: boolean;
  reviewActionLists: boolean;
  reviewCalendar: boolean;
  reviewProjects: boolean;
  reviewWaitingFor: boolean;
  reviewSomedayMaybe: boolean;
  completedTasksCount?: number;
  newTasksCount?: number;
  stalledTasks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeeklyReviewData {
  reviewDate: string;
  notes?: string;
  nextActions?: string;
  collectLoosePapers?: boolean;
  processNotes?: boolean;
  emptyInbox?: boolean;
  processVoicemails?: boolean;
  reviewActionLists?: boolean;
  reviewCalendar?: boolean;
  reviewProjects?: boolean;
  reviewWaitingFor?: boolean;
  reviewSomedayMaybe?: boolean;
}

export interface UpdateWeeklyReviewData {
  notes?: string;
  nextActions?: string;
  collectLoosePapers?: boolean;
  processNotes?: boolean;
  emptyInbox?: boolean;
  processVoicemails?: boolean;
  reviewActionLists?: boolean;
  reviewCalendar?: boolean;
  reviewProjects?: boolean;
  reviewWaitingFor?: boolean;
  reviewSomedayMaybe?: boolean;
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

export interface BurndownWeek {
  week: number;
  weekStart: string;
  weekEnd: string;
  completedTasks: number;
  totalTasks: number;
  reviewCompletion: number;
  hasReview: boolean;
  stalledTasks: number;
  newTasks: number;
}

export interface BurndownData {
  burndownData: BurndownWeek[];
  summary: {
    totalWeeks: number;
    weeksWithReview: number;
    reviewCompletionRate: number;
    averageTasksCompleted: number;
  };
}

export const weeklyReviewApi = {
  // Get weekly reviews with pagination
  async getReviews(params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    reviews: WeeklyReview[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      pages: number;
    };
  }> {
    const response = await apiClient.get('/weekly-review', { params });
    return response.data;
  },

  // Get review by date
  async getReviewByDate(date: string): Promise<WeeklyReview> {
    const response = await apiClient.get(`/weekly-review/${date}`);
    return response.data;
  },

  // Create new review
  async createReview(data: CreateWeeklyReviewData): Promise<WeeklyReview> {
    const response = await apiClient.post('/weekly-review', data);
    return response.data;
  },

  // Update review
  async updateReview(date: string, data: UpdateWeeklyReviewData): Promise<WeeklyReview> {
    const response = await apiClient.put(`/weekly-review/${date}`, data);
    return response.data;
  },

  // Delete review
  async deleteReview(date: string): Promise<void> {
    await apiClient.delete(`/weekly-review/${date}`);
  },

  // Get stats overview
  async getStatsOverview(): Promise<WeeklyReviewStats> {
    const response = await apiClient.get('/weekly-review/stats/overview');
    return response.data;
  },

  // Get burndown data
  async getBurndownData(weeks: number = 12): Promise<BurndownData> {
    const response = await apiClient.get('/weekly-review/stats/burndown', {
      params: { weeks }
    });
    return response.data;
  }
};
