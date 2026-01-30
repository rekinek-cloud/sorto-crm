import { apiClient } from './client';

export interface ConversionRate {
  fromStage: string;
  toStages: string[];
  totalDeals: number;
  convertedDeals: number;
  conversionRate: number;
  averageValue: number;
}

export interface StageVelocity {
  stage: string;
  dealsCount: number;
  averageValue: number;
  averageTimeInStage: number;
  stageVelocity: number;
}

export interface VelocityMetrics {
  averageCycleTime: number;
  averageWinTime: number;
  averageDealValue: number;
  velocity: number;
  totalClosedDeals: number;
  wonDeals: number;
}

export interface QuarterlyForecast {
  quarter: number;
  year: number;
  period: string;
  dealsCount: number;
  maxPotentialRevenue: number;
  weightedRevenue: number;
  confidence: number;
  deals: {
    id: string;
    title: string;
    stage: string;
    value: number;
    probability: number;
    weightedValue: number;
  }[];
}

export interface PipelineHealth {
  totalOpenDeals: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageDealSize: number;
  stageDistribution: {
    stage: string;
    count: number;
    value: number;
  }[];
}

export interface PerformancePeriod {
  period: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  wonValue: number;
  winRate: number;
  averageDealSize: number;
  averageWonDealSize: number;
}

export interface SalesRepPerformance {
  repId: string;
  repName: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  wonValue: number;
  winRate: number;
  averageDealSize: number;
  quota: number;
  quotaAttainment: number;
}

export const pipelineAnalyticsApi = {
  // Get conversion rates between stages
  async getConversionRates(timeFrame: string = '30'): Promise<{
    timeFrame: string;
    conversionRates: ConversionRate[];
    totalDeals: number;
  }> {
    const response = await apiClient.get('/pipeline-analytics/conversion-rates', {
      params: { timeFrame }
    });
    return response.data;
  },

  // Get pipeline velocity metrics
  async getVelocity(timeFrame: string = '30'): Promise<{
    timeFrame: string;
    overallMetrics: VelocityMetrics;
    stageVelocity: StageVelocity[];
    cycleTimes: { dealId: string; stage: string; value: number; cycleTime: number }[];
  }> {
    const response = await apiClient.get('/pipeline-analytics/velocity', {
      params: { timeFrame }
    });
    return response.data;
  },

  // Get revenue forecasting
  async getForecasting(quarters: number = 4): Promise<{
    forecasts: QuarterlyForecast[];
    pipelineHealth: PipelineHealth;
    totalWeightedRevenue: number;
    forecastAccuracy: number;
  }> {
    const response = await apiClient.get('/pipeline-analytics/forecasting', {
      params: { quarters }
    });
    return response.data;
  },

  // Get sales performance metrics
  async getPerformance(params?: {
    timeFrame?: string;
    groupBy?: 'week' | 'month' | 'quarter';
  }): Promise<{
    timeFrame: number;
    groupBy: string;
    performanceByPeriod: PerformancePeriod[];
    salesRepPerformance: SalesRepPerformance[];
    overallMetrics: {
      totalDeals: number;
      totalRevenue: number;
      overallWinRate: number;
      averageDealSize: number;
    };
  }> {
    const response = await apiClient.get('/pipeline-analytics/performance', {
      params
    });
    return response.data;
  }
};
