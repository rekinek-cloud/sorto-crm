import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/entity-links — List links for a given entity
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { entityType, entityId, linkType, page = '1', limit = '50' } = req.query;
    const organizationId = req.user.organizationId;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'entityType and entityId are required' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId,
      OR: [
        { fromEntityType: entityType, fromEntityId: entityId },
        { toEntityType: entityType, toEntityId: entityId, isBidirectional: true }
      ]
    };

    if (linkType) {
      where.linkType = linkType;
    }

    const [links, total] = await Promise.all([
      prisma.entityLink.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.entityLink.count({ where })
    ]);

    return res.json({
      links,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching entity links:', error);
    return res.status(500).json({ error: 'Failed to fetch entity links' });
  }
});

// GET /api/v1/entity-links/network/:entityType/:entityId — Deep network graph
router.get('/network/:entityType/:entityId', authenticateToken, async (req: any, res: any) => {
  try {
    const { entityType, entityId } = req.params;
    const { depth = '2' } = req.query;
    const organizationId = req.user.organizationId;
    const maxDepth = Math.min(parseInt(depth as string), 3);

    const visited = new Set<string>();
    const nodes: Array<{ entityType: string; entityId: string; depth: number }> = [];
    const edges: Array<{ id: string; fromEntityType: string; fromEntityId: string; toEntityType: string; toEntityId: string; linkType: string; strength: number }> = [];

    const queue: Array<{ type: string; id: string; currentDepth: number }> = [
      { type: entityType, id: entityId, currentDepth: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.type}:${current.id}`;

      if (visited.has(key) || current.currentDepth > maxDepth) continue;
      visited.add(key);
      nodes.push({ entityType: current.type, entityId: current.id, depth: current.currentDepth });

      if (current.currentDepth < maxDepth) {
        const links = await prisma.entityLink.findMany({
          where: {
            organizationId,
            OR: [
              { fromEntityType: current.type as any, fromEntityId: current.id },
              { toEntityType: current.type as any, toEntityId: current.id, isBidirectional: true }
            ]
          }
        });

        for (const link of links) {
          const edgeExists = edges.some(e => e.id === link.id);
          if (!edgeExists) {
            edges.push({
              id: link.id,
              fromEntityType: link.fromEntityType,
              fromEntityId: link.fromEntityId,
              toEntityType: link.toEntityType,
              toEntityId: link.toEntityId,
              linkType: link.linkType,
              strength: link.strength
            });
          }

          // Determine the "other" entity
          const isFrom = link.fromEntityType === current.type && link.fromEntityId === current.id;
          const otherType = isFrom ? link.toEntityType : link.fromEntityType;
          const otherId = isFrom ? link.toEntityId : link.fromEntityId;
          const otherKey = `${otherType}:${otherId}`;

          if (!visited.has(otherKey)) {
            queue.push({ type: otherType, id: otherId, currentDepth: current.currentDepth + 1 });
          }
        }
      }
    }

    return res.json({ nodes, edges, rootEntity: { entityType, entityId } });
  } catch (error) {
    console.error('Error fetching entity network:', error);
    return res.status(500).json({ error: 'Failed to fetch entity network' });
  }
});

// POST /api/v1/entity-links — Create a new entity link
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const { fromEntityType, fromEntityId, toEntityType, toEntityId, linkType, strength, isBidirectional, notes, metadata } = req.body;

    if (!fromEntityType || !fromEntityId || !toEntityType || !toEntityId) {
      return res.status(400).json({ error: 'fromEntityType, fromEntityId, toEntityType, toEntityId are required' });
    }

    const link = await prisma.entityLink.create({
      data: {
        organizationId,
        fromEntityType,
        fromEntityId,
        toEntityType,
        toEntityId,
        linkType: linkType || 'RELATED',
        strength: strength ?? 3,
        isBidirectional: isBidirectional ?? true,
        notes,
        metadata,
        createdById: userId
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return res.status(201).json(link);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This entity link already exists' });
    }
    console.error('Error creating entity link:', error);
    return res.status(500).json({ error: 'Failed to create entity link' });
  }
});

// PATCH /api/v1/entity-links/:id — Update strength, notes, metadata
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { strength, notes, metadata, linkType } = req.body;

    const existing = await prisma.entityLink.findFirst({
      where: { id, organizationId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Entity link not found' });
    }

    const updateData: any = {};
    if (strength !== undefined) updateData.strength = strength;
    if (notes !== undefined) updateData.notes = notes;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (linkType !== undefined) updateData.linkType = linkType;

    const updated = await prisma.entityLink.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating entity link:', error);
    return res.status(500).json({ error: 'Failed to update entity link' });
  }
});

// DELETE /api/v1/entity-links/:id — Remove a link
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const existing = await prisma.entityLink.findFirst({
      where: { id, organizationId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Entity link not found' });
    }

    await prisma.entityLink.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting entity link:', error);
    return res.status(500).json({ error: 'Failed to delete entity link' });
  }
});

export default router;
