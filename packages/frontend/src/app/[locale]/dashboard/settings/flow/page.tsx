'use client';

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MicrophoneIcon,
  PhoneIcon,
  CameraIcon,
  DocumentIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import Link from 'next/link';

// Source type definitions matching InboxSourceType enum
const SOURCE_TYPES = [
  { key: 'QUICK_CAPTURE', label: 'Szybkie dodanie', description: 'Ręcznie wpisane elementy', icon: ArchiveBoxIcon },
  { key: 'MEETING_NOTES', label: 'Notatki ze spotkań', description: 'Notatki z rozmów, spotkań', icon: ClipboardDocumentListIcon },
  { key: 'PHONE_CALL', label: 'Rozmowy telefoniczne', description: 'Notatki z rozmów telefonicznych', icon: PhoneIcon },
  { key: 'EMAIL', label: 'E-maile', description: 'E-maile wymagające akcji', icon: EnvelopeIcon },
  { key: 'IDEA', label: 'Pomysły', description: 'Pomysły do analizy', icon: LightBulbIcon },
  { key: 'DOCUMENT', label: 'Dokumenty', description: 'Dokumenty, pliki', icon: DocumentTextIcon },
  { key: 'BILL_INVOICE', label: 'Faktury', description: 'Faktury i rachunki', icon: DocumentIcon },
  { key: 'ARTICLE', label: 'Artykuły', description: 'Artykuły, linki', icon: DocumentTextIcon },
  { key: 'VOICE_MEMO', label: 'Nagrania głosowe', description: 'Nagrania głosowe i dyktafon', icon: MicrophoneIcon },
  { key: 'PHOTO', label: 'Zdjęcia', description: 'Zdjęcia dokumentów, wizytówek', icon: CameraIcon },
  { key: 'OTHER', label: 'Inne', description: 'Wszystko inne', icon: ArchiveBoxIcon },
];

const CONFIDENCE_THRESHOLDS = [
  { value: 0.95, label: 'Ostrożny (95%)', description: 'Tylko najbardziej oczywiste elementy' },
  { value: 0.90, label: 'Standardowy (90%)', description: 'Dobra równowaga między automatyzacją a kontrolą' },
  { value: 0.85, label: 'Umiarkowany (85%)', description: 'Więcej automatyzacji, czasem niepewne decyzje' },
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
      toast.success('Ustawienia automatycznej analizy zostały zapisane');
    } catch (error: any) {
      console.error('Failed to save flow settings:', error);
      toast.error(error?.response?.data?.error || 'Nie udało się zapisać ustawień');
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
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <SparklesIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automatyczna analiza AI</h1>
          <p className="text-sm text-gray-600">Konfiguruj automatyczną analizę elementów źródła przez AI</p>
        </div>
      </div>

      {/* Master toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Włącz automatyczną analizę</h2>
            <p className="text-sm text-gray-500 mt-1">
              Nowe elementy dodane do Źródła będą automatycznie analizowane przez AI Flow Engine
            </p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
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
      <div className={`bg-white rounded-xl border border-gray-200 p-6 mb-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Typy źródeł do analizy</h2>
            <p className="text-sm text-gray-500 mt-1">
              Wybierz które typy elementów mają być automatycznie analizowane ({enabledCount}/{SOURCE_TYPES.length})
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={selectAll} className="text-indigo-600 hover:text-indigo-800">Zaznacz wszystkie</button>
            <span className="text-gray-300">|</span>
            <button onClick={deselectAll} className="text-gray-500 hover:text-gray-700">Odznacz wszystkie</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOURCE_TYPES.map(({ key, label, description, icon: Icon }) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings.sourceTypes[key]
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={settings.sourceTypes[key] ?? true}
                onChange={() => toggleSourceType(key)}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <Icon className={`h-5 w-5 shrink-0 ${settings.sourceTypes[key] ? 'text-indigo-600' : 'text-gray-400'}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced settings */}
      <div className={`bg-white rounded-xl border border-gray-200 p-6 mb-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zaawansowane</h2>

        <div className="space-y-6">
          {/* Min content length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimalna długość treści (znaki)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Elementy krótsze niż ta wartość nie będą analizowane automatycznie
            </p>
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.minContentLength}
              onChange={(e) => setSettings(prev => ({ ...prev, minContentLength: parseInt(e.target.value) || 10 }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Autopilot section */}
      <div className={`bg-white rounded-xl border-2 ${settings.autopilot.enabled ? 'border-amber-300' : 'border-gray-200'} p-6 mb-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.autopilot.enabled ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <BoltIcon className={`h-5 w-5 ${settings.autopilot.enabled ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Autopilot</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                AI automatycznie wykonuje akcje gdy pewność przekracza próg
              </p>
            </div>
          </div>
          <button
            onClick={() => updateAutopilot({ enabled: !settings.autopilot.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autopilot.enabled ? 'bg-amber-500' : 'bg-gray-300'
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
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                Autopilot automatycznie tworzy zadania, projekty i przypisuje do strumieni bez potwierdzenia. Możesz cofnąć każdą akcję w historii.
              </span>
            </div>

            {/* Confidence threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próg pewności AI
              </label>
              <div className="space-y-2">
                {CONFIDENCE_THRESHOLDS.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.autopilot.confidenceThreshold === value
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="confidenceThreshold"
                      checked={settings.autopilot.confidenceThreshold === value}
                      onChange={() => updateAutopilot({ confidenceThreshold: value })}
                      className="h-4 w-4 text-amber-500 border-gray-300 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Exceptions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wyjątki
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.autopilot.exceptions.neverDeleteAuto}
                  onChange={(e) => updateAutopilot({
                    exceptions: { ...settings.autopilot.exceptions, neverDeleteAuto: e.target.checked }
                  })}
                  className="h-4 w-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Nigdy nie usuwaj automatycznie</div>
                  <div className="text-xs text-gray-500">
                    Elementy sugerowane do usunięcia zawsze wymagają ręcznego potwierdzenia
                  </div>
                </div>
              </label>
            </div>

            {/* Link to history */}
            <div className="pt-2">
              <Link
                href="/dashboard/flow/autopilot"
                className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-medium"
              >
                Zobacz historię autopilota
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
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
    </div>
  );
}
