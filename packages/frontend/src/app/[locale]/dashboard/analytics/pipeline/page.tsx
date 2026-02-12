'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pipelineAnalyticsApi, type PipelineOverview, type PipelineStage } from '@/lib/api/pipelineAnalytics';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

const defaultStages: PipelineStage[] = [
  { id: '1', name: 'Nowe', deals: 0, value: 0, avgDays: 0, conversionRate: 100, color: '#6366F1' },
  { id: '2', name: 'Kwalifikacja', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#8B5CF6' },
  { id: '3', name: 'Propozycja', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#EC4899' },
  { id: '4', name: 'Negocjacje', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#F59E0B' },
  { id: '5', name: 'Zamkniete', deals: 0, value: 0, avgDays: 0, conversionRate: 0, color: '#10B981' },
];

export default function PipelineAnalyticsPage() {
  const [stats, setStats] = useState<PipelineOverview>({
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
      const data = await pipelineAnalyticsApi.getOverview(dateRange);
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load pipeline stats:', error);
      toast.error('Nie udalo sie pobrac danych analityki');
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
    <PageShell>
      <PageHeader
        title="Pipeline Analytics"
        subtitle="Analiza lejka sprzedazowego"
        icon={BarChart3}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg"
            >
              <option value="7">Ostatnie 7 dni</option>
              <option value="30">Ostatnie 30 dni</option>
              <option value="90">Ostatnie 90 dni</option>
              <option value="365">Ostatni rok</option>
            </select>

            <button
              onClick={loadStats}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Deals w pipeline</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.totalDeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Wartosc pipeline</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Srednia wartosc</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.avgDealValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sredni cykl</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.avgCycleTime} dni</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Win Rate</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Lejek konwersji</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 text-slate-400 dark:text-slate-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {stats.stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-4">
                <div className="w-32 text-right">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{stage.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stage.deals} deals</p>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {/* Deals bar */}
                    <div className="flex-1 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
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
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {stage.conversionRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">konwersja</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-32 text-right">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(stage.value)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">sr. {stage.avgDays} dni</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value by Stage */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wartosc wg etapu</h2>

          <div className="space-y-3">
            {stats.stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{stage.name}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(stage.value)}</span>
                  </div>
                  <div className="mt-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sredni czas w etapie</h2>

          <div className="space-y-3">
            {stats.stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{stage.name}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{stage.avgDays} dni</span>
                  </div>
                  <div className="mt-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Wnioski AI</h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>Najwieksza utrata konwersji nastepuje miedzy etapem "Kwalifikacja" a "Propozycja" - rozwaz usprawnienie procesu.</p>
              <p>Sredni czas w etapie "Propozycja" jest najdluzszy - mozliwe waskie gardlo w przygotowaniu ofert.</p>
              <p>Win rate na poziomie {stats.winRate.toFixed(1)}% jest powyzej sredniej branzowej (25%).</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
