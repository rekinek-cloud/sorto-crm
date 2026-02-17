import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import logger from '../config/logger';

export interface FakturowniaConfig {
  domain: string; // e.g., 'mycompany.fakturownia.pl' or just 'mycompany'
  apiToken: string;
  environment?: 'production' | 'sandbox';
}

export interface FakturowniaInvoice {
  id?: number;
  number?: string;
  place?: string;
  issue_date?: string; // YYYY-MM-DD format
  payment_to?: string; // YYYY-MM-DD format
  seller_name?: string;
  seller_tax_no?: string;
  seller_street?: string;
  seller_city?: string;
  seller_post_code?: string;
  seller_country?: string;
  seller_email?: string;
  seller_phone?: string;
  seller_fax?: string;
  seller_www?: string;
  seller_person?: string;
  seller_bank?: string;
  seller_bank_account?: string;
  buyer_name?: string;
  buyer_tax_no?: string;
  buyer_post_code?: string;
  buyer_city?: string;
  buyer_street?: string;
  buyer_country?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_fax?: string;
  buyer_www?: string;
  buyer_person?: string;
  buyer_bank?: string;
  buyer_bank_account?: string;
  total_price_gross?: string;
  total_price_net?: string;
  currency?: string;
  status?: string;
  description?: string;
  paid?: string;
  oid?: string; // our internal ID
  warehouse_id?: number;
  seller_id?: number;
  buyer_id?: number;
  positions?: FakturowniaInvoicePosition[];
  invoice_template_id?: number;
  advance_creation?: boolean;
  from_invoice_id?: number;
  kind?: string; 
  payment_type?: string;
  payment_to_kind?: number;
  exchange_currency?: string;
  internal_note?: string;
  invoice_id?: number;
  correction?: boolean;
  from_api?: boolean;
  api_token?: string;
  show_discount?: boolean;
  sent_time?: string;
  print_time?: string;
  recurring_id?: number;
  tax2_visible?: boolean;
  warehouse_document_id?: number;
  exchange_kind?: string;
  exchange_rate?: string;
  use_delivery_address?: boolean;
  delivery_address?: string;
  accounting_kind?: string;
  buyer_first_name?: string;
  buyer_last_name?: string;
}

export interface FakturowniaInvoicePosition {
  id?: number;
  name?: string;
  description?: string;
  tax?: string;
  price_net?: string;
  price_gross?: string;
  quantity?: string;
  quantity_unit?: string;
  total_price_net?: string;
  total_price_gross?: string;
  invoice_id?: number;
  product_id?: number;
  variant_id?: number;
  discount?: string;
  discount_percent?: string;
  additional_info?: string;
  code?: string;
  accounting_tax_kind?: string;
}

export interface FakturowniaResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FakturowniaListResponse<T> {
  invoices?: T[];
  page?: number;
  per_page?: number;
  total_count?: number;
}

export interface FakturowniaClient {
  // Invoice operations
  createInvoice(invoice: FakturowniaInvoice): Promise<FakturowniaInvoice>;
  getInvoice(id: number): Promise<FakturowniaInvoice>;
  updateInvoice(id: number, invoice: Partial<FakturowniaInvoice>): Promise<FakturowniaInvoice>;
  deleteInvoice(id: number): Promise<boolean>;
  listInvoices(params?: {
    page?: number;
    per_page?: number;
    period?: string;
    include_positions?: boolean;
    client_id?: number;
  }): Promise<FakturowniaListResponse<FakturowniaInvoice>>;
  
  // Invoice actions
  sendInvoice(id: number, options?: {
    recipient?: string;
    subject?: string;
    message?: string;
  }): Promise<boolean>;
  
  // Sync operations
  syncInvoice(localInvoiceId: string, fakturowniaId?: number): Promise<FakturowniaInvoice>;
}

export class FakturowniaApiClient implements FakturowniaClient {
  private client: AxiosInstance;
  private config: FakturowniaConfig;

  constructor(config: FakturowniaConfig) {
    this.config = config;
    
    // Ensure domain format
    const domain = config.domain.includes('.') 
      ? config.domain 
      : `${config.domain}.fakturownia.pl`;

    this.client = axios.create({
      baseURL: `https://${domain}`,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      }
    });

    // Request interceptor to add API token to all requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add api_token as query parameter (alternative to Bearer token)
        const separator = config.url?.includes('?') ? '&' : '?';
        if (config.url) {
          config.url += `${separator}api_token=${this.config.apiToken}`;
        }
        return config;
      },
      (error) => {
        logger.error('Fakturownia request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Fakturownia API response:', {
          url: response.config?.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('Fakturownia API error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async createInvoice(invoice: FakturowniaInvoice): Promise<FakturowniaInvoice> {
    try {
      logger.info('Creating invoice in Fakturownia:', { oid: invoice.oid });
      
      const payload = {
        invoice: {
          ...invoice,
          from_api: true
        }
      };

      const response = await this.client.post('/invoices.json', payload);
      
      logger.info('Invoice created successfully in Fakturownia:', {
        id: response.data.id,
        number: response.data.number
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create invoice in Fakturownia:', error);
      throw new Error(`Fakturownia API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async getInvoice(id: number): Promise<FakturowniaInvoice> {
    try {
      logger.debug('Fetching invoice from Fakturownia:', { id });
      
      const response = await this.client.get(`/invoices/${id}.json`, {
        params: { include_positions: true }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch invoice from Fakturownia:', { id, error });
      throw new Error(`Fakturownia API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateInvoice(id: number, invoice: Partial<FakturowniaInvoice>): Promise<FakturowniaInvoice> {
    try {
      logger.info('Updating invoice in Fakturownia:', { id });
      
      const payload = {
        invoice: {
          ...invoice,
          from_api: true
        }
      };

      const response = await this.client.put(`/invoices/${id}.json`, payload);
      
      logger.info('Invoice updated successfully in Fakturownia:', {
        id: response.data.id,
        number: response.data.number
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to update invoice in Fakturownia:', { id, error });
      throw new Error(`Fakturownia API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      logger.info('Deleting invoice from Fakturownia:', { id });
      
      await this.client.delete(`/invoices/${id}.json`);
      
      logger.info('Invoice deleted successfully from Fakturownia:', { id });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete invoice from Fakturownia:', { id, error });
      throw new Error(`Fakturownia API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async listInvoices(params: {
    page?: number;
    per_page?: number;
    period?: string;
    include_positions?: boolean;
    client_id?: number;
  } = {}): Promise<FakturowniaListResponse<FakturowniaInvoice>> {
    try {
      logger.debug('Listing invoices from Fakturownia:', params);
      
      const response = await this.client.get('/invoices.json', { params });

      return {
        invoices: response.data,
        page: params.page || 1,
        per_page: params.per_page || 25,
        total_count: response.headers['x-total-count'] ? 
          parseInt(response.headers['x-total-count']) : undefined
      };
    } catch (error: any) {
      logger.error('Failed to list invoices from Fakturownia:', error);
      throw new Error(`Fakturownia API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendInvoice(id: number, options: {
    recipient?: string;
    subject?: string;
    message?: string;
  } = {}): Promise<boolean> {
    try {
      logger.info('Sending invoice via Fakturownia:', { id, recipient: options.recipient });
      
      const payload = {
        recipient: options.recipient,
        subject: options.subject,
        message: options.message
      };

      await this.client.post(`/invoices/${id}/send_by_email.json`, payload);
      
      logger.info('Invoice sent successfully via Fakturownia:', { id });
      return true;
    } catch (error: any) {
      logger.error('Failed to send invoice via Fakturownia:', { id, error });
      throw new Error(`Fakturownia API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async syncInvoice(localInvoiceId: string, fakturowniaId?: number): Promise<FakturowniaInvoice> {
    try {
      if (fakturowniaId) {
        // Sync existing invoice
        logger.info('Syncing existing invoice from Fakturownia:', { 
          localId: localInvoiceId, 
          fakturowniaId 
        });
        return await this.getInvoice(fakturowniaId);
      } else {
        // This would typically involve fetching local invoice and creating/updating in Fakturownia
        throw new Error('Sync for new invoices requires additional implementation');
      }
    } catch (error: any) {
      logger.error('Failed to sync invoice:', { localInvoiceId, fakturowniaId, error });
      throw error;
    }
  }
}

// Utility functions for data transformation
export class FakturowniaTransformer {
  static toFakturowniaInvoice(localInvoice: any): FakturowniaInvoice {
    return {
      oid: localInvoice.id, // our internal ID
      number: localInvoice.invoiceNumber,
      issue_date: localInvoice.createdAt ? 
        new Date(localInvoice.createdAt).toISOString().split('T')[0] : undefined,
      payment_to: localInvoice.dueDate ? 
        new Date(localInvoice.dueDate).toISOString().split('T')[0] : undefined,
      buyer_name: localInvoice.customerEmail || 'Unknown Customer',
      buyer_email: localInvoice.customerEmail,
      buyer_phone: localInvoice.customerPhone,
      buyer_street: localInvoice.customerAddress,
      total_price_gross: localInvoice.totalAmount?.toString(),
      currency: localInvoice.currency || 'PLN',
      description: localInvoice.description,
      paid: localInvoice.status === 'PAID' ? localInvoice.totalAmount?.toString() : '0',
      status: this.mapLocalStatusToFakturownia(localInvoice.status),
      positions: localInvoice.items?.map((item: any) => ({
        name: item.customName || item.product?.name || item.service?.name,
        description: item.customDescription || item.product?.description || item.service?.description,
        quantity: item.quantity?.toString(),
        price_net: item.unitPrice?.toString(),
        price_gross: item.totalPrice?.toString(),
        tax: item.tax?.toString() || '23' // Default VAT rate for Poland
      }))
    };
  }

  static fromFakturowniaInvoice(fakturowniaInvoice: FakturowniaInvoice): any {
    return {
      fakturowniaId: fakturowniaInvoice.id,
      invoiceNumber: fakturowniaInvoice.number,
      title: `Invoice ${fakturowniaInvoice.number}`,
      description: fakturowniaInvoice.description,
      amount: parseFloat(fakturowniaInvoice.total_price_gross || '0'),
      currency: fakturowniaInvoice.currency || 'PLN',
      status: this.mapFakturowniaStatusToLocal(fakturowniaInvoice.status),
      dueDate: fakturowniaInvoice.payment_to ? 
        new Date(fakturowniaInvoice.payment_to) : undefined,
      customerEmail: fakturowniaInvoice.buyer_email,
      customerPhone: fakturowniaInvoice.buyer_phone,
      customerAddress: fakturowniaInvoice.buyer_street,
      subtotal: parseFloat(fakturowniaInvoice.total_price_net || '0'),
      totalAmount: parseFloat(fakturowniaInvoice.total_price_gross || '0'),
      paymentDate: fakturowniaInvoice.paid && parseFloat(fakturowniaInvoice.paid) > 0 ? 
        new Date() : undefined,
      lastSyncedAt: new Date()
    };
  }

  private static mapLocalStatusToFakturownia(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'draft',
      'SENT': 'sent',
      'PAID': 'paid',
      'OVERDUE': 'sent',
      'CANCELED': 'cancelled'
    };
    return statusMap[status] || 'draft';
  }

  private static mapFakturowniaStatusToLocal(status?: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'PENDING',
      'sent': 'SENT',
      'paid': 'PAID',
      'cancelled': 'CANCELED',
      'partially_paid': 'SENT'
    };
    return statusMap[status || 'draft'] || 'PENDING';
  }
}

// Factory function to create Fakturownia client
export function createFakturowniaClient(config: FakturowniaConfig): FakturowniaClient {
  return new FakturowniaApiClient(config);
}
