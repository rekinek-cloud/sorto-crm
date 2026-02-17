'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Clock,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Copy,
  Mail,
  Filter,
  MessageSquare,
  FolderOpen,
  CheckSquare,
  Briefcase,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { universalRulesApi, type AvailableAnalysis, type ExecutionHistoryItem } from '@/lib/api/universalRules';
import { getUnifiedRuleTemplates, createUnifiedRule } from '@/lib/api/unifiedRules';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

// Types imported from @/lib/api/universalRules

export default function UniversalRulesPage() {
  const [availableAnalyses, setAvailableAnalyses] = useState<Record<string, AvailableAnalysis[]>>({});
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryItem[]>([]);
  const [ruleTemplates, setRuleTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('projects');
  const [analyzing, setAnalyzing] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);
  const [testItemId, setTestItemId] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('');

  const modules: { id: string; name: string; icon: React.ReactNode }[] = [
    { id: 'projects', name: 'Projekty', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'tasks', name: 'Zadania', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'deals', name: 'Transakcje', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'contacts', name: 'Kontakty', icon: <User className="w-4 h-4" /> },
    { id: 'communication', name: 'Komunikacja', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analysesRes, historyRes, templatesRes] = await Promise.all([
        universalRulesApi.getAvailableAnalyses(),
        universalRulesApi.getExecutionHistory({ limit: 20 }),
        getUnifiedRuleTemplates().catch(() => []),
      ]);
      setAvailableAnalyses((analysesRes.data || {}) as any);
      setExecutionHistory(historyRes.data || []);
      setRuleTemplates(templatesRes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!testItemId.trim()) {
      toast.error('Wprowadz ID elementu');
      return;
    }
    if (!selectedAnalysisType) {
      toast.error('Wybierz typ analizy');
      return;
    }

    try {
      setAnalyzing(true);
      const result = await universalRulesApi.analyze({
        module: selectedModule as any,
        itemId: testItemId,
        analysisType: selectedAnalysisType as any,
      });

      if (result.success) {
        toast.success(`Analiza zakonczona. Wykonano ${result.executedRules} regul.`);
        loadData();
      } else {
        toast.error('Analiza nie powiodla sie');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Blad podczas analizy');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateFromTemplate = async (template: any) => {
    try {
      setCreatingFromTemplate(template.id);
      await createUnifiedRule({
        name: template.name,
        description: template.description,
        ruleType: template.ruleType,
        category: template.category,
        triggerType: template.triggerType || 'MANUAL',
        conditions: template.conditions,
        actions: template.actions,
        status: 'INACTIVE',
        priority: 50,
      });
      toast.success(`Regula "${template.name}" utworzona z szablonu`);
    } catch (error: any) {
      console.error('Failed to create rule from template:', error);
      toast.error('Blad tworzenia reguly z szablonu');
    } finally {
      setCreatingFromTemplate(null);
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'MESSAGE_PROCESSING': return <Mail className="h-5 w-5 text-blue-600" />;
      case 'FILTERING': return <Filter className="h-5 w-5 text-red-600" />;
      case 'COMMUNICATION': return <MessageSquare className="h-5 w-5 text-green-600" />;
      default: return <Zap className="h-5 w-5 text-purple-600" />;
    }
  };

  const currentModuleAnalyses = availableAnalyses[selectedModule] || [];

  return (
    <PageShell>
      <PageHeader
        title="Universal Rules"
        subtitle="Uniwersalny silnik regul AI dla wszystkich modulow"
        icon={Zap}
        iconColor="text-purple-600"
      />

      {/* Module Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => {
              setSelectedModule(module.id);
              setSelectedAnalysisType('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedModule === module.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {module.icon}
            {module.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Analyses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Dostepne analizy AI
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : currentModuleAnalyses.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">Brak dostepnych analiz dla tego modulu</p>
            ) : (
              <div className="space-y-3">
                {currentModuleAnalyses.map((analysis) => (
                  <div
                    key={analysis.type}
                    onClick={() => setSelectedAnalysisType(analysis.type)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAnalysisType === analysis.type
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">{analysis.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{analysis.description}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400 dark:text-slate-500">
                        <div>{analysis.estimatedTime}</div>
                        <div className="mt-1">{analysis.aiModel}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run Analysis */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Uruchom analize
            </h2>

            <div className="flex gap-3">
              <input
                type="text"
                value={testItemId}
                onChange={(e) => setTestItemId(e.target.value)}
                placeholder="ID elementu (np. proj_123)"
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg"
              />
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing || !selectedAnalysisType}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Analizuje...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Uruchom
                  </>
                )}
              </button>
            </div>

            {selectedAnalysisType && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Wybrana analiza: <strong>{currentModuleAnalyses.find(a => a.type === selectedAnalysisType)?.name}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Execution History */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            Historia wykonan
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600" />
            </div>
          ) : executionHistory.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">Brak historii</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {executionHistory.map((item) => (
                <div key={item.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                        {item.ruleName}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      item.trigger === 'manual' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {item.trigger === 'manual' ? 'Reczny' : 'Auto'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div>{item.module} / {item.itemId}</div>
                    <div className="mt-1">
                      {new Date(item.timestamp).toLocaleString('pl-PL')}
                      {' '}({item.executionTime}ms)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={loadData}
            className="w-full mt-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Odswiez
          </button>
        </div>
      </div>

      {/* Rule Templates */}
      {ruleTemplates.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Copy className="h-5 w-5 text-amber-600" />
            Szablony regul
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Gotowe szablony regul do szybkiego wdrozenia. Kliknij aby utworzyc regule z szablonu.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ruleTemplates.map((template: any) => (
              <div
                key={template.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                    {getTemplateIcon(template.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{template.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{template.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                      {template.ruleType}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded">
                      {template.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCreateFromTemplate(template)}
                    disabled={creatingFromTemplate === template.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {creatingFromTemplate === template.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Uzyj
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Wykonane analizy</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{executionHistory.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sukces</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {executionHistory.filter(h => h.success).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Reczne</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {executionHistory.filter(h => h.trigger === 'manual').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Automatyczne</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {executionHistory.filter(h => h.trigger === 'automatic').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
