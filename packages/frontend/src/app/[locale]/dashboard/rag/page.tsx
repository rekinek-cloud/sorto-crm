'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  CloudUpload,
  Trash2,
  CheckCircle2,
  XCircle,
  Database,
} from 'lucide-react';
import toast from 'react-hot-toast';
import rag, { RagSource, QueryResult, SearchResult } from '@/lib/api/rag';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
      toast.error('Blad podczas wyszukiwania');
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
      toast.error('Blad podczas wyszukiwania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadText = async () => {
    if (!uploadName.trim() || !uploadContent.trim()) {
      toast.error('Podaj nazwe i tresc dokumentu');
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
      toast.error('Blad podczas indeksowania');
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
      toast.error('Blad podczas przesylania pliku');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac to zrodlo?')) return;
    try {
      await rag.deleteSource(id);
      toast.success('Zrodlo usuniete');
      loadSources();
    } catch (error) {
      toast.error('Blad podczas usuwania');
    }
  };

  const handleToggleSource = async (source: RagSource) => {
    try {
      await rag.updateSourceStatus(source.id, !source.isActive);
      loadSources();
    } catch (error) {
      toast.error('Blad podczas aktualizacji');
    }
  };

  const tabItems = [
    { id: 'query' as TabType, name: 'Zapytaj AI', icon: Search },
    { id: 'search' as TabType, name: 'Szukaj', icon: FileText },
    { id: 'sources' as TabType, name: 'Zrodla', icon: CloudUpload },
  ];

  return (
    <PageShell>
      <PageHeader
        title="RAG - Baza Wiedzy"
        subtitle="Wyszukiwanie semantyczne i zarzadzanie zrodlami wiedzy"
        icon={Database}
        iconColor="text-indigo-600"
      />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Zadaj pytanie</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="Wpisz pytanie..."
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleQuery}
                  disabled={isLoading || !question.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Szukam...' : 'Zapytaj'}
                </button>
              </div>
            </div>

            {queryResult && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Odpowiedz</h3>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-6">{queryResult.answer}</p>

                {queryResult.sources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Zrodla:</h4>
                    <div className="space-y-2">
                      {queryResult.sources.map((source, i) => (
                        <div key={i} className="text-sm bg-slate-50 dark:bg-slate-700/40 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{source.name}</span>
                            <span className="text-slate-500 dark:text-slate-400">{(source.similarity * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs">{source.preview}</p>
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Wyszukiwanie semantyczne</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Wpisz fraze do wyszukania..."
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Szukam...' : 'Szukaj'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Wyniki ({searchResults.length})</h3>
                <div className="space-y-4">
                  {searchResults.map((result, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{result.sourceName}</span>
                        <span className="text-sm text-indigo-600 dark:text-indigo-400">{(result.similarity * 100).toFixed(0)}% podobne</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{result.content}</p>
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Dodaj dokument</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Nazwa dokumentu"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typ</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="document">Dokument</option>
                    <option value="knowledge">Wiedza</option>
                    <option value="faq">FAQ</option>
                    <option value="procedure">Procedura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tresc</label>
                  <textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder="Wklej tresc dokumentu..."
                    rows={6}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  onClick={handleUploadText}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Indeksuje...' : 'Dodaj tekst'}
                </button>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Lub przeslij plik</label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".txt,.md,.js,.ts,.py,.json"
                    className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                  />
                  {selectedFile && (
                    <button
                      onClick={handleUploadFile}
                      disabled={isLoading}
                      className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'Przesylam...' : `Przeslij: ${selectedFile.name}`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sources list */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Zrodla ({sources.length})</h2>

              {sources.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">Brak zrodel. Dodaj pierwszy dokument.</p>
              ) : (
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{source.name}</span>
                          {source.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {source.chunksCount} chunkow -- {source.totalTokens} tokenow -- {source.type}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSource(source)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            source.isActive
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          }`}
                        >
                          {source.isActive ? 'Wylacz' : 'Wlacz'}
                        </button>
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
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
    </PageShell>
  );
}
