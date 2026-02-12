'use client';

import React, { useState, useEffect } from 'react';
import { Deal } from '@/types/crm';
import { dealsApi } from '@/lib/api/deals';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import {
  BarChart3,
  ArrowUp,
  ArrowDown,
  Clock,
  DollarSign,
  Filter,
  Calendar,
  RefreshCw,
} from 'lucide-react';

interface PipelineMetrics {
  totalDeals: number;
  totalValue: number;
  averageDealSize: number;
  conversionRate: number;
  averageCycleTime: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
}

interface StageMetrics {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  averageTimeInStage: number;
  dropoffRate: number;
}

interface PipelineAnalyticsProps {
  deals: Deal[];
}

export default function PipelineAnalytics({ deals }: PipelineAnalyticsProps) {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [timeFrame, setTimeFrame] = useState<'30' | '60' | '90' | 'all'>('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateMetrics();
  }, [deals, timeFrame]);

  const calculateMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Filter deals based on timeframe
      const cutoffDate = timeFrame === 'all' 
        ? new Date(0) 
        : new Date(Date.now() - parseInt(timeFrame) * 24 * 60 * 60 * 1000);
      
      const filteredDeals = deals.filter(deal => 
        new Date(deal.createdAt) >= cutoffDate
      );

      // Calculate basic metrics
      const totalDeals = filteredDeals.length;
      const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
      
      const wonDeals = filteredDeals.filter(deal => deal.stage === 'CLOSED_WON').length;
      const lostDeals = filteredDeals.filter(deal => deal.stage === 'CLOSED_LOST').length;
      const openDeals = totalDeals - wonDeals - lostDeals;
      const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      // Calculate average cycle time (simplified)
      const closedDeals = filteredDeals.filter(deal => 
        deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST'
      );
      
      let totalCycleTime = 0;
      closedDeals.forEach(deal => {
        const created = new Date(deal.createdAt);
        const closed = deal.actualCloseDate ? new Date(deal.actualCloseDate) : new Date();
        totalCycleTime += (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      });
      
      const averageCycleTime = closedDeals.length > 0 ? totalCycleTime / closedDeals.length : 0;

      setMetrics({
        totalDeals,
        totalValue,
        averageDealSize,
        conversionRate,
        averageCycleTime,
        wonDeals,
        lostDeals,
        openDeals
      });

      // Calculate stage metrics
      const stages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
      const stageData: StageMetrics[] = [];

      for (const stage of stages) {
        const stageDeals = filteredDeals.filter(deal => deal.stage === stage);
        const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        
        // Calculate conversion rate (deals that moved past this stage)
        let conversionRate = 0;
        if (stage !== 'CLOSED_WON' && stage !== 'CLOSED_LOST') {
          const stageIndex = stages.indexOf(stage);
          const advancedDeals = filteredDeals.filter(deal => {
            const dealStageIndex = stages.indexOf(deal.stage);
            return dealStageIndex > stageIndex;
          });
          conversionRate = stageDeals.length > 0 ? (advancedDeals.length / stageDeals.length) * 100 : 0;
        } else {
          conversionRate = stage === 'CLOSED_WON' ? 100 : 0;
        }

        // Calculate average time in stage
        let totalTimeInStage = 0;
        let dealsWithTimeData = 0;
        
        stageDeals.forEach(deal => {
          if (deal.updatedAt && deal.createdAt) {
            const created = new Date(deal.createdAt);
            const updated = new Date(deal.updatedAt);
            totalTimeInStage += (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            dealsWithTimeData++;
          }
        });
        
        const averageTimeInStage = dealsWithTimeData > 0 ? Math.round(totalTimeInStage / dealsWithTimeData) : 0;

        // Calculate dropoff rate
        const dropoffRate = stage === 'CLOSED_LOST' ? 100 : Math.max(0, 100 - conversionRate);

        stageData.push({
          stage,
          count: stageDeals.length,
          value: stageValue,
          conversionRate,
          averageTimeInStage,
          dropoffRate
        });
      }

      setStageMetrics(stageData);
    } catch (error: any) {
      logger.error('Error calculating pipeline metrics', error, 'PipelineAnalytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageDisplayName = (stage: string) => {
    switch (stage) {
      case 'PROSPECT': return 'Prospect';
      case 'QUALIFIED': return 'Qualified';
      case 'PROPOSAL': return 'Proposal';
      case 'NEGOTIATION': return 'Negotiation';
      case 'CLOSED_WON': return 'Won';
      case 'CLOSED_LOST': return 'Lost';
      default: return stage;
    }
  };

  const getMetricTrend = (value: number, threshold: number) => {
    if (value > threshold) {
      return { icon: ArrowUp, color: 'text-green-600', bg: 'bg-green-100' };
    } else if (value < threshold * 0.8) {
      return { icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-100' };
    } else {
      return { icon: BarChart3, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Pipeline analytics will appear here once you have deals</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline Analytics</h2>
          <p className="text-gray-600">Analyze your sales pipeline performance and trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time frame:</label>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as any)}
            className="input"
          >
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pipeline Value</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(metrics.totalValue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Filter className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Deal Size</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(metrics.averageDealSize)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Cycle Time</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.averageCycleTime.toFixed(0)} days</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Deal Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Deals</h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">{metrics.openDeals}</div>
          <p className="text-sm text-gray-600">
            {formatCurrency(deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0))} in pipeline
          </p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Won Deals</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">{metrics.wonDeals}</div>
          <p className="text-sm text-gray-600">
            {formatCurrency(deals.filter(d => d.stage === 'CLOSED_WON').reduce((s, d) => s + (d.value || 0), 0))} revenue
          </p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lost Deals</h3>
          <div className="text-3xl font-bold text-red-600 mb-2">{metrics.lostDeals}</div>
          <p className="text-sm text-gray-600">
            {formatCurrency(deals.filter(d => d.stage === 'CLOSED_LOST').reduce((s, d) => s + (d.value || 0), 0))} lost revenue
          </p>
        </motion.div>
      </div>

      {/* Stage Performance */}
      <motion.div 
        className="bg-white rounded-lg shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Stage Performance</h3>
          <p className="text-sm text-gray-600">Analyze conversion rates and performance by pipeline stage</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Stage</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Deals</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Conversion Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Avg. Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stageMetrics.filter(stage => stage.stage !== 'CLOSED_LOST').map((stage, index) => (
                  <tr key={stage.stage} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{getStageDisplayName(stage.stage)}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-900">{stage.count}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(stage.value)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <span className={`${stage.conversionRate >= 70 ? 'text-green-600' : stage.conversionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {stage.conversionRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${stage.conversionRate >= 70 ? 'bg-green-500' : stage.conversionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(stage.conversionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-600">{stage.averageTimeInStage} days</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}