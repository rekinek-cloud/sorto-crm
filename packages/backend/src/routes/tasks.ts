import { Router } from 'express';
import { z } from 'zod';
import { Priority, TaskStatus, EnergyLevel } from '@prisma/client';
import { prisma } from '../config/database';
import { validateRequest } from '../shared/middleware/validation';
import { authenticateToken } from '../shared/middleware/auth';
import { syncTasks } from './vectorSearch';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  contextId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  streamId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  energy: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  isWaitingFor: z.boolean().default(false),
  waitingForNote: z.string().optional()
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['NEW', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELED']).optional(),
  actualHours: z.number().positive().optional(),
  completedAt: z.string().datetime().optional()
});

// GET /api/v1/tasks - List tasks with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      contextId, 
      projectId, 
      streamId, 
      assignedToId,
      dueDate,
      page = '1',
      limit = '20',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (contextId) where.contextId = contextId;
    if (projectId) where.projectId = projectId;
    if (streamId) where.streamId = streamId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (dueDate) {
      const date = new Date(dueDate as string);
      where.dueDate = {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          context: true,
          project: { select: { id: true, name: true } },
          stream: { select: { id: true, name: true, color: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/v1/tasks/:id - Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        context: true,
        project: true,
        stream: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/v1/tasks - Create new task
router.post('/', authenticateToken, validateRequest({ body: createTaskSchema }), async (req, res) => {
  try {
    const taskData = req.body;

    // Verify context belongs to organization if provided
    if (taskData.contextId) {
      const context = await prisma.context.findFirst({
        where: { id: taskData.contextId, organizationId: req.user.organizationId }
      });
      if (!context) {
        return res.status(400).json({ error: 'Invalid context' });
      }
    }

    // Verify project belongs to organization if provided
    if (taskData.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: taskData.projectId, organizationId: req.user.organizationId }
      });
      if (!project) {
        return res.status(400).json({ error: 'Invalid project' });
      }
    }

    // Verify stream belongs to organization if provided
    if (taskData.streamId) {
      const stream = await prisma.stream.findFirst({
        where: { id: taskData.streamId, organizationId: req.user.organizationId }
      });
      if (!stream) {
        return res.status(400).json({ error: 'Invalid stream' });
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        context: true,
        project: { select: { id: true, name: true } },
        stream: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(201).json(task);

      // Auto-index to RAG
      syncTasks(req.user.organizationId, task.id).catch(err =>
        console.error('RAG index failed for task:', err.message)
      );
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/v1/tasks/:id - Update task
router.put('/:id', authenticateToken, validateRequest({ body: updateTaskSchema }), async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;

    // Check if task exists and belongs to organization
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, organizationId: req.user.organizationId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If completing task, set completedAt automatically
    if (updates.status === 'COMPLETED' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updates,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        completedAt: updates.completedAt ? new Date(updates.completedAt) : undefined
      },
      include: {
        context: true,
        project: { select: { id: true, name: true } },
        stream: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(task);

      // Auto-index to RAG
      syncTasks(req.user.organizationId, task.id, true).catch(err =>
        console.error('RAG reindex failed for task:', err.message)
      );
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/v1/tasks/:id - Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, organizationId: req.user.organizationId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET /api/v1/tasks/contexts/list - Get available contexts
router.get('/contexts/list', authenticateToken, async (req, res) => {
  try {
    const contexts = await prisma.context.findMany({
      where: {
        organizationId: req.user.organizationId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(contexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    res.status(500).json({ error: 'Failed to fetch contexts' });
  }
});

export default router;