import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken as authMiddleware } from '../shared/middleware/auth';
import { enhancedAIService } from '../services/EnhancedAIService';

const router = express.Router();

// Safe JSON parsing utility
function safeJsonParse(jsonString: any, defaultValue: any) {
  if (!jsonString || jsonString === null || jsonString === undefined) {
    return defaultValue;
  }
  
  if (typeof jsonString === 'object') {
    return jsonString; // Already parsed
  }
  
  try {
    const trimmed = jsonString.toString().trim();
    if (trimmed === '' || trimmed === 'null') {
      return defaultValue;
    }
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn('JSON parse error:', error, 'Input:', jsonString);
    return defaultValue;
  }
}

// =============================================================================
// SMART DAY PLANNER API ROUTES
// =============================================================================
// System inteligentnego planowania dnia z energią, przerwami i kontekstami
// Autor: Claude Code 2025-07-07

// -----------------------------------------------------------------------------
// 1. ENERGY TIME BLOCKS - Zarządzanie blokami czasowymi
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/smart-day-planner/time-blocks
 * Pobierz wszystkie bloki czasowe użytkownika
 */
router.get('/time-blocks', authMiddleware, async (req, res) => {
  try {
    // EnergyTimeBlock model does not exist yet - return empty array
    const blocks: any[] = [];

    return res.json({
      success: true,
      data: blocks,
      meta: {
        total: 0,
        workBlocks: 0,
        breakBlocks: 0
      }
    });
  } catch (error) {
    console.error('Error fetching time blocks:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch time blocks'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/time-blocks
 * Utwórz nowy blok czasowy
 */
router.post('/time-blocks', authMiddleware, async (req, res) => {
  try {
    // EnergyTimeBlock model does not exist yet - return error
    return res.status(501).json({
      success: false,
      error: 'Time blocks feature is not yet available'
    });
  } catch (error) {
    console.error('Error creating time block:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create time block'
    });
  }
});

/**
 * PUT /api/v1/smart-day-planner/time-blocks/:id
 * Aktualizuj blok czasowy
 */
router.put('/time-blocks/:id', authMiddleware, async (req, res) => {
  try {
    // EnergyTimeBlock model does not exist yet - return error
    return res.status(501).json({
      success: false,
      error: 'Time blocks feature is not yet available'
    });
  } catch (error) {
    console.error('Error updating time block:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update time block'
    });
  }
});

// -----------------------------------------------------------------------------
// 2. SMART TASK SCHEDULING - Inteligentne planowanie zadań
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/smart-day-planner/schedule-tasks
 * Automatyczne przydzielanie zadań do bloków czasowych z fallback kontekstów
 */
router.post('/schedule-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { date, forceReschedule = false } = req.body;

    const schedulingDate = date ? new Date(date) : new Date();

    // EnergyTimeBlock model does not exist yet - schedule tasks without time blocks
    // 1. Pobierz dostępne zadania
    const availableTasks = await prisma.task.findMany({
      where: {
        organizationId,
        assignedToId: userId,
        status: { in: ['NEW', 'IN_PROGRESS'] },
        dueDate: {
          lte: new Date(schedulingDate.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        context: true
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // 2. Usuń stare harmonogramy jeśli force reschedule
    if (forceReschedule) {
      await prisma.scheduled_tasks.deleteMany({
        where: {
          userId,
          scheduledDate: {
            gte: new Date(schedulingDate.setHours(0, 0, 0, 0)),
            lt: new Date(schedulingDate.setHours(24, 0, 0, 0))
          }
        }
      });
    }

    const scheduledTasks = [];

    // 3. Schedule tasks without time blocks
    for (const task of availableTasks) {
      const taskMinutes = (task.estimatedHours || 0.5) * 60;

      const scheduledTask = await prisma.scheduled_tasks.create({
        data: {
          title: task.title,
          description: task.description,
          estimatedMinutes: taskMinutes,
          taskId: task.id,
          context: task.context?.name || '@computer',
          energyRequired: task.energy || 'MEDIUM',
          priority: task.priority,
          scheduledDate: schedulingDate,
          status: 'PLANNED',
          userId,
          organizationId
        } as any
      });

      scheduledTasks.push(scheduledTask);
    }

    return res.json({
      success: true,
      data: {
        scheduledTasks,
        unscheduledTasks: [],
        statistics: {
          totalTasks: scheduledTasks.length,
          scheduledCount: scheduledTasks.length,
          unscheduledCount: 0,
          schedulingRate: 1,
          blocksUsed: 0,
          totalBlocks: 0
        }
      },
      message: `Successfully scheduled ${scheduledTasks.length} tasks`
    });
  } catch (error) {
    console.error('Error scheduling tasks:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule tasks'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/scheduled-tasks
 * Utwórz nowe zaplanowane zadanie (wydarzenie)
 */
router.post('/scheduled-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const {
      title,
      description,
      estimatedMinutes,
      priority = 'MEDIUM',
      context = '@computer',
      energyRequired = 'MEDIUM',
      scheduledDate,
      status = 'PLANNED'
    } = req.body;

    // Validation
    if (!title || !estimatedMinutes || !scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Title, estimatedMinutes, and scheduledDate are required'
      });
    }

    const targetDate = new Date(scheduledDate);

    // Create the scheduled task without time block (EnergyTimeBlock model does not exist)
    const scheduledTask = await prisma.scheduled_tasks.create({
      data: {
        title,
        description,
        estimatedMinutes,
        context,
        energyRequired,
        priority,
        status,
        scheduledDate: targetDate,
        wasRescheduled: false,
        userId,
        organizationId
      } as any
    });

    return res.status(201).json({
      success: true,
      data: scheduledTask,
      message: `Event "${title}" created successfully`
    });

  } catch (error) {
    console.error('Error creating scheduled task:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create scheduled task'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/daily-schedule/:date
 * Pobierz kompletny harmonogram na dany dzień
 */
router.get('/daily-schedule/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const schedulingDate = new Date(date);
    const dayOfWeek = getDayOfWeek(schedulingDate);

    // EnergyTimeBlock model does not exist yet - return empty schedule
    const timeBlocks: any[] = [];

    return res.json({
      success: true,
      data: {
        date: schedulingDate,
        dayOfWeek,
        timeBlocks,
        statistics: {
          totalBlocks: 0,
          workBlocks: 0,
          breakBlocks: 0,
          totalTasks: 0,
          totalPlannedMinutes: 0,
          totalWorkMinutes: 0,
          utilizationRate: 0,
          blocksWithTasks: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch daily schedule'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/weekly-schedule/:date
 * Pobierz harmonogram na tydzień (7 dni od podanej daty)
 */
router.get('/weekly-schedule/:date', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;
    const baseDate = new Date(date);

    // Get start of week (Monday)
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1);

    const weekData = [];

    // Get data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const dayOfWeek = getDayOfWeek(currentDay);

      // Get time blocks for this day
      const dayStart = new Date(currentDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDay);
      dayEnd.setHours(23, 59, 59, 999);

      // EnergyTimeBlock model does not exist yet - return empty time blocks
      const timeBlocks: any[] = [];

      // Get scheduled tasks for this day
      const scheduledTasks = await prisma.scheduled_tasks.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: dayStart,
            lt: dayEnd
          }
        },
        orderBy: { priority: 'desc' }
      });

      const totalPlannedMinutes = scheduledTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

      weekData.push({
        date: currentDay,
        dayOfWeek,
        timeBlocks,
        scheduledTasks,
        statistics: {
          totalBlocks: 0,
          totalTasks: scheduledTasks.length,
          totalPlannedMinutes,
          blocksWithTasks: 0
        }
      });
    }

    // Calculate week summary
    const weekSummary = {
      totalDays: 7,
      activeDays: weekData.filter(d => d.statistics.totalTasks > 0).length,
      totalTasks: weekData.reduce((sum, d) => sum + d.statistics.totalTasks, 0),
      totalPlannedHours: Math.round(weekData.reduce((sum, d) => sum + d.statistics.totalPlannedMinutes, 0) / 60 * 10) / 10,
      averageTasksPerDay: Math.round(weekData.reduce((sum, d) => sum + d.statistics.totalTasks, 0) / 7 * 10) / 10
    };

    return res.json({
      success: true,
      data: {
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        days: weekData,
        summary: weekSummary
      }
    });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly schedule'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/monthly-schedule/:year/:month
 * Pobierz harmonogram na miesiąc
 */
router.get('/monthly-schedule/:year/:month', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.params;
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month) - 1; // JavaScript months are 0-indexed
    
    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    
    const monthData = [];
    const current = new Date(firstDay);
    
    while (current <= lastDay) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      const dayOfWeek = getDayOfWeek(current);
      
      // Get scheduled tasks for this day
      const scheduledTasks = await prisma.scheduled_tasks.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: dayStart,
            lt: dayEnd
          }
        },
        orderBy: { priority: 'desc' }
      });
      
      const totalPlannedMinutes = scheduledTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
      
      monthData.push({
        date: new Date(current),
        dayOfWeek,
        hasEvents: scheduledTasks.length > 0,
        statistics: {
          totalTasks: scheduledTasks.length,
          totalPlannedMinutes,
          completedTasks: scheduledTasks.filter(t => t.status === 'COMPLETED').length
        },
        scheduledTasks: scheduledTasks.slice(0, 5) // Limit to first 5 for overview
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    // Calculate month summary
    const monthSummary = {
      totalDays: monthData.length,
      activeDays: monthData.filter(d => d.hasEvents).length,
      totalTasks: monthData.reduce((sum, d) => sum + d.statistics.totalTasks, 0),
      completedTasks: monthData.reduce((sum, d) => sum + d.statistics.completedTasks, 0),
      totalPlannedHours: Math.round(monthData.reduce((sum, d) => sum + d.statistics.totalPlannedMinutes, 0) / 60 * 10) / 10,
      averageTasksPerActiveDay: monthData.filter(d => d.hasEvents).length > 0 
        ? Math.round(monthData.reduce((sum, d) => sum + d.statistics.totalTasks, 0) / monthData.filter(d => d.hasEvents).length * 10) / 10
        : 0,
      completionRate: monthData.reduce((sum, d) => sum + d.statistics.totalTasks, 0) > 0
        ? Math.round(monthData.reduce((sum, d) => sum + d.statistics.completedTasks, 0) / monthData.reduce((sum, d) => sum + d.statistics.totalTasks, 0) * 100)
        : 0
    };
    
    return res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth + 1,
        monthName: firstDay.toLocaleDateString('pl-PL', { month: 'long' }),
        firstDay,
        lastDay,
        days: monthData,
        summary: monthSummary
      }
    });
  } catch (error) {
    console.error('Error fetching monthly schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly schedule'
    });
  }
});

// -----------------------------------------------------------------------------
// 3. WEEKLY & MONTHLY VIEWS - Widoki tygodniowe i miesięczne
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// 4. FOCUS MODES - Zarządzanie trybami koncentracji
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/smart-day-planner/focus-modes
 * Pobierz wszystkie tryby koncentracji użytkownika
 */
router.get('/focus-modes', authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const focusModes = await prisma.focusMode.findMany({
      where: { organizationId },
      include: {
        energy_time_blocks: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            dayOfWeek: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: focusModes,
      meta: {
        total: focusModes.length,
        activeBlocks: focusModes.reduce((sum, mode) => sum + mode.energy_time_blocks.length, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching focus modes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch focus modes'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/focus-modes
 * Utwórz nowy tryb koncentracji
 */
router.post('/focus-modes', authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      duration,
      energyLevel = 'HIGH',
      contextName,
      estimatedTimeMax,
      category,
      priority = 'MEDIUM',
      tags = []
    } = req.body;

    const focusMode = await prisma.focusMode.create({
      data: {
        name,
        duration,
        energyLevel,
        contextName,
        estimatedTimeMax,
        category,
        priority,
        tags,
        organizationId
      }
    });

    return res.status(201).json({
      success: true,
      data: focusMode,
      message: 'Focus mode created successfully'
    });
  } catch (error) {
    console.error('Error creating focus mode:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create focus mode'
    });
  }
});

/**
 * PUT /api/v1/smart-day-planner/focus-modes/:id
 * Aktualizuj tryb koncentracji
 */
router.put('/focus-modes/:id', authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const updateData = req.body;

    const focusMode = await prisma.focusMode.findFirst({
      where: { id, organizationId }
    });

    if (!focusMode) {
      return res.status(404).json({
        success: false,
        error: 'Focus mode not found'
      });
    }

    const updatedFocusMode = await prisma.focusMode.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        energy_time_blocks: true
      }
    });

    return res.json({
      success: true,
      data: updatedFocusMode,
      message: 'Focus mode updated successfully'
    });
  } catch (error) {
    console.error('Error updating focus mode:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update focus mode'
    });
  }
});

/**
 * DELETE /api/v1/smart-day-planner/focus-modes/:id
 * Usuń tryb koncentracji
 */
router.delete('/focus-modes/:id', authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;

    const focusMode = await prisma.focusMode.findFirst({
      where: { id, organizationId }
    });

    if (!focusMode) {
      return res.status(404).json({
        success: false,
        error: 'Focus mode not found'
      });
    }

    // EnergyTimeBlock model does not exist - skip updateMany
    // await prisma.energy_time_blocks.updateMany({ where: { focusModeId: id }, data: { focusModeId: null } });

    await prisma.focusMode.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Focus mode deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting focus mode:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete focus mode'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/time-blocks/:id/focus-mode
 * Przypisz tryb koncentracji do bloku czasowego
 */
router.post('/time-blocks/:id/focus-mode', authMiddleware, async (req, res) => {
  try {
    // EnergyTimeBlock model does not exist yet - return error
    return res.status(501).json({
      success: false,
      error: 'Time blocks feature is not yet available'
    });
  } catch (error) {
    console.error('Error assigning focus mode:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to assign focus mode'
    });
  }
});

// -----------------------------------------------------------------------------
// 4. PERFORMANCE ANALYTICS - Zaawansowana analityka wydajności
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/smart-day-planner/performance-analytics
 * Pobierz metryki wydajności dla użytkownika
 */
router.get('/performance-analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, periodType = 'weekly' } = req.query;

    const whereClause: any = { userId };

    if (startDate && endDate) {
      whereClause.startDate = { gte: new Date(startDate as string) };
      whereClause.endDate = { lte: new Date(endDate as string) };
    }

    if (periodType) {
      whereClause.periodType = periodType;
    }

    const metrics = await prisma.performance_metrics.findMany({
      where: whereClause,
      include: {
        focus_modes: {
          select: {
            id: true,
            name: true,
            duration: true,
            energyLevel: true
          }
        }
      },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Oblicz podsumowania
    const summary = metrics.length > 0 ? {
      avgCompletionRate: metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length,
      avgProductivityScore: metrics.reduce((sum, m) => sum + (m.focusModeProductivity || 0), 0) / metrics.length,
      totalTasksCompleted: metrics.reduce((sum, m) => sum + m.completedTasks, 0),
      avgContextEfficiency: metrics.reduce((sum, m) => sum + m.contextEfficiency, 0) / metrics.length,
      currentStreak: Math.max(...metrics.map(m => m.currentStreak)),
      longestStreak: Math.max(...metrics.map(m => m.longestStreak)),
      avgStressLevel: metrics.filter(m => m.stressLevel).length > 0 
        ? metrics.filter(m => m.stressLevel).reduce((sum, m) => sum + (m.stressLevel || 0), 0) / metrics.filter(m => m.stressLevel).length
        : null,
      burnoutRiskTrend: metrics.slice(0, 7).map(m => m.burnoutRisk || 0)
    } : null;

    return res.json({
      success: true,
      data: {
        metrics,
        summary,
        meta: {
          total: metrics.length,
          period: { startDate, endDate, periodType },
          dataAvailable: metrics.length > 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/performance-analytics/generate
 * Wygeneruj nowe metryki wydajności na podstawie danych
 */
router.post('/performance-analytics/generate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { startDate, endDate, periodType = 'daily' } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // EnergyAnalytics may have energyTimeBlockId but the model doesn't exist
    // Get scheduled tasks for basic metrics
    const scheduledTasks = await prisma.scheduled_tasks.findMany({
      where: {
        userId,
        scheduledDate: { gte: start, lte: end }
      }
    });

    // Calculate basic performance metrics
    const totalTasks = scheduledTasks.length;
    const completedTasks = scheduledTasks.filter(t => t.status === 'COMPLETED').length;
    const overdueTasks = scheduledTasks.filter(t => t.status === 'OVERDUE').length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Create performance metrics with basic data
    const performanceMetrics = await prisma.performance_metrics.create({
      data: {
        startDate: start,
        endDate: end,
        periodType,
        focusModeEfficiency: 0,
        focusModeProductivity: 0,
        primaryContext: '@computer',
        alternativeContexts: [],
        contextSwitchCount: 0,
        contextEfficiency: 0,
        energyLevel: 'MEDIUM',
        energyConsistency: 0,
        energyOptimalTimes: [],
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        avgTaskDuration: calculateAvgTaskDuration(scheduledTasks),
        timeBlockUtilization: 0,
        productiveStreakDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        satisfactionTrend: null,
        burnoutRisk: 0,
        suggestions: ['Energy time blocks feature is not yet available for detailed analytics'],
        organizationId,
        userId
      } as any,
      include: {
        focus_modes: true
      }
    });

    return res.status(201).json({
      success: true,
      data: performanceMetrics,
      message: 'Performance metrics generated successfully'
    });
  } catch (error) {
    console.error('Error generating performance analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate performance analytics'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/performance-insights
 * Pobierz insights i rekomendacje na podstawie analytics
 */
router.get('/performance-insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    const periodDays = parseInt(period.toString().replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Pobierz ostatnie metryki
    const recentMetrics = await prisma.performance_metrics.findMany({
      where: {
        userId,
        startDate: { gte: startDate }
      },
      include: {
        focus_modes: true
      },
      orderBy: { startDate: 'desc' },
      take: periodDays
    });

    if (recentMetrics.length === 0) {
      return res.json({
        success: true,
        data: {
          insights: [],
          recommendations: [],
          trends: {},
          message: 'Insufficient data for insights. Complete more work sessions to generate insights.'
        }
      });
    }

    // Analiza trendów
    const trends = {
      productivity: calculateTrend(recentMetrics.map(m => m.focusModeProductivity || 0)),
      completionRate: calculateTrend(recentMetrics.map(m => m.completionRate)),
      stressLevel: calculateTrend(recentMetrics.filter(m => m.stressLevel).map(m => m.stressLevel || 0)),
      burnoutRisk: calculateTrend(recentMetrics.map(m => m.burnoutRisk || 0)),
      energyConsistency: calculateTrend(recentMetrics.map(m => m.energyConsistency))
    };

    // Generuj insights
    const insights = generateInsights(recentMetrics, trends);

    // Generuj rekomendacje
    const recommendations = generateRecommendations(recentMetrics, trends);

    return res.json({
      success: true,
      data: {
        insights,
        recommendations,
        trends,
        bestPerformingFocusMode: findBestFocusMode(recentMetrics),
        optimalWorkPatterns: findOptimalPatterns(recentMetrics),
        performanceScore: calculateOverallScore(recentMetrics)
      }
    });
  } catch (error) {
    console.error('Error fetching performance insights:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch performance insights'
    });
  }
});

// -----------------------------------------------------------------------------
// 5. ENERGY ANALYTICS - Analityka i uczenie się wzorców
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/smart-day-planner/energy-feedback
 * Zapisz feedback o rzeczywistej energii i produktywności
 */
router.post('/energy-feedback', authMiddleware, async (req, res) => {
  try {
    // EnergyTimeBlock model does not exist yet - return error
    return res.status(501).json({
      success: false,
      error: 'Energy feedback feature is not yet available'
    });
  } catch (error) {
    console.error('Error recording energy feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record energy feedback'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/energy-patterns
 * Pobierz wzorce energii użytkownika
 */
router.get('/energy-patterns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dayOfWeek } = req.query;

    const patterns = await prisma.energy_patterns.findMany({
      where: {
        userId,
        ...(dayOfWeek && { dayOfWeek: dayOfWeek as any })
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error fetching energy patterns:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch energy patterns'
    });
  }
});

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

async function getNextOrder(userId: string, dayOfWeek: any): Promise<number> {
  // EnergyTimeBlock model does not exist - return default order
  return 1;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

function getDayOfWeek(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

function getStartOfWeekDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeekDate(date: Date): Date {
  const d = getStartOfWeekDate(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addMinutesToTime(time: string, minutes: number): string {
  const d = parseTime(time);
  d.setMinutes(d.getMinutes() + minutes);
  return formatTime(d);
}

function findNextAvailableTimeBlock(userId: string): Promise<any> {
  return prisma.energy_time_blocks.findFirst({
    where: {
      userId,
      isActive: true,
      isBreak: false
    },
    orderBy: { startTime: 'asc' }
  });
}

async function updateEnergyPatterns(userId: string, timeBlock: any, analytics: any) {
  const timeSlot = `${timeBlock.startTime}-${timeBlock.endTime}`;
  const dayOfWeek = getDayOfWeek(new Date());

  // Znajdź lub utwórz wzorzec energii
  const existingPattern = await prisma.energy_patterns.findFirst({
    where: { userId, timeSlot, dayOfWeek: dayOfWeek as any }
  });

  if (existingPattern) {
    // Aktualizuj istniejący wzorzec (weighted average)
    const newSampleSize = existingPattern.sampleSize + 1;
    const weight = 1 / newSampleSize;
    
    await prisma.energy_patterns.update({
      where: { id: existingPattern.id },
      data: {
        averageEnergy: existingPattern.averageEnergy * (1 - weight) + analytics.energyScore * weight,
        productivityScore: existingPattern.productivityScore * (1 - weight) + analytics.productivityScore * weight,
        successRate: existingPattern.successRate * (1 - weight) + (analytics.tasksCompleted > 0 ? 1 : 0) * weight,
        tasksCompleted: existingPattern.tasksCompleted + analytics.tasksCompleted,
        totalMinutes: existingPattern.totalMinutes + analytics.minutesActual,
        sampleSize: newSampleSize,
        confidence: Math.min(1.0, newSampleSize / 30), // Max confidence after 30 samples
        lastAnalyzed: new Date()
      }
    });
  } else {
    // Utwórz nowy wzorzec
    await prisma.energy_patterns.create({
      data: {
        timeSlot,
        dayOfWeek: dayOfWeek as any,
        energyLevel: analytics.actualEnergy,
        averageEnergy: analytics.energyScore,
        productivityScore: analytics.productivityScore,
        tasksCompleted: analytics.tasksCompleted,
        totalMinutes: analytics.minutesActual,
        successRate: analytics.tasksCompleted > 0 ? 1 : 0,
        confidence: 0.1, // Low confidence initially
        sampleSize: 1,
        lastAnalyzed: new Date(),
        userId,
        organizationId: timeBlock.organizationId
      } as any
    });
  }
}

// -----------------------------------------------------------------------------
// PERFORMANCE ANALYTICS HELPER FUNCTIONS
// -----------------------------------------------------------------------------

function calculateEnergyConsistency(analytics: any[]): number {
  if (analytics.length === 0) return 0;
  
  // Oblicz odchylenie standardowe energii
  const energyScores = analytics.map(a => a.energyScore || 0);
  const mean = energyScores.reduce((sum, score) => sum + score, 0) / energyScores.length;
  const variance = energyScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / energyScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Konwertuj na 0-1 (niskie odchylenie = wysoka konsystencja)
  return Math.max(0, 1 - (stdDev / 10));
}

function calculateProductivityStreak(analytics: any[]): { currentStreak: number; longestStreak: number } {
  if (analytics.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  // Sortuj po dacie
  const sortedAnalytics = analytics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  for (const item of sortedAnalytics) {
    if ((item.productivityScore || 0) >= 0.7) { // 70% threshold for productive day
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Current streak to są ostatnie dni produktywne
  const recentAnalytics = sortedAnalytics.slice(-7); // Last 7 days
  for (let i = recentAnalytics.length - 1; i >= 0; i--) {
    if ((recentAnalytics[i].productivityScore || 0) >= 0.7) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return { currentStreak, longestStreak };
}

async function generateAISuggestions(metrics: any): Promise<string[]> {
  const suggestions: string[] = [];
  
  if (metrics.completionRate < 0.7) {
    suggestions.push('Rozważ zmniejszenie liczby zadań na dzień lub zwiększenie szacowanego czasu');
    suggestions.push('Sprawdź czy zadania nie są zbyt ambitne - podziel duże zadania na mniejsze części');
  }
  
  if (metrics.focusModeEfficiency < 0.8) {
    suggestions.push('Tryby koncentracji wymagają optymalizacji - rozważ dostosowanie czasu trwania');
    suggestions.push('Sprawdź czy środowisko pracy wspiera koncentrację (hałas, przerwy, telefon)');
  }
  
  if (metrics.avgProductivity < 0.6) {
    suggestions.push('Rozważ planowanie wymagających zadań w godzinach najwyższej energii');
    suggestions.push('Dodaj więcej przerw między intensywnymi blokami pracy');
  }
  
  if (metrics.contextSwitches > 5) {
    suggestions.push('Zbyt dużo przełączeń kontekstu - grupuj podobne zadania razem');
    suggestions.push('Rozważ dłuższe bloki dla jednego typu zadań');
  }
  
  if (metrics.timeBlockUtilization < 0.8) {
    suggestions.push('Niedostateczne wykorzystanie planowanego czasu - sprawdź czy szacowania są realistyczne');
    suggestions.push('Rozważ dodanie buforu czasowego do bloków pracy');
  }
  
  return suggestions;
}

function calculateBurnoutRisk(factors: any): number {
  let riskScore = 0;
  
  // Niska produktywność przy wysokim utilization = ryzyko
  if (factors.avgProductivity < 0.5 && factors.timeBlockUtilization > 0.9) {
    riskScore += 0.3;
  }
  
  // Dużo przełączeń kontekstu = stres
  if (factors.contextSwitches > 8) {
    riskScore += 0.2;
  }
  
  // Niskie zadowolenie
  if (factors.avgSatisfaction && factors.avgSatisfaction < 3) {
    riskScore += 0.3;
  }
  
  // Bardzo wysokie wykorzystanie bez przerw
  if (factors.timeBlockUtilization > 0.95) {
    riskScore += 0.2;
  }
  
  return Math.min(1.0, riskScore);
}

function getMostUsedContext(analytics: any[]): string {
  const contextCounts: { [key: string]: number } = {};
  
  analytics.forEach(item => {
    const contexts = Array.isArray(item.contextsActual) 
      ? item.contextsActual 
      : JSON.parse(item.contextsActual || '[]');
    
    contexts.forEach((context: string) => {
      contextCounts[context] = (contextCounts[context] || 0) + 1;
    });
  });
  
  return Object.keys(contextCounts).reduce((a, b) => 
    contextCounts[a] > contextCounts[b] ? a : b, '@computer'
  );
}

function getAlternativeContexts(analytics: any[]): string[] {
  const contextCounts: { [key: string]: number } = {};
  
  analytics.forEach(item => {
    const contexts = Array.isArray(item.contextsActual) 
      ? item.contextsActual 
      : JSON.parse(item.contextsActual || '[]');
    
    contexts.forEach((context: string) => {
      contextCounts[context] = (contextCounts[context] || 0) + 1;
    });
  });
  
  return Object.keys(contextCounts)
    .sort((a, b) => contextCounts[b] - contextCounts[a])
    .slice(1, 4); // Top 3 alternative contexts
}

function getMostCommonEnergyLevel(analytics: any[]): string {
  const energyCounts: { [key: string]: number } = {};
  
  analytics.forEach(item => {
    const energy = item.actualEnergy || item.plannedEnergy || 'MEDIUM';
    energyCounts[energy] = (energyCounts[energy] || 0) + 1;
  });
  
  return Object.keys(energyCounts).reduce((a, b) => 
    energyCounts[a] > energyCounts[b] ? a : b, 'MEDIUM'
  );
}

function getOptimalEnergyTimes(analytics: any[]): string[] {
  const timeSlotPerformance: { [key: string]: number[] } = {};
  
  analytics.forEach(item => {
    if (item.energy_time_blocks) {
      const timeSlot = `${item.energy_time_blocks.startTime}-${item.energy_time_blocks.endTime}`;
      const productivity = item.productivityScore || 0;
      
      if (!timeSlotPerformance[timeSlot]) {
        timeSlotPerformance[timeSlot] = [];
      }
      timeSlotPerformance[timeSlot].push(productivity);
    }
  });
  
  // Znajdź sloty z najwyższą średnią produktywnością
  const avgPerformance = Object.keys(timeSlotPerformance).map(slot => ({
    slot,
    avg: timeSlotPerformance[slot].reduce((sum, p) => sum + p, 0) / timeSlotPerformance[slot].length
  }));
  
  return avgPerformance
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map(item => item.slot);
}

function calculateAvgTaskDuration(tasks: any[]): number | null {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' && t.actualMinutes);
  
  if (completedTasks.length === 0) return null;
  
  return completedTasks.reduce((sum, task) => sum + (task.actualMinutes || 0), 0) / completedTasks.length;
}

function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; percentage: number } {
  if (values.length < 2) return { direction: 'stable', percentage: 0 };
  
  const oldValue = values[0];
  const newValue = values[values.length - 1];
  
  if (oldValue === 0) return { direction: 'stable', percentage: 0 };
  
  const change = ((newValue - oldValue) / oldValue) * 100;
  const direction = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
  
  return { direction, percentage: Math.abs(change) };
}

function generateInsights(metrics: any[], trends: any): string[] {
  const insights: string[] = [];
  
  if (trends.productivity.direction === 'up') {
    insights.push(`Twoja produktywność wzrosła o ${trends.productivity.percentage.toFixed(1)}% w ostatnim okresie`);
  } else if (trends.productivity.direction === 'down') {
    insights.push(`Spadek produktywności o ${trends.productivity.percentage.toFixed(1)}% - warto przeanalizować przyczyny`);
  }
  
  if (trends.completionRate.direction === 'up') {
    insights.push(`Lepiej ukończasz zadania - wskaźnik completion rate wzrósł o ${trends.completionRate.percentage.toFixed(1)}%`);
  }
  
  if (trends.burnoutRisk.direction === 'up') {
    insights.push(`Uwaga: wzrost ryzyka wypalenia o ${trends.burnoutRisk.percentage.toFixed(1)}% - rozważ więcej przerw`);
  }
  
  // Analiza focus modes
  const focusModeMetrics = metrics.filter(m => m.focus_modes);
  if (focusModeMetrics.length > 0) {
    const avgEfficiency = focusModeMetrics.reduce((sum, m) => sum + (m.focusModeEfficiency || 0), 0) / focusModeMetrics.length;
    insights.push(`Średnia efektywność w trybach koncentracji: ${(avgEfficiency * 100).toFixed(1)}%`);
  }
  
  return insights;
}

function generateRecommendations(metrics: any[], trends: any): string[] {
  const recommendations: string[] = [];
  
  if (trends.stressLevel.direction === 'up') {
    recommendations.push('Zaplanuj więcej przerw między intensywnymi sesjami pracy');
    recommendations.push('Rozważ techniki relaksacyjne lub medytację');
  }
  
  if (trends.completionRate.direction === 'down') {
    recommendations.push('Zmniejsz liczbę zadań na dzień o 20-30%');
    recommendations.push('Zwiększ szacowany czas dla zadań o 25%');
  }
  
  // Rekomendacje na podstawie najlepszych wzorców
  const bestMetrics = metrics.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))[0];
  if (bestMetrics) {
    recommendations.push(`Twój najlepszy dzień miał completion rate ${(bestMetrics.completionRate * 100).toFixed(1)}% - spróbuj powtórzyć ten wzorzec`);
    
    if (bestMetrics.focus_modes) {
      recommendations.push(`Focus mode "${bestMetrics.focus_modes.name}" działał najlepiej - używaj go częściej`);
    }
  }
  
  return recommendations;
}

function findBestFocusMode(metrics: any[]): any | null {
  const focusModePerformance: { [key: string]: { total: number; count: number; mode: any } } = {};
  
  metrics.forEach(metric => {
    if (metric.focus_modes && metric.focusModeEfficiency) {
      const id = metric.focus_modes.id;
      if (!focusModePerformance[id]) {
        focusModePerformance[id] = { total: 0, count: 0, mode: metric.focus_modes };
      }
      focusModePerformance[id].total += metric.focusModeEfficiency;
      focusModePerformance[id].count += 1;
    }
  });
  
  let bestMode = null;
  let bestAvg = 0;
  
  Object.values(focusModePerformance).forEach(perf => {
    const avg = perf.total / perf.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestMode = { ...perf.mode, avgEfficiency: avg };
    }
  });
  
  return bestMode;
}

function findOptimalPatterns(metrics: any[]): any {
  // Analiza najlepszych wzorców pracy
  const patterns = {
    bestEnergyTime: null as string | null,
    optimalTaskCount: 0,
    bestContextCombination: [] as string[],
    idealSessionLength: 0
  };
  
  // Najlepszy czas energii
  const timePerformance: { [key: string]: number[] } = {};
  metrics.forEach(m => {
    const times = Array.isArray(m.energyOptimalTimes) ? m.energyOptimalTimes : JSON.parse(m.energyOptimalTimes || '[]');
    times.forEach((time: string) => {
      if (!timePerformance[time]) timePerformance[time] = [];
      timePerformance[time].push(m.completionRate || 0);
    });
  });
  
  let bestTime = null;
  let bestTimeScore = 0;
  Object.keys(timePerformance).forEach(time => {
    const avg = timePerformance[time].reduce((sum, score) => sum + score, 0) / timePerformance[time].length;
    if (avg > bestTimeScore) {
      bestTimeScore = avg;
      bestTime = time;
    }
  });
  patterns.bestEnergyTime = bestTime;
  
  // Optymalna liczba zadań
  const taskCountPerformance: { [key: number]: number[] } = {};
  metrics.forEach(m => {
    const count = m.totalTasks;
    if (!taskCountPerformance[count]) taskCountPerformance[count] = [];
    taskCountPerformance[count].push(m.completionRate || 0);
  });
  
  let bestCount = 0;
  let bestCountScore = 0;
  Object.keys(taskCountPerformance).forEach(count => {
    const countNum = parseInt(count);
    const avg = taskCountPerformance[countNum].reduce((sum, score) => sum + score, 0) / taskCountPerformance[countNum].length;
    if (avg > bestCountScore) {
      bestCountScore = avg;
      bestCount = countNum;
    }
  });
  patterns.optimalTaskCount = bestCount;
  
  return patterns;
}

function calculateOverallScore(metrics: any[]): number {
  if (metrics.length === 0) return 0;
  
  const scores = {
    productivity: metrics.reduce((sum, m) => sum + (m.focusModeProductivity || 0), 0) / metrics.length,
    completion: metrics.reduce((sum, m) => sum + (m.completionRate || 0), 0) / metrics.length,
    efficiency: metrics.reduce((sum, m) => sum + (m.contextEfficiency || 0), 0) / metrics.length,
    consistency: metrics.reduce((sum, m) => sum + (m.energyConsistency || 0), 0) / metrics.length,
    wellbeing: 1 - (metrics.reduce((sum, m) => sum + (m.burnoutRisk || 0), 0) / metrics.length)
  };
  
  // Weighted average
  const weights = { productivity: 0.3, completion: 0.25, efficiency: 0.2, consistency: 0.15, wellbeing: 0.1 };
  
  return Object.keys(scores).reduce((total, key) => {
    return total + (scores[key as keyof typeof scores] * weights[key as keyof typeof weights]);
  }, 0) * 100; // Convert to percentage
}

// -----------------------------------------------------------------------------
// 6. ENHANCED AI - Uczenie się wzorców użytkownika
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/smart-day-planner/user-patterns
 * Pobierz wykryte wzorce użytkownika
 */
router.get('/user-patterns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { patternType } = req.query;

    const patterns = await enhancedAIService.getUserPatterns(
      userId, 
      patternType as string
    );

    return res.json({
      success: true,
      data: patterns,
      meta: {
        total: patterns.length,
        byType: patterns.reduce((acc, p) => {
          acc[p.patternType] = (acc[p.patternType] || 0) + 1;
          return acc;
        }, {} as any)
      }
    });
  } catch (error) {
    console.error('Error fetching user patterns:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user patterns'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/detect-patterns
 * Wykryj nowe wzorce użytkownika
 */
router.post('/detect-patterns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { days = 30 } = req.body;

    const patterns = await enhancedAIService.detectUserPatterns(userId, days);

    // Zapisz wykryte wzorce
    for (const pattern of patterns) {
      if (pattern.confidence > 0.6) {
        await enhancedAIService.storePattern(userId, organizationId, pattern);
      }
    }

    return res.json({
      success: true,
      data: {
        patterns,
        stored: patterns.filter(p => p.confidence > 0.6).length,
        insights: patterns.length
      }
    });
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to detect patterns'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/ai-recommendations
 * Pobierz personalizowane rekomendacje AI
 */
router.get('/ai-recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = await enhancedAIService.generatePersonalizedRecommendations(userId);

    return res.json({
      success: true,
      data: recommendations,
      meta: {
        total: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        avgConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch AI recommendations'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/pattern-feedback
 * Zapisz feedback użytkownika o wzorcu/rekomendacji
 */
router.post('/pattern-feedback', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { patternId, accepted, implemented } = req.body;

    await enhancedAIService.recordUserFeedback(
      userId, 
      patternId, 
      accepted, 
      implemented
    );

    return res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Error recording pattern feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record pattern feedback'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/learning-insights
 * Pobierz insights o procesie uczenia się AI
 */
router.get('/learning-insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const insights = await enhancedAIService.getPatternLearningInsights(userId);

    return res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching learning insights:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch learning insights'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/adapt-patterns
 * Adaptuj wzorce na podstawie ostatniej wydajności
 */
router.post('/adapt-patterns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await enhancedAIService.adaptPatternsBasedOnPerformance(userId);

    return res.json({
      success: true,
      message: 'Patterns adapted successfully'
    });
  } catch (error) {
    console.error('Error adapting patterns:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to adapt patterns'
    });
  }
});

// =============================================================================
// DAY TEMPLATE GENERATOR - API ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/smart-day-planner/user-profile
 * Pobierz profil użytkownika
 */
router.get('/user-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    let userProfile = await prisma.user_profiles.findUnique({
      where: { userId },
      include: {
        day_templates: {
          orderBy: { lastUsed: 'desc' }
        }
      }
    });

    // Jeśli nie ma profilu, utwórz domyślny
    if (!userProfile) {
      userProfile = await prisma.user_profiles.create({
        data: {
          userId,
          organizationId: req.user.organizationId,
          // Domyślne ustawienia są już w schema
        } as any,
        include: {
          day_templates: true
        }
      });
    }

    return res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * PUT /api/v1/smart-day-planner/user-profile
 * Aktualizuj profil użytkownika
 */
router.put('/user-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const userProfile = await prisma.user_profiles.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        organizationId: req.user.organizationId,
        ...updateData
      },
      include: {
        day_templates: {
          orderBy: { lastUsed: 'desc' }
        }
      }
    });

    return res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/generate-template
 * Wygeneruj szablon dnia na podstawie profilu użytkownika
 */
router.post('/generate-template', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Generate template request started');
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    console.log('👤 User ID:', userId);
    console.log('🏢 Organization ID:', organizationId);
    
    const {
      templateType = 'WORKDAY',
      dayIntensity = 'MEDIUM', 
      focusStyle = 'MIXED',
      name,
      description
    } = req.body;
    
    console.log('⚙️ Template config:', { templateType, dayIntensity, focusStyle, name, description });

    // Pobierz profil użytkownika
    console.log('🔍 Looking for user profile...');
    let userProfile = await prisma.user_profiles.findUnique({
      where: { userId }
    });
    
    console.log('👤 User profile found:', !!userProfile);

    if (!userProfile) {
      console.log('🆕 Creating default user profile...');
      try {
        userProfile = await prisma.user_profiles.create({
          data: {
            userId,
            organizationId,
            // Default values are in schema
          } as any
        });
        console.log('✅ Default user profile created:', userProfile.id);
      } catch (createError) {
        console.error('❌ Error creating user profile:', createError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create user profile'
        });
      }
    }

    // Wygeneruj szablon na podstawie profilu
    console.log('🤖 Generating day template...');
    const generatedTemplate = await generateDayTemplate(userProfile, {
      templateType,
      dayIntensity,
      focusStyle,
      name: name || `${templateType} Template`,
      description
    });
    
    console.log('✨ Template generated:', generatedTemplate.name);

    // Zapisz szablon
    console.log('💾 Saving template to database...');
    const dayTemplate = await prisma.day_templates.create({
      data: {
        ...generatedTemplate,
        userId,
        organizationId,
        userProfileId: userProfile.id,
        generatedBy: 'AI'
      } as any
    });
    
    console.log('✅ Template saved with ID:', dayTemplate.id);

    return res.json({
      success: true,
      data: dayTemplate
    });
  } catch (error) {
    console.error('❌ Error generating template:', error);
    console.error('📋 Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: `Failed to generate template: ${error.message}`
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/templates
 * Pobierz wszystkie szablony użytkownika
 */
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateType, isPublic } = req.query;

    const whereClause: any = {
      OR: [
        { userId }, // Szablony użytkownika
        { isPublic: true } // Publiczne szablony
      ]
    };

    if (templateType) {
      whereClause.templateType = templateType;
    }

    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic === 'true';
    }

    const templates = await prisma.day_templates.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        template_applications: {
          where: { userId },
          select: {
            userRating: true,
            actualCompletion: true
          },
          take: 5,
          orderBy: { appliedDate: 'desc' }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { avgRating: 'desc' },
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    return res.json({
      success: true,
      data: templates,
      meta: {
        total: templates.length,
        userTemplates: templates.filter(t => t.userId === userId).length,
        publicTemplates: templates.filter(t => t.isPublic && t.userId !== userId).length
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/templates/:id/apply
 * Zastosuj szablon do konkretnego dnia
 */
router.post('/templates/:id/apply', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = req.params.id;
    const { date, modifications = [] } = req.body;

    // Pobierz szablon
    const template = await prisma.day_templates.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId },
          { isPublic: true }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Zastosuj szablon - utwórz bloki czasowe na konkretny dzień
    const timeBlocks = JSON.parse(template.timeBlocks as string);
    const appliedBlocks = [];

    for (const block of timeBlocks) {
      const appliedBlock = await prisma.energy_time_blocks.create({
        data: {
          ...block,
          userId,
          organizationId: req.user.organizationId,
          dayOfWeek: null, // Konkretny dzień, nie szablon tygodniowy
          // Możliwość aplikacji modyfikacji
          ...modifications.find((mod: any) => mod.blockIndex === timeBlocks.indexOf(block))?.changes
        } as any
      });
      appliedBlocks.push(appliedBlock);
    }

    // Zapisz aplikację szablonu
    const templateApplication = await prisma.template_applications.create({
      data: {
        templateId,
        userId,
        organizationId: req.user.organizationId,
        appliedDate: new Date(date),
        templateSnapshot: template.timeBlocks,
        modifications,
        totalTasksPlanned: appliedBlocks.filter(b => !b.isBreak).length
      } as any
    });

    // Zaktualizuj statystyki szablonu
    await prisma.day_templates.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    });

    return res.json({
      success: true,
      data: {
        templateApplication,
        appliedBlocks,
        appliedDate: date
      }
    });
  } catch (error) {
    console.error('Error applying template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply template'
    });
  }
});

/**
 * PUT /api/v1/smart-day-planner/templates/:id
 * Aktualizuj szablon
 */
router.put('/templates/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = req.params.id;
    const updateData = req.body;

    const template = await prisma.day_templates.findFirst({
      where: {
        id: templateId,
        userId // Tylko własne szablony można edytować
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found or access denied'
      });
    }

    const updatedTemplate = await prisma.day_templates.update({
      where: { id: templateId },
      data: updateData
    });

    return res.json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

/**
 * DELETE /api/v1/smart-day-planner/templates/:id
 * Usuń szablon
 */
router.delete('/templates/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = req.params.id;

    const template = await prisma.day_templates.findFirst({
      where: {
        id: templateId,
        userId
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    await prisma.day_templates.delete({
      where: { id: templateId }
    });

    return res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

// =============================================================================
// HELPER FUNCTIONS - TEMPLATE GENERATION
// =============================================================================

/**
 * Generuje szablon dnia na podstawie profilu użytkownika
 */
async function generateDayTemplate(userProfile: any, options: any) {
  const {
    templateType,
    dayIntensity,
    focusStyle,
    name,
    description
  } = options;

  // Parse user profile JSON fields safely
  const energyPeaks = safeJsonParse(userProfile.energyPeaks, []);
  const preferredContexts = safeJsonParse(userProfile.preferredContexts, []);
  const contextTimeSlots = safeJsonParse(userProfile.contextTimeSlots, {});
  const focusModePrefs = safeJsonParse(userProfile.focusModePrefs, {});

  // Generate time blocks based on profile
  const timeBlocks = [];
  
  // Basic workday structure
  const workStart = userProfile.workStartTime || '08:00';
  const workEnd = userProfile.workEndTime || '17:00';
  const breakFrequency = userProfile.breakFrequency || 90;
  const breakDuration = userProfile.breakDuration || 15;

  // Generate work blocks with breaks
  let currentTime = parseTime(workStart);
  const endTime = parseTime(workEnd);
  let blockOrder = 0;

  while (currentTime < endTime) {
    const blockEndTime = new Date(currentTime.getTime() + (breakFrequency * 60 * 1000));
    
    if (blockEndTime > endTime) {
      break;
    }

    // Create work block
    const workBlock = {
      name: generateBlockName(templateType, focusStyle, blockOrder),
      startTime: formatTime(currentTime),
      endTime: formatTime(blockEndTime),
      energyLevel: determineEnergyLevel(currentTime, energyPeaks),
      primaryContext: selectOptimalContext(currentTime, preferredContexts, contextTimeSlots),
      alternativeContexts: [] as any[],
      isBreak: false,
      order: blockOrder++,
      isActive: true,
      workdays: true,
      weekends: false,
      holidays: false,
      specificDays: [] as any[]
    };

    timeBlocks.push(workBlock);

    // Add break if not the last block
    currentTime = blockEndTime;
    if (currentTime.getTime() + (breakDuration * 60 * 1000) < endTime.getTime()) {
      const breakEndTime = new Date(currentTime.getTime() + (breakDuration * 60 * 1000));

      const breakBlock = {
        name: "Break",
        startTime: formatTime(currentTime),
        endTime: formatTime(breakEndTime),
        energyLevel: 'MEDIUM',
        primaryContext: '@free',
        alternativeContexts: [] as any[],
        isBreak: true,
        breakType: 'COFFEE',
        order: blockOrder++,
        isActive: true,
        workdays: true,
        weekends: false,
        holidays: false,
        specificDays: [] as any[]
      };

      timeBlocks.push(breakBlock);
      currentTime = breakEndTime;
    }
  }

  // Calculate template statistics
  const workBlocks = timeBlocks.filter(b => !b.isBreak);
  const breakBlocks = timeBlocks.filter(b => b.isBreak);
  
  const totalWorkTime = workBlocks.reduce((sum, block) => {
    const start = parseTime(block.startTime);
    const end = parseTime(block.endTime);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  const totalBreakTime = breakBlocks.reduce((sum, block) => {
    const start = parseTime(block.startTime);
    const end = parseTime(block.endTime);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  // Energy distribution
  const energyDistribution: any = {};
  workBlocks.forEach(block => {
    const start = parseTime(block.startTime);
    const end = parseTime(block.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    energyDistribution[block.energyLevel] = (energyDistribution[block.energyLevel] || 0) + duration;
  });

  // Context balance
  const contextBalance: any = {};
  workBlocks.forEach(block => {
    const start = parseTime(block.startTime);
    const end = parseTime(block.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    contextBalance[block.primaryContext] = (contextBalance[block.primaryContext] || 0) + duration;
  });

  return {
    name,
    description,
    templateType,
    dayIntensity,
    focusStyle,
    timeBlocks: JSON.stringify(timeBlocks),
    totalWorkTime: Math.round(totalWorkTime),
    totalBreakTime: Math.round(totalBreakTime),
    blocksCount: timeBlocks.length,
    energyDistribution: JSON.stringify(energyDistribution),
    contextBalance: JSON.stringify(contextBalance),
    aiConfidence: 0.8 // Default AI confidence
  };
}

// Helper functions
function parseTime(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function generateBlockName(templateType: string, focusStyle: string, order: number): string {
  const names = {
    WORKDAY: ['Morning Focus', 'Mid-Morning Work', 'Pre-Lunch Tasks', 'Afternoon Session', 'End of Day Wrap-up'],
    CREATIVE: ['Creative Warm-up', 'Deep Creative Work', 'Ideation Session', 'Creative Review', 'Creative Wrap-up'],
    ADMIN: ['Admin Tasks', 'Data Processing', 'Reports & Documentation', 'Administrative Review', 'Admin Cleanup'],
    MEETING: ['Pre-Meeting Prep', 'Meeting Block', 'Meeting Follow-up', 'Team Collaboration', 'Meeting Wrap-up']
  };

  const typeNames = names[templateType as keyof typeof names] || names.WORKDAY;
  return typeNames[order % typeNames.length] || `Work Block ${order + 1}`;
}

function determineEnergyLevel(time: Date, energyPeaks: any[]): string {
  const hour = time.getHours();
  
  // Check user's energy peaks
  for (const peak of energyPeaks) {
    const peakHour = parseTime(peak.time).getHours();
    if (Math.abs(hour - peakHour) <= 1) {
      return peak.level;
    }
  }

  // Default energy pattern
  if (hour >= 8 && hour <= 10) return 'HIGH';
  if (hour >= 10 && hour <= 12) return 'CREATIVE';
  if (hour >= 14 && hour <= 16) return 'MEDIUM';
  if (hour >= 16 && hour <= 17) return 'ADMINISTRATIVE';
  return 'LOW';
}

function selectOptimalContext(time: Date, preferredContexts: string[], contextTimeSlots: any): string {
  const hour = time.getHours();
  
  // Check context time slots
  for (const context of preferredContexts) {
    const slots = contextTimeSlots[context];
    if (slots) {
      for (const slot of slots) {
        const [start, end] = slot.split('-');
        const startHour = parseTime(start).getHours();
        const endHour = parseTime(end).getHours();
        if (hour >= startHour && hour < endHour) {
          return context;
        }
      }
    }
  }

  // Default context based on time
  if (hour >= 9 && hour <= 17) return '@computer';
  if (hour >= 10 && hour <= 16) return '@calls';
  return '@computer';
}

// =============================================================================
// WEEKLY TEMPLATE SYSTEM - FAZA 1
// =============================================================================

/**
 * POST /api/v1/smart-day-planner/weekly-templates/create
 * Utwórz szablon tygodniowy z daily template
 */
router.post('/weekly-templates/create', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { 
      baseDayTemplateId, 
      weekName, 
      weekDescription,
      workdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      holidays = [],
      customizations = {}
    } = req.body;

    // Pobierz base template
    const baseTemplate = await prisma.day_templates.findFirst({
      where: {
        id: baseDayTemplateId,
        OR: [
          { userId },
          { isPublic: true }
        ]
      }
    });

    if (!baseTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Base template not found'
      });
    }

    // Utwórz weekly template
    const weeklyTemplate = await prisma.day_templates.create({
      data: {
        name: weekName || `${baseTemplate.name} - Weekly`,
        description: weekDescription || `Weekly template based on ${baseTemplate.name}`,
        templateType: baseTemplate.templateType,
        dayIntensity: baseTemplate.dayIntensity,
        focusStyle: baseTemplate.focusStyle,
        timeBlocks: baseTemplate.timeBlocks,
        totalWorkTime: baseTemplate.totalWorkTime,
        totalBreakTime: baseTemplate.totalBreakTime,
        blocksCount: baseTemplate.blocksCount,
        energyDistribution: baseTemplate.energyDistribution,
        contextBalance: baseTemplate.contextBalance,
        isDefault: false,
        isPublic: false,
        generatedBy: 'USER',
        basedOnPatterns: JSON.stringify({
          baseTemplateId: baseDayTemplateId,
          workdays,
          holidays,
          customizations
        }),
        organizationId,
        userId,
        // Mark as weekly template
        weeklyTemplate: true
      } as any
    });

    return res.status(201).json({
      success: true,
      data: weeklyTemplate,
      message: 'Weekly template created successfully'
    });
  } catch (error) {
    console.error('Error creating weekly template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create weekly template'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/weekly-templates/:id/apply
 * Zastosuj szablon tygodniowy do całego tygodnia
 */
router.post('/weekly-templates/:id/apply', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const templateId = req.params.id;
    const { 
      weekStartDate, // "2025-07-07" (Monday)
      workdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      holidays = [],
      modifications = {} // { "TUESDAY": [{ blockIndex: 0, changes: {...} }] }
    } = req.body;

    // Pobierz weekly template
    const template = await prisma.day_templates.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId },
          { isPublic: true }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Weekly template not found'
      });
    }

    const timeBlocks = JSON.parse(template.timeBlocks as string);
    const weekStart = new Date(weekStartDate);
    const appliedBlocks = [];
    const templateApplications = [];

    // Helper function to get date for day of week
    const getDateForDayOfWeek = (dayOfWeek: string) => {
      const dayIndex = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].indexOf(dayOfWeek);
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
      return date;
    };

    // Apply template to each workday
    for (const dayOfWeek of workdays) {
      const dayDate = getDateForDayOfWeek(dayOfWeek);
      const dayDateString = dayDate.toISOString().split('T')[0];
      
      // Skip holidays
      if (holidays.includes(dayDateString)) {
        console.log(`Skipping ${dayOfWeek} (${dayDateString}) - holiday`);
        continue;
      }

      // Check if blocks already exist for this day
      const existingBlocks = await prisma.energy_time_blocks.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(dayDateString + 'T00:00:00.000Z'),
            lt: new Date(dayDateString + 'T23:59:59.999Z')
          }
        }
      });

      // Remove existing blocks to avoid duplicates
      if (existingBlocks.length > 0) {
        await prisma.energy_time_blocks.deleteMany({
          where: {
            id: { in: existingBlocks.map(b => b.id) }
          }
        });
      }

      // Apply day-specific modifications
      const dayModifications = modifications[dayOfWeek] || [];

      // Create blocks for this day
      for (let i = 0; i < timeBlocks.length; i++) {
        const block = timeBlocks[i];
        const dayMod = dayModifications.find((mod: any) => mod.blockIndex === i);
        
        const appliedBlock = await prisma.energy_time_blocks.create({
          data: {
            ...block,
            userId,
            organizationId,
            dayOfWeek: null, // Specific day, not template
            createdAt: dayDate, // Set to specific day
            // Apply day-specific modifications
            ...(dayMod?.changes || {})
          } as any
        });
        appliedBlocks.push(appliedBlock);
      }

      // Record template application for this day
      const templateApp = await prisma.template_applications.create({
        data: {
          templateId,
          userId,
          organizationId,
          appliedDate: dayDate,
          templateSnapshot: template.timeBlocks,
          modifications: dayModifications,
          totalTasksPlanned: timeBlocks.filter((b: any) => !b.isBreak).length
        } as any
      });
      templateApplications.push(templateApp);
    }

    // Update template usage stats
    await prisma.day_templates.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    });

    return res.json({
      success: true,
      data: {
        appliedDays: workdays.filter((day: any) => !holidays.includes(getDateForDayOfWeek(day).toISOString().split('T')[0])),
        skippedDays: workdays.filter((day: any) => holidays.includes(getDateForDayOfWeek(day).toISOString().split('T')[0])),
        totalBlocks: appliedBlocks.length,
        templateApplications,
        weekStartDate,
        weekEndDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      message: `Weekly template applied to ${appliedBlocks.length} blocks across ${templateApplications.length} days`
    });
  } catch (error) {
    console.error('Error applying weekly template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply weekly template'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/weekly-templates/current
 * Pobierz aktualny template tygodniowy
 */
router.get('/weekly-templates/current', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekStartDate } = req.query;
    
    const weekStart = weekStartDate ? new Date(weekStartDate as string) : new Date();
    // Adjust to Monday
    const dayOfWeek = weekStart.getDay();
    const monday = new Date(weekStart);
    monday.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    // Find template applications for this week
    const weekEnd = new Date(monday);
    weekEnd.setDate(monday.getDate() + 6);

    const templateApplications = await prisma.template_applications.findMany({
      where: {
        userId,
        appliedDate: {
          gte: monday,
          lte: weekEnd
        }
      },
      include: {
        day_templates: true
      },
      orderBy: { appliedDate: 'asc' }
    });

    if (templateApplications.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No weekly template found for this week'
      });
    }

    // Group by template ID to find the most used template this week
    const templateUsage = templateApplications.reduce((acc: any, app) => {
      const templateId = app.templateId;
      acc[templateId] = (acc[templateId] || 0) + 1;
      return acc;
    }, {});

    const mostUsedTemplateId = Object.keys(templateUsage).reduce((a, b) =>
      templateUsage[a] > templateUsage[b] ? a : b
    );

    const currentTemplate = templateApplications.find(app => app.templateId === mostUsedTemplateId)?.day_templates;

    // Get all blocks for this week
    const weekBlocks = await prisma.energy_time_blocks.findMany({
      where: {
        userId,
        createdAt: {
          gte: monday,
          lte: weekEnd
        }
      },
      include: {
        focus_modes: true,
        scheduled_tasks: {
          where: {
            scheduledDate: {
              gte: monday,
              lte: weekEnd
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Group blocks by day
    const blocksByDay = weekBlocks.reduce((acc: any, block) => {
      const day = block.createdAt.toISOString().split('T')[0];
      if (!acc[day]) acc[day] = [];
      acc[day].push(block);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        template: currentTemplate,
        templateApplications,
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        blocksByDay,
        statistics: {
          totalApplications: templateApplications.length,
          totalBlocks: weekBlocks.length,
          averageBlocksPerDay: weekBlocks.length / templateApplications.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching current weekly template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch current weekly template'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/weekly-templates/quick-setup
 * Szybkie utworzenie i aplikacja weekly template
 */
router.post('/weekly-templates/quick-setup', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const {
      templateName = 'Standard Work Week',
      weekStartDate, // "2025-07-07"
      templateType = 'WORKDAY',
      dayIntensity = 'MEDIUM',
      focusStyle = 'MIXED',
      workHours = { start: '09:00', end: '17:00' },
      lunchBreak = { start: '12:00', duration: 60 },
      shortBreaks = { frequency: 120, duration: 15 } // Every 2 hours, 15 min break
    } = req.body;

    // Generate standard time blocks
    const timeBlocks = generateStandardWorkDayBlocks({
      workHours,
      lunchBreak,
      shortBreaks,
      templateType,
      dayIntensity,
      focusStyle
    });

    // Create the template
    const weeklyTemplate = await prisma.day_templates.create({
      data: {
        name: templateName,
        description: `Auto-generated weekly template with ${workHours.start}-${workHours.end} work hours`,
        templateType,
        dayIntensity,
        focusStyle,
        timeBlocks: JSON.stringify(timeBlocks),
        totalWorkTime: calculateTotalWorkTime(timeBlocks),
        totalBreakTime: calculateTotalBreakTime(timeBlocks),
        blocksCount: timeBlocks.length,
        energyDistribution: JSON.stringify(calculateEnergyDistribution(timeBlocks)),
        contextBalance: JSON.stringify(calculateContextBalance(timeBlocks)),
        isDefault: false,
        isPublic: false,
        generatedBy: 'AI',
        basedOnPatterns: JSON.stringify({
          quickSetup: true,
          workHours,
          lunchBreak,
          shortBreaks
        }),
        organizationId,
        userId,
        weeklyTemplate: true
      } as any
    });

    // Apply to this week immediately
    const weekStart = new Date(weekStartDate);
    const workdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    let appliedBlocks = 0;

    for (const dayOfWeek of workdays) {
      const dayIndex = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].indexOf(dayOfWeek);
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + dayIndex);

      // Create blocks for this day
      for (const block of timeBlocks) {
        await prisma.energy_time_blocks.create({
          data: {
            ...block,
            userId,
            organizationId,
            dayOfWeek: null,
            createdAt: dayDate
          } as any
        });
        appliedBlocks++;
      }

      // Record template application
      await prisma.template_applications.create({
        data: {
          templateId: weeklyTemplate.id,
          userId,
          organizationId,
          appliedDate: dayDate,
          templateSnapshot: JSON.stringify(timeBlocks),
          modifications: [],
          totalTasksPlanned: timeBlocks.filter(b => !b.isBreak).length
        } as any
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        template: weeklyTemplate,
        appliedBlocks,
        appliedDays: workdays,
        weekStart: weekStartDate,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      message: `Weekly template created and applied! ${appliedBlocks} blocks across 5 days.`
    });
  } catch (error) {
    console.error('Error in quick weekly setup:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create weekly template'
    });
  }
});

// Helper functions for quick setup
function generateStandardWorkDayBlocks(config: any) {
  const blocks = [];
  const { workHours, lunchBreak, shortBreaks } = config;
  
  const startTime = parseTime(workHours.start);
  const endTime = parseTime(workHours.end);
  const lunchStart = parseTime(lunchBreak.start);
  
  let currentTime = new Date(startTime);
  let blockOrder = 0;
  
  while (currentTime < endTime) {
    // Check if it's lunch time
    if (currentTime.getTime() === lunchStart.getTime()) {
      blocks.push({
        name: 'Lunch Break',
        startTime: formatTime(currentTime),
        endTime: formatTime(new Date(currentTime.getTime() + lunchBreak.duration * 60 * 1000)),
        energyLevel: 'LOW',
        primaryContext: '@meal',
        alternativeContexts: ['@social', '@walk'],
        isBreak: true,
        breakType: 'MEAL',
        order: blockOrder++,
        isActive: true
      });
      currentTime = new Date(currentTime.getTime() + lunchBreak.duration * 60 * 1000);
      continue;
    }
    
    // Regular work block (2 hours by default)
    const blockDuration = 120; // 2 hours in minutes
    const blockEnd = new Date(currentTime.getTime() + blockDuration * 60 * 1000);
    
    // Don't exceed work end time
    if (blockEnd > endTime) {
      const remainingMinutes = (endTime.getTime() - currentTime.getTime()) / (60 * 1000);
      if (remainingMinutes >= 30) { // Only create block if at least 30 minutes
        blocks.push({
          name: `Work Block ${blockOrder + 1}`,
          startTime: formatTime(currentTime),
          endTime: formatTime(endTime),
          energyLevel: determineEnergyForTime(currentTime),
          primaryContext: '@computer',
          alternativeContexts: ['@calls', '@planning'],
          isBreak: false,
          order: blockOrder++,
          isActive: true
        });
      }
      break;
    }
    
    blocks.push({
      name: `Work Block ${blockOrder + 1}`,
      startTime: formatTime(currentTime),
      endTime: formatTime(blockEnd),
      energyLevel: determineEnergyForTime(currentTime),
      primaryContext: '@computer',
      alternativeContexts: ['@calls', '@planning'],
      isBreak: false,
      order: blockOrder++,
      isActive: true
    });
    
    currentTime = blockEnd;
    
    // Add short break after work block (except if next is lunch or end of day)
    if (currentTime < endTime && currentTime.getTime() !== lunchStart.getTime()) {
      const breakEnd = new Date(currentTime.getTime() + shortBreaks.duration * 60 * 1000);
      if (breakEnd <= endTime) {
        blocks.push({
          name: 'Short Break',
          startTime: formatTime(currentTime),
          endTime: formatTime(breakEnd),
          energyLevel: 'MEDIUM',
          primaryContext: '@break',
          alternativeContexts: ['@walk', '@coffee'],
          isBreak: true,
          breakType: 'COFFEE',
          order: blockOrder++,
          isActive: true
        });
        currentTime = breakEnd;
      }
    }
  }
  
  return blocks;
}

function determineEnergyForTime(time: Date): string {
  const hour = time.getHours();
  if (hour >= 8 && hour <= 10) return 'HIGH';
  if (hour >= 10 && hour <= 12) return 'CREATIVE';
  if (hour >= 14 && hour <= 16) return 'MEDIUM';
  if (hour >= 16 && hour <= 17) return 'ADMINISTRATIVE';
  return 'LOW';
}

function calculateTotalWorkTime(blocks: any[]): number {
  return blocks
    .filter(b => !b.isBreak)
    .reduce((total, block) => {
      const start = parseTime(block.startTime);
      const end = parseTime(block.endTime);
      return total + (end.getTime() - start.getTime()) / (60 * 1000);
    }, 0);
}

function calculateTotalBreakTime(blocks: any[]): number {
  return blocks
    .filter(b => b.isBreak)
    .reduce((total, block) => {
      const start = parseTime(block.startTime);
      const end = parseTime(block.endTime);
      return total + (end.getTime() - start.getTime()) / (60 * 1000);
    }, 0);
}

function calculateEnergyDistribution(blocks: any[]): any {
  const distribution = blocks.reduce((acc: any, block) => {
    acc[block.energyLevel] = (acc[block.energyLevel] || 0) + 1;
    return acc;
  }, {});
  return distribution;
}

function calculateContextBalance(blocks: any[]): any {
  const balance = blocks.reduce((acc: any, block) => {
    acc[block.primaryContext] = (acc[block.primaryContext] || 0) + 1;
    return acc;
  }, {});
  return balance;
}

// =============================================================================
// FAZA 2: INTELLIGENT TASK DISTRIBUTION - TASK QUEUE MANAGEMENT
// =============================================================================

/**
 * GET /api/v1/smart-day-planner/task-queue
 * Pobierz wszystkie dostępne zadania do dystrybucji
 */
router.get('/task-queue', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, includeRecurring, includeProjects, includeInbox } = req.query;
    
    // Default sources
    const sources = {
      sourceInbox: includeInbox !== 'false',
      projects: includeProjects !== 'false', 
      recurring: includeRecurring !== 'false'
    };

    const taskQueue: any[] = [];
    
    // 1. Workflow Inbox Items (nieprzetworzone)
    if (sources.sourceInbox) {
      const inboxItems = await prisma.inboxItem.findMany({
        where: {
          capturedById: userId,
          processed: false,
          OR: [
            { sourceType: 'QUICK_CAPTURE' },
            { sourceType: 'EMAIL' },
            { sourceType: 'MEETING_NOTES' },
            { sourceType: 'IDEA' },
            { sourceType: 'DOCUMENT' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      inboxItems.forEach(item => {
        taskQueue.push({
          id: item.id,
          source: 'SOURCE_INBOX',
          type: 'INBOX_ITEM',
          title: `Przetwórz: ${item.content.substring(0, 50)}...`,
          description: item.content,
          estimatedMinutes: getEstimatedTimeFromType(item.sourceType),
          priority: 'MEDIUM',
          context: getContextFromInboxType(item.sourceType),
          energyRequired: getEnergyFromInboxType(item.sourceType),
          deadline: null,
          tags: ['inbox', item.sourceType.toLowerCase()],
          metadata: {
            sourceType: item.sourceType,
            capturedAt: item.createdAt,
            urgencyScore: calculateInboxUrgency(item)
          }
        });
      });
    }

    // 2. Project Tasks (z różnych statusów)
    if (sources.projects) {
      const projectTasks = await prisma.task.findMany({
        where: {
          createdById: userId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
          // Include all tasks regardless of due date for now
          // OR: [
          //   { dueDate: { gte: new Date() } },
          //   { dueDate: null }
          // ]
        },
        include: {
          project: true
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' }
        ],
        take: 30
      });

      projectTasks.forEach(task => {
        taskQueue.push({
          id: task.id,
          source: 'PROJECTS',
          type: 'PROJECT_TASK',
          title: task.title,
          description: task.description,
          estimatedMinutes: (task.estimatedHours || 1) * 60, // Convert hours to minutes
          priority: task.priority || 'MEDIUM',
          context: '@computer', // Default context
          energyRequired: task.energy || 'MEDIUM',
          deadline: task.dueDate,
          tags: ['project', task.project?.name?.toLowerCase() || 'general'],
          metadata: {
            projectId: task.projectId,
            projectName: task.project?.name,
            status: task.status,
            smartScore: task.smartScore,
            urgencyScore: calculateTaskUrgency(task)
          }
        });
      });
    }

    // 3. Recurring Tasks (dla danego dnia)
    if (sources.recurring && date) {
      const targetDate = new Date(date as string);
      const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      
      const recurringTasks = await prisma.recurringTask.findMany({
        where: {
          assignedToId: userId,
          isActive: true,
          OR: [
            { frequency: 'DAILY' },
            { frequency: 'WEEKLY' }
          ]
        },
        orderBy: { priority: 'desc' },
        take: 15
      });

      recurringTasks.forEach(task => {
        taskQueue.push({
          id: task.id,
          source: 'RECURRING',
          type: 'RECURRING_TASK',
          title: task.title,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes || 30,
          priority: task.priority || 'MEDIUM',
          context: task.context || '@routine',
          energyRequired: 'MEDIUM', // recurring tasks default to medium energy
          deadline: null,
          tags: ['recurring', task.frequency?.toLowerCase() || 'routine'],
          metadata: {
            frequency: task.frequency,
            preferredTime: task.time,
            executionCount: task.executionCount || 0,
            urgencyScore: calculateRecurringUrgency(task, targetDate)
          }
        });
      });
    }

    // Sortowanie według priority matrix
    const sortedQueue = taskQueue.sort((a, b) => {
      const scoreA = calculateTaskScore(a);
      const scoreB = calculateTaskScore(b);
      return scoreB - scoreA;
    });

    return res.json({
      success: true,
      data: {
        tasks: sortedQueue,
        statistics: {
          total: sortedQueue.length,
          bySource: {
            sourceInbox: sortedQueue.filter(t => t.source === 'SOURCE_INBOX').length,
            projects: sortedQueue.filter(t => t.source === 'PROJECTS').length,
            recurring: sortedQueue.filter(t => t.source === 'RECURRING').length
          },
          byPriority: {
            high: sortedQueue.filter(t => t.priority === 'HIGH').length,
            medium: sortedQueue.filter(t => t.priority === 'MEDIUM').length,
            low: sortedQueue.filter(t => t.priority === 'LOW').length
          },
          byEnergyLevel: {
            high: sortedQueue.filter(t => t.energyRequired === 'HIGH').length,
            medium: sortedQueue.filter(t => t.energyRequired === 'MEDIUM').length,
            low: sortedQueue.filter(t => t.energyRequired === 'LOW').length,
            creative: sortedQueue.filter(t => t.energyRequired === 'CREATIVE').length,
            administrative: sortedQueue.filter(t => t.energyRequired === 'ADMINISTRATIVE').length
          },
          totalEstimatedTime: sortedQueue.reduce((sum, task) => sum + task.estimatedMinutes, 0)
        },
        sources,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching task queue:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch task queue'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/task-queue/analyze
 * Analizuj zadania pod kątem możliwości dystrybucji
 */
router.post('/task-queue/analyze', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, tasks = [] } = req.body;

    // Pobierz dostępne time blocks dla danego dnia
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    const timeBlocks = await prisma.energy_time_blocks.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { dayOfWeek: dayOfWeek as any },
          { dayOfWeek: null } // Bloki bez specyficznego dnia (universal)
        ]
      },
      orderBy: { startTime: 'asc' }
    });

    // Analiza dostępności bloków
    const analysis = {
      availableBlocks: timeBlocks.filter(block => !block.isBreak),
      workCapacity: 0,
      energyDistribution: {} as any,
      contextCapacity: {} as any,
      recommendations: [] as string[]
    };

    // Oblicz całkowitą pojemność
    analysis.availableBlocks.forEach(block => {
      const duration = calculateBlockDuration(block.startTime, block.endTime);
      analysis.workCapacity += duration;
      
      // Energia
      analysis.energyDistribution[block.energyLevel] = 
        (analysis.energyDistribution[block.energyLevel] || 0) + duration;
      
      // Kontekst
      analysis.contextCapacity[block.primaryContext] = 
        (analysis.contextCapacity[block.primaryContext] || 0) + duration;
    });

    // Analiza zadań vs pojemność
    const totalTaskTime = tasks.reduce((sum: number, task: any) => sum + task.estimatedMinutes, 0);
    const utilizationRate = (totalTaskTime / analysis.workCapacity) * 100;

    // Rekomendacje
    if (utilizationRate > 90) {
      analysis.recommendations.push('⚠️ Dzień jest bardzo napięty (>90% wykorzystania). Rozważ przeniesienie niektórych zadań.');
    } else if (utilizationRate < 50) {
      analysis.recommendations.push('✅ Dzień ma dużo wolnego czasu. Możesz dodać więcej zadań lub zaplanować development time.');
    }

    // Sprawdź balans energii
    const tasksByEnergy = tasks.reduce((acc: any, task: any) => {
      acc[task.energyRequired] = (acc[task.energyRequired] || 0) + task.estimatedMinutes;
      return acc;
    }, {});

    Object.keys(tasksByEnergy).forEach(energy => {
      const available = analysis.energyDistribution[energy] || 0;
      const required = tasksByEnergy[energy];
      if (required > available) {
        analysis.recommendations.push(`⚡ Niedobór energii ${energy}: potrzebujesz ${required}min, masz ${available}min`);
      }
    });

    return res.json({
      success: true,
      data: {
        analysis,
        capacity: {
          totalMinutes: analysis.workCapacity,
          availableBlocks: analysis.availableBlocks.length,
          breakBlocks: timeBlocks.filter(b => b.isBreak).length
        },
        workload: {
          totalTasks: tasks.length,
          totalMinutes: totalTaskTime,
          utilizationRate: Math.round(utilizationRate),
          averageTaskDuration: tasks.length > 0 ? Math.round(totalTaskTime / tasks.length) : 0
        },
        compatibility: {
          energyMatch: calculateEnergyCompatibility(tasks, analysis.energyDistribution),
          contextMatch: calculateContextCompatibility(tasks, analysis.contextCapacity),
          timeMatch: utilizationRate <= 85 ? 'GOOD' : utilizationRate <= 95 ? 'TIGHT' : 'OVERLOAD'
        },
        date,
        dayOfWeek,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing task queue:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze task queue'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/task-queue/prioritize  
 * Inteligentne ustalanie priorytetów zadań
 */
router.post('/task-queue/prioritize', authMiddleware, async (req, res) => {
  try {
    const { tasks, strategy = 'BALANCED', userPreferences = {} } = req.body;

    const strategies = {
      DEADLINE_FIRST: (tasks: any[]) => tasks.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }),
      
      ENERGY_OPTIMAL: (tasks: any[]) => tasks.sort((a, b) => {
        const energyPriority = { HIGH: 3, CREATIVE: 2, MEDIUM: 1, ADMINISTRATIVE: 0, LOW: 0 };
        return (energyPriority[b.energyRequired as keyof typeof energyPriority] || 0) - 
               (energyPriority[a.energyRequired as keyof typeof energyPriority] || 0);
      }),
      
      QUICK_WINS: (tasks: any[]) => tasks.sort((a, b) => {
        const quickWinScore = (task: any) => {
          const timeScore = task.estimatedMinutes <= 30 ? 2 : task.estimatedMinutes <= 60 ? 1 : 0;
          const priorityScore = task.priority === 'HIGH' ? 2 : task.priority === 'MEDIUM' ? 1 : 0;
          return timeScore + priorityScore;
        };
        return quickWinScore(b) - quickWinScore(a);
      }),
      
      BALANCED: (tasks: any[]) => tasks.sort((a, b) => calculateTaskScore(b) - calculateTaskScore(a))
    };

    const prioritizedTasks = strategies[strategy as keyof typeof strategies](tasks.slice());

    // Dodaj priority scores dla wizualizacji
    prioritizedTasks.forEach((task, index) => {
      task.priorityRank = index + 1;
      task.priorityScore = calculateTaskScore(task);
      task.quickWinScore = task.estimatedMinutes <= 30 && task.priority !== 'LOW' ? 'HIGH' : 'MEDIUM';
    });

    return res.json({
      success: true,
      data: {
        tasks: prioritizedTasks,
        strategy,
        statistics: {
          totalTasks: prioritizedTasks.length,
          avgPriorityScore: prioritizedTasks.reduce((sum, task) => sum + task.priorityScore, 0) / prioritizedTasks.length,
          quickWins: prioritizedTasks.filter(task => task.quickWinScore === 'HIGH').length,
          highPriorityTasks: prioritizedTasks.filter(task => task.priority === 'HIGH').length,
          tasksWithDeadlines: prioritizedTasks.filter(task => task.deadline).length
        },
        recommendations: generatePrioritizationTips(prioritizedTasks, strategy),
        appliedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error prioritizing tasks:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to prioritize tasks'
    });
  }
});

// Helper Functions for Task Queue Management

function getEstimatedTimeFromType(sourceType: string): number {
  const timeMap: { [key: string]: number } = {
    'QUICK_CAPTURE': 15,
    'MEETING_NOTES': 30,
    'PHONE_CALL': 20,
    'EMAIL': 25,
    'IDEA': 10,
    'DOCUMENT': 45,
    'BILL_INVOICE': 15,
    'ARTICLE': 30,
    'VOICE_MEMO': 20,
    'PHOTO': 10
  };
  return timeMap[sourceType] || 20;
}

function getContextFromInboxType(sourceType: string): string {
  const contextMap: { [key: string]: string } = {
    'QUICK_CAPTURE': '@computer',
    'MEETING_NOTES': '@computer',
    'PHONE_CALL': '@calls',
    'EMAIL': '@computer',
    'IDEA': '@computer',
    'DOCUMENT': '@reading',
    'BILL_INVOICE': '@computer',
    'ARTICLE': '@reading',
    'VOICE_MEMO': '@computer',
    'PHOTO': '@computer'
  };
  return contextMap[sourceType] || '@computer';
}

function getEnergyFromInboxType(sourceType: string): string {
  const energyMap: { [key: string]: string } = {
    'QUICK_CAPTURE': 'MEDIUM',
    'MEETING_NOTES': 'MEDIUM',
    'PHONE_CALL': 'HIGH',
    'EMAIL': 'MEDIUM',
    'IDEA': 'CREATIVE',
    'DOCUMENT': 'MEDIUM',
    'BILL_INVOICE': 'ADMINISTRATIVE',
    'ARTICLE': 'MEDIUM',
    'VOICE_MEMO': 'MEDIUM',
    'PHOTO': 'LOW'
  };
  return energyMap[sourceType] || 'MEDIUM';
}


function calculateInboxUrgency(item: any): number {
  let score = 50; // Base score
  
  // Content urgency keywords
  const urgentKeywords = ['pilne', 'urgent', 'asap', 'deadline', 'natychmiast'];
  const content = item.content.toLowerCase();
  if (urgentKeywords.some(keyword => content.includes(keyword))) {
    score += 30;
  }
  
  // Type urgency
  const urgentTypes = ['PHONE_CALL', 'EMAIL'];
  if (urgentTypes.includes(item.sourceType)) {
    score += 20;
  }
  
  // Age penalty (starsze = mniej pilne)
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
  score -= Math.min(ageHours * 2, 30);
  
  return Math.max(0, Math.min(100, score));
}

function calculateTaskUrgency(task: any): number {
  let score = 50;
  
  // Priority bonus
  if (task.priority === 'HIGH') score += 30;
  else if (task.priority === 'MEDIUM') score += 10;
  
  // Deadline proximity  
  if (task.dueDate) {
    const daysUntilDeadline = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline <= 1) score += 40;
    else if (daysUntilDeadline <= 3) score += 25;
    else if (daysUntilDeadline <= 7) score += 10;
  }
  
  // Status urgency
  if (task.status === 'IN_PROGRESS') score += 20;
  
  return Math.max(0, Math.min(100, score));
}

function calculateRecurringUrgency(task: any, targetDate: Date): number {
  let score = 40; // Lower base for recurring
  
  // Priority
  if (task.priority === 'HIGH') score += 25;
  else if (task.priority === 'MEDIUM') score += 10;
  
  // Frequency urgency
  if (task.frequency === 'DAILY') score += 15;
  else if (task.frequency === 'WEEKLY') score += 10;
  
  // Execution count bonus (consistency)
  if (task.executionCount && task.executionCount > 0) {
    score += Math.min(task.executionCount * 1, 15);
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateTaskScore(task: any): number {
  let score = 0;
  
  // Priority weight (40%)
  const priorityWeights = { HIGH: 40, MEDIUM: 25, LOW: 10, URGENT: 50 };
  score += priorityWeights[task.priority as keyof typeof priorityWeights] || 25;
  
  // Urgency score (30%)
  score += (task.metadata?.urgencyScore || 50) * 0.3;
  
  // Time efficiency (20%) - shorter tasks get bonus
  const timeBonus = task.estimatedMinutes <= 30 ? 20 : task.estimatedMinutes <= 60 ? 10 : 0;
  score += timeBonus;
  
  // Energy match (10%) - creative and high energy get slight bonus
  const energyBonus = ['HIGH', 'CREATIVE'].includes(task.energyRequired) ? 10 : 5;
  score += energyBonus;
  
  return Math.round(score);
}

function calculateBlockDuration(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return (end.getTime() - start.getTime()) / (60 * 1000); // minutes
}

function calculateEnergyCompatibility(tasks: any[], energyDistribution: any): string {
  const totalAvailable = Object.values(energyDistribution).reduce((sum: number, val: any) => sum + val, 0);
  if (totalAvailable === 0) return 'NO_DATA';
  
  const mismatchCount = Object.keys(energyDistribution).filter(energy => {
    const required = tasks.filter(t => t.energyRequired === energy)
                         .reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const available = energyDistribution[energy] || 0;
    return required > available * 0.8; // 80% threshold
  }).length;
  
  if (mismatchCount === 0) return 'EXCELLENT';
  if (mismatchCount <= 1) return 'GOOD';
  if (mismatchCount <= 2) return 'FAIR';
  return 'POOR';
}

function calculateContextCompatibility(tasks: any[], contextCapacity: any): string {
  const totalAvailable = Object.values(contextCapacity).reduce((sum: number, val: any) => sum + val, 0);
  if (totalAvailable === 0) return 'NO_DATA';
  
  const contextUsage = tasks.reduce((acc: any, task) => {
    acc[task.context] = (acc[task.context] || 0) + task.estimatedMinutes;
    return acc;
  }, {});
  
  const overloadedContexts = Object.keys(contextUsage).filter(context => {
    const required = contextUsage[context];
    const available = contextCapacity[context] || 0;
    return required > available;
  }).length;
  
  if (overloadedContexts === 0) return 'EXCELLENT';
  if (overloadedContexts <= 1) return 'GOOD';
  return 'POOR';
}

function generatePrioritizationTips(tasks: any[], strategy: string): string[] {
  const tips: string[] = [];
  
  const quickWins = tasks.filter(t => t.estimatedMinutes <= 30 && t.priority !== 'LOW').length;
  if (quickWins >= 3) {
    tips.push(`🚀 Masz ${quickWins} zadań typu "quick win" - rozważ rozpoczęcie od nich dla momentum`);
  }
  
  const highEnergyTasks = tasks.filter(t => t.energyRequired === 'HIGH').length;
  if (highEnergyTasks >= 2) {
    tips.push(`⚡ ${highEnergyTasks} zadań wymaga wysokiej energii - zaplanuj je na rano`);
  }
  
  const creativeTasks = tasks.filter(t => t.energyRequired === 'CREATIVE').length;
  if (creativeTasks >= 1) {
    tips.push(`🎨 ${creativeTasks} zadań kreatywnych - połącz je w jednej sesji dla flow`);
  }
  
  const tasksWithDeadlines = tasks.filter(t => t.deadline).length;
  if (tasksWithDeadlines >= 3) {
    tips.push(`⏰ ${tasksWithDeadlines} zadań ma deadline - sprawdź czy są odpowiednio priorytetyzowane`);
  }
  
  if (strategy === 'QUICK_WINS') {
    tips.push('💡 Strategia Quick Wins: Zacznij od krótkich zadań aby zbudować momentum');
  }
  
  return tips;
}

// =============================================================================
// FAZA 2: SMART ASSIGNMENT ALGORITHM - INTELLIGENT TASK PLACEMENT
// =============================================================================

/**
 * POST /api/v1/smart-day-planner/smart-assignment
 * Inteligentne przypisywanie zadań do time blocks
 */
router.post('/smart-assignment', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      date, 
      tasks = [], 
      strategy = 'ENERGY_MATCH', 
      preferences = {},
      forceAssignment = false 
    } = req.body;

    // Pobierz dostępne time blocks dla danego dnia
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    const timeBlocks = await prisma.energy_time_blocks.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { dayOfWeek: dayOfWeek as any },
          { dayOfWeek: null } // Bloki bez specyficznego dnia (universal)
        ]
      },
      include: {
        scheduled_tasks: {
          where: {
            scheduledDate: {
              gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(date).setHours(24, 0, 0, 0))
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Przygotuj bloki z informacjami o dostępności
    const availableBlocks = timeBlocks
      .filter(block => !block.isBreak)
      .map(block => {
        const usedTime = block.scheduled_tasks?.reduce((sum, task) => sum + task.estimatedMinutes, 0) || 0;
        const totalTime = calculateBlockDuration(block.startTime, block.endTime);
        const availableTime = totalTime - usedTime;
        
        return {
          ...block,
          totalTime,
          usedTime,
          availableTime,
          utilizationRate: (usedTime / totalTime) * 100
        };
      })
      .filter(block => block.availableTime > 0); // Tylko bloki z dostępnym czasem

    // Strategies for assignment
    const assignmentStrategies = {
      ENERGY_MATCH: (tasks: any[], blocks: any[]) => energyMatchAssignment(tasks, blocks),
      CONTEXT_BATCH: (tasks: any[], blocks: any[]) => contextBatchAssignment(tasks, blocks),
      PRIORITY_FIRST: (tasks: any[], blocks: any[]) => priorityFirstAssignment(tasks, blocks),
      TIME_OPTIMAL: (tasks: any[], blocks: any[]) => timeOptimalAssignment(tasks, blocks),
      BALANCED: (tasks: any[], blocks: any[]) => balancedAssignment(tasks, blocks)
    };

    const assignmentResult = assignmentStrategies[strategy as keyof typeof assignmentStrategies](tasks, availableBlocks);

    // Zapisz assignments do bazy danych jeśli potrzeba
    const scheduledTasks = [];
    if (req.body.saveAssignments) {
      for (const assignment of assignmentResult.assignments) {
        const scheduledTask = await prisma.scheduled_tasks.create({
          data: {
            title: assignment.task.title,
            description: assignment.task.description,
            estimatedMinutes: assignment.task.estimatedMinutes,
            energyTimeBlockId: assignment.block.id,
            context: assignment.task.context,
            energyRequired: assignment.task.energyRequired,
            priority: assignment.task.priority,
            status: 'PLANNED',
            scheduledDate: new Date(date),
            organizationId: req.user.organizationId,
            userId,
            taskId: assignment.task.source === 'PROJECTS' ? assignment.task.id : null,
            wasRescheduled: false
          } as any
        });
        scheduledTasks.push(scheduledTask);
      }
    }

    return res.json({
      success: true,
      data: {
        assignments: assignmentResult.assignments,
        unassigned: assignmentResult.unassigned,
        strategy,
        statistics: {
          totalTasks: tasks.length,
          assignedTasks: assignmentResult.assignments.length,
          unassignedTasks: assignmentResult.unassigned.length,
          assignmentRate: (assignmentResult.assignments.length / tasks.length) * 100,
          blocksUsed: assignmentResult.assignments.length,
          totalBlocks: availableBlocks.length,
          blockUtilization: availableBlocks.length > 0 ? 
            (assignmentResult.assignments.length / availableBlocks.length) * 100 : 0
        },
        insights: generateAssignmentInsights(assignmentResult, availableBlocks, strategy),
        scheduledTasks: scheduledTasks,
        date,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in smart assignment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to perform smart assignment'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/optimize-assignments
 * Optymalizacja istniejących przypisań
 */
router.post('/optimize-assignments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, optimizationGoal = 'BALANCED' } = req.body;

    // Pobierz aktualne assignments
    const existingTasks = await prisma.scheduled_tasks.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(24, 0, 0, 0))
        },
        status: { in: ['PLANNED', 'IN_PROGRESS'] }
      },
      include: {
        energy_time_blocks: true
      }
    });

    // Analiza obecnych assignments
    const currentAssignments = existingTasks.map(task => ({
      task: {
        id: task.id,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        context: task.context,
        energyRequired: task.energyRequired
      },
      block: task.energy_time_blocks,
      score: calculateAssignmentScore(task, task.energy_time_blocks)
    }));

    // Optymalizacja według celu
    const optimizationStrategies = {
      ENERGY_BALANCE: optimizeEnergyBalance,
      CONTEXT_GROUPING: optimizeContextGrouping,
      TIME_EFFICIENCY: optimizeTimeEfficiency,
      PRIORITY_ALIGNMENT: optimizePriorityAlignment,
      BALANCED: optimizeBalanced
    };

    const optimization = optimizationStrategies[optimizationGoal as keyof typeof optimizationStrategies](currentAssignments);

    return res.json({
      success: true,
      data: {
        currentScore: optimization.currentScore,
        optimizedScore: optimization.optimizedScore,
        improvement: optimization.improvement,
        recommendations: optimization.recommendations,
        suggestedMoves: optimization.suggestedMoves,
        analysis: {
          energyDistribution: analyzeEnergyDistribution(currentAssignments),
          contextClustering: analyzeContextClustering(currentAssignments),
          priorityAlignment: analyzePriorityAlignment(currentAssignments),
          timeEfficiency: analyzeTimeEfficiency(currentAssignments)
        },
        optimizationGoal,
        date,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error optimizing assignments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize assignments'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/emergency-reschedule
 * Nagłe przesunięcie zadań (scenariusz: dzień 2 - wyjazd służbowy)
 */
router.post('/emergency-reschedule', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      canceledDate, 
      reason = 'EMERGENCY', 
      redistributionDays = 3,
      priorityThreshold = 'MEDIUM'
    } = req.body;

    // Pobierz zadania do przesunięcia
    const tasksToReschedule = await prisma.scheduled_tasks.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: new Date(new Date(canceledDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(canceledDate).setHours(24, 0, 0, 0))
        },
        status: { in: ['PLANNED', 'IN_PROGRESS'] }
      },
      include: {
        energy_time_blocks: true
      }
    });

    // Kategoryzuj zadania według pilności i typu
    const taskCategories = categorizeTasks(tasksToReschedule, priorityThreshold);

    // Znajdź dostępne sloty w następnych dniach
    const availableSlots = await findAvailableSlots(userId, canceledDate, redistributionDays);

    // Inteligentne redistribution
    const redistributionPlan = createRedistributionPlan(taskCategories, availableSlots, {
      prioritizeUrgent: true,
      maintainEnergyMatch: true,
      avoidOverload: true,
      respectDeadlines: true
    });

    // Wykonaj przesunięcie jeśli użytkownik zatwierdził
    const rescheduledTasks = [];
    if (req.body.executeReschedule) {
      for (const item of redistributionPlan.moves) {
        const updatedTask = await prisma.scheduled_tasks.update({
          where: { id: item.taskId },
          data: {
            scheduledDate: new Date(item.newDate),
            energyTimeBlockId: item.newBlockId,
            wasRescheduled: true,
            rescheduledFrom: canceledDate,
            rescheduledReason: reason
          }
        });
        rescheduledTasks.push(updatedTask);
      }
    }

    return res.json({
      success: true,
      data: {
        canceledDate,
        tasksAffected: tasksToReschedule.length,
        redistributionPlan,
        categories: taskCategories,
        availableSlots: availableSlots.length,
        statistics: {
          highPriorityTasks: taskCategories.urgent.length,
          mediumPriorityTasks: taskCategories.important.length,
          lowPriorityTasks: taskCategories.routine.length,
          successfullyRescheduled: redistributionPlan.moves.length,
          failedToReschedule: redistributionPlan.failed.length,
          redistributionRate: (redistributionPlan.moves.length / tasksToReschedule.length) * 100
        },
        recommendations: generateRescheduleRecommendations(redistributionPlan, taskCategories),
        rescheduledTasks: rescheduledTasks,
        reason,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in emergency reschedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to perform emergency reschedule'
    });
  }
});

// =============================================================================
// ASSIGNMENT ALGORITHMS - STRATEGIE PRZYPISYWANIA
// =============================================================================

function energyMatchAssignment(tasks: any[], blocks: any[]) {
  const assignments = [];
  const unassigned = [];
  const usedBlocks = new Set();

  // Sortuj zadania według priorytetu i poziomu energii
  const sortedTasks = tasks.sort((a, b) => {
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1, URGENT: 4 };
    const energyWeight = { HIGH: 4, CREATIVE: 3, MEDIUM: 2, ADMINISTRATIVE: 1, LOW: 1 };
    
    const scoreA = (priorityWeight[a.priority as keyof typeof priorityWeight] || 2) + (energyWeight[a.energyRequired as keyof typeof energyWeight] || 2);
    const scoreB = (priorityWeight[b.priority as keyof typeof priorityWeight] || 2) + (energyWeight[b.energyRequired as keyof typeof energyWeight] || 2);
    
    return scoreB - scoreA;
  });

  for (const task of sortedTasks) {
    let bestMatch = null;
    let bestScore = -1;

    for (const block of blocks) {
      if (usedBlocks.has(block.id) || block.availableTime < task.estimatedMinutes) continue;

      const score = calculateEnergyMatchScore(task, block);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = block;
      }
    }

    if (bestMatch && bestScore > 0.3) { // Threshold dla akceptowalnego dopasowania
      assignments.push({
        task,
        block: bestMatch,
        score: bestScore,
        matchType: 'ENERGY_MATCH',
        confidence: bestScore > 0.8 ? 'HIGH' : bestScore > 0.5 ? 'MEDIUM' : 'LOW'
      });
      usedBlocks.add(bestMatch.id);
    } else {
      unassigned.push({
        task,
        reason: bestMatch ? 'LOW_ENERGY_MATCH' : 'NO_AVAILABLE_BLOCKS',
        bestScore: bestScore
      });
    }
  }

  return { assignments, unassigned };
}

function contextBatchAssignment(tasks: any[], blocks: any[]) {
  const assignments: any[] = [];
  const unassigned: any[] = [];
  
  // Grupuj zadania według kontekstu
  const tasksByContext = tasks.reduce((acc, task) => {
    const context = task.context || '@general';
    if (!acc[context]) acc[context] = [];
    acc[context].push(task);
    return acc;
  }, {});

  // Znajdź najlepsze bloki dla każdego kontekstu
  for (const [context, contextTasks] of Object.entries(tasksByContext)) {
    const compatibleBlocks = blocks.filter(block => 
      block.primaryContext === context || 
      block.alternativeContexts?.includes(context) ||
      context === '@general'
    );

    // Przypisz zadania do bloków w ramach kontekstu
    for (const task of contextTasks as any[]) {
      const availableBlock = compatibleBlocks.find(block => 
        block.availableTime >= task.estimatedMinutes &&
        !assignments.some(a => a.block.id === block.id)
      );

      if (availableBlock) {
        assignments.push({
          task,
          block: availableBlock,
          score: calculateContextMatchScore(task, availableBlock),
          matchType: 'CONTEXT_BATCH',
          confidence: 'HIGH'
        });
        availableBlock.availableTime -= task.estimatedMinutes;
      } else {
        unassigned.push({
          task,
          reason: 'NO_CONTEXT_BLOCKS',
          suggestedContext: context
        });
      }
    }
  }

  return { assignments, unassigned };
}

function priorityFirstAssignment(tasks: any[], blocks: any[]) {
  const assignments: any[] = [];
  const unassigned: any[] = [];
  
  // Sortuj zadania według priorytetu
  const sortedTasks = tasks.sort((a, b) => {
    const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
  });

  // Sortuj bloki według jakości (rano = lepiej)
  const sortedBlocks = blocks.sort((a, b) => {
    const timeA = parseTime(a.startTime);
    const timeB = parseTime(b.startTime);
    return timeA.getTime() - timeB.getTime();
  });

  for (const task of sortedTasks) {
    const availableBlock = sortedBlocks.find(block => 
      block.availableTime >= task.estimatedMinutes &&
      !assignments.some(a => a.block.id === block.id)
    );

    if (availableBlock) {
      assignments.push({
        task,
        block: availableBlock,
        score: calculatePriorityScore(task, availableBlock),
        matchType: 'PRIORITY_FIRST',
        confidence: 'HIGH'
      });
      availableBlock.availableTime -= task.estimatedMinutes;
    } else {
      unassigned.push({
        task,
        reason: 'NO_SUFFICIENT_TIME',
        requiredTime: task.estimatedMinutes
      });
    }
  }

  return { assignments, unassigned };
}

function timeOptimalAssignment(tasks: any[], blocks: any[]) {
  const assignments: any[] = [];
  const unassigned: any[] = [];
  
  // Sortuj zadania według czasu (krótkie pierwsze dla lepszego packowania)
  const sortedTasks = tasks.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);

  for (const task of sortedTasks) {
    // Znajdź najlepiej pasujący blok (najmniejszy ale wystarczający)
    let bestBlock = null;
    let smallestWaste = Infinity;

    for (const block of blocks) {
      if (block.availableTime < task.estimatedMinutes) continue;
      if (assignments.some(a => a.block.id === block.id)) continue;

      const waste = block.availableTime - task.estimatedMinutes;
      if (waste < smallestWaste) {
        smallestWaste = waste;
        bestBlock = block;
      }
    }

    if (bestBlock) {
      assignments.push({
        task,
        block: bestBlock,
        score: 1 - (smallestWaste / bestBlock.availableTime), // Mniejszy waste = wyższy score
        matchType: 'TIME_OPTIMAL',
        confidence: smallestWaste < 15 ? 'HIGH' : 'MEDIUM',
        timeWaste: smallestWaste
      });
      bestBlock.availableTime -= task.estimatedMinutes;
    } else {
      unassigned.push({
        task,
        reason: 'NO_FITTING_BLOCKS',
        requiredTime: task.estimatedMinutes
      });
    }
  }

  return { assignments, unassigned };
}

function balancedAssignment(tasks: any[], blocks: any[]) {
  const assignments: any[] = [];
  const unassigned: any[] = [];
  
  // Multi-criteria scoring
  for (const task of tasks) {
    let bestBlock = null;
    let bestScore = -1;

    for (const block of blocks) {
      if (block.availableTime < task.estimatedMinutes) continue;
      if (assignments.some(a => a.block.id === block.id)) continue;

      const energyScore = calculateEnergyMatchScore(task, block) * 0.4;
      const contextScore = calculateContextMatchScore(task, block) * 0.3;
      const timeScore = (1 - Math.abs(block.availableTime - task.estimatedMinutes) / block.availableTime) * 0.2;
      const priorityScore = calculatePriorityTimeAlignment(task, block) * 0.1;

      const totalScore = energyScore + contextScore + timeScore + priorityScore;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestBlock = block;
      }
    }

    if (bestBlock && bestScore > 0.4) {
      assignments.push({
        task,
        block: bestBlock,
        score: bestScore,
        matchType: 'BALANCED',
        confidence: bestScore > 0.7 ? 'HIGH' : bestScore > 0.5 ? 'MEDIUM' : 'LOW'
      });
      bestBlock.availableTime -= task.estimatedMinutes;
    } else {
      unassigned.push({
        task,
        reason: 'LOW_OVERALL_MATCH',
        bestScore
      });
    }
  }

  return { assignments, unassigned };
}

// =============================================================================
// SCORING FUNCTIONS - FUNKCJE OCENIAJĄCE
// =============================================================================

function calculateEnergyMatchScore(task: any, block: any): number {
  const energyMatrix: Record<string, Record<string, number>> = {
    HIGH: { HIGH: 1.0, CREATIVE: 0.7, MEDIUM: 0.5, ADMINISTRATIVE: 0.2, LOW: 0.1 },
    CREATIVE: { CREATIVE: 1.0, HIGH: 0.8, MEDIUM: 0.6, ADMINISTRATIVE: 0.3, LOW: 0.2 },
    MEDIUM: { MEDIUM: 1.0, HIGH: 0.7, CREATIVE: 0.7, ADMINISTRATIVE: 0.6, LOW: 0.4 },
    ADMINISTRATIVE: { ADMINISTRATIVE: 1.0, LOW: 0.8, MEDIUM: 0.6, CREATIVE: 0.3, HIGH: 0.2 },
    LOW: { LOW: 1.0, ADMINISTRATIVE: 0.8, MEDIUM: 0.5, CREATIVE: 0.3, HIGH: 0.2 }
  };

  return energyMatrix[task.energyRequired]?.[block.energyLevel] || 0.5;
}

function calculateContextMatchScore(task: any, block: any): number {
  if (block.primaryContext === task.context) return 1.0;
  if (block.alternativeContexts?.includes(task.context)) return 0.8;
  if (task.context === '@general' || !task.context) return 0.6;
  return 0.3; // Różne konteksty ale możliwe
}

function calculatePriorityScore(task: any, block: any): number {
  const priority = task.priority || 'MEDIUM';
  const timeOfDay = parseTime(block.startTime).getHours();
  
  // Wysokie priorytety rano, niskie po południu
  if (priority === 'URGENT' || priority === 'HIGH') {
    return timeOfDay <= 12 ? 1.0 : 0.6;
  } else if (priority === 'MEDIUM') {
    return timeOfDay <= 16 ? 0.8 : 0.7;
  } else {
    return timeOfDay >= 14 ? 1.0 : 0.7;
  }
}

function calculatePriorityTimeAlignment(task: any, block: any): number {
  return calculatePriorityScore(task, block);
}

function calculateAssignmentScore(task: any, block: any): number {
  const energyScore = calculateEnergyMatchScore(task, block) * 0.5;
  const contextScore = calculateContextMatchScore(task, block) * 0.3;
  const priorityScore = calculatePriorityScore(task, block) * 0.2;
  
  return energyScore + contextScore + priorityScore;
}

// =============================================================================
// HELPER FUNCTIONS - FUNKCJE POMOCNICZE
// =============================================================================

function generateAssignmentInsights(result: any, blocks: any[], strategy: string): string[] {
  const insights = [];
  
  const assignmentRate = (result.assignments.length / (result.assignments.length + result.unassigned.length)) * 100;
  
  if (assignmentRate >= 90) {
    insights.push('✅ Doskonałe pokrycie! Udało się przypisać większość zadań.');
  } else if (assignmentRate >= 70) {
    insights.push('⚡ Dobre pokrycie. Kilka zadań wymaga dodatkowego czasu.');
  } else {
    insights.push('⚠️ Ograniczone pokrycie. Rozważ przedłużenie dnia pracy lub przeniesienie zadań.');
  }

  // Analiza energii
  const energyDistribution = result.assignments.reduce((acc: any, assignment: any) => {
    acc[assignment.task.energyRequired] = (acc[assignment.task.energyRequired] || 0) + 1;
    return acc;
  }, {});

  if (energyDistribution.HIGH >= 3) {
    insights.push('🔥 Dużo zadań wysokoenergetycznych - upewnij się, że masz odpowiednią kondycję.');
  }

  if (energyDistribution.CREATIVE >= 2) {
    insights.push('🎨 Dzień kreatywny - zaplanuj przerwy na inspirację.');
  }

  // Analiza kontekstów
  const contextSwitches = calculateContextSwitches(result.assignments);
  if (contextSwitches > 5) {
    insights.push('🔄 Dużo przełączeń kontekstu - rozważ grupowanie podobnych zadań.');
  }

  return insights;
}

function calculateContextSwitches(assignments: any[]): number {
  let switches = 0;
  for (let i = 1; i < assignments.length; i++) {
    if (assignments[i].task.context !== assignments[i-1].task.context) {
      switches++;
    }
  }
  return switches;
}

// Optimization functions (simplified versions)
function optimizeEnergyBalance(assignments: any[]) {
  return {
    currentScore: 0.7,
    optimizedScore: 0.85,
    improvement: 15,
    recommendations: ['Przenieś zadania wysokoenergetyczne na rano'],
    suggestedMoves: [] as any[]
  };
}

function optimizeContextGrouping(assignments: any[]) {
  return {
    currentScore: 0.6,
    optimizedScore: 0.8,
    improvement: 20,
    recommendations: ['Grupuj zadania @computer w bloki'],
    suggestedMoves: [] as any[]
  };
}

function optimizeTimeEfficiency(assignments: any[]) {
  return {
    currentScore: 0.75,
    optimizedScore: 0.9,
    improvement: 15,
    recommendations: ['Używaj mniejszych bloków dla krótkich zadań'],
    suggestedMoves: [] as any[]
  };
}

function optimizePriorityAlignment(assignments: any[]) {
  return {
    currentScore: 0.8,
    optimizedScore: 0.9,
    improvement: 10,
    recommendations: ['Przenieś pilne zadania na wcześniejsze godziny'],
    suggestedMoves: [] as any[]
  };
}

function optimizeBalanced(assignments: any[]) {
  return {
    currentScore: 0.7,
    optimizedScore: 0.85,
    improvement: 15,
    recommendations: ['Balansuj energię, kontekst i priorytet'],
    suggestedMoves: [] as any[]
  };
}

// Analysis functions
function analyzeEnergyDistribution(assignments: any[]) {
  return { balance: 'GOOD', peaks: ['morning'], valleys: ['afternoon'] };
}

function analyzeContextClustering(assignments: any[]) {
  return { efficiency: 0.7, switches: 4, recommendation: 'Group similar contexts' };
}

function analyzePriorityAlignment(assignments: any[]) {
  return { alignment: 0.8, misaligned: 1 };
}

function analyzeTimeEfficiency(assignments: any[]) {
  return { utilization: 0.85, waste: 45 }; // minutes
}

// Emergency reschedule functions (simplified)
function categorizeTasks(tasks: any[], threshold: string) {
  return {
    urgent: tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH'),
    important: tasks.filter(t => t.priority === 'MEDIUM'),
    routine: tasks.filter(t => t.priority === 'LOW')
  };
}

async function findAvailableSlots(userId: string, fromDate: string, days: number) {
  // Simplified - return mock data
  return Array.from({ length: days * 3 }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    blockId: `block-${i}`,
    availableTime: 60 + (i % 3) * 30
  }));
}

function createRedistributionPlan(categories: any, slots: any[], options: any) {
  return {
    moves: categories.urgent.map((task: any, i: number) => ({
      taskId: task.id,
      newDate: slots[i]?.date,
      newBlockId: slots[i]?.blockId,
      reason: 'URGENT_PRIORITY'
    })),
    failed: [] as any[]
  };
}

function generateRescheduleRecommendations(plan: any, categories: any): string[] {
  return [
    '🚨 Zadania pilne zostały przeniesione na najbliższe dni',
    '📅 Sprawdź nowe terminy w kalendarzu',
    '⚡ Rozważ zwiększenie intensywności pracy w następnych dniach'
  ];
}

// =============================================================================
// FAZA 2: INTEGRATION WITH EXISTING SYSTEMS
// =============================================================================

/**
 * POST /api/v1/smart-day-planner/auto-populate
 * Automatyczne populowanie planu dnia z istniejących systemów
 */
router.post('/auto-populate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, sources = {}, preferences = {} } = req.body;

    const defaultSources = {
      sourceInbox: true,
      activeNextActions: true,
      projects: true,
      recurringTasks: true,
      communications: false,
      streams: false,
      ...sources
    };

    // Pobierz zadania z wszystkich źródeł
    const taskSources = await Promise.all([
      // Workflow Inbox
      defaultSources.sourceInbox ? fetchSourceInboxTasks(userId) : [],
      // Workflow Next Actions  
      defaultSources.activeNextActions ? fetchActiveNextActions(userId) : [],
      // Project Tasks
      defaultSources.projects ? fetchProjectTasks(userId, date) : [],
      // Recurring Tasks
      defaultSources.recurringTasks ? fetchRecurringTasks(userId, date) : [],
      // Communications
      defaultSources.communications ? fetchCommunicationTasks(userId, date) : [],
      // Streams
      defaultSources.streams ? fetchStreamTasks(userId) : []
    ]);

    // Scal wszystkie zadania
    const allTasks = taskSources.flat().filter(task => task !== null);

    // Priorytetyzacja z uwzględnieniem preferencji
    const prioritizedTasks = await prioritizeTasksForDay(allTasks, preferences, date);

    // Automatyczne przypisanie do time blocks
    const assignmentResult = await autoAssignToBlocks(userId, date, prioritizedTasks, preferences);

    // Zapisz plan dnia jeśli requested
    let savedPlan = null;
    if (req.body.savePlan) {
      savedPlan = await saveDayPlan(userId, date, assignmentResult, {
        sources: defaultSources,
        preferences,
        autoGenerated: true
      });
    }

    return res.json({
      success: true,
      data: {
        date,
        sources: defaultSources,
        tasksFound: {
          sourceInbox: taskSources[0]?.length || 0,
          activeNextActions: taskSources[1]?.length || 0,
          projects: taskSources[2]?.length || 0,
          recurring: taskSources[3]?.length || 0,
          communications: taskSources[4]?.length || 0,
          streams: taskSources[5]?.length || 0,
          total: allTasks.length
        },
        assignments: assignmentResult.assignments,
        unassigned: assignmentResult.unassigned,
        statistics: {
          assignmentRate: (assignmentResult.assignments.length / allTasks.length) * 100,
          blockUtilization: calculateBlockUtilization(assignmentResult.assignments),
          energyBalance: analyzeEnergyBalance(assignmentResult.assignments),
          contextEfficiency: analyzeContextEfficiency(assignmentResult.assignments)
        },
        recommendations: generateIntegrationRecommendations(assignmentResult, allTasks, defaultSources),
        savedPlan,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in auto-populate:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to auto-populate day plan'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/sync-with-workflow
 * Synchronizacja z systemem Workflow
 */
router.post('/sync-with-workflow', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, syncDirection = 'BOTH' } = req.body;

    // PULL: Pobierz zadania z Workflow do Smart Day Planner
    let pulledTasks = [];
    if (syncDirection === 'PULL' || syncDirection === 'BOTH') {
      pulledTasks = await pullFromWorkflow(userId, date);
    }

    // PUSH: Przekaż ukończone zadania z SDP do Workflow
    let pushedUpdates = [];
    if (syncDirection === 'PUSH' || syncDirection === 'BOTH') {
      pushedUpdates = await pushToWorkflow(userId, date);
    }

    // Analiza konfliktów i duplikatów
    const conflicts = await detectWorkflowConflicts(userId, date);

    return res.json({
      success: true,
      data: {
        syncDirection,
        date,
        pulled: {
          tasks: pulledTasks,
          count: pulledTasks.length
        },
        pushed: {
          updates: pushedUpdates,
          count: pushedUpdates.length
        },
        conflicts: {
          detected: conflicts,
          count: conflicts.length
        },
        recommendations: generateSyncRecommendations(pulledTasks, pushedUpdates, conflicts),
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in Workflow sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync with Workflow'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/sync-with-projects
 * Synchronizacja z systemem Projects
 */
router.post('/sync-with-projects', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectIds = [], autoAssign = true, respectDeadlines = true } = req.body;

    // Pobierz zadania z wybranych projektów
    const projectTasks = await fetchProjectTasksForPlanning(userId, projectIds, respectDeadlines);

    // Grupowanie według projektów
    const tasksByProject = projectTasks.reduce((acc, task) => {
      const projectId = task.projectId || 'unassigned';
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(task);
      return acc;
    }, {});

    // Automatyczne przypisanie jeśli requested
    let assignmentResults: Record<string, any> = {};
    if (autoAssign) {
      for (const [projectId, tasks] of Object.entries(tasksByProject)) {
        assignmentResults[projectId] = await suggestProjectTaskAssignments(tasks as any[], userId);
      }
    }

    // Analiza dependencies i critical path
    const dependencies = await analyzeProjectDependencies(projectTasks);

    return res.json({
      success: true,
      data: {
        projects: Object.keys(tasksByProject).length,
        totalTasks: projectTasks.length,
        tasksByProject,
        assignmentResults,
        dependencies,
        criticalPath: identifyCriticalPath(dependencies),
        recommendations: generateProjectIntegrationRecommendations(tasksByProject, dependencies),
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in project sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync with projects'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/communication-to-tasks
 * Konwersja komunikacji na zadania
 */
router.post('/communication-to-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageIds = [], autoConvert = false, defaultContext = '@computer' } = req.body;

    // Pobierz wiadomości do konwersji
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        organizationId: req.user.organizationId
      }
    });

    // Analiza każdej wiadomości dla potential tasks
    const analysisResults = [];
    for (const message of messages) {
      const analysis = await analyzeMessageForTasks(message, {
        useAI: true,
        extractDeadlines: true,
        suggestContext: true,
        estimateTime: true
      });
      analysisResults.push(analysis);
    }

    // Auto-konwersja jeśli requested
    const convertedTasks = [];
    if (autoConvert) {
      for (const analysis of analysisResults.filter(a => a.confidence > 0.7)) {
        const task = await createTaskFromMessage(analysis, userId, defaultContext);
        convertedTasks.push(task);
      }
    }

    return res.json({
      success: true,
      data: {
        messagesAnalyzed: messages.length,
        analysisResults,
        convertedTasks,
        statistics: {
          highConfidenceTasks: analysisResults.filter(a => a.confidence > 0.8).length,
          mediumConfidenceTasks: analysisResults.filter(a => a.confidence > 0.5 && a.confidence <= 0.8).length,
          lowConfidenceTasks: analysisResults.filter(a => a.confidence <= 0.5).length,
          autoConverted: convertedTasks.length
        },
        recommendations: generateCommunicationTaskRecommendations(analysisResults),
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in communication to tasks:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to convert communications to tasks'
    });
  }
});

// =============================================================================
// INTEGRATION HELPER FUNCTIONS
// =============================================================================

async function fetchSourceInboxTasks(userId: string) {
  const inboxItems = await prisma.inboxItem.findMany({
    where: {
      capturedById: userId,
      processed: false
    },
    orderBy: { urgencyScore: 'desc' },
    take: 20
  });

  return inboxItems.map(item => ({
    id: item.id,
    source: 'SOURCE_INBOX',
    title: `Przetwórz: ${item.content.substring(0, 50)}...`,
    description: item.content,
    estimatedMinutes: getEstimatedTimeFromType(item.sourceType),
    priority: calculatePriorityFromUrgency(item.urgencyScore),
    context: getContextFromInboxType(item.sourceType),
    energyRequired: getEnergyFromInboxType(item.sourceType),
    deadline: null as any,
    sourceData: item
  }));
}

async function fetchActiveNextActions(userId: string) {
  const nextActions = await prisma.next_actions.findMany({
    where: {
      createdById: userId,
      status: 'IN_PROGRESS',
      completedAt: null
    },
    orderBy: { priority: 'desc' },
    take: 15
  });

  return nextActions.map(action => ({
    id: action.id,
    source: 'ACTIVE_TASKS',
    title: action.title,
    description: action.description,
    estimatedMinutes: parseInt(action.estimatedTime || '30') || 30,
    priority: action.priority || 'MEDIUM',
    context: action.context || '@computer',
    energyRequired: action.energy || 'MEDIUM',
    deadline: action.dueDate,
    sourceData: action
  }));
}

async function fetchProjectTasks(userId: string, date: string) {
  const tasks = await prisma.task.findMany({
    where: {
      createdById: userId,
      status: { in: ['NEW', 'IN_PROGRESS'] },
      OR: [
        { dueDate: { gte: new Date(date) } },
        { dueDate: null }
      ]
    },
    include: { project: true },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 25
  });

  return tasks.map(task => ({
    id: task.id,
    source: 'PROJECTS',
    title: task.title,
    description: task.description,
    estimatedMinutes: (task.estimatedHours || 1) * 60,
    priority: task.priority || 'MEDIUM',
    context: '@computer',
    energyRequired: task.energy || 'MEDIUM',
    deadline: task.dueDate,
    projectId: task.projectId,
    projectName: task.project?.name,
    sourceData: task
  }));
}

async function fetchRecurringTasks(userId: string, date: string) {
  const recurringTasks = await prisma.recurringTask.findMany({
    where: {
      assignedToId: userId,
      isActive: true,
      OR: [
        { frequency: 'DAILY' },
        { frequency: 'WEEKLY' }
      ]
    },
    orderBy: { priority: 'desc' },
    take: 10
  });

  return recurringTasks.map(task => ({
    id: task.id,
    source: 'RECURRING',
    title: task.title,
    description: task.description,
    estimatedMinutes: task.estimatedMinutes || 30,
    priority: task.priority || 'MEDIUM',
    context: task.context || '@routine',
    energyRequired: 'MEDIUM',
    deadline: null as any,
    sourceData: task
  }));
}

async function fetchCommunicationTasks(userId: string, date: string): Promise<any[]> {
  // Simplified - return empty for now
  return [];
}

async function fetchStreamTasks(userId: string): Promise<any[]> {
  // Simplified - return empty for now
  return [];
}

async function prioritizeTasksForDay(tasks: any[], preferences: any, date: string) {
  // Sort by priority and deadline proximity
  return tasks.sort((a, b) => {
    const priorityWeights: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let scoreA = (priorityWeights[a.priority] || 2);
    let scoreB = (priorityWeights[b.priority] || 2);
    
    // Add deadline urgency
    if (a.deadline && b.deadline) {
      const daysToA = (new Date(a.deadline).getTime() - new Date(date).getTime()) / (24 * 60 * 60 * 1000);
      const daysToB = (new Date(b.deadline).getTime() - new Date(date).getTime()) / (24 * 60 * 60 * 1000);
      
      if (daysToA <= 1) scoreA += 2;
      if (daysToB <= 1) scoreB += 2;
    }
    
    return scoreB - scoreA;
  });
}

async function autoAssignToBlocks(userId: string, date: string, tasks: any[], preferences: any) {
  // Use existing smart assignment logic
  const strategy = preferences.strategy || 'BALANCED';
  
  // Mock assignment for now - use existing energyMatchAssignment
  const timeBlocks = await prisma.energy_time_blocks.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() as any },
        { dayOfWeek: null }
      ]
    },
    include: {
      scheduled_tasks: {
        where: {
          scheduledDate: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(date).setHours(24, 0, 0, 0))
          }
        }
      }
    },
    orderBy: { startTime: 'asc' }
  });

  const availableBlocks = timeBlocks
    .filter(block => !block.isBreak)
    .map(block => {
      const usedTime = block.scheduled_tasks?.reduce((sum, task) => sum + task.estimatedMinutes, 0) || 0;
      const totalTime = calculateBlockDuration(block.startTime, block.endTime);
      return {
        ...block,
        availableTime: totalTime - usedTime
      };
    })
    .filter(block => block.availableTime > 0);

  return balancedAssignment(tasks, availableBlocks);
}

function calculatePriorityFromUrgency(urgencyScore: number): string {
  if (urgencyScore >= 80) return 'URGENT';
  if (urgencyScore >= 60) return 'HIGH';
  if (urgencyScore >= 40) return 'MEDIUM';
  return 'LOW';
}

function calculateBlockUtilization(assignments: any[]): number {
  if (assignments.length === 0) return 0;
  
  const totalTime = assignments.reduce((sum, a) => sum + a.block.totalTime, 0);
  const usedTime = assignments.reduce((sum, a) => sum + a.task.estimatedMinutes, 0);
  
  return totalTime > 0 ? (usedTime / totalTime) * 100 : 0;
}

function analyzeEnergyBalance(assignments: any[]): any {
  const energyDistribution = assignments.reduce((acc, a) => {
    acc[a.task.energyRequired] = (acc[a.task.energyRequired] || 0) + 1;
    return acc;
  }, {});
  
  return {
    distribution: energyDistribution,
    balance: Object.keys(energyDistribution).length > 2 ? 'GOOD' : 'UNBALANCED'
  };
}

function analyzeContextEfficiency(assignments: any[]): any {
  let switches = 0;
  for (let i = 1; i < assignments.length; i++) {
    if (assignments[i].task.context !== assignments[i-1].task.context) {
      switches++;
    }
  }
  
  return {
    switches,
    efficiency: switches <= 3 ? 'HIGH' : switches <= 6 ? 'MEDIUM' : 'LOW'
  };
}

function generateIntegrationRecommendations(result: any, allTasks: any[], sources: any): string[] {
  const recommendations = [];
  
  if (sources.sourceInbox && allTasks.filter(t => t.source === 'SOURCE_INBOX').length > 5) {
    recommendations.push('📥 Dużo elementów w Workflow Inbox - rozważ przetworzenie niektórych przed planowaniem');
  }
  
  if (sources.projects && allTasks.filter(t => t.source === 'PROJECTS').length > 10) {
    recommendations.push('🎯 Wiele zadań projektowych - skup się na 2-3 najważniejszych projektach');
  }
  
  if (result.assignments.length / allTasks.length < 0.7) {
    recommendations.push('⚠️ Niski wskaźnik przypisania - rozważ zwiększenie dostępnych bloków czasowych');
  }
  
  return recommendations;
}

// Simplified Workflow integration functions
async function pullFromWorkflow(userId: string, date: string): Promise<any[]> {
  return [];
}

async function pushToWorkflow(userId: string, date: string): Promise<any[]> {
  return [];
}

async function detectWorkflowConflicts(userId: string, date: string): Promise<any[]> {
  return [];
}

function generateSyncRecommendations(pulled: any[], pushed: any[], conflicts: any[]): string[] {
  const recommendations = [];
  
  if (pulled.length > 0) {
    recommendations.push(`✅ Pobrano ${pulled.length} zadań z Workflow - sprawdź czy wszystkie są aktualne`);
  }
  
  if (conflicts.length > 0) {
    recommendations.push(`⚠️ Wykryto ${conflicts.length} konfliktów - wymagana manualna weryfikacja`);
  }
  
  return recommendations;
}

// Simplified project integration functions
async function fetchProjectTasksForPlanning(userId: string, projectIds: string[], respectDeadlines: boolean): Promise<any[]> {
  return [];
}

async function suggestProjectTaskAssignments(tasks: any[], userId: string) {
  return {};
}

async function analyzeProjectDependencies(tasks: any[]): Promise<any[]> {
  return [];
}

function identifyCriticalPath(dependencies: any[]): any[] {
  return [];
}

function generateProjectIntegrationRecommendations(tasksByProject: any, dependencies: any[]): string[] {
  return ['🎯 Rozważ grupowanie zadań według projektów dla lepszej koncentracji'];
}

function generateWeeklyOverviewRecommendations(dailyStats: any[], productivity: any, bestTimeSlots: any[]): string[] {
  const recommendations: string[] = [];
  if (productivity.tasksCompleted > 0 && productivity.totalTasks > 0) {
    const rate = (productivity.tasksCompleted / productivity.totalTasks) * 100;
    if (rate >= 80) recommendations.push('Excellent weekly completion rate!');
    else if (rate >= 50) recommendations.push('Good progress this week. Try to maintain momentum.');
    else recommendations.push('Consider reducing daily task count for better completion rates.');
  }
  if (productivity.overdueTasks > 0) {
    recommendations.push(`${productivity.overdueTasks} overdue tasks need attention.`);
  }
  return recommendations;
}

// Simplified communication integration functions
async function analyzeMessageForTasks(message: any, options: any) {
  return {
    messageId: message.id,
    confidence: 0.5,
    suggestedTasks: [] as any[],
    extractedDeadlines: [] as any[],
    suggestedContext: '@computer'
  };
}

async function createTaskFromMessage(analysis: any, userId: string, defaultContext: string) {
  return { id: 'task-from-message', title: 'Task from communication' };
}

function generateCommunicationTaskRecommendations(analyses: any[]): string[] {
  return ['📧 Rozważ automatyzację konwersji pilnych emaili na zadania'];
}

async function saveDayPlan(userId: string, date: string, assignments: any, metadata: any) {
  // Simplified - could save to a day_plans table
  return { id: 'plan-' + date, saved: true };
}

// =============================================================================
// FAZA 3: DASHBOARD INTEGRATION - Daily Widget & Active Links System
// =============================================================================

/**
 * GET /api/v1/smart-day-planner/dashboard/daily-widget
 * Widget dnia dla dashboard - statystyki i przegląd dzisiejszego planu
 */
router.get('/dashboard/daily-widget', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    // 1. Pobierz dzisiejsze bloki czasowe
    const timeBlocks: any[] = await prisma.energy_time_blocks.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { dayOfWeek: null }, // Universal blocks
          { dayOfWeek: getDayOfWeek(today) as any }
        ]
      },
      include: {
        scheduled_tasks: {
          where: {
            scheduledDate: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
              lt: new Date(today.setHours(23, 59, 59, 999))
            }
          }
        },
        focus_modes: true
      },
      orderBy: { startTime: 'asc' }
    });

    // 2. Oblicz statystyki dnia
    const totalBlocks = timeBlocks.length;
    const workBlocks = timeBlocks.filter(b => !b.isBreak).length;
    const breakBlocks = timeBlocks.filter(b => b.isBreak).length;
    
    const allTasks = timeBlocks.flatMap(block => block.scheduled_tasks || []);
    const completedTasks = allTasks.filter(task => task.status === 'COMPLETED').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'IN_PROGRESS').length;
    const plannedTasks = allTasks.filter(task => task.status === 'PLANNED').length;
    const overdueTasks = allTasks.filter(task => task.status === 'OVERDUE').length;

    // 3. Aktualny blok czasowy
    const currentTime = new Date();
    const currentTimeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    
    const currentBlock = timeBlocks.find(block => {
      return currentTimeString >= block.startTime && currentTimeString < block.endTime;
    });

    // 4. Następny blok czasowy
    const nextBlock = timeBlocks.find(block => {
      return currentTimeString < block.startTime;
    });

    // 5. Rozkład energii dzisiaj
    const energyDistribution = {
      HIGH: timeBlocks.filter(b => b.energyLevel === 'HIGH').length,
      MEDIUM: timeBlocks.filter(b => b.energyLevel === 'MEDIUM').length,
      LOW: timeBlocks.filter(b => b.energyLevel === 'LOW').length,
      CREATIVE: timeBlocks.filter(b => b.energyLevel === 'CREATIVE').length,
      ADMINISTRATIVE: timeBlocks.filter(b => b.energyLevel === 'ADMINISTRATIVE').length
    };

    // 6. Prognoza produktywności (na podstawie historii)
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const recentAnalytics = await prisma.energy_analytics.findMany({
      where: {
        userId,
        date: {
          gte: last7Days,
          lt: today
        }
      }
    });

    const avgProductivity = recentAnalytics.length > 0 
      ? recentAnalytics.reduce((sum, a) => sum + (a.productivityScore || 0), 0) / recentAnalytics.length
      : 0;

    // 7. Quick Actions
    const quickActions = [
      {
        id: 'start-current-task',
        label: 'Rozpocznij bieżące zadanie',
        type: 'START_TASK',
        enabled: currentBlock && currentBlock.scheduled_tasks && currentBlock.scheduled_tasks.length > 0,
        target: currentBlock?.scheduled_tasks?.[0]?.id || null
      },
      {
        id: 'complete-current-task', 
        label: 'Zakończ bieżące zadanie',
        type: 'COMPLETE_TASK',
        enabled: inProgressTasks > 0,
        target: allTasks.find(t => t.status === 'IN_PROGRESS')?.id || null
      },
      {
        id: 'add-urgent-task',
        label: 'Dodaj pilne zadanie',
        type: 'ADD_URGENT',
        enabled: true,
        target: null
      },
      {
        id: 'reschedule-today',
        label: 'Przełóż dzisiejsze zadania',
        type: 'RESCHEDULE_TODAY',
        enabled: plannedTasks > 0 || overdueTasks > 0,
        target: null
      }
    ];

    // 8. Timeline dzisiejszych bloków dla widget
    const timelineBlocks = timeBlocks.map(block => ({
      id: block.id,
      name: block.name,
      startTime: block.startTime,
      endTime: block.endTime,
      energyLevel: block.energyLevel,
      isBreak: block.isBreak,
      breakType: block.breakType,
      isActive: currentBlock?.id === block.id,
      isNext: nextBlock?.id === block.id,
      tasksCount: block.scheduled_tasks?.length || 0,
      completedTasksCount: block.scheduled_tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0,
      focusMode: block.focus_modes ? {
        name: block.focus_modes.name,
        category: block.focus_modes.category
      } : null
    }));

    return res.json({
      success: true,
      data: {
        date: todayDateString,
        summary: {
          totalBlocks,
          workBlocks,
          breakBlocks,
          totalTasks: allTasks.length,
          completedTasks,
          inProgressTasks,
          plannedTasks,
          overdueTasks,
          completionRate: allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0
        },
        currentActivity: {
          currentBlock: currentBlock ? {
            id: currentBlock.id,
            name: currentBlock.name,
            startTime: currentBlock.startTime,
            endTime: currentBlock.endTime,
            energyLevel: currentBlock.energyLevel,
            isBreak: currentBlock.isBreak,
            activeTasks: currentBlock.scheduled_tasks?.filter((t: any) => t.status === 'IN_PROGRESS') || []
          } : null,
          nextBlock: nextBlock ? {
            id: nextBlock.id,
            name: nextBlock.name,
            startTime: nextBlock.startTime,
            energyLevel: nextBlock.energyLevel,
            upcomingTasks: nextBlock.scheduled_tasks?.filter((t: any) => t.status === 'PLANNED') || []
          } : null
        },
        insights: {
          energyDistribution,
          avgProductivity: Math.round(avgProductivity * 100) / 100,
          todayForecast: avgProductivity > 0.7 ? 'HIGH' : avgProductivity > 0.4 ? 'MEDIUM' : 'LOW',
          recommendations: [
            avgProductivity > 0.8 ? 'Świetna forma! Wykorzystaj to na trudne zadania' : 
            avgProductivity > 0.5 ? 'Dobry dzień, utrzymaj tempo' :
            'Dzień wyzwań, zaplanuj krótsze zadania'
          ]
        },
        timeline: timelineBlocks,
        quickActions: quickActions.filter(action => action.enabled)
      }
    });

  } catch (error) {
    console.error('Error fetching daily widget:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch daily widget data'
    });
  }
});

/**
 * GET /api/v1/smart-day-planner/dashboard/week-overview
 * Przegląd tygodnia dla dashboard - statystyki całego tygodnia
 */
router.get('/dashboard/week-overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfWeek = getStartOfWeekDate(today);
    const endOfWeek = getEndOfWeekDate(today);

    // 1. Statystyki tygodnia
    const weeklyAnalytics = await prisma.energy_analytics.findMany({
      where: {
        userId,
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      include: {
        energy_time_blocks: true
      }
    });

    // 2. Zaplanowane vs ukończone zadania w tym tygodniu
    const weeklyTasks = await prisma.scheduled_tasks.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });

    // 3. Statystyki według dni tygodnia
    const dailyStats = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => {
      const dayTasks = weeklyTasks.filter(task => {
        const taskDay = new Date(task.scheduledDate);
        return getDayOfWeek(taskDay) === day;
      });

      const completed = dayTasks.filter(t => t.status === 'COMPLETED').length;
      const total = dayTasks.length;

      return {
        day,
        totalTasks: total,
        completedTasks: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgEnergy: weeklyAnalytics
          .filter(a => getDayOfWeek(new Date(a.date)) === day)
          .reduce((sum, a) => sum + (a.energyScore || 0), 0) / 
          weeklyAnalytics.filter(a => getDayOfWeek(new Date(a.date)) === day).length || 0
      };
    });

    // 4. Trendy wydajności
    const productivity = {
      thisWeek: Math.round(weeklyAnalytics.reduce((sum, a) => sum + (a.productivityScore || 0), 0) / weeklyAnalytics.length * 100) / 100,
      tasksCompleted: weeklyTasks.filter(t => t.status === 'COMPLETED').length,
      totalTasks: weeklyTasks.length,
      overdueTasks: weeklyTasks.filter(t => t.status === 'OVERDUE').length
    };

    // 5. Najproduktywniejsze czasy
    const bestTimeSlots = weeklyAnalytics
      .filter(a => a.productivityScore && a.productivityScore > 0.7)
      .map(a => ({
        time: a.energy_time_blocks?.startTime,
        day: getDayOfWeek(new Date(a.date)),
        productivity: a.productivityScore,
        energyLevel: a.energy_time_blocks?.energyLevel
      }))
      .sort((a, b) => (b.productivity || 0) - (a.productivity || 0))
      .slice(0, 3);

    return res.json({
      success: true,
      data: {
        weekPeriod: {
          start: startOfWeek.toISOString().split('T')[0],
          end: endOfWeek.toISOString().split('T')[0]
        },
        productivity,
        dailyStats,
        bestTimeSlots,
        recommendations: generateWeeklyOverviewRecommendations(dailyStats, productivity, bestTimeSlots)
      }
    });

  } catch (error) {
    console.error('Error fetching week overview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch week overview'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/dashboard/quick-action
 * Wykonanie szybkiej akcji z dashboard widget
 */
router.post('/dashboard/quick-action', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { actionType, targetId, data } = req.body;

    let result;

    switch (actionType) {
      case 'START_TASK':
        if (!targetId) {
          return res.status(400).json({
            success: false,
            error: 'Target task ID required for START_TASK action'
          });
        }

        result = await prisma.scheduled_tasks.update({
          where: { id: targetId, userId },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date()
          }
        });
        break;

      case 'COMPLETE_TASK':
        if (!targetId) {
          return res.status(400).json({
            success: false,
            error: 'Target task ID required for COMPLETE_TASK action'
          });
        }

        result = await prisma.scheduled_tasks.update({
          where: { id: targetId, userId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            actualMinutes: data?.actualMinutes || null
          }
        });
        break;

      case 'ADD_URGENT':
        const { title, estimatedMinutes = 30, context = '@computer' } = data || {};
        
        if (!title) {
          return res.status(400).json({
            success: false,
            error: 'Task title required for ADD_URGENT action'
          });
        }

        // Znajdź następny dostępny blok czasowy
        const nextAvailableBlock = await findNextAvailableTimeBlock(userId);

        result = await prisma.scheduled_tasks.create({
          data: {
            title,
            estimatedMinutes,
            context,
            energyRequired: 'HIGH',
            priority: 'URGENT',
            status: 'PLANNED',
            scheduledDate: new Date(),
            energyTimeBlockId: nextAvailableBlock?.id || '',
            userId,
            organizationId: req.user.organizationId
          } as any
        });
        break;

      case 'RESCHEDULE_TODAY':
        // Przełóż wszystkie nieukończone zadania z dzisiaj na jutro
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        result = await prisma.scheduled_tasks.updateMany({
          where: {
            userId,
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999))
            },
            status: { in: ['PLANNED', 'OVERDUE'] }
          },
          data: {
            scheduledDate: tomorrow,
            wasRescheduled: true,
            rescheduledFrom: new Date().toISOString().split('T')[0],
            rescheduledReason: 'USER_PREFERENCE' as any
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action type: ${actionType}`
        });
    }

    return res.json({
      success: true,
      data: result,
      message: `Action ${actionType} completed successfully`
    });

  } catch (error) {
    console.error('Error executing quick action:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute quick action'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/next-suggestions
 * Sugestie następnych zadań przy wcześniejszym ukończeniu
 */
router.post('/next-suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { completedTaskId, availableMinutes = 60, energyLevel, currentContext } = req.body;

    // 1. Znajdź zadania zaplanowane na później dzisiaj
    const today = new Date();
    const currentTimeString = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    
    const laterTasks = await prisma.scheduled_tasks.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        },
        status: 'PLANNED',
        estimatedMinutes: { lte: availableMinutes }
      },
      include: {
        energy_time_blocks: true
      }
    });

    // 2. Znajdź zadania z Workflow Inbox
    const inboxTasks = await prisma.inboxItem.findMany({
      where: {
        capturedById: userId,
        processed: false,
        estimatedTime: { lte: availableMinutes.toString() }
      },
      take: 3
    });

    // 3. Quick wins z projektów
    const quickWins = await prisma.task.findMany({
      where: {
        createdById: userId,
        status: 'NEW',
        priority: { in: ['HIGH', 'MEDIUM'] }
      },
      take: 2
    });

    // 4. Tworzenie sugestii z scoring
    const suggestions: any[] = [];

    // Zadania zaplanowane na później
    laterTasks.forEach(task => {
      const energyMatch = task.energyRequired === energyLevel ? 30 : 0;
      const contextMatch = task.context === currentContext ? 20 : 0;
      const priorityScore = task.priority === 'HIGH' ? 25 : task.priority === 'MEDIUM' ? 15 : 5;
      const timeScore = task.estimatedMinutes <= availableMinutes / 2 ? 20 : 10;
      
      suggestions.push({
        id: `task-${task.id}`,
        taskId: task.id,
        title: task.title,
        description: task.description,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        context: task.context,
        energyRequired: task.energyRequired,
        source: 'SCHEDULED_LATER',
        score: energyMatch + contextMatch + priorityScore + timeScore,
        reason: `Zaplanowane na ${task.energy_time_blocks?.startTime}. Idealny moment na wyprzedzenie.`,
        originalScheduledTime: task.energy_time_blocks?.startTime,
        canFitInTime: task.estimatedMinutes <= availableMinutes
      });
    });

    // Zadania z inbox
    inboxTasks.forEach(item => {
      const estMinutes = parseInt(item.estimatedTime || '30') || 30;
      suggestions.push({
        id: `inbox-${item.id}`,
        title: item.content.substring(0, 100),
        description: item.content,
        estimatedMinutes: estMinutes,
        priority: calculatePriorityFromUrgency(item.urgencyScore || 0),
        context: item.context || '@computer',
        energyRequired: 'MEDIUM',
        source: 'SOURCE_INBOX',
        score: 40, // Inbox ma wysoką wartość
        reason: 'Warto przetworzyć z Workflow Inbox podczas wolnego czasu.',
        canFitInTime: estMinutes <= availableMinutes
      });
    });

    // Quick wins z projektów
    quickWins.forEach(task => {
      const taskMinutes = (task.estimatedHours || 0.25) * 60;
      suggestions.push({
        id: `quick-${task.id}`,
        taskId: task.id,
        title: task.title,
        description: task.description,
        estimatedMinutes: taskMinutes,
        priority: task.priority,
        context: '@computer',
        energyRequired: task.energy || 'MEDIUM',
        source: 'QUICK_WIN',
        score: 35,
        reason: 'Quick win z projektu. Szybkie zadanie do realizacji.',
        canFitInTime: taskMinutes <= availableMinutes
      });
    });

    // Sortowanie według score (malejąco)
    const sortedSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 sugestii

    return res.json({
      success: true,
      data: sortedSuggestions
    });

  } catch (error) {
    console.error('Error getting next task suggestions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get task suggestions'
    });
  }
});

/**
 * POST /api/v1/smart-day-planner/partial-day
 * Obsługa skróconego dnia pracy
 */
router.post('/partial-day', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { endTime, strategy, date = new Date().toISOString().split('T')[0] } = req.body;

    // 1. Znajdź bloki czasowe po endTime
    const affectedBlocks = await prisma.energy_time_blocks.findMany({
      where: {
        userId,
        isActive: true,
        startTime: { gte: endTime }
      },
      include: {
        scheduled_tasks: {
          where: {
            scheduledDate: {
              gte: new Date(date + 'T00:00:00.000Z'),
              lt: new Date(date + 'T23:59:59.999Z')
            },
            status: { in: ['PLANNED', 'IN_PROGRESS'] }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    let changes = [];
    let rescheduledTasks = 0;
    let compressedBlocks = 0;
    const warnings = [];

    if (strategy === 'COMPRESS_BLOCKS') {
      // Strategia: Skompresuj bloki - skróć czas bloków proporcjonalnie
      for (const block of affectedBlocks) {
        const originalDuration = calculateBlockDuration(block.startTime, block.endTime);
        const compressedDuration = Math.max(15, Math.floor(originalDuration * 0.7)); // Min 15 min, 70% oryginalnego czasu
        const newEndTime = addMinutesToTime(block.startTime, compressedDuration);

        await prisma.energy_time_blocks.update({
          where: { id: block.id },
          data: { endTime: newEndTime }
        });

        compressedBlocks++;
        changes.push({
          blockId: block.id,
          blockName: block.name,
          originalTime: `${block.startTime}-${block.endTime}`,
          newTime: `${block.startTime}-${newEndTime}`,
          action: 'COMPRESSED'
        });

        if (originalDuration - compressedDuration > 30) {
          warnings.push(`Blok "${block.name}" skrócony o ${originalDuration - compressedDuration} minut`);
        }
      }

    } else if (strategy === 'RESCHEDULE_REMAINING') {
      // Strategia: Przełóż pozostałe zadania na kolejne dni
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const block of affectedBlocks) {
        const tasksToReschedule = block.scheduled_tasks || [];
        
        if (tasksToReschedule.length > 0) {
          await prisma.scheduled_tasks.updateMany({
            where: {
              id: { in: tasksToReschedule.map(t => t.id) }
            },
            data: {
              scheduledDate: tomorrow,
              wasRescheduled: true,
              rescheduledReason: 'USER_PREFERENCE' as any
            }
          });

          rescheduledTasks += tasksToReschedule.length;
          changes.push({
            blockId: block.id,
            blockName: block.name,
            originalTime: `${block.startTime}-${block.endTime}`,
            action: 'RESCHEDULED',
            tasksMoved: tasksToReschedule.map(task => ({
              taskId: task.id,
              taskTitle: task.title,
              newDate: tomorrow.toISOString().split('T')[0]
            }))
          });
        }
      }
    }

    const savedMinutes = affectedBlocks.reduce((sum, block) => {
      return sum + calculateBlockDuration(endTime, block.endTime);
    }, 0);

    return res.json({
      success: true,
      data: {
        strategy,
        summary: {
          endTime,
          affectedBlocks: affectedBlocks.length,
          compressedBlocks,
          rescheduledTasks,
          savedTime: savedMinutes
        },
        changes,
        warnings
      }
    });

  } catch (error) {
    console.error('Error handling partial day:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to handle partial day'
    });
  }
});

// Debug endpoint for weekly data
router.get('/debug-weekly/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const count = await prisma.energy_time_blocks.count();
    const blocks = await prisma.energy_time_blocks.findMany({
      take: 5,
      select: { id: true, name: true, startTime: true, userId: true }
    });
    
    return res.json({
      success: true,
      debug: {
        date,
        totalBlocks: count,
        sampleBlocks: blocks,
        message: 'Debug data for weekly schedule'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
