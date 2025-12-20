'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { comparison } from '@/lib/api/ragClient';

// =============================================================================
// COMPARISON DEMO - Comparative Analysis
// =============================================================================

type ComparisonType = 'entities' | 'time-periods' | 'performance';

interface ComparisonResult {
  success: boolean;
  comparison_type: string;
  results: any;
  insights: Array<{
    type: string;
    message: string;
    importance: string;
  }>;
  winner?: string;
  recommendations: string[];
}

export default function ComparisonDemo() {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('entities');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  // Entity Comparison State
  const [entityType, setEntityType] = useState('DEAL');
  const [entityIds, setEntityIds] = useState('deal1, deal2, deal3');

  // Time Period Comparison State
  const [timePeriodEntityType, setTimePeriodEntityType] = useState('DEAL');
  const [period1Start, setPeriod1Start] = useState('2024-01-01');
  const [period1End, setPeriod1End] = useState('2024-03-31');
  const [period2Start, setPeriod2Start] = useState('2024-04-01');
  const [period2End, setPeriod2End] = useState('2024-06-30');

  // Performance Comparison State
  const [perfEntityType, setPerfEntityType] = useState('DEAL');
  const [metric, setMetric] = useState('revenue');
  const [topN, setTopN] = useState(5);

  const handleCompareEntities = async () => {
    setLoading(true);
    try {
      const ids = entityIds.split(',').map(id => id.trim()).filter(id => id);
      const data = await comparison.compareEntities(
        entityType,
        ids,
        'user123',
        'org456'
      );
      setResult(data);
      toast.success('Porównanie encji ukończone!');
    } catch (error: any) {
      console.error('Error comparing entities:', error);
      toast.error(error.response?.data?.detail || 'Błąd porównania encji');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareTimePeriods = async () => {
    setLoading(true);
    try {
      const data = await comparison.compareTimePeriods(
        timePeriodEntityType,
        period1Start,
        period1End,
        period2Start,
        period2End,
        'user123',
        'org456',
        'Q1 2024',
        'Q2 2024'
      );
      setResult(data);
      toast.success('Porównanie okresów ukończone!');
    } catch (error: any) {
      console.error('Error comparing time periods:', error);
      toast.error(error.response?.data?.detail || 'Błąd porównania okresów');
    } finally {
      setLoading(false);
    }
  };

  const handleComparePerformance = async () => {
    setLoading(true);
    try {
      const data = await comparison.comparePerformance(
        perfEntityType,
        metric,
        'user123',
        'org456',
        topN
      );
      setResult(data);
      toast.success('Ranking wydajności ukończony!');
    } catch (error: any) {
      console.error('Error comparing performance:', error);
      toast.error(error.response?.data?.detail || 'Błąd rankingu wydajności');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'winner': return '🏆';
      case 'trend': return '📈';
      case 'anomaly': return '⚠️';
      case 'opportunity': return '💡';
      default: return '📊';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>📊</span>
          <span>Comparative Analysis</span>
        </h2>
        <p className="text-gray-700">
          Porównuj encje, okresy czasowe i wydajność z AI-powered insights
        </p>
      </Card>

      {/* Comparison Type Selection */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">🎯 Wybierz typ porównania:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => setComparisonType('entities')}
            variant={comparisonType === 'entities' ? 'default' : 'outline'}
            className={`h-auto py-4 ${comparisonType === 'entities' ? 'bg-blue-600' : ''}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">🔀</span>
              <span className="font-semibold">Entity Comparison</span>
              <span className="text-xs opacity-80">Porównaj wiele encji</span>
            </div>
          </Button>
          <Button
            onClick={() => setComparisonType('time-periods')}
            variant={comparisonType === 'time-periods' ? 'default' : 'outline'}
            className={`h-auto py-4 ${comparisonType === 'time-periods' ? 'bg-blue-600' : ''}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="font-semibold">Time Periods</span>
              <span className="text-xs opacity-80">Porównaj okresy</span>
            </div>
          </Button>
          <Button
            onClick={() => setComparisonType('performance')}
            variant={comparisonType === 'performance' ? 'default' : 'outline'}
            className={`h-auto py-4 ${comparisonType === 'performance' ? 'bg-blue-600' : ''}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="font-semibold">Performance</span>
              <span className="text-xs opacity-80">Ranking top N</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* Entity Comparison Form */}
      {comparisonType === 'entities' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">🔀 Entity Comparison</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Typ encji:</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="DEAL">DEAL</option>
                <option value="PROJECT">PROJECT</option>
                <option value="COMPANY">COMPANY</option>
                <option value="CONTACT">CONTACT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Entity IDs (oddzielone przecinkami):</label>
              <input
                type="text"
                value={entityIds}
                onChange={(e) => setEntityIds(e.target.value)}
                placeholder="deal1, deal2, deal3"
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <Button
              onClick={handleCompareEntities}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : '🔍 Compare Entities'}
            </Button>
          </div>
        </Card>
      )}

      {/* Time Period Comparison Form */}
      {comparisonType === 'time-periods' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">📅 Time Period Comparison</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Typ encji:</label>
              <select
                value={timePeriodEntityType}
                onChange={(e) => setTimePeriodEntityType(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="DEAL">DEAL</option>
                <option value="PROJECT">PROJECT</option>
                <option value="TASK">TASK</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Okres 1 - Start:</label>
                <input
                  type="date"
                  value={period1Start}
                  onChange={(e) => setPeriod1Start(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Okres 1 - End:</label>
                <input
                  type="date"
                  value={period1End}
                  onChange={(e) => setPeriod1End(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Okres 2 - Start:</label>
                <input
                  type="date"
                  value={period2Start}
                  onChange={(e) => setPeriod2Start(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Okres 2 - End:</label>
                <input
                  type="date"
                  value={period2End}
                  onChange={(e) => setPeriod2End(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            <Button
              onClick={handleCompareTimePeriods}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : '📅 Compare Time Periods'}
            </Button>
          </div>
        </Card>
      )}

      {/* Performance Comparison Form */}
      {comparisonType === 'performance' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">🏆 Performance Leaderboard</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Typ encji:</label>
              <select
                value={perfEntityType}
                onChange={(e) => setPerfEntityType(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="DEAL">DEAL</option>
                <option value="PROJECT">PROJECT</option>
                <option value="USER">USER</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Metryka:</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="revenue">Revenue</option>
                <option value="tasks_completed">Tasks Completed</option>
                <option value="conversion_rate">Conversion Rate</option>
                <option value="response_time">Response Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Top N (1-10):</label>
              <input
                type="number"
                min="1"
                max="10"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <Button
              onClick={handleComparePerformance}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : '🏆 Generate Leaderboard'}
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Wyniki Porównania</span>
          </h3>

          {/* Winner */}
          {result.winner && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300 mb-4">
              <p className="text-lg font-bold flex items-center gap-2">
                <span>🏆</span>
                <span>Zwycięzca: {result.winner}</span>
              </p>
            </div>
          )}

          {/* Results Data */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">📈 Dane porównania:</h4>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </div>

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-3">💡 AI Insights:</h4>
              <div className="space-y-3">
                {result.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${getImportanceColor(insight.importance)}`}
                  >
                    <p className="flex items-start gap-2">
                      <span className="text-xl">{getInsightIcon(insight.type)}</span>
                      <span className="flex-1">{insight.message}</span>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        {insight.importance}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span>✅</span>
                <span>Rekomendacje:</span>
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
