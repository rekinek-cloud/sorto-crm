import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = express.Router();

// Validation schemas
const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  cost: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  stockQuantity: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  trackInventory: z.boolean().default(false),
  unit: z.string().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(), // JSON string
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([])
});

const ProductUpdateSchema = ProductCreateSchema.partial();

// GET /api/products - List products with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = '1', limit = '20', search, category, status, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
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
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(category && { category }),
      ...(status && { status }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        category: true,
        subcategory: true,
        price: true,
        cost: true,
        currency: true,
        stockQuantity: true,
        minStockLevel: true,
        trackInventory: true,
        unit: true,
        weight: true,
        dimensions: true,
        status: true,
        isActive: true,
        isFeatured: true,
        tags: true,
        images: true,
        createdAt: true,
        updatedAt: true
      }
    });

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
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const product = await prisma.product.findFirst({
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

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const productData = ProductCreateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;

    // Check if SKU is unique within organization (if provided)
    if (productData.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku: productData.sku,
          organizationId
        }
      });

      if (existingProduct) {
        return res.status(400).json({ error: 'SKU already exists in your organization' });
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        organizationId
      } as any
    });

    return res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productData = ProductUpdateSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;

    // Check if product exists and belongs to organization
    const existingProduct = await prisma.product.findFirst({
      where: { id, organizationId }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if SKU is unique within organization (if being updated)
    if (productData.sku && productData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          sku: productData.sku,
          organizationId,
          id: { not: id }
        }
      });

      if (skuExists) {
        return res.status(400).json({ error: 'SKU already exists in your organization' });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: productData
    });

    return res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    // Check if product exists and belongs to organization
    const existingProduct = await prisma.product.findFirst({
      where: { id, organizationId }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is used in any orders or invoices
    const usage = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        invoiceItems: true
      }
    });

    if (usage && (usage.orderItems.length > 0 || usage.invoiceItems.length > 0)) {
      return res.status(400).json({ 
        error: 'Cannot delete product that is used in orders or invoices. Consider marking it as inactive instead.' 
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/:id/duplicate - Duplicate a product
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const original = await prisma.product.findFirst({
      where: { id, organizationId }
    });

    if (!original) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { id: _id, createdAt: _c, updatedAt: _u, ...productData } = original;

    const duplicate = await prisma.product.create({
      data: {
        ...productData,
        name: `${original.name} (kopia)`,
        sku: original.sku ? `${original.sku}-COPY` : null,
      }
    });

    return res.status(201).json(duplicate);
  } catch (error) {
    console.error('Error duplicating product:', error);
    return res.status(500).json({ error: 'Failed to duplicate product' });
  }
});

// GET /api/products/meta/categories - Get all categories used by products
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;

    const categories = await prisma.product.findMany({
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

    return res.json(result);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
