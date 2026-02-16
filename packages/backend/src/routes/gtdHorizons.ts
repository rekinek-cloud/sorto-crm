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

// Test endpoint without auth for verification
router.get('/test-public', async (req, res) => {
  try {
    // Use default organization for testing
    const organizationId = 'fe59f2b0-93d0-4193-9bab-aee778c1a449';

    const horizons = await prisma.goal.findMany({
      where: { organizationId },
      orderBy: { level: 'asc' }
    });

    res.json({
      success: true,
      data: horizons,
      count: horizons.length,
      message: 'Horizons fetched successfully (test mode)'
    });

  } catch (error) {
    console.error('Error in GTD Horizons test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch horizons (test mode)',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all GTD Horizons for user's organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizons = await prisma.goal.findMany({
      where: { organizationId },
      orderBy: { level: 'asc' }
    });

    // Transform to match frontend interface
    const transformedHorizons = horizons.map(horizon => {
      const iconMap: Record<number, string> = {
        0: '🏃‍♂️',
        1: '📋',
        2: '🎯',
        3: '🚀',
        4: '🌟',
        5: '🧭'
      };

      const colorMap: Record<number, string> = {
        0: '#EF4444',
        1: '#F59E0B',
        2: '#10B981',
        3: '#8B5CF6',
        4: '#6366F1',
        5: '#EC4899'
      };

      const altitudeMap: Record<number, string> = {
        0: 'Poziom gruntu',
        1: '3km',
        2: '6km', 
        3: '9km',
        4: '12km',
        5: '15km'
      };

      // Calculate next review date
      const lastReviewed = new Date();
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
        default:
          nextReview.setMonth(nextReview.getMonth() + 3);
      }

      return {
        id: horizon.id,
        level: horizon.level,
        name: horizon.name,
        altitude: altitudeMap[horizon.level] || 'Nieznana wysokość',
        description: horizon.description || '',
        icon: iconMap[horizon.level] || '📄',
        color: colorMap[horizon.level] || '#6B7280',
        reviewFrequency: horizon.reviewFrequency,
        lastReviewed: horizon.updatedAt.toISOString(),
        nextReview: nextReview.toISOString(),
        items: [] // TODO: Add actual horizon items when implemented
      };
    });

    res.json({
      success: true,
      data: transformedHorizons
    });

  } catch (error) {
    logger.error('Error fetching GTD horizons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch horizons'
    });
  }
});

// Get specific GTD Horizon
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizon = await prisma.goal.findFirst({
      where: { 
        id,
        organizationId 
      }
    });

    if (!horizon) {
      return res.status(404).json({
        success: false,
        error: 'Horizon not found'
      });
    }

    res.json({
      success: true,
      data: horizon
    });

  } catch (error) {
    logger.error('Error fetching GTD horizon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch horizon'
    });
  }
});

// Update GTD Horizon review status
router.put('/:id/reviewed', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizon = await prisma.goal.findFirst({
      where: { 
        id,
        organizationId 
      }
    });

    if (!horizon) {
      return res.status(404).json({
        success: false,
        error: 'Horizon not found'
      });
    }

    const updatedHorizon = await prisma.goal.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    res.json({
      success: true,
      data: updatedHorizon,
      message: 'Horizon marked as reviewed'
    });

  } catch (error) {
    logger.error('Error updating GTD horizon review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update horizon review'
    });
  }
});

// Get GTD Horizons statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const organizationId = await getUserOrganizationId(req.user.id);

    const horizons = await prisma.goal.findMany({
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

    res.json({
      success: true,
      data: {
        totalHorizons: horizons.length,
        overdueReviews: overdueCount,
        todayReviews: todayCount,
        needsAttention: overdueCount + todayCount
      }
    });

  } catch (error) {
    logger.error('Error fetching GTD horizons stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch horizons statistics'
    });
  }
});

export default router;