'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  FlagIcon,
  Squares2X2Icon,
  BoltIcon,
  FireIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  productivityApi,
  DashboardStats,
  WeeklyReviewStats,
  BurndownData,
  StreamHealth,
} from '@/lib/api/productivity';

export default function ProductivityDashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyReviewStats | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [streamHealth, setStreamHealth] = useState<StreamHealth[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [stats, weekly, burndown, streams, goalsData] = await Promise.all([
        productivityApi.getDashboardStats(),
        productivityApi.getWeeklyReviewStats(),
        productivityApi.getBurndownData(8),
        productivityApi.getStreamHealth(),
        productivityApi.getGoalsProgress(),
      ]);
      setDashboardStats(stats);
      setWeeklyStats(weekly);
      setBurndownData(burndown);
      setStreamHealth(streams);
      setGoals(goalsData);
    } catch (error) {
      console.error('Failed to load productivity data:', error);
      toast.error('Nie udalo sie zaladowac danych produktywnosci');
    } finally {
      setLoading(false);
    }
  };

  const getInboxZeroStatus = () => {
    if (!weeklyStats) return { status: 'unknown', color: 'gray' };
    const inbox = weeklyStats.currentWeek.inboxItems;
    if (inbox === 0) return { status: 'Inbox Zero!', color: 'green', icon: CheckCircleIcon };
    if (inbox <= 5) return { status: 'Prawie pusty', color: 'emerald', icon: ArrowTrendingDownIcon };
    if (inbox <= 10) return { status: 'Do przejrzenia', color: 'yellow', icon: ClockIcon };
    return { status: 'Wymaga uwagi', color: 'red', icon: ExclamationTriangleIcon };
  };

  const getInsightColor = (level: string) => {
    switch (level) {
      case 'high':
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'medium':
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
      case 'needs-attention':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProductivityTrend = () => {
    if (!burndownData || burndownData.burndownData.length < 2) return null;
    const data = burndownData.burndownData;
    const current = data[data.length - 1]?.completedTasks || 0;
    const previous = data[data.length - 2]?.completedTasks || 0;
    const diff = current - previous;
    return {
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      value: Math.abs(diff),
      percentage: previous > 0 ? Math.round((diff / previous) * 100) : 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const inboxStatus = getInboxZeroStatus();
  const trend = getProductivityTrend();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Produktywnosci</h1>
            <p className="text-sm text-gray-600">SORTO Streams - metryki i postepy</p>
          </div>
        </div>
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Odswiez
        </button>
      </div>

      {/* Inbox Zero Hero Section */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 ${
          inboxStatus.color === 'green'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : inboxStatus.color === 'emerald'
            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
            : inboxStatus.color === 'yellow'
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        } text-white`}
      >
        <div className="absolute right-0 top-0 opacity-10">
          <InboxIcon className="h-48 w-48 -mt-8 -mr-8" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <InboxIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Status Inbox</p>
              <h2 className="text-3xl font-bold">{inboxStatus.status}</h2>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div>
              <p className="text-4xl font-bold">{weeklyStats?.currentWeek.inboxItems || 0}</p>
              <p className="text-white/70 text-sm">elementow w Inbox</p>
            </div>
            {weeklyStats?.currentWeek.inboxItems === 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full">
                <SparklesIcon className="h-5 w-5" />
                <span className="font-medium">Swietna robota!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed This Week */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {weeklyStats?.currentWeek.completedThisWeek || 0}
              </p>
              <p className="text-xs text-gray-500">Ukonczone w tym tyg.</p>
            </div>
          </div>
          {trend && (
            <div className="mt-3 flex items-center gap-1 text-sm">
              {trend.trend === 'up' ? (
                <>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+{trend.value} vs poprzedni</span>
                </>
              ) : trend.trend === 'down' ? (
                <>
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">-{trend.value} vs poprzedni</span>
                </>
              ) : (
                <span className="text-gray-500">Bez zmian</span>
              )}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {weeklyStats?.currentWeek.overdueItems || 0}
              </p>
              <p className="text-xs text-gray-500">Zaległe</p>
            </div>
          </div>
        </div>

        {/* Next Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BoltIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {weeklyStats?.currentWeek.nextActions || 0}
              </p>
              <p className="text-xs text-gray-500">Nastepne akcje</p>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Squares2X2Icon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {weeklyStats?.currentWeek.projects || 0}
              </p>
              <p className="text-xs text-gray-500">Aktywne projekty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights & Stream Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SORTO Insights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-indigo-600" />
            Wskazniki SORTO
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FireIcon className="h-5 w-5 text-orange-500" />
                <span className="text-gray-700">Produktywnosc</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getInsightColor(
                  weeklyStats?.insights.productivity || 'low'
                )}`}
              >
                {weeklyStats?.insights.productivity === 'high'
                  ? 'Wysoka'
                  : weeklyStats?.insights.productivity === 'medium'
                  ? 'Srednia'
                  : 'Niska'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700">Pilnosc</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getInsightColor(
                  weeklyStats?.insights.urgency || 'low'
                )}`}
              >
                {weeklyStats?.insights.urgency === 'high'
                  ? 'Wysoka'
                  : weeklyStats?.insights.urgency === 'medium'
                  ? 'Srednia'
                  : 'Niska'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Organizacja</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getInsightColor(
                  weeklyStats?.insights.organization || 'needs-attention'
                )}`}
              >
                {weeklyStats?.insights.organization === 'good'
                  ? 'Dobra'
                  : weeklyStats?.insights.organization === 'fair'
                  ? 'Srednia'
                  : 'Wymaga uwagi'}
              </span>
            </div>
          </div>

          {/* Weekly Review Progress */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Przeglad tygodniowy</span>
              <span className="text-sm font-medium text-gray-900">
                {weeklyStats?.currentWeek.reviewProgress || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${weeklyStats?.currentWeek.reviewProgress || 0}%` }}
              />
            </div>
            {!weeklyStats?.currentWeek.hasCurrentReview && (
              <p className="mt-2 text-xs text-gray-500">
                Nie rozpoczeto jeszcze przegladu w tym tygodniu
              </p>
            )}
          </div>
        </div>

        {/* Stream Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Squares2X2Icon className="h-5 w-5 text-indigo-600" />
            Zdrowie Strumieni
          </h3>
          {streamHealth.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Squares2X2Icon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Brak skonfigurowanych strumieni</p>
            </div>
          ) : (
            <div className="space-y-3">
              {streamHealth.slice(0, 5).map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stream.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{stream.name}</p>
                      <p className="text-xs text-gray-500">
                        {stream.taskCount} zadan
                        {stream.overdueCount > 0 && (
                          <span className="text-red-500 ml-2">
                            ({stream.overdueCount} zalegle)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            stream.taskCount > 0
                              ? Math.round((stream.completedCount / stream.taskCount) * 100)
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        stream.status === 'FLOWING'
                          ? 'bg-blue-100 text-blue-700'
                          : stream.status === 'FROZEN'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {stream.status === 'FLOWING'
                        ? 'Plynacy'
                        : stream.status === 'FROZEN'
                        ? 'Zamrozony'
                        : 'Aktywny'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
          Trend produktywnosci (ostatnie {burndownData?.summary.totalWeeks || 8} tygodni)
        </h3>
        {burndownData && burndownData.burndownData.length > 0 ? (
          <>
            <div className="h-48 flex items-end gap-2">
              {burndownData.burndownData.map((week, idx) => {
                const maxTasks = Math.max(
                  ...burndownData.burndownData.map((w) => w.completedTasks),
                  1
                );
                const height = (week.completedTasks / maxTasks) * 100;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`Tydzien ${week.week}: ${week.completedTasks} ukonczonych`}
                  >
                    <span className="text-xs text-gray-500">{week.completedTasks}</span>
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        week.hasReview ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-400">T{week.week}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded" />
                  <span>Z przegladem</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded" />
                  <span>Bez przegladu</span>
                </div>
              </div>
              <div>
                Srednia: <strong>{burndownData.summary.averageTasksCompleted}</strong> zadan/tydzien
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Brak danych historycznych</p>
          </div>
        )}
      </div>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FlagIcon className="h-5 w-5 text-indigo-600" />
            Postep celow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 6).map((goal: any) => {
              const progress = goal.targetValue
                ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
                : 0;
              return (
                <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 truncate">{goal.result || goal.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">{goal.measurement}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {goal.currentValue || 0} / {goal.targetValue || 100}
                      </span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100
                            ? 'bg-green-500'
                            : progress >= 70
                            ? 'bg-blue-500'
                            : progress >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  {goal.deadline && (
                    <p className="text-xs text-gray-400 mt-2">
                      Termin: {new Date(goal.deadline).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GTD Areas Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Podsumowanie SORTO Streams</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">⚪</div>
            <p className="text-sm font-medium text-gray-700">Zrodlo</p>
            <p className="text-lg font-bold text-gray-900">
              {weeklyStats?.currentWeek.inboxItems || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">🔴</div>
            <p className="text-sm font-medium text-gray-700">Aktywny</p>
            <p className="text-lg font-bold text-gray-900">
              {weeklyStats?.currentWeek.nextActions || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">🟡</div>
            <p className="text-sm font-medium text-gray-700">Obszary</p>
            <p className="text-lg font-bold text-gray-900">
              {weeklyStats?.currentWeek.projects || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">🔵</div>
            <p className="text-sm font-medium text-gray-700">Zasoby</p>
            <p className="text-lg font-bold text-gray-900">
              {dashboardStats?.stats.totalStreams || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-white/60 rounded-lg">
            <div className="text-2xl mb-1">⚫</div>
            <p className="text-sm font-medium text-gray-700">Zamrozony</p>
            <p className="text-lg font-bold text-gray-900">
              {weeklyStats?.currentWeek.somedayMaybeItems || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
