'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { aiRulesApi, AIRule, RulesFilters } from '@/lib/api/aiRules';
import AIRuleForm from '@/components/ai/AIRuleForm';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Typy zostały przeniesione do api/aiRules.ts

const modules = [
  { value: 'projects', label: 'Projekty', icon: '📁' },
  { value: 'tasks', label: 'Zadania', icon: '✅' },
  { value: 'deals', label: 'Deale', icon: '💰' },
  { value: 'contacts', label: 'Kontakty', icon: '👤' },
  { value: 'communication', label: 'Komunikacja', icon: '📧' },
];

const operators = [
  { value: 'equals', label: 'Równa się' },
  { value: 'not_equals', label: 'Nie równa się' },
  { value: 'contains', label: 'Zawiera' },
  { value: 'not_contains', label: 'Nie zawiera' },
  { value: 'greater_than', label: 'Większe niż' },
  { value: 'less_than', label: 'Mniejsze niż' },
  { value: 'is_empty', label: 'Jest puste' },
  { value: 'is_not_empty', label: 'Nie jest puste' },
];

const actionTypes = [
  { value: 'ai-analysis', label: 'Analiza AI', icon: '🤖' },
  { value: 'add-tag', label: 'Dodaj tag', icon: '🏷️' },
  { value: 'send-notification', label: 'Wyślij powiadomienie', icon: '🔔' },
  { value: 'create-task', label: 'Utwórz zadanie', icon: '✅' },
  { value: 'update-status', label: 'Zaktualizuj status', icon: '📝' },
  { value: 'custom-webhook', label: 'Custom webhook', icon: '🔗' },
];

export default function AIRulesPage() {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AIRule | null>(null);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Initial load on component mount
  useEffect(() => {
    loadRules(1, 20, 'all');
  }, []); // Empty dependency array - only run on mount

  const loadRules = useCallback(async (page: number = 1, limit: number = 20, module: string = 'all') => {
    setIsLoading(true);
    try {
      const filters: RulesFilters = {
        page,
        limit
      };
      
      if (module !== 'all') {
        filters.module = module;
      }

      const { rules: loadedRules, pagination: paginationData } = await aiRulesApi.getRules(filters);
      
      setRules(loadedRules);
      setPagination(paginationData);
    } catch (error: any) {
      toast.error('Błąd podczas ładowania reguł');
      logger.apiError('/ai/rules', error, 'AIRulesPage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await aiRulesApi.toggleRule(ruleId, enabled);
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      ));
      toast.success(enabled ? 'Reguła włączona' : 'Reguła wyłączona');
    } catch (error: any) {
      toast.error('Błąd podczas zmiany statusu reguły');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę regułę?')) return;
    
    try {
      await aiRulesApi.deleteRule(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success('Reguła została usunięta');
    } catch (error: any) {
      toast.error('Błąd podczas usuwania reguły');
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

  // Reload when module changes
  useEffect(() => {
    const module = activeTab !== 'all' ? activeTab : selectedModule;
    loadRules(1, 20, module); // Reset to page 1 when module changes
    setSelectedModule(module); // Keep selectedModule in sync for backwards compatibility
  }, [activeTab, selectedModule, loadRules]);

  const filteredRules = rules; // Filtrowanie jest już w API

  // Module tabs for navigation
  const moduleTabs = [
    { id: 'all', name: 'Wszystkie', icon: '🤖', color: 'gray', count: rules.length },
    { id: 'projects', name: 'Projekty', icon: '📁', color: 'blue', count: rules.filter(r => r.module === 'projects').length },
    { id: 'tasks', name: 'Zadania', icon: '✅', color: 'green', count: rules.filter(r => r.module === 'tasks').length },
    { id: 'deals', name: 'Deale', icon: '💰', color: 'yellow', count: rules.filter(r => r.module === 'deals').length },
    { id: 'contacts', name: 'Kontakty', icon: '👤', color: 'purple', count: rules.filter(r => r.module === 'contacts').length },
    { id: 'communication', name: 'Komunikacja', icon: '📧', color: 'indigo', count: rules.filter(r => r.module === 'communication').length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reguły AI</h1>
          <p className="text-gray-600">
            Zarządzaj regułami automatycznej analizy AI dla różnych modułów aplikacji
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ai-rules/domain-lists"
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShieldExclamationIcon className="w-5 h-5" />
            <span>Listy domen</span>
          </Link>
          {/* New Rule Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nowa reguła</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wszystkie reguły</p>
              <p className="text-2xl font-semibold text-gray-900">{rules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktywne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules.filter(r => r.enabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wykonania dziś</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules.length > 0 ? rules.reduce((sum, r) => sum + (r.lastExecuted === new Date().toISOString().split('T')[0] ? 1 : 0), 0) : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Cog6ToothIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. sukces</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules.length > 0 ? Math.round(rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex bg-gray-50 rounded-t-lg overflow-x-auto" aria-label="AI Rule Modules">
            {moduleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                style={{
                  minWidth: '120px'
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className={`
                    inline-flex items-center justify-center w-5 h-5 text-xs rounded-full
                    ${activeTab === tab.id 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Active Tab Info */}
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {moduleTabs.find(t => t.id === activeTab)?.icon}
              </span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {moduleTabs.find(t => t.id === activeTab)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeTab === 'all' 
                    ? `Wszystkie reguły AI w systemie (${rules.length})`
                    : `Reguły AI dla modułu ${moduleTabs.find(t => t.id === activeTab)?.name} (${moduleTabs.find(t => t.id === activeTab)?.count || 0})`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`
                inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                ${rules.filter(r => r.enabled).length > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {rules.filter(r => r.enabled).length} aktywnych
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                {rules.length > 0 ? Math.round(rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length) : 0}% sukces
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak reguł</h3>
          <p className="text-gray-600 mb-6">
            {selectedModule === 'all' 
              ? 'Utwórz pierwszą regułę AI dla automatyzacji procesów'
              : `Brak reguł dla modułu ${modules.find(m => m.value === selectedModule)?.label}`
            }
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Utwórz pierwszą regułę
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Rule Header */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpanded(rule.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedRules.has(rule.id) ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {modules.find(m => m.value === rule.module)?.icon} {modules.find(m => m.value === rule.module)?.label}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.trigger === 'automatic' 
                          ? 'bg-green-100 text-green-800' 
                          : rule.trigger === 'manual'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {rule.trigger === 'automatic' ? '🔄 Automatyczna' : 
                         rule.trigger === 'manual' ? '👆 Ręczna' : '🔀 Oba'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Wykonana {rule.executionCount} razy • {rule.successRate}% sukces
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => toggleRule(rule.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>

                    {/* Actions */}
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRules.has(rule.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Conditions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Warunki uruchomienia:</h4>
                        <div className="space-y-2">
                          {rule.conditions.map((condition, index) => (
                            <div key={condition.id} className="text-sm">
                              {index > 0 && condition.logicalOperator && (
                                <span className="text-purple-600 font-medium mr-2">
                                  {condition.logicalOperator}
                                </span>
                              )}
                              <span className="text-gray-600">
                                {condition.field} {operators.find(op => op.value === condition.operator)?.label} "{condition.value}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Akcje do wykonania:</h4>
                        <div className="space-y-2">
                          {rule.actions.map((action) => (
                            <div key={action.id} className="flex items-center space-x-2 text-sm">
                              <span>
                                {actionTypes.find(at => at.value === action.type)?.icon}
                              </span>
                              <span className="text-gray-600">
                                {actionTypes.find(at => at.value === action.type)?.label}
                              </span>
                              {action.type === 'ai-analysis' && action.config.modelId && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                  {action.config.modelId}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Prompt */}
                    {rule.aiPrompt && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Prompt AI:</h4>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 font-mono">
                          {rule.actions.find(a => a.type === 'ai-analysis')?.config.prompt || rule.aiPrompt}
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

      {/* Rule Creation/Edit Modal */}
      {(isCreateModalOpen || editingRule) && (
        <AIRuleForm
          key={editingRule?.id || 'new'} // Force re-mount when editing different rule
          rule={editingRule || undefined}
          onSubmit={(rule) => {
            logger.userAction('AI rule submitted', { rule }, 'AIRulesPage');
            if (editingRule) {
              // Update existing rule in list
              setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
            } else {
              // Add new rule to list
              setRules(prev => [rule, ...prev]);
            }
            setIsCreateModalOpen(false);
            setEditingRule(null);
          }}
          onCancel={() => {
            logger.debug('AI rule form cancelled', undefined, 'AIRulesPage');
            setIsCreateModalOpen(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}