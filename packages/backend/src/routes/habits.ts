import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

// Get all habits with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const {
      page = '1',
      limit = '20',
      isActive,
      frequency,
      sortBy = 'name',
      sortOrder = 'asc',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (isActive !== undefined && isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (frequency && frequency !== 'all') {
      where.frequency = frequency;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get habits with entry counts
    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        include: {
          _count: {
            select: {
              entries: true
            }
          },
          entries: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 7))
              }
            },
            orderBy: {
              date: 'desc'
            },
            take: 7
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.habit.count({ where })
    ]);

    const pages = Math.ceil(total / limitNum);

    res.json({
      habits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching habits:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get habits statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalHabits,
      activeHabits,
      habitsWithEntries,
      todayEntries,
      weeklyCompletionRate,
      longestStreak
    ] = await Promise.all([
      prisma.habit.count({
        where: { organizationId }
      }),
      prisma.habit.count({
        where: { organizationId, isActive: true }
      }),
      prisma.habit.count({
        where: {
          organizationId,
          entries: {
            some: {}
          }
        }
      }),
      prisma.habitEntry.count({
        where: {
          habit: { organizationId },
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          },
          completed: true
        }
      }),
      prisma.habitEntry.aggregate({
        where: {
          habit: { organizationId },
          date: { gte: weekAgo },
          completed: true
        },
        _count: {
          id: true
        }
      }),
      prisma.habit.aggregate({
        where: { organizationId },
        _max: {
          bestStreak: true
        }
      })
    ]);

    // Calculate weekly completion rate
    const totalPossibleEntries = await prisma.habit.count({
      where: { organizationId, isActive: true }
    }) * 7; // Assuming daily habits for simplicity

    const completionRate = totalPossibleEntries > 0 
      ? Math.round((weeklyCompletionRate._count.id / totalPossibleEntries) * 100)
      : 0;

    res.json({
      totalHabits,
      activeHabits,
      inactiveHabits: totalHabits - activeHabits,
      habitsWithEntries,
      todayCompleted: todayEntries,
      weeklyCompletionRate: completionRate,
      longestStreak: longestStreak._max.bestStreak || 0
    });
  } catch (error) {
    logger.error('Error fetching habits stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single habit by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        entries: {
          orderBy: {
            date: 'desc'
          },
          take: 30 // Last 30 days
        },
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json(habit);
  } catch (error) {
    logger.error('Error fetching habit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new habit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { name, description, frequency = 'DAILY' } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        frequency,
        organizationId
      },
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    logger.info(`Created habit: ${habit.id} for organization: ${organizationId}`);
    res.status(201).json(habit);
  } catch (error) {
    logger.error('Error creating habit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update habit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const { name, description, frequency, isActive } = req.body;

    const existingHabit = await prisma.habit.findFirst({
      where: { id, organizationId }
    });

    if (!existingHabit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (isActive !== undefined) updateData.isActive = isActive;

    const habit = await prisma.habit.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    logger.info(`Updated habit: ${id} for organization: ${organizationId}`);
    res.json(habit);
  } catch (error) {
    logger.error('Error updating habit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete habit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit has entries
    if (habit._count.entries > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete habit with entries',
        entryCount: habit._count.entries
      });
    }

    await prisma.habit.delete({
      where: { id }
    });

    logger.info(`Deleted habit: ${id} for organization: ${organizationId}`);
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    logger.error('Error deleting habit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create or update habit entry for a specific date
router.post('/:id/entries', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const { date, completed = true, notes } = req.body;

    const habit = await prisma.habit.findFirst({
      where: { id, organizationId }
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const entryDate = new Date(date);
    
    // Upsert habit entry
    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId: id,
          date: entryDate
        }
      },
      update: {
        completed,
        notes: notes?.trim() || null
      },
      create: {
        habitId: id,
        date: entryDate,
        completed,
        notes: notes?.trim() || null
      }
    });

    // Update streaks if completing for today or recent dates
    if (completed) {
      await updateHabitStreaks(id);
    }

    logger.info(`Created/updated habit entry for habit: ${id}, date: ${date}`);
    res.json(entry);
  } catch (error) {
    logger.error('Error creating habit entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get habit calendar data
router.get('/:id/calendar', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;
    const { year, month } = req.query;

    const habit = await prisma.habit.findFirst({
      where: { id, organizationId }
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Get entries for the specified month/year or current month
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();
    
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const entries = await prisma.habitEntry.findMany({
      where: {
        habitId: id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json({
      habit,
      entries,
      year: currentYear,
      month: currentMonth + 1
    });
  } catch (error) {
    logger.error('Error fetching habit calendar:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to update habit streaks
async function updateHabitStreaks(habitId: string) {
  try {
    // Get all completed entries for this habit, ordered by date
    const completedEntries = await prisma.habitEntry.findMany({
      where: {
        habitId,
        completed: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (completedEntries.length === 0) {
      return;
    }

    // Calculate current streak (consecutive days from today backwards)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from today and work backwards
    for (let i = 0; i < completedEntries.length; i++) {
      const entryDate = new Date(completedEntries[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const entry of completedEntries.reverse()) {
      const entryDate = new Date(entry.date);
      
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const dayDiff = Math.floor((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastDate = entryDate;
    }
    
    bestStreak = Math.max(bestStreak, tempStreak);

    // Update habit with new streak values
    await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak,
        bestStreak: Math.max(bestStreak, currentStreak)
      }
    });
  } catch (error) {
    logger.error('Error updating habit streaks:', error);
  }
}

export default router;