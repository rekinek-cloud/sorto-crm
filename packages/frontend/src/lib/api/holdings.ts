import apiClient from './client';
import { Holding, OrganizationSummary } from '@/types/holding';

export const holdingsApi = {
  async getHoldings(): Promise<Holding[]> {
    const response = await apiClient.get<Holding[]>('/holdings');
    return response.data;
  },

  async getHolding(id: string): Promise<Holding> {
    const response = await apiClient.get<Holding>(`/holdings/${id}`);
    return response.data;
  },

  async createHolding(data: Partial<Holding>): Promise<Holding> {
    const response = await apiClient.post<Holding>('/holdings', data);
    return response.data;
  },

  async updateHolding(id: string, data: Partial<Holding>): Promise<Holding> {
    const response = await apiClient.patch<Holding>(`/holdings/${id}`, data);
    return response.data;
  },

  async addOrganization(holdingId: string, data: Partial<OrganizationSummary>): Promise<OrganizationSummary> {
    const response = await apiClient.post<OrganizationSummary>(`/holdings/${holdingId}/organizations`, data);
    return response.data;
  },

  async switchOrganization(organizationId: string): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>('/context/switch', { organizationId });
    return response.data;
  },

  async getCurrentContext(): Promise<{ organizationId: string; holdingId: string; role: string }> {
    const response = await apiClient.get<{ organizationId: string; holdingId: string; role: string }>('/context/current');
    return response.data;
  },
};

export default holdingsApi;
