'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { BarChart3, RefreshCw, Mail } from 'lucide-react';

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
      case 'POSITIVE': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40';
      case 'NEGATIVE': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
      case 'MIXED': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/40';
      default: return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
    if (score >= 60) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/40';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/40';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40';
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Ladowanie analizy...</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Analiza E-mail"
          subtitle="Analiza AI komunikacji email"
          icon={BarChart3}
          iconColor="text-blue-600"
          actions={
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="24h">Ostatnie 24h</option>
                <option value="7d">Ostatnie 7 dni</option>
                <option value="30d">Ostatnie 30 dni</option>
              </select>
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">Wszystkie sentymenty</option>
                <option value="POSITIVE">Pozytywne</option>
                <option value="NEUTRAL">Neutralne</option>
                <option value="NEGATIVE">Negatywne</option>
              </select>
              <button
                onClick={loadAnalysisData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Odswiez
              </button>
            </div>
          }
        />

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">{error}</div>
        )}

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.summary.totalMessages}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Przeanalizowanych wiadomosci</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.summary.positiveMessages}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Pozytywny sentyment</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.summary.urgentMessages}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Pilne wiadomosci</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.summary.tasksCreated}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Wykryte zadania</div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Distribution */}
          {stats && stats.summary.totalMessages > 0 && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rozklad sentymentu</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Pozytywne', value: stats.sentiment.positive, color: 'bg-green-500' },
                  { label: 'Neutralne', value: stats.sentiment.neutral, color: 'bg-slate-400 dark:bg-slate-500' },
                  { label: 'Negatywne', value: stats.sentiment.negative, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kategorie wiadomosci</h2>
              </div>
              <div className="p-6 space-y-3">
                {stats.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{category.name.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{category.count}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">({category.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* No data message */}
        {stats && stats.summary.totalMessages === 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Brak przeanalizowanych emaili</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Analiza AI uruchomi sie automatycznie po skonfigurowaniu kont email i odebraniu wiadomosci.
            </p>
          </div>
        )}

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ostatnie analizy</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentAnalyses.map((result) => (
                <div key={result.messageId} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{result.emailSubject || 'Bez tematu'}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{result.emailFrom}</p>
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
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-3">{result.analysis.summary}</p>
                  {result.analysis.tasks.hasTasks && result.analysis.tasks.extractedTasks.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Wykryte zadania:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.analysis.tasks.extractedTasks.map((task, idx) => (
                          <span key={idx} className={`px-2 py-0.5 text-xs rounded ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
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
    </PageShell>
  );
}
