'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, CalendarDays, Clock, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface AnalyticsData {
  period: string;
  tasksCompleted: number;
  tasksCreated: number;
  avgCompletionTime: string;
  productivityScore: number;
}

const weeklyData: AnalyticsData[] = [
  { period: 'Pon', tasksCompleted: 12, tasksCreated: 8, avgCompletionTime: '2.5h', productivityScore: 85 },
  { period: 'Wt', tasksCompleted: 15, tasksCreated: 10, avgCompletionTime: '2.1h', productivityScore: 92 },
  { period: 'Sr', tasksCompleted: 8, tasksCreated: 12, avgCompletionTime: '3.2h', productivityScore: 68 },
  { period: 'Czw', tasksCompleted: 18, tasksCreated: 7, avgCompletionTime: '1.8h', productivityScore: 95 },
  { period: 'Pt', tasksCompleted: 14, tasksCreated: 9, avgCompletionTime: '2.4h', productivityScore: 88 },
];

export default function AnalysisPage() {
  const [timeRange, setTimeRange] = useState('week');

  const totalCompleted = weeklyData.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const totalCreated = weeklyData.reduce((sum, d) => sum + d.tasksCreated, 0);
  const avgProductivity = Math.round(weeklyData.reduce((sum, d) => sum + d.productivityScore, 0) / weeklyData.length);

  return (
    <PageShell>
      <PageHeader
        title="Analiza produktywnosci"
        subtitle="Statystyki i trendy wydajnosci pracy"
        icon={BarChart3}
        iconColor="text-blue-600"
        actions={
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {range === 'week' ? 'Tydzien' : range === 'month' ? 'Miesiac' : 'Kwartal'}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Ukonczone</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalCompleted}</div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">+12% vs poprzedni okres</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Utworzone</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalCreated}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">zadania w tym okresie</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Sr. czas</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">2.4h</div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">-0.3h vs poprzedni okres</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Produktywnosc</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{avgProductivity}%</div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">+5% vs poprzedni okres</div>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Trend ukonczonych zadan</h3>
          <div className="flex items-end gap-4 h-48">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${(day.tasksCompleted / 20) * 100}%` }}
                ></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{day.period}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed table */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Szczegolowa analiza</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Okres</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ukonczone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Utworzone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Sr. czas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Produktywnosc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {weeklyData.map((day, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{day.period}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{day.tasksCompleted}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{day.tasksCreated}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{day.avgCompletionTime}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        day.productivityScore >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        day.productivityScore >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {day.productivityScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
