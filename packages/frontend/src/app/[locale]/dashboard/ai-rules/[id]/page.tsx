'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Settings, Filter, Zap, Sparkles, TestTube, Clock,
  Loader2, ShieldAlert, Trash2
} from 'lucide-react';
import { aiRulesApi } from '@/lib/api/aiRules';
import { ConditionBuilder } from '@/components/ai-rules/ConditionBuilder';
import { ActionConfigurator } from '@/components/ai-rules/ActionConfigurator';
import { PromptEditor } from '@/components/ai-rules/PromptEditor';
import { RuleTestRunner } from '@/components/ai-rules/RuleTestRunner';

type TabId = 'general' | 'conditions' | 'actions' | 'prompt' | 'tests' | 'history';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'Ogolne', icon: Settings },
  { id: 'conditions', label: 'Warunki', icon: Filter },
  { id: 'actions', label: 'Akcje', icon: Zap },
  { id: 'prompt', label: 'AI Prompt', icon: Sparkles },
  { id: 'tests', label: 'Testy', icon: TestTube },
  { id: 'history', label: 'Historia', icon: Clock },
];

export default function RuleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params.id as string;

  const [rule, setRule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [executions, setExecutions] = useState<any[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CLASSIFICATION');
  const [dataType, setDataType] = useState('EMAIL');
  const [priority, setPriority] = useState(100);
  const [status, setStatus] = useState('ACTIVE');
  const [conditions, setConditions] = useState<any[]>([]);
  const [mainOperator, setMainOperator] = useState<'AND' | 'OR'>('AND');
  const [actions, setActions] = useState<Record<string, any>>({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [aiModel, setAiModel] = useState('');

  const loadRule = useCallback(async () => {
    try {
      const data = await aiRulesApi.getRule(ruleId);
      setRule(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setCategory((data as any).category || 'CLASSIFICATION');
      setDataType((data as any).dataType || 'EMAIL');
      setPriority(data.priority || 100);
      setStatus((data as any).status || 'ACTIVE');
      setConditions((data.conditions as any)?.conditions || data.conditions || []);
      setMainOperator((data.conditions as any)?.operator || 'AND');
      setActions(data.actions || {} as any);
      setAiPrompt(data.aiPrompt || '');
      setAiSystemPrompt((data as any).aiSystemPrompt || '');
      setAiModel((data as any).aiModelName || data.aiModel || '');
    } catch {
      // handled by UI
    } finally {
      setIsLoading(false);
    }
  }, [ruleId]);

  const loadExecutions = useCallback(async () => {
    setExecutionsLoading(true);
    try {
      const result = await aiRulesApi.getExecutionHistory(ruleId, { limit: 50 });
      setExecutions((result as any)?.history || (Array.isArray(result) ? result : []));
    } catch {
      // optional
    } finally {
      setExecutionsLoading(false);
    }
  }, [ruleId]);

  useEffect(() => { loadRule(); }, [loadRule]);

  useEffect(() => {
    if (activeTab === 'history' && executions.length === 0) {
      loadExecutions();
    }
  }, [activeTab, executions.length, loadExecutions]);

  const markChanged = () => { if (!hasChanges) setHasChanges(true); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await aiRulesApi.updateRule(ruleId, {
        name,
        description,
        category,
        dataType,
        priority,
        status,
        conditions: { operator: mainOperator, conditions } as any,
        actions: actions as any,
        aiPrompt,
        aiSystemPrompt,
        modelId: aiModel || undefined,
      });
      setHasChanges(false);
    } catch {
      // error handled
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunac te regule?')) return;
    try {
      await aiRulesApi.deleteRule(ruleId);
      router.push('/dashboard/ai-rules');
    } catch {
      // error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 dark:text-slate-400">Nie znaleziono reguly</p>
        <button
          onClick={() => router.push('/dashboard/ai-rules')}
          className="mt-4 text-purple-600 hover:text-purple-700 text-sm"
        >
          Wroc do listy regul
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/ai-rules')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{name || 'Edytuj regule'}</h1>
              {rule.isSystem && <ShieldAlert className="w-5 h-5 text-amber-500" {...{ title: "Regula systemowa" } as any} />}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">ID: {ruleId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!rule.isSystem && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 className="w-4 h-4" /> Usun
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl p-1.5 overflow-x-auto">
        {TABS.map((tab) => {
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
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        {activeTab === 'general' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa reguly</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); markChanged(); }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis</label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); markChanged(); }}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategoria</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); markChanged(); }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="CLASSIFICATION">Klasyfikacja</option>
                  <option value="ROUTING">Routing</option>
                  <option value="EXTRACTION">Ekstrakcja</option>
                  <option value="INDEXING">Indeksowanie</option>
                  <option value="FLOW_ANALYSIS">Flow Analysis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typ danych</label>
                <select
                  value={dataType}
                  onChange={(e) => { setDataType(e.target.value); markChanged(); }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="EMAIL">Email</option>
                  <option value="DOCUMENT">Dokument</option>
                  <option value="OFFER">Oferta</option>
                  <option value="ALL">Wszystkie</option>
                  <option value="QUICK_CAPTURE">Szybkie notatki</option>
                  <option value="MEETING_NOTES">Notatki ze spotkan</option>
                  <option value="PHONE_CALL">Rozmowy tel.</option>
                  <option value="IDEA">Pomysly</option>
                  <option value="BILL_INVOICE">Faktury</option>
                  <option value="ARTICLE">Artykuly</option>
                  <option value="VOICE_MEMO">Notatki glosowe</option>
                  <option value="PHOTO">Zdjecia</option>
                  <option value="OTHER">Inne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priorytet</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => { setPriority(Number(e.target.value)); markChanged(); }}
                  min={1} max={1000}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); markChanged(); }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="ACTIVE">Aktywna</option>
                  <option value="INACTIVE">Nieaktywna</option>
                  <option value="TESTING">Testowa</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model AI</label>
              <select
                value={aiModel}
                onChange={(e) => { setAiModel(e.target.value); markChanged(); }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">Domyslny</option>
                <option value="qwen-max-2025-01-25">Qwen Max</option>
                <option value="qwen-plus">Qwen Plus</option>
                <option value="qwen-turbo">Qwen Turbo</option>
                <option value="qwen-long">Qwen Long (10M ctx)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Warunki uruchomienia reguly</h3>
            <ConditionBuilder
              conditions={conditions}
              onChange={(c) => { setConditions(c); markChanged(); }}
              mainOperator={mainOperator}
              onOperatorChange={(op) => { setMainOperator(op); markChanged(); }}
            />
          </div>
        )}

        {activeTab === 'actions' && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Akcje po dopasowaniu</h3>
            <ActionConfigurator
              actions={actions}
              onChange={(a) => { setActions(a); markChanged(); }}
            />
          </div>
        )}

        {activeTab === 'prompt' && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Prompt AI</h3>
            <PromptEditor
              prompt={aiPrompt}
              onChange={(p) => { setAiPrompt(p); markChanged(); }}
              systemPrompt={aiSystemPrompt}
              onSystemPromptChange={(p) => { setAiSystemPrompt(p); markChanged(); }}
            />
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Testowanie reguly</h3>
            <RuleTestRunner ruleId={ruleId} />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Historia wykonan</h3>
            {executionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : executions.length === 0 ? (
              <p className="text-center py-8 text-slate-400">Brak historii wykonan</p>
            ) : (
              <div className="space-y-2">
                {executions.map((exec: any) => (
                  <div
                    key={exec.id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        exec.status === 'COMPLETED' ? 'bg-green-500' :
                        exec.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{exec.entityType} - {exec.entityId?.slice(0, 8)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(exec.createdAt).toLocaleString('pl-PL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {exec.finalClass && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                          {exec.finalClass}
                        </span>
                      )}
                      {exec.processingTimeMs != null && (
                        <span className="text-xs text-slate-400">{exec.processingTimeMs}ms</span>
                      )}
                      <span className={`text-xs font-medium ${
                        exec.status === 'COMPLETED' ? 'text-green-600' :
                        exec.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {exec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
