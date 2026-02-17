import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

const createStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
  probability: z.number().min(0).max(100).default(0),
  color: z.string().default('#9CA3AF'),
  isClosed: z.boolean().default(false),
  isWon: z.boolean().default(false),
  position: z.number().int().min(0).optional()
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[łŁ]/g, 'l')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const updateStageSchema = createStageSchema.partial();

const reorderSchema = z.object({
  stages: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0)
  }))
});

router.use(authenticateUser);

// GET /api/v1/pipeline/stages - List stages for organization
router.get('/stages', async (req, res) => {
  try {
    const stages = await (prisma as any).pipelineStage.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { deals: true } }
      }
    });

    return res.json(stages);
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return res.status(500).json({ error: 'Failed to fetch pipeline stages' });
  }
});

// POST /api/v1/pipeline/stages - Create new stage
router.post('/stages', async (req, res) => {
  try {
    const data = createStageSchema.parse(req.body);

    // Auto-generate slug from name if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }

    // If no position specified, add at the end
    if (data.position === undefined) {
      const lastStage = await (prisma as any).pipelineStage.findFirst({
        where: { organizationId: req.user.organizationId },
        orderBy: { position: 'desc' }
      });
      data.position = (lastStage?.position ?? -1) + 1;
    }

    // Shift existing stages at or after this position
    await (prisma as any).pipelineStage.updateMany({
      where: {
        organizationId: req.user.organizationId,
        position: { gte: data.position }
      },
      data: { position: { increment: 1 } }
    });

    const stage = await (prisma as any).pipelineStage.create({
      data: {
        name: data.name,
        slug: data.slug,
        position: data.position!,
        probability: data.probability,
        color: data.color,
        isClosed: data.isClosed,
        isWon: data.isWon,
        organizationId: req.user.organizationId
      }
    });

    return res.status(201).json(stage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating pipeline stage:', error);
    return res.status(500).json({ error: 'Failed to create pipeline stage' });
  }
});

// PUT /api/v1/pipeline/stages/:id - Update stage
router.put('/stages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateStageSchema.parse(req.body);

    const existing = await (prisma as any).pipelineStage.findFirst({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pipeline stage not found' });
    }

    const stage = await (prisma as any).pipelineStage.update({
      where: { id },
      data
    });

    return res.json(stage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating pipeline stage:', error);
    return res.status(500).json({ error: 'Failed to update pipeline stage' });
  }
});

// DELETE /api/v1/pipeline/stages/:id - Delete stage (only if no deals)
router.delete('/stages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await (prisma as any).pipelineStage.findFirst({
      where: { id, organizationId: req.user.organizationId },
      include: { _count: { select: { deals: true } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pipeline stage not found' });
    }

    if (existing._count.deals > 0) {
      return res.status(400).json({
        error: 'Cannot delete stage with existing deals',
        dealsCount: existing._count.deals
      });
    }

    // Ensure at least one won and one lost stage remain
    const allStages = await (prisma as any).pipelineStage.findMany({
      where: { organizationId: req.user.organizationId }
    });

    if (existing.isWon) {
      const otherWonStages = allStages.filter((s: any) => s.isWon && s.id !== id);
      if (otherWonStages.length === 0) {
        return res.status(400).json({ error: 'Organization must have at least one "won" stage' });
      }
    }

    if (existing.isClosed && !existing.isWon) {
      const otherLostStages = allStages.filter((s: any) => s.isClosed && !s.isWon && s.id !== id);
      if (otherLostStages.length === 0) {
        return res.status(400).json({ error: 'Organization must have at least one "lost" stage' });
      }
    }

    await (prisma as any).pipelineStage.delete({ where: { id } });

    // Reorder remaining stages
    const remaining = await (prisma as any).pipelineStage.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { position: 'asc' }
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await (prisma as any).pipelineStage.update({
          where: { id: remaining[i].id },
          data: { position: i }
        });
      }
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting pipeline stage:', error);
    return res.status(500).json({ error: 'Failed to delete pipeline stage' });
  }
});

// PUT /api/v1/pipeline/stages/reorder - Reorder stages
router.put('/stages/reorder', async (req, res) => {
  try {
    const { stages } = reorderSchema.parse(req.body);

    // Verify all stages belong to organization
    const orgStages = await (prisma as any).pipelineStage.findMany({
      where: { organizationId: req.user.organizationId }
    });

    const orgStageIds = new Set(orgStages.map((s: any) => s.id));
    for (const stage of stages) {
      if (!orgStageIds.has(stage.id)) {
        return res.status(400).json({ error: `Stage ${stage.id} not found` });
      }
    }

    // Use a transaction to avoid unique constraint violations during reorder
    // First set all positions to negative (temp), then set final values
    await prisma.$transaction(async (tx) => {
      for (const stage of stages) {
        await (tx as any).pipelineStage.update({
          where: { id: stage.id },
          data: { position: -(stage.position + 1000) }
        });
      }
      for (const stage of stages) {
        await (tx as any).pipelineStage.update({
          where: { id: stage.id },
          data: { position: stage.position }
        });
      }
    });

    const updated = await (prisma as any).pipelineStage.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { position: 'asc' }
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error reordering pipeline stages:', error);
    return res.status(500).json({ error: 'Failed to reorder pipeline stages' });
  }
});

export default router;
