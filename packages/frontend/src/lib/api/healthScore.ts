import apiClient from './client';
import { RelationshipHealth, HealthAlert } from '@/types/streams';

export interface HealthScoreFilters {
  entityType: 'COMPANY' | 'CONTACT' | 'DEAL';
  entityId: string;
}

export interface HealthAlertFilters {
  entityType?: 'COMPANY' | 'CONTACT' | 'DEAL';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  isResolved?: boolean;
}

export interface CreateHealthScoreRequest {
  entityType: 'COMPANY' | 'CONTACT' | 'DEAL';
  entityId: string;
  overallScore: number;
  touchpointScore?: number;
  responseScore?: number;
  engagementScore?: number;
  satisfactionScore?: number;
  trend?: 'RISING' | 'STABLE' | 'DECLINING' | 'CRITICAL';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UpdateHealthScoreRequest {
  overallScore?: number;
  touchpointScore?: number;
  responseScore?: number;
  engagementScore?: number;
  satisfactionScore?: number;
  trend?: 'RISING' | 'STABLE' | 'DECLINING' | 'CRITICAL';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CreateHealthAlertRequest {
  entityType: 'COMPANY' | 'CONTACT' | 'DEAL';
  entityId: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  suggestedAction?: string;
}

export interface UpdateHealthAlertRequest {
  isRead?: boolean;
  isDismissed?: boolean;
  isActioned?: boolean;
}

export const healthScoreApi = {
  async getHealthScore(filters: HealthScoreFilters): Promise<RelationshipHealth | null> {
    const params = new URLSearchParams();
    params.append('entityType', filters.entityType);
    params.append('entityId', filters.entityId);

    const response = await apiClient.get<RelationshipHealth | null>(`/health-score?${params.toString()}`);
    return response.data;
  },

  async getHealthAlerts(filters: HealthAlertFilters = {}): Promise<HealthAlert[]> {
    const params = new URLSearchParams();
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.isResolved !== undefined) params.append('isResolved', filters.isResolved.toString());

    const response = await apiClient.get<HealthAlert[]>(`/health-score/alerts?${params.toString()}`);
    return response.data;
  },

  async createHealthScore(data: CreateHealthScoreRequest): Promise<RelationshipHealth> {
    const response = await apiClient.post<RelationshipHealth>('/health-score', data);
    return response.data;
  },

  async updateHealthScore(id: string, data: UpdateHealthScoreRequest): Promise<RelationshipHealth> {
    const response = await apiClient.patch<RelationshipHealth>(`/health-score/${id}`, data);
    return response.data;
  },

  async createHealthAlert(data: CreateHealthAlertRequest): Promise<HealthAlert> {
    const response = await apiClient.post<HealthAlert>('/health-score/alerts', data);
    return response.data;
  },

  async updateHealthAlert(id: string, data: UpdateHealthAlertRequest): Promise<HealthAlert> {
    const response = await apiClient.patch<HealthAlert>(`/health-score/alerts/${id}`, data);
    return response.data;
  },
};

export default healthScoreApi;
