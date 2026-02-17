import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

// Get all delegated tasks with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const {
      page = '1',
      limit = '20',
      status,
      delegatedTo,
      sortBy = 'delegatedOn',
      sortOrder = 'desc',
      search,
      overdue
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (delegatedTo) {
      where.delegatedTo = {
        contains: delegatedTo as string,
        mode: 'insensitive'
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { delegatedTo: { contains: search as string, mode: 'insensitive' } },
        { notes: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (overdue === 'true') {
      where.followUpDate = {
        lt: new Date(),
        not: null
      };
      where.status = {
        notIn: ['COMPLETED', 'CANCELED']
      };
    }

    // Get delegated tasks with related data
    const [delegatedTasks, total] = await Promise.all([
      prisma.delegatedTask.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.delegatedTask.count({ where })
    ]);

    const pages = Math.ceil(total / limitNum);

    return res.json({
      delegatedTasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching delegated tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get delegated tasks statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const now = new Date();

    const [
      totalDelegated,
      activeDelegated,
      completedDelegated,
      overdueDelegated,
      pendingFollowUp,
      byStatus
    ] = await Promise.all([
      prisma.delegatedTask.count({
        where: { organizationId }
      }),
      prisma.delegatedTask.count({
        where: {
          organizationId,
          status: {
            notIn: ['COMPLETED', 'CANCELED']
          }
        }
      }),
      prisma.delegatedTask.count({
        where: {
          organizationId,
          status: 'COMPLETED'
        }
      }),
      prisma.delegatedTask.count({
        where: {
          organizationId,
          followUpDate: {
            lt: now,
            not: null
          },
          status: {
            notIn: ['COMPLETED', 'CANCELED']
          }
        }
      }),
      prisma.delegatedTask.count({
        where: {
          organizationId,
          followUpDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          status: {
            notIn: ['COMPLETED', 'CANCELED']
          }
        }
      }),
      prisma.delegatedTask.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true
      })
    ]);

    // Get most common delegates
    const topDelegates = await prisma.delegatedTask.groupBy({
      by: ['delegatedTo'],
      where: { organizationId },
      _count: {
        delegatedTo: true
      },
      orderBy: {
        _count: {
          delegatedTo: 'desc'
        }
      },
      take: 5
    });

    return res.json({
      totalDelegated,
      activeDelegated,
      completedDelegated,
      overdueDelegated,
      pendingFollowUp,
      statusBreakdown: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topDelegates: topDelegates.map(item => ({
        name: item.delegatedTo,
        count: item._count.delegatedTo
      }))
    });
  } catch (error) {
    logger.error('Error fetching delegated tasks stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single delegated task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const delegatedTask = await prisma.delegatedTask.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      }
    });

    if (!delegatedTask) {
      return res.status(404).json({ message: 'Delegated task not found' });
    }

    return res.json(delegatedTask);
  } catch (error) {
    logger.error('Error fetching delegated task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new delegated task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const {
      description,
      delegatedTo,
      followUpDate,
      notes,
      taskId
    } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ message: 'Task description is required' });
    }

    if (!delegatedTo?.trim()) {
      return res.status(400).json({ message: 'Delegate name is required' });
    }

    // Validate task exists if provided
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          organizationId
        }
      });

      if (!task) {
        return res.status(400).json({ message: 'Related task not found' });
      }
    }

    const delegatedTask = await prisma.delegatedTask.create({
      data: {
        description: description.trim(),
        delegatedTo: delegatedTo.trim(),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes?.trim() || null,
        organizationId,
        taskId: taskId || null
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    });

    logger.info(`Created delegated task: ${delegatedTask.id} for organization: ${organizationId}`);
    return res.status(201).json(delegatedTask);
  } catch (error) {
    logger.error('Error creating delegated task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update delegated task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const {
      description,
      delegatedTo,
      followUpDate,
      status,
      notes,
      taskId
    } = req.body;

    const existingTask = await prisma.delegatedTask.findFirst({
      where: { id, organizationId }
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Delegated task not found' });
    }

    // Validate task exists if provided
    if (taskId && taskId !== existingTask.taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          organizationId
        }
      });

      if (!task) {
        return res.status(400).json({ message: 'Related task not found' });
      }
    }

    const updateData: any = {};
    if (description !== undefined) updateData.description = description.trim();
    if (delegatedTo !== undefined) updateData.delegatedTo = delegatedTo.trim();
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (taskId !== undefined) updateData.taskId = taskId || null;

    const delegatedTask = await prisma.delegatedTask.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    });

    logger.info(`Updated delegated task: ${id} for organization: ${organizationId}`);
    return res.json(delegatedTask);
  } catch (error) {
    logger.error('Error updating delegated task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete delegated task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const delegatedTask = await prisma.delegatedTask.findFirst({
      where: { id, organizationId }
    });

    if (!delegatedTask) {
      return res.status(404).json({ message: 'Delegated task not found' });
    }

    await prisma.delegatedTask.delete({
      where: { id }
    });

    logger.info(`Deleted delegated task: ${id} for organization: ${organizationId}`);
    return res.json({ message: 'Delegated task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting delegated task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get delegation history/timeline
router.get('/delegate/:name/history', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { name } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      prisma.delegatedTask.findMany({
        where: {
          organizationId,
          delegatedTo: {
            contains: name,
            mode: 'insensitive'
          }
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        },
        orderBy: {
          delegatedOn: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.delegatedTask.count({
        where: {
          organizationId,
          delegatedTo: {
            contains: name,
            mode: 'insensitive'
          }
        }
      })
    ]);

    const stats = await prisma.delegatedTask.groupBy({
      by: ['status'],
      where: {
        organizationId,
        delegatedTo: {
          contains: name,
          mode: 'insensitive'
        }
      },
      _count: true
    });

    return res.json({
      delegate: name,
      tasks,
      stats: stats.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching delegation history:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
