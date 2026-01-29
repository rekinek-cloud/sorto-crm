'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  getMcpApiKeys,
  createMcpApiKey,
  revokeMcpApiKey,
  deleteMcpApiKey,
  getMcpKeyUsage,
  McpApiKey,
  McpKeyUsageStats,
  McpUsageLogEntry,
} from '@/lib/api/mcp';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function McpKeysAdminPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<McpApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<McpApiKey | null>(null);
  const [keyStats, setKeyStats] = useState<McpKeyUsageStats | null>(null);
  const [keyHistory, setKeyHistory] = useState<McpUsageLogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

  useEffect(() => {
    if (isAdmin) {
      loadKeys();
    }
  }, [isAdmin]);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await getMcpApiKeys();
      setKeys(data);
    } catch (error) {
      console.error('Error loading MCP keys:', error);
      toast.error('Błąd ładowania kluczy API');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Podaj nazwę klucza');
      return;
    }

    try {
      setCreating(true);
      const result = await createMcpApiKey({ name: newKeyName });
      setNewKey(result.key);
      setShowCreateModal(false);
      setShowKeyModal(true);
      await loadKeys();
      toast.success('Klucz API został utworzony');
    } catch (error) {
      console.error('Error creating key:', error);
      toast.error('Błąd tworzenia klucza');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Czy na pewno chcesz dezaktywować ten klucz?')) return;

    try {
      await revokeMcpApiKey(keyId);
      await loadKeys();
      toast.success('Klucz został dezaktywowany');
    } catch (error) {
      console.error('Error revoking key:', error);
      toast.error('Błąd dezaktywacji klucza');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten klucz? Tej operacji nie można cofnąć.')) return;

    try {
      await deleteMcpApiKey(keyId);
      await loadKeys();
      toast.success('Klucz został usunięty');
    } catch (error) {
      console.error('Error deleting key:', error);
      toast.error('Błąd usuwania klucza');
    }
  };

  const handleViewStats = async (key: McpApiKey) => {
    setSelectedKey(key);
    try {
      const data = await getMcpKeyUsage(key.id);
      setKeyStats(data.stats);
      setKeyHistory(data.history);
    } catch (error) {
      console.error('Error loading key stats:', error);
      toast.error('Błąd ładowania statystyk');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Skopiowano do schowka');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Brak dostępu
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ta strona jest dostępna tylko dla administratorów.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <KeyIcon className="h-7 w-7 text-violet-500" />
            Klucze API MCP
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Zarządzaj kluczami API dla integracji z ChatGPT, Claude i Cursor
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadKeys}
            disabled={loading}
          >
            <ArrowPathIcon className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Nowy klucz
          </Button>
        </div>
      </div>

      {/* Keys List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <KeyIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Brak kluczy API
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Utwórz pierwszy klucz, aby umożliwić integrację MCP.
            </p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Utwórz klucz
            </Button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Klucz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nazwa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ostatnie użycie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utworzono
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-gray-600 dark:text-gray-300">
                      {key.keyPrefix}...
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {key.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        key.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      )}
                    >
                      {key.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Nigdy'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(key.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewStats(key)}
                        className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
                        title="Zobacz statystyki"
                      >
                        Statystyki
                      </button>
                      {key.isActive && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                          title="Dezaktywuj"
                        >
                          Dezaktywuj
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Usuń"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Configuration Info */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Konfiguracja dla Cursor / Claude Desktop
        </h3>
        <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
{`{
  "mcpServers": {
    "sorto-crm": {
      "url": "https://crm.dev.sorto.ai/mcp",
      "headers": {
        "Authorization": "Bearer <TWÓJ_KLUCZ_API>"
      }
    }
  }
}`}
        </pre>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Nowy klucz API
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nazwa klucza
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="np. Cursor Jana Kowalskiego"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleCreateKey} loading={creating}>
                  Utwórz
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showKeyModal && newKey && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckIcon className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Klucz utworzony
                </h3>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Ważne:</strong> Skopiuj ten klucz teraz. Nie będzie możliwości wyświetlenia go ponownie.
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                  {newKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {copied ? (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    setShowKeyModal(false);
                    setNewKey(null);
                    setNewKeyName('');
                  }}
                >
                  Gotowe
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedKey && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedKey(null)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Statystyki: {selectedKey.name || selectedKey.keyPrefix}
                </h3>
                <button
                  onClick={() => setSelectedKey(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {keyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {keyStats.totalCalls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Wszystkie wywołania
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {keyStats.successfulCalls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Udane
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {keyStats.lastWeekCalls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ostatni tydzień
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {keyStats.avgResponseTime}ms
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Śr. czas odpowiedzi
                    </div>
                  </div>
                </div>
              )}

              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Historia użycia
              </h4>
              {keyHistory.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Brak historii użycia
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {keyHistory.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            entry.success ? 'bg-green-500' : 'bg-red-500'
                          )}
                        />
                        <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          {entry.toolName}
                        </code>
                        {entry.query && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            "{entry.query}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {entry.responseTimeMs && <span>{entry.responseTimeMs}ms</span>}
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedKey(null)}>
                  Zamknij
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
