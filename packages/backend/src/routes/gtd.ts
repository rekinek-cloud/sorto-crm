import express from 'express';
import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { gtdService, GTDProcessingDecision } from '../services/gtdService';

const router = express.Router();
const prisma = new PrismaClient();

// Get inbox items
router.get('/inbox', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      unprocessed = 'false', 
      source, 
      actionable = 'false',
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      unprocessedOnly: unprocessed === 'true',
      source: source as string,
      actionableOnly: actionable === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const items = await gtdService.getInboxItems(req.user!.organizationId, filters);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching inbox items:', error);
    res.status(500).json({ error: 'Failed to fetch inbox items' });
  }
});

// Get inbox statistics
router.get('/inbox/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await gtdService.getInboxStats(req.user!.organizationId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching inbox stats:', error);
    res.status(500).json({ error: 'Failed to fetch inbox statistics' });
  }
});

// Create new inbox item (quick capture)
router.post('/inbox', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      description,
      type = 'TASK',
      priority = 'MEDIUM',
      estimatedTime,
      context,
      dueDate
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create a new task in NEW status (inbox item)
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority as Priority,
        status: TaskStatus.NEW,
        context,
        estimatedTime,
        dueDate: dueDate ? new Date(dueDate) : null,
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({
      message: 'Inbox item created successfully',
      item: {
        id: task.id,
        type: 'TASK',
        title: task.title,
        description: task.description,
        source: 'manual',
        sourceId: task.id,
        priority: task.priority,
        urgencyScore: 50,
        actionable: true,
        processed: false,
        estimatedTime: task.estimatedTime,
        contextSuggested: task.context,
        organizationId: task.organizationId,
        createdAt: task.createdAt,
        receivedAt: task.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating inbox item:', error);
    res.status(500).json({ error: 'Failed to create inbox item' });
  }
});

// Process inbox item with GTD methodology
router.post('/inbox/:id/process', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const decision: GTDProcessingDecision = req.body;
    
    decision.itemId = id;
    
    const result = await gtdService.processInboxItem(id, decision, req.user!.id);
    
    res.json({
      message: 'Item processed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing inbox item:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process item' 
    });
  }
});

// Quick actions for inbox items
router.post('/inbox/:id/quick-action', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    if (!['QUICK_DO', 'QUICK_DEFER', 'QUICK_DELETE'].includes(action)) {
      return res.status(400).json({ error: 'Invalid quick action' });
    }
    
    const result = await gtdService.quickAction(id, action, req.user!.id);
    
    res.json({
      message: 'Quick action completed',
      result
    });
  } catch (error) {
    console.error('Error performing quick action:', error);
    res.status(500).json({ error: 'Failed to perform quick action' });
  }
});

// Get next actions (actionable tasks)
router.get('/next-actions', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      context,
      priority,
      energy,
      limit = '50',
      offset = '0'
    } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId,
      status: {
        in: [TaskStatus.IN_PROGRESS, TaskStatus.NEW]
      },
      OR: [
        { dueDate: null },
        { dueDate: { gte: new Date() } }
      ]
    };

    if (context) {
      where.context = context;
    }

    if (priority) {
      where.priority = priority;
    }

    if (energy) {
      where.energy = energy;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        stream: {
          select: { name: true, color: true }
        },
        project: {
          select: { name: true }
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

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching next actions:', error);
    res.status(500).json({ error: 'Failed to fetch next actions' });
  }
});

// Get next actions statistics
router.get('/next-actions/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [totalActions, overdue, dueToday, highPriority, byContext] = await Promise.all([
      prisma.task.count({
        where: {
          organizationId: req.user!.organizationId,
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.NEW] }
        }
      }),
      prisma.task.count({
        where: {
          organizationId: req.user!.organizationId,
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.NEW] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.task.count({
        where: {
          organizationId: req.user!.organizationId,
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.NEW] },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.task.count({
        where: {
          organizationId: req.user!.organizationId,
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.NEW] },
          priority: Priority.HIGH
        }
      }),
      prisma.task.groupBy({
        by: ['context'],
        where: {
          organizationId: req.user!.organizationId,
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.NEW] },
          context: { not: null }
        },
        _count: true
      })
    ]);

    res.json({
      totalActions,
      overdue,
      dueToday,
      highPriority,
      byContext: byContext.reduce((acc, item) => {
        if (item.context) {
          acc[item.context] = item._count;
        }
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error fetching next actions stats:', error);
    res.status(500).json({ error: 'Failed to fetch next actions statistics' });
  }
});

// Update task context
router.put('/tasks/:id/context', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { context } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { context }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task context:', error);
    res.status(500).json({ error: 'Failed to update task context' });
  }
});

// Complete task action
router.post('/tasks/:id/complete', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        ...(notes && { description: `${task.description || ''}\n\nCompletion notes: ${notes}` })
      }
    });

    // Check if this was a waiting for item
    const waitingFor = await prisma.waitingFor.findFirst({
      where: { taskId: id }
    });

    if (waitingFor) {
      await prisma.waitingFor.update({
        where: { id: waitingFor.id },
        data: { status: 'RESPONDED' }
      });
    }

    res.json({
      message: 'Task completed successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Get waiting for items
router.get('/waiting-for', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      overdue = 'false',
      limit = '50',
      offset = '0'
    } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId,
      status: { in: ['PENDING', 'RESPONDED'] }
    };

    if (overdue === 'true') {
      where.expectedResponseDate = { lt: new Date() };
    }

    const waitingForItems = await prisma.waitingFor.findMany({
      where,
      include: {
        task: {
          select: { id: true, title: true, status: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: [
        { expectedResponseDate: 'asc' },
        { sinceDate: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(waitingForItems);
  } catch (error) {
    console.error('Error fetching waiting for items:', error);
    res.status(500).json({ error: 'Failed to fetch waiting for items' });
  }
});

// Follow up on waiting for item
router.post('/waiting-for/:id/follow-up', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { notes, newExpectedDate } = req.body;

    const waitingFor = await prisma.waitingFor.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!waitingFor) {
      return res.status(404).json({ error: 'Waiting for item not found' });
    }

    const updatedItem = await prisma.waitingFor.update({
      where: { id },
      data: {
        status: 'PENDING',
        followUpDate: new Date(),
        expectedResponseDate: newExpectedDate ? new Date(newExpectedDate) : waitingFor.expectedResponseDate,
        notes: notes ? `${waitingFor.notes || ''}\n\nFollow-up ${new Date().toISOString()}: ${notes}` : waitingFor.notes
      }
    });

    res.json({
      message: 'Follow-up recorded successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error recording follow-up:', error);
    res.status(500).json({ error: 'Failed to record follow-up' });
  }
});

// Get someday/maybe items
router.get('/someday-maybe', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      category,
      limit = '50',
      offset = '0'
    } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId,
      status: 'ACTIVE'
    };

    if (category) {
      where.category = category;
    }

    const somedayItems = await prisma.somedayMaybe.findMany({
      where,
      include: {
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(somedayItems);
  } catch (error) {
    console.error('Error fetching someday/maybe items:', error);
    res.status(500).json({ error: 'Failed to fetch someday/maybe items' });
  }
});

// Create someday/maybe item
router.post('/someday-maybe', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      description,
      category = 'IDEAS',
      priority = 'LOW',
      whenToReview,
      tags = []
    } = req.body;

    const item = await prisma.somedayMaybe.create({
      data: {
        title,
        description,
        category,
        priority,
        whenToReview: whenToReview ? new Date(whenToReview) : null,
        tags,
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating someday/maybe item:', error);
    res.status(500).json({ error: 'Failed to create someday/maybe item' });
  }
});

// Activate someday/maybe item (convert to task)
router.post('/someday-maybe/:id/activate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { dueDate, streamId, context } = req.body;

    const somedayItem = await prisma.somedayMaybe.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!somedayItem) {
      return res.status(404).json({ error: 'Someday/maybe item not found' });
    }

    // Create task from someday/maybe item
    const task = await prisma.task.create({
      data: {
        title: somedayItem.title,
        description: somedayItem.description,
        priority: somedayItem.priority as Priority,
        status: TaskStatus.NEW,
        dueDate: dueDate ? new Date(dueDate) : null,
        context,
        streamId,
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
      }
    });

    // Update someday/maybe status
    await prisma.somedayMaybe.update({
      where: { id },
      data: { 
        status: 'ACTIVATED',
        activatedAt: new Date()
      }
    });

    res.json({
      message: 'Someday/maybe item activated as task',
      task,
      somedayItem
    });
  } catch (error) {
    console.error('Error activating someday/maybe item:', error);
    res.status(500).json({ error: 'Failed to activate someday/maybe item' });
  }
});

// Get available contexts
router.get('/contexts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contexts = await prisma.task.findMany({
      where: {
        organizationId: req.user!.organizationId,
        context: { not: null }
      },
      select: { context: true },
      distinct: ['context']
    });

    const contextList = contexts
      .map(t => t.context)
      .filter(Boolean)
      .sort();

    // Add default contexts if not present
    const defaultContexts = ['@calls', '@computer', '@errands', '@home', '@office', '@waiting'];
    const allContexts = [...new Set([...defaultContexts, ...contextList])];

    res.json(allContexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    res.status(500).json({ error: 'Failed to fetch contexts' });
  }
});

export default router;