import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;

    // Get all tasks for the organization
    const tasks = await prisma.task.findMany({
      where: { organizationId },
      include: {
        project: { select: { name: true } },
        context: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true, status: true }
    });

    // Get all streams
    const streams = await prisma.stream.findMany({
      where: { organizationId },
      select: { id: true, name: true }
    });

    // Get inbox items count (unprocessed)
    const inboxCount = await prisma.inboxItem.count({
      where: {
        organizationId,
        processed: false
      }
    });

    // Calculate statistics
    const now = new Date();
    const stats = {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status === 'NEW' || t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
      totalStreams: streams.length,
      inboxCount: inboxCount,
      urgentTasks: tasks.filter(t => t.priority === 'HIGH').length,
      overdueCount: tasks.filter(t =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELED'
      ).length
    };

    // Get recent tasks (last 5 active)
    const recentTasks = tasks
      .filter(t => t.status !== 'COMPLETED')
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectName: task.project?.name,
        contextName: task.context?.name
      }));

    res.json({
      stats,
      recentTasks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get weekly summary
router.get('/weekly-summary', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [completedThisWeek, createdThisWeek] = await Promise.all([
      prisma.task.count({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: oneWeekAgo }
        }
      }),
      prisma.task.count({
        where: {
          organizationId,
          createdAt: { gte: oneWeekAgo }
        }
      })
    ]);

    res.json({
      completedThisWeek,
      createdThisWeek,
      productivity: completedThisWeek / Math.max(createdThisWeek, 1) * 100
    });

  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

// Get upcoming deadlines
router.get('/upcoming-deadlines', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await prisma.task.findMany({
      where: {
        organizationId,
        status: { in: ['NEW', 'IN_PROGRESS'] },
        dueDate: {
          gte: new Date(),
          lte: nextWeek
        }
      },
      include: {
        project: { select: { name: true } },
        context: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    res.json({
      upcomingTasks: upcomingTasks.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        projectName: task.project?.name,
        contextName: task.context?.name
      }))
    });

  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
  }
});

// ===========================================================================
// Dashboard Dnia — GET /day
// ===========================================================================

const POLISH_WEEKDAYS = ['Niedziela', 'Poniedzialek', 'Wtorek', 'Sroda', 'Czwartek', 'Piatek', 'Sobota'];
const POLISH_MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'wrzesnia', 'pazdziernika', 'listopada', 'grudnia'];
const SHORT_WEEKDAYS = ['Nd', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob'];

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function formatPolishDate(d: Date): string {
  return `${POLISH_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${POLISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function scoreFocusTask(task: any, today: Date, tomorrow: Date): number {
  let score = 0;
  if (task.dueDate) {
    const due = startOfDay(new Date(task.dueDate));
    const todayStart = startOfDay(today);
    const tomorrowStart = startOfDay(tomorrow);
    if (due < todayStart) score += 120;       // overdue
    else if (due.getTime() === todayStart.getTime()) score += 100; // due today
    else if (due.getTime() === tomorrowStart.getTime()) score += 80; // due tomorrow
    else score += 50;
  } else {
    score += 30; // no due date = lower
  }
  if (task.priority === 'URGENT') score += 40;
  else if (task.priority === 'HIGH') score += 30;
  else if (task.priority === 'MEDIUM') score += 15;
  return score;
}

router.get('/day', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const firstName = req.user!.firstName || 'Uzytkowniku';
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const monday = getMonday(now);

    // Run all queries in parallel
    const [
      rawTasks,
      unprocessedCount,
      awaitingDecisionCount,
      overdueCount,
      upcomingDeals,
      activeStreams,
      completedByStream,
      followupCompanies,
      weekTasks,
      weekCreated
    ] = await Promise.all([
      // 1. Focus tasks (candidates)
      prisma.task.findMany({
        where: {
          organizationId,
          status: { in: ['NEW', 'IN_PROGRESS'] }
        },
        include: {
          project: { select: { name: true } },
          stream: { select: { id: true, name: true, color: true } },
          companies: { select: { id: true, name: true } }
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
        take: 20
      }),

      // 2a. Unprocessed source count
      prisma.inboxItem.count({
        where: { organizationId, processed: false }
      }),

      // 2b. Awaiting decision count
      prisma.inboxItem.count({
        where: { organizationId, flowStatus: 'AWAITING_DECISION' }
      }),

      // 3. Overdue count
      prisma.task.count({
        where: {
          organizationId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
          dueDate: { lt: today }
        }
      }),

      // 4. Upcoming deals
      prisma.deal.findMany({
        where: {
          organizationId,
          stage: { in: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] },
          expectedCloseDate: { gte: today, lte: next7Days }
        },
        include: {
          company: { select: { id: true, name: true } }
        },
        orderBy: { expectedCloseDate: 'asc' },
        take: 5
      }),

      // 5a. Active streams with active task count
      prisma.stream.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          streamType: true,
          _count: {
            select: {
              tasks: { where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }
            }
          }
        }
      }),

      // 5b. Completed tasks per stream
      prisma.task.groupBy({
        by: ['streamId'],
        where: {
          organizationId,
          status: 'COMPLETED',
          streamId: { not: null }
        },
        _count: true
      }),

      // 6. Follow-up companies
      prisma.company.findMany({
        where: {
          organizationId,
          deals: {
            some: { stage: { in: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] } }
          },
          lastInteractionAt: { not: null }
        },
        select: {
          id: true,
          name: true,
          lastInteractionAt: true,
          _count: { select: { deals: true } },
          deals: {
            where: { stage: { in: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] } },
            select: { id: true, title: true, value: true, stage: true },
            take: 1,
            orderBy: { expectedCloseDate: 'asc' }
          }
        },
        orderBy: { lastInteractionAt: 'asc' },
        take: 5
      }),

      // 7a. Tasks completed this week
      prisma.task.findMany({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: monday }
        },
        select: { completedAt: true }
      }),

      // 7b. Tasks created this week
      prisma.task.count({
        where: {
          organizationId,
          createdAt: { gte: monday }
        }
      })
    ]);

    // === Post-process focus tasks ===
    const focusTasks = rawTasks
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        isOverdue: t.dueDate ? new Date(t.dueDate) < today : false,
        estimatedHours: t.estimatedHours,
        projectName: t.project?.name || null,
        streamName: t.stream?.name || null,
        streamColor: t.stream?.color || null,
        companyName: t.companies?.name || null,
        _score: scoreFocusTask(t, now, tomorrow)
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 5)
      .map(({ _score, ...rest }) => rest);

    // === Streams with progress ===
    const completedMap = new Map<string, number>();
    for (const g of completedByStream) {
      if (g.streamId) completedMap.set(g.streamId, g._count);
    }

    const streams = activeStreams
      .map(s => {
        const active = s._count.tasks;
        const completed = completedMap.get(s.id) || 0;
        const total = active + completed;
        return {
          id: s.id,
          name: s.name,
          color: s.color,
          icon: s.icon,
          streamType: s.streamType,
          activeTasks: active,
          completedTasks: completed,
          totalTasks: total,
          completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      })
      .filter(s => s.totalTasks > 0)
      .sort((a, b) => b.activeTasks - a.activeTasks)
      .slice(0, 6);

    // === Deals ===
    const formattedDeals = upcomingDeals.map(d => ({
      id: d.id,
      title: d.title,
      value: d.value,
      currency: d.currency,
      stage: d.stage,
      expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.toISOString() : null,
      companyName: d.company?.name || '',
      companyId: d.companyId
    }));

    // === Follow-ups ===
    const followups = followupCompanies.map(c => {
      const daysSince = c.lastInteractionAt
        ? Math.floor((now.getTime() - c.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const topDeal = c.deals[0] || null;
      return {
        companyId: c.id,
        companyName: c.name,
        lastInteractionAt: c.lastInteractionAt?.toISOString() || null,
        daysSinceContact: daysSince,
        activeDealsCount: c._count.deals,
        topDeal: topDeal ? { id: topDeal.id, title: topDeal.title, value: topDeal.value, stage: topDeal.stage } : null
      };
    });

    // === Week progress ===
    const dayMap = new Map<string, number>();
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const t of weekTasks) {
      if (t.completedAt) {
        const key = t.completedAt.toISOString().slice(0, 10);
        if (dayMap.has(key)) {
          dayMap.set(key, (dayMap.get(key) || 0) + 1);
        }
      }
    }
    const todayStr = today.toISOString().slice(0, 10);
    const weekDays = Array.from(dayMap.entries()).map(([date, completed]) => {
      const d = new Date(date + 'T00:00:00');
      return {
        dayName: SHORT_WEEKDAYS[d.getDay()],
        date,
        completed,
        isToday: date === todayStr
      };
    });

    const totalCompleted = weekTasks.length;

    // === Briefing ===
    const todayTaskCount = focusTasks.filter(t => t.dueDate && startOfDay(new Date(t.dueDate)).getTime() === today.getTime()).length;
    const urgentCount = rawTasks.filter(t => t.priority === 'URGENT').length;

    const summary: string[] = [];
    if (overdueCount > 0) summary.push(`${overdueCount} zaleglych zadan`);
    if (todayTaskCount > 0) summary.push(`${todayTaskCount} zadan na dzis`);
    else summary.push(`${focusTasks.length} priorytetowych zadan`);
    if (unprocessedCount > 0) summary.push(`${unprocessedCount} w Zrodle`);
    if (formattedDeals.length > 0) summary.push(`${formattedDeals.length} dealow w terminie`);

    let tip = 'Skup sie na jednej rzeczy naraz. Multitasking to mit.';
    if (unprocessedCount > 0 && unprocessedCount <= 10) {
      tip = `Zacznij od Zrodla - ${unprocessedCount} elementow, zajmie kilka minut.`;
    } else if (overdueCount > 3) {
      tip = 'Masz sporo zaleglosci. Przejrzyj i zamroz to, co nieaktualne.';
    } else if (focusTasks.length === 0) {
      tip = 'Brak pilnych zadan! Moze czas na planowanie?';
    }

    let urgencyLevel: 'calm' | 'busy' | 'critical' = 'calm';
    if (overdueCount > 3 || urgentCount > 2) urgencyLevel = 'critical';
    else if (overdueCount > 0 || focusTasks.length > 5) urgencyLevel = 'busy';

    res.json({
      briefing: {
        greeting: `Dzien dobry, ${firstName}!`,
        date: formatPolishDate(now),
        summary,
        tip,
        urgencyLevel
      },
      source: {
        unprocessedCount,
        awaitingDecisionCount
      },
      focusTasks,
      streams,
      upcomingDeals: formattedDeals,
      followups,
      weekProgress: {
        days: weekDays,
        totalCompleted,
        totalCreated: weekCreated
      },
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching day dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch day dashboard' });
  }
});

export default router;