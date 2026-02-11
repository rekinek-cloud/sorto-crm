import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/deal-competitors/deal/:dealId - List competitors for deal
router.get('/deal/:dealId', authenticateToken, async (req: any, res: any) => {
  try {
    const { dealId } = req.params;

    // Verify deal belongs to organization
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId: req.user.organizationId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const competitors = await prisma.dealCompetitor.findMany({
      where: { dealId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { threatLevel: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(competitors);
  } catch (error) {
    console.error('Error fetching deal competitors:', error);
    res.status(500).json({ error: 'Failed to fetch deal competitors' });
  }
});

// GET /api/v1/deal-competitors/lost-analysis/:dealId - Get lost analysis
router.get('/lost-analysis/:dealId', authenticateToken, async (req: any, res: any) => {
  try {
    const { dealId } = req.params;

    // Verify deal belongs to organization
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId: req.user.organizationId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const analysis = await prisma.dealLostAnalysis.findUnique({
      where: { dealId },
      include: {
        analyzedBy: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true, value: true } }
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Lost analysis not found for this deal' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching lost analysis:', error);
    res.status(500).json({ error: 'Failed to fetch lost analysis' });
  }
});

// GET /api/v1/deal-competitors/:id - Get single competitor
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const competitor = await prisma.dealCompetitor.findFirst({
      where: { id: req.params.id },
      include: {
        deal: {
          select: { id: true, name: true, organizationId: true }
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!competitor || competitor.deal.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json(competitor);
  } catch (error) {
    console.error('Error fetching competitor:', error);
    res.status(500).json({ error: 'Failed to fetch competitor' });
  }
});

// POST /api/v1/deal-competitors - Create competitor
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      dealId,
      competitorName,
      competitorWebsite,
      estimatedPrice,
      priceSource,
      currency,
      threatLevel,
      theirStrengths,
      theirWeaknesses,
      ourAdvantages,
      intelNotes,
      intelSource,
      intelDate
    } = req.body;

    if (!dealId || !competitorName || !threatLevel) {
      return res.status(400).json({ error: 'dealId, competitorName and threatLevel are required' });
    }

    // Verify deal belongs to organization
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId: req.user.organizationId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const competitor = await prisma.dealCompetitor.create({
      data: {
        dealId,
        competitorName,
        competitorWebsite,
        estimatedPrice,
        priceSource,
        currency: currency || 'EUR',
        threatLevel,
        theirStrengths,
        theirWeaknesses,
        ourAdvantages,
        intelNotes,
        intelSource,
        intelDate: intelDate ? new Date(intelDate) : undefined,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.status(201).json(competitor);
  } catch (error) {
    console.error('Error creating competitor:', error);
    res.status(500).json({ error: 'Failed to create competitor' });
  }
});

// PATCH /api/v1/deal-competitors/:id - Update competitor
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const competitor = await prisma.dealCompetitor.findFirst({
      where: { id: req.params.id },
      include: {
        deal: { select: { organizationId: true } }
      }
    });

    if (!competitor || competitor.deal.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    const updates = { ...req.body };
    if (updates.intelDate) updates.intelDate = new Date(updates.intelDate);

    // Remove fields that should not be directly updated
    delete updates.dealId;
    delete updates.createdById;

    const updated = await prisma.dealCompetitor.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating competitor:', error);
    res.status(500).json({ error: 'Failed to update competitor' });
  }
});

// DELETE /api/v1/deal-competitors/:id - Delete competitor
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const competitor = await prisma.dealCompetitor.findFirst({
      where: { id: req.params.id },
      include: {
        deal: { select: { organizationId: true } }
      }
    });

    if (!competitor || competitor.deal.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    await prisma.dealCompetitor.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({ error: 'Failed to delete competitor' });
  }
});

// POST /api/v1/deal-competitors/lost-analysis - Create lost analysis
router.post('/lost-analysis', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      dealId,
      winnerName,
      winnerPrice,
      lostReasons,
      lessonsLearned,
      improvementAreas,
      followUpDate,
      followUpNotes
    } = req.body;

    if (!dealId || !winnerName) {
      return res.status(400).json({ error: 'dealId and winnerName are required' });
    }

    // Verify deal belongs to organization
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId: req.user.organizationId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Check if analysis already exists
    const existing = await prisma.dealLostAnalysis.findUnique({
      where: { dealId }
    });

    if (existing) {
      return res.status(409).json({ error: 'Lost analysis already exists for this deal' });
    }

    const analysis = await prisma.dealLostAnalysis.create({
      data: {
        dealId,
        winnerName,
        winnerPrice,
        lostReasons: lostReasons || [],
        lessonsLearned,
        improvementAreas,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        followUpNotes,
        analyzedById: req.user.id
      },
      include: {
        analyzedBy: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true, value: true } }
      }
    });

    res.status(201).json(analysis);
  } catch (error) {
    console.error('Error creating lost analysis:', error);
    res.status(500).json({ error: 'Failed to create lost analysis' });
  }
});

export default router;
