import apiClient from './client';
import { ClientIntelligence } from '@/types/streams';

export interface ClientIntelligenceResponse {
  items: ClientIntelligence[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClientIntelligenceFilters {
  entityType?: 'COMPANY' | 'CONTACT';
  entityId?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ClientBriefing {
  entityType: 'COMPANY' | 'CONTACT';
  entityId: string;
  summary: string;
  keyFacts: ClientIntelligence[];
  warnings: ClientIntelligence[];
  preferences: ClientIntelligence[];
  upcomingDates: ClientIntelligence[];
}

export interface CreateClientIntelligenceRequest {
  entityType: 'COMPANY' | 'CONTACT';
  entityId: string;
  category: 'LIKES' | 'DISLIKES' | 'PREFERENCE' | 'FACT' | 'WARNING' | 'TIP' | 'IMPORTANT_DATE' | 'DECISION_PROCESS' | 'COMMUNICATION' | 'SUCCESS';
  content: string;
  importance?: number;
  source?: string;
  sourceDate?: string;
  sourceContactId?: string;
  isPrivate?: boolean;
  eventDate?: string;
  isRecurring?: boolean;
}

export interface UpdateClientIntelligenceRequest {
  category?: 'LIKES' | 'DISLIKES' | 'PREFERENCE' | 'FACT' | 'WARNING' | 'TIP' | 'IMPORTANT_DATE' | 'DECISION_PROCESS' | 'COMMUNICATION' | 'SUCCESS';
  content?: string;
  importance?: number;
  source?: string;
  sourceDate?: string;
  sourceContactId?: string;
  isPrivate?: boolean;
  eventDate?: string;
  isRecurring?: boolean;
}

export const clientIntelligenceApi = {
  async getIntelligence(filters: ClientIntelligenceFilters = {}): Promise<ClientIntelligenceResponse> {
    const params = new URLSearchParams();
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.category) params.append('category', filters.category);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ClientIntelligenceResponse>(`/client-intelligence?${params.toString()}`);
    return response.data;
  },

  async getBriefing(entityType: 'COMPANY' | 'CONTACT', entityId: string): Promise<ClientBriefing> {
    const response = await apiClient.get<ClientBriefing>(`/client-intelligence/briefing/${entityType}/${entityId}`);
    return response.data;
  },

  async getIntelligenceItem(id: string): Promise<ClientIntelligence> {
    const response = await apiClient.get<ClientIntelligence>(`/client-intelligence/${id}`);
    return response.data;
  },

  async createIntelligence(data: CreateClientIntelligenceRequest): Promise<ClientIntelligence> {
    const response = await apiClient.post<ClientIntelligence>('/client-intelligence', data);
    return response.data;
  },

  async updateIntelligence(id: string, data: UpdateClientIntelligenceRequest): Promise<ClientIntelligence> {
    const response = await apiClient.patch<ClientIntelligence>(`/client-intelligence/${id}`, data);
    return response.data;
  },

  async deleteIntelligence(id: string): Promise<void> {
    await apiClient.delete(`/client-intelligence/${id}`);
  },
};

export default clientIntelligenceApi;
