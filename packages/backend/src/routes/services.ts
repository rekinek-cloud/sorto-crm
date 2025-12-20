import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const ServiceCreateSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  cost: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  billingType: z.enum(['ONE_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'PROJECT_BASED']).default('ONE_TIME'),
  duration: z.number().int().min(0).optional(), // minutes
  unit: z.string().optional(),
  deliveryMethod: z.enum(['REMOTE', 'ON_SITE', 'HYBRID', 'DIGITAL_DELIVERY', 'PHYSICAL_DELIVERY']).default('REMOTE'),
  estimatedDeliveryDays: z.number().int().min(0).optional(),
  requirements: z.string().optional(), // JSON string
  resources: z.string().optional(), // JSON string
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([])
});

const ServiceUpdateSchema = ServiceCreateSchema.partial();

// GET /api/services - List services with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      search, 
      category, 
      status, 
      billingType, 
      deliveryMethod, 
      isActive, 
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
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(category && { category }),
      ...(status && { status }),
      ...(billingType && { billingType }),
      ...(deliveryMethod && { deliveryMethod }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    // Get total count for pagination
    const total = await prisma.service.count({ where });

    // Get services
    const services = await prisma.service.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        price: true,
        cost: true,
        currency: true,
        billingType: true,
        duration: true,
        unit: true,
        deliveryMethod: true,
        estimatedDeliveryDays: true,
        requirements: true,
        resources: true,
        status: true,
        isActive: true,
        isFeatured: true,
        tags: true,
        images: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /api/services/:id - Get service by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const service = await prisma.service.findFirst({
      where: { id, organizationId },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// POST /api/services - Create new service
router.post('/', authenticateToken, async (req, res) => {
  try {
    const serviceData = ServiceCreateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        organizationId
      }
    });

    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/services/:id - Update service
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const serviceData = ServiceUpdateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;

    // Check if service exists and belongs to organization
    const existingService = await prisma.service.findFirst({
      where: { id, organizationId }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await prisma.service.update({
      where: { id },
      data: serviceData
    });

    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id - Delete service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    // Check if service exists and belongs to organization
    const existingService = await prisma.service.findFirst({
      where: { id, organizationId }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if service is used in any orders or invoices
    const usage = await prisma.service.findUnique({
      where: { id },
      include: {
        orderItems: true,
        invoiceItems: true
      }
    });

    if (usage && (usage.orderItems.length > 0 || usage.invoiceItems.length > 0)) {
      return res.status(400).json({ 
        error: 'Cannot delete service that is used in orders or invoices. Consider marking it as unavailable instead.' 
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// GET /api/services/meta/categories - Get all categories used by services
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;

    const categories = await prisma.service.findMany({
      where: { 
        organizationId,
        category: { not: null }
      },
      select: { 
        category: true,
        subcategory: true
      },
      distinct: ['category', 'subcategory']
    });

    // Group subcategories by category
    const categoryMap = new Map<string, Set<string>>();
    
    categories.forEach(({ category, subcategory }) => {
      if (category) {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, new Set());
        }
        if (subcategory) {
          categoryMap.get(category)!.add(subcategory);
        }
      }
    });

    const result = Array.from(categoryMap.entries()).map(([category, subcategories]) => ({
      category,
      subcategories: Array.from(subcategories)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/services/meta/billing-types - Get available billing types
router.get('/meta/billing-types', authenticateToken, async (req, res) => {
  try {
    const billingTypes = [
      { value: 'ONE_TIME', label: 'One Time' },
      { value: 'HOURLY', label: 'Hourly' },
      { value: 'DAILY', label: 'Daily' },
      { value: 'WEEKLY', label: 'Weekly' },
      { value: 'MONTHLY', label: 'Monthly' },
      { value: 'YEARLY', label: 'Yearly' },
      { value: 'PROJECT_BASED', label: 'Project Based' }
    ];

    res.json(billingTypes);
  } catch (error) {
    console.error('Error fetching billing types:', error);
    res.status(500).json({ error: 'Failed to fetch billing types' });
  }
});

// GET /api/services/meta/delivery-methods - Get available delivery methods
router.get('/meta/delivery-methods', authenticateToken, async (req, res) => {
  try {
    const deliveryMethods = [
      { value: 'REMOTE', label: 'Remote' },
      { value: 'ON_SITE', label: 'On-Site' },
      { value: 'HYBRID', label: 'Hybrid' },
      { value: 'DIGITAL_DELIVERY', label: 'Digital Delivery' },
      { value: 'PHYSICAL_DELIVERY', label: 'Physical Delivery' }
    ];

    res.json(deliveryMethods);
  } catch (error) {
    console.error('Error fetching delivery methods:', error);
    res.status(500).json({ error: 'Failed to fetch delivery methods' });
  }
});

export default router;