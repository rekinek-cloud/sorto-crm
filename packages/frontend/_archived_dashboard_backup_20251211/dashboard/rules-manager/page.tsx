'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  CogIcon,
  ChartBarIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import unifiedRulesApi, { UnifiedRule, UnifiedRulesStats } from '@/lib/api/unifiedRules';
import UniversalRuleForm from '@/components/rules/UniversalRuleForm';


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

  // Load data
  useEffect(() => {
    loadRules();
    loadStats();
  }, [searchTerm, selectedType, selectedStatus, activeTab]);

  const loadRules = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      
      // Use activeTab for type filtering instead of selectedType
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
      // Generate a unique name for the copy
      const copyNumber = rules.filter(r => r.name.includes(rule.name)).length;
      const copyName = copyNumber > 1 ? 
        `${rule.name} (kopia ${copyNumber})` : 
        `${rule.name} (kopia)`;

      // Create a copy of the rule with modified name and reset fields
      const copiedRule = {
        ...rule,
        name: copyName,
        id: undefined, // Remove ID so it creates a new rule
        createdAt: undefined,
        updatedAt: undefined,
        lastExecutedAt: undefined,
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
        isActive: false, // Start as inactive for safety
        // Preserve all the configuration but reset execution stats
        conditions: rule.conditions,
        actions: rule.actions,
        triggerType: rule.triggerType,
        ruleType: rule.ruleType,
        description: rule.description,
        priority: rule.priority
      };

      // Open edit modal with the copied rule
      setEditingRule(copiedRule as unknown as UnifiedRule);
      setShowEditModal(true);
      
      toast.success(`📋 Skopiowano regułę "${rule.name}". Możesz teraz edytować kopię.`);
    } catch (error: any) {
      console.error('Failed to copy rule:', error);
      toast.error('Nie udało się skopiować reguły');
    }
  };

  const getRuleTypeColor = (type: string) => {
    const colors = {
      'PROCESSING': 'blue',
      'EMAIL_FILTER': 'green',
      'AUTO_REPLY': 'purple',
      'AI_RULE': 'orange',
      'SMART_MAILBOX': 'pink',
      'WORKFLOW': 'indigo',
      'NOTIFICATION': 'red',
      'INTEGRATION': 'yellow'
    };
    return colors[type as keyof typeof colors] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'ACTIVE': 'green',
      'INACTIVE': 'gray',
      'DRAFT': 'yellow',
      'TESTING': 'blue',
      'ERROR': 'red',
      'DEPRECATED': 'orange'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  // Rule types for tabs
  const ruleTypeTabs = [
    { id: 'ALL', name: 'Wszystkie', icon: '📋', color: 'gray', count: stats?.totalRules || 0 },
    { id: 'PROCESSING', name: 'Przetwarzanie', icon: '⚙️', color: 'blue', count: rules.filter(r => r.ruleType === 'PROCESSING').length },
    { id: 'EMAIL_FILTER', name: 'Filtry Email', icon: '📧', color: 'green', count: rules.filter(r => r.ruleType === 'EMAIL_FILTER').length },
    { id: 'AUTO_REPLY', name: 'Auto-odpowiedzi', icon: '🤖', color: 'purple', count: rules.filter(r => r.ruleType === 'AUTO_REPLY').length },
    { id: 'AI_RULE', name: 'Reguły AI', icon: '🧠', color: 'orange', count: rules.filter(r => r.ruleType === 'AI_RULE').length },
    { id: 'SMART_MAILBOX', name: 'Smart Mailbox', icon: '📬', color: 'pink', count: rules.filter(r => r.ruleType === 'SMART_MAILBOX').length },
    { id: 'WORKFLOW', name: 'Workflow', icon: '🔄', color: 'indigo', count: rules.filter(r => r.ruleType === 'WORKFLOW').length },
    { id: 'NOTIFICATION', name: 'Powiadomienia', icon: '🔔', color: 'red', count: rules.filter(r => r.ruleType === 'NOTIFICATION').length },
    { id: 'INTEGRATION', name: 'Integracje', icon: '🔌', color: 'yellow', count: rules.filter(r => r.ruleType === 'INTEGRATION').length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ⚙️ Smart Automation
          </h1>
          <p className="text-gray-600 mt-1">
            Inteligentny system automatyzacji procesów biznesowych
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Nowa Reguła
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wszystkie reguły</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRules}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktywne</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeRules}</p>
                </div>
                <PlayIcon className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nieaktywne</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactiveRules}</p>
                </div>
                <PauseIcon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wykonania 24h</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.executions24h}</p>
                </div>
                <ArrowPathIcon className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sukces</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p>
                </div>
                <CogIcon className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex bg-gray-50 rounded-t-lg overflow-x-auto" aria-label="Rule Types">
            {ruleTypeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                style={{
                  minWidth: '140px'
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className={`
                    inline-flex items-center justify-center w-5 h-5 text-xs rounded-full
                    ${activeTab === tab.id 
                      ? 'bg-blue-100 text-blue-600' 
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
                {ruleTypeTabs.find(t => t.id === activeTab)?.icon}
              </span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {ruleTypeTabs.find(t => t.id === activeTab)?.name}
                </h3>
                <p className="text-sm text-gray-600">
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
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {stats?.activeRules || 0} aktywnych
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {stats?.executions24h || 0} wykonań (24h)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wyszukaj
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nazwa lub opis reguły..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
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
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-1 text-base">
                    {rule.name}
                    <Badge 
                      variant={rule.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={`text-xs bg-${getStatusColor(rule.status)}-100 text-${getStatusColor(rule.status)}-800`}
                    >
                      {rule.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-gray-600 mb-2">
                    {rule.description || 'Brak opisu'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge 
                      variant="outline"
                      className={`text-xs px-2 py-0.5 border-${getRuleTypeColor(rule.ruleType)}-200 text-${getRuleTypeColor(rule.ruleType)}-700`}
                    >
                      {rule.ruleType}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-600">
                      {rule.triggerType}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-purple-600">
                      P: {rule.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="space-y-2">
                {/* Rule Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Wykonania</p>
                    <p className="font-medium">{rule.executionCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sukces</p>
                    <p className="font-medium text-green-600">{rule.successCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Błędy</p>
                    <p className="font-medium text-red-600">{rule.errorCount || 0}</p>
                  </div>
                </div>

                {/* Last Execution */}
                {rule.lastExecuted && (
                  <div className="text-xs text-gray-500">
                    Ostatnio: {new Date(rule.lastExecuted).toLocaleString('pl-PL')}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end flex-wrap gap-1 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeRule(rule.id)}
                    disabled={rule.status !== 'ACTIVE'}
                    className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                  >
                    <PlayIcon className="h-3 w-3" />
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
                        <PauseIcon className="h-3 w-3" />
                        Wyłącz
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-3 w-3" />
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
                    <PencilIcon className="h-3 w-3" />
                    Edytuj
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyRule(rule)}
                    className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-blue-600 hover:text-blue-700"
                    title="Utwórz kopię tej reguły"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3" />
                    Kopiuj
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Usuń
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {rules.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Brak reguł
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL'
                ? 'Nie znaleziono reguł spełniających kryteria wyszukiwania.'
                : 'Rozpocznij automatyzację tworząc pierwszą regułę.'}
            </p>
            {(!searchTerm && selectedType === 'ALL' && selectedStatus === 'ALL') && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Utwórz pierwszą regułę
              </Button>
            )}
          </CardContent>
        </Card>
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
              // If editingRule has no ID, it's a copy - create new rule
              if (!editingRule.id) {
                await unifiedRulesApi.createUnifiedRule(ruleData);
                toast.success(`✅ Kopia reguły "${ruleData.name}" została utworzona`);
              } else {
                await unifiedRulesApi.updateUnifiedRule(editingRule.id, ruleData);
                toast.success(`✅ Reguła "${ruleData.name}" została zaktualizowana`);
              }
              setShowEditModal(false);
              setEditingRule(null);
              loadRules();
              loadStats();
            } catch (error: any) {
              console.error('Failed to save rule:', error);
              toast.error('Nie udało się zapisać reguły');
              throw error;
            }
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingRule(null);
          }}
          initialData={editingRule}
          isEditing={!!editingRule.id} // True only if rule has ID (editing), false for copying
        />
      )}

    </div>
  );
};

export default RulesManager;