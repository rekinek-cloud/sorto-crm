'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface AnalysisStats {
  summary: {
    totalMessages: number;
    positiveMessages: number;
    negativeMessages: number;
    urgentMessages: number;
    tasksCreated: number;
    avgUrgencyScore: number;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categories: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  trends: {
    urgencyTrend: string;
    sentimentTrend: string;
    volumeTrend: string;
  };
}

interface MessageAnalysis {
  messageId: string;
  emailFrom?: string;
  emailSubject?: string;
  createdAt?: string;
  analysis: {
    sentiment: {
      label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
      score: number;
      confidence: number;
    };
    tasks: {
      hasTasks: boolean;
      extractedTasks: Array<{
        title: string;
        priority: string;
        confidence: number;
      }>;
    };
    category: {
      category: string;
      confidence: number;
      businessValue: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    urgencyScore: number;
    summary: string;
    recommendedActions: string[];
  };
}

export default function EmailAnalysisPage() {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<MessageAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadAnalysisData();
  }, [timeRange, sentimentFilter, categoryFilter]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, recentRes] = await Promise.all([
        apiClient.get('/email-analysis/stats', { params: { timeRange } }).catch(() => null),
        apiClient.get('/email-analysis/recent', {
          params: {
            limit: 20,
            ...(sentimentFilter ? { sentiment: sentimentFilter } : {}),
            ...(categoryFilter ? { category: categoryFilter } : {})
          }
        }).catch(() => null)
      ]);

      if (statsRes?.data?.success) {
        setStats(statsRes.data.data);
      }
      if (recentRes?.data?.success) {
        setRecentAnalyses(recentRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Error loading analysis data:', err);
      setError('Nie udalo sie zaladowac danych analizy');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'POSITIVE': return 'text-green-600 bg-green-100';
      case 'NEGATIVE': return 'text-red-600 bg-red-100';
      case 'MIXED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Ladowanie analizy...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analiza E-mail</h1>
          <p className="text-gray-600">Analiza AI komunikacji email</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Ostatnie 24h</option>
            <option value="7d">Ostatnie 7 dni</option>
            <option value="30d">Ostatnie 30 dni</option>
          </select>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wszystkie sentymenty</option>
            <option value="POSITIVE">Pozytywne</option>
            <option value="NEUTRAL">Neutralne</option>
            <option value="NEGATIVE">Negatywne</option>
          </select>
          <button
            onClick={loadAnalysisData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Odswiez
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.summary.totalMessages}</div>
            <div className="text-sm text-gray-500">Przeanalizowanych wiadomosci</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.summary.positiveMessages}</div>
            <div className="text-sm text-gray-500">Pozytywny sentyment</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{stats.summary.urgentMessages}</div>
            <div className="text-sm text-gray-500">Pilne wiadomosci</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.summary.tasksCreated}</div>
            <div className="text-sm text-gray-500">Wykryte zadania</div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        {stats && stats.summary.totalMessages > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Rozklad sentymentu</h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Pozytywne', value: stats.sentiment.positive, color: 'bg-green-500' },
                { label: 'Neutralne', value: stats.sentiment.neutral, color: 'bg-gray-400' },
                { label: 'Negatywne', value: stats.sentiment.negative, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-600">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${stats.summary.totalMessages > 0 ? (item.value / stats.summary.totalMessages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Distribution */}
        {stats && stats.categories.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Kategorie wiadomosci</h2>
            </div>
            <div className="p-6 space-y-3">
              {stats.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{category.name.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{category.count}</span>
                    <span className="text-xs text-gray-500">({category.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* No data message */}
      {stats && stats.summary.totalMessages === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak przeanalizowanych emaili</h3>
          <p className="text-gray-500">
            Analiza AI uruchomi sie automatycznie po skonfigurowaniu kont email i odebraniu wiadomosci.
          </p>
        </div>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ostatnie analizy</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAnalyses.map((result) => (
              <div key={result.messageId} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{result.emailSubject || 'Bez tematu'}</h3>
                    <p className="text-sm text-gray-500">{result.emailFrom}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getSentimentColor(result.analysis.sentiment.label)}`}>
                      {result.analysis.sentiment.label}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(result.analysis.urgencyScore)}`}>
                      Pilnosc: {result.analysis.urgencyScore}%
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-3">{result.analysis.summary}</p>
                {result.analysis.tasks.hasTasks && result.analysis.tasks.extractedTasks.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500">Wykryte zadania:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.analysis.tasks.extractedTasks.map((task, idx) => (
                        <span key={idx} className={`px-2 py-0.5 text-xs rounded ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
