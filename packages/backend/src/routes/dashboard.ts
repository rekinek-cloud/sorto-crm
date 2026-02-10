import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;

    // Get all tasks for the organization
    const tasks = await prisma.task.findMany({
      where: { organizationId },
      include: {
        project: { select: { name: true } },
        context: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true, status: true }
    });

    // Get all streams
    const streams = await prisma.stream.findMany({
      where: { organizationId },
      select: { id: true, name: true }
    });

    // Get inbox items count (unprocessed)
    const inboxCount = await prisma.inboxItem.count({
      where: {
        organizationId,
        processed: false
      }
    });

    // Calculate statistics
    const now = new Date();
    const stats = {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status === 'NEW' || t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
      totalStreams: streams.length,
      inboxCount: inboxCount,
      urgentTasks: tasks.filter(t => t.priority === 'HIGH').length,
      overdueCount: tasks.filter(t =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELED'
      ).length
    };

    // Get recent tasks (last 5 active)
    const recentTasks = tasks
      .filter(t => t.status !== 'COMPLETED')
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectName: task.project?.name,
        contextName: task.context?.name
      }));

    res.json({
      stats,
      recentTasks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get weekly summary
router.get('/weekly-summary', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [completedThisWeek, createdThisWeek] = await Promise.all([
      prisma.task.count({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: oneWeekAgo }
        }
      }),
      prisma.task.count({
        where: {
          organizationId,
          createdAt: { gte: oneWeekAgo }
        }
      })
    ]);

    res.json({
      completedThisWeek,
      createdThisWeek,
      productivity: completedThisWeek / Math.max(createdThisWeek, 1) * 100
    });

  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

// Get upcoming deadlines
router.get('/upcoming-deadlines', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await prisma.task.findMany({
      where: {
        organizationId,
        status: { in: ['NEW', 'IN_PROGRESS'] },
        dueDate: {
          gte: new Date(),
          lte: nextWeek
        }
      },
      include: {
        project: { select: { name: true } },
        context: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    res.json({
      upcomingTasks: upcomingTasks.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        projectName: task.project?.name,
        contextName: task.context?.name
      }))
    });

  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
  }
});

export default router;