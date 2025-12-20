import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required'),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  probability: z.number().min(0).max(100).optional(),
  stage: z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('PROSPECT'),
  companyId: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().optional(),
  lostReason: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateDealSchema = createDealSchema.partial().extend({
  companyId: z.string().uuid().optional()
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /api/deals - List deals with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      stage,
      companyId,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (stage) where.stage = stage;
    if (companyId) where.companyId = companyId;
    if (ownerId) where.ownerId = ownerId;

    // Get deals
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          company: {
            select: { id: true, name: true }
          },
          owner: {
            select: { id: true, email: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.deal.count({ where })
    ]);

    res.json({
      deals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// GET /api/deals/pipeline - Get deals pipeline summary
router.get('/pipeline', async (req, res) => {
  try {
    const { ownerId } = req.query;

    const where: any = {
      organizationId: req.user.organizationId,
      stage: {
        not: {
          in: ['CLOSED_WON', 'CLOSED_LOST']
        }
      }
    };

    if (ownerId) where.ownerId = ownerId;

    const pipeline = await prisma.deal.groupBy({
      by: ['stage'],
      where,
      _count: {
        _all: true
      },
      _sum: {
        value: true
      }
    });

    const stages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const pipelineData = stages.map(stage => {
      const stageData = pipeline.find(p => p.stage === stage);
      return {
        stage,
        count: stageData?._count._all || 0,
        value: stageData?._sum.value || 0
      };
    });

    res.json(pipelineData);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// GET /api/deals/:id - Get deal by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        company: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// POST /api/deals - Create new deal
router.post('/', async (req, res) => {
  try {
    const validatedData = createDealSchema.parse(req.body);

    // Verify company exists and belongs to tenant
    const company = await prisma.company.findFirst({
      where: {
        id: validatedData.companyId,
        organizationId: req.user.organizationId
      }
    });

    if (!company) {
      return res.status(400).json({ error: 'Company not found' });
    }

    // If ownerId is provided, verify user belongs to tenant
    if (validatedData.ownerId) {
      const owner = await prisma.user.findFirst({
        where: {
          id: validatedData.ownerId,
          organizationId: req.user.organizationId
        }
      });

      if (!owner) {
        return res.status(400).json({ error: 'Owner not found' });
      }
    }

    const deal = await prisma.deal.create({
      data: {
        ...validatedData,
        organizationId: req.user.organizationId,
        ownerId: validatedData.ownerId || req.user.id,
        expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : undefined,
        actualCloseDate: validatedData.actualCloseDate ? new Date(validatedData.actualCloseDate) : undefined
      },
      include: {
        company: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json(deal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// PUT /api/deals/:id - Update deal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateDealSchema.parse(req.body);

    // Check if deal exists and belongs to user's tenant
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // If companyId is being updated, verify it exists and belongs to tenant
    if (validatedData.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.companyId,
          organizationId: req.user.organizationId
        }
      });

      if (!company) {
        return res.status(400).json({ error: 'Company not found' });
      }
    }

    // If contactId is being updated, verify it exists and belongs to the company
    if (validatedData.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: validatedData.contactId,
          companyId: validatedData.companyId || existingDeal.companyId,
          organizationId: req.user.organizationId
        }
      });

      if (!contact) {
        return res.status(400).json({ error: 'Contact not found or does not belong to the company' });
      }
    }

    // If assignedToId is being updated, verify user belongs to tenant
    if (validatedData.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: validatedData.assignedToId,
          organizationId: req.user.organizationId
        }
      });

      if (!assignedUser) {
        return res.status(400).json({ error: 'Assigned user not found' });
      }
    }

    // Auto-set actualCloseDate when status changes to WON or LOST
    let updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };

    if (validatedData.stage && ['CLOSED_WON', 'CLOSED_LOST'].includes(validatedData.stage) && !existingDeal.actualCloseDate) {
      updateData.actualCloseDate = new Date();
    }

    if (validatedData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(validatedData.expectedCloseDate);
    }

    if (validatedData.actualCloseDate) {
      updateData.actualCloseDate = new Date(validatedData.actualCloseDate);
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });

    res.json(deal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// DELETE /api/deals/:id - Delete deal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if deal exists and belongs to user's tenant
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await prisma.deal.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

export default router;