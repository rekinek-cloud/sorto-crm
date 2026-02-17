import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';

const router = express.Router();

// Transform Prisma's 'users' relation to 'reporter' for frontend compatibility
function formatBugReport(bug: any) {
  if (!bug) return bug;
  const { users, ...rest } = bug;
  return { ...rest, reporter: users };
}

interface BugReportData {
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: 'UI_UX' | 'FUNCTIONALITY' | 'PERFORMANCE' | 'SECURITY' | 'DATA' | 'INTEGRATION' | 'OTHER';
  userAgent?: string;
  url?: string;
  browserInfo?: string;
  deviceInfo?: string;
  screenshots?: string[];
  attachments?: string[];
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

// Create a new bug report
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const bugData: BugReportData = req.body;
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;

    const bugReport = await prisma.bug_reports.create({
      data: {
        title: bugData.title,
        description: bugData.description,
        priority: bugData.priority || 'MEDIUM',
        category: bugData.category,
        userAgent: bugData.userAgent,
        url: bugData.url,
        browserInfo: bugData.browserInfo,
        deviceInfo: bugData.deviceInfo,
        screenshots: bugData.screenshots || [],
        attachments: bugData.attachments || [],
        stepsToReproduce: bugData.stepsToReproduce,
        expectedBehavior: bugData.expectedBehavior,
        actualBehavior: bugData.actualBehavior,
        reporterId: userId,
        organizationId: organizationId,
      } as any,
      include: {
        users: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    return res.status(201).json(formatBugReport(bugReport));
  } catch (error) {
    console.error('Failed to create bug report:', error);
    return res.status(500).json({ error: 'Failed to create bug report' });
  }
});

// Get all bug reports (admin endpoint)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { 
      status, 
      priority,
      category,
      limit = '50', 
      offset = '0',
      reporterId 
    } = req.query;

    const where: any = { organizationId };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (reporterId) where.reporterId = reporterId;

    const bugReports = await prisma.bug_reports.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        users: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    const total = await prisma.bug_reports.count({ where });

    return res.json({
      bugReports: bugReports.map(formatBugReport),
      total,
      hasMore: total > parseInt(offset as string) + bugReports.length
    });
  } catch (error) {
    console.error('Failed to fetch bug reports:', error);
    return res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// Get my bug reports (user endpoint)
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const { 
      status, 
      priority,
      limit = '20', 
      offset = '0'
    } = req.query;

    const where: any = { 
      organizationId,
      reporterId: userId
    };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const bugReports = await prisma.bug_reports.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        category: true,
        url: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        resolution: true
      }
    });

    const total = await prisma.bug_reports.count({ where });

    return res.json({
      bugReports,
      total,
      hasMore: total > parseInt(offset as string) + bugReports.length
    });
  } catch (error) {
    console.error('Failed to fetch my bug reports:', error);
    return res.status(500).json({ error: 'Failed to fetch my bug reports' });
  }
});

// Get bug report statistics
router.get('/stats/overview', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { days = '30' } = req.query;
    
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));

    const where: any = { 
      organizationId,
      createdAt: { gte: since }
    };

    const [
      totalBugs,
      openBugs,
      resolvedBugs,
      criticalBugs,
      bugsByStatus,
      bugsByPriority,
      bugsByCategory
    ] = await Promise.all([
      prisma.bug_reports.count({ where }),
      prisma.bug_reports.count({ where: { ...where, status: 'OPEN' } }),
      prisma.bug_reports.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.bug_reports.count({ where: { ...where, priority: 'CRITICAL' } }),
      prisma.bug_reports.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.bug_reports.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      prisma.bug_reports.groupBy({
        by: ['category'],
        where: { ...where, category: { not: null } },
        _count: true
      })
    ]);

    return res.json({
      totalBugs,
      openBugs,
      resolvedBugs,
      criticalBugs,
      bugsByStatus,
      bugsByPriority,
      bugsByCategory
    });
  } catch (error) {
    console.error('Failed to fetch bug report stats:', error);
    return res.status(500).json({ error: 'Failed to fetch bug report stats' });
  }
});

// Get a specific bug report
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const bugReport = await prisma.bug_reports.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        users: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!bugReport) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    return res.json(formatBugReport(bugReport));
  } catch (error) {
    console.error('Failed to fetch bug report:', error);
    return res.status(500).json({ error: 'Failed to fetch bug report' });
  }
});

// Update bug report status (admin endpoint)
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const { status, adminNotes, resolution } = req.body;

    const updateData: any = { status };

    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolution) updateData.resolution = resolution;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    const bugReport = await prisma.bug_reports.update({
      where: {
        id,
        organizationId
      },
      data: updateData,
      include: {
        users: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    return res.json(formatBugReport(bugReport));
  } catch (error) {
    console.error('Failed to update bug report:', error);
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    return res.status(500).json({ error: 'Failed to update bug report' });
  }
});

// Delete bug report (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    await prisma.bug_reports.delete({
      where: {
        id,
        organizationId
      }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete bug report:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    return res.status(500).json({ error: 'Failed to delete bug report' });
  }
});

export default router;
