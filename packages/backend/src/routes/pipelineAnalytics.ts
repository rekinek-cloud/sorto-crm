import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/pipeline-analytics/conversion-rates - Get conversion rates between stages
router.get('/conversion-rates', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeFrame = '30' } = req.query;
    
    // Calculate date filter
    const daysBack = timeFrame === 'all' ? null : parseInt(timeFrame as string);
    const dateFilter = daysBack 
      ? { gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) }
      : undefined;

    // Get all deals within timeframe
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(dateFilter && { createdAt: dateFilter })
      },
      select: {
        id: true,
        stage: true,
        createdAt: true,
        actualCloseDate: true,
        value: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate stage transitions and conversion rates
    const stages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const conversionRates: any[] = [];

    for (let i = 0; i < stages.length - 2; i++) { // Exclude CLOSED stages from source
      const currentStage = stages[i];
      const nextStages = stages.slice(i + 1);
      
      const currentStageDeals = deals.filter(deal => deal.stage === currentStage);
      const convertedDeals = deals.filter(deal => 
        nextStages.includes(deal.stage) && 
        deal.createdAt >= (currentStageDeals[0]?.createdAt || new Date())
      );

      const rate = currentStageDeals.length > 0 
        ? (convertedDeals.length / currentStageDeals.length) * 100 
        : 0;

      conversionRates.push({
        fromStage: currentStage,
        toStages: nextStages,
        totalDeals: currentStageDeals.length,
        convertedDeals: convertedDeals.length,
        conversionRate: Math.round(rate * 100) / 100,
        averageValue: currentStageDeals.length > 0 
          ? currentStageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0) / currentStageDeals.length 
          : 0
      });
    }

    res.json({
      timeFrame: daysBack || 'all',
      conversionRates,
      totalDeals: deals.length
    });
  } catch (error) {
    console.error('Error calculating conversion rates:', error);
    res.status(500).json({ error: 'Failed to calculate conversion rates' });
  }
});

// GET /api/v1/pipeline-analytics/velocity - Calculate pipeline velocity metrics
router.get('/velocity', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeFrame = '30' } = req.query;
    
    const daysBack = timeFrame === 'all' ? null : parseInt(timeFrame as string);
    const dateFilter = daysBack 
      ? { gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) }
      : undefined;

    // Get closed deals for cycle time calculation
    const closedDeals = await prisma.deal.findMany({
      where: {
        organizationId: req.user!.organizationId,
        stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
        actualCloseDate: { not: null },
        ...(dateFilter && { createdAt: dateFilter })
      },
      select: {
        id: true,
        stage: true,
        value: true,
        createdAt: true,
        actualCloseDate: true
      }
    });

    // Calculate cycle times
    const cycleTimes = closedDeals.map(deal => {
      const created = new Date(deal.createdAt);
      const closed = new Date(deal.actualCloseDate!);
      const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return {
        dealId: deal.id,
        stage: deal.stage,
        value: deal.value || 0,
        cycleTime: Math.round(days)
      };
    });

    // Calculate velocity metrics
    const averageCycleTime = cycleTimes.length > 0 
      ? cycleTimes.reduce((sum, ct) => sum + ct.cycleTime, 0) / cycleTimes.length 
      : 0;

    const wonDeals = cycleTimes.filter(ct => ct.stage === 'CLOSED_WON');
    const averageWinTime = wonDeals.length > 0 
      ? wonDeals.reduce((sum, ct) => sum + ct.cycleTime, 0) / wonDeals.length 
      : 0;

    const averageDealValue = wonDeals.length > 0 
      ? wonDeals.reduce((sum, ct) => sum + ct.value, 0) / wonDeals.length 
      : 0;

    // Calculate velocity (average deal value / average cycle time)
    const velocity = averageCycleTime > 0 ? averageDealValue / averageCycleTime : 0;

    // Stage-specific velocity
    const stages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
    const stageVelocity = await Promise.all(
      stages.map(async (stage) => {
        const stageDeals = await prisma.deal.findMany({
          where: {
            organizationId: req.user!.organizationId,
            stage,
            ...(dateFilter && { createdAt: dateFilter })
          }
        });

        const avgTimeInStage = 7; // Simplified - would need deal history tracking
        const avgValue = stageDeals.length > 0 
          ? stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0) / stageDeals.length 
          : 0;

        return {
          stage,
          dealsCount: stageDeals.length,
          averageValue: avgValue,
          averageTimeInStage: avgTimeInStage,
          stageVelocity: avgTimeInStage > 0 ? avgValue / avgTimeInStage : 0
        };
      })
    );

    res.json({
      timeFrame: daysBack || 'all',
      overallMetrics: {
        averageCycleTime: Math.round(averageCycleTime),
        averageWinTime: Math.round(averageWinTime),
        averageDealValue: Math.round(averageDealValue),
        velocity: Math.round(velocity),
        totalClosedDeals: closedDeals.length,
        wonDeals: wonDeals.length
      },
      stageVelocity,
      cycleTimes: cycleTimes.slice(0, 10) // Return sample for debugging
    });
  } catch (error) {
    console.error('Error calculating velocity metrics:', error);
    res.status(500).json({ error: 'Failed to calculate velocity metrics' });
  }
});

// GET /api/v1/pipeline-analytics/forecasting - Revenue forecasting based on pipeline
router.get('/forecasting', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { quarters = '4' } = req.query;
    const numQuarters = parseInt(quarters as string);

    // Get current open deals
    const openDeals = await prisma.deal.findMany({
      where: {
        organizationId: req.user!.organizationId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }
      },
      select: {
        id: true,
        title: true,
        stage: true,
        value: true,
        expectedCloseDate: true,
        createdAt: true
      }
    });

    // Define probability by stage
    const stageProbabilities: Record<string, number> = {
      'PROSPECT': 0.1,
      'QUALIFIED': 0.25,
      'PROPOSAL': 0.5,
      'NEGOTIATION': 0.75
    };

    // Calculate weighted pipeline value
    const weightedPipeline = openDeals.reduce((sum, deal) => {
      const probability = stageProbabilities[deal.stage] || 0;
      return sum + (deal.value || 0) * probability;
    }, 0);

    // Generate quarterly forecasts
    const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;
    const currentYear = new Date().getFullYear();
    
    const forecasts = [];
    for (let i = 0; i < numQuarters; i++) {
      const quarter = ((currentQuarter - 1 + i) % 4) + 1;
      const year = currentYear + Math.floor((currentQuarter - 1 + i) / 4);
      
      // Filter deals by expected close date (simplified)
      const quarterDeals = openDeals.filter(deal => {
        if (!deal.expectedCloseDate) return i === 0; // Put undated deals in current quarter
        
        const closeDate = new Date(deal.expectedCloseDate);
        const dealQuarter = Math.floor(closeDate.getMonth() / 3) + 1;
        const dealYear = closeDate.getFullYear();
        
        return dealQuarter === quarter && dealYear === year;
      });

      const quarterWeightedValue = quarterDeals.reduce((sum, deal) => {
        const probability = stageProbabilities[deal.stage] || 0;
        return sum + (deal.value || 0) * probability;
      }, 0);

      const quarterMaxValue = quarterDeals.reduce((sum, deal) => {
        return sum + (deal.value || 0);
      }, 0);

      forecasts.push({
        quarter,
        year,
        period: `Q${quarter} ${year}`,
        dealsCount: quarterDeals.length,
        maxPotentialRevenue: quarterMaxValue,
        weightedRevenue: quarterWeightedValue,
        confidence: quarterDeals.length > 0 ? 
          (quarterDeals.filter(d => ['PROPOSAL', 'NEGOTIATION'].includes(d.stage)).length / quarterDeals.length) * 100 : 0,
        deals: quarterDeals.map(deal => ({
          id: deal.id,
          title: deal.title,
          stage: deal.stage,
          value: deal.value,
          probability: stageProbabilities[deal.stage] || 0,
          weightedValue: (deal.value || 0) * (stageProbabilities[deal.stage] || 0)
        }))
      });
    }

    // Calculate overall pipeline health
    const pipelineHealth = {
      totalOpenDeals: openDeals.length,
      totalPipelineValue: openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      weightedPipelineValue: weightedPipeline,
      averageDealSize: openDeals.length > 0 
        ? openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0) / openDeals.length 
        : 0,
      stageDistribution: Object.keys(stageProbabilities).map(stage => ({
        stage,
        count: openDeals.filter(deal => deal.stage === stage).length,
        value: openDeals.filter(deal => deal.stage === stage).reduce((sum, deal) => sum + (deal.value || 0), 0)
      }))
    };

    res.json({
      forecasts,
      pipelineHealth,
      totalWeightedRevenue: weightedPipeline,
      forecastAccuracy: 85 // Placeholder - would be calculated from historical data
    });
  } catch (error) {
    console.error('Error calculating forecast:', error);
    res.status(500).json({ error: 'Failed to calculate forecast' });
  }
});

// GET /api/v1/pipeline-analytics/performance - Sales performance metrics
router.get('/performance', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeFrame = '30', groupBy = 'month' } = req.query;
    
    const daysBack = timeFrame === 'all' ? 365 : parseInt(timeFrame as string);
    const dateFilter = { gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) };

    // Get deals data
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: req.user!.organizationId,
        createdAt: dateFilter
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Group performance by time period
    const performanceByPeriod = new Map();
    
    deals.forEach(deal => {
      const date = new Date(deal.createdAt);
      let periodKey: string;
      
      if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
      }

      if (!performanceByPeriod.has(periodKey)) {
        performanceByPeriod.set(periodKey, {
          period: periodKey,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          wonValue: 0,
          averageDealSize: 0
        });
      }

      const period = performanceByPeriod.get(periodKey);
      period.totalDeals++;
      period.totalValue += deal.value || 0;
      
      if (deal.stage === 'CLOSED_WON') {
        period.wonDeals++;
        period.wonValue += deal.value || 0;
      } else if (deal.stage === 'CLOSED_LOST') {
        period.lostDeals++;
      }
    });

    // Calculate averages and rates
    const performanceData = Array.from(performanceByPeriod.values()).map(period => ({
      ...period,
      winRate: period.totalDeals > 0 ? (period.wonDeals / period.totalDeals) * 100 : 0,
      averageDealSize: period.totalDeals > 0 ? period.totalValue / period.totalDeals : 0,
      averageWonDealSize: period.wonDeals > 0 ? period.wonValue / period.wonDeals : 0
    }));

    // Sales rep performance
    const repPerformance = new Map();
    
    deals.forEach(deal => {
      const repId = deal.ownerId;
      const repName = deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Unassigned';
      
      if (!repPerformance.has(repId)) {
        repPerformance.set(repId, {
          repId,
          repName,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          wonValue: 0
        });
      }

      const rep = repPerformance.get(repId);
      rep.totalDeals++;
      rep.totalValue += deal.value || 0;
      
      if (deal.stage === 'CLOSED_WON') {
        rep.wonDeals++;
        rep.wonValue += deal.value || 0;
      } else if (deal.stage === 'CLOSED_LOST') {
        rep.lostDeals++;
      }
    });

    const repData = Array.from(repPerformance.values()).map(rep => ({
      ...rep,
      winRate: rep.totalDeals > 0 ? (rep.wonDeals / rep.totalDeals) * 100 : 0,
      averageDealSize: rep.totalDeals > 0 ? rep.totalValue / rep.totalDeals : 0,
      quota: 100000, // Placeholder - would come from user settings
      quotaAttainment: (rep.wonValue / 100000) * 100
    }));

    res.json({
      timeFrame: daysBack,
      groupBy,
      performanceByPeriod: performanceData.sort((a, b) => a.period.localeCompare(b.period)),
      salesRepPerformance: repData.sort((a, b) => b.wonValue - a.wonValue),
      overallMetrics: {
        totalDeals: deals.length,
        totalRevenue: deals.filter(d => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + (d.value || 0), 0),
        overallWinRate: deals.length > 0 ? (deals.filter(d => d.stage === 'CLOSED_WON').length / deals.length) * 100 : 0,
        averageDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length : 0
      }
    });
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    res.status(500).json({ error: 'Failed to calculate performance metrics' });
  }
});

export default router;