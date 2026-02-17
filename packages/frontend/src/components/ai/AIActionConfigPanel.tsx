'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface ActionConfig {
  id: string;
  actionCode: string;
  primaryModelId: string;
  fallbackModelId: string | null;
  isActive: boolean;
  primaryModel: { id: string; name: string; displayName: string; ai_providers: { name: string } };
  fallbackModel: { id: string; name: string; displayName: string; ai_providers: { name: string } } | null;
}

interface V2Model {
  id: string;
  name: string;
  displayName: string;
  status: string;
  ai_providers: { name: string };
}

const ACTION_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  FLOW_ANALYSIS: { label: 'Analiza elementow (Flow)', icon: '\u{1F9E0}', description: 'Analiza elementow skrzynki odbiorczej przez FlowEngine' },
  FLOW_CONVERSATION: { label: 'Konwersacja AI', icon: '\u{1F4AC}', description: 'Dialog z AI o przetwarzanych elementach' },
  EMAIL_CLASSIFICATION: { label: 'Klasyfikacja emaili', icon: '\u{1F4E7}', description: 'Automatyczna klasyfikacja emaili (BUSINESS/SPAM/NEWSLETTER)' },
  EMAIL_PIPELINE: { label: 'Analiza emaili w pipeline', icon: '\u{1F4EC}', description: 'Pelna analiza AI w pipeline przetwarzania emaili' },
  AI_RULES_DEFAULT: { label: 'Domyslny model regul AI', icon: '\u{2699}\u{FE0F}', description: 'Model uzywany gdy regula AI nie ma przypisanego modelu' },
  TASK_SUMMARY: { label: 'Podsumowanie zadan', icon: '\u{2705}', description: 'Generowanie podsumowan zadan przez AI' },
  DEAL_ANALYSIS: { label: 'Analiza transakcji', icon: '\u{1F4B0}', description: 'Analiza AI dla szans sprzedazowych' },
};

interface AIActionConfigPanelProps {
  className?: string;
}

export function AIActionConfigPanel({ className = '' }: AIActionConfigPanelProps) {
  const [actionConfigs, setActionConfigs] = useState<ActionConfig[]>([]);
  const [v2Models, setV2Models] = useState<V2Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionRes, modelsRes] = await Promise.all([
        apiClient.get('/ai-v2/action-config').catch(() => ({ data: { configs: [] } })),
        apiClient.get('/ai-v2/models').catch(() => ({ data: { models: [] } })),
      ]);
      setActionConfigs(actionRes.data?.configs || []);
      setV2Models((modelsRes.data?.models || []).filter((m: V2Model) => m.status === 'ACTIVE'));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const updateActionConfig = async (actionCode: string, primaryModelId: string, fallbackModelId?: string | null) => {
    try {
      await apiClient.put(`/ai-v2/action-config/${actionCode}`, {
        primaryModelId,
        fallbackModelId: fallbackModelId || null,
      });
      toast.success('Konfiguracja akcji zaktualizowana');
      const res = await apiClient.get('/ai-v2/action-config').catch(() => ({ data: { configs: [] } }));
      setActionConfigs(res.data?.configs || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie zaktualizowac konfiguracji');
    }
  };

  const toggleActionActive = async (config: ActionConfig) => {
    try {
      await apiClient.put(`/ai-v2/action-config/${config.actionCode}`, {
        primaryModelId: config.primaryModelId,
        fallbackModelId: config.fallbackModelId,
        isActive: !config.isActive,
      });
      toast.success(`Akcja ${config.isActive ? 'wylaczona' : 'wlaczona'}`);
      const res = await apiClient.get('/ai-v2/action-config').catch(() => ({ data: { configs: [] } }));
      setActionConfigs(res.data?.configs || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie zmienic statusu');
    }
  };

  const resetActionConfigs = async () => {
    if (!confirm('Przywrocic domyslne ustawienia akcji AI?')) return;
    try {
      await apiClient.post('/ai-v2/action-config/reset');
      toast.success('Przywrocono domyslne ustawienia');
      const res = await apiClient.get('/ai-v2/action-config').catch(() => ({ data: { configs: [] } }));
      setActionConfigs(res.data?.configs || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie przywrocic ustawien');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Akcje AI — Mapowanie na modele</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ktory model AI obsluguje poszczegolne operacje systemowe
          </p>
        </div>
        <button
          onClick={resetActionConfigs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          <RotateCcw className="w-4 h-4" />
          Przywroc domyslne
        </button>
      </div>

      <div className="grid gap-4">
        {actionConfigs.map((config) => {
          const meta = ACTION_LABELS[config.actionCode] || { label: config.actionCode, icon: '?', description: '' };
          return (
            <div
              key={config.id}
              className={`p-5 bg-white/80 backdrop-blur-xl border dark:bg-slate-800/80 rounded-2xl shadow-sm ${
                config.isActive
                  ? 'border-white/20 dark:border-slate-700/30'
                  : 'border-slate-300 dark:border-slate-600 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{meta.label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{meta.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActionActive(config)}
                  className={`shrink-0 px-3 py-1 text-xs rounded-full font-medium ${
                    config.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {config.isActive ? 'Aktywna' : 'Nieaktywna'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Model podstawowy
                  </label>
                  <select
                    value={config.primaryModelId}
                    onChange={(e) => updateActionConfig(config.actionCode, e.target.value, config.fallbackModelId)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100 text-sm"
                  >
                    {v2Models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.ai_providers.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Model zapasowy (opcjonalny)
                  </label>
                  <select
                    value={config.fallbackModelId || ''}
                    onChange={(e) => updateActionConfig(config.actionCode, config.primaryModelId, e.target.value || null)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100 text-sm"
                  >
                    <option value="">— Brak —</option>
                    {v2Models.filter((m) => m.id !== config.primaryModelId).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.ai_providers.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
        {actionConfigs.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            Brak konfiguracji akcji AI. Odswierz strone aby zaladowac domyslne.
          </p>
        )}
      </div>
    </div>
  );
}
