'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import {
  Plus,
  Settings,
  Sparkles,
  Server,
  Zap,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

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
      icon: Server,
      description: 'Zarządzaj providerami AI i konfiguracją API',
    },
    {
      name: 'Modele AI',
      icon: Zap,
      description: 'Konfiguruj dostępne modele i ich parametry',
    },
    {
      name: 'Reguły AI',
      icon: Sparkles,
      description: 'Twórz i zarządzaj regułami automatyzacji AI',
    },
    {
      name: 'Auto-Replies',
      icon: Plus,
      description: 'Automatyczne odpowiedzi z AI i prostą logiką',
    },
    {
      name: 'Statystyki',
      icon: BarChart3,
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
    <PageShell>
      <PageHeader
        title="Zarządzanie AI"
        subtitle="Centralne zarządzanie systemem sztucznej inteligencji"
        icon={SlidersHorizontal}
        iconColor="text-purple-600"
      />

      {/* Tabs Navigation */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-slate-900/20 dark:bg-slate-700/50 p-1 mb-8">
          {tabs.map((tab, index) => {
            const TabIcon = tab.icon;
            return (
              <Tab
                key={index}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/[0.12] hover:text-slate-900 dark:hover:text-white'
                  )
                }
              >
                <div className="flex items-center space-x-2">
                  <TabIcon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            );
          })}
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
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Providerzy AI</h2>
                  <p className="text-slate-600 dark:text-slate-400">Zarządzaj konfiguracją providerów AI</p>
                </div>
                <button
                  onClick={handleAddProvider}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
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
                    <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
                      Brak providerów AI. Dodaj pierwszego providera.
                    </div>
                  ) : (
                    providers.map((provider) => (
                      <div key={provider.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{provider.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            provider.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {provider.enabled ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{provider.authType}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit('providera', provider.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => handleDelete('providera', provider.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
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
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Modele AI</h2>
                  <p className="text-slate-600 dark:text-slate-400">Konfiguruj dostępne modele AI</p>
                </div>
                <button
                  onClick={handleAddModel}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
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
                    <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
                      Brak modeli AI. Dodaj pierwszy model.
                    </div>
                  ) : (
                    models.map((model) => (
                      <div key={model.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{model.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            model.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {model.enabled ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Provider: {model.provider}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Model: {model.modelId}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit('model', model.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => handleDelete('model', model.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
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
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reguły AI</h2>
                  <p className="text-slate-600 dark:text-slate-400">Zarządzaj regułami automatyzacji AI</p>
                </div>
                <button
                  onClick={handleAddRule}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nowa Reguła</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{rule.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {rule.enabled ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{rule.description}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Moduł: {rule.module}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit('reguły', rule.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleToggle('reguły', rule.id)}
                        className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm"
                      >
                        {rule.enabled ? 'Wyłącz' : 'Włącz'}
                      </button>
                      <button
                        onClick={() => handleDelete('reguły', rule.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
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
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Automatyczne Odpowiedzi</h2>
                  <p className="text-slate-600 dark:text-slate-400">Zarządzaj automatycznymi odpowiedziami z AI i prostą logiką</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>Nowa Auto-Reply</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAutoReplies.map((autoReply) => (
                  <div key={autoReply.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{autoReply.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          autoReply.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {autoReply.enabled ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          autoReply.triggerType === 'ai-enhanced' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {autoReply.triggerType === 'ai-enhanced' ? 'AI' : 'Prosta'}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Wysłane: {autoReply.sentCount} razy</p>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">Edytuj</button>
                      <button className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm">
                        {autoReply.enabled ? 'Wyłącz' : 'Włącz'}
                      </button>
                      <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">Usuń</button>
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
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Statystyki AI</h2>
                <p className="text-slate-600 dark:text-slate-400">Monitoruj użycie i wydajność systemów AI</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Aktywne Providerzy</h3>
                  <p className="text-3xl font-bold text-blue-600">{providers.filter(p => p.enabled).length}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">z {providers.length} total</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Aktywne Modele</h3>
                  <p className="text-3xl font-bold text-green-600">{models.filter(m => m.enabled).length}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">z {models.length} total</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Aktywne Reguły</h3>
                  <p className="text-3xl font-bold text-purple-600">{rules.filter(r => r.enabled).length}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">z {rules.length} total</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Auto-Replies</h3>
                  <p className="text-3xl font-bold text-orange-600">{mockAutoReplies.filter(ar => ar.enabled).length}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">z {mockAutoReplies.length} total</p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                    AI: {mockAutoReplies.filter(ar => ar.triggerType === 'ai-enhanced').length}
                  </p>
                </div>
              </div>
            </motion.div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </PageShell>
  );
}
