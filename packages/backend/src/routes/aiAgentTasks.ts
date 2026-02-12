import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const approveTaskSchema = z.object({
  approved: z.boolean(),
  modifications: z.string().optional(),
});

const updateTaskSchema = z.object({
  status: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'WAITING_APPROVAL',
    'APPROVED',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
  ]),
  output: z.record(z.any()).optional(),
  result: z.string().optional(),
  errorMessage: z.string().optional(),
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /:id - Get task details
router.get('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const task = await prisma.aIAgentManagedTask.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify task belongs to current org
    if (task.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Error getting AI agent task:', error);
    res.status(500).json({ error: 'Failed to get AI agent task' });
  }
});

// POST /:id/approve - Approve or reject task
router.post('/:id/approve', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const parsed = approveTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Verify task exists and belongs to current org
    const task = await prisma.aIAgentManagedTask.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    if (task.status !== 'WAITING_APPROVAL') {
      res.status(400).json({ error: 'Task is not waiting for approval' });
      return;
    }

    const approvalStatus = parsed.data.approved
      ? parsed.data.modifications
        ? 'APPROVAL_MODIFIED'
        : 'APPROVAL_APPROVED'
      : 'APPROVAL_REJECTED';

    const newStatus = parsed.data.approved ? 'APPROVED' : 'CANCELLED';

    const updated = await prisma.aIAgentManagedTask.update({
      where: { id },
      data: {
        approvalStatus,
        status: newStatus,
        approvedById: userId,
        approvedAt: new Date(),
        ...(parsed.data.modifications && {
          result: parsed.data.modifications,
        }),
      },
      include: {
        agent: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.json({ task: updated });
  } catch (error) {
    console.error('Error approving AI agent task:', error);
    res.status(500).json({ error: 'Failed to approve AI agent task' });
  }
});

// PATCH /:id - Update task status
router.patch('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Verify task exists and belongs to current org
    const task = await prisma.aIAgentManagedTask.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    const updateData: any = {
      status: parsed.data.status,
    };

    if (parsed.data.output !== undefined) updateData.output = parsed.data.output;
    if (parsed.data.result !== undefined) updateData.result = parsed.data.result;
    if (parsed.data.errorMessage !== undefined) updateData.errorMessage = parsed.data.errorMessage;

    // Auto-set timestamps based on status
    if (parsed.data.status === 'IN_PROGRESS' && !task.startedAt) {
      updateData.startedAt = new Date();
    }
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(parsed.data.status)) {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.aIAgentManagedTask.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // If task completed successfully, update agent stats
    if (parsed.data.status === 'COMPLETED') {
      const agentStats = await prisma.aIAgentManagedTask.aggregate({
        where: { agentId: task.agentId },
        _count: { id: true },
      });

      const completedCount = await prisma.aIAgentManagedTask.count({
        where: { agentId: task.agentId, status: 'COMPLETED' },
      });

      await prisma.aIAgentManaged.update({
        where: { id: task.agentId },
        data: {
          tasksCompleted: completedCount,
          successRate: agentStats._count.id > 0
            ? (completedCount / agentStats._count.id) * 100
            : 0,
          lastActivityAt: new Date(),
        },
      });
    }

    res.json({ task: updated });
  } catch (error) {
    console.error('Error updating AI agent task:', error);
    res.status(500).json({ error: 'Failed to update AI agent task' });
  }
});

export default router;
