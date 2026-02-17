import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/contact-relations - List relations
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { contactId, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (contactId) {
      where.OR = [
        { fromContactId: contactId },
        { toContactId: contactId }
      ];
    }

    const [relations, total] = await Promise.all([
      prisma.contactRelation.findMany({
        where,
        include: {
          fromContact: { select: { id: true, firstName: true, lastName: true, email: true } },
          toContact: { select: { id: true, firstName: true, lastName: true, email: true } },
          event: { select: { id: true, name: true } },
          meeting: { select: { id: true, title: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.contactRelation.count({ where })
    ]);

    return res.json({
      relations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching contact relations:', error);
    return res.status(500).json({ error: 'Failed to fetch contact relations' });
  }
});

// GET /api/v1/contact-relations/network/:contactId - Get full network for a contact
router.get('/network/:contactId', authenticateToken, async (req: any, res: any) => {
  try {
    const { contactId } = req.params;

    const relations = await prisma.contactRelation.findMany({
      where: {
        organizationId: req.user.organizationId,
        OR: [
          { fromContactId: contactId },
          { toContactId: contactId }
        ]
      },
      include: {
        fromContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        toContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        event: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { strength: 'desc' }
    });

    // Build unique contacts in the network
    const contactMap = new Map<string, any>();
    for (const rel of relations) {
      if (rel.fromContactId !== contactId) {
        contactMap.set(rel.fromContactId, rel.fromContact);
      }
      if (rel.toContactId !== contactId) {
        contactMap.set(rel.toContactId, rel.toContact);
      }
    }

    return res.json({
      contactId,
      relations,
      connectedContacts: Array.from(contactMap.values()),
      totalConnections: contactMap.size
    });
  } catch (error) {
    console.error('Error fetching contact network:', error);
    return res.status(500).json({ error: 'Failed to fetch contact network' });
  }
});

// GET /api/v1/contact-relations/:id - Get single relation
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const relation = await prisma.contactRelation.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        fromContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        toContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        event: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!relation) {
      return res.status(404).json({ error: 'Contact relation not found' });
    }

    return res.json(relation);
  } catch (error) {
    console.error('Error fetching contact relation:', error);
    return res.status(500).json({ error: 'Failed to fetch contact relation' });
  }
});

// POST /api/v1/contact-relations - Create relation
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      fromContactId,
      toContactId,
      relationType,
      strength,
      isBidirectional,
      notes,
      discoveredVia,
      eventId,
      meetingId
    } = req.body;

    if (!fromContactId || !toContactId || !relationType) {
      return res.status(400).json({ error: 'fromContactId, toContactId and relationType are required' });
    }

    if (fromContactId === toContactId) {
      return res.status(400).json({ error: 'Cannot create a relation between the same contact' });
    }

    const relation = await prisma.contactRelation.create({
      data: {
        fromContactId,
        toContactId,
        relationType,
        strength: strength ?? 3,
        isBidirectional: isBidirectional ?? true,
        notes,
        discoveredVia,
        eventId,
        meetingId,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        fromContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        toContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.status(201).json(relation);
  } catch (error) {
    console.error('Error creating contact relation:', error);
    return res.status(500).json({ error: 'Failed to create contact relation' });
  }
});

// PATCH /api/v1/contact-relations/:id - Update relation
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.contactRelation.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact relation not found' });
    }

    const { strength, notes, isBidirectional, discoveredVia } = req.body;

    const updated = await prisma.contactRelation.update({
      where: { id: req.params.id },
      data: {
        ...(strength !== undefined && { strength }),
        ...(notes !== undefined && { notes }),
        ...(isBidirectional !== undefined && { isBidirectional }),
        ...(discoveredVia !== undefined && { discoveredVia }),
      },
      include: {
        fromContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        toContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating contact relation:', error);
    return res.status(500).json({ error: 'Failed to update contact relation' });
  }
});

// DELETE /api/v1/contact-relations/:id - Delete relation
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.contactRelation.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact relation not found' });
    }

    await prisma.contactRelation.delete({
      where: { id: req.params.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting contact relation:', error);
    return res.status(500).json({ error: 'Failed to delete contact relation' });
  }
});

export default router;
