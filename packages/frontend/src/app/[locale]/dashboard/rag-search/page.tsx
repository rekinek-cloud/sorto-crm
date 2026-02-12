'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileText, Sparkles, SlidersHorizontal, Clock, User } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface RAGSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    author?: string;
    createdAt: string;
    tags: string[];
  };
  relevanceScore: number;
  vectorSimilarity: number;
  semanticMatch: boolean;
}

interface RAGSearchResponse {
  query: string;
  results: RAGSearchResult[];
  totalResults: number;
  searchTime: number;
  searchMethod: 'semantic' | 'hybrid' | 'traditional';
  suggestions: string[];
}

export default function RAGSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    timeRange: 'all',
    minRelevance: 0.3
  });
  const [ragEnabled, setRagEnabled] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const history = localStorage.getItem('ragSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveToHistory = (searchQuery: string) => {
    const updatedHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem('ragSearchHistory', JSON.stringify(updatedHistory));
  };

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    saveToHistory(finalQuery);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const response = await fetch('/crm/api/v1/vector-search/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          query: finalQuery,
          limit: 500,
          threshold: filters.minRelevance,
          filters: {
            type: filters.type,
            timeRange: filters.timeRange,
            minRelevance: filters.minRelevance
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const mappedResults: RAGSearchResponse = {
          query: data.data.query,
          results: data.data.results.map((r: any) => ({
            id: r.id,
            type: r.entityType || 'unknown',
            title: r.title,
            content: r.content,
            metadata: {
              source: r.metadata?.source || 'database',
              author: r.metadata?.author,
              createdAt: r.metadata?.processingDate || new Date().toISOString(),
              tags: r.metadata?.tags || []
            },
            relevanceScore: r.similarity || 0,
            vectorSimilarity: r.similarity || 0,
            semanticMatch: (r.similarity || 0) > 0.5
          })),
          totalResults: data.data.totalResults || data.data.results.length,
          searchTime: data.data.searchTime || 0,
          searchMethod: 'semantic',
          suggestions: data.data.suggestions || []
        };
        setResults(mappedResults);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error: any) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      knowledge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      project: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      task: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      communication: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      message: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      contact: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      deal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      company: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      knowledge: FileText,
      project: Sparkles,
      communication: User,
      message: User,
      contact: User,
      company: Sparkles
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <PageShell>
      <PageHeader
        title="RAG Search"
        subtitle="Semantyczne wyszukiwanie w bazie wiedzy"
        icon={Search}
        iconColor="text-purple-600"
        actions={
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={ragEnabled}
                onChange={(e) => setRagEnabled(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">RAG Mode</span>
            </label>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              ragEnabled ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {ragEnabled ? 'Semantic' : 'Traditional'}
            </div>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Search Interface */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Wyszukaj w bazie wiedzy..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>Szukaj</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              <SlidersHorizontal className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Wszystkie typy</option>
                <option value="knowledge">Wiedza</option>
                <option value="project">Projekty</option>
                <option value="communication">Komunikacja</option>
                <option value="message">Wiadomosci</option>
                <option value="task">Zadania</option>
                <option value="contact">Kontakty</option>
                <option value="company">Firmy</option>
              </select>

              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                className="border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Caly okres</option>
                <option value="today">Dzisiaj</option>
                <option value="week">Ostatni tydzien</option>
                <option value="month">Ostatni miesiac</option>
                <option value="quarter">Ostatni kwartal</option>
                <option value="year">Ostatni rok</option>
              </select>

              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">Min. trafnosc:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.minRelevance}
                  onChange={(e) => setFilters({...filters, minRelevance: parseFloat(e.target.value)})}
                  className="w-20"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{Math.round(filters.minRelevance * 100)}%</span>
              </div>
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && !results && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ostatnie wyszukiwania:</h4>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(historyItem)}
                      className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      {historyItem}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {results && (
          <div className="space-y-4">
            {/* Search Stats */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Znaleziono {results.totalResults} wynikow ({results.searchTime}ms)
                  </span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    results.searchMethod === 'semantic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {results.searchMethod === 'semantic' ? 'Wyszukiwanie semantyczne' : 'Wyszukiwanie tradycyjne'}
                  </div>
                </div>

                {results.suggestions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Sugestie:</span>
                    {results.suggestions.slice(0, 2).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(suggestion)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-3">
              {results.results.map((result) => (
                <div key={result.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{result.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                          <span>{result.metadata.source}</span>
                          {result.metadata.author && (
                            <>
                              <span>-</span>
                              <span>{result.metadata.author}</span>
                            </>
                          )}
                          <span>-</span>
                          <span>{result.metadata.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {result.semanticMatch && (
                        <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium dark:bg-purple-900/30 dark:text-purple-300">
                          Semantic Match
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        result.relevanceScore > 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        result.relevanceScore > 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {Math.round(result.relevanceScore * 100)}%
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 mb-3 line-clamp-3">{result.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {result.metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs dark:bg-slate-700 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {ragEnabled && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Vector Similarity: {Math.round(result.vectorSimilarity * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Inteligentne Wyszukiwanie</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Uzyj RAG (Retrieval-Augmented Generation) do semantycznego wyszukiwania w bazie wiedzy
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Przyklady: "projekty z opoznieniami", "komunikacja z klientami premium", "analizy wydajnosci"
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
