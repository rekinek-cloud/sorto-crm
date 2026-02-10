import { Router } from 'express';
import { z } from 'zod';
import { Priority, ProjectStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { validateRequest } from '../shared/middleware/validation';
import { authenticateToken } from '../shared/middleware/auth';
import { syncProjects } from './vectorSearch';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  streamId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional()
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED']).optional(),
  completedAt: z.string().datetime().optional()
});

// GET /api/v1/projects - List projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      streamId, 
      assignedToId,
      page = '1',
      limit = '20',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (streamId) where.streamId = streamId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          stream: { select: { id: true, name: true, color: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          tasks: {
            select: { 
              id: true, 
              status: true,
              title: true 
            },
            where: { status: { not: 'CANCELED' } }
          },
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { endDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.project.count({ where })
    ]);

    // Add task statistics
    const projectsWithStats = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        ...project,
        stats: {
          totalTasks,
          completedTasks,
          progress: Math.round(progress)
        }
      };
    });

    res.json({
      projects: projectsWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/v1/projects/:id - Get single project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        stream: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tasks: {
          include: {
            context: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } }
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Add task statistics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const projectWithStats = {
      ...project,
      stats: {
        totalTasks,
        completedTasks,
        progress: Math.round(progress)
      }
    };

    res.json(projectWithStats);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/v1/projects - Create new project
router.post('/', authenticateToken, validateRequest({ body: createProjectSchema }), async (req, res) => {
  try {
    const projectData = req.body;

    // Verify stream belongs to organization if provided
    if (projectData.streamId) {
      const stream = await prisma.stream.findFirst({
        where: { id: projectData.streamId, organizationId: req.user.organizationId }
      });
      if (!stream) {
        return res.status(400).json({ error: 'Invalid stream' });
      }
    }

    const project = await prisma.project.create({
      data: {
        ...projectData,
        startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
        endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        stream: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(201).json(project);

      // Auto-index to RAG
      syncProjects(req.user.organizationId, project.id).catch(err =>
        console.error('RAG index failed for project:', err.message)
      );
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/v1/projects/:id - Update project
router.put('/:id', authenticateToken, validateRequest({ body: updateProjectSchema }), async (req, res) => {
  try {
    const projectId = req.params.id;
    const updates = req.body;

    // Check if project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, organizationId: req.user.organizationId }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If completing project, set completedAt automatically
    if (updates.status === 'COMPLETED' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updates,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
        completedAt: updates.completedAt ? new Date(updates.completedAt) : undefined
      },
      include: {
        stream: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(project);

      // Auto-index to RAG
      syncProjects(req.user.organizationId, project.id, true).catch(err =>
        console.error('RAG reindex failed for project:', err.message)
      );
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/v1/projects/:id - Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, organizationId: req.user.organizationId }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project has tasks
    const taskCount = await prisma.task.count({
      where: { projectId }
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete project with existing tasks. Please remove or reassign tasks first.' 
      });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;