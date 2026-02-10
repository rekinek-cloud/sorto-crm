import express from 'express';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { prisma } from '../config/database';
import { TaskStatus, Priority, EnergyLevel } from '@prisma/client';

const router = express.Router();

/**
 * GET /api/v1/next-actions/test-public
 * Test endpoint without auth for debugging
 */
router.get('/test-public', async (req, res) => {
  try {
    res.json({
      message: 'Next Actions API is working',
      timestamp: new Date().toISOString(),
      endpointsAvailable: [
        'GET /next-actions (requires auth)',
        'GET /next-actions/stats (requires auth)',
        'POST /next-actions (requires auth)',
        'GET /next-actions/test-public (no auth)'
      ]
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

/**
 * GET /api/v1/nextactions/list-public
 * Public endpoint for testing - returns sample data
 */
router.get('/list-public', async (req, res) => {
  try {
    // Return some real data from the database for testing
    const nextActions = await prisma.next_actions.findMany({
      where: {
        organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449' // Demo organization
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        stream: { select: { id: true, name: true, color: true } },
        assignedTo: { select: { firstName: true, lastName: true } }
      },
      take: 10
    });

    res.json(nextActions);
  } catch (error) {
    console.error('Error in public nextactions endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch next actions' });
  }
});

/**
 * GET /api/v1/next-actions/:id
 * Get single next action by ID
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const nextAction = await prisma.next_actions.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        company: {
          select: { id: true, name: true, industry: true }
        },
        project: {
          select: { id: true, name: true, status: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        stream: {
          select: { id: true, name: true, color: true, icon: true }
        },
        assignedTo: {
          select: { firstName: true, lastName: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (!nextAction) {
      return res.status(404).json({ error: 'Next action not found' });
    }

    res.json(nextAction);
  } catch (error) {
    console.error('Error fetching next action:', error);
    res.status(500).json({ error: 'Failed to fetch next action' });
  }
});

/**
 * GET /api/v1/next-actions
 * Get all next actions with filters
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      context,
      priority,
      energy,
      status = 'NEW,IN_PROGRESS',
      contactId,
      companyId,
      projectId,
      taskId,
      streamId,
      limit = '50',
      offset = '0'
    } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId,
      status: {
        in: (status as string).split(',') as TaskStatus[]
      }
    };

    // GTD Filters
    if (context) where.context = context;
    if (priority) where.priority = priority;
    if (energy) where.energy = energy;

    // Business Context Filters
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;
    if (streamId) where.streamId = streamId;

    const nextActions = await prisma.next_actions.findMany({
      where,
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true }
        },
        company: {
          select: { id: true, name: true, industry: true }
        },
        project: {
          select: { id: true, name: true, status: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        stream: {
          select: { id: true, name: true, color: true, icon: true }
        },
        assignedTo: {
          select: { firstName: true, lastName: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(nextActions);
  } catch (error) {
    console.error('Error fetching next actions:', error);
    res.status(500).json({ error: 'Failed to fetch next actions' });
  }
});

/**
 * GET /api/v1/next-actions/stats
 * Get next actions statistics
 */
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const baseWhere = {
      organizationId: req.user!.organizationId,
      status: { in: [TaskStatus.NEW, TaskStatus.IN_PROGRESS] }
    };

    const [totalActions, overdue, dueToday, highPriority, byContext] = await Promise.all([
      // Total active next actions
      prisma.next_actions.count({ where: baseWhere }),

      // Overdue next actions
      prisma.next_actions.count({
        where: {
          ...baseWhere,
          dueDate: { lt: new Date() }
        }
      }),

      // Due today
      prisma.next_actions.count({
        where: {
          ...baseWhere,
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),

      // High priority
      prisma.next_actions.count({
        where: {
          ...baseWhere,
          priority: { in: [Priority.HIGH, Priority.URGENT] }
        }
      }),

      // By context
      prisma.next_actions.groupBy({
        by: ['context'],
        where: baseWhere,
        _count: { context: true }
      })
    ]);

    const byContextObj = byContext.reduce((acc, item) => {
      acc[item.context] = item._count.context;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalActions,
      overdue,
      dueToday,
      highPriority,
      byContext: byContextObj
    });
  } catch (error) {
    console.error('Error fetching next actions stats:', error);
    res.status(500).json({ error: 'Failed to fetch next actions statistics' });
  }
});

/**
 * POST /api/v1/next-actions
 * Create new next action
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      description,
      context,
      priority = 'MEDIUM',
      energy = 'MEDIUM',
      estimatedTime,
      dueDate,
      // Business Context
      contactId,
      companyId,
      projectId,
      taskId,
      streamId,
      assignedToId
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const nextAction = await prisma.next_actions.create({
      data: {
        title,
        description,
        context,
        priority: priority as Priority,
        energy: energy as EnergyLevel,
        estimatedTime,
        dueDate: dueDate ? new Date(dueDate) : null,
        // Business Context
        contactId: contactId || null,
        companyId: companyId || null,
        projectId: projectId || null,
        taskId: taskId || null,
        streamId: streamId || null,
        // Meta
        organizationId: req.user!.organizationId,
        createdById: req.user!.id,
        assignedToId: assignedToId || null
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true }
        },
        company: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        },
        task: {
          select: { id: true, title: true }
        },
        stream: {
          select: { id: true, name: true, color: true }
        }
      }
    });

    res.status(201).json({
      message: 'Next action created successfully',
      nextAction
    });
  } catch (error) {
    console.error('Error creating next action:', error);
    res.status(500).json({ error: 'Failed to create next action' });
  }
});

/**
 * PUT /api/v1/next-actions/:id
 * Update next action
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      context,
      priority,
      energy,
      estimatedTime,
      status,
      dueDate,
      completedAt
    } = req.body;

    const existingAction = await prisma.next_actions.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingAction) {
      return res.status(404).json({ error: 'Next action not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (context !== undefined) updateData.context = context;
    if (priority !== undefined) updateData.priority = priority;
    if (energy !== undefined) updateData.energy = energy;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

    const updatedAction = await prisma.next_actions.update({
      where: { id },
      data: updateData,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        stream: { select: { id: true, name: true, color: true } }
      }
    });

    res.json({
      message: 'Next action updated successfully',
      nextAction: updatedAction
    });
  } catch (error) {
    console.error('Error updating next action:', error);
    res.status(500).json({ error: 'Failed to update next action' });
  }
});

/**
 * DELETE /api/v1/next-actions/:id
 * Delete next action
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const existingAction = await prisma.next_actions.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingAction) {
      return res.status(404).json({ error: 'Next action not found' });
    }

    await prisma.next_actions.delete({
      where: { id }
    });

    res.json({ message: 'Next action deleted successfully' });
  } catch (error) {
    console.error('Error deleting next action:', error);
    res.status(500).json({ error: 'Failed to delete next action' });
  }
});

/**
 * POST /api/v1/next-actions/:id/complete
 * Complete next action
 */
router.post('/:id/complete', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const existingAction = await prisma.next_actions.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingAction) {
      return res.status(404).json({ error: 'Next action not found' });
    }

    const updatedAction = await prisma.next_actions.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        ...(notes && { 
          description: `${existingAction.description || ''}\n\nCompletion notes: ${notes}`.trim() 
        })
      }
    });

    res.json({
      message: 'Next action completed successfully',
      nextAction: updatedAction
    });
  } catch (error) {
    console.error('Error completing next action:', error);
    res.status(500).json({ error: 'Failed to complete next action' });
  }
});

/**
 * PUT /api/v1/next-actions/:id/context
 * Update next action context
 */
router.put('/:id/context', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { context } = req.body;

    const existingAction = await prisma.next_actions.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingAction) {
      return res.status(404).json({ error: 'Next action not found' });
    }

    const updatedAction = await prisma.next_actions.update({
      where: { id },
      data: { context }
    });

    res.json({
      message: 'Context updated successfully',
      nextAction: updatedAction
    });
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ error: 'Failed to update context' });
  }
});

export default router;