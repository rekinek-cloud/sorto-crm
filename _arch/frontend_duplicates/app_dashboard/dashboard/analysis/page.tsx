'use client';

import React, { useState } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CalendarDaysIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
  { period: 'Śr', tasksCompleted: 8, tasksCreated: 12, avgCompletionTime: '3.2h', productivityScore: 68 },
  { period: 'Czw', tasksCompleted: 18, tasksCreated: 7, avgCompletionTime: '1.8h', productivityScore: 95 },
  { period: 'Pt', tasksCompleted: 14, tasksCreated: 9, avgCompletionTime: '2.4h', productivityScore: 88 },
];

export default function AnalysisPage() {
  const [timeRange, setTimeRange] = useState('week');

  const totalCompleted = weeklyData.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const totalCreated = weeklyData.reduce((sum, d) => sum + d.tasksCreated, 0);
  const avgProductivity = Math.round(weeklyData.reduce((sum, d) => sum + d.productivityScore, 0) / weeklyData.length);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analiza produktywności</h1>
            <p className="text-sm text-gray-600">Statystyki i trendy wydajności pracy</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'week' ? 'Tydzień' : range === 'month' ? 'Miesiąc' : 'Kwartał'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-600">Ukończone</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalCompleted}</div>
          <div className="text-sm text-green-600 mt-1">+12% vs poprzedni okres</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-gray-600">Utworzone</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalCreated}</div>
          <div className="text-sm text-gray-500 mt-1">zadania w tym okresie</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-gray-600">Śr. czas</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">2.4h</div>
          <div className="text-sm text-green-600 mt-1">-0.3h vs poprzedni okres</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-gray-600">Produktywność</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgProductivity}%</div>
          <div className="text-sm text-green-600 mt-1">+5% vs poprzedni okres</div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend ukończonych zadań</h3>
        <div className="flex items-end gap-4 h-48">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                style={{ height: `${(day.tasksCompleted / 20) * 100}%` }}
              ></div>
              <span className="text-sm text-gray-600">{day.period}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Szczegółowa analiza</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Okres</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ukończone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utworzone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Śr. czas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produktywność</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {weeklyData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{day.period}</td>
                  <td className="px-6 py-4 text-gray-600">{day.tasksCompleted}</td>
                  <td className="px-6 py-4 text-gray-600">{day.tasksCreated}</td>
                  <td className="px-6 py-4 text-gray-600">{day.avgCompletionTime}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      day.productivityScore >= 90 ? 'bg-green-100 text-green-700' :
                      day.productivityScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
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
  );
}
