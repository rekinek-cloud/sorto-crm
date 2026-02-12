import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createHoldingSchema = z.object({
  name: z.string().min(1, 'Holding name is required'),
  nip: z.string().optional(),
});

const updateHoldingSchema = z.object({
  name: z.string().min(1).optional(),
  nip: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

const addOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  shortName: z.string().optional(),
  nip: z.string().optional(),
  companyType: z.enum(['PRODUCTION', 'SALES', 'SERVICES', 'EXPORT', 'OTHER']).default('OTHER'),
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET / - List holdings for user (as owner or via employee orgs)
router.get('/', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;

    // Get holdings where user is owner
    const ownedHoldings = await prisma.holding.findMany({
      where: { ownerId: userId },
      include: {
        organizations: {
          select: {
            id: true,
            name: true,
            shortName: true,
            companyType: true,
            slug: true,
          },
        },
        _count: {
          select: { organizations: true, aiAgents: true },
        },
      },
    });

    // Get holdings via employee organization membership
    const orgHoldings = await prisma.holding.findMany({
      where: {
        organizations: {
          some: { id: organizationId },
        },
        ownerId: { not: userId }, // Exclude already-fetched owned holdings
      },
      include: {
        organizations: {
          select: {
            id: true,
            name: true,
            shortName: true,
            companyType: true,
            slug: true,
          },
        },
        _count: {
          select: { organizations: true, aiAgents: true },
        },
      },
    });

    const holdings = [...ownedHoldings, ...orgHoldings];

    res.json({ holdings });
  } catch (error) {
    console.error('Error listing holdings:', error);
    res.status(500).json({ error: 'Failed to list holdings' });
  }
});

// POST / - Create holding
router.post('/', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const parsed = createHoldingSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const holding = await prisma.holding.create({
      data: {
        name: parsed.data.name,
        nip: parsed.data.nip,
        ownerId: userId,
      },
      include: {
        organizations: true,
      },
    });

    res.status(201).json({ holding });
  } catch (error) {
    console.error('Error creating holding:', error);
    res.status(500).json({ error: 'Failed to create holding' });
  }
});

// GET /:id - Get holding with organizations
router.get('/:id', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const holding = await prisma.holding.findUnique({
      where: { id },
      include: {
        organizations: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
            companyType: true,
            color: true,
            icon: true,
            createdAt: true,
          },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        aiAgents: {
          select: { id: true, name: true, role: true, status: true },
        },
      },
    });

    if (!holding) {
      res.status(404).json({ error: 'Holding not found' });
      return;
    }

    // Verify access: user is owner or belongs to one of the holding's orgs
    const hasAccess =
      holding.ownerId === userId ||
      holding.organizations.some((org) => org.id === organizationId);

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this holding' });
      return;
    }

    res.json({ holding });
  } catch (error) {
    console.error('Error getting holding:', error);
    res.status(500).json({ error: 'Failed to get holding' });
  }
});

// PATCH /:id - Update holding
router.patch('/:id', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    const parsed = updateHoldingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Only owner can update holding
    const holding = await prisma.holding.findUnique({ where: { id } });
    if (!holding) {
      res.status(404).json({ error: 'Holding not found' });
      return;
    }
    if (holding.ownerId !== userId) {
      res.status(403).json({ error: 'Only the holding owner can update it' });
      return;
    }

    const updated = await prisma.holding.update({
      where: { id },
      data: parsed.data,
      include: {
        organizations: {
          select: { id: true, name: true, shortName: true, companyType: true },
        },
      },
    });

    res.json({ holding: updated });
  } catch (error) {
    console.error('Error updating holding:', error);
    res.status(500).json({ error: 'Failed to update holding' });
  }
});

// POST /:id/organizations - Add organization to holding
router.post('/:id/organizations', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    const parsed = addOrganizationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Only owner can add organizations
    const holding = await prisma.holding.findUnique({ where: { id } });
    if (!holding) {
      res.status(404).json({ error: 'Holding not found' });
      return;
    }
    if (holding.ownerId !== userId) {
      res.status(403).json({ error: 'Only the holding owner can add organizations' });
      return;
    }

    // Generate slug from name
    const slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    const organization = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        shortName: parsed.data.shortName,
        companyType: parsed.data.companyType,
        slug,
        holdingId: id,
      },
    });

    res.status(201).json({ organization });
  } catch (error) {
    console.error('Error adding organization to holding:', error);
    res.status(500).json({ error: 'Failed to add organization to holding' });
  }
});

export default router;
