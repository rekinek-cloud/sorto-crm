'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Loader2, FileText, Users, Building, Target, MessageSquare, Brain, Activity, Briefcase } from 'lucide-react';

interface SearchResult {
  id: string;
  type: string;
  entityId: string;
  title: string;
  summary: string;
  content?: string;
  metadata: {
    type: string;
    source: string;
    importance: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
  relevanceScore: number;
}

interface SearchResponse {
  query: string;
  keywords: string[];
  totalResults: number;
  results: SearchResult[];
  groupedResults: Record<string, SearchResult[]>;
  stats: {
    byType: Array<{ type: string; count: number }>;
    searchTime: number;
  };
}

const typeIcons = {
  task: <FileText className="w-4 h-4" />,
  project: <Target className="w-4 h-4" />,
  contact: <Users className="w-4 h-4" />,
  company: <Building className="w-4 h-4" />,
  deal: <Briefcase className="w-4 h-4" />,
  communication: <MessageSquare className="w-4 h-4" />,
  knowledge: <Brain className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />
};

const typeLabels = {
  task: 'Zadania',
  project: 'Projekty', 
  contact: 'Kontakty',
  company: 'Firmy',
  deal: 'Deals',
  communication: 'Komunikacja',
  knowledge: 'Wiedza',
  activity: 'Aktywności'
};

const typeColors = {
  task: 'bg-blue-100 text-blue-800',
  project: 'bg-purple-100 text-purple-800',
  contact: 'bg-green-100 text-green-800', 
  company: 'bg-orange-100 text-orange-800',
  deal: 'bg-red-100 text-red-800',
  communication: 'bg-cyan-100 text-cyan-800',
  knowledge: 'bg-indigo-100 text-indigo-800',
  activity: 'bg-gray-100 text-gray-800'
};

export default function UniversalSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [groupedView, setGroupedView] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allTypes = ['task', 'project', 'contact', 'company', 'deal', 'communication', 'knowledge', 'activity'];

  useEffect(() => {
    // Focus search input on mount
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/crm/api/v1/search/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
          limit: 50
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      } else {
        console.error('Search failed:', response.statusText);
      }
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[result.type as keyof typeof typeColors]}`}>
            {typeIcons[result.type as keyof typeof typeIcons]}
            <span className="ml-1">{typeLabels[result.type as keyof typeof typeLabels]}</span>
          </span>
          <span className="text-xs text-gray-500">
            Relevance: {result.relevanceScore}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {result.metadata.tags.map((tag, i) => (
            <span key={i} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">
        {result.title}
      </h3>
      
      <p className="text-sm text-gray-600 mb-3">
        {result.summary}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Ważność: {result.metadata.importance}/10</span>
        <span>Źródło: {result.metadata.source}</span>
        <span>{new Date(result.metadata.createdAt).toLocaleDateString('pl-PL')}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 Universal Search
        </h1>
        <p className="text-gray-600">
          Przeszukuj całą bazę danych za pomocą sztucznej inteligencji
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Wpisz zapytanie, np. 'firmy z branży IT', 'zadania wysokiego priorytetu', 'wiadomości o wycenie'..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Szukaj</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtry</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">Typy danych:</span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Wyczyść filtry
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                    selectedTypes.includes(type)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {typeIcons[type as keyof typeof typeIcons]}
                  <span>{typeLabels[type as keyof typeof typeLabels]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Wyniki wyszukiwania dla: "{results.query}"
              </h2>
              <p className="text-gray-600">
                Znaleziono {results.totalResults} wyników w {results.stats.searchTime}ms
              </p>
              {results.keywords.length > 0 && (
                <p className="text-sm text-gray-500">
                  Słowa kluczowe: {results.keywords.join(', ')}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setGroupedView(!groupedView)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  groupedView 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {groupedView ? 'Widok grupowany' : 'Widok listy'}
              </button>
            </div>
          </div>

          {/* Stats */}
          {results.stats.byType.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {results.stats.byType.map(stat => (
                <span
                  key={stat.type}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${typeColors[stat.type as keyof typeof typeColors]}`}
                >
                  {typeIcons[stat.type as keyof typeof typeIcons]}
                  <span className="ml-1">{typeLabels[stat.type as keyof typeof typeLabels]}: {stat.count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Results List */}
          {groupedView ? (
            <div className="space-y-8">
              {Object.entries(results.groupedResults).map(([type, typeResults]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    {typeIcons[type as keyof typeof typeIcons]}
                    <span>{typeLabels[type as keyof typeof typeLabels]} ({typeResults.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {typeResults.map(result => (
                      <ResultCard key={result.id} result={result} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.results.map(result => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          )}

          {/* No Results */}
          {results.totalResults === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Brak wyników
              </h3>
              <p className="text-gray-600">
                Spróbuj użyć innych słów kluczowych lub zmień filtry
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Zaawansowana wyszukiwarka AI
          </h3>
          <p className="text-gray-600 mb-6">
            Wpisz zapytanie aby przeszukać {333} dokumentów w bazie danych
          </p>
          <div className="max-w-2xl mx-auto">
            <h4 className="font-medium text-gray-900 mb-2">Przykłady zapytań:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>"firmy z branży technologicznej"</div>
              <div>"zadania wysokiego priorytetu"</div>
              <div>"projekty w planowaniu"</div>
              <div>"kontakty z Warszawy"</div>
              <div>"wiadomości o wycenie"</div>
              <div>"deals o wysokiej wartości"</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}