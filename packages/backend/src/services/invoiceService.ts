import { prisma } from '../config/database';
import logger from '../config/logger';
import { config } from '../config';
import {
  createFakturowniaClient,
  FakturowniaTransformer,
  FakturowniaConfig,
  FakturowniaClient
} from './fakturownia';

export interface InvoiceSyncResult {
  success: boolean;
  invoiceId: string;
  fakturowniaId?: number;
  error?: string;
  action: 'created' | 'updated' | 'synced' | 'error';
}

export interface BulkSyncResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  created: number;
  updated: number;
  results: InvoiceSyncResult[];
}

export class InvoiceService {
  private fakturowniaClient: FakturowniaClient | null = null;

  constructor() {
    this.initializeFakturowniaClient();
  }

  private initializeFakturowniaClient() {
    if (config.FAKTUROWNIA.DOMAIN && config.FAKTUROWNIA.API_TOKEN) {
      const fakturowniaConfig: FakturowniaConfig = {
        domain: config.FAKTUROWNIA.DOMAIN,
        apiToken: config.FAKTUROWNIA.API_TOKEN,
        environment: config.FAKTUROWNIA.ENVIRONMENT
      };
      
      this.fakturowniaClient = createFakturowniaClient(fakturowniaConfig);
      logger.info('Fakturownia client initialized');
    } else {
      logger.info('Fakturownia integration not configured (optional)');
    }
  }

  /**
   * Check if Fakturownia integration is available
   */
  public isFakturowniaAvailable(): boolean {
    return this.fakturowniaClient !== null;
  }

  /**
   * Sync a single invoice with Fakturownia
   */
  public async syncInvoice(invoiceId: string, organizationId: string): Promise<InvoiceSyncResult> {
    if (!this.fakturowniaClient) {
      return {
        success: false,
        invoiceId,
        error: 'Fakturownia not configured',
        action: 'error'
      };
    }

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        include: {
          items: {
            include: {
              product: true,
              service: true
            }
          }
        }
      });

      if (!invoice) {
        return {
          success: false,
          invoiceId,
          error: 'Invoice not found',
          action: 'error'
        };
      }

      if (invoice.fakturowniaId) {
        // Update existing invoice from Fakturownia
        return await this.syncExistingInvoice(invoice);
      } else {
        // Create new invoice in Fakturownia
        return await this.createInvoiceInFakturownia(invoice);
      }
    } catch (error: any) {
      logger.error('Failed to sync invoice', { invoiceId, error: error.message });
      return {
        success: false,
        invoiceId,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Sync existing invoice from Fakturownia
   */
  private async syncExistingInvoice(invoice: any): Promise<InvoiceSyncResult> {
    try {
      const fakturowniaInvoice = await this.fakturowniaClient!.getInvoice(invoice.fakturowniaId!);
      const updatedData = FakturowniaTransformer.fromFakturowniaInvoice(fakturowniaInvoice);
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ...updatedData,
          syncError: null
        }
      });

      logger.info('Invoice synced from Fakturownia', {
        invoiceId: invoice.id,
        fakturowniaId: invoice.fakturowniaId
      });

      return {
        success: true,
        invoiceId: invoice.id,
        fakturowniaId: invoice.fakturowniaId,
        action: 'synced'
      };
    } catch (error: any) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { syncError: error.message }
      });

      return {
        success: false,
        invoiceId: invoice.id,
        fakturowniaId: invoice.fakturowniaId,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Create new invoice in Fakturownia
   */
  private async createInvoiceInFakturownia(invoice: any): Promise<InvoiceSyncResult> {
    try {
      const fakturowniaInvoiceData = FakturowniaTransformer.toFakturowniaInvoice(invoice);
      const fakturowniaInvoice = await this.fakturowniaClient!.createInvoice(fakturowniaInvoiceData);
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          fakturowniaId: fakturowniaInvoice.id!,
          fakturowniaNumber: fakturowniaInvoice.number,
          fakturowniaStatus: fakturowniaInvoice.status,
          lastSyncedAt: new Date(),
          syncError: null
        }
      });

      logger.info('Invoice created in Fakturownia', {
        invoiceId: invoice.id,
        fakturowniaId: fakturowniaInvoice.id
      });

      return {
        success: true,
        invoiceId: invoice.id,
        fakturowniaId: fakturowniaInvoice.id!,
        action: 'created'
      };
    } catch (error: any) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { syncError: error.message }
      });

      return {
        success: false,
        invoiceId: invoice.id,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Update invoice in Fakturownia
   */
  public async updateInvoiceInFakturownia(
    invoiceId: string, 
    organizationId: string
  ): Promise<InvoiceSyncResult> {
    if (!this.fakturowniaClient) {
      return {
        success: false,
        invoiceId,
        error: 'Fakturownia not configured',
        action: 'error'
      };
    }

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        include: {
          items: {
            include: {
              product: true,
              service: true
            }
          }
        }
      });

      if (!invoice) {
        return {
          success: false,
          invoiceId,
          error: 'Invoice not found',
          action: 'error'
        };
      }

      if (!invoice.fakturowniaId) {
        // Create if doesn't exist in Fakturownia
        return await this.createInvoiceInFakturownia(invoice);
      }

      const fakturowniaInvoiceData = FakturowniaTransformer.toFakturowniaInvoice(invoice);
      const fakturowniaInvoice = await this.fakturowniaClient.updateInvoice(
        invoice.fakturowniaId,
        fakturowniaInvoiceData
      );
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          fakturowniaNumber: fakturowniaInvoice.number,
          fakturowniaStatus: fakturowniaInvoice.status,
          lastSyncedAt: new Date(),
          syncError: null
        }
      });

      logger.info('Invoice updated in Fakturownia', {
        invoiceId: invoice.id,
        fakturowniaId: invoice.fakturowniaId
      });

      return {
        success: true,
        invoiceId: invoice.id,
        fakturowniaId: invoice.fakturowniaId,
        action: 'updated'
      };
    } catch (error: any) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { syncError: error.message }
      });

      return {
        success: false,
        invoiceId,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Delete invoice from Fakturownia
   */
  public async deleteInvoiceFromFakturownia(
    invoiceId: string, 
    organizationId: string
  ): Promise<InvoiceSyncResult> {
    if (!this.fakturowniaClient) {
      return {
        success: false,
        invoiceId,
        error: 'Fakturownia not configured',
        action: 'error'
      };
    }

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId }
      });

      if (!invoice || !invoice.fakturowniaId) {
        return {
          success: true, // Already deleted or never existed in Fakturownia
          invoiceId,
          action: 'synced'
        };
      }

      await this.fakturowniaClient.deleteInvoice(invoice.fakturowniaId);

      logger.info('Invoice deleted from Fakturownia', {
        invoiceId: invoice.id,
        fakturowniaId: invoice.fakturowniaId
      });

      return {
        success: true,
        invoiceId,
        fakturowniaId: invoice.fakturowniaId,
        action: 'synced'
      };
    } catch (error: any) {
      logger.error('Failed to delete invoice from Fakturownia', {
        invoiceId,
        error: error.message
      });

      return {
        success: false,
        invoiceId,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Send invoice via Fakturownia
   */
  public async sendInvoiceViaFakturownia(
    invoiceId: string,
    organizationId: string,
    options: {
      recipient?: string;
      subject?: string;
      message?: string;
    } = {}
  ): Promise<InvoiceSyncResult> {
    if (!this.fakturowniaClient) {
      return {
        success: false,
        invoiceId,
        error: 'Fakturownia not configured',
        action: 'error'
      };
    }

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId }
      });

      if (!invoice) {
        return {
          success: false,
          invoiceId,
          error: 'Invoice not found',
          action: 'error'
        };
      }

      if (!invoice.fakturowniaId) {
        return {
          success: false,
          invoiceId,
          error: 'Invoice not synced with Fakturownia',
          action: 'error'
        };
      }

      await this.fakturowniaClient.sendInvoice(invoice.fakturowniaId, options);

      // Update invoice status to sent
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
          status: 'SENT',
          lastSyncedAt: new Date()
        }
      });

      logger.info('Invoice sent via Fakturownia', {
        invoiceId,
        fakturowniaId: invoice.fakturowniaId,
        recipient: options.recipient
      });

      return {
        success: true,
        invoiceId,
        fakturowniaId: invoice.fakturowniaId,
        action: 'updated'
      };
    } catch (error: any) {
      return {
        success: false,
        invoiceId,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Bulk sync all invoices for an organization
   */
  public async bulkSyncInvoices(
    organizationId: string,
    options: {
      batchSize?: number;
      delayBetweenBatches?: number;
      syncOnlyAutoSync?: boolean;
    } = {}
  ): Promise<BulkSyncResult> {
    const { batchSize = 5, delayBetweenBatches = 1000, syncOnlyAutoSync = true } = options;

    if (!this.fakturowniaClient) {
      throw new Error('Fakturownia not configured');
    }

    const where: any = { organizationId };
    if (syncOnlyAutoSync) {
      where.autoSync = true;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    logger.info('Starting bulk sync', { 
      organizationId, 
      totalInvoices: invoices.length,
      batchSize
    });

    const results: InvoiceSyncResult[] = [];
    let successful = 0;
    let failed = 0;
    let created = 0;
    let updated = 0;

    // Process in batches
    for (let i = 0; i < invoices.length; i += batchSize) {
      const batch = invoices.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (invoice) => {
        const result = await this.syncInvoice(invoice.id, organizationId);
        results.push(result);
        
        if (result.success) {
          successful++;
          if (result.action === 'created') created++;
          if (result.action === 'updated' || result.action === 'synced') updated++;
        } else {
          failed++;
        }
        
        return result;
      });

      await Promise.all(batchPromises);
      
      // Delay between batches to avoid overwhelming the API
      if (i + batchSize < invoices.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const bulkResult: BulkSyncResult = {
      totalProcessed: invoices.length,
      successful,
      failed,
      created,
      updated,
      results
    };

    logger.info('Bulk sync completed', {
      organizationId,
      ...bulkResult
    });

    return bulkResult;
  }

  /**
   * Import invoices from Fakturownia to local database
   */
  public async importInvoicesFromFakturownia(
    organizationId: string,
    options: {
      page?: number;
      perPage?: number;
      period?: string;
    } = {}
  ): Promise<BulkSyncResult> {
    if (!this.fakturowniaClient) {
      throw new Error('Fakturownia not configured');
    }

    try {
      const { page = 1, perPage = 25, period = 'this_month' } = options;
      
      logger.info('Importing invoices from Fakturownia', {
        organizationId,
        page,
        perPage,
        period
      });

      const response = await this.fakturowniaClient.listInvoices({
        page,
        per_page: perPage,
        period,
        include_positions: true
      });

      const results: InvoiceSyncResult[] = [];
      let successful = 0;
      let failed = 0;
      let created = 0;
      let updated = 0;

      if (response.invoices) {
        for (const fakturowniaInvoice of response.invoices) {
          try {
            const localData = FakturowniaTransformer.fromFakturowniaInvoice(fakturowniaInvoice);
            
            // Check if invoice already exists locally
            const existingInvoice = await prisma.invoice.findFirst({
              where: {
                organizationId,
                fakturowniaId: fakturowniaInvoice.id
              }
            });

            let result: InvoiceSyncResult;

            if (existingInvoice) {
              // Update existing invoice
              await prisma.invoice.update({
                where: { id: existingInvoice.id },
                data: {
                  ...localData,
                  syncError: null
                }
              });

              result = {
                success: true,
                invoiceId: existingInvoice.id,
                fakturowniaId: fakturowniaInvoice.id!,
                action: 'updated'
              };
              updated++;
            } else {
              // Create new invoice
              const newInvoice = await prisma.invoice.create({
                data: {
                  ...localData,
                  organizationId,
                  invoiceNumber: await this.generateUniqueInvoiceNumber(organizationId),
                  title: `Invoice ${fakturowniaInvoice.number}`,
                  amount: parseFloat(fakturowniaInvoice.total_price_gross || '0'),
                  syncError: null
                }
              });

              result = {
                success: true,
                invoiceId: newInvoice.id,
                fakturowniaId: fakturowniaInvoice.id!,
                action: 'created'
              };
              created++;
            }

            results.push(result);
            successful++;

          } catch (error: any) {
            logger.error('Failed to import individual invoice', {
              fakturowniaId: fakturowniaInvoice.id,
              error: error.message
            });

            results.push({
              success: false,
              invoiceId: `fakturownia-${fakturowniaInvoice.id}`,
              fakturowniaId: fakturowniaInvoice.id,
              error: error.message,
              action: 'error'
            });
            failed++;
          }
        }
      }

      const bulkResult: BulkSyncResult = {
        totalProcessed: response.invoices?.length || 0,
        successful,
        failed,
        created,
        updated,
        results
      };

      logger.info('Import from Fakturownia completed', {
        organizationId,
        ...bulkResult
      });

      return bulkResult;
    } catch (error: any) {
      logger.error('Failed to import invoices from Fakturownia', {
        organizationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate unique invoice number for organization
   */
  private async generateUniqueInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const count = await prisma.invoice.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1)
        }
      }
    });

    return `INV-${year}-${month}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Get sync status for organization
   */
  public async getSyncStatus(organizationId: string): Promise<{
    totalInvoices: number;
    syncedInvoices: number;
    pendingSync: number;
    lastSyncErrors: any[];
    fakturowniaAvailable: boolean;
  }> {
    const [totalInvoices, syncedInvoices, errorInvoices] = await Promise.all([
      prisma.invoice.count({ where: { organizationId } }),
      prisma.invoice.count({ 
        where: { 
          organizationId,
          fakturowniaId: { not: null }
        }
      }),
      prisma.invoice.findMany({
        where: {
          organizationId,
          syncError: { not: null }
        },
        select: {
          id: true,
          invoiceNumber: true,
          syncError: true,
          lastSyncedAt: true
        },
        take: 10
      })
    ]);

    return {
      totalInvoices,
      syncedInvoices,
      pendingSync: totalInvoices - syncedInvoices,
      lastSyncErrors: errorInvoices,
      fakturowniaAvailable: this.isFakturowniaAvailable()
    };
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
