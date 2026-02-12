'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import {
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface ProductivityMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTimeHours: number;
}

interface ContextAnalysis {
  context: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface PriorityAnalysis {
  priority: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface ProductivityTrend {
  week: number;
  startDate: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface ProductivityAnalysis {
  timeframe: string;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: ProductivityMetrics;
  contextAnalysis: ContextAnalysis[];
  priorityAnalysis: PriorityAnalysis[];
  insights: string[];
  recommendations: string[];
  productivityTrend: ProductivityTrend[];
}

export default function ProductivityAnalytics() {
  const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    loadAnalysis();
  }, [timeframe]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/ai/analyze-productivity', { timeframe });
      setAnalysis(response.data.data);
    } catch (error: any) {
      console.error('Failed to load productivity analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeframe = (tf: string) => {
    switch (tf) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  if (loading && !analysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Productivity Analytics</h3>
              <p className="text-sm text-gray-600">AI-powered insights into your work patterns</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button
              onClick={loadAnalysis}
              disabled={loading}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {analysis && (
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {analysis.metrics.completionRate}%
                  </p>
                </div>
                <div className="text-blue-600">
                  {analysis.metrics.completionRate >= 70 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-green-50 border border-green-200 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completed Tasks</p>
                  <p className="text-2xl font-bold text-green-900">
                    {analysis.metrics.completedTasks}
                  </p>
                </div>
                <div className="text-green-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Avg. Completion Time</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {analysis.metrics.averageCompletionTimeHours.toFixed(1)}h
                  </p>
                </div>
                <div className="text-yellow-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className={`${
                analysis.metrics.overdueTasks > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              } border rounded-lg p-4`}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    analysis.metrics.overdueTasks > 0 ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    Overdue Tasks
                  </p>
                  <p className={`text-2xl font-bold ${
                    analysis.metrics.overdueTasks > 0 ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {analysis.metrics.overdueTasks}
                  </p>
                </div>
                <div className={analysis.metrics.overdueTasks > 0 ? 'text-red-600' : 'text-gray-600'}>
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Productivity Trend */}
          {analysis.productivityTrend.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Productivity Trend</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Weekly completion rates</span>
                  <span className="text-xs text-gray-500">{formatTimeframe(timeframe)}</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {analysis.productivityTrend.map((week, index) => (
                    <div key={week.week} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Week {week.week}</div>
                      <div className="relative h-20 bg-gray-200 rounded-md overflow-hidden">
                        <motion.div
                          className="absolute bottom-0 w-full bg-blue-500 rounded-md"
                          initial={{ height: 0 }}
                          animate={{ height: `${week.completionRate}%` }}
                          transition={{ duration: 0.8, delay: index * 0.2 }}
                        />
                      </div>
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        {Math.round(week.completionRate)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Context and Priority Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Context Analysis */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Performance by Context</h4>
              <div className="space-y-3">
                {analysis.contextAnalysis.slice(0, 5).map((context, index) => (
                  <motion.div
                    key={context.context}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{context.context}</p>
                      <p className="text-sm text-gray-600">
                        {context.completedTasks}/{context.totalTasks} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getCompletionRateColor(context.completionRate)}`}>
                        {Math.round(context.completionRate)}%
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Priority Analysis */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Performance by Priority</h4>
              <div className="space-y-3">
                {analysis.priorityAnalysis.map((priority, index) => (
                  <motion.div
                    key={priority.priority}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex-1">
                      <p className={`font-medium ${getPriorityColor(priority.priority)}`}>
                        {priority.priority} Priority
                      </p>
                      <p className="text-sm text-gray-600">
                        {priority.completedTasks}/{priority.totalTasks} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getCompletionRateColor(priority.completionRate)}`}>
                        {Math.round(priority.completionRate)}%
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Key Insights
                </h4>
                <div className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <p className="text-sm text-yellow-800">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                  Recommendations
                </h4>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <motion.div
                      key={index}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}