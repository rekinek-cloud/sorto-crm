import { apiClient } from './client';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  company?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  deal?: {
    id: string;
    title: string;
    value?: number;
    stage: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
  meeting?: {
    id: string;
    title: string;
    startTime: string;
  };
  // Communication fields
  communicationType?: string;
  communicationDirection?: string;
  communicationSubject?: string;
  communicationBody?: string;
  communicationDuration?: number;
  communicationStatus?: string;
}

export interface ActivitiesResponse {
  activities: ActivityItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const activitiesApi = {
  // Get activities with filtering
  getActivities: async (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    type?: string;
    userId?: string;
  }): Promise<ActivitiesResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.entityType) searchParams.append('entityType', params.entityType);
    if (params?.entityId) searchParams.append('entityId', params.entityId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.userId) searchParams.append('userId', params.userId);

    const response = await apiClient.get(`/activities?${searchParams.toString()}`);
    return response.data;
  },

  // Get activities for a specific company
  getCompanyActivities: async (companyId: string, limit?: number): Promise<ActivityItem[]> => {
    const timestamp = Date.now();
    const params = limit ? `?limit=${limit}&_t=${timestamp}` : `?_t=${timestamp}`;
    const response = await apiClient.get(`/activities/company/${companyId}${params}`);
    return response.data;
  }
};

export default activitiesApi;