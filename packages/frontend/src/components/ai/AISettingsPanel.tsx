'use client';

/**
 * AI Settings Panel - Human-in-the-Loop
 * Komponent zgodny ze spec.md sekcja 7.2
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Settings,
  Bot,
  Inbox,
  Calendar,
  ClipboardList,
  BarChart3,
  Building2,
  Save,
  RefreshCw,
  Key,
  Plus,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Pencil
} from 'lucide-react';
import {
  AIContext,
  AutonomyLevel,
  UserAIPatterns,
  getUserPatterns,
  updateSettings
} from '@/lib/api/aiAssistant';
import apiClient from '@/lib/api/client';

interface AIProvider {
  id: string;
  name: string;
  description?: string;
  apiEndpoint: string;
  enabled: boolean;
  configSchema?: { apiKey?: string; [key: string]: any };
  authType?: string;
  rateLimit?: { requestsPerMinute?: number; tokensPerMinute?: number; tokensPerDay?: number; maxConcurrent?: number };
}

interface AISettingsPanelProps {
  onSettingsChange?: (patterns: UserAIPatterns) => void;
  className?: string;
}

const autonomyLevels: { level: AutonomyLevel; name: string; description: string }[] = [
  { level: 0, name: 'Wyłączony', description: 'Asystent AI nie podpowiada' },
  { level: 1, name: 'Sugestie', description: 'AI sugeruje, Ty zatwierdzasz każdą akcję' },
  { level: 2, name: 'Auto + Log', description: 'AI wykonuje i loguje, możesz cofnąć' },
  { level: 3, name: 'Auto cicha', description: 'AI działa w tle automatycznie' }
];

const contextOptions: { id: AIContext; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'SOURCE', name: 'Źródło', icon: Inbox, description: 'Analiza nowych elementów w Źródle' },
  { id: 'DAY_PLAN', name: 'Planowanie dnia', icon: Calendar, description: 'Optymalizacja planu dnia' },
  { id: 'REVIEW', name: 'Przegląd tygodniowy', icon: ClipboardList, description: 'Podsumowania i rekomendacje' },
  { id: 'TASK', name: 'Zadania', icon: BarChart3, description: 'Sugestie dla zadań' },
  { id: 'STREAM', name: 'Strumienie', icon: RefreshCw, description: 'Analiza strumieni' },
  { id: 'DEAL', name: 'CRM - Transakcje', icon: Building2, description: 'Sugestie dla transakcji' }
];

export function AISettingsPanel({ onSettingsChange, className = '' }: AISettingsPanelProps) {
  const [patterns, setPatterns] = useState<UserAIPatterns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for editing
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(1);
  const [enabledContexts, setEnabledContexts] = useState<AIContext[]>(['SOURCE', 'DAY_PLAN', 'REVIEW']);
  const [hasChanges, setHasChanges] = useState(false);

  // AI Providers state
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editProviderData, setEditProviderData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    enabled: true
  });
  const [providerLoadError, setProviderLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadPatterns();
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await apiClient.get('/admin/ai-config/providers');
      if (response.data.success) {
        setProviders(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setProviders(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load providers:', err);
      setProviders([]);
      setProviderLoadError(err?.response?.status === 403 ? 'Brak uprawnien do konfiguracji providerow AI' : 'Nie udalo sie zaladowac providerow AI');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.name || !newProvider.apiKey) {
      return;
    }

    setSavingProvider(true);
    try {
      const response = await apiClient.post('/admin/ai-config/providers', {
        name: newProvider.name,
        description: newProvider.name,
        apiEndpoint: newProvider.apiEndpoint,
        authType: 'api-key',
        enabled: true,
        configSchema: { apiKey: newProvider.apiKey },
        supportedModels: [],
        rateLimit: { requestsPerMinute: 60, tokensPerMinute: 100000 }
      });

      if (response.data) {
        await loadProviders();
        setShowAddProvider(false);
        setNewProvider({ name: '', apiEndpoint: 'https://api.openai.com/v1', apiKey: '' });
      }
    } catch (err) {
      console.error('Failed to add provider:', err);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego providera?')) return;

    try {
      await apiClient.delete(`/admin/ai-config/providers/${providerId}`);
      await loadProviders();
    } catch (err) {
      console.error('Failed to delete provider:', err);
    }
  };

  const handleToggleProvider = async (provider: AIProvider) => {
    try {
      await apiClient.put(`/admin/ai-config/providers/${provider.id}`, {
        ...provider,
        name: provider.name,
        description: provider.description || provider.name,
        apiEndpoint: provider.apiEndpoint,
        authType: 'api-key',
        enabled: !provider.enabled,
        configSchema: provider.configSchema || {},
        supportedModels: [],
        rateLimit: provider.rateLimit || { requestsPerMinute: 60, tokensPerMinute: 100000 }
      });
      await loadProviders();
    } catch (err) {
      console.error('Failed to toggle provider:', err);
    }
  };

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    setEditProviderData({
      name: provider.name,
      description: provider.description || '',
      apiEndpoint: provider.apiEndpoint,
      apiKey: '', // Don't show existing key
      enabled: provider.enabled
    });
    setShowApiKey(false);
  };

  const handleSaveEditProvider = async () => {
    if (!editingProvider) return;

    setSavingProvider(true);
    try {
      const updateData: any = {
        name: editProviderData.name,
        description: editProviderData.description || editProviderData.name,
        apiEndpoint: editProviderData.apiEndpoint,
        authType: 'api-key',
        enabled: editProviderData.enabled,
        supportedModels: [],
        rateLimit: {
          requestsPerMinute: editingProvider.rateLimit?.requestsPerMinute || 60,
          tokensPerMinute: editingProvider.rateLimit?.tokensPerMinute || 100000
        }
      };

      // Only update apiKey if provided
      if (editProviderData.apiKey) {
        updateData.configSchema = {
          ...editingProvider.configSchema,
          apiKey: editProviderData.apiKey
        };
      } else {
        updateData.configSchema = editingProvider.configSchema || {};
      }

      await apiClient.put(`/admin/ai-config/providers/${editingProvider.id}`, updateData);
      await loadProviders();
      setEditingProvider(null);
    } catch (err) {
      console.error('Failed to update provider:', err);
    } finally {
      setSavingProvider(false);
    }
  };

  const loadPatterns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUserPatterns();
      if (response.success) {
        setPatterns(response.data);
        setAutonomyLevel(response.data.autonomyLevel);
        setEnabledContexts(response.data.enabledContexts);
      }
    } catch (err) {
      console.error('Failed to load AI patterns:', err);
      setError('Nie udało się załadować ustawień AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutonomyChange = (level: AutonomyLevel) => {
    setAutonomyLevel(level);
    setHasChanges(true);
  };

  const handleContextToggle = (contextId: AIContext) => {
    setEnabledContexts(prev => {
      const newContexts = prev.includes(contextId)
        ? prev.filter(c => c !== contextId)
        : [...prev, contextId];
      setHasChanges(true);
      return newContexts;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await updateSettings({
        autonomyLevel,
        enabledContexts
      });
      if (response.success) {
        setHasChanges(false);
        // Reload patterns to get updated data
        await loadPatterns();
        onSettingsChange?.(response.data);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Nie udało się zapisać ustawień');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadPatterns} className="mt-2">
              Spróbuj ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ustawienia Asystenta AI
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Providers / API Keys */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Key className="h-4 w-4" />
              Klucze API (Providerzy AI)
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddProvider(!showAddProvider)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Dodaj
            </Button>
          </div>

          {/* Add Provider Form */}
          {showAddProvider && (
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Nowy provider AI</h4>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Nazwa providera</label>
                <select
                  value={newProvider.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    let endpoint = 'https://api.openai.com/v1';
                    if (name === 'Anthropic') endpoint = 'https://api.anthropic.com/v1';
                    else if (name === 'Google') endpoint = 'https://generativelanguage.googleapis.com/v1';
                    else if (name === 'Mistral') endpoint = 'https://api.mistral.ai/v1';
                    setNewProvider({ ...newProvider, name, apiEndpoint: endpoint });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Wybierz...</option>
                  <option value="OpenAI">OpenAI (GPT-4, GPT-3.5)</option>
                  <option value="Anthropic">Anthropic (Claude)</option>
                  <option value="Google">Google (Gemini)</option>
                  <option value="Mistral">Mistral AI</option>
                  <option value="Custom">Inny (custom)</option>
                </select>
              </div>

              {newProvider.name === 'Custom' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Endpoint API</label>
                  <Input
                    value={newProvider.apiEndpoint}
                    onChange={(e) => setNewProvider({ ...newProvider, apiEndpoint: e.target.value })}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-600 mb-1">Klucz API</label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Klucz zostanie bezpiecznie zaszyfrowany
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddProvider}
                  disabled={!newProvider.name || !newProvider.apiKey || savingProvider}
                  className="flex-1"
                >
                  {savingProvider ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Zapisz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddProvider(false);
                    setNewProvider({ name: '', apiEndpoint: 'https://api.openai.com/v1', apiKey: '' });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Providers List */}
          {loadingProviders ? (
            <div className="text-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : providerLoadError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{providerLoadError}</p>
                  <Button variant="outline" size="sm" onClick={() => { setProviderLoadError(null); loadProviders(); }} className="mt-2">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sprobuj ponownie
                  </Button>
                </div>
              </div>
            </div>
          ) : providers.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Brak skonfigurowanych providerów</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Dodaj klucz API aby korzystać z funkcji AI (analiza, automatyzacja, chat).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    provider.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-gray-500">{provider.apiEndpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                      {provider.enabled ? 'Aktywny' : 'Wyłączony'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProvider(provider)}
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleProvider(provider)}
                    >
                      {provider.enabled ? 'Wyłącz' : 'Włącz'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Provider Modal */}
          {editingProvider && (
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Edycja providera: {editingProvider.name}</h4>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Nazwa</label>
                <Input
                  value={editProviderData.name}
                  onChange={(e) => setEditProviderData({ ...editProviderData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Opis</label>
                <Input
                  value={editProviderData.description}
                  onChange={(e) => setEditProviderData({ ...editProviderData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Endpoint API</label>
                <Input
                  value={editProviderData.apiEndpoint}
                  onChange={(e) => setEditProviderData({ ...editProviderData, apiEndpoint: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Klucz API (pozostaw puste aby nie zmieniać)</label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={editProviderData.apiKey}
                    onChange={(e) => setEditProviderData({ ...editProviderData, apiKey: e.target.value })}
                    placeholder="sk-... (pozostaw puste aby zachować obecny)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editProviderEnabled"
                  checked={editProviderData.enabled}
                  onChange={(e) => setEditProviderData({ ...editProviderData, enabled: e.target.checked })}
                />
                <label htmlFor="editProviderEnabled" className="text-sm">Aktywny</label>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEditProvider}
                  disabled={!editProviderData.name || savingProvider}
                  className="flex-1"
                >
                  {savingProvider ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Zapisz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProvider(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <hr />

        {/* Autonomy Level */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Poziom autonomii:</h3>
          <div className="space-y-2">
            {autonomyLevels.map(({ level, name, description }) => (
              <label
                key={level}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  autonomyLevel === level
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="autonomy"
                  checked={autonomyLevel === level}
                  onChange={() => handleAutonomyChange(level)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-gray-600">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <hr />

        {/* Enabled Contexts */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Włączone konteksty:</h3>
          <div className="space-y-2">
            {contextOptions.map(({ id, name, icon: Icon, description }) => (
              <label
                key={id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  enabledContexts.includes(id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enabledContexts.includes(id)}
                  onChange={() => handleContextToggle(id)}
                />
                <Icon className="h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-gray-600">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <hr />

        {/* Statistics */}
        {patterns && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Statystyki:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Sugestii łącznie</p>
                <p className="text-xl font-bold">{patterns.totalSuggestions}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Zaakceptowanych</p>
                <p className="text-xl font-bold text-green-600">
                  {patterns.acceptanceRate.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Akceptacja sugestii</span>
                <span>{patterns.totalAccepted} / {patterns.totalSuggestions}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${patterns.acceptanceRate}%` }}
                />
              </div>
            </div>

            {/* Autonomy upgrade hint */}
            {patterns.autonomyLevel === 1 && patterns.totalAccepted >= 40 && patterns.acceptanceRate >= 70 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Bot className="h-4 w-4 inline mr-1" />
                  Masz wysoką akceptację sugestii! Rozważ zwiększenie poziomu autonomii.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Zapisz ustawienia
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default AISettingsPanel;
