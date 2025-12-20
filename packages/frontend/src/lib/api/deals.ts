import apiClient from './client';
import { Deal } from '@/types/crm';

export interface DealsResponse {
  deals: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DealFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'OPEN' | 'WON' | 'LOST';
  stage?: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  companyId?: string;
  assignedToId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDealRequest {
  title: string;
  description?: string;
  value?: number;
  currency?: string;
  probability?: number;
  status?: 'OPEN' | 'WON' | 'LOST';
  stage?: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  companyId: string;
  contactId?: string;
  assignedToId?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  lostReason?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateDealRequest extends Partial<CreateDealRequest> {
  companyId?: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

export const dealsApi = {
  // Get all deals with filtering and pagination
  async getDeals(filters: DealFilters = {}): Promise<DealsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<DealsResponse>(`/deals?${params.toString()}`);
    return response.data;
  },

  // Get pipeline summary
  async getPipeline(assignedToId?: string): Promise<PipelineStage[]> {
    const params = new URLSearchParams();
    if (assignedToId) params.append('assignedToId', assignedToId);

    const response = await apiClient.get<PipelineStage[]>(`/deals/pipeline?${params.toString()}`);
    return response.data;
  },

  // Get deal by ID
  async getDeal(id: string): Promise<Deal> {
    const response = await apiClient.get<Deal>(`/deals/${id}`);
    return response.data;
  },

  // Create new deal
  async createDeal(data: CreateDealRequest): Promise<Deal> {
    const response = await apiClient.post<Deal>('/deals', data);
    return response.data;
  },

  // Update deal
  async updateDeal(id: string, data: UpdateDealRequest): Promise<Deal> {
    const response = await apiClient.put<Deal>(`/deals/${id}`, data);
    return response.data;
  },

  // Delete deal
  async deleteDeal(id: string): Promise<void> {
    await apiClient.delete(`/deals/${id}`);
  },

  // Get deals by company
  async getDealsByCompany(companyId: string): Promise<Deal[]> {
    const response = await this.getDeals({ companyId, limit: 100 });
    return response.deals;
  },

  // Get deals by stage
  async getDealsByStage(stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED'): Promise<Deal[]> {
    const response = await this.getDeals({ stage, limit: 100 });
    return response.deals;
  }
};

export default dealsApi;