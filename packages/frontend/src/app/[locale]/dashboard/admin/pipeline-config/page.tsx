'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Settings,
  Brain,
  Gauge,
  Tag,
  Globe,
  Clock,
  FileText,
  Zap,
  Shield,
  ListChecks,
  RotateCcw,
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

// ============================================================================
// Types
// ============================================================================

interface PipelineConfig {
  classifications: {
    validClasses: string[];
    descriptions: Record<string, string>;
  };
  aiParams: {
    model: string;
    temperature: number;
    maxTokens: number;
    classificationPrompt: string;
    language: string;
  };
  thresholds: {
    unknownThreshold: number;
    listMatchConfidence: number;
    defaultRuleConfidence: number;
    autoBlacklistThreshold: number;
    highPriorityBusinessThreshold: number;
  };
  keywords: {
    spam: string[];
    newsletter: string[];
    invoice: string[];
    urgency: string[];
    sentimentPositive: string[];
    sentimentNegative: string[];
  };
  domains: {
    freeEmailDomains: string[];
  };
  scheduling: {
    emailProcessingInterval: number;
    invoiceSyncInterval: number;
    ragReindexInterval: number;
    emailBatchSize: number;
    invoiceBatchSize: number;
    invoiceBatchDelay: number;
    invoiceOrgDelay: number;
    importOrgDelay: number;
    ragStartupDelay: number;
    emailStartupDelay: number;
  };
  contentLimits: {
    aiContentLimit: number;
    ragContentLimit: number;
    flowPreviewLimit: number;
    minContentLength: number;
  };
  postActions: Record<string, {
    rag?: boolean;
    flow?: boolean;
    suggestBlacklist?: boolean;
    autoBlacklist?: boolean;
    extractTasks?: boolean;
  }>;
  systemRules: {
    preFilter: any[];
    classify: any[];
  };
  taskExtraction: {
    patterns: Array<{ pattern: string; flags: string }>;
    urgencyPatterns: string[];
    maxTasks: number;
    minTitleLength: number;
  };
}

type SectionName = keyof PipelineConfig;

const TABS: { id: SectionName; label: string; icon: any }[] = [
  { id: 'classifications', label: 'Klasyfikacje', icon: Tag },
  { id: 'aiParams', label: 'Parametry AI', icon: Brain },
  { id: 'thresholds', label: 'Progi', icon: Gauge },
  { id: 'keywords', label: 'Slowa kluczowe', icon: ListChecks },
  { id: 'domains', label: 'Domeny', icon: Globe },
  { id: 'scheduling', label: 'Harmonogram', icon: Clock },
  { id: 'contentLimits', label: 'Limity', icon: FileText },
  { id: 'postActions', label: 'Post-akcje', icon: Zap },
  { id: 'systemRules', label: 'Reguly systemowe', icon: Shield },
  { id: 'taskExtraction', label: 'Ekstrakcja zadan', icon: ListChecks },
];

// ============================================================================
// Helpers
// ============================================================================

function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

function minutesToMs(min: number): number {
  return min * 60000;
}

// ============================================================================
// Tag Input Component
// ============================================================================

function TagInput({ values, onChange, placeholder }: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-xs border border-white/10">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder || 'Dodaj...'}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
        />
        <button onClick={addTag} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Number Input with label
// ============================================================================

function NumberField({ label, value, onChange, suffix, min, max, step }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-white/70 min-w-[200px]">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step || 1}
          className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-right focus:outline-none focus:border-blue-500/50"
        />
        {suffix && <span className="text-xs text-white/50 w-12">{suffix}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// Slider field for thresholds
// ============================================================================

function SliderField({ label, value, onChange, min, max, step }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm text-white/70">{label}</label>
        <span className="text-sm font-mono text-blue-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        min={min ?? 0}
        max={max ?? 1}
        step={step ?? 0.01}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function PipelineConfigPage() {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [defaults, setDefaults] = useState<PipelineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionName>('classifications');
  const [dirty, setDirty] = useState<Set<SectionName>>(new Set());

  const loadConfig = useCallback(async () => {
    try {
      const [configRes, defaultsRes] = await Promise.all([
        apiClient.get('/admin/pipeline-config'),
        apiClient.get('/admin/pipeline-config/defaults'),
      ]);
      setConfig(configRes.data?.data || configRes.data);
      setDefaults(defaultsRes.data?.data || defaultsRes.data);
      setDirty(new Set());
    } catch (err: any) {
      toast.error('Blad ladowania konfiguracji: ' + (err.message || 'Unknown'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const updateSection = (section: SectionName, data: any) => {
    if (!config) return;
    setConfig({ ...config, [section]: data });
    setDirty(prev => new Set(prev).add(section));
  };

  const saveSection = async (section: SectionName) => {
    if (!config) return;
    setSaving(true);
    try {
      await apiClient.put('/admin/pipeline-config', {
        section,
        data: config[section],
      });
      setDirty(prev => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
      toast.success(`Sekcja "${TABS.find(t => t.id === section)?.label}" zapisana`);
    } catch (err: any) {
      toast.error('Blad zapisu: ' + (err.message || 'Unknown'));
    } finally {
      setSaving(false);
    }
  };

  const resetSection = async (section: SectionName) => {
    setSaving(true);
    try {
      await apiClient.post('/admin/pipeline-config/reset-section', { section });
      await loadConfig();
      toast.success(`Sekcja "${TABS.find(t => t.id === section)?.label}" zresetowana do domyslnych`);
    } catch (err: any) {
      toast.error('Blad resetu: ' + (err.message || 'Unknown'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config || !defaults) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </PageShell>
    );
  }

  const isDirty = dirty.has(activeTab);

  return (
    <PageShell>
      <PageHeader
        title="Konfiguracja Pipeline"
        subtitle="Zarzadzaj parametrami przetwarzania emaili, klasyfikacji AI i automatyzacji"
        icon={Settings}
      />

      <div className="flex gap-6 mt-6">
        {/* Sidebar tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDirtyTab = dirty.has(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
                {isDirtyTab && <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Action bar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => resetSection(activeTab)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-white/60 hover:bg-white/5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetuj do domyslnych
              </button>
              <button
                onClick={() => saveSection(activeTab)}
                disabled={saving || !isDirty}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDirty
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-white/5 text-white/40 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>

          {/* Section content */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
            {activeTab === 'classifications' && (
              <ClassificationsEditor
                data={config.classifications}
                onChange={d => updateSection('classifications', d)}
              />
            )}
            {activeTab === 'aiParams' && (
              <AIParamsEditor
                data={config.aiParams}
                onChange={d => updateSection('aiParams', d)}
              />
            )}
            {activeTab === 'thresholds' && (
              <ThresholdsEditor
                data={config.thresholds}
                onChange={d => updateSection('thresholds', d)}
              />
            )}
            {activeTab === 'keywords' && (
              <KeywordsEditor
                data={config.keywords}
                onChange={d => updateSection('keywords', d)}
              />
            )}
            {activeTab === 'domains' && (
              <DomainsEditor
                data={config.domains}
                onChange={d => updateSection('domains', d)}
              />
            )}
            {activeTab === 'scheduling' && (
              <SchedulingEditor
                data={config.scheduling}
                onChange={d => updateSection('scheduling', d)}
              />
            )}
            {activeTab === 'contentLimits' && (
              <ContentLimitsEditor
                data={config.contentLimits}
                onChange={d => updateSection('contentLimits', d)}
              />
            )}
            {activeTab === 'postActions' && (
              <PostActionsEditor
                data={config.postActions}
                classifications={config.classifications.validClasses}
                onChange={d => updateSection('postActions', d)}
              />
            )}
            {activeTab === 'systemRules' && (
              <SystemRulesEditor
                data={config.systemRules}
                onChange={d => updateSection('systemRules', d)}
              />
            )}
            {activeTab === 'taskExtraction' && (
              <TaskExtractionEditor
                data={config.taskExtraction}
                onChange={d => updateSection('taskExtraction', d)}
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ============================================================================
// Section Editors
// ============================================================================

function ClassificationsEditor({ data, onChange }: {
  data: PipelineConfig['classifications'];
  onChange: (d: PipelineConfig['classifications']) => void;
}) {
  const [newClass, setNewClass] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addClass = () => {
    const name = newClass.trim().toUpperCase();
    if (!name || data.validClasses.includes(name)) return;
    onChange({
      validClasses: [...data.validClasses, name],
      descriptions: { ...data.descriptions, [name]: newDesc.trim() || name },
    });
    setNewClass('');
    setNewDesc('');
  };

  const removeClass = (cls: string) => {
    onChange({
      validClasses: data.validClasses.filter(c => c !== cls),
      descriptions: Object.fromEntries(
        Object.entries(data.descriptions).filter(([k]) => k !== cls)
      ),
    });
  };

  const updateDesc = (cls: string, desc: string) => {
    onChange({
      ...data,
      descriptions: { ...data.descriptions, [cls]: desc },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">Dozwolone klasyfikacje emaili i ich opisy (uzywane w promcie AI).</p>

      {data.validClasses.map(cls => (
        <div key={cls} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-blue-400">{cls}</span>
            </div>
            <input
              value={data.descriptions[cls] || ''}
              onChange={e => updateDesc(cls, e.target.value)}
              placeholder="Opis klasyfikacji..."
              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button onClick={() => removeClass(cls)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="flex gap-2 items-end pt-2 border-t border-white/10">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-white/50">Nazwa (uppercase)</label>
          <input
            value={newClass}
            onChange={e => setNewClass(e.target.value.toUpperCase())}
            placeholder="np. COOPERATION"
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-white/50">Opis</label>
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Opis..."
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button
          onClick={addClass}
          disabled={!newClass.trim()}
          className="px-4 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AIParamsEditor({ data, onChange }: {
  data: PipelineConfig['aiParams'];
  onChange: (d: PipelineConfig['aiParams']) => void;
}) {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/50">Parametry modelu AI do klasyfikacji emaili.</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-white/70">Model AI</label>
          <input
            value={data.model}
            onChange={e => update('model', e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/70">Jezyk</label>
          <select
            value={data.language}
            onChange={e => update('language', e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Temperature"
          value={data.temperature}
          onChange={v => update('temperature', v)}
          min={0}
          max={2}
          step={0.1}
        />
        <NumberField
          label="Max Tokens"
          value={data.maxTokens}
          onChange={v => update('maxTokens', v)}
          min={100}
          max={4000}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-white/70">Prompt klasyfikacji</label>
        <p className="text-xs text-white/40">Uzyj {"{{categories}}"} aby wstawic liste klasyfikacji z ich opisami.</p>
        <textarea
          value={data.classificationPrompt}
          onChange={e => update('classificationPrompt', e.target.value)}
          rows={12}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-y"
        />
      </div>
    </div>
  );
}

function ThresholdsEditor({ data, onChange }: {
  data: PipelineConfig['thresholds'];
  onChange: (d: PipelineConfig['thresholds']) => void;
}) {
  const update = (field: string, value: number) => onChange({ ...data, [field]: value });

  const fields: { key: keyof PipelineConfig['thresholds']; label: string; desc: string }[] = [
    { key: 'unknownThreshold', label: 'Prog UNKNOWN', desc: 'Ponizej tej wartosci klasyfikacja = UNKNOWN' },
    { key: 'listMatchConfidence', label: 'List match confidence', desc: 'Confidence dla dopasowania z listy (blacklist/whitelist)' },
    { key: 'defaultRuleConfidence', label: 'Default rule confidence', desc: 'Domyslna confidence dla regul AI' },
    { key: 'autoBlacklistThreshold', label: 'Auto-blacklist threshold', desc: 'Powyzej tej wartosci domena jest auto-blacklistowana (SPAM)' },
    { key: 'highPriorityBusinessThreshold', label: 'High priority business', desc: 'Confidence BUSINESS powyzej = priorytet HIGH' },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/50">Progi confidence decydujace o dzialaniach pipeline.</p>
      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <SliderField label={f.label} value={data[f.key]} onChange={v => update(f.key, v)} />
          <p className="text-xs text-white/40 pl-1">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

function KeywordsEditor({ data, onChange }: {
  data: PipelineConfig['keywords'];
  onChange: (d: PipelineConfig['keywords']) => void;
}) {
  const sections: { key: keyof PipelineConfig['keywords']; label: string }[] = [
    { key: 'spam', label: 'Spam keywords' },
    { key: 'newsletter', label: 'Newsletter keywords' },
    { key: 'invoice', label: 'Invoice keywords' },
    { key: 'urgency', label: 'Urgency keywords' },
    { key: 'sentimentPositive', label: 'Sentiment positive' },
    { key: 'sentimentNegative', label: 'Sentiment negative' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Slowa kluczowe uzywane w heurystycznej analizie emaili.</p>
      {sections.map(s => (
        <div key={s.key} className="space-y-2">
          <h3 className="text-sm font-medium text-white/80">{s.label}</h3>
          <TagInput
            values={data[s.key]}
            onChange={v => onChange({ ...data, [s.key]: v })}
            placeholder={`Dodaj ${s.label.toLowerCase()}...`}
          />
        </div>
      ))}
    </div>
  );
}

function DomainsEditor({ data, onChange }: {
  data: PipelineConfig['domains'];
  onChange: (d: PipelineConfig['domains']) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Darmowe domeny email (gmail, wp, itp.) - pomijane przy dopasowywaniu firm.
        Aktualnie: {data.freeEmailDomains.length} domen.
      </p>
      <TagInput
        values={data.freeEmailDomains}
        onChange={v => onChange({ freeEmailDomains: v })}
        placeholder="np. gmail.com"
      />
    </div>
  );
}

function SchedulingEditor({ data, onChange }: {
  data: PipelineConfig['scheduling'];
  onChange: (d: PipelineConfig['scheduling']) => void;
}) {
  const update = (field: string, value: number) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Interwaly, batch sizes i opoznienia zaplanowanych zadan. Wymagaja restartu backendu.</p>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-white/80">Interwaly przetwarzania</h3>
        <div className="space-y-3 p-3 rounded-lg bg-white/5">
          <NumberField label="Przetwarzanie emaili" value={msToMinutes(data.emailProcessingInterval)} onChange={v => update('emailProcessingInterval', minutesToMs(v))} suffix="min" min={1} />
          <NumberField label="Sync faktur" value={msToMinutes(data.invoiceSyncInterval)} onChange={v => update('invoiceSyncInterval', minutesToMs(v))} suffix="min" min={5} />
          <NumberField label="RAG reindex" value={msToMinutes(data.ragReindexInterval)} onChange={v => update('ragReindexInterval', minutesToMs(v))} suffix="min" min={30} />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-white/80">Batch sizes</h3>
        <div className="space-y-3 p-3 rounded-lg bg-white/5">
          <NumberField label="Email batch size" value={data.emailBatchSize} onChange={v => update('emailBatchSize', v)} min={1} max={200} />
          <NumberField label="Invoice batch size" value={data.invoiceBatchSize} onChange={v => update('invoiceBatchSize', v)} min={1} max={50} />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-white/80">Opoznienia (ms)</h3>
        <div className="space-y-3 p-3 rounded-lg bg-white/5">
          <NumberField label="Invoice batch delay" value={data.invoiceBatchDelay} onChange={v => update('invoiceBatchDelay', v)} suffix="ms" min={0} />
          <NumberField label="Invoice org delay" value={data.invoiceOrgDelay} onChange={v => update('invoiceOrgDelay', v)} suffix="ms" min={0} />
          <NumberField label="Import org delay" value={data.importOrgDelay} onChange={v => update('importOrgDelay', v)} suffix="ms" min={0} />
          <NumberField label="RAG startup delay" value={msToMinutes(data.ragStartupDelay)} onChange={v => update('ragStartupDelay', minutesToMs(v))} suffix="min" min={0} />
          <NumberField label="Email startup delay" value={msToMinutes(data.emailStartupDelay)} onChange={v => update('emailStartupDelay', minutesToMs(v))} suffix="min" min={0} />
        </div>
      </div>
    </div>
  );
}

function ContentLimitsEditor({ data, onChange }: {
  data: PipelineConfig['contentLimits'];
  onChange: (d: PipelineConfig['contentLimits']) => void;
}) {
  const update = (field: string, value: number) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/50">Limity dlugosci tresci przekazywanej do roznych etapow pipeline.</p>
      <NumberField label="AI content limit" value={data.aiContentLimit} onChange={v => update('aiContentLimit', v)} suffix="znakow" min={500} max={50000} />
      <NumberField label="RAG content limit" value={data.ragContentLimit} onChange={v => update('ragContentLimit', v)} suffix="znakow" min={1000} max={100000} />
      <NumberField label="Flow preview limit" value={data.flowPreviewLimit} onChange={v => update('flowPreviewLimit', v)} suffix="znakow" min={50} max={1000} />
      <NumberField label="Min content length" value={data.minContentLength} onChange={v => update('minContentLength', v)} suffix="znakow" min={1} max={100} />
    </div>
  );
}

function PostActionsEditor({ data, classifications, onChange }: {
  data: PipelineConfig['postActions'];
  classifications: string[];
  onChange: (d: PipelineConfig['postActions']) => void;
}) {
  const actionTypes = [
    { key: 'rag', label: 'RAG', desc: 'Dodaj do bazy wiedzy' },
    { key: 'flow', label: 'Flow', desc: 'Dodaj do Zrodla (inbox)' },
    { key: 'extractTasks', label: 'Zadania', desc: 'Wyodrebnij zadania' },
    { key: 'suggestBlacklist', label: 'Blacklist', desc: 'Sugeruj blacklist' },
    { key: 'autoBlacklist', label: 'Auto-block', desc: 'Automatycznie zablokuj' },
  ] as const;

  const noPromptClasses = ['SPAM', 'UNKNOWN'];

  const toggle = (cls: string, action: string) => {
    const current = data[cls] || {};
    onChange({
      ...data,
      [cls]: { ...current, [action]: !(current as any)[action] },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">Mapowanie: ktore akcje wykonac po klasyfikacji emaila.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white/60 font-medium">Klasyfikacja</th>
              {actionTypes.map(a => (
                <th key={a.key} className="text-center py-2 px-2 text-white/60 font-medium">
                  <div className="text-xs">{a.label}</div>
                  <div className="text-[10px] text-white/40 font-normal">{a.desc}</div>
                </th>
              ))}
              <th className="text-center py-2 px-2 text-white/60 font-medium">
                <div className="text-xs">Prompt</div>
                <div className="text-[10px] text-white/40 font-normal">Post-analiza AI</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {classifications.map(cls => (
              <tr key={cls} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-mono text-blue-400 text-xs">{cls}</td>
                {actionTypes.map(a => (
                  <td key={a.key} className="text-center py-2 px-2">
                    <button
                      onClick={() => toggle(cls, a.key)}
                      className={`w-6 h-6 rounded-md border transition-colors ${
                        (data[cls] as any)?.[a.key]
                          ? 'bg-blue-500/30 border-blue-500/50 text-blue-400'
                          : 'bg-white/5 border-white/10 text-white/20'
                      }`}
                    >
                      {(data[cls] as any)?.[a.key] ? '✓' : ''}
                    </button>
                  </td>
                ))}
                <td className="text-center py-2 px-2">
                  {noPromptClasses.includes(cls) ? (
                    <span className="text-white/20 text-xs">&mdash;</span>
                  ) : (
                    <Link
                      href={`/dashboard/ai-rules?tab=prompts&search=EMAIL_POST_${cls}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>EMAIL_POST_{cls}</span>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-xs text-purple-300">
          Prompty post-klasyfikacji zarzadzaj w{' '}
          <Link href="/dashboard/ai-rules?tab=prompts" className="underline hover:text-purple-200">
            Reguly AI &rarr; Prompty
          </Link>
          . Kod: <code className="bg-white/10 px-1 rounded">EMAIL_POST_&#123;KLASYFIKACJA&#125;</code>
        </p>
      </div>
    </div>
  );
}

function SystemRulesEditor({ data, onChange }: {
  data: PipelineConfig['systemRules'];
  onChange: (d: PipelineConfig['systemRules']) => void;
}) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const updateRule = (stage: 'preFilter' | 'classify', index: number, rule: any) => {
    const rules = [...data[stage]];
    rules[index] = rule;
    onChange({ ...data, [stage]: rules });
  };

  const removeRule = (stage: 'preFilter' | 'classify', index: number) => {
    onChange({ ...data, [stage]: data[stage].filter((_, i) => i !== index) });
  };

  const addRule = (stage: 'preFilter' | 'classify') => {
    const newRule = {
      id: `sys-custom-${Date.now()}`,
      name: '[System] New Rule',
      stage: stage === 'preFilter' ? 'PRE_FILTER' : 'CLASSIFY',
      priority: 50,
      conditions: [],
      actions: [],
      stopProcessing: false,
    };
    onChange({ ...data, [stage]: [...data[stage], newRule] });
  };

  const renderRules = (stage: 'preFilter' | 'classify', label: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">{label}</h3>
        <button
          onClick={() => addRule(stage)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30"
        >
          <Plus className="w-3 h-3" /> Dodaj regule
        </button>
      </div>

      {data[stage].map((rule: any, i: number) => {
        const ruleKey = `${stage}-${i}`;
        const isExpanded = expandedRule === ruleKey;

        return (
          <div key={ruleKey} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5"
              onClick={() => setExpandedRule(isExpanded ? null : ruleKey)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              <span className="text-sm font-medium flex-1">{rule.name}</span>
              <span className="text-xs text-white/40">priority: {rule.priority}</span>
              <button
                onClick={e => { e.stopPropagation(); removeRule(stage, i); }}
                className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Nazwa</label>
                    <input
                      value={rule.name}
                      onChange={e => updateRule(stage, i, { ...rule, name: e.target.value })}
                      className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Priorytet</label>
                    <input
                      type="number"
                      value={rule.priority}
                      onChange={e => updateRule(stage, i, { ...rule, priority: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50">Warunki (JSON)</label>
                  <textarea
                    value={JSON.stringify(rule.conditions, null, 2)}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateRule(stage, i, { ...rule, conditions: parsed });
                      } catch { /* ignore parse errors while typing */ }
                    }}
                    rows={4}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50">Akcje (JSON)</label>
                  <textarea
                    value={JSON.stringify(rule.actions, null, 2)}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateRule(stage, i, { ...rule, actions: parsed });
                      } catch { /* ignore parse errors while typing */ }
                    }}
                    rows={3}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={rule.stopProcessing || false}
                    onChange={e => updateRule(stage, i, { ...rule, stopProcessing: e.target.checked })}
                    className="rounded"
                  />
                  Stop processing (przerwij pipeline po tej regule)
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Reguly systemowe pre-filtra i klasyfikacji emailPipeline.</p>
      {renderRules('preFilter', 'PRE_FILTER (odrzucanie spamu, no-reply)')}
      {renderRules('classify', 'CLASSIFY (newsletter, VIP, faktury)')}
    </div>
  );
}

function TaskExtractionEditor({ data, onChange }: {
  data: PipelineConfig['taskExtraction'];
  onChange: (d: PipelineConfig['taskExtraction']) => void;
}) {
  const updatePattern = (index: number, field: 'pattern' | 'flags', value: string) => {
    const patterns = [...data.patterns];
    patterns[index] = { ...patterns[index], [field]: value };
    onChange({ ...data, patterns });
  };

  const removePattern = (index: number) => {
    onChange({ ...data, patterns: data.patterns.filter((_, i) => i !== index) });
  };

  const addPattern = () => {
    onChange({ ...data, patterns: [...data.patterns, { pattern: '', flags: 'i' }] });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Regex patterny do automatycznego wyorebniania zadan z emaili.</p>

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Max zadan na email" value={data.maxTasks} onChange={v => onChange({ ...data, maxTasks: v })} min={1} max={20} />
        <NumberField label="Min dlugosc tytulu" value={data.minTitleLength} onChange={v => onChange({ ...data, minTitleLength: v })} min={3} max={50} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/80">Urgency patterns</h3>
        <TagInput
          values={data.urgencyPatterns}
          onChange={v => onChange({ ...data, urgencyPatterns: v })}
          placeholder="np. urgent, pilne..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/80">Regex patterns</h3>
          <button
            onClick={addPattern}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30"
          >
            <Plus className="w-3 h-3" /> Dodaj pattern
          </button>
        </div>

        {data.patterns.map((p, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              value={p.pattern}
              onChange={e => updatePattern(i, 'pattern', e.target.value)}
              placeholder="Regex pattern..."
              className="flex-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono focus:outline-none focus:border-blue-500/50"
            />
            <input
              value={p.flags}
              onChange={e => updatePattern(i, 'flags', e.target.value)}
              placeholder="flags"
              className="w-12 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-center focus:outline-none focus:border-blue-500/50"
            />
            <button onClick={() => removePattern(i)} className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
