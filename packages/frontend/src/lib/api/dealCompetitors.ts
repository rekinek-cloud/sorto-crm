import apiClient from './client';
import { DealCompetitor } from '@/types/streams';

export interface LostAnalysis {
  id: string;
  dealId: string;
  winnerName?: string;
  winnerPrice?: number;
  lostReasons: string[];
  lessonsLearned?: string;
  improvementAreas: string[];
  followUpDate?: string;
  followUpNotes?: string;
  createdAt: string;
}

export interface CreateDealCompetitorRequest {
  dealId: string;
  competitorName: string;
  competitorWebsite?: string;
  estimatedPrice?: number;
  priceSource?: string;
  currency?: string;
  threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  theirStrengths?: string;
  theirWeaknesses?: string;
  ourAdvantages?: string;
  intelNotes?: string;
  intelSource?: string;
  intelDate?: string;
}

export interface UpdateDealCompetitorRequest {
  competitorName?: string;
  competitorWebsite?: string;
  estimatedPrice?: number;
  priceSource?: string;
  currency?: string;
  threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  theirStrengths?: string;
  theirWeaknesses?: string;
  ourAdvantages?: string;
  status?: 'ACTIVE' | 'ELIMINATED' | 'WON' | 'UNKNOWN';
  eliminatedReason?: string;
  intelNotes?: string;
  intelSource?: string;
  intelDate?: string;
}

export interface CreateLostAnalysisRequest {
  dealId: string;
  winnerName?: string;
  winnerPrice?: number;
  lostReasons: string[];
  lessonsLearned?: string;
  improvementAreas: string[];
  followUpDate?: string;
  followUpNotes?: string;
}

export const dealCompetitorsApi = {
  async getCompetitors(dealId: string): Promise<DealCompetitor[]> {
    const response = await apiClient.get<DealCompetitor[]>(`/deal-competitors/deal/${dealId}`);
    return response.data;
  },

  async getLostAnalysis(dealId: string): Promise<LostAnalysis> {
    const response = await apiClient.get<LostAnalysis>(`/deal-competitors/lost-analysis/${dealId}`);
    return response.data;
  },

  async getCompetitor(id: string): Promise<DealCompetitor> {
    const response = await apiClient.get<DealCompetitor>(`/deal-competitors/${id}`);
    return response.data;
  },

  async createCompetitor(data: CreateDealCompetitorRequest): Promise<DealCompetitor> {
    const response = await apiClient.post<DealCompetitor>('/deal-competitors', data);
    return response.data;
  },

  async updateCompetitor(id: string, data: UpdateDealCompetitorRequest): Promise<DealCompetitor> {
    const response = await apiClient.patch<DealCompetitor>(`/deal-competitors/${id}`, data);
    return response.data;
  },

  async deleteCompetitor(id: string): Promise<void> {
    await apiClient.delete(`/deal-competitors/${id}`);
  },

  async createLostAnalysis(data: CreateLostAnalysisRequest): Promise<LostAnalysis> {
    const response = await apiClient.post<LostAnalysis>('/deal-competitors/lost-analysis', data);
    return response.data;
  },
};

export default dealCompetitorsApi;
