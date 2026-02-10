import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/v1/email-analysis/stats - Get email analysis statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { timeRange = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let dateFrom = new Date();
    if (timeRange === '24h') dateFrom.setHours(dateFrom.getHours() - 24);
    else if (timeRange === '7d') dateFrom.setDate(dateFrom.getDate() - 7);
    else if (timeRange === '30d') dateFrom.setDate(dateFrom.getDate() - 30);

    const analyses = await prisma.emailAnalysis.findMany({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: dateFrom }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Build stats from real data
    const stats = {
      summary: {
        totalMessages: analyses.length,
        positiveMessages: 0,
        negativeMessages: 0,
        urgentMessages: 0,
        tasksCreated: 0,
        avgUrgencyScore: 0
      },
      sentiment: { positive: 0, negative: 0, neutral: 0 },
      categories: [] as Array<{ name: string; count: number; percentage: number }>,
      trends: { urgencyTrend: 'stable', sentimentTrend: 'stable', volumeTrend: 'stable' }
    };

    const categoryCounts: Record<string, number> = {};
    let totalUrgency = 0;

    for (const a of analyses) {
      // Parse fullAnalysis JSON if available
      let parsed: any = {};
      try { parsed = a.fullAnalysis ? JSON.parse(a.fullAnalysis) : {}; } catch {}

      const sentiment = parsed?.sentiment?.label || 'NEUTRAL';
      if (sentiment === 'POSITIVE') { stats.sentiment.positive++; stats.summary.positiveMessages++; }
      else if (sentiment === 'NEGATIVE') { stats.sentiment.negative++; stats.summary.negativeMessages++; }
      else { stats.sentiment.neutral++; }

      const urgency = parsed?.urgencyScore || 0;
      totalUrgency += urgency;
      if (urgency >= 70) stats.summary.urgentMessages++;

      if (parsed?.tasks?.hasTasks) stats.summary.tasksCreated += (parsed.tasks.extractedTasks?.length || 0);

      for (const cat of (a.categories || [])) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }

    stats.summary.avgUrgencyScore = analyses.length > 0 ? Math.round(totalUrgency / analyses.length) : 0;
    stats.categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: analyses.length > 0 ? Math.round((count / analyses.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Email analysis stats error:', error);
    return res.status(500).json({ error: 'Failed to load email analysis stats' });
  }
});

// GET /api/v1/email-analysis/recent - Get recent email analyses
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = '20', sentiment, category } = req.query;

    const analyses = await prisma.emailAnalysis.findMany({
      where: {
        organizationId: user.organizationId,
        ...(category ? { categories: { has: category as string } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string) || 20, 100)
    });

    // Filter by sentiment if requested (need to check fullAnalysis JSON)
    let results = analyses.map(a => {
      let parsed: any = {};
      try { parsed = a.fullAnalysis ? JSON.parse(a.fullAnalysis) : {}; } catch {}

      return {
        messageId: a.id,
        emailFrom: a.emailFrom,
        emailSubject: a.emailSubject,
        createdAt: a.createdAt,
        categories: a.categories,
        confidenceScore: a.confidenceScore,
        summary: a.summary || parsed?.summary || '',
        analysis: {
          sentiment: parsed?.sentiment || { label: 'NEUTRAL', score: 0, confidence: 0 },
          tasks: parsed?.tasks || { hasTasks: false, extractedTasks: [] },
          category: parsed?.category || { category: a.categories?.[0] || 'UNKNOWN', confidence: a.confidenceScore, businessValue: 'MEDIUM' },
          urgencyScore: parsed?.urgencyScore || 0,
          summary: a.summary || parsed?.summary || 'Brak podsumowania',
          recommendedActions: parsed?.recommendedActions || []
        }
      };
    });

    if (sentiment) {
      results = results.filter(r => r.analysis.sentiment.label === sentiment);
    }

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Email analysis recent error:', error);
    return res.status(500).json({ error: 'Failed to load recent email analyses' });
  }
});

export default router;
