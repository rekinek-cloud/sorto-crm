import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth';
import { prisma } from '../config/database';
import logger from '../config/logger';

const router = Router();

// Helper function to get user's organization
const getUserOrganizationId = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.organizationId;
};

/**
 * GET /api/v1/precise-goals
 * Pobierz wszystkie Cele Precyzyjne (RZUT) dla organizacji
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);
    const { status, streamId } = req.query;

    const where: any = {
      organization_id: organizationId
    };

    if (status) {
      where.status = status;
    }

    if (streamId) {
      where.stream_id = streamId;
    }

    const goals = await prisma.precise_goals.findMany({
      where,
      include: {
        streams: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: { deadline: 'asc' }
    });

    // Format response
    const formattedGoals = goals.map(goal => ({
      id: goal.id,
      // RZUT fields (Rezultat, Zmierzalność, Ujście, Tło)
      result: goal.result,           // R - Rezultat
      measurement: goal.measurement, // Z - Zmierzalność
      outlet: goal.outlet,           // U - Ujście
      deadline: goal.deadline,
      background: goal.background,   // T - Tło
      // Metrics
      currentValue: Number(goal.current_value) || 0,
      targetValue: Number(goal.target_value),
      unit: goal.unit || 'count',
      progress: goal.target_value ? Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100) : 0,
      // Relations
      streamId: goal.stream_id,
      stream: goal.streams,
      // Status
      status: goal.status,
      // Timestamps
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      achievedAt: goal.achieved_at
    }));

    res.json({
      success: true,
      goals: formattedGoals,
      data: formattedGoals,  // dla kompatybilności
      count: formattedGoals.length,
      pagination: {
        page: 1,
        limit: 100,
        total: formattedGoals.length,
        totalPages: 1
      }
    });

  } catch (error) {
    logger.error('Error fetching precise goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch precise goals'
    });
  }
});

/**
 * GET /api/v1/goals/stats
 * Statystyki Celów Precyzyjnych - MUSI BYĆ PRZED /:id!
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);

    const [total, active, achieved, failed, paused] = await Promise.all([
      prisma.precise_goals.count({ where: { organization_id: organizationId } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'active' } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'achieved' } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'failed' } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'paused' } })
    ]);

    // Calculate average progress
    const goals = await prisma.precise_goals.findMany({
      where: { organization_id: organizationId },
      select: { current_value: true, target_value: true }
    });

    let averageProgress = 0;
    if (goals.length > 0) {
      const totalProgress = goals.reduce((sum, g) => {
        const progress = g.target_value ? (Number(g.current_value) / Number(g.target_value)) * 100 : 0;
        return sum + Math.min(progress, 100);
      }, 0);
      averageProgress = totalProgress / goals.length;
    }

    res.json({
      total,
      active,
      achieved,
      failed,
      paused,
      averageProgress
    });

  } catch (error) {
    logger.error('Error fetching goals stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals statistics'
    });
  }
});

/**
 * GET /api/v1/goals/stats/overview
 * Statystyki Celów Precyzyjnych (szczegółowe)
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);

    const [total, active, achieved, failed] = await Promise.all([
      prisma.precise_goals.count({ where: { organization_id: organizationId } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'active' } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'achieved' } }),
      prisma.precise_goals.count({ where: { organization_id: organizationId, status: 'failed' } })
    ]);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const approaching = await prisma.precise_goals.count({
      where: {
        organization_id: organizationId,
        status: 'active',
        deadline: { lte: nextWeek }
      }
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        achieved,
        failed,
        approaching,
        achievementRate: total > 0 ? Math.round((achieved / total) * 100) : 0
      }
    });

  } catch (error) {
    logger.error('Error fetching precise goals stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch precise goals statistics'
    });
  }
});

/**
 * GET /api/v1/precise-goals/:id
 * Pobierz pojedynczy Cel Precyzyjny
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const goal = await prisma.precise_goals.findFirst({
      where: {
        id,
        organization_id: organizationId
      },
      include: {
        streams: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Precise goal not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: goal.id,
        // RZUT fields
        result: goal.result,           // R - Rezultat
        measurement: goal.measurement, // Z - Zmierzalność
        outlet: goal.outlet,           // U - Ujście
        deadline: goal.deadline,
        background: goal.background,   // T - Tło
        currentValue: Number(goal.current_value) || 0,
        targetValue: Number(goal.target_value),
        unit: goal.unit || 'count',
        progress: goal.target_value ? Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100) : 0,
        streamId: goal.stream_id,
        stream: goal.streams,
        status: goal.status,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
        achievedAt: goal.achieved_at
      }
    });

  } catch (error) {
    logger.error('Error fetching precise goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch precise goal'
    });
  }
});

/**
 * POST /api/v1/precise-goals
 * Utwórz nowy Cel Precyzyjny (RZUT)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);
    const {
      result,
      measurement,
      outlet,
      deadline,
      background,
      targetValue,
      unit,
      streamId
    } = req.body;

    // Validation - RZUT: Rezultat, Zmierzalność, Ujście, Tło
    if (!result || !measurement || !deadline || !targetValue) {
      return res.status(400).json({
        success: false,
        error: 'Missing required RZUT fields: result (R), measurement (Z), deadline, targetValue'
      });
    }

    const goal = await prisma.precise_goals.create({
      data: {
        result,           // R - Rezultat
        measurement,      // Z - Zmierzalność
        outlet: outlet || null,  // U - Ujście
        deadline: new Date(deadline),
        background: background || null,  // T - Tło
        target_value: targetValue,
        current_value: 0,
        unit: unit || 'count',
        stream_id: streamId || null,
        organization_id: organizationId,
        created_by_id: req.user.id,
        status: 'active'
      },
      include: {
        streams: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: goal.id,
        // RZUT fields
        result: goal.result,           // R - Rezultat
        measurement: goal.measurement, // Z - Zmierzalność
        outlet: goal.outlet,           // U - Ujście
        deadline: goal.deadline,
        background: goal.background,   // T - Tło
        currentValue: 0,
        targetValue: Number(goal.target_value),
        unit: goal.unit,
        progress: 0,
        streamId: goal.stream_id,
        stream: goal.streams,
        status: goal.status,
        createdAt: goal.created_at
      },
      message: 'Precise goal created successfully'
    });

  } catch (error) {
    logger.error('Error creating precise goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create precise goal'
    });
  }
});

/**
 * PUT /api/v1/precise-goals/:id
 * Aktualizuj Cel Precyzyjny
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const existingGoal = await prisma.precise_goals.findFirst({
      where: {
        id,
        organization_id: organizationId
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Precise goal not found'
      });
    }

    const {
      result,
      measurement,
      outlet,
      deadline,
      background,
      currentValue,
      targetValue,
      unit,
      streamId,
      status
    } = req.body;

    const updateData: any = {
      updated_at: new Date()
    };

    // RZUT fields
    if (result !== undefined) updateData.result = result;           // R - Rezultat
    if (measurement !== undefined) updateData.measurement = measurement; // Z - Zmierzalność
    if (outlet !== undefined) updateData.outlet = outlet;           // U - Ujście
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (background !== undefined) updateData.background = background; // T - Tło
    if (currentValue !== undefined) updateData.current_value = currentValue;
    if (targetValue !== undefined) updateData.target_value = targetValue;
    if (unit !== undefined) updateData.unit = unit;
    if (streamId !== undefined) updateData.stream_id = streamId;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'achieved') {
        updateData.achieved_at = new Date();
      }
    }

    const goal = await prisma.precise_goals.update({
      where: { id },
      data: updateData,
      include: {
        streams: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: goal.id,
        // RZUT fields
        result: goal.result,           // R - Rezultat
        measurement: goal.measurement, // Z - Zmierzalność
        outlet: goal.outlet,           // U - Ujście
        deadline: goal.deadline,
        background: goal.background,   // T - Tło
        currentValue: Number(goal.current_value) || 0,
        targetValue: Number(goal.target_value),
        unit: goal.unit,
        progress: goal.target_value ? Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100) : 0,
        streamId: goal.stream_id,
        stream: goal.streams,
        status: goal.status,
        updatedAt: goal.updated_at,
        achievedAt: goal.achieved_at
      },
      message: 'Precise goal updated successfully'
    });

  } catch (error) {
    logger.error('Error updating precise goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update precise goal'
    });
  }
});

/**
 * PUT/PATCH /api/v1/precise-goals/:id/progress
 * Aktualizuj postęp celu
 */
router.patch('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;
    const organizationId = await getUserOrganizationId(req.user.id);

    const existingGoal = await prisma.precise_goals.findFirst({
      where: {
        id,
        organization_id: organizationId
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Precise goal not found'
      });
    }

    const updateData: any = {
      current_value: currentValue,
      updated_at: new Date()
    };

    // Auto-achieve if target reached
    if (currentValue >= Number(existingGoal.target_value)) {
      updateData.status = 'achieved';
      updateData.achieved_at = new Date();
    }

    const goal = await prisma.precise_goals.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        id: goal.id,
        currentValue: Number(goal.current_value),
        targetValue: Number(goal.target_value),
        progress: Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100),
        status: goal.status,
        achievedAt: goal.achieved_at
      },
      message: 'Progress updated successfully'
    });

  } catch (error) {
    logger.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;
    const organizationId = await getUserOrganizationId(req.user.id);

    const existingGoal = await prisma.precise_goals.findFirst({
      where: {
        id,
        organization_id: organizationId
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Precise goal not found'
      });
    }

    const updateData: any = {
      current_value: currentValue,
      updated_at: new Date()
    };

    // Auto-achieve if target reached
    if (currentValue >= Number(existingGoal.target_value)) {
      updateData.status = 'achieved';
      updateData.achieved_at = new Date();
    }

    const goal = await prisma.precise_goals.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        id: goal.id,
        currentValue: Number(goal.current_value),
        targetValue: Number(goal.target_value),
        progress: Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100),
        status: goal.status,
        achievedAt: goal.achieved_at
      },
      message: 'Progress updated successfully'
    });

  } catch (error) {
    logger.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

/**
 * DELETE /api/v1/precise-goals/:id
 * Usuń Cel Precyzyjny
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const existingGoal = await prisma.precise_goals.findFirst({
      where: {
        id,
        organization_id: organizationId
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Precise goal not found'
      });
    }

    await prisma.precise_goals.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Precise goal deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting precise goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete precise goal'
    });
  }
});

/**
 * POST /api/v1/goals/:id/achieve
 * Oznacz cel jako osiągnięty
 */
router.post('/:id/achieve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const existingGoal = await prisma.precise_goals.findFirst({
      where: {
        id,
        organization_id: organizationId
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Precise goal not found'
      });
    }

    const goal = await prisma.precise_goals.update({
      where: { id },
      data: {
        status: 'achieved',
        achieved_at: new Date(),
        current_value: existingGoal.target_value, // Set current to target
        updated_at: new Date()
      },
      include: {
        streams: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: goal.id,
        result: goal.result,
        currentValue: Number(goal.current_value),
        targetValue: Number(goal.target_value),
        progress: 100,
        status: goal.status,
        achievedAt: goal.achieved_at
      },
      message: 'Goal marked as achieved'
    });

  } catch (error) {
    logger.error('Error achieving goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark goal as achieved'
    });
  }
});

export default router;
