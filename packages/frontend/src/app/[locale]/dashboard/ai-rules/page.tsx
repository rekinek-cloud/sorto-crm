'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { aiRulesApi, AIRule, RulesFilters } from '@/lib/api/aiRules';
import AIRuleForm from '@/components/ai/AIRuleForm';
import { DomainListManager } from '@/components/ai-rules/DomainListManager';
import { AIPromptsPanel } from '@/components/ai/AIPromptsPanel';
import { AIProviderConfig } from '@/components/ai/AIProviderConfig';
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Settings,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Folder,
  CheckSquare,
  DollarSign,
  User,
  Mail,
  FileText,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

// --- Types ---

type TabType = 'rules' | 'domains' | 'prompts' | 'config';

// --- Constants ---

const mainTabs: { id: TabType; name: string; icon: React.ElementType }[] = [
  { id: 'rules', name: 'Reguly', icon: Sparkles },
  { id: 'domains', name: 'Listy domen', icon: ShieldAlert },
  { id: 'prompts', name: 'Prompty', icon: FileText },
  { id: 'config', name: 'Konfiguracja', icon: Settings },
];

const modules = [
  { value: 'projects', label: 'Projekty', icon: Folder },
  { value: 'tasks', label: 'Zadania', icon: CheckSquare },
  { value: 'deals', label: 'Deale', icon: DollarSign },
  { value: 'contacts', label: 'Kontakty', icon: User },
  { value: 'communication', label: 'Komunikacja', icon: Mail },
];

const operators = [
  { value: 'equals', label: 'Rowna sie' },
  { value: 'not_equals', label: 'Nie rowna sie' },
  { value: 'contains', label: 'Zawiera' },
  { value: 'not_contains', label: 'Nie zawiera' },
  { value: 'greater_than', label: 'Wieksze niz' },
  { value: 'less_than', label: 'Mniejsze niz' },
  { value: 'is_empty', label: 'Jest puste' },
  { value: 'is_not_empty', label: 'Nie jest puste' },
];

const actionTypes = [
  { value: 'ai-analysis', label: 'Analiza AI', icon: Sparkles },
  { value: 'add-tag', label: 'Dodaj tag', icon: Settings },
  { value: 'send-notification', label: 'Wyslij powiadomienie', icon: Mail },
  { value: 'create-task', label: 'Utworz zadanie', icon: CheckSquare },
  { value: 'update-status', label: 'Zaktualizuj status', icon: Pencil },
  { value: 'custom-webhook', label: 'Custom webhook', icon: Settings },
];

const moduleTabIcons: Record<string, React.ElementType> = {
  all: Sparkles,
  projects: Folder,
  tasks: CheckSquare,
  deals: DollarSign,
  contacts: User,
  communication: Mail,
};

// --- Helpers ---

/**
 * Normalize rule data from backend to expected frontend format.
 * System rules use object-style actions/conditions, user rules use arrays.
 */
function normalizeRule(rule: any): AIRule {
  // Normalize conditions: backend may return { operator, conditions: [...] } or array
  let conditions: any[] = [];
  if (Array.isArray(rule.conditions)) {
    conditions = rule.conditions;
  } else if (rule.conditions?.conditions && Array.isArray(rule.conditions.conditions)) {
    const op = rule.conditions.operator || 'AND';
    conditions = rule.conditions.conditions.map((c: any, i: number) => ({
      id: c.id || `cond-${i}`,
      field: c.field || '',
      operator: c.operator || 'equals',
      value: c.value || '',
      logicalOperator: i > 0 ? op : undefined,
    }));
  }

  // Normalize actions: backend may return object or array
  let actions: any[] = [];
  if (Array.isArray(rule.actions)) {
    actions = rule.actions;
  } else if (rule.actions && typeof rule.actions === 'object') {
    const obj = rule.actions;
    if (obj.forceClassification) {
      actions.push({
        id: 'sys-classify',
        type: 'update-status',
        config: { label: `Klasyfikacja: ${obj.forceClassification}` },
      });
    }
    if (obj.rag?.enabled) {
      actions.push({ id: 'sys-rag', type: 'ai-analysis', config: { label: 'Indeksuj w RAG' } });
    }
    if (obj.flow?.enabled) {
      actions.push({ id: 'sys-flow', type: 'create-task', config: { label: 'Dodaj do Flow' } });
    }
    if (obj.list) {
      actions.push({
        id: 'sys-list',
        type: 'add-tag',
        config: { label: `Lista: ${obj.list.action} (${obj.list.target})` },
      });
    }
    if (obj.notify?.enabled) {
      actions.push({ id: 'sys-notify', type: 'send-notification', config: { label: 'Powiadom' } });
    }
  }

  return { ...rule, conditions, actions };
}

// --- Component ---

export default function AIRulesPage() {
  // Main tab from URL
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams?.get('tab') as TabType) || 'rules'
  );

  // Rules state
  const [rules, setRules] = useState<AIRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AIRule | null>(null);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [activeModuleTab, setActiveModuleTab] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // --- Rules data loading ---

  useEffect(() => {
    loadRules(1, 20, 'all');
  }, []);

  const loadRules = useCallback(
    async (page: number = 1, limit: number = 20, module: string = 'all') => {
      setIsLoading(true);
      try {
        const filters: RulesFilters = { page, limit };
        if (module !== 'all') {
          filters.module = module;
        }
        const { rules: loadedRules, pagination: paginationData } =
          await aiRulesApi.getRules(filters);
        setRules(loadedRules.map(normalizeRule));
        setPagination(paginationData);
      } catch (error: any) {
        toast.error('Blad podczas ladowania regul');
        logger.apiError('/ai/rules', error, 'AIRulesPage');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await aiRulesApi.toggleRule(ruleId, enabled);
      setRules((prev) =>
        prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
      );
      toast.success(enabled ? 'Regula wlaczona' : 'Regula wylaczona');
    } catch (error: any) {
      toast.error('Blad podczas zmiany statusu reguly');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Czy na pewno chcesz usunac te regule?')) return;
    try {
      await aiRulesApi.deleteRule(ruleId);
      setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
      toast.success('Regula zostala usunieta');
    } catch (error: any) {
      toast.error('Blad podczas usuwania reguly');
    }
  };

  const toggleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  useEffect(() => {
    const module = activeModuleTab !== 'all' ? activeModuleTab : selectedModule;
    loadRules(1, 20, module);
    setSelectedModule(module);
  }, [activeModuleTab, selectedModule, loadRules]);

  const filteredRules = rules;

  const moduleTabs = [
    { id: 'all', name: 'Wszystkie', color: 'slate', count: rules.length },
    {
      id: 'projects',
      name: 'Projekty',
      color: 'blue',
      count: rules.filter((r) => r.module === 'projects').length,
    },
    {
      id: 'tasks',
      name: 'Zadania',
      color: 'green',
      count: rules.filter((r) => r.module === 'tasks').length,
    },
    {
      id: 'deals',
      name: 'Deale',
      color: 'yellow',
      count: rules.filter((r) => r.module === 'deals').length,
    },
    {
      id: 'contacts',
      name: 'Kontakty',
      color: 'purple',
      count: rules.filter((r) => r.module === 'contacts').length,
    },
    {
      id: 'communication',
      name: 'Komunikacja',
      color: 'indigo',
      count: rules.filter((r) => r.module === 'communication').length,
    },
  ];

  // --- Render ---

  return (
    <PageShell>
      <PageHeader
        title="Konfiguracja AI"
        subtitle="Reguly, listy domen, prompty i providerzy AI"
        icon={Sparkles}
        iconColor="text-purple-600"
        actions={
          activeTab === 'rules' ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nowa regula</span>
            </button>
          ) : undefined
        }
      />

      {/* Stats - always visible */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Wszystkie reguly
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {rules.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Aktywne
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {rules.filter((r) => r.enabled).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Wykonania dzis
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {rules.length > 0
                  ? rules.reduce(
                      (sum, r) =>
                        sum +
                        (r.lastExecuted ===
                        new Date().toISOString().split('T')[0]
                          ? 1
                          : 0),
                      0
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Settings className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Avg. sukces
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {rules.length > 0
                  ? Math.round(
                      rules.reduce((sum, r) => sum + r.successRate, 0) /
                        rules.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="mt-6">
        <div className="flex gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl p-1.5 overflow-x-auto">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* === RULES TAB === */}
        {activeTab === 'rules' && (
          <>
            {/* Module Sub-Tabs */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-700">
                <nav
                  className="flex bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl overflow-x-auto"
                  aria-label="AI Rule Modules"
                >
                  {moduleTabs.map((tab) => {
                    const TabIcon = moduleTabIcons[tab.id] || Sparkles;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveModuleTab(tab.id)}
                        className={`
                          flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200
                          ${
                            activeModuleTab === tab.id
                              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                          }
                        `}
                        style={{ minWidth: '120px' }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <TabIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">{tab.name}</span>
                          <span
                            className={`
                            inline-flex items-center justify-center w-5 h-5 text-xs rounded-full
                            ${
                              activeModuleTab === tab.id
                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }
                          `}
                          >
                            {tab.count}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Active Module Tab Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const TabIcon =
                        moduleTabIcons[activeModuleTab] || Sparkles;
                      return (
                        <TabIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      );
                    })()}
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        {moduleTabs.find((t) => t.id === activeModuleTab)?.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {activeModuleTab === 'all'
                          ? `Wszystkie reguly AI w systemie (${rules.length})`
                          : `Reguly AI dla modulu ${moduleTabs.find((t) => t.id === activeModuleTab)?.name} (${moduleTabs.find((t) => t.id === activeModuleTab)?.count || 0})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`
                      inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                      ${
                        rules.filter((r) => r.enabled).length > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }
                    `}
                    >
                      {rules.filter((r) => r.enabled).length} aktywnych
                    </span>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      {rules.length > 0
                        ? Math.round(
                            rules.reduce((sum, r) => sum + r.successRate, 0) /
                              rules.length
                          )
                        : 0}
                      % sukces
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rules List */}
            <div className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredRules.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
                  <Sparkles className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Brak regul
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {selectedModule === 'all'
                      ? 'Utworz pierwsza regule AI dla automatyzacji procesow'
                      : `Brak regul dla modulu ${modules.find((m) => m.value === selectedModule)?.label}`}
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Utworz pierwsza regule
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRules.map((rule) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleExpanded(rule.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                {expandedRules.has(rule.id) ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </button>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                  {rule.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  {rule.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {(() => {
                                  const mod = modules.find(
                                    (m) => m.value === rule.module
                                  );
                                  const ModIcon = mod?.icon || Sparkles;
                                  return (
                                    <ModIcon className="w-3 h-3 mr-1 inline" />
                                  );
                                })()}
                                {
                                  modules.find((m) => m.value === rule.module)
                                    ?.label
                                }
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  rule.trigger === 'automatic'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : rule.trigger === 'manual'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}
                              >
                                {rule.trigger === 'automatic'
                                  ? 'Automatyczna'
                                  : rule.trigger === 'manual'
                                    ? 'Reczna'
                                    : 'Oba'}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Wykonana {rule.executionCount} razy -{' '}
                                {rule.successRate}% sukces
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) =>
                                  toggleRule(rule.id, e.target.checked)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                            <button
                              onClick={() => setEditingRule(rule)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {expandedRules.has(rule.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                                  Warunki uruchomienia:
                                </h4>
                                <div className="space-y-2">
                                  {rule.conditions.map((condition, index) => (
                                    <div key={condition.id} className="text-sm">
                                      {index > 0 &&
                                        condition.logicalOperator && (
                                          <span className="text-purple-600 dark:text-purple-400 font-medium mr-2">
                                            {condition.logicalOperator}
                                          </span>
                                        )}
                                      <span className="text-slate-600 dark:text-slate-400">
                                        {condition.field}{' '}
                                        {
                                          operators.find(
                                            (op) =>
                                              op.value === condition.operator
                                          )?.label
                                        }{' '}
                                        &quot;{condition.value}&quot;
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                                  Akcje do wykonania:
                                </h4>
                                <div className="space-y-2">
                                  {rule.actions.map((action) => {
                                    const at = actionTypes.find(
                                      (at) => at.value === action.type
                                    );
                                    const ActionIcon = at?.icon || Sparkles;
                                    return (
                                      <div
                                        key={action.id}
                                        className="flex items-center space-x-2 text-sm"
                                      >
                                        <ActionIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                          {action.config?.label || at?.label || action.type}
                                        </span>
                                        {action.type === 'ai-analysis' &&
                                          action.config.modelId && (
                                            <span className="text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded">
                                              {action.config.modelId}
                                            </span>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            {rule.aiPrompt && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                  Prompt AI:
                                </h4>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                  {(Array.isArray(rule.actions) && rule.actions.find(
                                    (a: any) => a.type === 'ai-analysis'
                                  )?.config?.prompt) || rule.aiPrompt}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* === DOMAINS TAB === */}
        {activeTab === 'domains' && <DomainListManager />}

        {/* === PROMPTS TAB === */}
        {activeTab === 'prompts' && <AIPromptsPanel />}

        {/* === CONFIG TAB === */}
        {activeTab === 'config' && <AIProviderConfig />}
      </div>

      {/* AIRuleForm modal */}
      {(isCreateModalOpen || editingRule) && (
        <AIRuleForm
          key={editingRule?.id || 'new'}
          rule={editingRule || undefined}
          onSubmit={(rule) => {
            logger.userAction('AI rule submitted', { rule }, 'AIRulesPage');
            const normalized = normalizeRule(rule);
            if (editingRule) {
              setRules((prev) =>
                prev.map((r) => (r.id === normalized.id ? normalized : r))
              );
            } else {
              setRules((prev) => [normalized, ...prev]);
            }
            setIsCreateModalOpen(false);
            setEditingRule(null);
          }}
          onCancel={() => {
            logger.debug(
              'AI rule form cancelled',
              undefined,
              'AIRulesPage'
            );
            setIsCreateModalOpen(false);
            setEditingRule(null);
          }}
        />
      )}
    </PageShell>
  );
}
