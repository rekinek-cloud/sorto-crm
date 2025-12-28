'use client';

/**
 * NaturalLanguageSearch - Search bar with autocomplete and suggestions
 * Supports natural language queries through RAG
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  CheckSquare,
  TrendingUp,
  User,
  Building,
  FileText,
  MessageSquare,
  Waves,
  Loader2,
  Command
} from 'lucide-react';
import { SearchResult } from '@/lib/api/aiHub';

interface NaturalLanguageSearchProps {
  onSearch: (query: string) => Promise<void>;
  onQuerySubmit?: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  onClear: () => void;
  placeholder?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  task: CheckSquare,
  deal: TrendingUp,
  contact: User,
  company: Building,
  document: FileText,
  message: MessageSquare,
  stream: Waves
};

const typeLabels: Record<string, string> = {
  task: 'Zadanie',
  deal: 'Deal',
  contact: 'Kontakt',
  company: 'Firma',
  document: 'Dokument',
  message: 'Wiadomość',
  stream: 'Strumień'
};

const recentSearches = [
  'zaległe zadania',
  'deale do zamknięcia',
  'kontakty bez aktywności'
];

export function NaturalLanguageSearch({
  onSearch,
  onQuerySubmit,
  results,
  isLoading,
  onClear,
  placeholder = 'Zapytaj o cokolwiek...'
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (value.trim().length >= 2) {
          onSearch(value);
        }
      }, 300);
    },
    [onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      debouncedSearch(value);
    } else {
      onClear();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onQuerySubmit) {
      onQuerySubmit(query.trim());
      setQuery('');
      onClear();
      setIsFocused(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.href) {
      window.location.href = result.href;
    }
    setQuery('');
    onClear();
    setIsFocused(false);
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    onSearch(recent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFocused]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && (results.length > 0 || query.length === 0);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />

          {/* Right side controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            )}
            {query && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  onClear();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            {!isFocused && (
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500 border">
                <Command className="w-3 h-3" />
                /
              </kbd>
            )}
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1 font-medium">Wyniki</div>
              {results.map((result, index) => {
                const Icon = typeIcons[result.type] || FileText;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </div>
                      )}
                      {result.preview && (
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {result.preview}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {typeLabels[result.type] || result.type}
                      </span>
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                        {Math.round(result.score * 100)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent searches (when empty) */}
          {query.length === 0 && results.length === 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1 font-medium">Ostatnie wyszukiwania</div>
              {recentSearches.map((recent, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(recent)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{recent}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hint */}
          {query.trim() && onQuerySubmit && (
            <div className="border-t p-2">
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-blue-50 transition-colors text-blue-600"
              >
                <span className="text-sm">Zapytaj AI: "{query}"</span>
                <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">Enter</kbd>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NaturalLanguageSearch;
