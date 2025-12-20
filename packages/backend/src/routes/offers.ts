import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const OfferItemSchema = z.object({
  itemType: z.enum(['PRODUCT', 'SERVICE', 'CUSTOM']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  customName: z.string().optional(),
  customDescription: z.string().optional()
}).refine(data => {
  // If itemType is PRODUCT, productId is required
  if (data.itemType === 'PRODUCT') {
    return !!data.productId;
  }
  // If itemType is SERVICE, serviceId is required  
  if (data.itemType === 'SERVICE') {
    return !!data.serviceId;
  }
  // If itemType is CUSTOM, customName is required
  if (data.itemType === 'CUSTOM') {
    return !!data.customName;
  }
  return true;
}, {
  message: "Required field missing for item type"
});

const OfferCreateSchema = z.object({
  title: z.string().min(1, 'Offer title is required'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELED']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  currency: z.string().default('USD'),
  validUntil: z.string().datetime().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(OfferItemSchema).min(1, 'At least one offer item is required')
});

const OfferUpdateSchema = OfferCreateSchema.partial().extend({
  items: z.array(OfferItemSchema).optional()
});

const OfferStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELED'])
});

// Helper function to generate offer number
async function generateOfferNumber(organizationId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `OF-${currentYear}`;
  
  // Get the last offer number for this year
  const lastOffer = await prisma.offer.findFirst({
    where: {
      organizationId,
      offerNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      offerNumber: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastOffer) {
    const lastNumber = parseInt(lastOffer.offerNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

// Helper function to calculate offer totals
function calculateOfferTotals(items: any[]) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount || 0;
    const itemTax = item.tax || 0;
    
    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    totalTax += itemTax;
    
    // Update item total price
    item.totalPrice = itemSubtotal - itemDiscount + itemTax;
  });

  const totalAmount = subtotal - totalDiscount + totalTax;

  return {
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount
  };
}

// GET /api/offers - List offers with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      search, 
      status, 
      priority,
      companyId,
      contactId,
      dealId,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const organizationId = (req as any).user.organizationId;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { offerNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(companyId && { companyId }),
      ...(contactId && { contactId }),
      ...(dealId && { dealId })
    };

    // Get total count for pagination
    const total = await prisma.offer.count({ where });

    // Get offers
    const offers = await prisma.offer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true,
            stage: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json({
      offers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// GET /api/offers/:id - Get offer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const offer = await prisma.offer.findFirst({
      where: { id, organizationId },
      include: {
        company: true,
        contact: true,
        deal: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

// POST /api/offers - Create new offer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const offerData = OfferCreateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;
    const createdById = (req as any).user.id;

    // Generate offer number
    const offerNumber = await generateOfferNumber(organizationId);

    // Calculate totals
    const totals = calculateOfferTotals([...offerData.items]);

    // Validate that products/services exist and belong to organization
    for (const item of offerData.items) {
      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, organizationId }
        });
        if (!product) {
          return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
        }
      }
      if (item.serviceId) {
        const service = await prisma.service.findFirst({
          where: { id: item.serviceId, organizationId }
        });
        if (!service) {
          return res.status(400).json({ error: `Service with ID ${item.serviceId} not found` });
        }
      }
    }

    // Validate relationships exist and belong to organization
    if (offerData.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: offerData.companyId, organizationId }
      });
      if (!company) {
        return res.status(400).json({ error: 'Company not found' });
      }
    }

    if (offerData.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: offerData.contactId, organizationId }
      });
      if (!contact) {
        return res.status(400).json({ error: 'Contact not found' });
      }
    }

    if (offerData.dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: offerData.dealId, organizationId }
      });
      if (!deal) {
        return res.status(400).json({ error: 'Deal not found' });
      }
    }

    const offer = await prisma.offer.create({
      data: {
        offerNumber,
        title: offerData.title,
        description: offerData.description,
        status: offerData.status,
        priority: offerData.priority,
        currency: offerData.currency,
        validUntil: offerData.validUntil ? new Date(offerData.validUntil) : undefined,
        customerName: offerData.customerName,
        customerEmail: offerData.customerEmail,
        customerPhone: offerData.customerPhone,
        customerAddress: offerData.customerAddress,
        companyId: offerData.companyId,
        contactId: offerData.contactId,
        dealId: offerData.dealId,
        paymentTerms: offerData.paymentTerms,
        deliveryTerms: offerData.deliveryTerms,
        notes: offerData.notes,
        organizationId,
        createdById,
        ...totals,
        items: {
          create: offerData.items.map(item => ({
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            totalPrice: item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0),
            productId: item.productId,
            serviceId: item.serviceId,
            customName: item.customName,
            customDescription: item.customDescription
          }))
        }
      },
      include: {
        company: true,
        contact: true,
        deal: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    res.status(201).json(offer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// PUT /api/offers/:id - Update offer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const offerData = OfferUpdateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;

    // Check if offer exists and belongs to organization
    const existingOffer = await prisma.offer.findFirst({
      where: { id, organizationId },
      include: { items: true }
    });

    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check if offer can be modified (not if it's accepted)
    if (existingOffer.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Cannot modify accepted offer' });
    }

    let updateData: any = {
      title: offerData.title,
      description: offerData.description,
      status: offerData.status,
      priority: offerData.priority,
      currency: offerData.currency,
      validUntil: offerData.validUntil ? new Date(offerData.validUntil) : undefined,
      customerName: offerData.customerName,
      customerEmail: offerData.customerEmail,
      customerPhone: offerData.customerPhone,
      customerAddress: offerData.customerAddress,
      companyId: offerData.companyId,
      contactId: offerData.contactId,
      dealId: offerData.dealId,
      paymentTerms: offerData.paymentTerms,
      deliveryTerms: offerData.deliveryTerms,
      notes: offerData.notes
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Handle items update if provided
    if (offerData.items) {
      // Validate products/services exist
      for (const item of offerData.items) {
        if (item.productId) {
          const product = await prisma.product.findFirst({
            where: { id: item.productId, organizationId }
          });
          if (!product) {
            return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
          }
        }
        if (item.serviceId) {
          const service = await prisma.service.findFirst({
            where: { id: item.serviceId, organizationId }
          });
          if (!service) {
            return res.status(400).json({ error: `Service with ID ${item.serviceId} not found` });
          }
        }
      }

      // Calculate new totals
      const totals = calculateOfferTotals([...offerData.items]);
      updateData = { ...updateData, ...totals };

      // Delete existing items and create new ones
      await prisma.offerItem.deleteMany({
        where: { offerId: id }
      });

      updateData.items = {
        create: offerData.items.map(item => ({
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tax: item.tax || 0,
          totalPrice: item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0),
          productId: item.productId,
          serviceId: item.serviceId,
          customName: item.customName,
          customDescription: item.customDescription
        }))
      };
    }

    // Update status-specific dates
    if (offerData.status === 'SENT' && existingOffer.status !== 'SENT') {
      updateData.sentDate = new Date();
    } else if (offerData.status === 'ACCEPTED' && existingOffer.status !== 'ACCEPTED') {
      updateData.acceptedDate = new Date();
    } else if (offerData.status === 'REJECTED' && existingOffer.status !== 'REJECTED') {
      updateData.rejectedDate = new Date();
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        contact: true,
        deal: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            product: true,
            service: true
          }
        }
      }
    });

    res.json(offer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating offer:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// PATCH /api/offers/:id/status - Update offer status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = OfferStatusUpdateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;

    // Check if offer exists and belongs to organization
    const existingOffer = await prisma.offer.findFirst({
      where: { id, organizationId }
    });

    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Prepare update data with status-specific dates
    let updateData: any = { status };

    if (status === 'SENT' && existingOffer.status !== 'SENT') {
      updateData.sentDate = new Date();
    } else if (status === 'ACCEPTED' && existingOffer.status !== 'ACCEPTED') {
      updateData.acceptedDate = new Date();
    } else if (status === 'REJECTED' && existingOffer.status !== 'REJECTED') {  
      updateData.rejectedDate = new Date();
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json(offer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating offer status:', error);
    res.status(500).json({ error: 'Failed to update offer status' });
  }
});

// DELETE /api/offers/:id - Delete offer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    // Check if offer exists and belongs to organization
    const existingOffer = await prisma.offer.findFirst({
      where: { id, organizationId }
    });

    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check if offer can be deleted (not if it's accepted)
    if (existingOffer.status === 'ACCEPTED') {
      return res.status(400).json({ 
        error: 'Cannot delete accepted offer. Consider marking it as canceled instead.' 
      });
    }

    await prisma.offer.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

// GET /api/offers/meta/stats - Get offer statistics
router.get('/meta/stats', authenticateToken, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;

    const stats = await prisma.offer.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: {
        status: true
      },
      _sum: {
        totalAmount: true
      }
    });

    const totalOffers = await prisma.offer.count({
      where: { organizationId }
    });

    const totalValue = await prisma.offer.aggregate({
      where: { organizationId },
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      totalOffers,
      totalValue: totalValue._sum.totalAmount || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count.status,
          value: stat._sum.totalAmount || 0
        };
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    });
  } catch (error) {
    console.error('Error fetching offer stats:', error);
    res.status(500).json({ error: 'Failed to fetch offer statistics' });
  }
});

export default router;