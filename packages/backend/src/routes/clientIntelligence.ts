import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/client-intelligence - List intelligence
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      entityType,
      entityId,
      category,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.clientIntelligence.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          sourceContact: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [
          { importance: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.clientIntelligence.count({ where })
    ]);

    return res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching client intelligence:', error);
    return res.status(500).json({ error: 'Failed to fetch client intelligence' });
  }
});

// GET /api/v1/client-intelligence/briefing/:entityType/:entityId - Get AI-style briefing
router.get('/briefing/:entityType/:entityId', authenticateToken, async (req: any, res: any) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['COMPANY', 'CONTACT'].includes(entityType)) {
      return res.status(400).json({ error: 'entityType must be COMPANY or CONTACT' });
    }

    const allIntel = await prisma.clientIntelligence.findMany({
      where: {
        organizationId: req.user.organizationId,
        entityType: entityType as any,
        entityId
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const item of allIntel) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push(item);
    }

    // Build briefing summary
    const importantItems = allIntel.filter(i => i.importance >= 4);
    const warnings = allIntel.filter(i => i.category === 'WARNING');
    const recentItems = allIntel.filter(i => {
      const daysSince = Math.floor((Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= 30;
    });

    return res.json({
      entityType,
      entityId,
      totalItems: allIntel.length,
      byCategory,
      highlights: {
        importantItems,
        warnings,
        recentItems
      },
      briefing: {
        likes: byCategory['LIKES'] || [],
        dislikes: byCategory['DISLIKES'] || [],
        preferences: byCategory['PREFERENCE'] || [],
        importantDates: byCategory['IMPORTANT_DATE'] || [],
        decisionProcess: byCategory['DECISION_PROCESS'] || [],
        communicationStyle: byCategory['COMMUNICATION'] || [],
        tips: byCategory['TIP'] || [],
        successes: byCategory['SUCCESS'] || []
      }
    });
  } catch (error) {
    console.error('Error fetching briefing:', error);
    return res.status(500).json({ error: 'Failed to fetch briefing' });
  }
});

// GET /api/v1/client-intelligence/:id - Get single item
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const item = await prisma.clientIntelligence.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Intelligence item not found' });
    }

    return res.json(item);
  } catch (error) {
    console.error('Error fetching intelligence item:', error);
    return res.status(500).json({ error: 'Failed to fetch intelligence item' });
  }
});

// POST /api/v1/client-intelligence - Create intelligence
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      entityType,
      entityId,
      category,
      content,
      importance,
      source,
      sourceDate,
      sourceContactId,
      isPrivate,
      eventDate,
      isRecurring
    } = req.body;

    if (!entityType || !entityId || !category || !content) {
      return res.status(400).json({ error: 'entityType, entityId, category and content are required' });
    }

    if (!['COMPANY', 'CONTACT'].includes(entityType)) {
      return res.status(400).json({ error: 'entityType must be COMPANY or CONTACT' });
    }

    const item = await prisma.clientIntelligence.create({
      data: {
        entityType,
        entityId,
        category,
        content,
        importance: importance ?? 2,
        source,
        sourceDate: sourceDate ? new Date(sourceDate) : undefined,
        sourceContactId,
        isPrivate: isPrivate || false,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        isRecurring: isRecurring || false,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('Error creating intelligence:', error);
    return res.status(500).json({ error: 'Failed to create intelligence' });
  }
});

// PATCH /api/v1/client-intelligence/:id - Update intelligence
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.clientIntelligence.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Intelligence item not found' });
    }

    const updates = { ...req.body };
    if (updates.sourceDate) updates.sourceDate = new Date(updates.sourceDate);
    if (updates.eventDate) updates.eventDate = new Date(updates.eventDate);

    // Remove fields that should not be directly updated
    delete updates.organizationId;
    delete updates.createdById;

    const item = await prisma.clientIntelligence.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.json(item);
  } catch (error) {
    console.error('Error updating intelligence:', error);
    return res.status(500).json({ error: 'Failed to update intelligence' });
  }
});

// DELETE /api/v1/client-intelligence/:id - Delete intelligence
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.clientIntelligence.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Intelligence item not found' });
    }

    await prisma.clientIntelligence.delete({
      where: { id: req.params.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting intelligence:', error);
    return res.status(500).json({ error: 'Failed to delete intelligence' });
  }
});

export default router;
