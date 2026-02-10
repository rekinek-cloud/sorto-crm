'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  BoltIcon,
  QueueListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  SparklesIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';

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
      const res = await apiClient.post(`/flow/process/${itemId}`);
      toast.success('Item processed successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Processing failed');
    } finally {
      setProcessing(null);
    }
  };

  const confirmSuggestion = async (itemId: string, suggestionId: string, accepted: boolean) => {
    try {
      await apiClient.post(`/flow/confirm/${itemId}`, { suggestionId, accepted });
      toast.success(accepted ? 'Suggestion accepted' : 'Suggestion rejected');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to confirm suggestion');
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
        ...newRule,
        conditions: [],
        actions: [],
        isActive: true,
      });
      toast.success('Rule created');
      setShowRuleForm(false);
      setNewRule({ name: '', description: '', trigger: 'on_create', priority: 1 });
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
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'awaiting_confirmation': return 'text-amber-600 bg-amber-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BoltIcon className="w-8 h-8 text-indigo-600" />
          Flow Engine
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          AI-powered GTD processing and automation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-amber-600">
            <QueueListIcon className="w-5 h-5" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold mt-1">{pendingItems.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-blue-600">
            <ClockIcon className="w-5 h-5" />
            <span className="text-sm">Awaiting</span>
          </div>
          <p className="text-2xl font-bold mt-1">{awaitingItems.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-indigo-600">
            <Cog6ToothIcon className="w-5 h-5" />
            <span className="text-sm">Active Rules</span>
          </div>
          <p className="text-2xl font-bold mt-1">{rules.filter(r => r.isActive).length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm">Processed Today</span>
          </div>
          <p className="text-2xl font-bold mt-1">{history.filter(h => h.result === 'success').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 font-medium ${activeTab === 'queue' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          <QueueListIcon className="w-5 h-5 inline mr-2" />
          Queue ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('awaiting')}
          className={`px-4 py-2 font-medium ${activeTab === 'awaiting' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          <ClockIcon className="w-5 h-5 inline mr-2" />
          Awaiting ({awaitingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-medium ${activeTab === 'rules' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          <Cog6ToothIcon className="w-5 h-5 inline mr-2" />
          Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          <DocumentTextIcon className="w-5 h-5 inline mr-2" />
          History
        </button>
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Processing Queue</h2>
            {pendingItems.length > 0 && (
              <button
                onClick={processAll}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlayIcon className="w-5 h-5" />
                Process All
              </button>
            )}
          </div>

          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                      {item.type}
                    </span>
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      {item.content && <p className="text-sm text-gray-500 truncate max-w-md">{item.content}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => processItem(item.id)}
                    disabled={processing === item.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                  >
                    {processing === item.id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                    Process
                  </button>
                </div>
              </div>
            ))}
            {pendingItems.length === 0 && (
              <p className="text-center text-gray-500 py-8">No items in queue</p>
            )}
          </div>
        </div>
      )}

      {/* Awaiting Tab */}
      {activeTab === 'awaiting' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Awaiting Confirmation</h2>
          <div className="space-y-3">
            {awaitingItems.map((item) => (
              <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>{item.type}</span>
                    <h3 className="font-medium mt-1">{item.title}</h3>
                  </div>
                </div>
                {item.suggestions && item.suggestions.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600">AI Suggestions:</p>
                    {item.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <span className="text-sm font-medium">{suggestion.type}</span>
                          <p className="text-xs text-gray-500">{suggestion.description}</p>
                          <span className="text-xs text-indigo-600">{Math.round(suggestion.confidence * 100)}% confidence</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmSuggestion(item.id, suggestion.id, true)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => confirmSuggestion(item.id, suggestion.id, false)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {awaitingItems.length === 0 && (
              <p className="text-center text-gray-500 py-8">No items awaiting confirmation</p>
            )}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Automation Rules</h2>
            <button
              onClick={() => setShowRuleForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="w-5 h-5" />
              Add Rule
            </button>
          </div>

          {showRuleForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium mb-4">New Rule</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Rule Name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <select
                  value={newRule.trigger}
                  onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="on_create">On Create</option>
                  <option value="on_update">On Update</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="manual">Manual</option>
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="col-span-2 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={createRule} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                <button onClick={() => setShowRuleForm(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{rule.name}</h3>
                    <p className="text-sm text-gray-500">{rule.description || 'No description'}</p>
                    <span className="text-xs text-indigo-600">Trigger: {rule.trigger} • Priority: {rule.priority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRuleActive(rule)}
                      className={`px-3 py-1 text-sm rounded-lg ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => deleteRule(rule.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-center text-gray-500 py-8">No rules configured</p>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Processing History</h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {entry.result === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-gray-500">{entry.itemType} • {entry.itemId}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(entry.executedAt).toLocaleString()}</span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-gray-500 py-8">No history yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
