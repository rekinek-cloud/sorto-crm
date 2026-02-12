'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clipboard,
  Lightbulb,
  FileText,
  Mail,
  Mic,
  Phone,
  Camera,
  File,
  Archive,
  AlertTriangle,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import Link from 'next/link';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { LucideIcon } from 'lucide-react';

// Source type definitions matching InboxSourceType enum
const SOURCE_TYPES: { key: string; label: string; description: string; icon: LucideIcon }[] = [
  { key: 'QUICK_CAPTURE', label: 'Szybkie dodanie', description: 'Recznie wpisane elementy', icon: Archive },
  { key: 'MEETING_NOTES', label: 'Notatki ze spotkan', description: 'Notatki z rozmow, spotkan', icon: Clipboard },
  { key: 'PHONE_CALL', label: 'Rozmowy telefoniczne', description: 'Notatki z rozmow telefonicznych', icon: Phone },
  { key: 'EMAIL', label: 'E-maile', description: 'E-maile wymagajace akcji', icon: Mail },
  { key: 'IDEA', label: 'Pomysly', description: 'Pomysly do analizy', icon: Lightbulb },
  { key: 'DOCUMENT', label: 'Dokumenty', description: 'Dokumenty, pliki', icon: FileText },
  { key: 'BILL_INVOICE', label: 'Faktury', description: 'Faktury i rachunki', icon: File },
  { key: 'ARTICLE', label: 'Artykuly', description: 'Artykuly, linki', icon: FileText },
  { key: 'VOICE_MEMO', label: 'Nagrania glosowe', description: 'Nagrania glosowe i dyktafon', icon: Mic },
  { key: 'PHOTO', label: 'Zdjecia', description: 'Zdjecia dokumentow, wizytowek', icon: Camera },
  { key: 'OTHER', label: 'Inne', description: 'Wszystko inne', icon: Archive },
];

const CONFIDENCE_THRESHOLDS = [
  { value: 0.95, label: 'Ostrozny (95%)', description: 'Tylko najbardziej oczywiste elementy' },
  { value: 0.90, label: 'Standardowy (90%)', description: 'Dobra rownowaga miedzy automatyzacja a kontrola' },
  { value: 0.85, label: 'Umiarkowany (85%)', description: 'Wiecej automatyzacji, czasem niepewne decyzje' },
  { value: 0.80, label: 'Agresywny (80%)', description: 'Maksymalna automatyzacja, wymaga monitorowania' },
];

interface AutopilotConfig {
  enabled: boolean;
  confidenceThreshold: number;
  exceptions: {
    neverDeleteAuto: boolean;
  };
}

interface FlowSettings {
  enabled: boolean;
  sourceTypes: Record<string, boolean>;
  minContentLength: number;
  autopilot: AutopilotConfig;
}

const DEFAULT_SETTINGS: FlowSettings = {
  enabled: false,
  sourceTypes: Object.fromEntries(SOURCE_TYPES.map(s => [s.key, true])),
  minContentLength: 10,
  autopilot: {
    enabled: false,
    confidenceThreshold: 0.85,
    exceptions: { neverDeleteAuto: true },
  },
};

export default function FlowSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState<FlowSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/flow/settings');
      const data = response.data?.data || response.data;
      const autopilot = data.autopilot || {
        enabled: data.autoExecuteHighConfidence || false,
        confidenceThreshold: 0.85,
        exceptions: { neverDeleteAuto: true },
      };
      setSettings({
        enabled: data.enabled ?? false,
        sourceTypes: { ...DEFAULT_SETTINGS.sourceTypes, ...(data.sourceTypes || {}) },
        minContentLength: data.minContentLength ?? 10,
        autopilot,
      });
    } catch (error) {
      console.error('Failed to load flow settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.put('/flow/settings', {
        ...settings,
        autoExecuteHighConfidence: settings.autopilot.enabled,
      });
      toast.success('Ustawienia automatycznej analizy zostaly zapisane');
    } catch (error: any) {
      console.error('Failed to save flow settings:', error);
      toast.error(error?.response?.data?.error || 'Nie udalo sie zapisac ustawien');
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceType = (key: string) => {
    setSettings(prev => ({
      ...prev,
      sourceTypes: {
        ...prev.sourceTypes,
        [key]: !prev.sourceTypes[key],
      },
    }));
  };

  const selectAll = () => {
    setSettings(prev => ({
      ...prev,
      sourceTypes: Object.fromEntries(SOURCE_TYPES.map(s => [s.key, true])),
    }));
  };

  const deselectAll = () => {
    setSettings(prev => ({
      ...prev,
      sourceTypes: Object.fromEntries(SOURCE_TYPES.map(s => [s.key, false])),
    }));
  };

  const updateAutopilot = (updates: Partial<AutopilotConfig>) => {
    setSettings(prev => ({
      ...prev,
      autopilot: { ...prev.autopilot, ...updates },
    }));
  };

  const enabledCount = Object.values(settings.sourceTypes).filter(Boolean).length;

  if (initialLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Automatyczna analiza AI"
        subtitle="Konfiguruj automatyczna analize elementow zrodla przez AI"
        icon={Sparkles}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Ustawienia', href: '/dashboard/settings' }, { label: 'Flow AI' }]}
      />

      {/* Master toggle */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wlacz automatyczna analize</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Nowe elementy dodane do Zrodla beda automatycznie analizowane przez AI Flow Engine
            </p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Source types */}
      <div className={`bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Typy zrodel do analizy</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Wybierz ktore typy elementow maja byc automatycznie analizowane ({enabledCount}/{SOURCE_TYPES.length})
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={selectAll} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Zaznacz wszystkie</button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button onClick={deselectAll} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">Odznacz wszystkie</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOURCE_TYPES.map(({ key, label, description, icon: Icon }) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings.sourceTypes[key]
                  ? 'border-indigo-200 dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <input
                type="checkbox"
                checked={settings.sourceTypes[key] ?? true}
                onChange={() => toggleSourceType(key)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
              />
              <Icon className={`h-5 w-5 shrink-0 ${settings.sourceTypes[key] ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced settings */}
      <div className={`bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Zaawansowane</h2>

        <div className="space-y-6">
          {/* Min content length */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Minimalna dlugosc tresci (znaki)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Elementy krotsze niz ta wartosc nie beda analizowane automatycznie
            </p>
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.minContentLength}
              onChange={(e) => setSettings(prev => ({ ...prev, minContentLength: parseInt(e.target.value) || 10 }))}
              className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Autopilot section */}
      <div className={`bg-white/80 backdrop-blur-xl border-2 ${settings.autopilot.enabled ? 'border-amber-300 dark:border-amber-700' : 'border-white/20 dark:border-slate-700/30'} rounded-2xl shadow-sm p-6 mb-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.autopilot.enabled ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <Zap className={`h-5 w-5 ${settings.autopilot.enabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Autopilot</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                AI automatycznie wykonuje akcje gdy pewnosc przekracza prog
              </p>
            </div>
          </div>
          <button
            onClick={() => updateAutopilot({ enabled: !settings.autopilot.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autopilot.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autopilot.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.autopilot.enabled && (
          <div className="space-y-5 mt-4">
            {/* Warning */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Autopilot automatycznie tworzy zadania, projekty i przypisuje do strumieni bez potwierdzenia. Mozesz cofnac kazda akcje w historii.
              </span>
            </div>

            {/* Confidence threshold */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prog pewnosci AI
              </label>
              <div className="space-y-2">
                {CONFIDENCE_THRESHOLDS.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.autopilot.confidenceThreshold === value
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="confidenceThreshold"
                      checked={settings.autopilot.confidenceThreshold === value}
                      onChange={() => updateAutopilot({ confidenceThreshold: value })}
                      className="h-4 w-4 text-amber-500 border-slate-300 dark:border-slate-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Exceptions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Wyjatki
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <input
                  type="checkbox"
                  checked={settings.autopilot.exceptions.neverDeleteAuto}
                  onChange={(e) => updateAutopilot({
                    exceptions: { ...settings.autopilot.exceptions, neverDeleteAuto: e.target.checked }
                  })}
                  className="h-4 w-4 text-amber-500 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Nigdy nie usuwaj automatycznie</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Elementy sugerowane do usuniecia zawsze wymagaja recznego potwierdzenia
                  </div>
                </div>
              </label>
            </div>

            {/* Link to history */}
            <div className="pt-2">
              <Link
                href="/dashboard/flow/autopilot"
                className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium"
              >
                Zobacz historie autopilota
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Zapisywanie...
            </>
          ) : (
            'Zapisz ustawienia'
          )}
        </button>
      </div>
    </PageShell>
  );
}
