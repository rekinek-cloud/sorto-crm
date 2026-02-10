'use client';

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { aiInsightsApi, AIInsight } from '@/lib/api/aiInsights';

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
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'opportunity':
        return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
      case 'prediction':
        return <ChartBarIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-sm text-gray-600">
              AI analizuje zadania, deale, komunikacje i projekty, wykrywa ryzyka, okazje i sugeruje dzialania
            </p>
          </div>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Odswiez
        </button>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Wszystkie insighty</p>
            <p className="text-2xl font-bold text-gray-900">{meta.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Srednia pewnosc</p>
            <p className="text-2xl font-bold text-gray-900">{meta.avgConfidence}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Wysokie priorytety</p>
            <p className="text-2xl font-bold text-red-600">
              {(meta.byPriority['high'] || 0) + (meta.byPriority['critical'] || 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Mozliwosci</p>
            <p className="text-2xl font-bold text-yellow-600">
              {meta.byType['opportunity'] || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtry</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="today">Dzisiaj</option>
            <option value="week">Ostatni tydzien</option>
            <option value="month">Ostatni miesiac</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Wszystkie typy</option>
            <option value="alert">Alerty</option>
            <option value="opportunity">Mozliwosci</option>
            <option value="prediction">Predykcje</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-purple-600 animate-spin" />
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak insightow do wyswietlenia</p>
          <p className="text-sm text-gray-400 mt-2">
            AI analizuje Twoje dane i wkrotce pojawia sie sugestie
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">{getTypeIcon(insight.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(
                        insight.priority
                      )}`}
                    >
                      {getPriorityLabel(insight.priority)}
                    </span>
                    {insight.streamName && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {insight.streamName}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{insight.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BoltIcon className="h-4 w-4" />
                      Pewnosc: {insight.confidence}%
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
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
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                        >
                          {executing === insight.id ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
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
  );
}
