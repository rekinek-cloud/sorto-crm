'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Sparkles, BarChart3, AlertTriangle, Target, TrendingUp, Lightbulb, BarChart } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface KnowledgeStats {
  dataPoints: {
    projects: number;
    tasks: number;
    deals: number;
    communications: number;
  };
  lastUpdate: string;
  capabilities: string[];
}

interface KnowledgeQuery {
  question: string;
  context?: string;
}

interface KnowledgeResponse {
  answer: string;
  confidence: number;
  data?: any;
  insights?: Array<{
    type: 'warning' | 'opportunity' | 'trend' | 'recommendation';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  actions?: Array<{
    type: string;
    title: string;
    description: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
  visualizations?: Array<{
    type: 'bar' | 'line' | 'pie' | 'progress';
    title: string;
    data: any[];
  }>;
  executionTime: number;
}

export default function KnowledgeStatusPage() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<KnowledgeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadStats();
    loadSuggestions();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/v1/ai-knowledge/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const res = await fetch('/api/v1/ai-knowledge/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.data.suggestions);
      }
    } catch (error: any) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleQuery = async (question: string) => {
    if (!question.trim()) return;

    setLoading(true);
    setQuery(question);

    try {
      const res = await fetch('/api/v1/ai-knowledge/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.data);
      } else {
        throw new Error('Failed to process query');
      }
    } catch (error: any) {
      console.error('Query failed:', error);
      setResponse({
        answer: 'Przepraszam, wystapil blad podczas przetwarzania zapytania.',
        confidence: 0,
        executionTime: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleQuery(suggestion);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <Target className="w-5 h-5" />;
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5" />;
      default: return <BarChart className="w-5 h-5" />;
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Knowledge Base Agent"
        subtitle="Inteligentna analiza danych STREAMS"
        icon={Sparkles}
        iconColor="text-purple-600"
        actions={
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">AI-Powered</span>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Projekty</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{stats.dataPoints.projects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Zadania</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{stats.dataPoints.tasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deals</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{stats.dataPoints.deals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Komunikacja</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{stats.dataPoints.communications}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Query Interface */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Zadaj pytanie o swoje dane
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery(query)}
                  placeholder="np. Ktore projekty sa zagrozone opoznieniem?"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <button
                onClick={() => handleQuery(query)}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  'Analizuj'
                )}
              </button>
            </div>
          </div>

          {/* Quick Suggestions */}
          {suggestions.length > 0 && !response && (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Przykladowe pytania:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response Display */}
        {response && (
          <div className="space-y-4">
            {/* Main Answer */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Odpowiedz AI</h3>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    response.confidence > 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    response.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {Math.round(response.confidence * 100)}% pewnosci
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{response.executionTime}ms</span>
                </div>
              </div>
              <div className="prose max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-sans">{response.answer}</pre>
              </div>
            </div>

            {/* Insights */}
            {response.insights && response.insights.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Kluczowe Insights</h3>
                <div className="space-y-3">
                  {response.insights.map((insight, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                      <div className="flex items-start">
                        <span className="mr-3">{getInsightIcon(insight.type)}</span>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm mt-1">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {response.actions && response.actions.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Rekomendowane Akcje</h3>
                <div className="space-y-3">
                  {response.actions.map((action, index) => (
                    <div key={index} className="flex items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                        action.urgency === 'high' ? 'bg-red-500' :
                        action.urgency === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">{action.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visualizations */}
            {response.visualizations && response.visualizations.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wizualizacje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.visualizations.map((viz, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">{viz.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Typ: {viz.type}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Punktow danych: {viz.data.length}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Capabilities */}
        {stats && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Mozliwosci Analityczne</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.capabilities.map((capability, index) => (
                <div key={index} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{capability}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
