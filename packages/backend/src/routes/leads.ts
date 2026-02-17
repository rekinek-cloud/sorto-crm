import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createLeadSchema = z.object({
  title: z.string().min(1, 'Lead title is required'),
  description: z.string().optional(),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('NEW'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  source: z.string().optional(),
  value: z.number().min(0).optional(),
});

const updateLeadSchema = createLeadSchema.partial();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /api/v1/leads - List leads with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      search,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder }
      }),
      prisma.lead.count({ where })
    ]);

    return res.json({
      leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/v1/leads/:id - Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// POST /api/v1/leads - Create new lead
router.post('/', async (req, res) => {
  try {
    const validatedData = createLeadSchema.parse(req.body);

    const lead = await prisma.lead.create({
      data: {
        ...validatedData,
        organizationId: req.user.organizationId,
      } as any
    });

    return res.status(201).json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT /api/v1/leads/:id - Update lead
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateLeadSchema.parse(req.body);

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    });

    return res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating lead:', error);
    return res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE /api/v1/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await prisma.lead.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
