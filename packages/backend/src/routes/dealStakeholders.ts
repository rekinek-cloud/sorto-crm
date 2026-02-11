import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/deal-stakeholders/deal/:dealId - List stakeholders for deal
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

    const stakeholders = await prisma.dealStakeholder.findMany({
      where: { dealId },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            position: true
          }
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { influence: 'desc' },
        { role: 'asc' }
      ]
    });

    // Build summary
    const champions = stakeholders.filter(s => s.isChampion);
    const blockers = stakeholders.filter(s => s.role === 'BLOCKER');
    const avgInfluence = stakeholders.length > 0
      ? Math.round(stakeholders.reduce((sum, s) => sum + s.influence, 0) / stakeholders.length)
      : 0;

    res.json({
      stakeholders,
      summary: {
        total: stakeholders.length,
        champions: champions.length,
        blockers: blockers.length,
        averageInfluence: avgInfluence,
        approved: stakeholders.filter(s => s.hasApproved).length,
        pendingApproval: stakeholders.filter(s => !s.hasApproved).length
      }
    });
  } catch (error) {
    console.error('Error fetching deal stakeholders:', error);
    res.status(500).json({ error: 'Failed to fetch deal stakeholders' });
  }
});

// GET /api/v1/deal-stakeholders/:id - Get single stakeholder
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const stakeholder = await prisma.dealStakeholder.findFirst({
      where: { id: req.params.id },
      include: {
        deal: {
          select: { id: true, name: true, organizationId: true }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            position: true
          }
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!stakeholder || stakeholder.deal.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }

    res.json(stakeholder);
  } catch (error) {
    console.error('Error fetching stakeholder:', error);
    res.status(500).json({ error: 'Failed to fetch stakeholder' });
  }
});

// POST /api/v1/deal-stakeholders - Create stakeholder
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      dealId,
      contactId,
      role,
      isChampion,
      influence,
      sentiment,
      objections,
      motivations,
      winStrategy
    } = req.body;

    if (!dealId || !contactId || !role) {
      return res.status(400).json({ error: 'dealId, contactId and role are required' });
    }

    // Verify deal belongs to organization
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId: req.user.organizationId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const stakeholder = await prisma.dealStakeholder.create({
      data: {
        dealId,
        contactId,
        role,
        isChampion: isChampion || false,
        influence: influence ?? 50,
        sentiment: sentiment || 'UNKNOWN',
        objections,
        motivations,
        winStrategy,
        createdById: req.user.id
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true
          }
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.status(201).json(stakeholder);
  } catch (error) {
    console.error('Error creating stakeholder:', error);
    res.status(500).json({ error: 'Failed to create stakeholder' });
  }
});

// PATCH /api/v1/deal-stakeholders/:id - Update stakeholder
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const stakeholder = await prisma.dealStakeholder.findFirst({
      where: { id: req.params.id },
      include: {
        deal: { select: { organizationId: true } }
      }
    });

    if (!stakeholder || stakeholder.deal.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }

    const updates = { ...req.body };

    // Handle approval timestamp
    if (updates.hasApproved === true && !stakeholder.hasApproved) {
      updates.approvedAt = new Date();
    }

    // Handle interaction timestamp
    if (updates.lastInteractionNote) {
      updates.lastInteractionAt = new Date();
    }

    // Remove fields that should not be directly updated
    delete updates.dealId;
    delete updates.contactId;
    delete updates.createdById;

    const updated = await prisma.dealStakeholder.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true
          }
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating stakeholder:', error);
    res.status(500).json({ error: 'Failed to update stakeholder' });
  }
});

// DELETE /api/v1/deal-stakeholders/:id - Delete stakeholder
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const stakeholder = await prisma.dealStakeholder.findFirst({
      where: { id: req.params.id },
      include: {
        deal: { select: { organizationId: true } }
      }
    });

    if (!stakeholder || stakeholder.deal.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }

    await prisma.dealStakeholder.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting stakeholder:', error);
    res.status(500).json({ error: 'Failed to delete stakeholder' });
  }
});

export default router;
