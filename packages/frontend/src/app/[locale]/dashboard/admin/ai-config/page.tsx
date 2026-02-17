'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Cpu,
  Server,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { AIActionConfigPanel } from '@/components/ai/AIActionConfigPanel';

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
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'usage' | 'actions'>('providers');
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
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="AI Configuration"
        subtitle="Manage AI providers, models and monitor usage"
        icon={Cpu}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'AI Config' }]}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'providers'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Server className="w-5 h-5 inline mr-2" />
          Providers ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'models'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Settings className="w-5 h-5 inline mr-2" />
          Models ({models.length})
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'usage'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-5 h-5 inline mr-2" />
          Usage
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'actions'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Zap className="w-5 h-5 inline mr-2" />
          Akcje AI ({actionConfigs.length})
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Providers</h2>
            <button
              onClick={() => setShowProviderForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Add Provider
            </button>
          </div>

          {showProviderForm && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">New Provider</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Provider Name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                />
                <select
                  value={newProvider.type}
                  onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
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
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Base URL (optional)"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
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
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500"
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
                className="p-4 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{provider.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{provider.type}</p>
                    </div>
                    {provider.isActive ? (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testProvider(provider.id)}
                      disabled={testingProvider === provider.id}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      {testingProvider === provider.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleProviderActive(provider)}
                      className={`p-2 rounded-lg ${
                        provider.isActive ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {provider.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {providers.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No providers configured. Add one to get started.</p>
            )}
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Models</h2>
            <button
              onClick={() => setShowModelForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Add Model
            </button>
          </div>

          {showModelForm && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">New Model</h3>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newModel.providerId}
                  onChange={(e) => setNewModel({ ...newModel, providerId: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
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
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={newModel.displayName}
                  onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                />
                <input
                  type="number"
                  placeholder="Max Tokens"
                  value={newModel.maxTokens}
                  onChange={(e) => setNewModel({ ...newModel, maxTokens: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={createModel} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Create
                </button>
                <button onClick={() => setShowModelForm(false)} className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="p-4 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{model.displayName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{model.name} &bull; {model.type} &bull; {model.maxTokens} tokens</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {model.isDefault && (
                      <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">Default</span>
                    )}
                    <button onClick={() => deleteModel(model.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {models.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No models configured.</p>
            )}
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Usage Statistics</h2>
          {usage ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Requests</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{usage.totalRequests.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Tokens</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{usage.totalTokens.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Cost</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">${usage.totalCost.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No usage data available.</p>
          )}
        </div>
      )}
      {/* Actions Tab */}
      {activeTab === 'actions' && <AIActionConfigPanel />}
    </PageShell>
  );
}
