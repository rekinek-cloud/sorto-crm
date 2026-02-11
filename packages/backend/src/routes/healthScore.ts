import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/health-score - List health scores for organization
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      riskLevel,
      entityType,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (riskLevel) where.riskLevel = riskLevel;
    if (entityType) where.entityType = entityType;

    const [scores, total] = await Promise.all([
      prisma.relationshipHealth.findMany({
        where,
        orderBy: [
          { riskLevel: 'desc' },
          { healthScore: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.relationshipHealth.count({ where })
    ]);

    res.json({
      scores,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching health scores:', error);
    res.status(500).json({ error: 'Failed to fetch health scores' });
  }
});

// GET /api/v1/health-score/alerts - List health alerts
router.get('/alerts', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      isRead,
      severity,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId,
      isDismissed: false
    };

    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      prisma.healthAlert.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.healthAlert.count({ where })
    ]);

    res.json({
      alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching health alerts:', error);
    res.status(500).json({ error: 'Failed to fetch health alerts' });
  }
});

// POST /api/v1/health-score/alerts/:id/action - Mark alert as actioned
router.post('/alerts/:id/action', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.healthAlert.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const { actionTaken } = req.body;

    const alert = await prisma.healthAlert.update({
      where: { id: req.params.id },
      data: {
        isActioned: true,
        isRead: true,
        actionTaken: actionTaken || null,
        actionedAt: new Date(),
        actionedById: req.user.id
      }
    });

    res.json(alert);
  } catch (error) {
    console.error('Error actioning alert:', error);
    res.status(500).json({ error: 'Failed to action alert' });
  }
});

// POST /api/v1/health-score/calculate/:entityType/:entityId - Recalculate health
router.post('/calculate/:entityType/:entityId', authenticateToken, async (req: any, res: any) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['COMPANY', 'CONTACT', 'DEAL'].includes(entityType)) {
      return res.status(400).json({ error: 'entityType must be COMPANY, CONTACT or DEAL' });
    }

    // Find or create the health record
    let healthRecord = await prisma.relationshipHealth.findFirst({
      where: {
        organizationId: req.user.organizationId,
        entityType: entityType as any,
        entityId
      }
    });

    // Calculate basic recency score from last activity
    let recencyScore = 50;
    let lastContactAt: Date | null = null;

    // Check for recent communications/activities
    try {
      if (entityType === 'COMPANY') {
        const lastNote = await prisma.note.findFirst({
          where: { organizationId: req.user.organizationId, companyId: entityId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });
        if (lastNote) {
          lastContactAt = lastNote.createdAt;
        }
      } else if (entityType === 'CONTACT') {
        const lastNote = await prisma.note.findFirst({
          where: { organizationId: req.user.organizationId, contactId: entityId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });
        if (lastNote) {
          lastContactAt = lastNote.createdAt;
        }
      } else if (entityType === 'DEAL') {
        const lastNote = await prisma.note.findFirst({
          where: { organizationId: req.user.organizationId, dealId: entityId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });
        if (lastNote) {
          lastContactAt = lastNote.createdAt;
        }
      }
    } catch (e) {
      // Ignore - just use defaults
    }

    // Calculate recency based on days since last contact
    if (lastContactAt) {
      const daysSinceContact = Math.floor((Date.now() - lastContactAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceContact <= 7) recencyScore = 100;
      else if (daysSinceContact <= 14) recencyScore = 80;
      else if (daysSinceContact <= 30) recencyScore = 60;
      else if (daysSinceContact <= 60) recencyScore = 40;
      else if (daysSinceContact <= 90) recencyScore = 20;
      else recencyScore = 10;
    }

    // Simple health score calculation
    const healthScore = Math.round(recencyScore * 0.4 + 50 * 0.6); // 40% recency, 60% base
    const riskLevel = healthScore >= 70 ? 'LOW' : healthScore >= 50 ? 'MEDIUM' : healthScore >= 30 ? 'HIGH' : 'CRITICAL';
    const trend = healthRecord
      ? (healthScore > healthRecord.healthScore ? 'RISING' : healthScore < healthRecord.healthScore ? 'DECLINING' : 'STABLE')
      : 'STABLE';
    const trendChange = healthRecord ? healthScore - healthRecord.healthScore : 0;

    if (healthRecord) {
      // Save history before update
      await prisma.healthHistory.create({
        data: {
          healthRecordId: healthRecord.id,
          healthScore: healthRecord.healthScore,
          recencyScore: healthRecord.recencyScore,
          frequencyScore: healthRecord.frequencyScore,
          responseScore: healthRecord.responseScore,
          sentimentScore: healthRecord.sentimentScore,
          engagementScore: healthRecord.engagementScore,
        }
      });

      // Update existing record
      healthRecord = await prisma.relationshipHealth.update({
        where: { id: healthRecord.id },
        data: {
          healthScore,
          recencyScore,
          riskLevel: riskLevel as any,
          trend: trend as any,
          trendChange,
          lastContactAt,
          lastContactById: req.user.id,
          calculatedAt: new Date(),
          nextCheckAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // next check in 7 days
        }
      });
    } else {
      // Create new record
      healthRecord = await prisma.relationshipHealth.create({
        data: {
          organizationId: req.user.organizationId,
          entityType: entityType as any,
          entityId,
          healthScore,
          recencyScore,
          riskLevel: riskLevel as any,
          trend: 'STABLE',
          trendChange: 0,
          lastContactAt,
          lastContactById: req.user.id,
          calculatedAt: new Date(),
          nextCheckAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    }

    res.json(healthRecord);
  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// GET /api/v1/health-score/:entityType/:entityId - Get health for specific entity
router.get('/:entityType/:entityId', authenticateToken, async (req: any, res: any) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['COMPANY', 'CONTACT', 'DEAL'].includes(entityType)) {
      return res.status(400).json({ error: 'entityType must be COMPANY, CONTACT or DEAL' });
    }

    const healthRecord = await prisma.relationshipHealth.findFirst({
      where: {
        organizationId: req.user.organizationId,
        entityType: entityType as any,
        entityId
      },
      include: {
        history: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!healthRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    res.json(healthRecord);
  } catch (error) {
    console.error('Error fetching health score:', error);
    res.status(500).json({ error: 'Failed to fetch health score' });
  }
});

export default router;
