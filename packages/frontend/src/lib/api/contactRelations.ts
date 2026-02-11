import apiClient from './client';
import { ContactRelation } from '@/types/gtd';

export interface ContactRelationFilters {
  contactId?: string;
  type?: string;
}

export interface CreateContactRelationRequest {
  fromContactId: string;
  toContactId: string;
  type: 'REPORTS_TO' | 'WORKS_WITH' | 'KNOWS' | 'REFERRED_BY' | 'FAMILY' | 'TECHNICAL' | 'FORMER_COLLEAGUE' | 'MENTOR' | 'PARTNER';
  strength?: number;
  notes?: string;
  meetingContext?: string;
  isActive?: boolean;
}

export interface UpdateContactRelationRequest {
  type?: 'REPORTS_TO' | 'WORKS_WITH' | 'KNOWS' | 'REFERRED_BY' | 'FAMILY' | 'TECHNICAL' | 'FORMER_COLLEAGUE' | 'MENTOR' | 'PARTNER';
  strength?: number;
  notes?: string;
  meetingContext?: string;
  isActive?: boolean;
}

export const contactRelationsApi = {
  async getContactRelations(filters: ContactRelationFilters = {}): Promise<ContactRelation[]> {
    const params = new URLSearchParams();
    if (filters.contactId) params.append('contactId', filters.contactId);
    if (filters.type) params.append('type', filters.type);

    const response = await apiClient.get<ContactRelation[]>(`/contact-relations?${params.toString()}`);
    return response.data;
  },

  async getContactRelation(id: string): Promise<ContactRelation> {
    const response = await apiClient.get<ContactRelation>(`/contact-relations/${id}`);
    return response.data;
  },

  async createContactRelation(data: CreateContactRelationRequest): Promise<ContactRelation> {
    const response = await apiClient.post<ContactRelation>('/contact-relations', data);
    return response.data;
  },

  async updateContactRelation(id: string, data: UpdateContactRelationRequest): Promise<ContactRelation> {
    const response = await apiClient.patch<ContactRelation>(`/contact-relations/${id}`, data);
    return response.data;
  },

  async deleteContactRelation(id: string): Promise<void> {
    await apiClient.delete(`/contact-relations/${id}`);
  },
};

export default contactRelationsApi;
