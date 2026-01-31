import { apiClient } from './client';

export type InvoiceStatus = 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED';
export type InvoicePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InvoiceItemType = 'PRODUCT' | 'SERVICE' | 'CUSTOM';

export interface InvoiceItem {
  id?: string;
  itemType: InvoiceItemType;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice?: number;
  productId?: string;
  serviceId?: string;
  customName?: string;
  customDescription?: string;
  product?: { id: string; name: string };
  service?: { id: string; name: string };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  priority: InvoicePriority;
  dueDate?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  items: InvoiceItem[];
  // Fakturownia integration
  autoSync: boolean;
  fakturowniaId?: string;
  fakturowniaNumber?: string;
  fakturowniaStatus?: string;
  lastSyncedAt?: string;
  syncError?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  status?: InvoiceStatus;
  priority?: InvoicePriority;
  dueDate?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  autoSync?: boolean;
  items?: Omit<InvoiceItem, 'id' | 'totalPrice' | 'product' | 'service'>[];
}

export interface InvoiceSyncStatus {
  total: number;
  synced: number;
  pending: number;
  errors: number;
  lastSyncAt?: string;
}

export interface BulkSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: number;
  details: Array<{
    invoiceId: string;
    action: 'created' | 'updated' | 'error';
    fakturowniaId?: string;
    error?: string;
  }>;
}

export const invoicesApi = {
  // Get all invoices
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    search?: string;
    sync?: boolean;
  }): Promise<{
    invoices: Invoice[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },

  // Get single invoice
  async getInvoice(id: string): Promise<Invoice> {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  // Create invoice
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },

  // Update invoice
  async updateInvoice(id: string, data: Partial<CreateInvoiceData>): Promise<Invoice> {
    const response = await apiClient.put(`/invoices/${id}`, data);
    return response.data;
  },

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(`/invoices/${id}`);
  },

  // Send invoice via Fakturownia
  async sendInvoice(id: string, data: {
    recipient: string;
    subject?: string;
    message?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/invoices/${id}/send`, data);
    return response.data;
  },

  // Sync single invoice with Fakturownia
  async syncInvoice(id: string): Promise<Invoice> {
    const response = await apiClient.post(`/invoices/${id}/sync`);
    return response.data;
  },

  // Sync all invoices with Fakturownia
  async syncAllInvoices(): Promise<BulkSyncResult> {
    const response = await apiClient.post('/invoices/sync-all');
    return response.data;
  },

  // Get sync status
  async getSyncStatus(): Promise<InvoiceSyncStatus> {
    const response = await apiClient.get('/invoices/sync-status');
    return response.data;
  },

  // Import invoices from Fakturownia
  async importFromFakturownia(params?: {
    page?: number;
    perPage?: number;
    period?: string;
  }): Promise<{
    imported: number;
    skipped: number;
    errors: number;
  }> {
    const response = await apiClient.post('/invoices/import-from-fakturownia', params);
    return response.data;
  },

  // Trigger sync (admin only)
  async triggerSync(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/invoices/trigger-sync');
    return response.data;
  }
};
