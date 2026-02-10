import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import { GoalRecommendationEngine } from '../services/ai/GoalRecommendationEngine';
import logger from '../config/logger';

const router = Router();
const goalEngine = new GoalRecommendationEngine(prisma);

// Apply authentication to all AI routes
router.use(authenticateToken);

// GET /api/v1/ai/goal-recommendations - Get AI-powered goal recommendations
router.get('/goal-recommendations', async (req, res) => {
  try {
    const userId = req.user!.userId;

    logger.info('Fetching AI goal recommendations', { userId });

    const recommendations = await goalEngine.generateRecommendations(userId);

    res.json({
      message: 'Goal recommendations generated successfully',
      data: recommendations,
      meta: {
        count: recommendations.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to generate goal recommendations', { 
      userId: req.user?.userId, 
      error: error instanceof Error ? error.message : error 
    });
    
    res.status(500).json({
      message: 'Failed to generate goal recommendations',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

// POST /api/v1/ai/analyze-productivity - Analyze user productivity patterns
router.post('/analyze-productivity', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { timeframe = '30d' } = req.body;

    logger.info('Analyzing user productivity', { userId, timeframe });

    // Calculate date range based on timeframe
    let startDate: Date;
    switch (timeframe) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get tasks within timeframe
    const tasks = await prisma.task.findMany({
      where: {
        createdById: userId,
        createdAt: { gte: startDate }
      },
      include: {
        context: true,
        project: true
      }
    });

    // Calculate productivity metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Analyze by context
    const contextAnalysis = tasks.reduce((acc, task) => {
      const contextName = task.context?.name || 'No Context';
      if (!acc[contextName]) {
        acc[contextName] = { total: 0, completed: 0 };
      }
      acc[contextName].total++;
      if (task.status === 'COMPLETED') {
        acc[contextName].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Analyze by priority
    const priorityAnalysis = tasks.reduce((acc, task) => {
      const priority = task.priority || 'MEDIUM';
      if (!acc[priority]) {
        acc[priority] = { total: 0, completed: 0 };
      }
      acc[priority].total++;
      if (task.status === 'COMPLETED') {
        acc[priority].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Calculate average completion time for completed tasks
    const completedTasksWithDates = tasks.filter(t => 
      t.status === 'COMPLETED' && t.completedAt && t.createdAt
    );
    
    const avgCompletionTime = completedTasksWithDates.length > 0
      ? completedTasksWithDates.reduce((sum, task) => {
          const duration = new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime();
          return sum + duration;
        }, 0) / completedTasksWithDates.length
      : 0;

    // Generate insights and recommendations
    const insights = [];
    const recommendations = [];

    if (completionRate < 70) {
      insights.push('Your task completion rate is below optimal levels');
      recommendations.push('Consider breaking large tasks into smaller, manageable pieces');
      recommendations.push('Review your task prioritization strategy');
    } else if (completionRate > 90) {
      insights.push('Excellent task completion rate! You\'re very productive');
      recommendations.push('Consider taking on more challenging or strategic tasks');
    }

    if (overdueTasks > totalTasks * 0.1) {
      insights.push('You have several overdue tasks that need attention');
      recommendations.push('Review and reschedule overdue tasks');
      recommendations.push('Consider if some tasks can be delegated or eliminated');
    }

    // Find most and least productive contexts
    const contextRates = Object.entries(contextAnalysis).map(([name, data]) => ({
      name,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      total: data.total
    }));

    const mostProductiveContext = contextRates.reduce((max, current) => 
      current.rate > max.rate ? current : max, contextRates[0] || { name: 'None', rate: 0, total: 0 }
    );

    const leastProductiveContext = contextRates.reduce((min, current) => 
      current.rate < min.rate && current.total > 2 ? current : min, contextRates[0] || { name: 'None', rate: 100, total: 0 }
    );

    if (mostProductiveContext && leastProductiveContext && mostProductiveContext.rate > leastProductiveContext.rate + 20) {
      insights.push(`You're most productive in ${mostProductiveContext.name} context (${Math.round(mostProductiveContext.rate)}% completion rate)`);
      recommendations.push(`Consider scheduling more important tasks in your ${mostProductiveContext.name} context`);
    }

    const analysis = {
      timeframe,
      period: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTimeHours: Math.round((avgCompletionTime / (1000 * 60 * 60)) * 100) / 100
      },
      contextAnalysis: Object.entries(contextAnalysis).map(([name, data]) => ({
        context: name,
        totalTasks: data.total,
        completedTasks: data.completed,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 10000) / 100 : 0
      })),
      priorityAnalysis: Object.entries(priorityAnalysis).map(([priority, data]) => ({
        priority,
        totalTasks: data.total,
        completedTasks: data.completed,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 10000) / 100 : 0
      })),
      insights,
      recommendations,
      productivityTrend: await calculateProductivityTrend(userId, startDate),
      generatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Productivity analysis completed',
      data: analysis
    });

  } catch (error) {
    logger.error('Failed to analyze productivity', { 
      userId: req.user?.userId, 
      error: error instanceof Error ? error.message : error 
    });
    
    res.status(500).json({
      message: 'Failed to analyze productivity',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

// POST /api/v1/ai/predict-project-success - Predict project success probability
router.post('/predict-project-success', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        message: 'Project ID is required'
      });
    }

    logger.info('Predicting project success', { userId, projectId });

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            context: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    // Calculate project metrics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const overdueTasks = project.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
    ).length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

    // Calculate time factors
    const daysElapsed = project.startDate 
      ? Math.floor((Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const daysRemaining = project.endDate
      ? Math.floor((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const totalProjectDays = project.startDate && project.endDate
      ? Math.floor((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const timeProgress = totalProjectDays ? (daysElapsed / totalProjectDays) * 100 : 0;

    // Calculate success probability using multiple factors
    let successProbability = 70; // Base probability

    // Completion rate factor (40% weight)
    if (completionRate >= 80) successProbability += 20;
    else if (completionRate >= 60) successProbability += 10;
    else if (completionRate >= 40) successProbability += 0;
    else successProbability -= 15;

    // Overdue rate factor (20% weight)
    if (overdueRate <= 5) successProbability += 10;
    else if (overdueRate <= 15) successProbability += 0;
    else successProbability -= 15;

    // Time vs progress factor (20% weight)
    if (totalProjectDays && daysRemaining !== null) {
      const idealProgress = timeProgress;
      const actualProgress = completionRate;
      const progressDiff = actualProgress - idealProgress;
      
      if (progressDiff >= 10) successProbability += 15;
      else if (progressDiff >= 0) successProbability += 5;
      else if (progressDiff >= -10) successProbability -= 5;
      else successProbability -= 15;
    }

    // Team velocity factor (20% weight)
    const recentTasks = project.tasks.filter(t => 
      t.createdAt > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    const recentCompletions = recentTasks.filter(t => t.status === 'COMPLETED').length;
    const recentVelocity = recentTasks.length > 0 ? (recentCompletions / recentTasks.length) * 100 : 0;

    if (recentVelocity >= 80) successProbability += 10;
    else if (recentVelocity >= 60) successProbability += 5;
    else if (recentVelocity < 40) successProbability -= 10;

    // Ensure probability is within bounds
    successProbability = Math.max(10, Math.min(95, successProbability));

    // Generate risk factors and recommendations
    const riskFactors = [];
    const recommendations = [];

    if (overdueRate > 15) {
      riskFactors.push('High number of overdue tasks');
      recommendations.push('Review and reschedule overdue tasks immediately');
    }

    if (completionRate < 40 && timeProgress > 50) {
      riskFactors.push('Low completion rate relative to time elapsed');
      recommendations.push('Consider scope reduction or deadline extension');
    }

    if (recentVelocity < 50) {
      riskFactors.push('Recent team velocity is below optimal');
      recommendations.push('Identify and address blockers affecting team velocity');
    }

    if (daysRemaining !== null && daysRemaining < 7 && completionRate < 80) {
      riskFactors.push('Approaching deadline with significant work remaining');
      recommendations.push('Focus on critical path tasks only');
      recommendations.push('Consider deadline extension or scope reduction');
    }

    const prediction = {
      projectId,
      projectName: project.name,
      successProbability: Math.round(successProbability),
      confidence: 85, // AI confidence in the prediction
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        overdueRate: Math.round(overdueRate * 100) / 100,
        timeProgress: Math.round(timeProgress * 100) / 100,
        recentVelocity: Math.round(recentVelocity * 100) / 100
      },
      timeline: {
        startDate: project.startDate,
        endDate: project.endDate,
        daysElapsed,
        daysRemaining,
        totalProjectDays
      },
      riskFactors,
      recommendations,
      predictedAt: new Date().toISOString()
    };

    res.json({
      message: 'Project success prediction completed',
      data: prediction
    });

  } catch (error) {
    logger.error('Failed to predict project success', { 
      userId: req.user?.userId, 
      error: error instanceof Error ? error.message : error 
    });
    
    res.status(500).json({
      message: 'Failed to predict project success',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

// Helper function to calculate productivity trend
async function calculateProductivityTrend(userId: string, startDate: Date) {
  const weeklyData = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(startDate.getTime() + i * weekMs);
    const weekEnd = new Date(weekStart.getTime() + weekMs);
    
    const weekTasks = await prisma.task.findMany({
      where: {
        createdById: userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });
    
    const completed = weekTasks.filter(t => t.status === 'COMPLETED').length;
    const total = weekTasks.length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    weeklyData.push({
      week: i + 1,
      startDate: weekStart.toISOString(),
      totalTasks: total,
      completedTasks: completed,
      completionRate: Math.round(rate * 100) / 100
    });
  }
  
  return weeklyData;
}

export default router;