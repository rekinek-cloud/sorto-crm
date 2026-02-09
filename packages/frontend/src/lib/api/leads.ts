import apiClient from './client';

export interface Lead {
  id: string;
  title: string;
  description?: string;
  company?: string;
  contactPerson?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  source?: string;
  value?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadRequest {
  title: string;
  description?: string;
  company?: string;
  contactPerson?: string;
  status?: string;
  priority?: string;
  source?: string;
  value?: number;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {}

export const leadsApi = {
  async getLeads(filters: LeadFilters = {}): Promise<LeadsResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<LeadsResponse>(`/leads?${params.toString()}`);
    return response.data;
  },

  async getLead(id: string): Promise<Lead> {
    const response = await apiClient.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  async createLead(data: CreateLeadRequest): Promise<Lead> {
    const response = await apiClient.post<Lead>('/leads', data);
    return response.data;
  },

  async updateLead(id: string, data: UpdateLeadRequest): Promise<Lead> {
    const response = await apiClient.put<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  async deleteLead(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },
};

export default leadsApi;
