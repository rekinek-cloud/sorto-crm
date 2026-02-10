import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { validateRequest } from '../shared/middleware/validation';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// Validation schemas
const createAreaSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  purpose: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  currentFocus: z.string().optional(),
  reviewFrequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  isActive: z.boolean().default(true)
});

const updateAreaSchema = createAreaSchema.partial();

// GET /api/v1/areas - List areas of responsibility
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      isActive = 'true',
      search,
      page = '1',
      limit = '20',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { purpose: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [areas, total] = await Promise.all([
      prisma.areaOfResponsibility.findMany({
        where,
        include: {
          _count: {
            select: {
              projects: true
            }
          }
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum
      }),
      prisma.areaOfResponsibility.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      areas,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// GET /api/v1/areas/:id - Get single area
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const area = await prisma.areaOfResponsibility.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            endDate: true
          },
          where: {
            status: { not: 'CANCELED' }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }

    res.json(area);
  } catch (error) {
    console.error('Error fetching area:', error);
    res.status(500).json({ error: 'Failed to fetch area' });
  }
});

// POST /api/v1/areas - Create new area
router.post('/', authenticateToken, validateRequest(createAreaSchema), async (req, res) => {
  try {
    const data = req.body;

    // Set default color if not provided
    if (!data.color) {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
      data.color = colors[Math.floor(Math.random() * colors.length)];
    }

    const area = await prisma.areaOfResponsibility.create({
      data: {
        ...data,
        organizationId: req.user.organizationId,
        createdById: req.user.userId
      },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    res.status(201).json(area);
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).json({ error: 'Failed to create area' });
  }
});

// PUT /api/v1/areas/:id - Update area
router.put('/:id', authenticateToken, validateRequest(updateAreaSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if area exists and belongs to organization
    const existingArea = await prisma.areaOfResponsibility.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingArea) {
      return res.status(404).json({ error: 'Area not found' });
    }

    const area = await prisma.areaOfResponsibility.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    res.json(area);
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({ error: 'Failed to update area' });
  }
});

// DELETE /api/v1/areas/:id - Delete area
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if area exists and belongs to organization
    const existingArea = await prisma.areaOfResponsibility.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!existingArea) {
      return res.status(404).json({ error: 'Area not found' });
    }

    // Check if area has projects
    if (existingArea._count.projects > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete area with associated projects',
        projectCount: existingArea._count.projects
      });
    }

    await prisma.areaOfResponsibility.delete({
      where: { id }
    });

    res.json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({ error: 'Failed to delete area' });
  }
});

// GET /api/v1/areas/stats - Get areas statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalAreas,
      activeAreas,
      areasWithProjects,
      recentlyUpdated
    ] = await Promise.all([
      prisma.areaOfResponsibility.count({
        where: { organizationId }
      }),
      prisma.areaOfResponsibility.count({
        where: { organizationId, isActive: true }
      }),
      prisma.areaOfResponsibility.count({
        where: {
          organizationId,
          projects: {
            some: {
              status: { not: 'CANCELED' }
            }
          }
        }
      }),
      prisma.areaOfResponsibility.count({
        where: {
          organizationId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    res.json({
      totalAreas,
      activeAreas,
      inactiveAreas: totalAreas - activeAreas,
      areasWithProjects,
      areasWithoutProjects: totalAreas - areasWithProjects,
      recentlyUpdated
    });
  } catch (error) {
    console.error('Error fetching areas stats:', error);
    res.status(500).json({ error: 'Failed to fetch areas statistics' });
  }
});

export default router;