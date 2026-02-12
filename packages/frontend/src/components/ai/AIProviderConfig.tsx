'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Key,
  Plus,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Pencil,
  RefreshCw,
} from 'lucide-react';
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

interface AIProviderConfigProps {
  className?: string;
}

export function AIProviderConfig({ className = '' }: AIProviderConfigProps) {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', apiEndpoint: 'https://api.openai.com/v1', apiKey: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editProviderData, setEditProviderData] = useState({ name: '', description: '', apiEndpoint: '', apiKey: '', enabled: true });
  const [providerLoadError, setProviderLoadError] = useState<string | null>(null);

  useEffect(() => { loadProviders(); }, []);

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
      setProviders([]);
      setProviderLoadError(err?.response?.status === 403 ? 'Brak uprawnien do konfiguracji providerow AI' : 'Nie udalo sie zaladowac providerow AI');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.name || !newProvider.apiKey) return;
    setSavingProvider(true);
    try {
      await apiClient.post('/admin/ai-config/providers', {
        name: newProvider.name,
        description: newProvider.name,
        apiEndpoint: newProvider.apiEndpoint,
        authType: 'api-key',
        enabled: true,
        configSchema: { apiKey: newProvider.apiKey },
        supportedModels: [],
        rateLimit: { requestsPerMinute: 60, tokensPerMinute: 100000 }
      });
      await loadProviders();
      setShowAddProvider(false);
      setNewProvider({ name: '', apiEndpoint: 'https://api.openai.com/v1', apiKey: '' });
    } catch (err) {
      console.error('Failed to add provider:', err);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Czy na pewno chcesz usunac tego providera?')) return;
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
      apiKey: '',
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
      if (editProviderData.apiKey) {
        updateData.configSchema = { ...editingProvider.configSchema, apiKey: editProviderData.apiKey };
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

  const getEndpointForName = (name: string) => {
    if (name === 'Anthropic') return 'https://api.anthropic.com/v1';
    if (name === 'Google') return 'https://generativelanguage.googleapis.com/v1';
    if (name === 'Mistral') return 'https://api.mistral.ai/v1';
    return 'https://api.openai.com/v1';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Key className="h-4 w-4" />
          Klucze API (Providerzy AI)
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowAddProvider(!showAddProvider)}>
          <Plus className="h-4 w-4 mr-1" /> Dodaj
        </Button>
      </div>

      {/* Add Provider Form */}
      {showAddProvider && (
        <div className="p-4 border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-3">
          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Nowy provider AI</h4>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nazwa providera</label>
            <select
              value={newProvider.name}
              onChange={(e) => {
                const name = e.target.value;
                setNewProvider({ ...newProvider, name, apiEndpoint: getEndpointForName(name) });
              }}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Endpoint API</label>
              <Input value={newProvider.apiEndpoint} onChange={(e) => setNewProvider({ ...newProvider, apiEndpoint: e.target.value })} placeholder="https://api.example.com/v1" />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Klucz API</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={newProvider.apiKey}
                onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                placeholder="sk-..."
                className="pr-10"
              />
              <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Klucz zostanie bezpiecznie zaszyfrowany</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddProvider} disabled={!newProvider.name || !newProvider.apiKey || savingProvider} className="flex-1">
              {savingProvider ? <LoadingSpinner size="sm" className="mr-1" /> : <Check className="h-4 w-4 mr-1" />} Zapisz
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowAddProvider(false); setNewProvider({ name: '', apiEndpoint: 'https://api.openai.com/v1', apiKey: '' }); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Providers List */}
      {loadingProviders ? (
        <div className="text-center py-8"><LoadingSpinner size="sm" /></div>
      ) : providerLoadError ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-400">{providerLoadError}</p>
              <Button variant="outline" size="sm" onClick={() => { setProviderLoadError(null); loadProviders(); }} className="mt-2">
                <RefreshCw className="h-3 w-3 mr-1" /> Sprobuj ponownie
              </Button>
            </div>
          </div>
        </div>
      ) : providers.length === 0 ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Brak skonfigurowanych providerow</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">Dodaj klucz API aby korzystac z funkcji AI.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                provider.enabled
                  ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-slate-400'}`} />
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{provider.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{provider.apiEndpoint}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                  {provider.enabled ? 'Aktywny' : 'Wylaczony'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleEditProvider(provider)} title="Edytuj">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggleProvider(provider)}>
                  {provider.enabled ? 'Wylacz' : 'Wlacz'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteProvider(provider.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Provider Form */}
      {editingProvider && (
        <div className="p-4 border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-3">
          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Edycja: {editingProvider.name}</h4>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nazwa</label>
            <Input value={editProviderData.name} onChange={(e) => setEditProviderData({ ...editProviderData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Opis</label>
            <Input value={editProviderData.description} onChange={(e) => setEditProviderData({ ...editProviderData, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Endpoint API</label>
            <Input value={editProviderData.apiEndpoint} onChange={(e) => setEditProviderData({ ...editProviderData, apiEndpoint: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Klucz API (pozostaw puste aby nie zmieniac)</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={editProviderData.apiKey}
                onChange={(e) => setEditProviderData({ ...editProviderData, apiKey: e.target.value })}
                placeholder="sk-... (pozostaw puste aby zachowac obecny)"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="editProviderEnabled" checked={editProviderData.enabled} onChange={(e) => setEditProviderData({ ...editProviderData, enabled: e.target.checked })} />
            <label htmlFor="editProviderEnabled" className="text-sm text-slate-900 dark:text-slate-100">Aktywny</label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEditProvider} disabled={!editProviderData.name || savingProvider} className="flex-1">
              {savingProvider ? <LoadingSpinner size="sm" className="mr-1" /> : <Check className="h-4 w-4 mr-1" />} Zapisz
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditingProvider(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
