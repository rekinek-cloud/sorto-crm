import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import logger from '../config/logger';
import { config } from '../config';
import { createFakturowniaClient, FakturowniaTransformer, FakturowniaConfig } from '../services/fakturownia';
import { invoiceService } from '../services/invoiceService';
import { scheduledTasksService } from '../services/scheduledTasks';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createInvoiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('PLN'),
  status: z.enum(['PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentNotes: z.string().optional(),
  autoSync: z.boolean().default(true),
  items: z.array(z.object({
    itemType: z.enum(['PRODUCT', 'SERVICE', 'CUSTOM']),
    quantity: z.number().positive().default(1),
    unitPrice: z.number().positive(),
    discount: z.number().default(0),
    tax: z.number().default(0),
    productId: z.string().optional(),
    serviceId: z.string().optional(),
    customName: z.string().optional(),
    customDescription: z.string().optional(),
  })).optional()
});

const updateInvoiceSchema = createInvoiceSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  status: z.enum(['PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELED']).optional(),
  search: z.string().optional(),
  sync: z.enum(['true', 'false']).optional()
});

// Helper function to create Fakturownia client
function getFakturowniaClient(): ReturnType<typeof createFakturowniaClient> | null {
  if (!config.FAKTUROWNIA.DOMAIN || !config.FAKTUROWNIA.API_TOKEN) {
    logger.warn('Fakturownia configuration not provided');
    return null;
  }

  const fakturowniaConfig: FakturowniaConfig = {
    domain: config.FAKTUROWNIA.DOMAIN,
    apiToken: config.FAKTUROWNIA.API_TOKEN,
    environment: config.FAKTUROWNIA.ENVIRONMENT
  };

  return createFakturowniaClient(fakturowniaConfig);
}

// Helper function to generate unique invoice number
async function generateInvoiceNumber(organizationId: string): Promise<string> {
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

// Helper function to calculate invoice totals
function calculateInvoiceTotals(items: any[]): {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    subtotal += itemSubtotal;
    totalDiscount += item.discount || 0;
    totalTax += item.tax || 0;
  });

  const totalAmount = subtotal - totalDiscount + totalTax;

  return {
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount
  };
}

// GET /invoices - List invoices with optional Fakturownia sync
router.get('/', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sync } = req.query as any;
    const { organizationId } = req.user!;

    const skip = (page - 1) * limit;
    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch invoices from database
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
              service: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ]);

    let syncedInvoices = invoices;

    // Optionally sync with Fakturownia
    if (sync === 'true') {
      const fakturowniaClient = getFakturowniaClient();
      if (fakturowniaClient) {
        try {
          logger.info('Syncing invoices with Fakturownia', { count: invoices.length });
          
          // Sync each invoice that has a Fakturownia ID
          const syncPromises = invoices
            .filter(invoice => invoice.fakturowniaId)
            .map(async (invoice) => {
              try {
                const fakturowniaInvoice = await fakturowniaClient.getInvoice(invoice.fakturowniaId!);
                const updatedData = FakturowniaTransformer.fromFakturowniaInvoice(fakturowniaInvoice);
                
                // Update local invoice with Fakturownia data
                return await prisma.invoice.update({
                  where: { id: invoice.id },
                  data: {
                    ...updatedData,
                    syncError: null
                  },
                  include: {
                    items: {
                      include: {
                        product: true,
                        service: true
                      }
                    }
                  }
                });
              } catch (error: any) {
                logger.error('Failed to sync individual invoice', { 
                  invoiceId: invoice.id, 
                  error: error.message 
                });
                
                // Update sync error
                await prisma.invoice.update({
                  where: { id: invoice.id },
                  data: { syncError: error.message }
                });
                
                return invoice; // Return original invoice if sync fails
              }
            });

          const syncResults = await Promise.all(syncPromises);
          syncedInvoices = syncedInvoices.map(invoice => {
            const syncedInvoice = syncResults.find(result => result.id === invoice.id);
            return syncedInvoice || invoice;
          });
        } catch (error: any) {
          logger.error('Failed to sync invoices with Fakturownia', { error: error.message });
        }
      }
    }

    res.json({
      invoices: syncedInvoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to fetch invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /invoices/:id - Get specific invoice
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
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
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    logger.error('Failed to fetch invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /invoices - Create new invoice with optional Fakturownia sync
router.post('/', authenticateToken, validateRequest({ body: createInvoiceSchema }), async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const data = req.body;

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber(organizationId);

    // Calculate totals
    const totals = data.items ? calculateInvoiceTotals(data.items) : {
      subtotal: data.amount,
      totalDiscount: 0,
      totalTax: 0,
      totalAmount: data.amount
    };

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        invoiceNumber,
        ...totals,
        organizationId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        items: data.items ? {
          create: data.items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0)
          }))
        } : undefined
      },
      include: {
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    // Sync with Fakturownia if enabled and configured
    if (data.autoSync) {
      const fakturowniaClient = getFakturowniaClient();
      if (fakturowniaClient) {
        try {
          logger.info('Creating invoice in Fakturownia', { invoiceId: invoice.id });
          
          const fakturowniaInvoiceData = FakturowniaTransformer.toFakturowniaInvoice(invoice);
          const fakturowniaInvoice = await fakturowniaClient.createInvoice(fakturowniaInvoiceData);
          
          // Update local invoice with Fakturownia data
          const updatedInvoice = await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              fakturowniaId: fakturowniaInvoice.id!,
              fakturowniaNumber: fakturowniaInvoice.number,
              fakturowniaStatus: fakturowniaInvoice.status,
              lastSyncedAt: new Date(),
              syncError: null
            },
            include: {
              items: {
                include: {
                  product: true,
                  service: true
                }
              }
            }
          });

          logger.info('Invoice created and synced with Fakturownia', {
            invoiceId: invoice.id,
            fakturowniaId: fakturowniaInvoice.id
          });

          return res.status(201).json(updatedInvoice);
        } catch (error: any) {
          logger.error('Failed to sync new invoice with Fakturownia', {
            invoiceId: invoice.id,
            error: error.message
          });
          
          // Update sync error but don't fail the request
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { syncError: error.message }
          });
        }
      }
    }

    res.status(201).json(invoice);
  } catch (error: any) {
    logger.error('Failed to create invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// PUT /invoices/:id - Update invoice with optional Fakturownia sync
router.put('/:id', authenticateToken, validateRequest({ body: updateInvoiceSchema }), async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const data = req.body;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Calculate new totals if items are provided
    const totals = data.items ? calculateInvoiceTotals(data.items) : {};

    // Update invoice in database
    const updateData: any = {
      ...data,
      ...totals,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };

    // Handle items update
    if (data.items) {
      updateData.items = {
        deleteMany: {},
        create: data.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0)
        }))
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    // Sync with Fakturownia if it exists there
    if (existingInvoice.fakturowniaId && (data.autoSync !== false)) {
      const fakturowniaClient = getFakturowniaClient();
      if (fakturowniaClient) {
        try {
          logger.info('Updating invoice in Fakturownia', {
            invoiceId: invoice.id,
            fakturowniaId: existingInvoice.fakturowniaId
          });
          
          const fakturowniaInvoiceData = FakturowniaTransformer.toFakturowniaInvoice(invoice);
          const fakturowniaInvoice = await fakturowniaClient.updateInvoice(
            existingInvoice.fakturowniaId,
            fakturowniaInvoiceData
          );
          
          // Update local invoice with Fakturownia response
          const updatedInvoice = await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              fakturowniaNumber: fakturowniaInvoice.number,
              fakturowniaStatus: fakturowniaInvoice.status,
              lastSyncedAt: new Date(),
              syncError: null
            },
            include: {
              items: {
                include: {
                  product: true,
                  service: true
                }
              }
            }
          });

          return res.json(updatedInvoice);
        } catch (error: any) {
          logger.error('Failed to sync updated invoice with Fakturownia', {
            invoiceId: invoice.id,
            error: error.message
          });
          
          // Update sync error
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { syncError: error.message }
          });
        }
      }
    }

    res.json(invoice);
  } catch (error: any) {
    logger.error('Failed to update invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// DELETE /invoices/:id - Delete invoice with optional Fakturownia sync
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete from Fakturownia if it exists there
    if (invoice.fakturowniaId) {
      const fakturowniaClient = getFakturowniaClient();
      if (fakturowniaClient) {
        try {
          logger.info('Deleting invoice from Fakturownia', {
            invoiceId: invoice.id,
            fakturowniaId: invoice.fakturowniaId
          });
          
          await fakturowniaClient.deleteInvoice(invoice.fakturowniaId);
        } catch (error: any) {
          logger.error('Failed to delete invoice from Fakturownia', {
            invoiceId: invoice.id,
            error: error.message
          });
          // Continue with local deletion even if Fakturownia deletion fails
        }
      }
    }

    // Delete from local database
    await prisma.invoice.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// POST /invoices/:id/send - Send invoice via Fakturownia
router.post('/:id/send', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { recipient, subject, message } = req.body;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.fakturowniaId) {
      return res.status(400).json({ error: 'Invoice not synced with Fakturownia' });
    }

    const fakturowniaClient = getFakturowniaClient();
    if (!fakturowniaClient) {
      return res.status(500).json({ error: 'Fakturownia not configured' });
    }

    try {
      await fakturowniaClient.sendInvoice(invoice.fakturowniaId, {
        recipient,
        subject,
        message
      });

      // Update invoice status to sent
      await prisma.invoice.update({
        where: { id },
        data: { 
          status: 'SENT',
          lastSyncedAt: new Date()
        }
      });

      res.json({ success: true, message: 'Invoice sent successfully' });
    } catch (error: any) {
      logger.error('Failed to send invoice via Fakturownia', {
        invoiceId: invoice.id,
        error: error.message
      });
      res.status(500).json({ error: 'Failed to send invoice' });
    }
  } catch (error: any) {
    logger.error('Failed to send invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// POST /invoices/:id/sync - Manual sync with Fakturownia
router.post('/:id/sync', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
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
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const fakturowniaClient = getFakturowniaClient();
    if (!fakturowniaClient) {
      return res.status(500).json({ error: 'Fakturownia not configured' });
    }

    try {
      if (invoice.fakturowniaId) {
        // Sync existing invoice
        logger.info('Syncing existing invoice with Fakturownia', {
          invoiceId: invoice.id,
          fakturowniaId: invoice.fakturowniaId
        });
        
        const fakturowniaInvoice = await fakturowniaClient.getInvoice(invoice.fakturowniaId);
        const updatedData = FakturowniaTransformer.fromFakturowniaInvoice(fakturowniaInvoice);
        
        const updatedInvoice = await prisma.invoice.update({
          where: { id },
          data: {
            ...updatedData,
            syncError: null
          },
          include: {
            items: {
              include: {
                product: true,
                service: true
              }
            }
          }
        });

        res.json(updatedInvoice);
      } else {
        // Create new invoice in Fakturownia
        logger.info('Creating new invoice in Fakturownia', { invoiceId: invoice.id });
        
        const fakturowniaInvoiceData = FakturowniaTransformer.toFakturowniaInvoice(invoice);
        const fakturowniaInvoice = await fakturowniaClient.createInvoice(fakturowniaInvoiceData);
        
        const updatedInvoice = await prisma.invoice.update({
          where: { id },
          data: {
            fakturowniaId: fakturowniaInvoice.id!,
            fakturowniaNumber: fakturowniaInvoice.number,
            fakturowniaStatus: fakturowniaInvoice.status,
            lastSyncedAt: new Date(),
            syncError: null
          },
          include: {
            items: {
              include: {
                product: true,
                service: true
              }
            }
          }
        });

        res.json(updatedInvoice);
      }
    } catch (error: any) {
      logger.error('Failed to sync invoice with Fakturownia', {
        invoiceId: invoice.id,
        error: error.message
      });
      
      // Update sync error
      await prisma.invoice.update({
        where: { id },
        data: { syncError: error.message }
      });

      res.status(500).json({ error: 'Failed to sync invoice' });
    }
  } catch (error: any) {
    logger.error('Failed to sync invoice:', error);
    res.status(500).json({ error: 'Failed to sync invoice' });
  }
});

// POST /invoices/sync-all - Bulk sync all invoices with Fakturownia
router.post('/sync-all', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;

    const fakturowniaClient = getFakturowniaClient();
    if (!fakturowniaClient) {
      return res.status(500).json({ error: 'Fakturownia not configured' });
    }

    // Get all invoices that need syncing
    const invoices = await prisma.invoice.findMany({
      where: { 
        organizationId,
        autoSync: true
      },
      include: {
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    logger.info('Starting bulk sync with Fakturownia', { count: invoices.length });

    const results = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process invoices in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < invoices.length; i += batchSize) {
      const batch = invoices.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (invoice) => {
        try {
          if (invoice.fakturowniaId) {
            // Update existing invoice
            const fakturowniaInvoice = await fakturowniaClient.getInvoice(invoice.fakturowniaId);
            const updatedData = FakturowniaTransformer.fromFakturowniaInvoice(fakturowniaInvoice);
            
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                ...updatedData,
                syncError: null
              }
            });

            results.updated++;
            results.synced++;
            results.details.push({
              invoiceId: invoice.id,
              action: 'updated',
              fakturowniaId: invoice.fakturowniaId
            });
          } else {
            // Create new invoice in Fakturownia
            const fakturowniaInvoiceData = FakturowniaTransformer.toFakturowniaInvoice(invoice);
            const fakturowniaInvoice = await fakturowniaClient.createInvoice(fakturowniaInvoiceData);
            
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

            results.created++;
            results.synced++;
            results.details.push({
              invoiceId: invoice.id,
              action: 'created',
              fakturowniaId: fakturowniaInvoice.id
            });
          }
        } catch (error: any) {
          logger.error('Failed to sync individual invoice during bulk sync', {
            invoiceId: invoice.id,
            error: error.message
          });
          
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { syncError: error.message }
          });

          results.errors++;
          results.details.push({
            invoiceId: invoice.id,
            action: 'error',
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < invoices.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Bulk sync completed', results);
    res.json(results);
  } catch (error: any) {
    logger.error('Failed to perform bulk sync:', error);
    res.status(500).json({ error: 'Failed to perform bulk sync' });
  }
});

// GET /invoices/sync-status - Get sync status for organization
router.get('/sync-status', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    const status = await invoiceService.getSyncStatus(organizationId);
    
    res.json(status);
  } catch (error: any) {
    logger.error('Failed to get sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// POST /invoices/import-from-fakturownia - Import invoices from Fakturownia
router.post('/import-from-fakturownia', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { page = 1, perPage = 25, period = 'this_month' } = req.body;

    if (!invoiceService.isFakturowniaAvailable()) {
      return res.status(500).json({ error: 'Fakturownia not configured' });
    }

    const result = await invoiceService.importInvoicesFromFakturownia(organizationId, {
      page,
      perPage,
      period
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Failed to import from Fakturownia:', error);
    res.status(500).json({ error: 'Failed to import from Fakturownia' });
  }
});

// POST /invoices/trigger-sync - Manual trigger for sync (admin only)
router.post('/trigger-sync', authenticateToken, async (req, res) => {
  try {
    const { organizationId, role } = req.user!;
    
    // Check if user has admin privileges
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }

    await scheduledTasksService.triggerInvoiceSync(organizationId);
    
    res.json({ success: true, message: 'Invoice sync triggered successfully' });
  } catch (error: any) {
    logger.error('Failed to trigger invoice sync:', error);
    res.status(500).json({ error: 'Failed to trigger invoice sync' });
  }
});

export default router;