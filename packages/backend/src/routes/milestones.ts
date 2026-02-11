import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/milestones - List milestones (projectId required)
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { projectId, status } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId as string, organizationId: req.user.organizationId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const where: any = {
      projectId: projectId as string
    };

    if (status) where.status = status;

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        responsible: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// GET /api/v1/milestones/:id - Get single milestone with tasks
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, organizationId: true }
        },
        responsible: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!milestone || milestone.project.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json(milestone);
  } catch (error) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ error: 'Failed to fetch milestone' });
  }
});

// POST /api/v1/milestones - Create milestone
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      projectId,
      name,
      description,
      dueDate,
      isCritical,
      dependsOnIds,
      responsibleId
    } = req.body;

    if (!projectId || !name || !dueDate) {
      return res.status(400).json({ error: 'projectId, name and dueDate are required' });
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: req.user.organizationId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name,
        description,
        dueDate: new Date(dueDate),
        isCritical: isCritical || false,
        dependsOnIds: dependsOnIds || [],
        responsibleId,
        createdById: req.user.id
      },
      include: {
        responsible: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// PATCH /api/v1/milestones/:id - Update milestone
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id },
      include: {
        project: { select: { organizationId: true } }
      }
    });

    if (!milestone || milestone.project.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const updates = { ...req.body };
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
    if (updates.completedAt) updates.completedAt = new Date(updates.completedAt);

    // Auto-set completedAt when status is COMPLETED
    if (updates.status === 'COMPLETED' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    // Remove fields that should not be directly updated
    delete updates.projectId;
    delete updates.createdById;

    const updated = await prisma.milestone.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        responsible: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: { tasks: true }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// DELETE /api/v1/milestones/:id - Delete milestone
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id },
      include: {
        project: { select: { organizationId: true } }
      }
    });

    if (!milestone || milestone.project.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    await prisma.milestone.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

export default router;
