'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Filter,
  Sparkles,
  ShieldCheck,
  Tag,
  Zap,
  Plus,
  Trash2,
  Pencil,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Database,
  Workflow,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Cookies from 'js-cookie';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

const GLASS_CARD = 'bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm';

interface PipelineStats {
  period: string;
  summary: {
    totalMessages: number;
    spamRejected: number;
    skippedAI: number;
    aiAnalyzed: number;
    pipelineProcessed: number;
    aiSavingsPercent: number;
  };
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

interface PipelineRule {
  id: string;
  name: string;
  description: string;
  category: string; // stage: PRE_FILTER, CLASSIFY, AI_ANALYSIS
  priority: number;
  conditions: { rules: any[] };
  actions: { actions: any[]; stopProcessing: boolean };
  status: string;
  createdAt: string;
}

interface TestResult {
  stage: string;
  action: string;
  isSpam: boolean;
  skipAI: boolean;
  category?: string;
  priority: string;
  rulesExecuted: string[];
  wouldRunAI: boolean;
  processingTimeMs: number;
}

interface MessageItem {
  id: string;
  subject: string;
  fromAddress: string;
  fromName?: string;
  receivedAt: string;
  pipelineProcessed: boolean;
  isSpam: boolean;
  category?: string;
  priority: string;
  aiAnalyzed: boolean;
  sentiment?: string;
  pipelineResult?: {
    classification?: string;
    confidence?: number;
    addedToRag?: boolean;
    addedToFlow?: boolean;
  };
}

interface MessagesStats {
  total: number;
  unprocessed: number;
  processed: number;
}

interface CategoryCounts {
  [key: string]: number;
}

interface ProcessingResult {
  processed: number;
  total: number;
  spam: number;
  skippedAI: number;
  aiAnalyzed: number;
  categoryStats: Record<string, number>;
  processingTimeMs: number;
  avgTimePerMessage: number;
  remaining: number;
}

const STAGES = [
  {
    id: 'PRE_FILTER',
    name: 'Pre-Filter',
    description: 'Szybkie reguły bez AI - blacklist, spam, cold emails',
    icon: ShieldCheck,
    color: 'red'
  },
  {
    id: 'CLASSIFY',
    name: 'Klasyfikacja',
    description: 'Kategoryzacja i decyzja czy uruchomić AI',
    icon: Tag,
    color: 'yellow'
  },
  {
    id: 'AI_ANALYSIS',
    name: 'Analiza AI',
    description: 'Reguły uruchamiane po analizie AI',
    icon: Sparkles,
    color: 'purple'
  }
];

export default function EmailPipelinePage() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [rules, setRules] = useState<PipelineRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string>('all');

  // Test modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState({ from: '', subject: '', body: '' });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PipelineRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    stage: 'PRE_FILTER',
    priority: 50,
    conditions: [] as any[],
    actions: [] as any[],
    stopProcessing: false
  });

  const [seeding, setSeeding] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'rules' | 'processing'>('rules');

  // Bulk processing state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesStats, setMessagesStats] = useState<MessagesStats | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({});
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesFilter, setMessagesFilter] = useState<'all' | 'unprocessed' | 'processed'>('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('receivedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [skipAIForBulk, setSkipAIForBulk] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'processing') {
      fetchMessages();
    }
  }, [activeTab, messagesPage, messagesFilter, classificationFilter, sortBy, sortDir, searchQuery]);

  const fetchMessages = async () => {
    const token = Cookies.get('access_token');
    if (!token) return;

    try {
      const params = new URLSearchParams({
        page: String(messagesPage),
        limit: '50',
        filter: messagesFilter,
        sortBy,
        sortDir,
      });
      if (classificationFilter) params.set('classification', classificationFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/v1/email-pipeline/messages?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages || []);
        setMessagesStats(data.data.stats);
        setCategoryCounts(data.data.categoryCounts || {});
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setMessagesPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const processSelected = async () => {
    const token = Cookies.get('access_token');
    if (!token || selectedMessages.size === 0) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/v1/email-pipeline/process-batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds: Array.from(selectedMessages) })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Przetworzono ${data.data.processed} z ${data.data.processed + data.data.failed} wiadomości`);
        setSelectedMessages(new Set());
        fetchMessages();
        fetchData();
      }
    } catch (error) {
      console.error('Error processing batch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const processAll = async () => {
    const token = Cookies.get('access_token');
    if (!token) return;

    if (!confirm(`Przetworzyć wszystkie nieprzetworzne maile${skipAIForBulk ? ' (bez AI)' : ' (z AI - może być wolne)'}?`)) {
      return;
    }

    setProcessing(true);
    setProcessingResult(null);
    try {
      const res = await fetch('/api/v1/email-pipeline/process-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit: 500, skipAI: skipAIForBulk })
      });
      if (res.ok) {
        const data = await res.json();
        setProcessingResult(data.data);
        fetchMessages();
        fetchData();
      }
    } catch (error) {
      console.error('Error processing all:', error);
    } finally {
      setProcessing(false);
    }
  };

  const toggleMessageSelection = (id: string) => {
    const newSet = new Set(selectedMessages);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMessages(newSet);
  };

  const selectAllMessages = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map(m => m.id)));
    }
  };

  const fetchData = async () => {
    const token = Cookies.get('access_token');
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, rulesRes] = await Promise.all([
        fetch('/api/v1/email-pipeline/stats?days=7', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/email-pipeline/rules', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.data.rules || []);
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaults = async () => {
    const token = Cookies.get('access_token');
    if (!token) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/v1/email-pipeline/seed-defaults', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Utworzono ${data.created} domyślnych reguł`);
        fetchData();
      }
    } catch (error) {
      console.error('Error seeding defaults:', error);
    } finally {
      setSeeding(false);
    }
  };

  const testPipeline = async () => {
    const token = Cookies.get('access_token');
    if (!token) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/email-pipeline/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEmail)
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data.data.explanation);
      }
    } catch (error) {
      console.error('Error testing pipeline:', error);
    } finally {
      setTesting(false);
    }
  };

  const deleteRule = async (id: string) => {
    const token = Cookies.get('access_token');
    if (!token || !confirm('Na pewno usunąć tę regułę?')) return;
    try {
      const res = await fetch(`/api/v1/email-pipeline/rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const saveRule = async () => {
    const token = Cookies.get('access_token');
    if (!token) return;
    try {
      const url = editingRule
        ? `/api/v1/email-pipeline/rules/${editingRule.id}`
        : '/api/v1/email-pipeline/rules';
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleForm)
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingRule(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const openEditModal = (rule?: PipelineRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        description: rule.description,
        stage: rule.category,
        priority: rule.priority,
        conditions: rule.conditions?.rules || [],
        actions: rule.actions?.actions || [],
        stopProcessing: rule.actions?.stopProcessing || false
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        description: '',
        stage: 'PRE_FILTER',
        priority: 50,
        conditions: [],
        actions: [],
        stopProcessing: false
      });
    }
    setShowEditModal(true);
  };

  const filteredRules = activeStage === 'all'
    ? rules
    : rules.filter(r => r.category === activeStage);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PRE_FILTER': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'CLASSIFY': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'AI_ANALYSIS': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Email Pipeline"
        subtitle="3-etapowe przetwarzanie maili z optymalizacją kosztów AI"
        icon={Filter}
        iconColor="text-blue-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Email Pipeline' },
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowTestModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              Testuj
            </button>
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="px-4 py-2 bg-slate-600 dark:bg-slate-500 text-white rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center gap-2 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              <Zap className="w-5 h-5" />
              {seeding ? 'Tworzenie...' : 'Domyślne reguły'}
            </button>
            <button
              onClick={() => openEditModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nowa reguła
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <Mail className="w-4 h-4" />
              Wszystkie
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.summary.totalMessages}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{stats.period}</div>
          </div>
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <XCircle className="w-4 h-4" />
              Spam
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.summary.spamRejected}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">odrzucone</div>
          </div>
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <Tag className="w-4 h-4" />
              Skip AI
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.summary.skippedAI}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">bez AI</div>
          </div>
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex items-center gap-2 text-purple-500 text-sm">
              <Sparkles className="w-4 h-4" />
              AI
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.summary.aiAnalyzed}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">analizowane</div>
          </div>
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Przetworzone
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.summary.pipelineProcessed}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">przez pipeline</div>
          </div>
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex items-center gap-2 text-blue-500 text-sm">
              <BarChart3 className="w-4 h-4" />
              Oszczędności
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.summary.aiSavingsPercent}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">mniej AI</div>
          </div>
        </div>
      )}

      {/* Pipeline Stages Visualization */}
      <div className={`${GLASS_CARD} p-6 mb-6`}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Etapy Pipeline</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const stageRules = rules.filter(r => r.category === stage.id);
            return (
              <React.Fragment key={stage.id}>
                <div
                  onClick={() => setActiveStage(stage.id)}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    activeStage === stage.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <StageIcon className={`w-6 h-6 text-${stage.color}-500`} />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{stage.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStageColor(stage.id)}`}>
                      {stageRules.length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stage.description}</p>
                </div>
                {index < STAGES.length - 1 && (
                  <div className="hidden md:block text-slate-300 dark:text-slate-600">&rarr;</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'rules'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Reguły Pipeline
        </button>
        <button
          onClick={() => setActiveTab('processing')}
          className={`pb-3 px-1 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'processing'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Przetwarzanie maili
          {messagesStats && messagesStats.unprocessed > 0 && (
            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
              {messagesStats.unprocessed}
            </span>
          )}
        </button>
      </div>

      {/* TAB: Bulk Processing */}
      {activeTab === 'processing' && (
        <div className="space-y-4">
          {/* Stats */}
          {messagesStats && (
            <div className="grid grid-cols-3 gap-4">
              <div className={`${GLASS_CARD} p-4`}>
                <div className="text-slate-500 dark:text-slate-400 text-sm">Wszystkie maile</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{messagesStats.total}</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl shadow-sm p-4 border border-orange-100 dark:border-orange-800/30">
                <div className="text-orange-600 dark:text-orange-400 text-sm">Do przetworzenia</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{messagesStats.unprocessed}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl shadow-sm p-4 border border-green-100 dark:border-green-800/30">
                <div className="text-green-600 dark:text-green-400 text-sm">Przetworzono</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{messagesStats.processed}</div>
              </div>
            </div>
          )}

          {/* Classification breakdown */}
          {Object.keys(categoryCounts).length > 0 && (
            <div className={`${GLASS_CARD} p-4`}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Klasyfikacja</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => { setClassificationFilter(classificationFilter === cat ? '' : cat); setMessagesPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      classificationFilter === cat
                        ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-800'
                        : ''
                    } ${
                      cat === 'BUSINESS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      cat === 'NEWSLETTER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      cat === 'SPAM' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      cat === 'TRANSACTIONAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      cat === 'INVOICE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                      cat === 'COOPERATION' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                      cat === 'OFFER' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                      cat === 'AUTO_REPLY' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat}
                    <span className="opacity-70">{count}</span>
                  </button>
                ))}
                {classificationFilter && (
                  <button
                    onClick={() => { setClassificationFilter(''); setMessagesPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    Wyczyść filtr
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions + Search Bar */}
          <div className={`${GLASS_CARD} p-4`}>
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setMessagesPage(1); }}
                  placeholder="Szukaj po nadawcy lub temacie..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Status filter */}
              <div className="flex gap-1">
                {(['all', 'unprocessed', 'processed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setMessagesFilter(f); setMessagesPage(1); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      messagesFilter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {f === 'all' ? 'Wszystkie' : f === 'unprocessed' ? 'Nowe' : 'Przetworzone'}
                  </button>
                ))}
              </div>

              {/* Bulk actions */}
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="skipAI"
                    checked={skipAIForBulk}
                    onChange={(e) => setSkipAIForBulk(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="skipAI" className="text-xs text-slate-600 dark:text-slate-400">
                    Pomiń AI
                  </label>
                </div>
                <button
                  onClick={processAll}
                  disabled={processing || !messagesStats || messagesStats.unprocessed === 0}
                  className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium transition-colors"
                >
                  {processing ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Przetwarzanie...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Przetwórz ({messagesStats?.unprocessed || 0})</>
                  )}
                </button>
                {selectedMessages.size > 0 && (
                  <button
                    onClick={processSelected}
                    disabled={processing}
                    className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" /> Wybrane ({selectedMessages.size})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Processing Result */}
          {processingResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Wynik przetwarzania</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Przetworzono:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{processingResult.processed}/{processingResult.total}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Spam:</span>
                  <span className="ml-2 font-medium text-red-600 dark:text-red-400">{processingResult.spam}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Skip AI:</span>
                  <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400">{processingResult.skippedAI}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Czas:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{processingResult.processingTimeMs}ms ({processingResult.avgTimePerMessage}ms/mail)</span>
                </div>
              </div>
              {processingResult.remaining > 0 && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  Pozostało do przetworzenia: {processingResult.remaining}
                </p>
              )}
              {Object.keys(processingResult.categoryStats).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(processingResult.categoryStats).map(([cat, count]) => (
                    <span key={cat} className="px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Table */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                <tr>
                  <th className="w-8 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedMessages.size === messages.length && messages.length > 0}
                      onChange={selectAllMessages}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => toggleSort('fromAddress')}
                  >
                    <span className="flex items-center gap-1">Od <SortIcon field="fromAddress" /></span>
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => toggleSort('subject')}
                  >
                    <span className="flex items-center gap-1">Temat <SortIcon field="subject" /></span>
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => toggleSort('receivedAt')}
                  >
                    <span className="flex items-center gap-1">Data <SortIcon field="receivedAt" /></span>
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => toggleSort('category')}
                  >
                    <span className="flex items-center gap-1">Klasyfikacja <SortIcon field="category" /></span>
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => toggleSort('priority')}
                  >
                    <span className="flex items-center gap-1">Priorytet <SortIcon field="priority" /></span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {messages.map((msg) => {
                  const pr = msg.pipelineResult as any;
                  const classification = pr?.classification || msg.category;
                  const matchedRule = pr?.matchedRule;

                  return (
                    <tr key={msg.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedMessages.has(msg.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedMessages.has(msg.id)}
                          onChange={() => toggleMessageSelection(msg.id)}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                          {msg.fromName || msg.fromAddress}
                        </div>
                        {msg.fromName && <div className="text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-[180px]">{msg.fromAddress}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 max-w-[280px] truncate">
                        {msg.subject || '(brak tematu)'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(msg.receivedAt).toLocaleDateString('pl', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        <br />
                        <span className="text-[10px] opacity-60">
                          {new Date(msg.receivedAt).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {classification && classification !== 'INBOX' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className={`px-2 py-0.5 rounded text-xs inline-block w-fit font-medium ${
                              classification === 'BUSINESS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              classification === 'NEWSLETTER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              classification === 'SPAM' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              classification === 'TRANSACTIONAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              classification === 'INVOICE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                              classification === 'COOPERATION' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                              classification === 'OFFER' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                              classification === 'MEETING' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                              classification === 'AUTO_REPLY' ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {classification}
                            </span>
                            {matchedRule && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]" title={matchedRule}>
                                {matchedRule}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {msg.pipelineProcessed ? 'INBOX' : '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          msg.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          msg.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          msg.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {msg.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          {pr?.addedToRag && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5" title="Dodano do RAG">
                              <Database className="w-3 h-3" /> RAG
                            </span>
                          )}
                          {pr?.addedToFlow && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-0.5" title="Dodano do Flow">
                              <Workflow className="w-3 h-3" /> FLOW
                            </span>
                          )}
                          {msg.aiAnalyzed && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400" title="Analiza AI">
                              AI
                            </span>
                          )}
                          {!msg.pipelineProcessed && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400">
                              Nowy
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      {searchQuery ? 'Nie znaleziono wiadomości pasujących do wyszukiwania' :
                       classificationFilter ? `Brak wiadomości z klasyfikacją: ${classificationFilter}` :
                       'Brak wiadomości do wyświetlenia'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Strona {messagesPage} z {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setMessagesPage(1)}
                  disabled={messagesPage === 1}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Pierwsza
                </button>
                <button
                  onClick={() => setMessagesPage(p => Math.max(1, p - 1))}
                  disabled={messagesPage === 1}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMessagesPage(p => Math.min(totalPages, p + 1))}
                  disabled={messagesPage >= totalPages}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMessagesPage(totalPages)}
                  disabled={messagesPage >= totalPages}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Ostatnia
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Rules */}
      {activeTab === 'rules' && (
        <>
      {/* Stage Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveStage('all')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeStage === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Wszystkie ({rules.length})
        </button>
        {STAGES.map(stage => {
          const count = rules.filter(r => r.category === stage.id).length;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeStage === stage.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {stage.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Rules List */}
      <div className={GLASS_CARD}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Reguły Pipeline {activeStage !== 'all' && `- ${STAGES.find(s => s.id === activeStage)?.name}`}
          </h3>
        </div>
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Brak reguł w tej kategorii</p>
            <button
              onClick={() => openEditModal()}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Utwórz pierwszą regułę
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredRules.map(rule => (
              <div key={rule.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 flex items-center justify-between transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStageColor(rule.category)}`}>
                      {rule.category}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{rule.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Priorytet: {rule.priority}</span>
                    {rule.status !== 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        {rule.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{rule.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <span>Warunki: {rule.conditions?.rules?.length || 0}</span>
                    <span>Akcje: {rule.actions?.actions?.length || 0}</span>
                    {rule.actions?.stopProcessing && (
                      <span className="text-red-500 dark:text-red-400">Zatrzymuje pipeline</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full mx-4 border border-slate-200 dark:border-slate-700 overflow-y-auto" style={{ maxWidth: '42rem', maxHeight: '90vh' }}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Testuj Pipeline</h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Od (email)</label>
                <input
                  type="email"
                  value={testEmail.from}
                  onChange={e => setTestEmail({ ...testEmail, from: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="jan@firma.pl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Temat</label>
                <input
                  type="text"
                  value={testEmail.subject}
                  onChange={e => setTestEmail({ ...testEmail, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Re: Oferta współpracy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Treść</label>
                <textarea
                  value={testEmail.body}
                  onChange={e => setTestEmail({ ...testEmail, body: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl h-32 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Treść wiadomości..."
                />
              </div>
              <button
                onClick={testPipeline}
                disabled={testing || !testEmail.from || !testEmail.subject}
                className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Testowanie...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Uruchom test
                  </>
                )}
              </button>

              {testResult && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Wynik testu</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Etap:</span>
                      <span className={`px-2 py-0.5 rounded ${getStageColor(testResult.stage)}`}>
                        {testResult.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Akcja:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{testResult.action}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Spam:</span>
                      {testResult.isSpam ? (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Tak
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Nie
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Skip AI:</span>
                      {testResult.skipAI ? (
                        <span className="text-yellow-600 dark:text-yellow-400">Tak</span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">Nie</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Kategoria:</span>
                      <span className="text-slate-900 dark:text-slate-100">{testResult.category || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Priorytet:</span>
                      <span className="text-slate-900 dark:text-slate-100">{testResult.priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Uruchomi AI:</span>
                      {testResult.wouldRunAI ? (
                        <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Sparkles className="w-4 h-4" /> Tak
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">Nie</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Czas:</span>
                      <span className="flex items-center gap-1 text-slate-900 dark:text-slate-100">
                        <Clock className="w-4 h-4" />
                        {testResult.processingTimeMs}ms
                      </span>
                    </div>
                  </div>
                  {testResult.rulesExecuted?.length > 0 && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Wykonane reguły:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {testResult.rulesExecuted.map((rule, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Rule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full mx-4 border border-slate-200 dark:border-slate-700 overflow-y-auto" style={{ maxWidth: '42rem', maxHeight: '90vh' }}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingRule ? 'Edytuj regułę' : 'Nowa reguła'}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Np. Blokuj spam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis</label>
                <textarea
                  value={ruleForm.description}
                  onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl h-20 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Co robi ta reguła..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etap</label>
                  <select
                    value={ruleForm.stage}
                    onChange={e => setRuleForm({ ...ruleForm, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priorytet (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={ruleForm.priority}
                    onChange={e => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 50 })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Warunki i akcje</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Zaawansowana edycja warunków i akcji będzie dostępna w Rules Manager.
                  Na razie możesz ustawić podstawowe parametry reguły.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stopProcessing"
                  checked={ruleForm.stopProcessing}
                  onChange={e => setRuleForm({ ...ruleForm, stopProcessing: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="stopProcessing" className="text-sm text-slate-700 dark:text-slate-300">
                  Zatrzymaj pipeline po tej regule (nie wykonuj kolejnych)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveRule}
                  disabled={!ruleForm.name}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {editingRule ? 'Zapisz' : 'Utwórz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
