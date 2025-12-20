'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Cog,
  Play,
  Pause,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Mail,
  Bot,
  Bell,
  GitBranch,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import unifiedRulesApi, { UnifiedRule, UnifiedRulesStats } from '@/lib/api/unifiedRules';
import UniversalRuleForm from '@/components/rules/UniversalRuleForm';

// Mapowanie typów reguł na ikony i kolory
const ruleTypeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  'PROCESSING': { icon: Cog, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Przetwarzanie' },
  'EMAIL_FILTER': { icon: Mail, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Filtr Email' },
  'AUTO_REPLY': { icon: ArrowRight, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Auto-odpowiedź' },
  'AI_RULE': { icon: Bot, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Reguła AI' },
  'SMART_MAILBOX': { icon: Mail, color: 'text-pink-600', bgColor: 'bg-pink-100', label: 'Smart Mailbox' },
  'WORKFLOW': { icon: GitBranch, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Workflow' },
  'NOTIFICATION': { icon: Bell, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Powiadomienie' },
  'INTEGRATION': { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Integracja' },
  'STREAM_ROUTING': { icon: TrendingUp, color: 'text-cyan-600', bgColor: 'bg-cyan-100', label: 'Routing Streamu' }
};

interface StreamRulesPanelProps {
  onCreateRule?: () => void;
  compact?: boolean;
}

export function StreamRulesPanel({ onCreateRule, compact = false }: StreamRulesPanelProps) {
  const [rules, setRules] = useState<UnifiedRule[]>([]);
  const [stats, setStats] = useState<UnifiedRulesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<UnifiedRule | null>(null);

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedType !== 'ALL') params.type = selectedType;
      params.limit = compact ? 5 : 20;

      const [rulesResponse, statsResponse] = await Promise.all([
        unifiedRulesApi.getUnifiedRules(params),
        unifiedRulesApi.getUnifiedRulesStats()
      ]);

      setRules(rulesResponse.rules);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      setActionLoading(ruleId);
      await unifiedRulesApi.toggleUnifiedRule(ruleId);
      await loadData();
      toast.success('Status reguły zmieniony');
    } catch (error) {
      toast.error('Nie udało się zmienić statusu');
    } finally {
      setActionLoading(null);
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      setActionLoading(ruleId);
      await unifiedRulesApi.executeUnifiedRule(ruleId, {
        entityType: 'manual',
        entityId: 'test',
        triggerData: {}
      });
      await loadData();
      toast.success('Reguła wykonana');
    } catch (error) {
      toast.error('Nie udało się wykonać reguły');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć regułę "${ruleName}"?`)) return;

    try {
      setActionLoading(ruleId);
      await unifiedRulesApi.deleteUnifiedRule(ruleId);
      await loadData();
      toast.success('Reguła usunięta');
    } catch (error) {
      toast.error('Nie udało się usunąć reguły');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRule = async (ruleData: any) => {
    try {
      await unifiedRulesApi.createUnifiedRule(ruleData);
      setShowCreateModal(false);
      await loadData();
      toast.success('Reguła utworzona');
    } catch (error) {
      toast.error('Nie udało się utworzyć reguły');
      throw error;
    }
  };

  const handleEditRule = async (ruleData: any) => {
    if (!editingRule) return;
    try {
      await unifiedRulesApi.updateUnifiedRule(editingRule.id, ruleData);
      setShowEditModal(false);
      setEditingRule(null);
      await loadData();
      toast.success('Reguła zaktualizowana');
    } catch (error) {
      toast.error('Nie udało się zaktualizować reguły');
      throw error;
    }
  };

  const openEditModal = (rule: UnifiedRule) => {
    setEditingRule(rule);
    setShowEditModal(true);
  };

  const getRuleConfig = (ruleType: string) => {
    return ruleTypeConfig[ruleType] || ruleTypeConfig['PROCESSING'];
  };

  // Compact view for sidebar
  if (compact) {
    return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              Aktywne reguły
            </span>
            {stats && (
              <Badge variant="secondary">{stats.activeRules}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : rules.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Brak aktywnych reguł
            </p>
          ) : (
            <>
              {rules.slice(0, 5).map((rule) => {
                const config = getRuleConfig(rule.ruleType);
                const Icon = config.icon;
                return (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className={`p-1 rounded ${config.bgColor}`}>
                      <Icon className={`h-3 w-3 ${config.color}`} />
                    </div>
                    <span className="flex-1 truncate">{rule.name}</span>
                    <Badge
                      variant={rule.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {rule.status === 'ACTIVE' ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                );
              })}
              {(onCreateRule || !compact) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nowa reguła
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Modal - also in compact view */}
      {showCreateModal && (
        <UniversalRuleForm
          onSubmit={handleCreateRule}
          onCancel={() => setShowCreateModal(false)}
          isEditing={false}
        />
      )}
    </>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Wszystkie</p>
                  <p className="text-2xl font-bold">{stats.totalRules}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktywne</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeRules}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Wykonań 24h</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.executions24h}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sukces</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Szukaj reguły..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="ALL">Wszystkie typy</option>
                <option value="AI_RULE">Reguły AI</option>
                <option value="WORKFLOW">Workflow</option>
                <option value="PROCESSING">Przetwarzanie</option>
                <option value="EMAIL_FILTER">Filtry Email</option>
                <option value="NOTIFICATION">Powiadomienia</option>
              </select>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nowa reguła
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <LoadingSpinner text="Ładowanie reguł..." />
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Cog className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Brak reguł</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm ? 'Nie znaleziono reguł pasujących do wyszukiwania' : 'Stwórz pierwszą regułę automatyzacji'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Utwórz regułę
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => {
            const config = getRuleConfig(rule.ruleType);
            const Icon = config.icon;
            const isLoading = actionLoading === rule.id;

            return (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{rule.name}</CardTitle>
                        <p className="text-xs text-gray-500">{config.label}</p>
                      </div>
                    </div>
                    <Badge
                      variant={rule.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={rule.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {rule.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {rule.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {rule.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="text-center p-1 bg-gray-50 rounded">
                      <p className="text-gray-500">Wykonań</p>
                      <p className="font-medium">{rule.executionCount}</p>
                    </div>
                    <div className="text-center p-1 bg-green-50 rounded">
                      <p className="text-gray-500">Sukces</p>
                      <p className="font-medium text-green-600">{rule.successCount}</p>
                    </div>
                    <div className="text-center p-1 bg-red-50 rounded">
                      <p className="text-gray-500">Błędy</p>
                      <p className="font-medium text-red-600">{rule.errorCount}</p>
                    </div>
                  </div>

                  {rule.lastExecuted && (
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(rule.lastExecuted).toLocaleString('pl-PL')}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRule(rule.id)}
                      disabled={isLoading}
                      className="flex-1 text-xs h-8"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : rule.status === 'ACTIVE' ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Wyłącz
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Włącz
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeRule(rule.id)}
                      disabled={isLoading || rule.status !== 'ACTIVE'}
                      className="text-xs h-8"
                      title="Wykonaj"
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(rule)}
                      disabled={isLoading}
                      className="text-xs h-8"
                      title="Edytuj"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id, rule.name)}
                      disabled={isLoading}
                      className="text-xs h-8 text-red-600 hover:text-red-700"
                      title="Usuń"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info about automation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Inteligentna automatyzacja</h3>
              <p className="text-sm text-gray-700">
                Reguły mogą automatycznie proponować klasyfikację i akcje.
                Sugestie pojawią się w panelu AI do zatwierdzenia (Human-in-the-Loop).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <UniversalRuleForm
          onSubmit={handleCreateRule}
          onCancel={() => setShowCreateModal(false)}
          isEditing={false}
        />
      )}

      {/* Edit Rule Modal */}
      {showEditModal && editingRule && (
        <UniversalRuleForm
          onSubmit={handleEditRule}
          onCancel={() => {
            setShowEditModal(false);
            setEditingRule(null);
          }}
          initialData={editingRule}
          isEditing={true}
        />
      )}
    </div>
  );
}

export default StreamRulesPanel;
