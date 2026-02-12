import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  toAgentId: z.string().uuid('Valid agent ID is required'),
  content: z.string().min(1, 'Message content is required'),
  taskId: z.string().uuid().optional(),
  type: z.enum(['INFO', 'QUESTION', 'RESULT', 'ALERT', 'APPROVAL_REQUEST']).default('INFO'),
  metadata: z.record(z.any()).optional(),
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET / - List messages for user
router.get('/', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { unreadOnly, page = '1', limit = '50', agentId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      toUserId: userId,
      organizationId,
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    if (agentId) {
      where.fromAgentId = agentId;
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.aIAgentManagedMessage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          fromAgent: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.aIAgentManagedMessage.count({ where }),
      prisma.aIAgentManagedMessage.count({
        where: {
          toUserId: userId,
          organizationId,
          isRead: false,
        },
      }),
    ]);

    res.json({
      messages,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing AI messages:', error);
    res.status(500).json({ error: 'Failed to list AI messages' });
  }
});

// POST / - Send message to agent
router.post('/', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Verify agent is assigned to current org
    const assignment = await prisma.aIAgentAssignment.findFirst({
      where: {
        agentId: parsed.data.toAgentId,
        organizationId,
      },
    });

    if (!assignment) {
      res.status(403).json({ error: 'Access denied to this AI agent' });
      return;
    }

    // Verify task belongs to current org if taskId provided
    if (parsed.data.taskId) {
      const task = await prisma.aIAgentManagedTask.findFirst({
        where: {
          id: parsed.data.taskId,
          organizationId,
        },
      });

      if (!task) {
        res.status(404).json({ error: 'Task not found in this organization' });
        return;
      }
    }

    const message = await prisma.aIAgentManagedMessage.create({
      data: {
        fromUserId: userId,
        toAgentId: parsed.data.toAgentId,
        organizationId,
        content: parsed.data.content,
        type: parsed.data.type,
        taskId: parsed.data.taskId,
        metadata: parsed.data.metadata ?? {},
      },
      include: {
        toAgent: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending AI message:', error);
    res.status(500).json({ error: 'Failed to send AI message' });
  }
});

// PATCH /:id/read - Mark message as read
router.patch('/:id/read', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    // Verify message belongs to user
    const message = await prisma.aIAgentManagedMessage.findUnique({
      where: { id },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.toUserId !== userId) {
      res.status(403).json({ error: 'Access denied to this message' });
      return;
    }

    if (message.isRead) {
      res.json({ message, alreadyRead: true });
      return;
    }

    const updated = await prisma.aIAgentManagedMessage.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ message: updated });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

export default router;
