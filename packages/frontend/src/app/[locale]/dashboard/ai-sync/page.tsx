'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  CloudArrowUpIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  FolderIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import aiSyncApi, {
  AiSource,
  AiConversation,
  SyncSummary,
  SyncResult,
  SearchResult,
} from '@/lib/api/aiSync';

const SOURCE_LABELS: Record<AiSource, { name: string; color: string; icon: string }> = {
  CHATGPT: { name: 'ChatGPT', color: 'bg-green-100 text-green-800', icon: '🤖' },
  CLAUDE: { name: 'Claude', color: 'bg-orange-100 text-orange-800', icon: '🧠' },
  DEEPSEEK: { name: 'DeepSeek', color: 'bg-blue-100 text-blue-800', icon: '🔍' },
};

export default function AiSyncPage() {
  // State
  const [activeTab, setActiveTab] = useState<'import' | 'conversations' | 'search'>('import');
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Import state
  const [selectedSource, setSelectedSource] = useState<AiSource>('CHATGPT');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    indexAfterImport: true,
    createStreams: true,
  });
  const [importResult, setImportResult] = useState<SyncResult | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Filter state
  const [filterSource, setFilterSource] = useState<AiSource | ''>('');
  const [filterApp, setFilterApp] = useState('');

  // Load data
  const loadSummary = useCallback(async () => {
    try {
      const data = await aiSyncApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiSyncApi.getConversations({
        source: filterSource || undefined,
        appName: filterApp || undefined,
        take: 50,
      });
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Nie udalo sie zaladowac konwersacji');
    } finally {
      setLoading(false);
    }
  }, [filterSource, filterApp]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (activeTab === 'conversations') {
      loadConversations();
    }
  }, [activeTab, loadConversations]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        toast.error('Wybierz plik JSON');
        return;
      }
      setJsonFile(file);
      setImportResult(null);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!jsonFile) {
      toast.error('Wybierz plik do importu');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const content = await jsonFile.text();

      // Validate JSON
      try {
        JSON.parse(content);
      } catch {
        toast.error('Nieprawidlowy format JSON');
        setImporting(false);
        return;
      }

      const result = await aiSyncApi.import(selectedSource, content, importOptions);
      setImportResult(result);

      if (result.success) {
        toast.success(`Zaimportowano ${result.conversationsImported} konwersacji`);
        loadSummary();
      } else {
        toast.error('Import zakonczony z bledami');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Blad podczas importu');
    } finally {
      setImporting(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Wpisz zapytanie');
      return;
    }

    setSearching(true);
    try {
      const results = await aiSyncApi.search(searchQuery, { limit: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Blad wyszukiwania');
    } finally {
      setSearching(false);
    }
  };

  // Handle delete conversation
  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac te konwersacje?')) return;

    try {
      await aiSyncApi.deleteConversation(id);
      toast.success('Konwersacja usunieta');
      loadConversations();
      loadSummary();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Nie udalo sie usunac');
    }
  };

  // Handle index
  const handleIndex = async (id: string) => {
    try {
      const result = await aiSyncApi.indexConversation(id);
      toast.success(`Utworzono ${result.chunksCreated} chunkow`);
      loadConversations();
    } catch (error) {
      console.error('Index failed:', error);
      toast.error('Blad indeksowania');
    }
  };

  // Handle index all
  const handleIndexAll = async () => {
    try {
      const result = await aiSyncApi.indexAll();
      toast.success(`Zaindeksowano ${result.indexed} konwersacji`);
      loadConversations();
      loadSummary();
    } catch (error) {
      console.error('Index all failed:', error);
      toast.error('Blad indeksowania');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Conversations Sync</h1>
            <p className="text-sm text-gray-600">Import konwersacji z ChatGPT, Claude, DeepSeek do bazy RAG</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span className="text-sm">Konwersacje</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalConversations}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm">Zaindeksowane</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{summary.indexedConversations}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FolderIcon className="h-4 w-4" />
              <span className="text-sm">Aplikacje</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(summary.byApp).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <SparklesIcon className="h-4 w-4" />
              <span className="text-sm">Zrodla</span>
            </div>
            <div className="flex gap-2 mt-1">
              {Object.entries(summary.bySource).map(([source, count]) => (
                <span
                  key={source}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_LABELS[source as AiSource]?.color || 'bg-gray-100'}`}
                >
                  {source}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <CloudArrowUpIcon className="h-4 w-4 inline mr-2" />
          Import
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'conversations'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <DocumentTextIcon className="h-4 w-4 inline mr-2" />
          Konwersacje
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <MagnifyingGlassIcon className="h-4 w-4 inline mr-2" />
          Wyszukiwanie
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import konwersacji</h2>

          {/* Source Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zrodlo</label>
            <div className="flex gap-3">
              {(['CHATGPT', 'CLAUDE', 'DEEPSEEK'] as AiSource[]).map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    selectedSource === source
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span>{SOURCE_LABELS[source].icon}</span>
                  <span>{SOURCE_LABELS[source].name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Plik JSON</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                {jsonFile ? (
                  <p className="text-sm text-gray-900 font-medium">{jsonFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Kliknij aby wybrac plik</p>
                    <p className="text-xs text-gray-400 mt-1">Eksport JSON z ChatGPT, Claude lub DeepSeek</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={importOptions.indexAfterImport}
                onChange={(e) => setImportOptions({ ...importOptions, indexAfterImport: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Indeksuj po imporcie (embeddingi dla RAG)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={importOptions.createStreams}
                onChange={(e) => setImportOptions({ ...importOptions, createStreams: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Twórz strumienie REFERENCE per aplikacja</span>
            </label>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!jsonFile || importing}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Importowanie...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                Importuj
              </>
            )}
          </button>

          {/* Import Result */}
          {importResult && (
            <div className={`mt-6 p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.success ? 'Import zakonczony' : 'Import zakonczony z bledami'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p>Zaimportowano: {importResult.conversationsImported}</p>
                <p>Pominieto (duplikaty): {importResult.conversationsSkipped}</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-700">Bledy:</p>
                    <ul className="list-disc list-inside text-red-600">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 flex gap-4 items-center">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as AiSource | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Wszystkie zrodla</option>
              <option value="CHATGPT">ChatGPT</option>
              <option value="CLAUDE">Claude</option>
              <option value="DEEPSEEK">DeepSeek</option>
            </select>
            <input
              type="text"
              placeholder="Filtruj po aplikacji..."
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              onClick={loadConversations}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleIndexAll}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <SparklesIcon className="h-4 w-4" />
              Indeksuj wszystkie
            </button>
          </div>

          {/* Conversations List */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Ladowanie...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Brak konwersacji</div>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_LABELS[conv.source]?.color}`}>
                          {SOURCE_LABELS[conv.source]?.icon} {SOURCE_LABELS[conv.source]?.name}
                        </span>
                        {conv.appName && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {conv.appName}
                          </span>
                        )}
                        {conv.isIndexed ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900">{conv.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {conv.messageCount} wiadomosci
                        {conv.tokenCount && ` • ${conv.tokenCount} tokenow`}
                        {conv._count?.chunks && ` • ${conv._count.chunks} chunkow`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!conv.isIndexed && (
                        <button
                          onClick={() => handleIndex(conv.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Indeksuj"
                        >
                          <SparklesIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(conv.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Usun"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Wyszukiwanie semantyczne</h2>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj w konwersacjach AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {searching ? 'Szukam...' : 'Szukaj'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((result, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_LABELS[result.source as AiSource]?.color}`}>
                      {result.source}
                    </span>
                    {result.appName && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                        {result.appName}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Similarity: {(result.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{result.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{result.content}</p>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-center text-gray-500 py-8">Brak wynikow</p>
          )}
        </div>
      )}
    </div>
  );
}
