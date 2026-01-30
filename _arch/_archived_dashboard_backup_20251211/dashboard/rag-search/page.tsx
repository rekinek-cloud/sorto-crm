'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, SparklesIcon, FunnelIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

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
    minRelevance: 0.5
  });
  const [ragEnabled, setRagEnabled] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load search history from localStorage
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
      // Real RAG search using actual vector database (test endpoint)
      const response = await fetch('/crm/api/v1/test-rag-search/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: finalQuery,
          limit: 10,
          filters: {
            type: filters.type,
            minRelevance: filters.minRelevance
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
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
      knowledge: 'bg-purple-100 text-purple-800',
      project: 'bg-blue-100 text-blue-800',
      task: 'bg-green-100 text-green-800',
      communication: 'bg-orange-100 text-orange-800',
      message: 'bg-orange-100 text-orange-800',
      contact: 'bg-indigo-100 text-indigo-800',
      deal: 'bg-yellow-100 text-yellow-800',
      company: 'bg-emerald-100 text-emerald-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      knowledge: DocumentTextIcon,
      project: SparklesIcon,
      communication: UserIcon,
      message: UserIcon,
      contact: UserIcon,
      company: SparklesIcon
    };
    const Icon = icons[type as keyof typeof icons] || DocumentTextIcon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RAG Search</h1>
          <p className="text-gray-600">Semantyczne wyszukiwanie w bazie wiedzy</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={ragEnabled}
              onChange={(e) => setRagEnabled(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">RAG Mode</span>
          </label>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            ragEnabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {ragEnabled ? 'Semantic' : 'Traditional'}
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Main Search */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Wyszukaj w bazie wiedzy..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
              <span>Szukaj</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">Wszystkie typy</option>
              <option value="knowledge">Wiedza</option>
              <option value="project">Projekty</option>
              <option value="communication">Komunikacja</option>
              <option value="message">Wiadomości</option>
              <option value="task">Zadania</option>
              <option value="contact">Kontakty</option>
              <option value="company">Firmy</option>
            </select>

            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">Wszystkie daty</option>
              <option value="week">Ostatni tydzień</option>
              <option value="month">Ostatni miesiąc</option>
              <option value="quarter">Ostatni kwartał</option>
            </select>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Min. trafność:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minRelevance}
                onChange={(e) => setFilters({...filters, minRelevance: parseFloat(e.target.value)})}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{Math.round(filters.minRelevance * 100)}%</span>
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && !results && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ostatnie wyszukiwania:</h4>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(historyItem)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ClockIcon className="w-3 h-3 inline mr-1" />
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
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Znaleziono {results.totalResults} wyników w {results.searchTime}ms
                </span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  results.searchMethod === 'semantic' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {results.searchMethod === 'semantic' ? 'Wyszukiwanie semantyczne' : 'Wyszukiwanie tradycyjne'}
                </div>
              </div>
              
              {results.suggestions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sugestie:</span>
                  {results.suggestions.slice(0, 2).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(suggestion)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
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
              <div key={result.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{result.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{result.metadata.source}</span>
                        {result.metadata.author && (
                          <>
                            <span>•</span>
                            <span>{result.metadata.author}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{result.metadata.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {result.semanticMatch && (
                      <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        Semantic Match
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      result.relevanceScore > 0.8 ? 'bg-green-100 text-green-800' :
                      result.relevanceScore > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(result.relevanceScore * 100)}%
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3 line-clamp-3">{result.content}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {result.metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {ragEnabled && (
                    <div className="text-xs text-gray-500">
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inteligentne Wyszukiwanie</h3>
          <p className="text-gray-600 mb-4">
            Użyj RAG (Retrieval-Augmented Generation) do semantycznego wyszukiwania w bazie wiedzy
          </p>
          <p className="text-sm text-gray-500">
            Przykłady: "projekty z opóźnieniami", "komunikacja z klientami premium", "analizy wydajności"
          </p>
        </div>
      )}
    </div>
  );
}