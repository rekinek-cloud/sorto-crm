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
    setIsLoading(true);
    try {
      const [providersData, modelsData, rulesResponse] = await Promise.all([
        aiConfigApi.getProviders().catch(() => []),
        aiConfigApi.getModels().catch(() => []),
        aiRulesApi.getRules({}).catch(() => ({ rules: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } })),
      ]);
      
      setProviders(Array.isArray(providersData) ? providersData : []);
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
    loadData();
  }, [loadData]);

  // Handlery dla przycisków
  const handleAddProvider = () => {
    toast('Funkcjonalność dodawania providera - w rozwoju', { icon: '🚧' });
  };

  const handleAddModel = () => {
    toast('Funkcjonalność dodawania modelu - w rozwoju', { icon: '🚧' });
  };

  const handleAddRule = () => {
    toast('Funkcjonalność dodawania reguł - w rozwoju', { icon: '🚧' });
  };

  const handleEdit = (type: string, id: string) => {
    toast(`Edycja ${type} (ID: ${id}) - funkcjonalność w rozwoju`, { icon: '🚧' });
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
                            onClick={() => handleEdit('model', model.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => handleDelete('model', model.id)}
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
    </div>
  );
}