'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Filter,
  Search,
  Settings,
  BarChart3,
  RefreshCw,
  Eye,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import unifiedRulesApi, { UnifiedRule, UnifiedRulesStats } from '@/lib/api/unifiedRules';
import UniversalRuleForm from '@/components/rules/UniversalRuleForm';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';


const RulesManager: React.FC = () => {
  const [rules, setRules] = useState<UnifiedRule[]>([]);
  const [stats, setStats] = useState<UnifiedRulesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<UnifiedRule | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    loadRules();
    loadStats();
  }, [searchTerm, selectedType, selectedStatus, activeTab]);

  const loadRules = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;

      const typeFilter = activeTab !== 'ALL' ? activeTab : selectedType;
      if (typeFilter !== 'ALL') params.type = typeFilter;

      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const response = await unifiedRulesApi.getUnifiedRules(params);
      setRules(response.rules);
    } catch (error: any) {
      console.error('Failed to load rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await unifiedRulesApi.getUnifiedRulesStats();
      setStats(response);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setStats(null);
    }
  };

  const toggleRuleStatus = async (ruleId: string) => {
    try {
      await unifiedRulesApi.toggleUnifiedRule(ruleId);
      loadRules();
      loadStats();
    } catch (error: any) {
      console.error('Failed to toggle rule status:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę regułę?')) return;

    try {
      await unifiedRulesApi.deleteUnifiedRule(ruleId);
      loadRules();
      loadStats();
    } catch (error: any) {
      console.error('Failed to delete rule:', error);
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      const result = await unifiedRulesApi.executeUnifiedRule(ruleId, {
        entityType: 'test',
        entityId: 'manual-execution',
        triggerData: {}
      });
      console.log('Rule executed:', result);
      loadRules();
      loadStats();
    } catch (error: any) {
      console.error('Failed to execute rule:', error);
    }
  };

  const editRule = (rule: UnifiedRule) => {
    setEditingRule(rule);
    setShowEditModal(true);
  };

  const copyRule = async (rule: UnifiedRule) => {
    try {
      const copyNumber = rules.filter(r => r.name.includes(rule.name)).length;
      const copyName = copyNumber > 1 ?
        `${rule.name} (kopia ${copyNumber})` :
        `${rule.name} (kopia)`;

      const copiedRule = {
        ...rule,
        name: copyName,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        lastExecutedAt: undefined,
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
        isActive: false,
        conditions: rule.conditions,
        actions: rule.actions,
        triggerType: rule.triggerType,
        ruleType: rule.ruleType,
        description: rule.description,
        priority: rule.priority
      };

      setEditingRule(copiedRule as unknown as UnifiedRule);
      setShowEditModal(true);

      toast.success(`Skopiowano regułę "${rule.name}". Możesz teraz edytować kopię.`);
    } catch (error: any) {
      console.error('Failed to copy rule:', error);
      toast.error('Nie udało się skopiować reguły');
    }
  };

  const getRuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PROCESSING': 'blue',
      'EMAIL_FILTER': 'green',
      'AUTO_REPLY': 'purple',
      'AI_RULE': 'orange',
      'SMART_MAILBOX': 'pink',
      'WORKFLOW': 'indigo',
      'NOTIFICATION': 'red',
      'INTEGRATION': 'yellow'
    };
    return colors[type] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ACTIVE': 'green',
      'INACTIVE': 'gray',
      'DRAFT': 'yellow',
      'TESTING': 'blue',
      'ERROR': 'red',
      'DEPRECATED': 'orange'
    };
    return colors[status] || 'gray';
  };

  const ruleTypeTabs = [
    { id: 'ALL', name: 'Wszystkie', icon: Settings, color: 'slate', count: stats?.totalRules || 0 },
    { id: 'PROCESSING', name: 'Przetwarzanie', icon: Settings, color: 'blue', count: rules.filter(r => r.ruleType === 'PROCESSING').length },
    { id: 'EMAIL_FILTER', name: 'Filtry Email', icon: Filter, color: 'green', count: rules.filter(r => r.ruleType === 'EMAIL_FILTER').length },
    { id: 'AUTO_REPLY', name: 'Auto-odpowiedzi', icon: RefreshCw, color: 'purple', count: rules.filter(r => r.ruleType === 'AUTO_REPLY').length },
    { id: 'AI_RULE', name: 'Reguły AI', icon: BarChart3, color: 'orange', count: rules.filter(r => r.ruleType === 'AI_RULE').length },
    { id: 'SMART_MAILBOX', name: 'Smart Mailbox', icon: Filter, color: 'pink', count: rules.filter(r => r.ruleType === 'SMART_MAILBOX').length },
    { id: 'WORKFLOW', name: 'Workflow', icon: RefreshCw, color: 'indigo', count: rules.filter(r => r.ruleType === 'WORKFLOW').length },
    { id: 'NOTIFICATION', name: 'Powiadomienia', icon: Eye, color: 'red', count: rules.filter(r => r.ruleType === 'NOTIFICATION').length },
    { id: 'INTEGRATION', name: 'Integracje', icon: Settings, color: 'yellow', count: rules.filter(r => r.ruleType === 'INTEGRATION').length }
  ];

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Smart Automation"
        subtitle="Inteligentny system automatyzacji procesów biznesowych"
        icon={Settings}
        iconColor="text-blue-600"
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nowa Reguła
          </Button>
        }
      />

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie reguły</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalRules}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aktywne</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeRules}</p>
              </div>
              <Play className="h-8 w-8 text-green-400 dark:text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nieaktywne</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.inactiveRules}</p>
              </div>
              <Pause className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wykonania 24h</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.executions24h}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-400 dark:text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sukces</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.successRate.toFixed(1)}%</p>
              </div>
              <Settings className="h-8 w-8 text-green-400 dark:text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Rules Type Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm mb-6">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex bg-slate-50 dark:bg-slate-800 rounded-t-2xl overflow-x-auto" aria-label="Rule Types">
            {ruleTypeTabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                    }
                  `}
                  style={{ minWidth: '140px' }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <TabIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className={`
                      inline-flex items-center justify-center w-5 h-5 text-xs rounded-full
                      ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }
                    `}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Tab Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {(() => {
                const tabData = ruleTypeTabs.find(t => t.id === activeTab);
                const TabIcon = tabData?.icon || Settings;
                return <TabIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />;
              })()}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {ruleTypeTabs.find(t => t.id === activeTab)?.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {activeTab === 'ALL'
                    ? `Wszystkie reguły w systemie (${stats?.totalRules || 0})`
                    : `Reguły typu ${activeTab} (${ruleTypeTabs.find(t => t.id === activeTab)?.count || 0})`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`
                inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                ${stats?.activeRules && stats.activeRules > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }
              `}>
                {stats?.activeRules || 0} aktywnych
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {stats?.executions24h || 0} wykonań (24h)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="flex items-center gap-2 text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
          <Filter className="h-5 w-5" />
          Filtry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Wyszukaj
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nazwa lub opis reguły..."
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Wszystkie statusy</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="TESTING">TESTING</option>
              <option value="ERROR">ERROR</option>
              <option value="DEPRECATED">DEPRECATED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {rule.name}
                  <Badge
                    variant={rule.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={`text-xs bg-${getStatusColor(rule.status)}-100 text-${getStatusColor(rule.status)}-800 dark:bg-${getStatusColor(rule.status)}-900/30 dark:text-${getStatusColor(rule.status)}-400`}
                  >
                    {rule.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  {rule.description || 'Brak opisu'}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 border-${getRuleTypeColor(rule.ruleType)}-200 text-${getRuleTypeColor(rule.ruleType)}-700 dark:text-${getRuleTypeColor(rule.ruleType)}-400`}
                  >
                    {rule.ruleType}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-slate-600 dark:text-slate-400">
                    {rule.triggerType}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-purple-600 dark:text-purple-400">
                    P: {rule.priority}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Wykonania</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{rule.executionCount || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Sukces</p>
                  <p className="font-medium text-green-600 dark:text-green-400">{rule.successCount || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Błędy</p>
                  <p className="font-medium text-red-600 dark:text-red-400">{rule.errorCount || 0}</p>
                </div>
              </div>

              {rule.lastExecuted && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Ostatnio: {new Date(rule.lastExecuted).toLocaleString('pl-PL')}
                </div>
              )}

              <div className="flex justify-end flex-wrap gap-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeRule(rule.id)}
                  disabled={rule.status !== 'ACTIVE'}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                >
                  <Play className="h-3 w-3" />
                  Wykonaj
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleRuleStatus(rule.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                >
                  {rule.status === 'ACTIVE' ? (
                    <>
                      <Pause className="h-3 w-3" />
                      Wyłącz
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Włącz
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editRule(rule)}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                >
                  <Pencil className="h-3 w-3" />
                  Edytuj
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyRule(rule)}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  title="Utwórz kopię tej reguły"
                >
                  <Copy className="h-3 w-3" />
                  Kopiuj
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteRule(rule.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                  Usuń
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {rules.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-8 text-center">
          <Settings className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Brak reguł
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Nie znaleziono reguł spełniających kryteria wyszukiwania.'
              : 'Rozpocznij automatyzację tworząc pierwszą regułę.'}
          </p>
          {(!searchTerm && selectedType === 'ALL' && selectedStatus === 'ALL') && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Utwórz pierwszą regułę
            </Button>
          )}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <UniversalRuleForm
          onSubmit={async (ruleData) => {
            try {
              await unifiedRulesApi.createUnifiedRule(ruleData);
              setShowCreateModal(false);
              loadRules();
              loadStats();
            } catch (error: any) {
              console.error('Failed to create rule:', error);
              throw error;
            }
          }}
          onCancel={() => setShowCreateModal(false)}
          isEditing={false}
        />
      )}

      {/* Edit Rule Modal */}
      {showEditModal && editingRule && (
        <UniversalRuleForm
          onSubmit={async (ruleData) => {
            try {
              if (!editingRule.id) {
                await unifiedRulesApi.createUnifiedRule(ruleData);
                toast.success(`Kopia reguły "${ruleData.name}" została utworzona`);
              } else {
                await unifiedRulesApi.updateUnifiedRule(editingRule.id, ruleData);
                toast.success(`Reguła "${ruleData.name}" została zaktualizowana`);
              }
              setShowEditModal(false);
              setEditingRule(null);
              loadRules();
              loadStats();
            } catch (error: any) {
              console.error('Failed to save rule:', error);
              throw error;
            }
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingRule(null);
          }}
          initialData={editingRule}
          isEditing={!!editingRule.id}
        />
      )}
    </PageShell>
  );
};

export default RulesManager;
