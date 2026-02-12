'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import Cookies from 'js-cookie';
import { weeklyReviewApi } from '@/lib/api/weeklyReview';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
      const response = await weeklyReviewApi.getBurndownData(timeRange);

      setBurndownData(response.burndownData || []);
      setSummary(response.summary || null);
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
    <PageShell>
      <PageHeader
        title="Weekly Review Burndown"
        subtitle="Sledz postepy w przegladzie tygodniowym i realizacji zadan"
        icon={BarChart3}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/reviews/weekly')}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Powrot do przegladu
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md text-sm"
            >
              <option value={4}>Ostatnie 4 tygodnie</option>
              <option value={8}>Ostatnie 8 tygodni</option>
              <option value={12}>Ostatnie 12 tygodni</option>
              <option value={24}>Ostatnie 6 miesiecy</option>
              <option value={52}>Ostatni rok</option>
            </select>
          </div>
        }
      />

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sledzone tygodnie</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.totalWeeks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wykonane przeglady</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {summary.weeksWithReview}/{summary.totalWeeks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wskaznik przegladow</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.reviewCompletionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sr. zadan/tydzien</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.averageTasksCompleted}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {trends && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Trend ukonczen przegladow</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ostatnie 4 tygodnie vs poprzednie 4</p>
              </div>
              <div className={`flex items-center ${trends.reviewTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.reviewTrend >= 0 ? (
                  <TrendingUp className="w-6 h-6 mr-1" />
                ) : (
                  <TrendingDown className="w-6 h-6 mr-1" />
                )}
                <span className="text-xl font-semibold">
                  {trends.reviewTrend >= 0 ? '+' : ''}{Math.round(trends.reviewTrend)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Trend ukonczen zadan</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ostatnie 4 tygodnie vs poprzednie 4</p>
              </div>
              <div className={`flex items-center ${trends.taskTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.taskTrend >= 0 ? (
                  <TrendingUp className="w-6 h-6 mr-1" />
                ) : (
                  <TrendingDown className="w-6 h-6 mr-1" />
                )}
                <span className="text-xl font-semibold">
                  {trends.taskTrend >= 0 ? '+' : ''}{Math.round(trends.taskTrend)} zadan
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Burndown Charts */}
      {burndownData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Review Completion Chart */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Ukonczenie przegladu tygodniowego</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Postep przegladu %</span>
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
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x="40"
                      y={45 + (1 - percentage / 100) * 220}
                      fontSize="10"
                      fill="#64748b"
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
                      fill={week.hasReview ? "#3b82f6" : "#cbd5e1"}
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
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      T{week.week}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Task Completion Chart */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Ukonczenie zadan tygodniowych</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Ukonczone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Razem</span>
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
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <text
                        x="40"
                        y={45 + (4 - i) * 55}
                        fontSize="10"
                        fill="#64748b"
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
                  stroke="#94a3b8"
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
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      T{week.week}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm text-center py-12 mt-6">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak danych</h3>
          <p className="text-slate-600 dark:text-slate-400">Zacznij wykonywac przeglady tygodniowe aby zobaczyc wykresy</p>
        </div>
      )}

      {/* Weekly Details Table */}
      {burndownData.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Szczegoly tygodniowe</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tydzien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Okres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Postep przegladu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ukonczone zadania
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nowe zadania
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Zablokowane
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {burndownData.slice(-10).reverse().map((week) => (
                  <tr key={week.week} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      Tydzien {week.week}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${week.reviewCompletion}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-900 dark:text-slate-100">{week.reviewCompletion}%</span>
                        {week.hasReview && (
                          <CheckCircle2 className="ml-2 w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {week.completedTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {week.newTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        week.stalledTasks === 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : week.stalledTasks <= 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
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
    </PageShell>
  );
}
