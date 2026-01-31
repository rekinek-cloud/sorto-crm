'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import rag, { RagSource, QueryResult, SearchResult } from '@/lib/api/rag';

type TabType = 'query' | 'search' | 'sources';

export default function RAGPage() {
  const [activeTab, setActiveTab] = useState<TabType>('query');
  const [sources, setSources] = useState<RagSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Query state
  const [question, setQuestion] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadType, setUploadType] = useState('document');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const data = await rag.listSources();
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    try {
      const result = await rag.query(question);
      setQueryResult(result);
    } catch (error) {
      toast.error('Błąd podczas wyszukiwania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const results = await rag.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error('Błąd podczas wyszukiwania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadText = async () => {
    if (!uploadName.trim() || !uploadContent.trim()) {
      toast.error('Podaj nazwę i treść dokumentu');
      return;
    }
    setIsLoading(true);
    try {
      await rag.indexDocument({
        name: uploadName,
        content: uploadContent,
        type: uploadType,
      });
      toast.success('Dokument zaindeksowany');
      setUploadName('');
      setUploadContent('');
      loadSources();
    } catch (error) {
      toast.error('Błąd podczas indeksowania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Wybierz plik');
      return;
    }
    setIsLoading(true);
    try {
      await rag.uploadFile(selectedFile, { type: uploadType });
      toast.success('Plik zaindeksowany');
      setSelectedFile(null);
      loadSources();
    } catch (error) {
      toast.error('Błąd podczas przesyłania pliku');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to źródło?')) return;
    try {
      await rag.deleteSource(id);
      toast.success('Źródło usunięte');
      loadSources();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const handleToggleSource = async (source: RagSource) => {
    try {
      await rag.updateSourceStatus(source.id, !source.isActive);
      loadSources();
    } catch (error) {
      toast.error('Błąd podczas aktualizacji');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">RAG - Baza Wiedzy</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'query', name: 'Zapytaj AI', icon: MagnifyingGlassIcon },
            { id: 'search', name: 'Szukaj', icon: DocumentTextIcon },
            { id: 'sources', name: 'Źródła', icon: CloudArrowUpIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Query Tab */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Zadaj pytanie</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="Wpisz pytanie..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleQuery}
                disabled={isLoading || !question.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Szukam...' : 'Zapytaj'}
              </button>
            </div>
          </div>

          {queryResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Odpowiedź</h3>
              <p className="text-gray-700 whitespace-pre-wrap mb-6">{queryResult.answer}</p>

              {queryResult.sources.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Źródła:</h4>
                  <div className="space-y-2">
                    {queryResult.sources.map((source, i) => (
                      <div key={i} className="text-sm bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{source.name}</span>
                          <span className="text-gray-500">{(source.similarity * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-gray-600 text-xs">{source.preview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Wyszukiwanie semantyczne</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Wpisz frazę do wyszukania..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Szukam...' : 'Szukaj'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Wyniki ({searchResults.length})</h3>
              <div className="space-y-4">
                {searchResults.map((result, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{result.sourceName}</span>
                      <span className="text-sm text-primary-600">{(result.similarity * 100).toFixed(0)}% podobne</span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{result.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Dodaj dokument</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Nazwa dokumentu"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="document">Dokument</option>
                  <option value="knowledge">Wiedza</option>
                  <option value="faq">FAQ</option>
                  <option value="procedure">Procedura</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treść</label>
                <textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Wklej treść dokumentu..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <button
                onClick={handleUploadText}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Indeksuję...' : 'Dodaj tekst'}
              </button>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lub prześlij plik</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".txt,.md,.js,.ts,.py,.json"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {selectedFile && (
                  <button
                    onClick={handleUploadFile}
                    disabled={isLoading}
                    className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Przesyłam...' : `Prześlij: ${selectedFile.name}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sources list */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Źródła ({sources.length})</h2>

            {sources.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak źródeł. Dodaj pierwszy dokument.</p>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{source.name}</span>
                        {source.isActive ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {source.chunksCount} chunków • {source.totalTokens} tokenów • {source.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSource(source)}
                        className={`px-3 py-1 text-xs rounded-lg ${
                          source.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {source.isActive ? 'Wyłącz' : 'Włącz'}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
