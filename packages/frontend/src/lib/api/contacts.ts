import apiClient from './client';
import { Contact } from '@/types/crm';

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  companyId?: string;
  notes?: string;
  tags?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {}

export const contactsApi = {
  // Get all contacts with filtering and pagination
  async getContacts(filters: ContactFilters = {}): Promise<ContactsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<ContactsResponse>(`/contacts?${params.toString()}`);
    return response.data;
  },

  // Get contact by ID
  async getContact(id: string): Promise<Contact> {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return response.data;
  },

  // Create new contact
  async createContact(data: CreateContactRequest): Promise<Contact> {
    const response = await apiClient.post<Contact>('/contacts', data);
    return response.data;
  },

  // Update contact
  async updateContact(id: string, data: UpdateContactRequest): Promise<Contact> {
    const response = await apiClient.put<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  // Delete contact
  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/contacts/${id}`);
  },

  // Get contacts by company
  async getContactsByCompany(companyId: string): Promise<Contact[]> {
    const response = await this.getContacts({ companyId, limit: 100 });
    return response.contacts;
  }
};

export default contactsApi;