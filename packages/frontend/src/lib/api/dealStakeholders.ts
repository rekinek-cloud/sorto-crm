import apiClient from './client';
import { DealStakeholder } from '@/types/gtd';

export interface DealStakeholdersResponse {
  stakeholders: DealStakeholder[];
  summary: {
    total: number;
    champions: number;
    blockers: number;
    averageInfluence: number;
    averageSentiment: string;
  };
}

export interface CreateDealStakeholderRequest {
  dealId: string;
  contactId: string;
  role: 'DECISION_MAKER' | 'INFLUENCER' | 'CHAMPION' | 'BLOCKER' | 'USER_ROLE' | 'TECHNICAL' | 'FINANCIAL' | 'LEGAL' | 'PROCUREMENT';
  isChampion?: boolean;
  influence?: number;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'NEGATIVE' | 'UNKNOWN';
  objections?: string;
  motivations?: string;
  winStrategy?: string;
}

export interface UpdateDealStakeholderRequest {
  role?: 'DECISION_MAKER' | 'INFLUENCER' | 'CHAMPION' | 'BLOCKER' | 'USER_ROLE' | 'TECHNICAL' | 'FINANCIAL' | 'LEGAL' | 'PROCUREMENT';
  isChampion?: boolean;
  influence?: number;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'NEGATIVE' | 'UNKNOWN';
  objections?: string;
  motivations?: string;
  winStrategy?: string;
  hasApproved?: boolean;
}

export const dealStakeholdersApi = {
  async getStakeholders(dealId: string): Promise<DealStakeholdersResponse> {
    const response = await apiClient.get<DealStakeholdersResponse>(`/deal-stakeholders/deal/${dealId}`);
    return response.data;
  },

  async getStakeholder(id: string): Promise<DealStakeholder> {
    const response = await apiClient.get<DealStakeholder>(`/deal-stakeholders/${id}`);
    return response.data;
  },

  async createStakeholder(data: CreateDealStakeholderRequest): Promise<DealStakeholder> {
    const response = await apiClient.post<DealStakeholder>('/deal-stakeholders', data);
    return response.data;
  },

  async updateStakeholder(id: string, data: UpdateDealStakeholderRequest): Promise<DealStakeholder> {
    const response = await apiClient.patch<DealStakeholder>(`/deal-stakeholders/${id}`, data);
    return response.data;
  },

  async deleteStakeholder(id: string): Promise<void> {
    await apiClient.delete(`/deal-stakeholders/${id}`);
  },
};

export default dealStakeholdersApi;
