import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { SmartAnalysisService } from '../services/smartAnalysis';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// POST /api/v1/smart/analyze/task/:id - Analyze a task for SMART criteria
router.post('/analyze/task/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get task with organization check
    const task = await prisma.task.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Perform SMART analysis
    const analysis = SmartAnalysisService.analyzeTask(task);
    
    // Update task with analysis results
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        smartScore: analysis.overallScore,
        smartAnalysis: analysis,
        updatedAt: new Date()
      },
      include: {
        context: true,
        project: { select: { id: true, name: true } },
        stream: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });

    res.json({
      task: updatedTask,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing task:', error);
    res.status(500).json({ error: 'Failed to analyze task' });
  }
});

// POST /api/v1/smart/analyze/project/:id - Analyze a project for SMART criteria
router.post('/analyze/project/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get project with organization check
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Perform SMART analysis
    const analysis = SmartAnalysisService.analyzeProject(project);
    
    // Update project with analysis results
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        smartScore: analysis.overallScore,
        smartAnalysis: analysis,
        updatedAt: new Date()
      },
      include: {
        stream: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            smartScore: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    res.json({
      project: updatedProject,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing project:', error);
    res.status(500).json({ error: 'Failed to analyze project' });
  }
});

// GET /api/v1/smart/reports/tasks - Get SMART analysis report for tasks
router.get('/reports/tasks', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      scoreRange,
      sortBy = 'smartScore',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId,
      smartScore: { not: null }
    };

    // Filter by score range
    if (scoreRange) {
      const [min, max] = (scoreRange as string).split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        where.smartScore = { gte: min, lte: max };
      }
    }

    // Get tasks with SMART scores
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          context: true,
          project: { select: { id: true, name: true } },
          stream: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } }
        }
      }),
      prisma.task.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.task.aggregate({
      where: { organizationId: req.user.organizationId, smartScore: { not: null } },
      _avg: { smartScore: true },
      _min: { smartScore: true },
      _max: { smartScore: true },
      _count: { smartScore: true }
    });

    // Score distribution
    const scoreDistribution = await prisma.task.groupBy({
      where: { organizationId: req.user.organizationId, smartScore: { not: null } },
      by: ['smartScore'],
      _count: { smartScore: true },
      orderBy: { smartScore: 'asc' }
    });

    // Convert to distribution buckets
    const distribution = {
      excellent: scoreDistribution.filter(d => d.smartScore && d.smartScore >= 80).reduce((sum, d) => sum + d._count.smartScore, 0),
      good: scoreDistribution.filter(d => d.smartScore && d.smartScore >= 60 && d.smartScore < 80).reduce((sum, d) => sum + d._count.smartScore, 0),
      fair: scoreDistribution.filter(d => d.smartScore && d.smartScore >= 40 && d.smartScore < 60).reduce((sum, d) => sum + d._count.smartScore, 0),
      poor: scoreDistribution.filter(d => d.smartScore && d.smartScore < 40).reduce((sum, d) => sum + d._count.smartScore, 0)
    };

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      statistics: {
        averageScore: Math.round(stats._avg.smartScore || 0),
        minScore: stats._min.smartScore || 0,
        maxScore: stats._max.smartScore || 0,
        totalAnalyzed: stats._count.smartScore || 0,
        distribution
      }
    });
  } catch (error) {
    console.error('Error getting task SMART reports:', error);
    res.status(500).json({ error: 'Failed to get task reports' });
  }
});

// GET /api/v1/smart/reports/projects - Get SMART analysis report for projects
router.get('/reports/projects', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      scoreRange,
      sortBy = 'smartScore',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId,
      smartScore: { not: null }
    };

    // Filter by score range
    if (scoreRange) {
      const [min, max] = (scoreRange as string).split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        where.smartScore = { gte: min, lte: max };
      }
    }

    // Get projects with SMART scores
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          stream: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { tasks: true } }
        }
      }),
      prisma.project.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.project.aggregate({
      where: { organizationId: req.user.organizationId, smartScore: { not: null } },
      _avg: { smartScore: true },
      _min: { smartScore: true },
      _max: { smartScore: true },
      _count: { smartScore: true }
    });

    // Score distribution
    const scoreDistribution = await prisma.project.groupBy({
      where: { organizationId: req.user.organizationId, smartScore: { not: null } },
      by: ['smartScore'],
      _count: { smartScore: true },
      orderBy: { smartScore: 'asc' }
    });

    // Convert to distribution buckets
    const distribution = {
      excellent: scoreDistribution.filter(d => d.smartScore && d.smartScore >= 80).reduce((sum, d) => sum + d._count.smartScore, 0),
      good: scoreDistribution.filter(d => d.smartScore && d.smartScore >= 60 && d.smartScore < 80).reduce((sum, d) => sum + d._count.smartScore, 0),
      fair: scoreDistribution.filter(d => d.smartScore && d.smartScore >= 40 && d.smartScore < 60).reduce((sum, d) => sum + d._count.smartScore, 0),
      poor: scoreDistribution.filter(d => d.smartScore && d.smartScore < 40).reduce((sum, d) => sum + d._count.smartScore, 0)
    };

    res.json({
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      statistics: {
        averageScore: Math.round(stats._avg.smartScore || 0),
        minScore: stats._min.smartScore || 0,
        maxScore: stats._max.smartScore || 0,
        totalAnalyzed: stats._count.smartScore || 0,
        distribution
      }
    });
  } catch (error) {
    console.error('Error getting project SMART reports:', error);
    res.status(500).json({ error: 'Failed to get project reports' });
  }
});

// POST /api/v1/smart/bulk-analyze/tasks - Bulk analyze tasks
router.post('/bulk-analyze/tasks', async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of task IDs' });
    }

    if (taskIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 tasks can be analyzed at once' });
    }

    // Get tasks belonging to user's organization
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        organizationId: req.user.organizationId
      }
    });

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'No valid tasks found' });
    }

    // Analyze each task and update
    const results = [];
    for (const task of tasks) {
      const analysis = SmartAnalysisService.analyzeTask(task);
      
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: {
          smartScore: analysis.overallScore,
          smartAnalysis: analysis,
          updatedAt: new Date()
        }
      });

      results.push({
        taskId: task.id,
        taskTitle: task.title,
        analysis: analysis
      });
    }

    res.json({
      message: `Successfully analyzed ${results.length} tasks`,
      results
    });
  } catch (error) {
    console.error('Error bulk analyzing tasks:', error);
    res.status(500).json({ error: 'Failed to analyze tasks' });
  }
});

// POST /api/v1/smart/bulk-analyze/projects - Bulk analyze projects
router.post('/bulk-analyze/projects', async (req, res) => {
  try {
    const { projectIds } = req.body;
    
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of project IDs' });
    }

    if (projectIds.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 projects can be analyzed at once' });
    }

    // Get projects belonging to user's organization
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        organizationId: req.user.organizationId
      }
    });

    if (projects.length === 0) {
      return res.status(404).json({ error: 'No valid projects found' });
    }

    // Analyze each project and update
    const results = [];
    for (const project of projects) {
      const analysis = SmartAnalysisService.analyzeProject(project);
      
      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: {
          smartScore: analysis.overallScore,
          smartAnalysis: analysis,
          updatedAt: new Date()
        }
      });

      results.push({
        projectId: project.id,
        projectName: project.name,
        analysis: analysis
      });
    }

    res.json({
      message: `Successfully analyzed ${results.length} projects`,
      results
    });
  } catch (error) {
    console.error('Error bulk analyzing projects:', error);
    res.status(500).json({ error: 'Failed to analyze projects' });
  }
});

export default router;