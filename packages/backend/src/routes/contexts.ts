import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { validateRequest } from '../shared/middleware/validation';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// Validation schemas
const createContextSchema = z.object({
  name: z.string().min(1).max(50).regex(/^@[a-zA-Z0-9_-]+$/, 'Context name must start with @ and contain only letters, numbers, _ or -'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').default('#6B7280'),
  icon: z.string().optional()
});

const updateContextSchema = createContextSchema.partial().extend({
  isActive: z.boolean().optional()
});

// GET /api/v1/contexts - List contexts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.query;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const contexts = await prisma.context.findMany({
      where,
      include: {
        _count: {
          select: { 
            tasks: {
              where: { status: { not: 'COMPLETED' } }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(contexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    res.status(500).json({ error: 'Failed to fetch contexts' });
  }
});

// GET /api/v1/contexts/:id - Get single context
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const context = await prisma.context.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        tasks: {
          include: {
            project: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } }
          },
          where: { status: { not: 'COMPLETED' } },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    res.json(context);
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

// POST /api/v1/contexts - Create new context
router.post('/', authenticateToken, validateRequest({ body: createContextSchema }), async (req, res) => {
  try {
    const contextData = req.body;

    // Check if context name already exists in organization
    const existingContext = await prisma.context.findFirst({
      where: {
        name: contextData.name,
        organizationId: req.user.organizationId
      }
    });

    if (existingContext) {
      return res.status(400).json({ error: 'Context with this name already exists' });
    }

    const context = await prisma.context.create({
      data: {
        ...contextData,
        organizationId: req.user.organizationId
      }
    });

    res.status(201).json(context);
  } catch (error) {
    console.error('Error creating context:', error);
    res.status(500).json({ error: 'Failed to create context' });
  }
});

// PUT /api/v1/contexts/:id - Update context
router.put('/:id', authenticateToken, validateRequest({ body: updateContextSchema }), async (req, res) => {
  try {
    const contextId = req.params.id;
    const updates = req.body;

    // Check if context exists and belongs to organization
    const existingContext = await prisma.context.findFirst({
      where: { id: contextId, organizationId: req.user.organizationId }
    });

    if (!existingContext) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Check if new name conflicts with existing context
    if (updates.name && updates.name !== existingContext.name) {
      const nameConflict = await prisma.context.findFirst({
        where: {
          name: updates.name,
          organizationId: req.user.organizationId,
          id: { not: contextId }
        }
      });

      if (nameConflict) {
        return res.status(400).json({ error: 'Context with this name already exists' });
      }
    }

    const context = await prisma.context.update({
      where: { id: contextId },
      data: updates
    });

    res.json(context);
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ error: 'Failed to update context' });
  }
});

// DELETE /api/v1/contexts/:id - Delete context
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contextId = req.params.id;

    const existingContext = await prisma.context.findFirst({
      where: { id: contextId, organizationId: req.user.organizationId }
    });

    if (!existingContext) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Check if context has tasks
    const taskCount = await prisma.task.count({
      where: { contextId }
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete context with existing tasks. Please remove or reassign tasks first.' 
      });
    }

    await prisma.context.delete({
      where: { id: contextId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting context:', error);
    res.status(500).json({ error: 'Failed to delete context' });
  }
});

// POST /api/v1/contexts/default - Create default stream contexts
router.post('/default', authenticateToken, async (req, res) => {
  try {
    const defaultContexts = [
      { name: '@computer', description: 'Tasks requiring a computer', color: '#3B82F6', icon: '💻' },
      { name: '@phone', description: 'Phone calls to make', color: '#10B981', icon: '📞' },
      { name: '@errands', description: 'Tasks to do while out', color: '#F59E0B', icon: '🏃' },
      { name: '@home', description: 'Tasks to do at home', color: '#8B5CF6', icon: '🏠' },
      { name: '@office', description: 'Tasks to do at the office', color: '#EF4444', icon: '🏢' },
      { name: '@agenda', description: 'Items for meetings/discussions', color: '#6B7280', icon: '📋' },
      { name: '@waiting', description: 'Waiting for someone else', color: '#F97316', icon: '⏳' },
      { name: '@someday', description: 'Someday/maybe items', color: '#84CC16', icon: '🌅' }
    ];

    const createdContexts = [];

    for (const contextData of defaultContexts) {
      const existing = await prisma.context.findFirst({
        where: {
          name: contextData.name,
          organizationId: req.user.organizationId
        }
      });

      if (!existing) {
        const context = await prisma.context.create({
          data: {
            ...contextData,
            organizationId: req.user.organizationId
          }
        });
        createdContexts.push(context);
      }
    }

    res.json({
      message: `Created ${createdContexts.length} default contexts`,
      contexts: createdContexts
    });
  } catch (error) {
    console.error('Error creating default contexts:', error);
    res.status(500).json({ error: 'Failed to create default contexts' });
  }
});

export default router;