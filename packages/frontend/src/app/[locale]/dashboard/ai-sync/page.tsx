'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Upload,
  MessageSquare,
  Search,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Folder,
  ChevronRight,
  Bot,
  Brain,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import aiSyncApi, {
  AiSource,
  AiConversation,
  SyncSummary,
  SyncResult,
  SearchResult,
} from '@/lib/api/aiSync';

const SOURCE_LABELS: Record<AiSource, { name: string; color: string; icon: React.ReactNode }> = {
  CHATGPT: { name: 'ChatGPT', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <Bot className="w-4 h-4" /> },
  CLAUDE: { name: 'Claude', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: <Brain className="w-4 h-4" /> },
  DEEPSEEK: { name: 'DeepSeek', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Search className="w-4 h-4" /> },
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
    <PageShell>
      <PageHeader
        title="AI Conversations Sync"
        subtitle="Import konwersacji z ChatGPT, Claude, DeepSeek do bazy RAG"
        icon={MessageSquare}
        iconColor="text-purple-600"
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Konwersacje</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totalConversations}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Zaindeksowane</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{summary.indexedConversations}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
              <Folder className="h-4 w-4" />
              <span className="text-sm">Aplikacje</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{Object.keys(summary.byApp).length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Zrodla</span>
            </div>
            <div className="flex gap-2 mt-1">
              {Object.entries(summary.bySource).map(([source, count]) => (
                <span
                  key={source}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_LABELS[source as AiSource]?.color || 'bg-slate-100 dark:bg-slate-700'}`}
                >
                  {source}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Import
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'conversations'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Konwersacje
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search className="h-4 w-4 inline mr-2" />
          Wyszukiwanie
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Import konwersacji</h2>

          {/* Source Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Zrodlo</label>
            <div className="flex gap-3">
              {(['CHATGPT', 'CLAUDE', 'DEEPSEEK'] as AiSource[]).map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                    selectedSource === source
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Plik JSON</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                {jsonFile ? (
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{jsonFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Kliknij aby wybrac plik</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Eksport JSON z ChatGPT, Claude lub DeepSeek</p>
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
              <span className="text-sm text-slate-700 dark:text-slate-300">Indeksuj po imporcie (embeddingi dla RAG)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={importOptions.createStreams}
                onChange={(e) => setImportOptions({ ...importOptions, createStreams: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Twórz strumienie REFERENCE per aplikacja</span>
            </label>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!jsonFile || importing}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Importowanie...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importuj
              </>
            )}
          </button>

          {/* Import Result */}
          {importResult && (
            <div className={`mt-6 p-4 rounded-xl ${importResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${importResult.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                  {importResult.success ? 'Import zakonczony' : 'Import zakonczony z bledami'}
                </span>
              </div>
              <div className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                <p>Zaimportowano: {importResult.conversationsImported}</p>
                <p>Pominieto (duplikaty): {importResult.conversationsSkipped}</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-700 dark:text-red-400">Bledy:</p>
                    <ul className="list-disc list-inside text-red-600 dark:text-red-400">
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
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 items-center">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as AiSource | '')}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={loadConversations}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleIndexAll}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Indeksuj wszystkie
            </button>
          </div>

          {/* Conversations List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">Ladowanie...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">Brak konwersacji</div>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_LABELS[conv.source]?.color}`}>
                          {SOURCE_LABELS[conv.source]?.name}
                        </span>
                        {conv.appName && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {conv.appName}
                          </span>
                        )}
                        {conv.isIndexed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{conv.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {conv.messageCount} wiadomosci
                        {conv.tokenCount && ` \u2022 ${conv.tokenCount} tokenow`}
                        {conv._count?.chunks && ` \u2022 ${conv._count.chunks} chunkow`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!conv.isIndexed && (
                        <button
                          onClick={() => handleIndex(conv.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg"
                          title="Indeksuj"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(conv.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title="Usun"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500" />
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
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wyszukiwanie semantyczne</h2>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Szukaj w konwersacjach AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {searching ? 'Szukam...' : 'Szukaj'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((result, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_LABELS[result.source as AiSource]?.color}`}>
                      {result.source}
                    </span>
                    {result.appName && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                        {result.appName}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Similarity: {(result.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{result.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{result.content}</p>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">Brak wynikow</p>
          )}
        </div>
      )}
    </PageShell>
  );
}
