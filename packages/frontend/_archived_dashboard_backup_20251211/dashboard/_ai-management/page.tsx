'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import {
  PlusIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ServerIcon,
  BoltIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

// Import komponentów z istniejących stron
import { aiConfigApi, type AIModel, type AIProvider } from '@/lib/api/aiConfig';
import { aiRulesApi, AIRule, RulesFilters } from '@/lib/api/aiRules';
import AIRuleForm from '@/components/ai/AIRuleForm';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AIManagementPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // States dla rzeczywistych danych
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [rules, setRules] = useState<AIRule[]>([]);

  const tabs = [
    {
      name: 'Providerzy AI',
      icon: ServerIcon,
      description: 'Zarządzaj providerami AI i konfiguracją API',
    },
    {
      name: 'Modele AI',
      icon: BoltIcon,
      description: 'Konfiguruj dostępne modele i ich parametry',
    },
    {
      name: 'Reguły AI',
      icon: SparklesIcon,
      description: 'Twórz i zarządzaj regułami automatyzacji AI',
    },
    {
      name: 'Auto-Replies',
      icon: PlusIcon,
      description: 'Automatyczne odpowiedzi z AI i prostą logiką',
    },
    {
      name: 'Statystyki',
      icon: ChartBarIcon,
      description: 'Monitoruj użycie i wydajność AI',
    },
  ];

  // Mock data dla auto-replies (tymczasowo)
  const mockAutoReplies = [
    { 
      id: '1', 
      name: 'Potwierdzenie zapytania', 
      enabled: true, 
      triggerType: 'simple',
      sentCount: 45 
    },
    { 
      id: '2', 
      name: 'AI Draft Oferty', 
      enabled: true, 
      triggerType: 'ai-enhanced',
      sentCount: 12 
    }
  ];

  // Ładowanie rzeczywistych danych
  const loadData = useCallback(async () => {
    console.log('loadData started...');
    setIsLoading(true);
    try {
      // Temporary hardcoded providers until API is fixed
      const providersData = [
        {
          id: 'openai-provider',
          name: 'OpenAI',
          description: 'OpenAI GPT Models',
          apiEndpoint: 'https://api.openai.com/v1',
          authType: 'api-key',
          enabled: true,
          configSchema: { apiKey: '', model: 'text-embedding-3-small' },
          supportedModels: ['gpt-4', 'gpt-3.5-turbo', 'text-embedding-3-small'],
          rateLimit: { requestsPerMinute: 60, tokensPerMinute: 10000 }
        },
        {
          id: 'claude-provider',
          name: 'Claude',
          description: 'Anthropic Claude',
          apiEndpoint: 'https://api.anthropic.com/v1',
          authType: 'api-key',
          enabled: true,
          configSchema: { apiKey: '', model: 'claude-3-haiku-20240307' },
          supportedModels: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
          rateLimit: { requestsPerMinute: 60, tokensPerMinute: 10000 }
        },
        {
          id: 'deepseek-provider',
          name: 'DeepSeek',
          description: 'DeepSeek AI',
          apiEndpoint: 'https://api.deepseek.com/v1',
          authType: 'api-key',
          enabled: true,
          configSchema: { apiKey: '', model: 'deepseek-chat' },
          supportedModels: ['deepseek-chat', 'deepseek-coder'],
          rateLimit: { requestsPerMinute: 60, tokensPerMinute: 10000 }
        }
      ];

      const [modelsData, rulesResponse] = await Promise.all([
        aiConfigApi.getModels().catch((err) => { console.error('Models error:', err); return []; }),
        aiRulesApi.getRules({}).catch((err) => { console.error('Rules error:', err); return { rules: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }; }),
      ]);
      
      console.log('Providers data:', providersData);
      console.log('Models data:', modelsData);
      console.log('Rules data:', rulesResponse);
      
      setProviders(Array.isArray(providersData) ? providersData as AIProvider[] : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
      setRules(Array.isArray(rulesResponse?.rules) ? rulesResponse.rules : []);
    } catch (error: any) {
      console.error('Error loading AI data:', error);
      // Używaj pustych tablic w przypadku błędu
      setProviders([]);
      setModels([]);
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered, calling loadData...');
    loadData();
  }, [loadData]);

  // Stany dla modala edycji
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [providerConfig, setProviderConfig] = useState({
    apiKey: '',
    organization: '',
    anthropicVersion: '2023-06-01',
    timeout: 30000,
    maxRetries: 3,
    model: ''
  });

  // Handlery dla przycisków
  const handleAddProvider = () => {
    toast('Dodaj klucz API do istniejącego providera', { icon: '🔑' });
  };

  const handleAddModel = () => {
    toast('Funkcjonalność dodawania modelu - w rozwoju', { icon: '🚧' });
  };

  const handleAddRule = () => {
    toast('Funkcjonalność dodawania reguł - w rozwoju', { icon: '🚧' });
  };

  const handleEdit = (type: string, id: string) => {
    if (type === 'providera') {
      const provider = providers.find(p => p.id === id);
      if (provider) {
        setEditingProvider(provider);
        // Ustaw wartości z istniejącej konfiguracji
        setProviderConfig({
          apiKey: provider.configSchema?.apiKey || '',
          organization: provider.configSchema?.organization || '',
          anthropicVersion: provider.configSchema?.anthropicVersion || '2023-06-01',
          timeout: provider.configSchema?.timeout || 30000,
          maxRetries: provider.configSchema?.maxRetries || 3,
          model: provider.configSchema?.model || ''
        });
        setShowEditModal(true);
      }
    } else {
      toast(`Edycja ${type} (ID: ${id}) - funkcjonalność w rozwoju`, { icon: '🚧' });
    }
  };

  const handleSaveApiKey = async () => {
    if (!editingProvider) return;

    try {
      // Symulacja zapisu - w przyszłości połączenie z API
      toast.success(`Konfiguracja zaktualizowana dla ${editingProvider.name}!`);
      
      // Aktualizuj lokalny stan
      setProviders(prev => prev.map(p => 
        p.id === editingProvider.id 
          ? { ...p, configSchema: { ...p.configSchema, ...providerConfig } }
          : p
      ));

      setShowEditModal(false);
      setEditingProvider(null);
      setProviderConfig({
        apiKey: '',
        organization: '',
        anthropicVersion: '2023-06-01',
        timeout: 30000,
        maxRetries: 3,
        model: ''
      });
    } catch (error: any) {
      toast.error('Błąd podczas zapisywania konfiguracji');
    }
  };

  const handleDelete = (type: string, id: string) => {
    toast(`Usuwanie ${type} (ID: ${id}) - funkcjonalność w rozwoju`, { icon: '🚧' });
  };

  const handleToggle = (type: string, id: string) => {
    toast(`Przełączanie ${type} (ID: ${id}) - funkcjonalność w rozwoju`, { icon: '🚧' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <AdjustmentsHorizontalIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie AI</h1>
            <p className="text-gray-600">Centralne zarządzanie systemem sztucznej inteligencji</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-8">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* Providers Tab */}
          <Tab.Panel>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Providerzy AI</h2>
                  <p className="text-gray-600">Zarządzaj konfiguracją providerów AI</p>
                </div>
                <button 
                  onClick={handleAddProvider}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Dodaj Provider</span>
                </button>
              </div>

{isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providers.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      Brak providerów AI. Dodaj pierwszego providera.
                    </div>
                  ) : (
                    providers.map((provider) => (
                      <div key={provider.id} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            provider.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.enabled ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{provider.authType}</p>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit('providera', provider.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edytuj
                          </button>
                          <button 
                            onClick={() => handleDelete('providera', provider.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Usuń
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </Tab.Panel>

          {/* Models Tab */}
          <Tab.Panel>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Modele AI</h2>
                  <p className="text-gray-600">Konfiguruj dostępne modele AI</p>
                </div>
                <button 
                  onClick={handleAddModel}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Dodaj Model</span>
                </button>
              </div>

{isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      Brak modeli AI. Dodaj pierwszy model.
                    </div>
                  ) : (
                    models.map((model) => (
                      <div key={model.id} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{model.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            model.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {model.enabled ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">Provider: {model.provider}</p>
                        <p className="text-gray-600 text-sm mb-4">Model: {model.modelId}</p>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit('modelu', model.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edytuj
                          </button>
                          <button 
                            onClick={() => handleDelete('modelu', model.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Usuń
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </Tab.Panel>

          {/* Rules Tab */}
          <Tab.Panel>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Reguły AI</h2>
                  <p className="text-gray-600">Zarządzaj regułami automatyzacji AI</p>
                </div>
                <button 
                  onClick={handleAddRule}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Nowa Reguła</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rule.enabled ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{rule.description}</p>
                    <p className="text-gray-600 text-sm mb-4">Moduł: {rule.module}</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit('reguły', rule.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edytuj
                      </button>
                      <button 
                        onClick={() => handleToggle('reguły', rule.id)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm"
                      >
                        {rule.enabled ? 'Wyłącz' : 'Włącz'}
                      </button>
                      <button 
                        onClick={() => handleDelete('reguły', rule.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </Tab.Panel>

          {/* Auto-Replies Tab */}
          <Tab.Panel>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Automatyczne Odpowiedzi</h2>
                  <p className="text-gray-600">Zarządzaj automatycznymi odpowiedziami z AI i prostą logiką</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <PlusIcon className="w-5 h-5" />
                  <span>Nowa Auto-Reply</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAutoReplies.map((autoReply) => (
                  <div key={autoReply.id} className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{autoReply.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          autoReply.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {autoReply.enabled ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          autoReply.triggerType === 'ai-enhanced' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {autoReply.triggerType === 'ai-enhanced' ? 'AI' : 'Prosta'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Wysłane: {autoReply.sentCount} razy</p>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Edytuj</button>
                      <button className="text-yellow-600 hover:text-yellow-800 text-sm">
                        {autoReply.enabled ? 'Wyłącz' : 'Włącz'}
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">Usuń</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </Tab.Panel>

          {/* Statistics Tab */}
          <Tab.Panel>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Statystyki AI</h2>
                <p className="text-gray-600">Monitoruj użycie i wydajność systemów AI</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aktywne Providerzy</h3>
                  <p className="text-3xl font-bold text-blue-600">{providers.filter(p => p.enabled).length}</p>
                  <p className="text-gray-600 text-sm">z {providers.length} total</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aktywne Modele</h3>
                  <p className="text-3xl font-bold text-green-600">{models.filter(m => m.enabled).length}</p>
                  <p className="text-gray-600 text-sm">z {models.length} total</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aktywne Reguły</h3>
                  <p className="text-3xl font-bold text-purple-600">{rules.filter(r => r.enabled).length}</p>
                  <p className="text-gray-600 text-sm">z {rules.length} total</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Auto-Replies</h3>
                  <p className="text-3xl font-bold text-orange-600">{mockAutoReplies.filter(ar => ar.enabled).length}</p>
                  <p className="text-gray-600 text-sm">z {mockAutoReplies.length} total</p>
                  <p className="text-gray-500 text-xs mt-1">
                    AI: {mockAutoReplies.filter(ar => ar.triggerType === 'ai-enhanced').length}
                  </p>
                </div>
              </div>
            </motion.div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal edycji providera */}
      {showEditModal && editingProvider && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Tło */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => {
                setShowEditModal(false);
                setEditingProvider(null);
                setProviderConfig({
                  apiKey: '',
                  organization: '',
                  anthropicVersion: '2023-06-01',
                  timeout: 30000,
                  maxRetries: 3,
                  model: ''
                });
              }}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edytuj {editingProvider.name} Provider
                    </h3>
                    <div className="mt-4 space-y-4">
                      {/* API Key */}
                      <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                          API Key *
                        </label>
                        <input
                          type="password"
                          id="apiKey"
                          value={providerConfig.apiKey}
                          onChange={(e) => setProviderConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={editingProvider.name === 'OpenAI' ? 'sk-...' : editingProvider.name === 'Claude' ? 'sk-ant-...' : 'API Key'}
                        />
                      </div>

                      {/* Organization ID - tylko dla OpenAI */}
                      {editingProvider.name === 'OpenAI' && (
                        <div>
                          <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                            Organization ID (opcjonalnie)
                          </label>
                          <input
                            type="text"
                            id="organization"
                            value={providerConfig.organization}
                            onChange={(e) => setProviderConfig(prev => ({ ...prev, organization: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="org-..."
                          />
                        </div>
                      )}

                      {/* Anthropic Version - tylko dla Claude */}
                      {editingProvider.name === 'Claude' && (
                        <div>
                          <label htmlFor="anthropicVersion" className="block text-sm font-medium text-gray-700">
                            Wersja API Anthropic
                          </label>
                          <select
                            id="anthropicVersion"
                            value={providerConfig.anthropicVersion}
                            onChange={(e) => setProviderConfig(prev => ({ ...prev, anthropicVersion: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="2023-06-01">2023-06-01 (najnowsza)</option>
                            <option value="2023-01-01">2023-01-01</option>
                          </select>
                        </div>
                      )}

                      {/* Default Model - dla DeepSeek */}
                      {editingProvider.name === 'DeepSeek' && (
                        <div>
                          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                            Domyślny model
                          </label>
                          <select
                            id="model"
                            value={providerConfig.model}
                            onChange={(e) => setProviderConfig(prev => ({ ...prev, model: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="deepseek-chat">DeepSeek Chat</option>
                            <option value="deepseek-coder">DeepSeek Coder</option>
                          </select>
                        </div>
                      )}

                      {/* Zaawansowane ustawienia */}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700">
                          Zaawansowane ustawienia
                        </summary>
                        <div className="mt-2 space-y-3">
                          <div>
                            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700">
                              Timeout (ms)
                            </label>
                            <input
                              type="number"
                              id="timeout"
                              value={providerConfig.timeout}
                              onChange={(e) => setProviderConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              min="5000"
                              max="120000"
                              step="1000"
                            />
                          </div>
                          <div>
                            <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700">
                              Maksymalna liczba prób
                            </label>
                            <input
                              type="number"
                              id="maxRetries"
                              value={providerConfig.maxRetries}
                              onChange={(e) => setProviderConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              min="1"
                              max="5"
                            />
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Zapisz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProvider(null);
                    setProviderConfig({
                      apiKey: '',
                      organization: '',
                      anthropicVersion: '2023-06-01',
                      timeout: 30000,
                      maxRetries: 3,
                      model: ''
                    });
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}