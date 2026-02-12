import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAgentSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().min(1, 'Agent name is required'),
  role: z.string().min(1, 'Agent role is required'),
  avatar: z.string().default('🤖'),
  description: z.string().optional(),
  autonomyLevel: z.number().int().min(1).max(5).default(2),
  capabilities: z.array(z.string()).default([]),
  settings: z.record(z.any()).optional(),
  organizationIds: z.array(z.string().uuid()).optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  avatar: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']).optional(),
  autonomyLevel: z.number().int().min(1).max(5).optional(),
  capabilities: z.array(z.string()).optional(),
  settings: z.record(z.any()).optional(),
});

const createTaskSchema = z.object({
  type: z.string().min(1, 'Task type is required'),
  input: z.record(z.any()).default({}),
  prompt: z.string().optional(),
  requiresApproval: z.boolean().default(false),
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET / - List AI agents for current org (via assignments) or holding
router.get('/', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { status, search } = req.query;

    // Get agents assigned to current org
    const where: any = {
      organizationAssignments: {
        some: { organizationId },
      },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { role: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const agents = await prisma.aIAgentManaged.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organizationAssignments: {
          select: {
            id: true,
            organizationId: true,
            settings: true,
          },
        },
        _count: {
          select: { tasks: true, sentMessages: true },
        },
      },
    });

    res.json({ agents });
  } catch (error) {
    console.error('Error listing AI agents:', error);
    res.status(500).json({ error: 'Failed to list AI agents' });
  }
});

// GET /templates - List AI agent templates (MUST be before /:id)
router.get('/templates', async (req, res) => {
  try {
    const { search } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { role: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.aIAgentTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ templates });
  } catch (error) {
    console.error('Error listing AI agent templates:', error);
    res.status(500).json({ error: 'Failed to list AI agent templates' });
  }
});

// POST / - Create AI agent
router.post('/', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;

    const parsed = createAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // If templateId provided, merge template defaults
    let templateData: any = {};
    if (parsed.data.templateId) {
      const template = await prisma.aIAgentTemplate.findUnique({
        where: { id: parsed.data.templateId },
      });
      if (template) {
        templateData = {
          capabilities: template.capabilities,
          autonomyLevel: template.defaultAutonomyLevel,
          settings: template.defaultSettings,
        };
      }
    }

    // Get holding for current org
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { holdingId: true },
    });

    if (!org?.holdingId) {
      // Check if user owns a holding, use that
      const ownedHolding = await prisma.holding.findFirst({
        where: { ownerId: userId },
      });

      if (!ownedHolding) {
        res.status(400).json({
          error: 'No holding found. AI agents must belong to a holding.',
        });
        return;
      }

      org!.holdingId = ownedHolding.id;
    }

    const holdingId = org!.holdingId!;

    // Create agent with merged data
    const agent = await prisma.aIAgentManaged.create({
      data: {
        holdingId,
        name: parsed.data.name,
        role: parsed.data.role,
        avatar: parsed.data.avatar,
        description: parsed.data.description,
        autonomyLevel: parsed.data.autonomyLevel ?? templateData.autonomyLevel ?? 2,
        capabilities: parsed.data.capabilities.length > 0
          ? parsed.data.capabilities
          : (templateData.capabilities ?? []),
        settings: parsed.data.settings ?? templateData.settings ?? {},
        organizationAssignments: {
          create: (parsed.data.organizationIds ?? [organizationId]).map((orgId) => ({
            organizationId: orgId,
          })),
        },
      },
      include: {
        organizationAssignments: {
          select: { id: true, organizationId: true },
        },
      },
    });

    res.status(201).json({ agent });
  } catch (error) {
    console.error('Error creating AI agent:', error);
    res.status(500).json({ error: 'Failed to create AI agent' });
  }
});

// GET /:id - Get agent details
router.get('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const agent = await prisma.aIAgentManaged.findUnique({
      where: { id },
      include: {
        holding: {
          select: { id: true, name: true, ownerId: true },
        },
        organizationAssignments: {
          include: {
            organization: {
              select: { id: true, name: true, shortName: true },
            },
          },
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        },
        _count: {
          select: { tasks: true, sentMessages: true, receivedMessages: true },
        },
      },
    });

    if (!agent) {
      res.status(404).json({ error: 'AI agent not found' });
      return;
    }

    // Verify access: agent is assigned to current org
    const hasAccess = agent.organizationAssignments.some(
      (a) => a.organizationId === organizationId
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this AI agent' });
      return;
    }

    res.json({ agent });
  } catch (error) {
    console.error('Error getting AI agent:', error);
    res.status(500).json({ error: 'Failed to get AI agent' });
  }
});

// PATCH /:id - Update agent
router.patch('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const parsed = updateAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Verify access
    const assignment = await prisma.aIAgentAssignment.findFirst({
      where: { agentId: id, organizationId },
    });

    if (!assignment) {
      res.status(403).json({ error: 'Access denied to this AI agent' });
      return;
    }

    const updated = await prisma.aIAgentManaged.update({
      where: { id },
      data: parsed.data,
      include: {
        organizationAssignments: {
          select: { id: true, organizationId: true },
        },
      },
    });

    res.json({ agent: updated });
  } catch (error) {
    console.error('Error updating AI agent:', error);
    res.status(500).json({ error: 'Failed to update AI agent' });
  }
});

// DELETE /:id - Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    // Verify access
    const assignment = await prisma.aIAgentAssignment.findFirst({
      where: { agentId: id, organizationId },
    });

    if (!assignment) {
      res.status(403).json({ error: 'Access denied to this AI agent' });
      return;
    }

    await prisma.aIAgentManaged.delete({
      where: { id },
    });

    res.json({ message: 'AI agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI agent:', error);
    res.status(500).json({ error: 'Failed to delete AI agent' });
  }
});

// POST /:id/tasks - Create task for agent
router.post('/:id/tasks', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id: agentId } = req.params;

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Verify agent is assigned to current org
    const assignment = await prisma.aIAgentAssignment.findFirst({
      where: { agentId, organizationId },
    });

    if (!assignment) {
      res.status(403).json({ error: 'Access denied to this AI agent' });
      return;
    }

    const task = await prisma.aIAgentManagedTask.create({
      data: {
        agentId,
        organizationId,
        type: parsed.data.type,
        input: parsed.data.input,
        prompt: parsed.data.prompt,
        requiresApproval: parsed.data.requiresApproval,
        requestedById: userId,
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating AI agent task:', error);
    res.status(500).json({ error: 'Failed to create AI agent task' });
  }
});

// GET /:id/tasks - List tasks for agent
router.get('/:id/tasks', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id: agentId } = req.params;
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Verify agent is assigned to current org
    const assignment = await prisma.aIAgentAssignment.findFirst({
      where: { agentId, organizationId },
    });

    if (!assignment) {
      res.status(403).json({ error: 'Access denied to this AI agent' });
      return;
    }

    const where: any = {
      agentId,
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.aIAgentManagedTask.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aIAgentManagedTask.count({ where }),
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing AI agent tasks:', error);
    res.status(500).json({ error: 'Failed to list AI agent tasks' });
  }
});

export default router;
