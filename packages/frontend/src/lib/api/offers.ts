import { apiClient } from './client';

export interface OfferItem {
  id?: string;
  itemType: 'PRODUCT' | 'SERVICE' | 'CUSTOM';
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice?: number;
  productId?: string;
  serviceId?: string;
  customName?: string;
  customDescription?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  service?: {
    id: string;
    name: string;
  };
}

export interface Offer {
  id: string;
  offerNumber: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  currency: string;
  subtotal?: number;
  totalDiscount?: number;
  totalTax?: number;
  totalAmount?: number;
  validUntil?: string;
  sentDate?: string;
  acceptedDate?: string;
  rejectedDate?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  company?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  deal?: {
    id: string;
    title: string;
    stage: string;
  };
  items: OfferItem[];
}

export interface CreateOfferData {
  title: string;
  description?: string;
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  currency?: string;
  validUntil?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  items: Omit<OfferItem, 'id' | 'totalPrice' | 'product' | 'service'>[];
}

export interface UpdateOfferData extends Partial<CreateOfferData> {
  items?: Omit<OfferItem, 'id' | 'totalPrice' | 'product' | 'service'>[];
}

export interface OfferFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OfferStats {
  totalOffers: number;
  totalValue: number;
  byStatus: Record<string, { count: number; value: number }>;
}

export const offersApi = {
  // Get offers with filters and pagination
  getOffers: async (filters?: OfferFilters) => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/offers?${params.toString()}`);
    return response.data as {
      offers: Offer[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  },

  // Get offer by ID
  getOffer: async (id: string) => {
    const response = await apiClient.get(`/offers/${id}`);
    return response.data as Offer;
  },

  // Create new offer
  createOffer: async (data: CreateOfferData) => {
    const response = await apiClient.post('/offers', data);
    return response.data as Offer;
  },

  // Update offer
  updateOffer: async (id: string, data: UpdateOfferData) => {
    const response = await apiClient.put(`/offers/${id}`, data);
    return response.data as Offer;
  },

  // Update offer status
  updateOfferStatus: async (id: string, status: Offer['status']) => {
    const response = await apiClient.patch(`/offers/${id}/status`, { status });
    return response.data as Offer;
  },

  // Delete offer
  deleteOffer: async (id: string) => {
    await apiClient.delete(`/offers/${id}`);
  },

  // Get offer statistics
  getOfferStats: async () => {
    const response = await apiClient.get('/offers/meta/stats');
    return response.data as OfferStats;
  }
};