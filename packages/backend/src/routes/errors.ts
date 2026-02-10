import express from 'express';
import { prisma } from '../config/database';

const router = express.Router();

interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  organizationId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  componentStack?: string;
}

// Log frontend errors
router.post('/', async (req, res) => {
  try {
    const errorData: ErrorData = req.body;

    // Create error log entry
    await prisma.errorLog.create({
      data: {
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url,
        userAgent: errorData.userAgent,
        severity: errorData.severity,
        context: errorData.context ? JSON.stringify(errorData.context) : null,
        componentStack: errorData.componentStack,
        sessionId: errorData.sessionId,
        userId: errorData.userId,
        organizationId: errorData.organizationId,
        timestamp: new Date(errorData.timestamp),
      }
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// Get errors for dashboard (requires auth)
router.get('/', async (req, res) => {
  try {
    const { 
      severity, 
      limit = '50', 
      offset = '0',
      organizationId,
      since 
    } = req.query;

    const where: any = {};
    
    if (severity) where.severity = severity;
    if (organizationId) where.organizationId = organizationId;
    if (since) where.timestamp = { gte: new Date(since as string) };

    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    res.json(errors);
  } catch (error) {
    console.error('Failed to fetch errors:', error);
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

// Get error statistics
router.get('/stats', async (req, res) => {
  try {
    const { organizationId, days = '7' } = req.query;
    
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));

    const where: any = { timestamp: { gte: since } };
    if (organizationId) where.organizationId = organizationId;

    const [
      totalErrors,
      criticalErrors,
      errorsBySeverity,
      errorsByDay
    ] = await Promise.all([
      prisma.errorLog.count({ where }),
      prisma.errorLog.count({ where: { ...where, severity: 'critical' } }),
      prisma.errorLog.groupBy({
        by: ['severity'],
        where,
        _count: true
      }),
      prisma.errorLog.groupBy({
        by: ['timestamp'],
        where,
        _count: true,
        orderBy: { timestamp: 'asc' }
      })
    ]);

    res.json({
      totalErrors,
      criticalErrors,
      errorsBySeverity,
      errorsByDay: errorsByDay.map(item => ({
        date: item.timestamp.toISOString().split('T')[0],
        count: item._count
      }))
    });
  } catch (error) {
    console.error('Failed to fetch error stats:', error);
    res.status(500).json({ error: 'Failed to fetch error stats' });
  }
});

export default router;