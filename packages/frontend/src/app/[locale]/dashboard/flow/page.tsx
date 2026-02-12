'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Zap, List, Clock, CheckCircle, XCircle, Play, RefreshCw,
  Settings, FileText, Sparkles, Trash2, Plus,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

interface FlowItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  status: string;
  suggestions?: FlowSuggestion[];
  processedAt?: string;
  createdAt: string;
}

interface FlowSuggestion {
  id: string;
  type: string;
  confidence: number;
  description: string;
  accepted?: boolean;
}

interface FlowRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  isActive: boolean;
  priority: number;
}

interface FlowHistory {
  id: string;
  itemId: string;
  itemType: string;
  action: string;
  result: string;
  executedAt: string;
}

export default function FlowEnginePage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'awaiting' | 'rules' | 'history'>('queue');
  const [pendingItems, setPendingItems] = useState<FlowItem[]>([]);
  const [awaitingItems, setAwaitingItems] = useState<FlowItem[]>([]);
  const [rules, setRules] = useState<FlowRule[]>([]);
  const [history, setHistory] = useState<FlowHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger: 'on_create',
    action: 'ZAPLANUJ',
    priority: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, awaitingRes, rulesRes, historyRes] = await Promise.all([
        apiClient.get('/flow/pending', { params: { limit: 50 } }).catch(() => ({ data: { items: [] } })),
        apiClient.get('/flow/awaiting', { params: { limit: 50 } }).catch(() => ({ data: { items: [] } })),
        apiClient.get('/flow/rules').catch(() => ({ data: { rules: [] } })),
        apiClient.get('/flow/history', { params: { limit: 50 } }).catch(() => ({ data: { history: [] } })),
      ]);

      setPendingItems(pendingRes.data?.data || pendingRes.data?.items || []);
      setAwaitingItems(awaitingRes.data?.data || awaitingRes.data?.items || []);
      setRules(rulesRes.data?.data || rulesRes.data?.rules || []);
      setHistory(historyRes.data?.data || historyRes.data?.history || []);
    } catch (error) {
      console.error('Failed to load flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processItem = async (itemId: string) => {
    setProcessing(itemId);
    try {
      await apiClient.post(`/flow/process/${itemId}`);
      toast.success('Item processed successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Processing failed');
    } finally {
      setProcessing(null);
    }
  };

  const confirmSuggestion = async (itemId: string, action: string, accepted: boolean) => {
    try {
      if (accepted) {
        await apiClient.post(`/flow/confirm/${itemId}`, { action, reason: 'Approved from Flow Engine' });
        toast.success('Akcja zatwierdzona');
      } else {
        await apiClient.post(`/flow/confirm/${itemId}`, { action: 'USUN', reason: 'Odrzucone z Flow Engine' });
        toast.success('Sugestia odrzucona');
      }
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie potwierdzic');
    }
  };

  const processAll = async () => {
    if (!confirm('Process all pending items?')) return;
    try {
      const itemIds = pendingItems.map(i => i.id);
      await apiClient.post('/flow/process-batch', { itemIds });
      toast.success('Batch processing started');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Batch processing failed');
    }
  };

  const createRule = async () => {
    try {
      await apiClient.post('/flow/rules', {
        name: newRule.name,
        description: newRule.description,
        conditions: { trigger: newRule.trigger },
        action: newRule.action,
        priority: newRule.priority,
      });
      toast.success('Regula utworzona');
      setShowRuleForm(false);
      setNewRule({ name: '', description: '', trigger: 'on_create', action: 'ZAPLANUJ', priority: 1 });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await apiClient.delete(`/flow/rules/${ruleId}`);
      toast.success('Rule deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete rule');
    }
  };

  const toggleRuleActive = async (rule: FlowRule) => {
    try {
      await apiClient.put(`/flow/rules/${rule.id}`, { isActive: !rule.isActive });
      toast.success(`Rule ${rule.isActive ? 'disabled' : 'enabled'}`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update rule');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'awaiting_confirmation': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';
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
        title="Flow Engine"
        subtitle="Przetwarzanie i automatyzacja napedzana AI"
        icon={Zap}
        iconColor="text-indigo-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Flow Engine' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <List className="w-5 h-5" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{pendingItems.length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Awaiting</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{awaitingItems.length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Active Rules</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{rules.filter(r => r.isActive).length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Processed Today</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{history.filter(h => h.result === 'success').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 font-medium ${activeTab === 'queue' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <List className="w-5 h-5 inline mr-2" />
          Queue ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('awaiting')}
          className={`px-4 py-2 font-medium ${activeTab === 'awaiting' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Clock className="w-5 h-5 inline mr-2" />
          Awaiting ({awaitingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-medium ${activeTab === 'rules' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Settings className="w-5 h-5 inline mr-2" />
          Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <FileText className="w-5 h-5 inline mr-2" />
          History
        </button>
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Processing Queue</h2>
            {pendingItems.length > 0 && (
              <button
                onClick={processAll}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Play className="w-5 h-5" />
                Process All
              </button>
            )}
          </div>

          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="p-4 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                      {item.type}
                    </span>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h3>
                      {item.content && <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">{item.content}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => processItem(item.id)}
                    disabled={processing === item.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                  >
                    {processing === item.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Process
                  </button>
                </div>
              </div>
            ))}
            {pendingItems.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No items in queue</p>
            )}
          </div>
        </div>
      )}

      {/* Awaiting Tab */}
      {activeTab === 'awaiting' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Awaiting Confirmation</h2>
          <div className="space-y-3">
            {awaitingItems.map((item) => (
              <div key={item.id} className="p-4 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>{item.type}</span>
                    <h3 className="font-medium mt-1 text-slate-900 dark:text-slate-100">{item.title}</h3>
                  </div>
                </div>
                {(item as any).suggestedAction && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sugestia AI:</p>
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{(item as any).suggestedAction}</span>
                        {(item as any).aiReasoning && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{(item as any).aiReasoning}</p>
                        )}
                        {(item as any).aiConfidence != null && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">{Math.round((item as any).aiConfidence * 100)}% pewnosci</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmSuggestion(item.id, (item as any).suggestedAction, true)}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                          title="Zatwierdz"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => confirmSuggestion(item.id, (item as any).suggestedAction, false)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Odrzuc"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {awaitingItems.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No items awaiting confirmation</p>
            )}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Automation Rules</h2>
            <button
              onClick={() => setShowRuleForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="w-5 h-5" />
              Add Rule
            </button>
          </div>

          {showRuleForm && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <h3 className="font-medium mb-4 text-slate-900 dark:text-slate-100">New Rule</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Rule Name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <select
                  value={newRule.trigger}
                  onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="on_create">On Create</option>
                  <option value="on_update">On Update</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="manual">Manual</option>
                </select>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="ZROB_TERAZ">Zrob teraz</option>
                  <option value="ZAPLANUJ">Zaplanuj</option>
                  <option value="PROJEKT">Projekt</option>
                  <option value="KIEDYS_MOZE">Kiedys/moze</option>
                  <option value="REFERENCJA">Referencja</option>
                  <option value="USUN">Usun</option>
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={createRule} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                <button onClick={() => setShowRuleForm(false)} className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{rule.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{rule.description || 'No description'}</p>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400">Trigger: {rule.trigger} - Priority: {rule.priority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRuleActive(rule)}
                      className={`px-3 py-1 text-sm rounded-lg ${rule.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => deleteRule(rule.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No rules configured</p>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Processing History</h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="p-3 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {entry.result === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{entry.itemType} - {entry.itemId}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(entry.executedAt).toLocaleString()}</span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No history yet</p>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
