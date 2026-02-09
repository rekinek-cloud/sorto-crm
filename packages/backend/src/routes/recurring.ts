import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all recurring tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const {
      page = '1',
      limit = '20',
      frequency,
      isActive,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { organizationId };
    if (frequency && frequency !== 'all') where.frequency = frequency;
    if (isActive !== undefined && isActive !== 'all') where.isActive = isActive === 'true';

    const [tasks, total] = await Promise.all([
      prisma.recurringTask.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum
      }),
      prisma.recurringTask.count({ where })
    ]);

    res.json({
      recurringTasks: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching recurring tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create recurring task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { title, description, frequency, pattern } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await prisma.recurringTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        frequency,
        pattern: pattern?.trim() || null,
        organizationId
      }
    });

    logger.info(`Created recurring task: ${task.id}`);
    res.status(201).json(task);
  } catch (error) {
    logger.error('Error creating recurring task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update recurring task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const task = await prisma.recurringTask.findFirst({
      where: { id, organizationId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Recurring task not found' });
    }

    const updated = await prisma.recurringTask.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating recurring task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /generate - Generate tasks from recurring tasks that are due
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const now = new Date();

    // Find active recurring tasks that are due (nextOccurrence <= now, or no nextOccurrence set)
    const dueTasks = await prisma.recurringTask.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { nextOccurrence: { lte: now } },
          { nextOccurrence: null },
        ],
      },
    });

    let generated = 0;
    const errors: string[] = [];

    for (const recurring of dueTasks) {
      try {
        // Create a task from the recurring template
        await prisma.task.create({
          data: {
            title: recurring.title,
            description: recurring.description || undefined,
            priority: recurring.priority,
            status: 'NEW',
            organizationId,
            assignedToId: recurring.assignedToId || undefined,
            streamId: recurring.streamId || undefined,
            projectId: recurring.projectId || undefined,
          },
        });

        // Calculate next occurrence based on frequency
        let nextDate = new Date(recurring.nextOccurrence || now);
        switch (recurring.frequency) {
          case 'DAILY':
            nextDate.setDate(nextDate.getDate() + (recurring.interval || 1));
            break;
          case 'WEEKLY':
            nextDate.setDate(nextDate.getDate() + 7 * (recurring.interval || 1));
            break;
          case 'BIWEEKLY':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'MONTHLY':
            nextDate.setMonth(nextDate.getMonth() + (recurring.interval || 1));
            break;
          case 'QUARTERLY':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'YEARLY':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            nextDate.setDate(nextDate.getDate() + 7);
        }

        // Update recurring task with next occurrence
        await prisma.recurringTask.update({
          where: { id: recurring.id },
          data: {
            nextOccurrence: nextDate,
            lastExecuted: now,
            executionCount: { increment: 1 },
          },
        });

        generated++;
      } catch (err: any) {
        errors.push(`${recurring.title}: ${err.message}`);
        logger.error(`Error generating task from recurring ${recurring.id}:`, err);
      }
    }

    logger.info(`Generated ${generated} tasks from ${dueTasks.length} recurring tasks for org ${organizationId}`);
    res.json({ generated, errors });
  } catch (error) {
    logger.error('Error generating recurring tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete recurring task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const task = await prisma.recurringTask.findFirst({
      where: { id, organizationId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Recurring task not found' });
    }

    await prisma.recurringTask.delete({ where: { id } });
    res.json({ message: 'Recurring task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting recurring task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;