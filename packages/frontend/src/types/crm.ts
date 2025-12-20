// CRM Types for frontend

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  revenue?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  status: 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'INACTIVE' | 'ARCHIVED';
  organizationId: string;
  primaryContactId?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  primaryContact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deals?: Deal[];
  _count?: {
    deals: number;
  };
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  department?: string;
  notes?: string;
  tags?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'CUSTOMER' | 'ARCHIVED';
  source?: string;
  organizationId: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  assignedCompany?: {
    id: string;
    name: string;
  };
  companies?: {
    id: string;
    name: string;
  }[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value?: number;
  currency: string;
  probability?: number;
  stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  companyId: string;
  ownerId: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  source?: string;
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  company?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Request types
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

// Response types
export interface CompaniesResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DealsResponse {
  deals: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PipelineStage {
  stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  count: number;
  value: number;
}

// Filter types
export interface CompanyFilters {
  search?: string;
  status?: string;
  industry?: string;
  size?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContactFilters {
  search?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DealFilters {
  search?: string;
  status?: string;
  stage?: string;
  companyId?: string;
  assignedToId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}