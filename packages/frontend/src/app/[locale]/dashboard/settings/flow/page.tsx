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
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

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

interface FlowSettings {
  enabled: boolean;
  sourceTypes: Record<string, boolean>;
  minContentLength: number;
  autoExecuteHighConfidence: boolean;
}

const DEFAULT_SETTINGS: FlowSettings = {
  enabled: false,
  sourceTypes: Object.fromEntries(SOURCE_TYPES.map(s => [s.key, true])),
  minContentLength: 10,
  autoExecuteHighConfidence: false,
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
      setSettings({
        enabled: data.enabled ?? false,
        sourceTypes: { ...DEFAULT_SETTINGS.sourceTypes, ...(data.sourceTypes || {}) },
        minContentLength: data.minContentLength ?? 10,
        autoExecuteHighConfidence: data.autoExecuteHighConfidence ?? false,
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
      await apiClient.put('/flow/settings', settings);
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

          {/* Auto-execute */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSettings(prev => ({ ...prev, autoExecuteHighConfidence: !prev.autoExecuteHighConfidence }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-0.5 ${
                  settings.autoExecuteHighConfidence ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoExecuteHighConfidence ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <div className="text-sm font-medium text-gray-900">Automatyczne wykonanie (wysoka pewność)</div>
                <p className="text-xs text-gray-500 mt-1">
                  Elementy z pewnością AI &ge; 85% zostaną automatycznie przetworzone bez potwierdzenia użytkownika
                </p>
                {settings.autoExecuteHighConfidence && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-700">
                      Uwaga: AI będzie automatycznie tworzyć zadania, projekty i przypisywać do strumieni bez Twojego potwierdzenia
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
