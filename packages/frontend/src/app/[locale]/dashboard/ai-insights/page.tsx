'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  CheckCircle,
  Clock,
  Zap,
  Filter,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { aiInsightsApi, AIInsight } from '@/lib/api/aiInsights';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    types: '',
    priority: '' as '' | 'low' | 'medium' | 'high' | 'critical',
    timeframe: 'week' as 'today' | 'week' | 'month',
  });
  const [meta, setMeta] = useState<{
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    avgConfidence: number;
  } | null>(null);

  useEffect(() => {
    loadInsights();
  }, [filters]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await aiInsightsApi.getGlobalInsights({
        types: filters.types || undefined,
        priority: filters.priority || undefined,
        timeframe: filters.timeframe,
        limit: 50,
      });
      setInsights(response.data.insights);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to load insights:', error);
      toast.error('Nie udalo sie zaladowac insightow');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (insight: AIInsight, action: any) => {
    try {
      setExecuting(insight.id);
      await aiInsightsApi.executeAction({
        actionType: action.type,
        actionData: action.data,
        insightId: insight.id,
      });
      toast.success('Akcja wykonana pomyslnie');
      loadInsights();
    } catch (error) {
      console.error('Failed to execute action:', error);
      toast.error('Nie udalo sie wykonac akcji');
    } finally {
      setExecuting(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'prediction':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Krytyczny',
      high: 'Wysoki',
      medium: 'Sredni',
      low: 'Niski',
    };
    return labels[priority] || priority;
  };

  return (
    <PageShell>
      <PageHeader
        title="AI Insights"
        subtitle="AI analizuje zadania, deale, komunikacje i projekty, wykrywa ryzyka, okazje i sugeruje dzialania"
        icon={Sparkles}
        iconColor="text-purple-600"
        actions={
          <button
            onClick={loadInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Odswiez
          </button>
        }
      />

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Wszystkie insighty</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{meta.total}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Srednia pewnosc</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{meta.avgConfidence}%</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Wysokie priorytety</p>
            <p className="text-2xl font-bold text-red-600">
              {(meta.byPriority['high'] || 0) + (meta.byPriority['critical'] || 0)}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Mozliwosci</p>
            <p className="text-2xl font-bold text-yellow-600">
              {meta.byType['opportunity'] || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Filtry</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as any })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="today">Dzisiaj</option>
            <option value="week">Ostatni tydzien</option>
            <option value="month">Ostatni miesiac</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="">Wszystkie priorytety</option>
            <option value="critical">Krytyczny</option>
            <option value="high">Wysoki</option>
            <option value="medium">Sredni</option>
            <option value="low">Niski</option>
          </select>
          <select
            value={filters.types}
            onChange={(e) => setFilters({ ...filters, types: e.target.value })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="">Wszystkie typy</option>
            <option value="alert">Alerty</option>
            <option value="opportunity">Mozliwosci</option>
            <option value="prediction">Predykcje</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <Sparkles className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Brak insightow do wyswietlenia</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              AI analizuje Twoje dane i wkrotce pojawia sie sugestie
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">{getTypeIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{insight.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(
                          insight.priority
                        )}`}
                      >
                        {getPriorityLabel(insight.priority)}
                      </span>
                      {insight.streamName && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                          {insight.streamName}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{insight.description}</p>

                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Pewnosc: {insight.confidence}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(insight.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>

                    {/* Actions */}
                    {insight.actions && insight.actions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {insight.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleExecuteAction(insight, action)}
                            disabled={executing === insight.id}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 transition-colors"
                          >
                            {executing === insight.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
