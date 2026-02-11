import apiClient from './client';
import { ClientProduct, ClientProductStats } from '@/types/gtd';

export interface ClientProductsResponse {
  items: ClientProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClientProductFilters {
  companyId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateClientProductRequest {
  companyId: string;
  productId?: string;
  serviceId?: string;
  type?: string;
  status?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: string;
  startDate?: string;
  renewalDate?: string;
  contractEndDate?: string;
  autoRenew?: boolean;
  satisfactionScore?: number;
  usageLevel?: string;
  notes?: string;
}

export interface UpdateClientProductRequest {
  productId?: string;
  serviceId?: string;
  type?: string;
  status?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: string;
  startDate?: string;
  renewalDate?: string;
  contractEndDate?: string;
  autoRenew?: boolean;
  satisfactionScore?: number;
  usageLevel?: string;
  notes?: string;
}

export const clientProductsApi = {
  async getClientProducts(filters: ClientProductFilters = {}): Promise<ClientProductsResponse> {
    const params = new URLSearchParams();
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ClientProductsResponse>(`/client-products?${params.toString()}`);
    return response.data;
  },

  async getClientProductStats(companyId: string): Promise<ClientProductStats> {
    const response = await apiClient.get<ClientProductStats>(`/client-products/stats/${companyId}`);
    return response.data;
  },

  async getClientProduct(id: string): Promise<ClientProduct> {
    const response = await apiClient.get<ClientProduct>(`/client-products/${id}`);
    return response.data;
  },

  async createClientProduct(data: CreateClientProductRequest): Promise<ClientProduct> {
    const response = await apiClient.post<ClientProduct>('/client-products', data);
    return response.data;
  },

  async updateClientProduct(id: string, data: UpdateClientProductRequest): Promise<ClientProduct> {
    const response = await apiClient.patch<ClientProduct>(`/client-products/${id}`, data);
    return response.data;
  },

  async deleteClientProduct(id: string): Promise<void> {
    await apiClient.delete(`/client-products/${id}`);
  },
};

export default clientProductsApi;
