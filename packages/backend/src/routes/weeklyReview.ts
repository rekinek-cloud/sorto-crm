import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createWeeklyReviewSchema = z.object({
  reviewDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  nextActions: z.string().optional(),
  // GTD Checklist items
  collectLoosePapers: z.boolean().default(false),
  processNotes: z.boolean().default(false),
  emptyInbox: z.boolean().default(false),
  processVoicemails: z.boolean().default(false),
  reviewActionLists: z.boolean().default(false),
  reviewCalendar: z.boolean().default(false),
  reviewProjects: z.boolean().default(false),
  reviewWaitingFor: z.boolean().default(false),
  reviewSomedayMaybe: z.boolean().default(false),
});

const updateWeeklyReviewSchema = z.object({
  notes: z.string().optional(),
  nextActions: z.string().optional(),
  // GTD Checklist items
  collectLoosePapers: z.boolean().optional(),
  processNotes: z.boolean().optional(),
  emptyInbox: z.boolean().optional(),
  processVoicemails: z.boolean().optional(),
  reviewActionLists: z.boolean().optional(),
  reviewCalendar: z.boolean().optional(),
  reviewProjects: z.boolean().optional(),
  reviewWaitingFor: z.boolean().optional(),
  reviewSomedayMaybe: z.boolean().optional(),
});

const querySchema = z.object({
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Get weekly reviews with pagination and filtering
router.get('/', authenticateToken, validateRequest(querySchema, 'query'), async (req, res) => {
  try {
    const { limit = 10, offset = 0, startDate, endDate } = req.query as any;
    const { organizationId } = req.user as any;

    const where: any = {
      organizationId,
    };

    if (startDate && endDate) {
      where.reviewDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [reviews, total] = await Promise.all([
      prisma.weeklyReview.findMany({
        where,
        orderBy: { reviewDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.weeklyReview.count({ where }),
    ]);

    res.json({
      reviews,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching weekly reviews:', error);
    res.status(500).json({ error: 'Failed to fetch weekly reviews' });
  }
});

// Get specific weekly review by date
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { organizationId } = req.user as any;

    const reviewDate = new Date(date);
    
    const review = await prisma.weeklyReview.findUnique({
      where: {
        organizationId_reviewDate: {
          organizationId,
          reviewDate,
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Weekly review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching weekly review:', error);
    res.status(500).json({ error: 'Failed to fetch weekly review' });
  }
});

// Create new weekly review
router.post('/', authenticateToken, validateRequest(createWeeklyReviewSchema), async (req, res) => {
  try {
    const { organizationId } = req.user as any;
    const reviewData = req.body;

    // Calculate task statistics for the review period
    const weekStart = new Date(reviewData.reviewDate);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const [completedTasks, newTasks, stalledTasks] = await Promise.all([
      // Completed tasks in the last week
      prisma.task.count({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: {
            gte: weekStart,
            lt: reviewData.reviewDate,
          },
        },
      }),
      // New tasks created in the last week
      prisma.task.count({
        where: {
          organizationId,
          createdAt: {
            gte: weekStart,
            lt: reviewData.reviewDate,
          },
        },
      }),
      // Stalled tasks (overdue and not completed)
      prisma.task.count({
        where: {
          organizationId,
          status: {
            not: 'COMPLETED',
          },
          dueDate: {
            lt: new Date(),
          },
        },
      }),
    ]);

    const review = await prisma.weeklyReview.create({
      data: {
        ...reviewData,
        organizationId,
        completedTasksCount: completedTasks,
        newTasksCount: newTasks,
        stalledTasks,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Weekly review for this date already exists' });
    }
    console.error('Error creating weekly review:', error);
    res.status(500).json({ error: 'Failed to create weekly review' });
  }
});

// Update weekly review
router.put('/:date', authenticateToken, validateRequest(updateWeeklyReviewSchema), async (req, res) => {
  try {
    const { date } = req.params;
    const { organizationId } = req.user as any;
    const updateData = req.body;

    const reviewDate = new Date(date);

    const review = await prisma.weeklyReview.update({
      where: {
        organizationId_reviewDate: {
          organizationId,
          reviewDate,
        },
      },
      data: updateData,
    });

    res.json(review);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Weekly review not found' });
    }
    console.error('Error updating weekly review:', error);
    res.status(500).json({ error: 'Failed to update weekly review' });
  }
});

// Delete weekly review
router.delete('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { organizationId } = req.user as any;

    const reviewDate = new Date(date);

    await prisma.weeklyReview.delete({
      where: {
        organizationId_reviewDate: {
          organizationId,
          reviewDate,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Weekly review not found' });
    }
    console.error('Error deleting weekly review:', error);
    res.status(500).json({ error: 'Failed to delete weekly review' });
  }
});

// Get weekly review statistics and insights
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user as any;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get current week data
    const [
      inboxItems,
      waitingForItems,
      completedThisWeek,
      overdueItems,
      nextActions,
      projects,
      somedayMaybeItems,
    ] = await Promise.all([
      // Inbox items (unprocessed tasks)
      prisma.task.count({
        where: {
          organizationId,
          status: 'BACKLOG',
        },
      }),
      // Waiting for items
      prisma.task.count({
        where: {
          organizationId,
          status: 'TODO',
          assignedToId: { not: null },
        },
      }),
      // Completed this week
      prisma.task.count({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: {
            gte: weekStart,
          },
        },
      }),
      // Overdue items
      prisma.task.count({
        where: {
          organizationId,
          status: {
            not: 'COMPLETED',
          },
          dueDate: {
            lt: now,
          },
        },
      }),
      // Next actions
      prisma.task.count({
        where: {
          organizationId,
          status: 'TODO',
          context: {
            not: null,
          },
        },
      }),
      // Active projects
      prisma.project.count({
        where: {
          organizationId,
          status: 'IN_PROGRESS',
        },
      }),
      // Someday/maybe items (tasks with no due date and low priority)
      prisma.task.count({
        where: {
          organizationId,
          status: 'BACKLOG',
          priority: 'LOW',
          dueDate: null,
        },
      }),
    ]);

    // Get progress on current week's review if it exists
    const currentWeekReview = await prisma.weeklyReview.findFirst({
      where: {
        organizationId,
        reviewDate: {
          gte: weekStart,
        },
      },
      orderBy: {
        reviewDate: 'desc',
      },
    });

    let reviewProgress = 0;
    if (currentWeekReview) {
      const checklistItems = [
        currentWeekReview.collectLoosePapers,
        currentWeekReview.processNotes,
        currentWeekReview.emptyInbox,
        currentWeekReview.processVoicemails,
        currentWeekReview.reviewActionLists,
        currentWeekReview.reviewCalendar,
        currentWeekReview.reviewProjects,
        currentWeekReview.reviewWaitingFor,
        currentWeekReview.reviewSomedayMaybe,
      ];
      const completedItems = checklistItems.filter(Boolean).length;
      reviewProgress = Math.round((completedItems / checklistItems.length) * 100);
    }

    res.json({
      currentWeek: {
        inboxItems,
        waitingForItems,
        completedThisWeek,
        overdueItems,
        nextActions,
        projects,
        somedayMaybeItems,
        reviewProgress,
        hasCurrentReview: !!currentWeekReview,
      },
      insights: {
        productivity: completedThisWeek > 10 ? 'high' : completedThisWeek > 5 ? 'medium' : 'low',
        urgency: overdueItems > 5 ? 'high' : overdueItems > 2 ? 'medium' : 'low',
        organization: inboxItems < 5 ? 'good' : inboxItems < 10 ? 'fair' : 'needs-attention',
      },
    });
  } catch (error) {
    console.error('Error fetching weekly review stats:', error);
    res.status(500).json({ error: 'Failed to fetch weekly review statistics' });
  }
});

// Get historical weekly review data for burndown chart
router.get('/stats/burndown', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user as any;
    const { weeks = 12 } = req.query;
    
    const weeksBack = parseInt(weeks as string);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeksBack * 7));

    // Get weekly reviews in the specified period
    const reviews = await prisma.weeklyReview.findMany({
      where: {
        organizationId,
        reviewDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        reviewDate: 'asc',
      },
    });

    // Generate burndown data
    const burndownData = [];
    const startOfFirstWeek = new Date(startDate);
    
    for (let week = 0; week < weeksBack; week++) {
      const weekStart = new Date(startOfFirstWeek);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Find review for this week
      const weekReview = reviews.find(review => {
        const reviewDate = new Date(review.reviewDate);
        return reviewDate >= weekStart && reviewDate <= weekEnd;
      });

      // Calculate metrics for this week
      const [completedTasks, totalTasks] = await Promise.all([
        prisma.task.count({
          where: {
            organizationId,
            status: 'COMPLETED',
            completedAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        }),
        prisma.task.count({
          where: {
            organizationId,
            createdAt: {
              lte: weekEnd,
            },
          },
        }),
      ]);

      const reviewCompletion = weekReview ? (() => {
        const checklistItems = [
          weekReview.collectLoosePapers,
          weekReview.processNotes,
          weekReview.emptyInbox,
          weekReview.processVoicemails,
          weekReview.reviewActionLists,
          weekReview.reviewCalendar,
          weekReview.reviewProjects,
          weekReview.reviewWaitingFor,
          weekReview.reviewSomedayMaybe,
        ];
        const completedItems = checklistItems.filter(Boolean).length;
        return Math.round((completedItems / checklistItems.length) * 100);
      })() : 0;

      burndownData.push({
        week: week + 1,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        completedTasks,
        totalTasks,
        reviewCompletion,
        hasReview: !!weekReview,
        stalledTasks: weekReview?.stalledTasks || 0,
        newTasks: weekReview?.newTasksCount || 0,
      });
    }

    res.json({
      burndownData,
      summary: {
        totalWeeks: weeksBack,
        weeksWithReview: reviews.length,
        reviewCompletionRate: Math.round((reviews.length / weeksBack) * 100),
        averageTasksCompleted: Math.round(
          burndownData.reduce((sum, week) => sum + week.completedTasks, 0) / burndownData.length
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching weekly review burndown data:', error);
    res.status(500).json({ error: 'Failed to fetch burndown data' });
  }
});

export default router;