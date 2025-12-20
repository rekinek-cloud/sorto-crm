import { apiClient } from './client';

export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency: string;
  billingType: 'ONE_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'PROJECT_BASED';
  duration?: number;
  unit?: string;
  deliveryMethod: 'REMOTE' | 'ON_SITE' | 'HYBRID' | 'DIGITAL_DELIVERY' | 'PHYSICAL_DELIVERY';
  estimatedDeliveryDays?: number;
  requirements?: string;
  resources?: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE' | 'DISCONTINUED';
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCreateData {
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency?: string;
  billingType?: 'ONE_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'PROJECT_BASED';
  duration?: number;
  unit?: string;
  deliveryMethod?: 'REMOTE' | 'ON_SITE' | 'HYBRID' | 'DIGITAL_DELIVERY' | 'PHYSICAL_DELIVERY';
  estimatedDeliveryDays?: number;
  requirements?: string;
  resources?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  images?: string[];
}

export interface ServiceUpdateData extends Partial<ServiceCreateData> {}

export interface ServicesResponse {
  services: Service[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ServiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE' | 'DISCONTINUED';
  billingType?: 'ONE_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'PROJECT_BASED';
  deliveryMethod?: 'REMOTE' | 'ON_SITE' | 'HYBRID' | 'DIGITAL_DELIVERY' | 'PHYSICAL_DELIVERY';
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryData {
  category: string;
  subcategories: string[];
}

export interface BillingTypeOption {
  value: 'ONE_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'PROJECT_BASED';
  label: string;
}

export interface DeliveryMethodOption {
  value: 'REMOTE' | 'ON_SITE' | 'HYBRID' | 'DIGITAL_DELIVERY' | 'PHYSICAL_DELIVERY';
  label: string;
}

export const servicesApi = {
  // Get all services with filtering and pagination
  getServices: async (query?: ServiceQuery): Promise<ServicesResponse> => {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/services?${params.toString()}`);
    return response.data;
  },

  // Get single service by ID
  getService: async (id: string): Promise<Service> => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data;
  },

  // Create new service
  createService: async (data: ServiceCreateData): Promise<Service> => {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  // Update existing service
  updateService: async (id: string, data: ServiceUpdateData): Promise<Service> => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },

  // Delete service
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },

  // Get service categories
  getCategories: async (): Promise<CategoryData[]> => {
    const response = await apiClient.get('/services/meta/categories');
    return response.data;
  },

  // Get billing types
  getBillingTypes: async (): Promise<BillingTypeOption[]> => {
    const response = await apiClient.get('/services/meta/billing-types');
    return response.data;
  },

  // Get delivery methods
  getDeliveryMethods: async (): Promise<DeliveryMethodOption[]> => {
    const response = await apiClient.get('/services/meta/delivery-methods');
    return response.data;
  },

  // Duplicate service
  duplicateService: async (id: string): Promise<Service> => {
    const response = await apiClient.post(`/services/${id}/duplicate`);
    return response.data;
  }
};