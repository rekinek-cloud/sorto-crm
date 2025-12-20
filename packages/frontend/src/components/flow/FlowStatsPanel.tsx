'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { flowApi, FlowStats, FLOW_ACTION_LABELS, FlowAction } from '@/lib/api/flow';

export default function FlowStatsPanel() {
  const [stats, setStats] = useState<FlowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await flowApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load flow stats:', err);
        setError('Nie udało się załadować statystyk');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error || 'Brak danych'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-indigo-600" />
          Statystyki Flow Engine
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center gap-2 text-yellow-600 mb-2">
              <ArrowPathIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Do przetworzenia</span>
            </div>
            <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Dziś</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.processedToday}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ArrowTrendingUpIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Ten tydzień</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.processedThisWeek}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <ClockIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Śr. czas</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {stats.averageProcessingTime ? `${(stats.averageProcessingTime / 1000).toFixed(1)}s` : '-'}
            </p>
          </div>
        </div>

        {/* Action Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Rozkład akcji</h4>
          <div className="space-y-2">
            {(Object.entries(stats.actionDistribution || {}) as [FlowAction, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([action, count]) => {
                const config = FLOW_ACTION_LABELS[action];
                if (!config) return null;
                const total = Object.values(stats.actionDistribution || {}).reduce((s, c) => s + c, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={action} className="flex items-center gap-3">
                    <span className="text-lg w-8">{config.emoji}</span>
                    <span className="text-sm text-gray-700 w-40 truncate">{config.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Streams */}
        {stats.topStreams && stats.topStreams.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Najpopularniejsze strumienie</h4>
            <div className="space-y-2">
              {stats.topStreams.slice(0, 5).map((stream, index) => (
                <div key={stream.streamId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{stream.streamName}</span>
                  <span className="text-sm font-medium text-gray-900">{stream.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
