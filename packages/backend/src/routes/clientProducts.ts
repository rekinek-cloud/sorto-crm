import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/client-products - List products (companyId required)
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      companyId,
      page = '1',
      limit = '20'
    } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    // Verify company belongs to organization
    const company = await prisma.company.findFirst({
      where: { id: companyId as string, organizationId: req.user.organizationId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId,
      companyId: companyId as string
    };

    const [products, total] = await Promise.all([
      prisma.clientProduct.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.clientProduct.count({ where })
    ]);

    return res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching client products:', error);
    return res.status(500).json({ error: 'Failed to fetch client products' });
  }
});

// GET /api/v1/client-products/stats/:companyId - Get stats for company
router.get('/stats/:companyId', authenticateToken, async (req: any, res: any) => {
  try {
    const { companyId } = req.params;

    // Verify company belongs to organization
    const company = await prisma.company.findFirst({
      where: { id: companyId, organizationId: req.user.organizationId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Try to get pre-calculated stats
    const existingStats = await prisma.clientProductStats.findFirst({
      where: {
        organizationId: req.user.organizationId,
        companyId
      }
    });

    if (existingStats) {
      return res.json(existingStats);
    }

    // Calculate stats on the fly
    const products = await prisma.clientProduct.findMany({
      where: {
        organizationId: req.user.organizationId,
        companyId
      },
      orderBy: { deliveredAt: 'desc' }
    });

    const totalValue = products.reduce((sum, p) => sum + p.value, 0);
    const orderCount = products.length;
    const averageValue = orderCount > 0 ? totalValue / orderCount : 0;
    const ratingsWithValue = products.filter(p => p.rating !== null);
    const averageRating = ratingsWithValue.length > 0
      ? ratingsWithValue.reduce((sum, p) => sum + (p.rating || 0), 0) / ratingsWithValue.length
      : null;
    const lastOrderAt = products.length > 0 ? products[0].deliveredAt : null;
    const firstOrderAt = products.length > 0 ? products[products.length - 1].deliveredAt : null;

    const stats = {
      companyId,
      totalValue: Math.round(totalValue * 100) / 100,
      orderCount,
      averageValue: Math.round(averageValue * 100) / 100,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      lastOrderAt,
      firstOrderAt
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching client product stats:', error);
    return res.status(500).json({ error: 'Failed to fetch client product stats' });
  }
});

// GET /api/v1/client-products/:id - Get single product
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const item = await prisma.clientProduct.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        company: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Client product not found' });
    }

    return res.json(item);
  } catch (error) {
    console.error('Error fetching client product:', error);
    return res.status(500).json({ error: 'Failed to fetch client product' });
  }
});

// POST /api/v1/client-products - Create product entry
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      companyId,
      productId,
      serviceId,
      customName,
      customDescription,
      deliveredAt,
      value,
      currency,
      rating,
      feedback,
      dealId,
      projectId,
      invoiceId
    } = req.body;

    if (!companyId || !deliveredAt || value === undefined) {
      return res.status(400).json({ error: 'companyId, deliveredAt and value are required' });
    }

    // Verify company belongs to organization
    const company = await prisma.company.findFirst({
      where: { id: companyId, organizationId: req.user.organizationId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const item = await prisma.clientProduct.create({
      data: {
        companyId,
        productId,
        serviceId,
        customName,
        customDescription,
        deliveredAt: new Date(deliveredAt),
        value,
        currency: currency || 'EUR',
        rating,
        feedback,
        dealId,
        projectId,
        invoiceId,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        company: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('Error creating client product:', error);
    return res.status(500).json({ error: 'Failed to create client product' });
  }
});

// PATCH /api/v1/client-products/:id - Update product entry
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.clientProduct.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Client product not found' });
    }

    const updates = { ...req.body };
    if (updates.deliveredAt) updates.deliveredAt = new Date(updates.deliveredAt);

    // Remove fields that should not be directly updated
    delete updates.organizationId;
    delete updates.createdById;
    delete updates.companyId;

    const item = await prisma.clientProduct.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        company: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.json(item);
  } catch (error) {
    console.error('Error updating client product:', error);
    return res.status(500).json({ error: 'Failed to update client product' });
  }
});

// DELETE /api/v1/client-products/:id - Delete product entry
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.clientProduct.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Client product not found' });
    }

    await prisma.clientProduct.delete({
      where: { id: req.params.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting client product:', error);
    return res.status(500).json({ error: 'Failed to delete client product' });
  }
});

export default router;
