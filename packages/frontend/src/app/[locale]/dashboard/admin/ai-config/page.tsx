'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  CpuChipIcon,
  ServerIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';

interface AIProvider {
  id: string;
  name: string;
  type: string;
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
  config?: Record<string, any>;
}

interface AIModel {
  id: string;
  providerId: string;
  name: string;
  displayName: string;
  type: string;
  maxTokens: number;
  isActive: boolean;
  isDefault: boolean;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

export default function AIConfigPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'usage'>('providers');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showModelForm, setShowModelForm] = useState(false);

  // Form states
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'openai',
    apiKey: '',
    baseUrl: '',
  });

  const [newModel, setNewModel] = useState({
    providerId: '',
    name: '',
    displayName: '',
    type: 'chat',
    maxTokens: 4096,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providersRes, modelsRes, usageRes] = await Promise.all([
        apiClient.get('/admin/ai-config/providers').catch(() => ({ data: { providers: [] } })),
        apiClient.get('/admin/ai-config/models').catch(() => ({ data: { models: [] } })),
        apiClient.get('/admin/ai-config/usage').catch(() => ({ data: null })),
      ]);

      setProviders(providersRes.data?.providers || []);
      setModels(modelsRes.data?.models || []);
      setUsage(usageRes.data);
    } catch (error) {
      console.error('Failed to load AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const res = await apiClient.post(`/admin/ai-config/providers/${providerId}/test`);
      if (res.data.success) {
        toast.success(`Provider test successful! Latency: ${res.data.latency}ms`);
      } else {
        toast.error(res.data.message || 'Test failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Test failed');
    } finally {
      setTestingProvider(null);
    }
  };

  const createProvider = async () => {
    try {
      await apiClient.post('/admin/ai-config/providers', newProvider);
      toast.success('Provider created');
      setShowProviderForm(false);
      setNewProvider({ name: '', type: 'openai', apiKey: '', baseUrl: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create provider');
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      await apiClient.delete(`/admin/ai-config/providers/${providerId}`);
      toast.success('Provider deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete provider');
    }
  };

  const toggleProviderActive = async (provider: AIProvider) => {
    try {
      await apiClient.put(`/admin/ai-config/providers/${provider.id}`, {
        isActive: !provider.isActive,
      });
      toast.success(`Provider ${provider.isActive ? 'disabled' : 'enabled'}`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update provider');
    }
  };

  const createModel = async () => {
    try {
      await apiClient.post('/admin/ai-config/models', newModel);
      toast.success('Model created');
      setShowModelForm(false);
      setNewModel({ providerId: '', name: '', displayName: '', type: 'chat', maxTokens: 4096 });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create model');
    }
  };

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await apiClient.delete(`/admin/ai-config/models/${modelId}`);
      toast.success('Model deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete model');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CpuChipIcon className="w-8 h-8 text-indigo-600" />
          AI Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage AI providers, models and monitor usage
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'providers'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ServerIcon className="w-5 h-5 inline mr-2" />
          Providers ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'models'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Cog6ToothIcon className="w-5 h-5 inline mr-2" />
          Models ({models.length})
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'usage'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChartBarIcon className="w-5 h-5 inline mr-2" />
          Usage
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">AI Providers</h2>
            <button
              onClick={() => setShowProviderForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="w-5 h-5" />
              Add Provider
            </button>
          </div>

          {showProviderForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium mb-4">New Provider</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Provider Name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <select
                  value={newProvider.type}
                  onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google AI</option>
                  <option value="ollama">Ollama</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="password"
                  placeholder="API Key"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Base URL (optional)"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={createProvider}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowProviderForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ServerIcon className="w-8 h-8 text-indigo-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
                      <p className="text-sm text-gray-500">{provider.type}</p>
                    </div>
                    {provider.isActive ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testProvider(provider.id)}
                      disabled={testingProvider === provider.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      {testingProvider === provider.id ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleProviderActive(provider)}
                      className={`p-2 rounded-lg ${
                        provider.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {provider.isActive ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {providers.length === 0 && (
              <p className="text-center text-gray-500 py-8">No providers configured. Add one to get started.</p>
            )}
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">AI Models</h2>
            <button
              onClick={() => setShowModelForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="w-5 h-5" />
              Add Model
            </button>
          </div>

          {showModelForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium mb-4">New Model</h3>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newModel.providerId}
                  onChange={(e) => setNewModel({ ...newModel, providerId: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Model ID (e.g., gpt-4)"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={newModel.displayName}
                  onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Max Tokens"
                  value={newModel.maxTokens}
                  onChange={(e) => setNewModel({ ...newModel, maxTokens: parseInt(e.target.value) })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={createModel} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Create
                </button>
                <button onClick={() => setShowModelForm(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{model.displayName}</h3>
                    <p className="text-sm text-gray-500">{model.name} • {model.type} • {model.maxTokens} tokens</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {model.isDefault && (
                      <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">Default</span>
                    )}
                    <button onClick={() => deleteModel(model.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {models.length === 0 && (
              <p className="text-center text-gray-500 py-8">No models configured.</p>
            )}
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Usage Statistics</h2>
          {usage ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-3xl font-bold text-indigo-600">{usage.totalRequests.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">Total Tokens</p>
                <p className="text-3xl font-bold text-green-600">{usage.totalTokens.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-3xl font-bold text-amber-600">${usage.totalCost.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No usage data available.</p>
          )}
        </div>
      )}
    </div>
  );
}
