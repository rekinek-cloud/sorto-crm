'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface WeeklyReviewBurndownData {
  week: number;
  weekStart: string;
  weekEnd: string;
  completedTasks: number;
  totalTasks: number;
  reviewCompletion: number;
  hasReview: boolean;
  stalledTasks: number;
  newTasks: number;
}

interface BurndownSummary {
  totalWeeks: number;
  weeksWithReview: number;
  reviewCompletionRate: number;
  averageTasksCompleted: number;
}

export default function WeeklyReviewBurndownPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !Cookies.get('access_token'))) {
      window.location.href = '/auth/login/';
    }
  }, [isLoading, isAuthenticated]);

  const [burndownData, setBurndownData] = useState<WeeklyReviewBurndownData[]>([]);
  const [summary, setSummary] = useState<BurndownSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(12); // weeks

  useEffect(() => {
    loadBurndownData();
  }, [timeRange]);

  const loadBurndownData = async () => {
    if (!isAuthenticated || !Cookies.get('access_token')) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.get('/weekly-review/stats/burndown', {
        params: {
          weeks: timeRange
        }
      });
      
      setBurndownData(response.data.burndownData || []);
      setSummary(response.data.summary || null);
    } catch (error: any) {
      console.error('Error loading weekly review burndown data:', error);
      toast.error('Failed to load burndown data');
      
      // Mock data for demo
      const mockData: WeeklyReviewBurndownData[] = [];
      for (let i = 0; i < timeRange; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - ((timeRange - i) * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        mockData.push({
          week: i + 1,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          completedTasks: Math.floor(Math.random() * 15) + 5,
          totalTasks: Math.floor(Math.random() * 30) + 20,
          reviewCompletion: Math.floor(Math.random() * 70) + 30,
          hasReview: Math.random() > 0.3,
          stalledTasks: Math.floor(Math.random() * 5),
          newTasks: Math.floor(Math.random() * 10) + 3,
        });
      }
      
      setBurndownData(mockData);
      setSummary({
        totalWeeks: timeRange,
        weeksWithReview: Math.floor(timeRange * 0.7),
        reviewCompletionRate: 70,
        averageTasksCompleted: 9,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateTrends = () => {
    if (burndownData.length < 4) return null;
    
    const recentWeeks = burndownData.slice(-4);
    const earlierWeeks = burndownData.slice(-8, -4);
    
    if (earlierWeeks.length === 0) return null;
    
    const recentAvgCompletion = recentWeeks.reduce((sum, week) => sum + week.reviewCompletion, 0) / recentWeeks.length;
    const earlierAvgCompletion = earlierWeeks.reduce((sum, week) => sum + week.reviewCompletion, 0) / earlierWeeks.length;
    
    const recentAvgTasks = recentWeeks.reduce((sum, week) => sum + week.completedTasks, 0) / recentWeeks.length;
    const earlierAvgTasks = earlierWeeks.reduce((sum, week) => sum + week.completedTasks, 0) / earlierWeeks.length;
    
    return {
      reviewTrend: recentAvgCompletion - earlierAvgCompletion,
      taskTrend: recentAvgTasks - earlierAvgTasks,
    };
  };

  const trends = calculateTrends();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Review Burndown</h1>
          <p className="text-gray-600">Track your GTD weekly review progress and task completion over time</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/crm/dashboard/reviews/weekly')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Weekly Review
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
            <option value={24}>Last 6 months</option>
            <option value={52}>Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weeks Tracked</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalWeeks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviews Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.weeksWithReview}/{summary.totalWeeks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Review Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.reviewCompletionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Tasks/Week</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.averageTasksCompleted}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {trends && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Review Completion Trend</h3>
                <p className="text-sm text-gray-600">Last 4 weeks vs previous 4 weeks</p>
              </div>
              <div className={`flex items-center ${trends.reviewTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.reviewTrend >= 0 ? (
                  <ArrowTrendingUpIcon className="w-6 h-6 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-6 h-6 mr-1" />
                )}
                <span className="text-xl font-semibold">
                  {trends.reviewTrend >= 0 ? '+' : ''}{Math.round(trends.reviewTrend)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Task Completion Trend</h3>
                <p className="text-sm text-gray-600">Last 4 weeks vs previous 4 weeks</p>
              </div>
              <div className={`flex items-center ${trends.taskTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.taskTrend >= 0 ? (
                  <ArrowTrendingUpIcon className="w-6 h-6 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-6 h-6 mr-1" />
                )}
                <span className="text-xl font-semibold">
                  {trends.taskTrend >= 0 ? '+' : ''}{Math.round(trends.taskTrend)} tasks
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Burndown Charts */}
      {burndownData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Review Completion Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Weekly Review Completion</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Review Progress %</span>
              </div>
            </div>

            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 600 300">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((percentage) => (
                  <g key={percentage}>
                    <line
                      x1="50"
                      y1={40 + (1 - percentage / 100) * 220}
                      x2="550"
                      y2={40 + (1 - percentage / 100) * 220}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                    <text
                      x="40"
                      y={45 + (1 - percentage / 100) * 220}
                      fontSize="10"
                      fill="#6b7280"
                      textAnchor="end"
                    >
                      {percentage}%
                    </text>
                  </g>
                ))}

                {/* Data line */}
                <polyline
                  points={burndownData
                    .map((week, index) => {
                      const x = 50 + (index / (burndownData.length - 1)) * 500;
                      const y = 40 + (1 - week.reviewCompletion / 100) * 220;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />

                {/* Data points */}
                {burndownData.map((week, index) => {
                  const x = 50 + (index / (burndownData.length - 1)) * 500;
                  const y = 40 + (1 - week.reviewCompletion / 100) * 220;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r={week.hasReview ? "6" : "3"}
                      fill={week.hasReview ? "#3b82f6" : "#d1d5db"}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* X-axis labels */}
                {burndownData.filter((_, i) => i % Math.ceil(burndownData.length / 8) === 0).map((week, index) => {
                  const actualIndex = index * Math.ceil(burndownData.length / 8);
                  const x = 50 + (actualIndex / (burndownData.length - 1)) * 500;
                  return (
                    <text
                      key={index}
                      x={x}
                      y="285"
                      fontSize="10"
                      fill="#6b7280"
                      textAnchor="middle"
                    >
                      W{week.week}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Task Completion Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Weekly Task Completion</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total</span>
                </div>
              </div>
            </div>

            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 600 300">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const maxTasks = Math.max(...burndownData.map(w => w.totalTasks));
                  const value = Math.round((maxTasks / 4) * i);
                  return (
                    <g key={i}>
                      <line
                        x1="50"
                        y1={40 + (4 - i) * 55}
                        x2="550"
                        y2={40 + (4 - i) * 55}
                        stroke="#f3f4f6"
                        strokeWidth="1"
                      />
                      <text
                        x="40"
                        y={45 + (4 - i) * 55}
                        fontSize="10"
                        fill="#6b7280"
                        textAnchor="end"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                {/* Total tasks line */}
                <polyline
                  points={burndownData
                    .map((week, index) => {
                      const x = 50 + (index / (burndownData.length - 1)) * 500;
                      const maxTasks = Math.max(...burndownData.map(w => w.totalTasks));
                      const y = 40 + (1 - week.totalTasks / maxTasks) * 220;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />

                {/* Completed tasks line */}
                <polyline
                  points={burndownData
                    .map((week, index) => {
                      const x = 50 + (index / (burndownData.length - 1)) * 500;
                      const maxTasks = Math.max(...burndownData.map(w => w.totalTasks));
                      const y = 40 + (1 - week.completedTasks / maxTasks) * 220;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />

                {/* Data points */}
                {burndownData.map((week, index) => {
                  const x = 50 + (index / (burndownData.length - 1)) * 500;
                  const maxTasks = Math.max(...burndownData.map(w => w.totalTasks));
                  const y = 40 + (1 - week.completedTasks / maxTasks) * 220;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* X-axis labels */}
                {burndownData.filter((_, i) => i % Math.ceil(burndownData.length / 8) === 0).map((week, index) => {
                  const actualIndex = index * Math.ceil(burndownData.length / 8);
                  const x = 50 + (actualIndex / (burndownData.length - 1)) * 500;
                  return (
                    <text
                      key={index}
                      x={x}
                      y="285"
                      fontSize="10"
                      fill="#6b7280"
                      textAnchor="middle"
                    >
                      W{week.week}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Review Data</h3>
          <p className="text-gray-600">Start completing weekly reviews to see burndown charts</p>
        </div>
      )}

      {/* Weekly Details Table */}
      {burndownData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Weekly Details</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stalled
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {burndownData.slice(-10).reverse().map((week) => (
                  <tr key={week.week} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Week {week.week}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${week.reviewCompletion}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{week.reviewCompletion}%</span>
                        {week.hasReview && (
                          <span className="ml-2 text-green-600">✅</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {week.completedTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {week.newTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        week.stalledTasks === 0 
                          ? 'bg-green-100 text-green-800' 
                          : week.stalledTasks <= 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {week.stalledTasks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}