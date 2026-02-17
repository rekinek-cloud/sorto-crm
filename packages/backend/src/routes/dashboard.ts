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

    return res.json({
      stats,
      recentTasks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
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

    return res.json({
      completedThisWeek,
      createdThisWeek,
      productivity: completedThisWeek / Math.max(createdThisWeek, 1) * 100
    });

  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return res.status(500).json({ error: 'Failed to fetch weekly summary' });
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

    return res.json({
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
    return res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
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

    return res.json({
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
    return res.status(500).json({ error: 'Failed to fetch day dashboard' });
  }
});

// ===========================================================================
// Dashboard Dnia — GET /day/timeline
// ===========================================================================

interface TimelineItem {
  type: 'MEETING' | 'TASK';
  title: string;
  startMin: number;
  durationMin: number;
  color: string;
}

interface TimeSlot {
  hour: number;
  items: TimelineItem[];
  fillPercent: number;
}

router.get('/day/timeline', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const dateParam = req.query.date as string | undefined;

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [meetings, tasks] = await Promise.all([
      prisma.meeting.findMany({
        where: {
          organizationId,
          startTime: { gte: dayStart, lte: dayEnd }
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true
        },
        orderBy: { startTime: 'asc' }
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
          dueDate: { gte: dayStart, lte: dayEnd }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          estimatedHours: true
        },
        orderBy: { dueDate: 'asc' }
      })
    ]);

    // Build hourly slots (8:00 - 18:00)
    const HOUR_START = 8;
    const HOUR_END = 18;
    const slots: TimeSlot[] = [];

    for (let h = HOUR_START; h <= HOUR_END; h++) {
      const items: TimelineItem[] = [];

      // Map meetings to this hour
      for (const m of meetings) {
        const start = new Date(m.startTime);
        const end = new Date(m.endTime);
        const mStartHour = start.getHours() + start.getMinutes() / 60;
        const mEndHour = end.getHours() + end.getMinutes() / 60;

        // Check if meeting overlaps with this hour slot [h, h+1)
        if (mStartHour < h + 1 && mEndHour > h) {
          const startMin = Math.max(start.getMinutes(), 0);
          const durationMin = Math.round((Math.min(mEndHour, h + 1) - Math.max(mStartHour, h)) * 60);
          items.push({
            type: 'MEETING',
            title: m.title,
            startMin: mStartHour >= h ? startMin : 0,
            durationMin: Math.max(durationMin, 1),
            color: '#3B82F6' // blue
          });
        }
      }

      // Map tasks to this hour (tasks placed at 9:00 by default, or spread across morning)
      for (const t of tasks) {
        // Place tasks at the beginning of business hours, spread by index
        const taskIndex = tasks.indexOf(t);
        const taskHour = HOUR_START + 1 + taskIndex; // start from 9:00
        if (taskHour === h) {
          const duration = t.estimatedHours ? Math.round(t.estimatedHours * 60) : 30;
          items.push({
            type: 'TASK',
            title: t.title,
            startMin: 0,
            durationMin: Math.min(duration, 60),
            color: '#22C55E' // green
          });
        }
      }

      const totalFilledMin = items.reduce((sum, item) => sum + item.durationMin, 0);
      const fillPercent = Math.min(Math.round((totalFilledMin / 60) * 100), 100);

      slots.push({ hour: h, items, fillPercent });
    }

    const now = new Date();
    const currentHour = now.getHours();

    return res.json({ currentHour, slots });

  } catch (error) {
    console.error('Error fetching day timeline:', error);
    return res.status(500).json({ error: 'Failed to fetch day timeline' });
  }
});

// ===========================================================================
// Manager Dashboard — GET /manager/team-activity
// ===========================================================================

router.get('/manager/team-activity', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get managed user IDs via UserRelation
    const relations = await prisma.user_relations.findMany({
      where: {
        managerId: userId,
        organizationId,
        isActive: true,
        relationType: { in: ['MANAGES', 'LEADS', 'SUPERVISES'] },
      },
      select: {
        employeeId: true,
        users_user_relations_employeeIdTousers: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const managedUserIds = relations.map(r => r.employeeId);
    const userNameMap = new Map<string, string>();
    for (const r of relations) {
      const u = r.users_user_relations_employeeIdTousers;
      userNameMap.set(u.id, `${u.firstName} ${u.lastName}`);
    }

    if (managedUserIds.length === 0) {
      return res.json({ activities: [] });
    }

    // Query last 10 completed tasks and last 10 updated deals in parallel
    const [completedTasks, updatedDeals] = await Promise.all([
      prisma.task.findMany({
        where: {
          organizationId,
          assignedToId: { in: managedUserIds },
          status: 'COMPLETED',
          completedAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          title: true,
          assignedToId: true,
          completedAt: true,
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
      prisma.deal.findMany({
        where: {
          organizationId,
          ownerId: { in: managedUserIds },
          updatedAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          title: true,
          ownerId: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Merge and sort activities by timestamp desc
    const activities: Array<{
      type: 'TASK_COMPLETED' | 'DEAL_UPDATED';
      userId: string;
      userName: string;
      title: string;
      timestamp: string;
    }> = [];

    for (const t of completedTasks) {
      activities.push({
        type: 'TASK_COMPLETED',
        userId: t.assignedToId!,
        userName: userNameMap.get(t.assignedToId!) || 'Unknown',
        title: t.title,
        timestamp: t.completedAt!.toISOString(),
      });
    }

    for (const d of updatedDeals) {
      activities.push({
        type: 'DEAL_UPDATED',
        userId: d.ownerId,
        userName: userNameMap.get(d.ownerId) || 'Unknown',
        title: d.title,
        timestamp: d.updatedAt.toISOString(),
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ activities: activities.slice(0, 20) });

  } catch (error) {
    console.error('Error fetching team activity:', error);
    return res.status(500).json({ error: 'Failed to fetch team activity' });
  }
});

// ===========================================================================
// Manager Dashboard — GET /manager/productivity
// ===========================================================================

router.get('/manager/productivity', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get managed users
    const relations = await prisma.user_relations.findMany({
      where: {
        managerId: userId,
        organizationId,
        isActive: true,
        relationType: { in: ['MANAGES', 'LEADS', 'SUPERVISES'] },
      },
      select: {
        employeeId: true,
        users_user_relations_employeeIdTousers: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (relations.length === 0) {
      return res.json({ members: [] });
    }

    const managedUserIds = relations.map(r => r.employeeId);

    // Count tasks completed in last 7 days and total assigned tasks per user
    const [completedCounts, totalCounts] = await Promise.all([
      prisma.task.groupBy({
        by: ['assignedToId'],
        where: {
          organizationId,
          assignedToId: { in: managedUserIds },
          status: 'COMPLETED',
          completedAt: { gte: sevenDaysAgo },
        },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['assignedToId'],
        where: {
          organizationId,
          assignedToId: { in: managedUserIds },
        },
        _count: true,
      }),
    ]);

    const completedMap = new Map<string, number>();
    for (const c of completedCounts) {
      if (c.assignedToId) completedMap.set(c.assignedToId, c._count);
    }

    const totalMap = new Map<string, number>();
    for (const t of totalCounts) {
      if (t.assignedToId) totalMap.set(t.assignedToId, t._count);
    }

    const members = relations.map(r => {
      const u = r.users_user_relations_employeeIdTousers;
      return {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        tasksCompleted: completedMap.get(u.id) || 0,
        tasksTotal: totalMap.get(u.id) || 0,
      };
    });

    // Sort descending by tasksCompleted
    members.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    return res.json({ members });

  } catch (error) {
    console.error('Error fetching team productivity:', error);
    return res.status(500).json({ error: 'Failed to fetch team productivity' });
  }
});

// ===========================================================================
// Manager Dashboard — GET /manager/risks
// ===========================================================================

router.get('/manager/risks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Query projects with deadline < 7 days from now that are not completed
    // Since Project has no 'progress' field, we calculate from tasks
    const [atRiskProjects, overdueTasks] = await Promise.all([
      prisma.project.findMany({
        where: {
          organizationId,
          status: { in: ['PLANNING', 'IN_PROGRESS'] },
          endDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        select: {
          id: true,
          name: true,
          endDate: true,
          tasks: {
            select: {
              status: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          status: { notIn: ['COMPLETED', 'CANCELED'] },
          dueDate: { lt: now },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          assignedTo: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
    ]);

    const risks: Array<{
      type: 'PROJECT_BEHIND' | 'TASK_OVERDUE';
      title: string;
      deadline: string | null;
      progress?: number;
      assignee?: string;
    }> = [];

    // Filter projects where progress < 50%
    for (const p of atRiskProjects) {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      if (progress < 50) {
        risks.push({
          type: 'PROJECT_BEHIND',
          title: p.name,
          deadline: p.endDate ? p.endDate.toISOString() : null,
          progress,
        });
      }
    }

    // Add overdue tasks
    for (const t of overdueTasks) {
      risks.push({
        type: 'TASK_OVERDUE',
        title: t.title,
        deadline: t.dueDate ? t.dueDate.toISOString() : null,
        assignee: t.assignedTo
          ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
          : undefined,
      });
    }

    return res.json({ risks });

  } catch (error) {
    console.error('Error fetching risks:', error);
    return res.status(500).json({ error: 'Failed to fetch risks' });
  }
});

export default router;
