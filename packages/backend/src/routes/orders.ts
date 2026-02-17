import { Router } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import logger from '../config/logger';

const router = Router();

// Validation schemas
const orderItemSchema = z.object({
  itemType: z.enum(['PRODUCT', 'SERVICE', 'CUSTOM']),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().positive(),
  discount: z.number().default(0),
  tax: z.number().default(0),
  totalPrice: z.number().positive(),
  productId: z.string().optional(),
  serviceId: z.string().optional(),
  customName: z.string().optional(),
  customDescription: z.string().optional(),
});

const createOrderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  customer: z.string().min(1),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  value: z.number().optional(),
  currency: z.string().default('PLN'),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
});

const updateOrderSchema = createOrderSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
});

// Generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
}

// GET /orders - List orders
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;
    const { page = 1, limit = 20, status, priority, search } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { organizationId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { customer: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              service: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/stats - Order statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;

    const [total, pending, inProgress, shipped, delivered, canceled] = await Promise.all([
      prisma.order.count({ where: { organizationId } }),
      prisma.order.count({ where: { organizationId, status: 'PENDING' } }),
      prisma.order.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
      prisma.order.count({ where: { organizationId, status: 'SHIPPED' } }),
      prisma.order.count({ where: { organizationId, status: 'DELIVERED' } }),
      prisma.order.count({ where: { organizationId, status: 'CANCELED' } }),
    ]);

    const totalValue = await prisma.order.aggregate({
      where: { organizationId, status: { not: 'CANCELED' } },
      _sum: { totalAmount: true },
    });

    return res.json({
      total,
      pending,
      inProgress,
      shipped,
      delivered,
      canceled,
      totalValue: totalValue._sum.totalAmount || 0,
    });
  } catch (error: any) {
    logger.error('Error fetching order stats:', error);
    return res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

// GET /orders/:id - Get single order
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, organizationId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
            service: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error: any) {
    logger.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /orders - Create order
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;
    const data = createOrderSchema.parse(req.body);
    const { items, deliveryDate, ...orderData } = data;

    // Calculate totals from items
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        subtotal += item.unitPrice * item.quantity;
        totalDiscount += item.discount || 0;
        totalTax += item.tax || 0;
      }
    }

    const totalAmount = subtotal - totalDiscount + totalTax;

    const order = await prisma.order.create({
      data: {
        ...orderData,
        orderNumber: generateOrderNumber(),
        organizationId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        subtotal,
        totalDiscount,
        totalTax,
        totalAmount,
        value: totalAmount,
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            totalPrice: item.totalPrice,
            productId: item.productId || undefined,
            serviceId: item.serviceId || undefined,
            customName: item.customName || undefined,
            customDescription: item.customDescription || undefined,
          })),
        } : undefined,
      } as any,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    logger.info(`Order created: ${order.orderNumber} by org ${organizationId}`);
    return res.status(201).json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /orders/:id - Update order
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const data = updateOrderSchema.parse(req.body);
    const { items, deliveryDate, ...orderData } = data;

    // Check order exists
    const existing = await prisma.order.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If items provided, recalculate totals
    let totals: any = {};
    if (items && items.length > 0) {
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      for (const item of items) {
        subtotal += item.unitPrice * item.quantity;
        totalDiscount += item.discount || 0;
        totalTax += item.tax || 0;
      }
      totals = {
        subtotal,
        totalDiscount,
        totalTax,
        totalAmount: subtotal - totalDiscount + totalTax,
        value: subtotal - totalDiscount + totalTax,
      };

      // Delete existing items and create new ones
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...orderData,
        ...totals,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            totalPrice: item.totalPrice,
            productId: item.productId || undefined,
            serviceId: item.serviceId || undefined,
            customName: item.customName || undefined,
            customDescription: item.customDescription || undefined,
          })),
        } : undefined,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    return res.json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error updating order:', error);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});

// PATCH /orders/:id/status - Update order status
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const { status } = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELED']),
    }).parse(req.body);

    const existing = await prisma.order.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return res.json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /orders/:id - Delete order
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.order.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await prisma.order.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    logger.error('Error deleting order:', error);
    return res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
