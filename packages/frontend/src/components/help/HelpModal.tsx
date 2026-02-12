'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useHelp } from '@/contexts/help/HelpContext';
import { X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getHelpContent } from '@/lib/help/helpContent';
import ReactMarkdown from 'react-markdown';

export function HelpModal() {
  const { isOpen, closeHelp, currentPage, helpHistory } = useHelp();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Załaduj treść pomocy
  const loadContent = useCallback(async () => {
    if (!currentPage) {
      setContent('Wybierz stronę, aby zobaczyć pomoc.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const helpContent = await getHelpContent(currentPage);
      setContent(helpContent);
    } catch (err) {
      setError('Nie udało się załadować treści pomocy.');
      console.error('Error loading help content:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isOpen && currentPage) {
      loadContent();
    }
  }, [isOpen, currentPage, loadContent]);

  // Historia nawigacji
  const canGoBack = helpHistory.length > 1;
  const canGoForward = false; // TODO: Implement forward navigation

  const goBack = () => {
    if (canGoBack && helpHistory.length >= 2) {
      const previousPage = helpHistory[helpHistory.length - 2];
      // TODO: Implement navigation to previous page
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={closeHelp}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className={`p-1 rounded hover:bg-indigo-700 ${!canGoBack ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={!canGoForward}
              className={`p-1 rounded hover:bg-indigo-700 ${!canGoForward ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">Pomoc</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded hover:bg-indigo-700"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={closeHelp}
              className="p-2 rounded hover:bg-indigo-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="p-4 border-b">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj w pomocy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {!loading && !error && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-gray-600 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc text-gray-600" {...props} />,
                  ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal text-gray-600" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  code: ({node, ...props}: any) =>
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-indigo-500 pl-4 my-4 italic text-gray-600" {...props} />
                  ),
                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-6 border-gray-200" {...props} />,
                  a: ({node, ...props}) => (
                    <a className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Czy ta informacja była pomocna?</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 rounded hover:bg-gray-200">👍 Tak</button>
              <button className="px-3 py-1 rounded hover:bg-gray-200">👎 Nie</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}