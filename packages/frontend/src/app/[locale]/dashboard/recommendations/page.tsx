'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Sparkles, TrendingUp, CheckCircle, X, RefreshCw, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  reasoning?: string;
  suggestedActions?: string[];
  potentialImpact?: number;
  estimatedDuration?: string;
}

const priorityColors: Record<string, string> = {
  HIGH: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-slate-600 dark:text-slate-400'
};

const priorityLabels: Record<string, string> = {
  HIGH: 'Wysoki wpływ',
  MEDIUM: 'Średni wpływ',
  LOW: 'Niski wpływ'
};

const categoryColors: Record<string, string> = {
  PRODUCTIVITY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LEARNING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HEALTH: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  CAREER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  BUSINESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const categoryLabels: Record<string, string> = {
  PRODUCTIVITY: 'Produktywność',
  LEARNING: 'Nauka',
  HEALTH: 'Zdrowie',
  CAREER: 'Kariera',
  BUSINESS: 'Biznes',
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loadRecommendations = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/ai/goal-recommendations');
      const data = response.data?.data || response.data || [];
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError(err?.response?.status === 401
        ? 'Sesja wygasła. Zaloguj się ponownie.'
        : 'Nie udało się załadować rekomendacji AI');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadRecommendations().finally(() => setIsLoading(false));
  }, [loadRecommendations]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await loadRecommendations();
    setIsGenerating(false);
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visibleRecs = recommendations.filter(r => !dismissed.has(r.id));
  const avgConfidence = visibleRecs.length > 0
    ? Math.round(visibleRecs.reduce((sum, r) => sum + (r.confidence || 0), 0) / visibleRecs.length)
    : 0;

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">Ładowanie rekomendacji...</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Rekomendacje AI"
        subtitle="Inteligentne sugestie poprawy produktywności"
        icon={Lightbulb}
        iconColor="text-amber-600"
        actions={
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              isGenerating
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-wait'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analizuję...' : 'Generuj nowe'}
          </button>
        }
      />

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
          <button onClick={handleGenerate} className="ml-auto text-sm text-red-600 dark:text-red-400 underline hover:no-underline">
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Podsumowanie AI</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <div className="text-2xl font-bold text-amber-600">{visibleRecs.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Aktywne sugestie</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <div className="text-2xl font-bold text-green-600">
              {visibleRecs.filter(r => r.priority === 'HIGH').length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Wysoki priorytet</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <div className="text-2xl font-bold text-blue-600">
              {visibleRecs.filter(r => r.potentialImpact && r.potentialImpact >= 70).length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Wysoki wpływ</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <div className="text-2xl font-bold text-purple-600">{avgConfidence}%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Śr. pewność AI</div>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {visibleRecs.length === 0 && !error ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Brak rekomendacji</h3>
            <p className="text-slate-500 dark:text-slate-400">Wygeneruj nowe, aby otrzymać sugestie AI.</p>
          </div>
        ) : (
          visibleRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl ${categoryColors[rec.category] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[rec.category] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {categoryLabels[rec.category] || rec.category}
                    </span>
                    <span className={`text-sm font-medium ${priorityColors[rec.priority] || 'text-slate-600 dark:text-slate-400'}`}>
                      \u2022 {priorityLabels[rec.priority] || rec.priority}
                    </span>
                    {rec.estimatedDuration && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">\u2022 {rec.estimatedDuration}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{rec.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{rec.description}</p>

                  {/* Suggested Actions */}
                  {rec.suggestedActions && rec.suggestedActions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sugerowane kroki:</p>
                      <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                        {rec.suggestedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Pewność: {rec.confidence}%</span>
                    </div>
                    {rec.potentialImpact != null && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">Wpływ: {rec.potentialImpact}%</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(rec.id)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
