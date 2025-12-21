import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

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

// Test endpoint without auth for verification
router.get('/test-public', async (req, res) => {
  try {
    // Use default organization for testing
    const organizationId = 'fe59f2b0-93d0-4193-9bab-aee778c1a449';

    const horizons = await prisma.gTDHorizon.findMany({
      where: { organizationId },
      orderBy: { level: 'asc' }
    });

    res.json({
      success: true,
      data: horizons,
      count: horizons.length,
      message: 'Goals fetched successfully (test mode)'
    });

  } catch (error) {
    console.error('Error in GTD Horizons test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals (test mode)',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all GTD Horizons for user's organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizons = await prisma.gTDHorizon.findMany({
      where: { organizationId },
      orderBy: { level: 'asc' }
    });

    // Map horizons with additional formatting
    const formattedHorizons = horizons.map(horizon => ({
      ...horizon,
      levelName: getLevelName(horizon.level),
      color: getLevelColor(horizon.level)
    }));

    res.json({
      success: true,
      data: formattedHorizons
    });

  } catch (error) {
    logger.error('Error fetching GTD horizons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals'
    });
  }
});

// Helper function to get level name
function getLevelName(level: number): string {
  const names: Record<number, string> = {
    0: 'Runway (Next Actions)',
    1: 'Current Projects',
    2: 'Areas of Focus',
    3: 'Goals (1-2 years)',
    4: 'Vision (3-5 years)',
    5: 'Purpose & Values'
  };
  return names[level] || `Level ${level}`;
}

// Helper function to get level color
function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: '#10B981', // green
    1: '#3B82F6', // blue
    2: '#8B5CF6', // purple
    3: '#F59E0B', // amber
    4: '#EF4444', // red
    5: '#EC4899'  // pink
  };
  return colors[level] || '#6B7280';
}

// Get specific horizon by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizon = await prisma.gTDHorizon.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!horizon) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...horizon,
        levelName: getLevelName(horizon.level),
        color: getLevelColor(horizon.level)
      }
    });

  } catch (error) {
    logger.error('Error fetching GTD horizon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goal'
    });
  }
});

// Mark horizon as reviewed
router.put('/:id/reviewed', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizon = await prisma.gTDHorizon.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!horizon) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    const updated = await prisma.gTDHorizon.update({
      where: { id },
      data: {
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Horizon marked as reviewed'
    });

  } catch (error) {
    logger.error('Error updating GTD horizon review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goal review'
    });
  }
});

// Helper function to get stats data
const getStatsData = async (organizationId: string) => {
  const horizons = await prisma.gTDHorizon.findMany({
    where: { organizationId }
  });

  const now = new Date();
  let overdueCount = 0;
  let todayCount = 0;

  horizons.forEach(horizon => {
    const lastReviewed = horizon.updatedAt;
    const nextReview = new Date(lastReviewed);

    switch (horizon.reviewFrequency) {
      case 'DAILY':
        nextReview.setDate(nextReview.getDate() + 1);
        break;
      case 'WEEKLY':
        nextReview.setDate(nextReview.getDate() + 7);
        break;
      case 'MONTHLY':
        nextReview.setMonth(nextReview.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextReview.setMonth(nextReview.getMonth() + 3);
        break;
      case 'YEARLY':
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        break;
    }

    const diffDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      overdueCount++;
    } else if (diffDays === 0) {
      todayCount++;
    }
  });

  return {
    totalHorizons: horizons.length,
    overdueReviews: overdueCount,
    todayReviews: todayCount,
    needsAttention: overdueCount + todayCount
  };
};

// Get GTD Horizons statistics (alias for /stats/overview)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);
    const data = await getStatsData(organizationId);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Error fetching GTD horizons stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals statistics'
    });
  }
});

// Get GTD Horizons statistics (original endpoint)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);
    const data = await getStatsData(organizationId);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Error fetching GTD horizons stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals statistics'
    });
  }
});

export default router;
