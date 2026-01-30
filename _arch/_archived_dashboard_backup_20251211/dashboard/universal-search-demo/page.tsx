'use client';

import React, { useState, useRef } from 'react';
import { Search, Filter, FileText, Users, Building, Target, MessageSquare, Brain, Activity, Briefcase } from 'lucide-react';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  summary: string;
  relevanceScore: number;
  importance: number;
  source: string;
  tags: string[];
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

// Mock database with real-looking data
const mockDatabase = [
  {
    id: 'company_1',
    type: 'company',
    title: 'TechCorp Solutions',
    summary: 'Firma: TechCorp Solutions\nBranża: Technology\nOpis: Leading technology solutions provider specializing in enterprise software...',
    relevanceScore: 85,
    importance: 7,
    source: 'internal',
    tags: ['Technology', 'Enterprise']
  },
  {
    id: 'company_2', 
    type: 'company',
    title: 'Acme Corporation',
    summary: 'Firma: Acme Corporation\nBranża: Manufacturing\nOpis: Global manufacturing company with operations worldwide...',
    relevanceScore: 82,
    importance: 8,
    source: 'internal',
    tags: ['Manufacturing', 'Global']
  },
  {
    id: 'task_1',
    type: 'task',
    title: 'Przygotować wycenę dla TechCorp',
    summary: 'Zadanie: Przygotować wycenę dla TechCorp\nStatus: NEW\nPriorytet: HIGH\nOpis: Opracować szczegółową wycenę dla nowego systemu CRM...',
    relevanceScore: 92,
    importance: 8,
    source: 'internal',
    tags: ['HIGH', 'NEW']
  },
  {
    id: 'task_2',
    type: 'task',
    title: 'Implementacja systemu ERP',
    summary: 'Zadanie: Implementacja systemu ERP\nStatus: IN_PROGRESS\nPriorytet: MEDIUM\nOpis: Wdrożenie nowego systemu ERP w firmie klienta...',
    relevanceScore: 75,
    importance: 6,
    source: 'internal',
    tags: ['MEDIUM', 'IN_PROGRESS']
  },
  {
    id: 'comm_1',
    type: 'communication',
    title: 'Wycena kartonowych tub KK',
    summary: 'Wiadomość: RE: zapytanie / wycena / 18.06.2025 - TUBY z kartonu KK\nOd: k.tuderek.pl@syto.biz\nTreść: Proszę o przygotowanie wyceny dla kartonowych tub...',
    relevanceScore: 95,
    importance: 8,
    source: 'email',
    tags: ['wycena', 'karton']
  },
  {
    id: 'comm_2',
    type: 'communication',
    title: '6 miesięcy abonamentu za 0 zł',
    summary: 'Wiadomość: 6 miesięcy abonamentu za 0 zł\nOd: T-Mobile <oferta@w.t-mobile.pl>\nTreść: Już dziś skorzystaj z wyjątkowej oferty abonamentowej...',
    relevanceScore: 70,
    importance: 5,
    source: 'email',
    tags: ['oferta', 'abonament']
  },
  {
    id: 'project_1',
    type: 'project',
    title: 'MVP Launch',
    summary: 'Projekt: MVP Launch\nStatus: PLANNING\nPriorytet: HIGH\nOpis: Launch the minimum viable product for Q4 release...',
    relevanceScore: 88,
    importance: 9,
    source: 'internal',
    tags: ['PLANNING', 'HIGH']
  },
  {
    id: 'project_2',
    type: 'project',
    title: 'Q1 Marketing Campaign',
    summary: 'Projekt: Q1 Marketing Campaign\nStatus: ACTIVE\nPriorytet: MEDIUM\nOpis: Comprehensive marketing push for new product line...',
    relevanceScore: 72,
    importance: 7,
    source: 'internal',
    tags: ['ACTIVE', 'MEDIUM']
  },
  {
    id: 'deal_1',
    type: 'deal',
    title: 'Enterprise License Deal',
    summary: 'Deal: Enterprise License Deal\nWartość: 250000 PLN\nEtap: NEGOTIATION\nFirma: TechCorp Solutions\nOpis: Annual enterprise license...',
    relevanceScore: 93,
    importance: 9,
    source: 'internal',
    tags: ['NEGOTIATION', 'Enterprise']
  },
  {
    id: 'contact_1',
    type: 'contact',
    title: 'Jan Kowalski',
    summary: 'Kontakt: Jan Kowalski\nEmail: jan.kowalski@techcorp.pl\nStanowisko: CTO\nFirma: TechCorp Solutions\nTelefon: +48 123 456 789...',
    relevanceScore: 78,
    importance: 6,
    source: 'internal',
    tags: ['CTO', 'Technology']
  }
];

export default function UniversalSearchDemoPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [groupedView, setGroupedView] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allTypes = ['task', 'project', 'contact', 'company', 'deal', 'communication', 'knowledge', 'activity'];

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Simulate search with mock data
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);
    
    let filteredResults = mockDatabase.filter(item => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) {
        return false;
      }
      
      // Keyword search
      const content = (item.title + ' ' + item.summary).toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });

    // Calculate relevance scores based on keyword matches
    filteredResults = filteredResults.map(item => {
      const content = (item.title + ' ' + item.summary).toLowerCase();
      let score = item.relevanceScore;
      
      // Boost score for exact matches
      if (content.includes(query.toLowerCase())) {
        score += 10;
      }
      
      return { ...item, relevanceScore: score };
    });

    // Sort by relevance
    filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    setResults(filteredResults);
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

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[result.type as keyof typeof typeColors]}`}>
            {typeIcons[result.type as keyof typeof typeIcons]}
            <span className="ml-1">{typeLabels[result.type as keyof typeof typeLabels]}</span>
          </span>
          <span className="text-xs text-gray-500">
            Score: {result.relevanceScore}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {result.tags.map((tag, i) => (
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
        {result.summary.substring(0, 200)}...
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Ważność: {result.importance}/10</span>
        <span>Źródło: {result.source}</span>
        <span>Demo data</span>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 Universal Search Demo
        </h1>
        <p className="text-gray-600">
          Demo wyszukiwarki semantycznej z symulowanymi danymi (333 wektory w rzeczywistej bazie)
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🎯 Sugerowane zapytania testowe:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <button onClick={() => { setQuery('wycena kartonowych tub'); handleSearch(); }} className="text-left text-blue-700 hover:text-blue-900">"wycena kartonowych tub"</button>
            <button onClick={() => { setQuery('firmy technologiczne'); handleSearch(); }} className="text-left text-blue-700 hover:text-blue-900">"firmy technologiczne"</button>
            <button onClick={() => { setQuery('projekty w planowaniu'); handleSearch(); }} className="text-left text-blue-700 hover:text-blue-900">"projekty w planowaniu"</button>
            <button onClick={() => { setQuery('zadania wysokiego priorytetu'); handleSearch(); }} className="text-left text-blue-700 hover:text-blue-900">"zadania wysokiego priorytetu"</button>
            <button onClick={() => { setQuery('deals enterprise'); handleSearch(); }} className="text-left text-blue-700 hover:text-blue-900">"deals enterprise"</button>
            <button onClick={() => { setQuery('abonament t-mobile'); handleSearch(); }} className="text-left text-blue-700 hover:text-blue-900">"abonament t-mobile"</button>
          </div>
        </div>
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
            disabled={!query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
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
      {results.length > 0 && (
        <div>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Wyniki wyszukiwania dla: "{query}"
              </h2>
              <p className="text-gray-600">
                Znaleziono {results.length} wyników (demo)
              </p>
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

          {/* Results List */}
          {groupedView ? (
            <div className="space-y-8">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
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
              {results.map(result => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {query && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak wyników
          </h3>
          <p className="text-gray-600">
            Spróbuj użyć innych słów kluczowych lub kliknij sugerowane zapytania powyżej
          </p>
        </div>
      )}

      {/* Empty State */}
      {!query && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Wyszukiwarka Semantyczna AI - Demo
          </h3>
          <p className="text-gray-600 mb-6">
            System RAG z 333 zwektoryzowanymi dokumentami z bazy danych
          </p>
          <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">✅ Zaimplementowane funkcjonalności:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">
              <div>• 333 wektory z całej bazy danych</div>
              <div>• 7 typów danych (task, project, contact, etc.)</div>
              <div>• Wyszukiwanie semantyczne</div>
              <div>• Filtrowanie po typach</div>
              <div>• Grupowanie wyników</div>
              <div>• Ranking relevancji</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}