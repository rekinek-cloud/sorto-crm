'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LightBulbIcon, SparklesIcon, ArrowTrendingUpIcon, CheckCircleIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import apiClient from '@/lib/api/client';

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
  LOW: 'text-gray-600'
};

const priorityLabels: Record<string, string> = {
  HIGH: 'Wysoki wpływ',
  MEDIUM: 'Średni wpływ',
  LOW: 'Niski wpływ'
};

const categoryColors: Record<string, string> = {
  PRODUCTIVITY: 'bg-green-100 text-green-700',
  LEARNING: 'bg-blue-100 text-blue-700',
  HEALTH: 'bg-pink-100 text-pink-700',
  CAREER: 'bg-purple-100 text-purple-700',
  BUSINESS: 'bg-amber-100 text-amber-700',
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
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-3 text-gray-600">Ładowanie rekomendacji...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <LightBulbIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rekomendacje AI</h1>
            <p className="text-sm text-gray-600">Inteligentne sugestie poprawy produktywności</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isGenerating
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          <SparklesIcon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Analizuję...' : 'Generuj nowe'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button onClick={handleGenerate} className="ml-auto text-sm text-red-600 underline hover:no-underline">
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Podsumowanie AI</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-amber-600">{visibleRecs.length}</div>
            <div className="text-sm text-gray-600">Aktywne sugestie</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-green-600">
              {visibleRecs.filter(r => r.priority === 'HIGH').length}
            </div>
            <div className="text-sm text-gray-600">Wysoki priorytet</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-blue-600">
              {visibleRecs.filter(r => r.potentialImpact && r.potentialImpact >= 70).length}
            </div>
            <div className="text-sm text-gray-600">Wysoki wpływ</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-purple-600">{avgConfidence}%</div>
            <div className="text-sm text-gray-600">Śr. pewność AI</div>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {visibleRecs.length === 0 && !error ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak rekomendacji</h3>
            <p className="text-gray-500">Wygeneruj nowe, aby otrzymać sugestie AI.</p>
          </div>
        ) : (
          visibleRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${categoryColors[rec.category] || 'bg-gray-100 text-gray-700'}`}>
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[rec.category] || 'bg-gray-100 text-gray-700'}`}>
                      {categoryLabels[rec.category] || rec.category}
                    </span>
                    <span className={`text-sm font-medium ${priorityColors[rec.priority] || 'text-gray-600'}`}>
                      • {priorityLabels[rec.priority] || rec.priority}
                    </span>
                    {rec.estimatedDuration && (
                      <span className="text-sm text-gray-500">• {rec.estimatedDuration}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{rec.description}</p>

                  {/* Suggested Actions */}
                  {rec.suggestedActions && rec.suggestedActions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Sugerowane kroki:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                        {rec.suggestedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <SparklesIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-gray-600">Pewność: {rec.confidence}%</span>
                    </div>
                    {rec.potentialImpact != null && (
                      <span className="text-sm text-gray-500">Wpływ: {rec.potentialImpact}%</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(rec.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
