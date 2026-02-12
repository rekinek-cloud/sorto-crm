'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  FileText,
  User,
  Building2,
  Folder,
  DollarSign,
  SlidersHorizontal,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { realVectorSearchApi } from '@/lib/api/realVectorSearch';
import debounce from 'lodash/debounce';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
  contact: { icon: User, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', label: 'Kontakt' },
  company: { icon: Building2, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', label: 'Firma' },
  deal: { icon: DollarSign, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400', label: 'Transakcja' },
  project: { icon: Folder, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', label: 'Projekt' },
  task: { icon: FileText, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', label: 'Zadanie' },
  document: { icon: FileText, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400', label: 'Dokument' },
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
        setResults([]);
      }

      const newRecent = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Wyszukiwanie nie powiodło się');
    } finally {
      setLoading(false);
    }
  };

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
    <PageShell>
      <PageHeader
        title="Wyszukiwanie"
        subtitle="Wyszukiwanie semantyczne AI"
        icon={Search}
        iconColor="text-indigo-600"
      />

      {/* Search Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSearchMode('semantic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'semantic'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Semantyczne (AI)
        </button>
        <button
          onClick={() => setSearchMode('keyword')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'keyword'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          <Search className="h-4 w-4" />
          Słownikowe
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            searchMode === 'semantic'
              ? 'Opisz czego szukasz, np. "klient zainteresowany wdrożeniem CRM"'
              : 'Wpisz słowa kluczowe...'
          }
          className="w-full pl-12 pr-12 py-4 border border-slate-300 dark:border-slate-600 rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        {loading && (
          <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 animate-spin" />
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
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {React.createElement(config.icon, { className: 'h-4 w-4' })}
              {config.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtry
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Min. score</label>
              <input
                type="range"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseFloat(e.target.value) })}
                min={0}
                max={1}
                step={0.1}
                className="w-32"
              />
              <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">{(filters.minScore || 0).toFixed(1)}</span>
            </div>

            <button onClick={clearFilters} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
              Wyczyść filtry
            </button>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ostatnie wyszukiwania
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => setQuery(search)}
                className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
            <span>Znaleziono {results.length} wyników</span>
            {searchMode === 'semantic' && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                Posortowane wg trafności AI
              </span>
            )}
          </div>

          {results.map((result) => {
            const config = typeConfig[result.type] || typeConfig.document;
            const Icon = config.icon;

            return (
              <div
                key={result.id}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{result.title}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
                        {config.label}
                      </span>
                    </div>

                    {result.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    {result.highlights && result.highlights.length > 0 && (
                      <div
                        className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2"
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
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className="text-slate-500 dark:text-slate-400">{(result.score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Brak wyników dla &quot;{query}&quot;</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Spróbuj innych słów kluczowych lub zmień tryb wyszukiwania
          </p>
        </div>
      ) : !query ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-indigo-300 dark:text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Wpisz zapytanie, aby rozpocząć wyszukiwanie</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Wyszukiwanie semantyczne rozumie kontekst i znaczenie
          </p>
        </div>
      ) : null}
    </PageShell>
  );
}
