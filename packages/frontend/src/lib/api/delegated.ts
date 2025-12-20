import { apiClient } from './client';

export interface DelegatedTask {
  id: string;
  description: string;
  delegatedTo: string;
  delegatedOn: string;
  followUpDate?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD';
  notes?: string;
  organizationId: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
}

export interface DelegatedTasksResponse {
  delegatedTasks: DelegatedTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DelegatedTaskFilters {
  status?: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD' | 'all';
  delegatedTo?: string;
  search?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDelegatedTaskRequest {
  description: string;
  delegatedTo: string;
  followUpDate?: string;
  notes?: string;
  taskId?: string;
}

export interface UpdateDelegatedTaskRequest extends Partial<CreateDelegatedTaskRequest> {
  status?: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD';
}

export interface DelegatedTaskStats {
  totalDelegated: number;
  activeDelegated: number;
  completedDelegated: number;
  overdueDelegated: number;
  pendingFollowUp: number;
  statusBreakdown: Record<string, number>;
  topDelegates: Array<{
    name: string;
    count: number;
  }>;
}

export interface DelegationHistory {
  delegate: string;
  tasks: DelegatedTask[];
  stats: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const delegatedApi = {
  // Get all delegated tasks with filters and pagination
  async getDelegatedTasks(filters: DelegatedTaskFilters = {}): Promise<DelegatedTasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/delegated?${params.toString()}`);
    return response.data;
  },

  // Get single delegated task by ID
  async getDelegatedTask(id: string): Promise<DelegatedTask> {
    const response = await apiClient.get(`/delegated/${id}`);
    return response.data;
  },

  // Create new delegated task
  async createDelegatedTask(data: CreateDelegatedTaskRequest): Promise<DelegatedTask> {
    const response = await apiClient.post('/delegated', data);
    return response.data;
  },

  // Update delegated task
  async updateDelegatedTask(id: string, data: UpdateDelegatedTaskRequest): Promise<DelegatedTask> {
    const response = await apiClient.put(`/delegated/${id}`, data);
    return response.data;
  },

  // Delete delegated task
  async deleteDelegatedTask(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/delegated/${id}`);
    return response.data;
  },

  // Get delegated tasks statistics
  async getDelegatedTasksStats(): Promise<DelegatedTaskStats> {
    const response = await apiClient.get('/delegated/stats/overview');
    return response.data;
  },

  // Get delegation history for a specific person
  async getDelegationHistory(name: string, page = 1, limit = 10): Promise<DelegationHistory> {
    const response = await apiClient.get(`/delegated/delegate/${encodeURIComponent(name)}/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Helper: Get status color
  getStatusColor(status: string): { bg: string; text: string; border: string } {
    switch (status) {
      case 'NEW':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'IN_PROGRESS':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'COMPLETED':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'CANCELED':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'ON_HOLD':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  },

  // Helper: Get status icon
  getStatusIcon(status: string): string {
    switch (status) {
      case 'NEW':
        return '🆕';
      case 'IN_PROGRESS':
        return '⏳';
      case 'COMPLETED':
        return '✅';
      case 'CANCELED':
        return '❌';
      case 'ON_HOLD':
        return '⏸️';
      default:
        return '📋';
    }
  },

  // Helper: Check if task is overdue
  isOverdue(followUpDate?: string): boolean {
    if (!followUpDate) return false;
    return new Date(followUpDate) < new Date();
  },

  // Helper: Format follow-up date
  formatFollowUpDate(followUpDate?: string): string {
    if (!followUpDate) return 'No follow-up scheduled';
    
    const date = new Date(followUpDate);
    const now = new Date();
    const isOverdue = date < now;
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    };
    
    const formatted = date.toLocaleDateString('en-US', formatOptions);
    
    if (isOverdue) {
      return `Overdue: ${formatted}`;
    }
    
    // Check if it's today
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Today: ${formatted}`;
    }
    
    // Check if it's tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    if (isTomorrow) {
      return `Tomorrow: ${formatted}`;
    }
    
    return `Follow up: ${formatted}`;
  },

  // Helper: Get delegation urgency
  getDelegationUrgency(delegatedTask: DelegatedTask): 'high' | 'medium' | 'low' {
    if (delegatedTask.status === 'COMPLETED' || delegatedTask.status === 'CANCELED') {
      return 'low';
    }
    
    if (!delegatedTask.followUpDate) {
      return delegatedTask.status === 'NEW' ? 'medium' : 'low';
    }
    
    const followUpDate = new Date(delegatedTask.followUpDate);
    const now = new Date();
    const diffDays = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'high'; // Overdue
    if (diffDays <= 1) return 'high'; // Due today or tomorrow
    if (diffDays <= 3) return 'medium'; // Due in next 3 days
    return 'low';
  },

  // Helper: Get urgency color
  getUrgencyColor(urgency: 'high' | 'medium' | 'low'): string {
    switch (urgency) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  },

  // Helper: Format time since delegation
  formatTimeSinceDelegation(delegatedOn: string): string {
    const delegated = new Date(delegatedOn);
    const now = new Date();
    const diffMs = now.getTime() - delegated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  },

  // Helper: Get delegate initials
  getDelegateInitials(delegatedTo: string): string {
    return delegatedTo
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  },

  // Helper: Get delegate suggestions from API
  async getDelegateSuggestions(): Promise<string[]> {
    try {
      const response = await apiClient.get('/users/team-members');
      if (response.data?.users) {
        return response.data.users.map((user: { firstName: string; lastName: string }) =>
          `${user.firstName} ${user.lastName}`
        );
      }
      return [];
    } catch (error: any) {
      console.error('Failed to fetch delegate suggestions:', error);
      // Fallback do pustej listy w przypadku błędu
      return [];
    }
  },

  // Helper: Validate follow-up date
  validateFollowUpDate(followUpDate: string): string | null {
    const date = new Date(followUpDate);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }
    
    if (date < now) {
      return 'Follow-up date cannot be in the past';
    }
    
    // Check if it's too far in the future (more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (date > oneYearFromNow) {
      return 'Follow-up date cannot be more than 1 year in the future';
    }
    
    return null;
  }
};

export default delegatedApi;