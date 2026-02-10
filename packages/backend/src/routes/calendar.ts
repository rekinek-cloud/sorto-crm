import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

// Calendar event interface
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'TASK' | 'PROJECT' | 'MEETING' | 'RECURRING_TASK' | 'DEAL' | 'INVOICE' | 'WEEKLY_REVIEW' | 'HABIT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: string;
  color?: string;
  category?: string;
  location?: string;
  attendees?: string[];
  metadata?: {
    originalEntity: string;
    entityId: string;
    assignedTo?: string;
    project?: string;
    company?: string;
  };
}

// GET /api/v1/calendar/events - Get all calendar events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { 
      startDate, 
      endDate, 
      types,
      priority,
      assignedToId 
    } = req.query;

    logger.info(`Calendar events request for org ${organizationId}`);

    const events: CalendarEvent[] = [];

    // Date filters
    const start = startDate ? new Date(startDate as string) : new Date();
    start.setDate(start.getDate() - 30); // Default: last 30 days
    
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setDate(end.getDate() + 90); // Default: next 90 days

    const typeFilter = types ? (types as string).split(',') : [];
    
    // 1. TASKS with due dates
    if (typeFilter.length === 0 || typeFilter.includes('TASK')) {
      const tasks = await prisma.task.findMany({
        where: {
          organizationId,
          dueDate: {
            gte: start,
            lte: end
          },
          ...(priority && { priority: priority as any }),
          ...(assignedToId && { assignedToId: assignedToId as string })
        },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, name: true } },
          companies: { select: { id: true, name: true } },
          context: { select: { id: true, name: true, color: true } }
        }
      });

      tasks.forEach(task => {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          description: task.description || undefined,
          startDate: task.dueDate!.toISOString(),
          type: 'TASK',
          priority: task.priority,
          status: task.status,
          color: task.context?.color || '#3B82F6',
          category: task.context?.name,
          metadata: {
            originalEntity: 'Task',
            entityId: task.id,
            assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : undefined,
            project: task.project?.name,
            company: task.companies?.name
          }
        });
      });
    }

    // 2. PROJECTS with start/end dates
    if (typeFilter.length === 0 || typeFilter.includes('PROJECT')) {
      const projects = await prisma.project.findMany({
        where: {
          organizationId,
          OR: [
            {
              startDate: {
                gte: start,
                lte: end
              }
            },
            {
              endDate: {
                gte: start,
                lte: end
              }
            }
          ],
          ...(priority && { priority: priority as any }),
          ...(assignedToId && { assignedToId: assignedToId as string })
        },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          stream: { select: { id: true, name: true, color: true } }
        }
      });

      projects.forEach(project => {
        // Project start event
        if (project.startDate && project.startDate >= start && project.startDate <= end) {
          events.push({
            id: `project-start-${project.id}`,
            title: `Start: ${project.name}`,
            description: project.description || undefined,
            startDate: project.startDate.toISOString(),
            type: 'PROJECT',
            priority: project.priority,
            status: project.status,
            color: project.stream?.color || '#10B981',
            category: 'Project Start',
            metadata: {
              originalEntity: 'Project',
              entityId: project.id,
              assignedTo: project.assignedTo ? `${project.assignedTo.firstName} ${project.assignedTo.lastName}` : undefined
            }
          });
        }

        // Project end event
        if (project.endDate && project.endDate >= start && project.endDate <= end) {
          events.push({
            id: `project-end-${project.id}`,
            title: `End: ${project.name}`,
            description: project.description || undefined,
            startDate: project.endDate.toISOString(),
            type: 'PROJECT',
            priority: project.priority,
            status: project.status,
            color: project.stream?.color || '#10B981',
            category: 'Project End',
            metadata: {
              originalEntity: 'Project',
              entityId: project.id,
              assignedTo: project.assignedTo ? `${project.assignedTo.firstName} ${project.assignedTo.lastName}` : undefined
            }
          });
        }
      });
    }

    // 3. MEETINGS
    if (typeFilter.length === 0 || typeFilter.includes('MEETING')) {
      const meetings = await prisma.meeting.findMany({
        where: {
          organizationId,
          startTime: {
            gte: start,
            lte: end
          },
          ...(assignedToId && { organizedById: assignedToId as string })
        },
        include: {
          organizedBy: { select: { id: true, firstName: true, lastName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      meetings.forEach(meeting => {
        events.push({
          id: `meeting-${meeting.id}`,
          title: `${meeting.title}`,
          description: meeting.agenda || undefined,
          startDate: meeting.startTime.toISOString(),
          endDate: meeting.endTime?.toISOString(),
          type: 'MEETING',
          status: meeting.status,
          color: '#8B5CF6',
          category: 'Meeting',
          location: meeting.location || undefined,
          metadata: {
            originalEntity: 'Meeting',
            entityId: meeting.id,
            assignedTo: meeting.organizedBy ? `${meeting.organizedBy.firstName} ${meeting.organizedBy.lastName}` : undefined
          }
        });
      });
    }

    // 4. RECURRING TASKS (next occurrences)
    if (typeFilter.length === 0 || typeFilter.includes('RECURRING_TASK')) {
      const recurringTasks = await prisma.recurringTask.findMany({
        where: {
          organizationId,
          isActive: true,
          nextOccurrence: {
            gte: start,
            lte: end
          },
          ...(priority && { priority: priority as any }),
          ...(assignedToId && { assignedToId: assignedToId as string })
        },
        include: {
          users: { select: { id: true, firstName: true, lastName: true } },
          projects: { select: { id: true, name: true } },
          companies: { select: { id: true, name: true } }
        }
      });

      recurringTasks.forEach(task => {
        if (task.nextOccurrence) {
          events.push({
            id: `recurring-${task.id}`,
            title: `${task.title}`,
            description: task.description || undefined,
            startDate: task.nextOccurrence.toISOString(),
            type: 'RECURRING_TASK',
            priority: task.priority,
            color: '#F59E0B',
            category: `${task.frequency} Task`,
            metadata: {
              originalEntity: 'RecurringTask',
              entityId: task.id,
              assignedTo: task.users ? `${task.users.firstName} ${task.users.lastName}` : undefined,
              project: task.projects?.name,
              company: task.companies?.name
            }
          });
        }
      });
    }

    // 5. DEALS (close dates)
    if (typeFilter.length === 0 || typeFilter.includes('DEAL')) {
      const deals = await prisma.deal.findMany({
        where: {
          organizationId,
          expectedCloseDate: {
            gte: start,
            lte: end
          },
          stage: {
            not: 'CLOSED_WON'
          }
        },
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      deals.forEach(deal => {
        if (deal.expectedCloseDate) {
          events.push({
            id: `deal-${deal.id}`,
            title: `${deal.title}`,
            description: `Value: ${deal.value} ${deal.currency}`,
            startDate: deal.expectedCloseDate.toISOString(),
            type: 'DEAL',
            status: deal.stage,
            color: '#EF4444',
            category: 'Deal Close',
            metadata: {
              originalEntity: 'Deal',
              entityId: deal.id,
              assignedTo: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : undefined,
              company: deal.company?.name
            }
          });
        }
      });
    }

    // 6. HABITS (daily occurrences in date range)
    if (typeFilter.length === 0 || typeFilter.includes('HABIT')) {
      const habits = await prisma.habit.findMany({
        where: {
          organizationId,
          isActive: true
        }
      });

      habits.forEach(habit => {
        // Generate habit events for each day in range (simplified)
        const currentDate = new Date(start);
        while (currentDate <= end) {
          // Simple daily habit logic (could be expanded for different frequencies)
          events.push({
            id: `habit-${habit.id}-${currentDate.getTime()}`,
            title: `${habit.name}`,
            description: habit.description || undefined,
            startDate: currentDate.toISOString(),
            type: 'HABIT',
            color: '#14B8A6',
            category: 'Daily Habit',
            metadata: {
              originalEntity: 'Habit',
              entityId: habit.id
            }
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    logger.info(`Found ${events.length} calendar events`);

    res.json({
      success: true,
      data: {
        events,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        summary: {
          total: events.length,
          byType: events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/calendar/summary - Get calendar summary stats
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [
      tasksThisWeek,
      meetingsThisWeek,
      recurringThisWeek,
      dealsThisWeek
    ] = await Promise.all([
      prisma.task.count({
        where: {
          organizationId,
          dueDate: { gte: today, lte: nextWeek }
        }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          startTime: { gte: today, lte: nextWeek }
        }
      }),
      prisma.recurringTask.count({
        where: {
          organizationId,
          isActive: true,
          nextOccurrence: { gte: today, lte: nextWeek }
        }
      }),
      prisma.deal.count({
        where: {
          organizationId,
          expectedCloseDate: { gte: today, lte: nextWeek }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        thisWeek: {
          tasks: tasksThisWeek,
          meetings: meetingsThisWeek,
          recurringTasks: recurringThisWeek,
          deals: dealsThisWeek,
          total: tasksThisWeek + meetingsThisWeek + recurringThisWeek + dealsThisWeek
        },
        dateRange: {
          start: today.toISOString(),
          end: nextWeek.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching calendar summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;