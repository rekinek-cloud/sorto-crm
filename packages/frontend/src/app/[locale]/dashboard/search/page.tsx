'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  FolderIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { realVectorSearchApi } from '@/lib/api/realVectorSearch';
import debounce from 'lodash/debounce';

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'deal' | 'project' | 'task' | 'document';
  title: string;
  description?: string;
  score: number;
  highlights?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
}

interface SearchFilters {
  types: string[];
  dateRange?: string;
  minScore?: number;
}

const typeConfig: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  contact: { icon: UserIcon, color: 'text-blue-600 bg-blue-100', label: 'Kontakt' },
  company: { icon: BuildingOfficeIcon, color: 'text-green-600 bg-green-100', label: 'Firma' },
  deal: { icon: CurrencyDollarIcon, color: 'text-pink-600 bg-pink-100', label: 'Transakcja' },
  project: { icon: FolderIcon, color: 'text-purple-600 bg-purple-100', label: 'Projekt' },
  task: { icon: DocumentTextIcon, color: 'text-orange-600 bg-orange-100', label: 'Zadanie' },
  document: { icon: DocumentTextIcon, color: 'text-gray-600 bg-gray-100', label: 'Dokument' },
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    dateRange: undefined,
    minScore: 0.5,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('semantic');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      if (searchMode === 'semantic') {
        const result = await realVectorSearchApi.search(searchQuery, {
          limit: 20,
          filters: {
            minRelevance: filters.minScore,
          },
        });
        const data = result.data?.results || [];
        setResults(data.map((r: any) => ({
          id: r.id,
          type: r.metadata?.entityType || r.type,
          title: r.title,
          description: r.content,
          score: r.relevanceScore,
          highlights: [],
          metadata: r.metadata,
        })));
      } else {
        // Fallback to mock for keyword search (no dedicated API)
        setResults([]);
      }

      // Save to recent searches
      const newRecent = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Wyszukiwanie nie powiodlo sie');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((q: string) => performSearch(q), 300),
    [filters, searchMode]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      dateRange: undefined,
      minScore: 0.5,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <MagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wyszukiwanie</h1>
          <p className="text-sm text-gray-600">Wyszukiwanie semantyczne AI</p>
        </div>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSearchMode('semantic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'semantic'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <SparklesIcon className="h-4 w-4" />
          Semantyczne (AI)
        </button>
        <button
          onClick={() => setSearchMode('keyword')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'keyword'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Slownikowe
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            searchMode === 'semantic'
              ? 'Opisz czego szukasz, np. "klient zainteresowany wdrozeniem CRM"'
              : 'Wpisz slowa kluczowe...'
          }
          className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {loading && (
          <ArrowPathIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(typeConfig).map(([type, config]) => (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                filters.types.includes(type)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {React.createElement(config.icon, { className: 'h-4 w-4' })}
              {config.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-1 text-gray-500 hover:text-gray-700"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          Filtry
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min. score</label>
              <input
                type="range"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseFloat(e.target.value) })}
                min={0}
                max={1}
                step={0.1}
                className="w-32"
              />
              <span className="ml-2 text-sm text-gray-600">{(filters.minScore || 0).toFixed(1)}</span>
            </div>

            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
              Wyczysc filtry
            </button>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Ostatnie wyszukiwania
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => setQuery(search)}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Znaleziono {results.length} wynikow</span>
            {searchMode === 'semantic' && (
              <span className="flex items-center gap-1">
                <SparklesIcon className="h-4 w-4 text-indigo-500" />
                Posortowane wg trafnosci AI
              </span>
            )}
          </div>

          {results.map((result) => {
            const config = typeConfig[result.type] || typeConfig.document;
            const Icon = config.icon;

            return (
              <div
                key={result.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{result.title}</h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                        {config.label}
                      </span>
                    </div>

                    {result.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    {result.highlights && result.highlights.length > 0 && (
                      <div
                        className="text-sm text-gray-500 mt-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: result.highlights[0] }}
                      />
                    )}
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          result.score > 0.8
                            ? 'bg-green-500'
                            : result.score > 0.6
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-gray-500">{(result.score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Brak wynikow dla "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">
            Sprobuj innych slow kluczowych lub zmien tryb wyszukiwania
          </p>
        </div>
      ) : !query ? (
        <div className="text-center py-12">
          <SparklesIcon className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
          <p className="text-gray-500">Wpisz zapytanie, aby rozpoczac wyszukiwanie</p>
          <p className="text-sm text-gray-400 mt-1">
            Wyszukiwanie semantyczne rozumie kontekst i znaczenie
          </p>
        </div>
      ) : null}
    </div>
  );
}
