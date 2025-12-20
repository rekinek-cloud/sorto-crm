import apiClient, { ApiResponse } from './client';

export interface RecurringTask {
  id: string;
  title: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  pattern?: string;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  months: number[];
  time: string;
  nextOccurrence?: string;
  lastExecuted?: string;
  executionCount: number;
  context?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedMinutes?: number;
  isActive: boolean;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Business context relations
  companyId?: string;
  company?: {
    id: string;
    name: string;
  };
  contactId?: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  streamId?: string;
  stream?: {
    id: string;
    name: string;
    color: string;
  };
  dealId?: string;
  deal?: {
    id: string;
    title: string;
    value?: number;
    currency: string;
    stage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTaskData {
  title: string;
  description?: string;
  frequency: RecurringTask['frequency'];
  pattern?: string;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  months: number[];
  time: string;
  nextOccurrence?: string;
  context?: string;
  priority: RecurringTask['priority'];
  estimatedMinutes?: number;
  isActive?: boolean;
  assignedToId?: string;
  companyId?: string;
  contactId?: string;
  projectId?: string;
  streamId?: string;
  dealId?: string;
}

export interface RecurringTasksResponse {
  recurringTasks: RecurringTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface Company {
  id: string;
  name: string;
  status: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  assignedCompany?: {
    id: string;
    name: string;
  };
}

export interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
}

export interface Stream {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  currency: string;
  stage: string;
  company?: {
    id: string;
    name: string;
  };
}

export const recurringTasksApi = {
  // Get all recurring tasks
  getTasks: async (params?: {
    page?: number;
    limit?: number;
    frequency?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<RecurringTasksResponse> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.frequency) searchParams.set('frequency', params.frequency);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const url = `/recurring-tasks${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      console.log('getTasks: calling URL:', url);
      const response = await apiClient.get<ApiResponse<RecurringTasksResponse>>(url);
      console.log('getTasks: full response:', response);
      console.log('getTasks: response.data:', response.data);
      console.log('getTasks: response.data.data:', response.data.data);
      
      // Check response structure and return appropriate data
      if (response.data.data) {
        return response.data.data;
      } else if ((response.data as any).recurringTasks) {
        // Direct structure without .data wrapper
        return response.data as unknown as RecurringTasksResponse;
      } else {
        console.error('Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure');
      }
    } catch (error: any) {
      console.error('getTasks: API error:', error);
      throw error;
    }
  },

  // Create recurring task
  createTask: async (data: CreateRecurringTaskData): Promise<RecurringTask> => {
    try {
      console.log('createTask: sending data:', data);
      const response = await apiClient.post<ApiResponse<RecurringTask>>('/recurring-tasks', data);
      console.log('createTask: full response:', response);
      console.log('createTask: response.data:', response.data);
      console.log('createTask: response.data.data:', response.data.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if ((response.data as any).id) {
        // Direct task object without .data wrapper
        return response.data as unknown as RecurringTask;
      } else {
        console.error('createTask: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure for createTask');
      }
    } catch (error: any) {
      console.error('createTask: API error:', error);
      throw error;
    }
  },

  // Update recurring task
  updateTask: async (id: string, data: Partial<CreateRecurringTaskData>): Promise<RecurringTask> => {
    try {
      console.log('updateTask: id:', id, 'data:', data);
      const response = await apiClient.put<ApiResponse<RecurringTask>>(`/recurring-tasks/${id}`, data);
      console.log('updateTask: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if ((response.data as any).id) {
        return response.data as unknown as RecurringTask;
      } else {
        console.error('updateTask: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure for updateTask');
      }
    } catch (error: any) {
      console.error('updateTask: API error:', error);
      throw error;
    }
  },

  // Delete recurring task
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/recurring-tasks/${id}`);
  },

  // Get available users for delegation
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/recurring-tasks/users');
    return response.data.data;
  },

  // Get available companies
  getCompanies: async (): Promise<Company[]> => {
    try {
      console.log('getCompanies: calling API...');
      const response = await apiClient.get<ApiResponse<Company[]>>('/recurring-tasks/companies');
      console.log('getCompanies: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('getCompanies: API error:', error);
      return [];
    }
  },

  // Get available contacts
  getContacts: async (): Promise<Contact[]> => {
    try {
      console.log('getContacts: calling API...');
      const response = await apiClient.get<ApiResponse<Contact[]>>('/recurring-tasks/contacts');
      console.log('getContacts: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('getContacts: API error:', error);
      return [];
    }
  },

  // Get available projects
  getProjects: async (): Promise<Project[]> => {
    try {
      console.log('getProjects: calling API...');
      const response = await apiClient.get<ApiResponse<Project[]>>('/recurring-tasks/projects');
      console.log('getProjects: response.data:', response.data);
      
      if (response.data.data) {
        console.log('getProjects: returning data:', response.data.data);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('getProjects: direct array response:', response.data);
        return response.data;
      } else {
        console.log('getProjects: no data found, returning empty array');
        return [];
      }
    } catch (error: any) {
      console.error('getProjects: API error:', error);
      return [];
    }
  },

  // Get available streams
  getStreams: async (): Promise<Stream[]> => {
    try {
      console.log('getStreams: calling API...');
      const response = await apiClient.get<ApiResponse<Stream[]>>('/recurring-tasks/streams');
      console.log('getStreams: response.data:', response.data);
      
      if (response.data.data) {
        console.log('getStreams: returning data:', response.data.data);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('getStreams: direct array response:', response.data);
        return response.data;
      } else {
        console.log('getStreams: no data found, returning empty array');
        return [];
      }
    } catch (error: any) {
      console.error('getStreams: API error:', error);
      return [];
    }
  },

  // Get available deals
  getDeals: async (): Promise<Deal[]> => {
    const response = await apiClient.get<ApiResponse<Deal[]>>('/recurring-tasks/deals');
    return response.data.data;
  },

  // Generate tasks from recurring tasks
  generateTasks: async (): Promise<{ generated: number; errors: string[] }> => {
    try {
      console.log('generateTasks: triggering task generation...');
      const response = await apiClient.post<ApiResponse<{ generated: number; errors: string[] }>>('/recurring-tasks/generate', {});
      console.log('generateTasks: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if ((response.data as any).generated !== undefined) {
        return response.data as any;
      } else {
        console.error('generateTasks: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure for generateTasks');
      }
    } catch (error: any) {
      console.error('generateTasks: API error:', error);
      throw error;
    }
  },

  // Generate task from specific recurring task
  generateTaskFromRecurring: async (recurringTaskId: string): Promise<RecurringTask> => {
    try {
      console.log('generateTaskFromRecurring: id:', recurringTaskId);
      const response = await apiClient.post<ApiResponse<RecurringTask>>(`/recurring-tasks/${recurringTaskId}/generate`, {});
      console.log('generateTaskFromRecurring: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if ((response.data as any).id) {
        return response.data as any;
      } else {
        console.error('generateTaskFromRecurring: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure for generateTaskFromRecurring');
      }
    } catch (error: any) {
      console.error('generateTaskFromRecurring: API error:', error);
      throw error;
    }
  },

  // Preview tasks that would be generated
  previewGeneration: async (): Promise<Array<{
    recurringTask: RecurringTask;
    wouldGenerate: boolean;
    reason: string;
  }>> => {
    try {
      console.log('previewGeneration: getting preview...');
      const response = await apiClient.get<ApiResponse<Array<{
        recurringTask: RecurringTask;
        wouldGenerate: boolean;
        reason: string;
      }>>>('/recurring-tasks/preview');
      console.log('previewGeneration: response.data:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('previewGeneration: Unexpected response structure:', response.data);
        throw new Error('Unexpected API response structure for previewGeneration');
      }
    } catch (error: any) {
      console.error('previewGeneration: API error:', error);
      throw error;
    }
  },
};