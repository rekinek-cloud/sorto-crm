'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChatBubbleBottomCenterTextIcon, SparklesIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

  // Load initial stats and suggestions
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
        answer: 'Przepraszam, wystąpił błąd podczas przetwarzania zapytania.',
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
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'opportunity': return '🎯';
      case 'trend': return '📈';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Agent</h1>
          <p className="text-gray-600">Inteligentna analiza danych CRM-GTD</p>
        </div>
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-purple-600 font-medium">AI-Powered</span>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Projekty</p>
                <p className="text-lg font-semibold text-gray-900">{stats.dataPoints.projects}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Zadania</p>
                <p className="text-lg font-semibold text-gray-900">{stats.dataPoints.tasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Deals</p>
                <p className="text-lg font-semibold text-gray-900">{stats.dataPoints.deals}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Komunikacja</p>
                <p className="text-lg font-semibold text-gray-900">{stats.dataPoints.communications}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Interface */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zadaj pytanie o swoje dane
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuery(query)}
                placeholder="np. Które projekty są zagrożone opóźnieniem?"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => handleQuery(query)}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-sm font-medium text-gray-700 mb-2">Przykładowe pytania:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Odpowiedź AI</h3>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  response.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                  response.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(response.confidence * 100)}% pewności
                </div>
                <span className="text-xs text-gray-500">{response.executionTime}ms</span>
              </div>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans">{response.answer}</pre>
            </div>
          </div>

          {/* Insights */}
          {response.insights && response.insights.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kluczowe Insights</h3>
              <div className="space-y-3">
                {response.insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                    <div className="flex items-start">
                      <span className="text-lg mr-3">{getInsightIcon(insight.type)}</span>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekomendowane Akcje</h3>
              <div className="space-y-3">
                {response.actions.map((action, index) => (
                  <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      action.urgency === 'high' ? 'bg-red-500' :
                      action.urgency === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visualizations */}
          {response.visualizations && response.visualizations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wizualizacje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.visualizations.map((viz, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{viz.title}</h4>
                    <p className="text-sm text-gray-600">Typ: {viz.type}</p>
                    <p className="text-sm text-gray-600">Punktów danych: {viz.data.length}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capabilities */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Możliwości Analityczne</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.capabilities.map((capability, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm text-gray-700">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}