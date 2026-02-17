'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { aiRulesApi, AIRule, RulesFilters } from '@/lib/api/aiRules';
import AIRuleForm from '@/components/ai/AIRuleForm';
import { DomainListManager } from '@/components/ai-rules/DomainListManager';
import { AIPromptsPanel } from '@/components/ai/AIPromptsPanel';
import { AIProviderConfig } from '@/components/ai/AIProviderConfig';
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
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
  Lightbulb,
  Zap,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Filter,
  Tag,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { AIActionConfigPanel } from '@/components/ai/AIActionConfigPanel';
import { AISuggestionsManager } from '@/components/ai/AISuggestionsManager';
import { CategoryManager } from '@/components/ai/CategoryManager';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

// --- Types ---

type TabType = 'rules' | 'suggestions' | 'domains' | 'prompts' | 'config' | 'actions' | 'categories';

// --- Constants ---

const mainTabs: { id: TabType; name: string; icon: React.ElementType }[] = [
  { id: 'rules', name: 'Reguly', icon: Sparkles },
  { id: 'suggestions', name: 'Sugestie AI', icon: Lightbulb },
  { id: 'domains', name: 'Listy domen', icon: ShieldAlert },
  { id: 'prompts', name: 'Prompty', icon: FileText },
  { id: 'config', name: 'Konfiguracja', icon: Settings },
  { id: 'actions', name: 'Akcje AI', icon: Zap },
  { id: 'categories', name: 'Kategorie', icon: Tag },
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams?.get('tab') as TabType) || 'rules'
  );

  // AI Suggestions
  const { suggestions, accept: acceptSuggestion, reject: rejectSuggestion, loadSuggestions } = useAiSuggestions();

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

  // Search, sort, and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'priority' | 'name' | 'executionCount' | 'successRate'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterDataType, setFilterDataType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const filteredRules = React.useMemo(() => {
    let result = [...rules];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus === 'active') result = result.filter(r => r.enabled);
    if (filterStatus === 'inactive') result = result.filter(r => !r.enabled);

    // DataType filter
    if (filterDataType !== 'all') result = result.filter(r => r.dataType === filterDataType);

    // Category filter
    if (filterCategory !== 'all') result = result.filter(r => r.category === filterCategory);

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'priority': cmp = (a.priority || 0) - (b.priority || 0); break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'executionCount': cmp = (a.executionCount || 0) - (b.executionCount || 0); break;
        case 'successRate': cmp = (a.successRate || 0) - (b.successRate || 0); break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [rules, searchQuery, filterStatus, filterDataType, filterCategory, sortField, sortDirection]);

  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    filterStatus !== 'all' ? 1 : 0,
    filterDataType !== 'all' ? 1 : 0,
    filterCategory !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDataType('all');
    setFilterCategory('all');
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const resp = await apiClient.post('/ai-rules/seed-triage');
                    const d = resp.data;
                    toast.success(d.message || `Utworzono ${d.data?.created} regul triage`);
                    loadRules(1, 20, activeModuleTab);
                  } catch {
                    toast.error('Blad podczas seedowania regul triage');
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors"
              >
                <Zap className="w-5 h-5" />
                <span>Seed Triage</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nowa regula</span>
              </button>
            </div>
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

      {/* Pending suggestions badge — prompts user to check Sugestie AI tab */}
      {suggestions.length > 0 && activeTab !== 'suggestions' && (
        <button
          onClick={() => setActiveTab('suggestions')}
          className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/50 dark:border-purple-700/30 rounded-xl hover:from-purple-100/80 hover:to-indigo-100/80 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {suggestions.length} {suggestions.length === 1 ? 'sugestia' : suggestions.length < 5 ? 'sugestie' : 'sugestii'} AI oczekuje na Twoja decyzje
            </span>
          </div>
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Przejdz do sugestii →
          </span>
        </button>
      )}

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

            {/* Search, Sort & Filters Toolbar */}
            <div className="mt-4 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Szukaj reguly..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Status: Wszystkie</option>
                  <option value="active">Aktywne</option>
                  <option value="inactive">Nieaktywne</option>
                </select>

                {/* DataType Filter */}
                <select
                  value={filterDataType}
                  onChange={e => setFilterDataType(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Typ: Wszystkie</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="ALL">ALL</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Kategoria: Wszystkie</option>
                  <option value="CLASSIFICATION">CLASSIFICATION</option>
                  <option value="ROUTING">ROUTING</option>
                  <option value="EXTRACTION">EXTRACTION</option>
                  <option value="INDEXING">INDEXING</option>
                  <option value="FLOW_ANALYSIS">FLOW_ANALYSIS</option>
                </select>

                {/* Active filter badge + clear */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Wyczysc ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Sort buttons */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-1">Sortuj:</span>
                {([
                  { field: 'priority' as const, label: 'Priorytet' },
                  { field: 'name' as const, label: 'Nazwa' },
                  { field: 'executionCount' as const, label: 'Wykonania' },
                  { field: 'successRate' as const, label: '% sukcesu' },
                ]).map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => toggleSort(field)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                      sortField === field
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {label}
                    {sortField === field && (
                      sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                    )}
                  </button>
                ))}
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
                                <h3
                                  onClick={() => router.push(`/dashboard/ai-rules/${rule.id}`)}
                                  className="text-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                                >
                                  {rule.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  {rule.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mt-3">
                              {rule.category && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  rule.category === 'FLOW_ANALYSIS'
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    : rule.category === 'CLASSIFICATION'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                  {rule.category}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                {rule.dataType || 'ALL'}
                              </span>
                              {rule.aiModelName && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  {rule.aiModelName}
                                </span>
                              )}
                              {rule.isSystem && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                  <ShieldAlert className="w-3 h-3 mr-1" /> Systemowa
                                </span>
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Wykonana {rule.executionCount || 0} razy -{' '}
                                {rule.successRate || 0}% sukces
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
                              onClick={() => router.push(`/dashboard/ai-rules/${rule.id}`)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="Edytuj regule"
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
                            {rule.aiModelName && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                  Model AI:
                                </h4>
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  {rule.aiModelName}
                                </span>
                              </div>
                            )}
                            {rule.aiPrompt && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                  Prompt AI:
                                </h4>
                                <pre className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                                  {rule.aiPrompt}
                                </pre>
                              </div>
                            )}
                            {rule.aiSystemPrompt && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                  Prompt systemowy:
                                </h4>
                                <pre className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                                  {rule.aiSystemPrompt}
                                </pre>
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

        {/* === SUGGESTIONS TAB === */}
        {activeTab === 'suggestions' && <AISuggestionsManager />}

        {/* === PROMPTS TAB === */}
        {activeTab === 'prompts' && <AIPromptsPanel />}

        {/* === CONFIG TAB === */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <Link
              href="/dashboard/admin/pipeline-config"
              className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Konfiguracja Pipeline Emaili &mdash; klasyfikacje, post-akcje, progi</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            <AIProviderConfig />
          </div>
        )}

        {/* === ACTIONS TAB === */}
        {activeTab === 'actions' && <AIActionConfigPanel />}

        {/* === CATEGORIES TAB === */}
        {activeTab === 'categories' && <CategoryManager />}
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
