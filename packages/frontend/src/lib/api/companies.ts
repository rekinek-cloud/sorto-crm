import apiClient from './client';
import { Company } from '@/types/crm';

export interface CompaniesResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'INACTIVE' | 'ARCHIVED';
  size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  industry?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  status?: 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'INACTIVE' | 'ARCHIVED';
  address?: string;
  phone?: string;
  email?: string;
  tags?: string[];
}

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {}

export const companiesApi = {
  // Get all companies with filtering and pagination
  async getCompanies(filters: CompanyFilters = {}): Promise<CompaniesResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.size) params.append('size', filters.size);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<CompaniesResponse>(`/companies?${params.toString()}`);
    return response.data;
  },

  // Get company by ID
  async getCompany(id: string): Promise<Company> {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return response.data;
  },

  // Create new company
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await apiClient.post<Company>('/companies', data);
    return response.data;
  },

  // Update company
  async updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
    const response = await apiClient.put<Company>(`/companies/${id}`, data);
    return response.data;
  },

  // Delete company
  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  },

  // Get companies by status
  async getCompaniesByStatus(status: 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'INACTIVE' | 'ARCHIVED'): Promise<Company[]> {
    const response = await this.getCompanies({ status, limit: 100 });
    return response.companies;
  },

  // Search companies
  async searchCompanies(query: string): Promise<Company[]> {
    const response = await this.getCompanies({ search: query, limit: 20 });
    return response.companies;
  }
};

export default companiesApi;