'use client';

import React, { useState, useEffect } from 'react';
import { VoiceResponseAPI, VoiceAnalytics, ABTestResult } from '@/lib/api/voice-response';
import { toast } from 'react-hot-toast';

interface VoiceAnalyticsDashboardProps {
  className?: string;
}

export const VoiceAnalyticsDashboard: React.FC<VoiceAnalyticsDashboardProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<VoiceAnalytics | null>(null);
  const [abTestResults, setABTestResults] = useState<ABTestResult[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
    loadABTestResults();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await VoiceResponseAPI.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error('Błąd ładowania analityki');
    } finally {
      setLoading(false);
    }
  };

  const loadABTestResults = async () => {
    try {
      const results = await VoiceResponseAPI.getABTestResults();
      setABTestResults(results);
    } catch (error: any) {
      console.error('Failed to load A/B test results:', error);
    }
  };

  const promoteWinner = async (testId: string, variantId: string) => {
    try {
      await VoiceResponseAPI.promoteWinningVariant(testId, variantId);
      toast.success('Wariant został promowany!');
      await loadABTestResults();
    } catch (error: any) {
      console.error('Failed to promote variant:', error);
      toast.error('Błąd promowania wariantu');
    }
  };

  const stopTest = async (testId: string) => {
    try {
      await VoiceResponseAPI.stopABTest(testId, 'Manual stop from dashboard');
      toast.success('Test został zatrzymany');
      await loadABTestResults();
    } catch (error: any) {
      console.error('Failed to stop test:', error);
      toast.error('Błąd zatrzymywania testu');
    }
  };

  if (loading && !analytics) {
    return (
      <div className={`voice-analytics-dashboard bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-analytics-dashboard bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">📊 Analityka Głosowa</h2>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="1d">24 godziny</option>
              <option value="7d">7 dni</option>
              <option value="30d">30 dni</option>
            </select>
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Odświeżam...' : 'Odśwież'}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'overview', label: 'Przegląd' },
            { id: 'satisfaction', label: 'Satysfakcja' },
            { id: 'abtests', label: 'Testy A/B' },
            { id: 'performance', label: 'Wydajność' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Całkowite zdarzenia</div>
                <div className="text-2xl font-bold text-blue-900">{analytics.totalEvents.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Unikalni użytkownicy</div>
                <div className="text-2xl font-bold text-green-900">{analytics.uniqueUsers}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-yellow-600 text-sm font-medium">Średnia ocena</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {analytics.satisfactionMetrics.averageRating.toFixed(1)}/5
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">NPS Score</div>
                <div className="text-2xl font-bold text-purple-900">
                  {analytics.satisfactionMetrics.nps.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Response Types */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Typy odpowiedzi</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analytics.responseTypes).map(([type, data]: [string, any]) => (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{data.count}</div>
                    <div className="text-sm text-gray-600">{type}</div>
                    <div className="text-xs text-gray-500">
                      Śr. {data.averageLength} znaków
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Satisfaction Tab */}
        {activeTab === 'satisfaction' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Satisfaction Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Metryki satysfakcji</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wskaźnik satysfakcji:</span>
                    <span className="font-semibold">{analytics.satisfactionMetrics.satisfactionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Całkowite opinie:</span>
                    <span className="font-semibold">{analytics.satisfactionMetrics.totalFeedback}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Średnia ocena:</span>
                    <span className="font-semibold">{analytics.satisfactionMetrics.averageRating.toFixed(2)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Promoter Score:</span>
                    <span className={`font-semibold ${
                      analytics.satisfactionMetrics.nps >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.satisfactionMetrics.nps.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Patterns */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Wzorce użytkowania</h3>
                <div className="space-y-2">
                  {analytics.usagePatterns.peakUsageHours?.slice(0, 3).map((peak: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">Godzina {peak.hour}:00:</span>
                      <span className="font-semibold">{peak.count} zapytań</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* A/B Tests Tab */}
        {activeTab === 'abtests' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Aktywne testy A/B</h3>
              <span className="text-sm text-gray-500">{abTestResults.length} testów</span>
            </div>
            
            {abTestResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Brak aktywnych testów A/B
              </div>
            ) : (
              <div className="space-y-4">
                {abTestResults.map((test) => (
                  <div key={test.testId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{test.testName}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        test.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Zaufanie:</div>
                        <div className="font-semibold">{(test.significance.confidence * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Poprawa:</div>
                        <div className={`font-semibold ${
                          test.winner.improvement > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {test.winner.improvement > 0 ? '+' : ''}{test.winner.improvement.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Rekomendacja:</div>
                        <div className="font-semibold">{test.recommendation.action}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {test.recommendation.reason}
                    </div>
                    
                    {test.significance.significant && test.winner.variantId && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => promoteWinner(test.testId, test.winner.variantId!)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm rounded transition-colors"
                        >
                          Promuj zwycięzcę
                        </button>
                        <button
                          onClick={() => stopTest(test.testId)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded transition-colors"
                        >
                          Zatrzymaj test
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Metryki wydajności</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Średni czas generowania:</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.averageGenerationTime?.toFixed(0) || 0}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Średni czas odtwarzania:</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.averagePlaybackDuration?.toFixed(1) || 0}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wskaźnik ukończenia:</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.averageCompletionRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wskaźnik przerwania:</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.interruptionRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wskaźnik błędów:</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.errorRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Analiza błędów</h3>
                <div className="space-y-2">
                  {(analytics as any).errorAnalysis ? (
                    Object.entries((analytics as any).errorAnalysis.errorTypes).slice(0, 5).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600">{type}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">Brak danych o błędach</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAnalyticsDashboard;
