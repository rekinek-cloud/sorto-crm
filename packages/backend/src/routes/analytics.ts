import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

/**
 * GET /api/v1/analytics/dashboard
 * Get analytics dashboard data
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    // Get basic counts
    const [tasksCount, projectsCount, dealsCount, contactsCount] = await Promise.all([
      prisma.task.count({ where: { organizationId } }),
      prisma.project.count({ where: { organizationId } }),
      prisma.deal.count({ where: { organizationId } }),
      prisma.contact.count({ where: { organizationId } })
    ]);

    // Get completed tasks this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = await prisma.task.count({
      where: {
        organizationId,
        status: 'COMPLETED',
        updatedAt: { gte: startOfWeek }
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalTasks: tasksCount,
          totalProjects: projectsCount,
          totalDeals: dealsCount,
          totalContacts: contactsCount
        },
        productivity: {
          completedThisWeek
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics dashboard' });
  }
});

/**
 * GET /api/v1/analytics
 * Get analytics overview
 */
router.get('/', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: {
        dashboard: 'GET /api/v1/analytics/dashboard'
      }
    }
  });
});

export default router;
