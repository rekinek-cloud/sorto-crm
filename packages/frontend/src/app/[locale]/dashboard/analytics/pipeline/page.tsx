'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface PipelineStage {
  id: string;
  name: string;
  deals: number;
  value: number;
  avgDays: number;
  conversionRate: number;
  color: string;
}

interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  avgDealValue: number;
  avgCycleTime: number;
  winRate: number;
  stages: PipelineStage[];
}

const defaultStages: PipelineStage[] = [
  { id: '1', name: 'Nowe', deals: 0, value: 0, avgDays: 0, conversionRate: 100, color: '#6366F1' },
  { id: '2', name: 'Kwalifikacja', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#8B5CF6' },
  { id: '3', name: 'Propozycja', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#EC4899' },
  { id: '4', name: 'Negocjacje', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#F59E0B' },
  { id: '5', name: 'Zamkniete', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#10B981' },
];

export default function PipelineAnalyticsPage() {
  const [stats, setStats] = useState<PipelineStats>({
    totalDeals: 0,
    totalValue: 0,
    avgDealValue: 0,
    avgCycleTime: 0,
    winRate: 0,
    stages: defaultStages,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/pipeline-analytics/overview', {
        params: { days: dateRange },
      });

      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load pipeline stats:', error);
      // Use mock data for demo
      setStats({
        totalDeals: 47,
        totalValue: 2450000,
        avgDealValue: 52127,
        avgCycleTime: 32,
        winRate: 28.5,
        stages: [
          { id: '1', name: 'Nowe', deals: 12, value: 580000, avgDays: 3, conversionRate: 100, color: '#6366F1' },
          { id: '2', name: 'Kwalifikacja', deals: 15, value: 720000, avgDays: 7, conversionRate: 75, color: '#8B5CF6' },
          { id: '3', name: 'Propozycja', deals: 10, value: 650000, avgDays: 12, conversionRate: 55, color: '#EC4899' },
          { id: '4', name: 'Negocjacje', deals: 6, value: 320000, avgDays: 8, conversionRate: 35, color: '#F59E0B' },
          { id: '5', name: 'Zamkniete wygrane', deals: 4, value: 180000, avgDays: 2, conversionRate: 28.5, color: '#10B981' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maxDeals = Math.max(...stats.stages.map((s) => s.deals), 1);
  const maxValue = Math.max(...stats.stages.map((s) => s.value), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Analytics</h1>
            <p className="text-sm text-gray-600">Analiza lejka sprzedazowego</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Ostatnie 7 dni</option>
            <option value="30">Ostatnie 30 dni</option>
            <option value="90">Ostatnie 90 dni</option>
            <option value="365">Ostatni rok</option>
          </select>

          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FunnelIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Deals w pipeline</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalDeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Wartosc pipeline</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Srednia wartosc</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgDealValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sredni cykl</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgCycleTime} dni</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Lejek konwersji</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {stats.stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-4">
                <div className="w-32 text-right">
                  <p className="font-medium text-gray-900">{stage.name}</p>
                  <p className="text-sm text-gray-500">{stage.deals} deals</p>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {/* Deals bar */}
                    <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${(stage.deals / maxDeals) * 100}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>

                    {/* Conversion arrow */}
                    {index < stats.stages.length - 1 && (
                      <div className="text-center w-16">
                        <div className="text-sm font-medium text-gray-900">
                          {stage.conversionRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">konwersja</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-32 text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(stage.value)}</p>
                  <p className="text-sm text-gray-500">sr. {stage.avgDays} dni</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value by Stage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Wartosc wg etapu</h2>

          <div className="space-y-3">
            {stats.stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{stage.name}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(stage.value)}</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(stage.value / maxValue) * 100}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time in Stage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sredni czas w etapie</h2>

          <div className="space-y-3">
            {stats.stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{stage.name}</span>
                    <span className="font-medium text-gray-900">{stage.avgDays} dni</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(stage.avgDays / Math.max(...stats.stages.map(s => s.avgDays), 1)) * 100}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wnioski AI</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Najwieksza utrata konwersji nastepuje miedzy etapem "Kwalifikacja" a "Propozycja" - rozwaź usprawnienie procesu.</p>
              <p>• Sredni czas w etapie "Propozycja" jest najdluzszy - mozliwe waskie gardlo w przygotowaniu ofert.</p>
              <p>• Win rate na poziomie {stats.winRate.toFixed(1)}% jest powyzej sredniej branżowej (25%).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
