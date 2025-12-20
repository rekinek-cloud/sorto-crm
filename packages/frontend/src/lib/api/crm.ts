import { apiClient } from './client';
import {
  Company,
  Contact,
  Deal,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CreateContactRequest,
  UpdateContactRequest,
  CreateDealRequest,
  UpdateDealRequest,
  CompaniesResponse,
  ContactsResponse,
  DealsResponse,
  PipelineStage,
  CompanyFilters,
  ContactFilters,
  DealFilters
} from '@/types/crm';

// Companies API
export const companiesApi = {
  // Get all companies with filtering
  getAll: (filters?: CompanyFilters): Promise<CompaniesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return apiClient.get(`/companies?${params.toString()}`);
  },

  // Get company by ID
  getById: (id: string): Promise<Company> => {
    return apiClient.get(`/companies/${id}`);
  },

  // Create new company
  create: (data: CreateCompanyRequest): Promise<Company> => {
    return apiClient.post('/companies', data);
  },

  // Update company
  update: (id: string, data: UpdateCompanyRequest): Promise<Company> => {
    return apiClient.put(`/companies/${id}`, data);
  },

  // Delete company
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/companies/${id}`);
  }
};

// Contacts API
export const contactsApi = {
  // Get all contacts with filtering
  getAll: (filters?: ContactFilters): Promise<ContactsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return apiClient.get(`/contacts?${params.toString()}`);
  },

  // Get contact by ID
  getById: (id: string): Promise<Contact> => {
    return apiClient.get(`/contacts/${id}`);
  },

  // Create new contact
  create: (data: CreateContactRequest): Promise<Contact> => {
    return apiClient.post('/contacts', data);
  },

  // Update contact
  update: (id: string, data: UpdateContactRequest): Promise<Contact> => {
    return apiClient.put(`/contacts/${id}`, data);
  },

  // Delete contact
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/contacts/${id}`);
  }
};

// Deals API
export const dealsApi = {
  // Get all deals with filtering
  getAll: (filters?: DealFilters): Promise<DealsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return apiClient.get(`/deals?${params.toString()}`);
  },

  // Get deals pipeline summary
  getPipeline: (assignedToId?: string): Promise<PipelineStage[]> => {
    const params = new URLSearchParams();
    if (assignedToId) {
      params.append('assignedToId', assignedToId);
    }
    return apiClient.get(`/deals/pipeline?${params.toString()}`);
  },

  // Get deal by ID
  getById: (id: string): Promise<Deal> => {
    return apiClient.get(`/deals/${id}`);
  },

  // Create new deal
  create: (data: CreateDealRequest): Promise<Deal> => {
    return apiClient.post('/deals', data);
  },

  // Update deal
  update: (id: string, data: UpdateDealRequest): Promise<Deal> => {
    return apiClient.put(`/deals/${id}`, data);
  },

  // Delete deal
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/deals/${id}`);
  }
};