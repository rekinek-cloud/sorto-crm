'use client';

/**
 * GTDConfigModal - Modal do konfiguracji zaawansowanych ustawień GTD dla streama
 * Obsługuje wszystkie aspekty konfiguracji GTD: inbox behavior, konteksty, automatyzacje, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as CogIcon,
  Clock,
  Zap,
  BarChart3,
  Check,
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface GTDConfigModalProps {
  stream: {
    id: string;
    name: string;
    gtdRole?: string;
    gtdConfig?: any;
  };
  onClose: () => void;
  onSave: (config: any) => void;
}

const CONTEXTS = [
  { value: '@computer', label: '@computer', description: 'Zadania przy komputerze' },
  { value: '@phone', label: '@phone', description: 'Rozmowy telefoniczne' },
  { value: '@office', label: '@office', description: 'Zadania w biurze' },
  { value: '@home', label: '@home', description: 'Praca zdalna/domowa' },
  { value: '@errands', label: '@errands', description: 'Sprawy poza biurem' },
  { value: '@online', label: '@online', description: 'Zadania internetowe' },
  { value: '@waiting', label: '@waiting', description: 'Oczekiwanie na odpowiedź' },
  { value: '@reading', label: '@reading', description: 'Materiały do przeczytania' }
];

const ENERGY_LEVELS = [
  { value: 'HIGH', label: 'Wysoka', description: 'Trudne, wymagające zadania' },
  { value: 'MEDIUM', label: 'Średnia', description: 'Standardowe zadania' },
  { value: 'LOW', label: 'Niska', description: 'Proste, rutynowe zadania' },
  { value: 'CREATIVE', label: 'Kreatywna', description: 'Zadania twórcze' },
  { value: 'ADMINISTRATIVE', label: 'Administracyjna', description: 'Zadania biurowe' }
];

const REVIEW_FREQUENCIES = [
  { value: 'DAILY', label: 'Codzienny', description: 'Przegląd każdego dnia' },
  { value: 'WEEKLY', label: 'Tygodniowy', description: 'Przegląd co tydzień' },
  { value: 'MONTHLY', label: 'Miesięczny', description: 'Przegląd co miesiąc' },
  { value: 'QUARTERLY', label: 'Kwartalny', description: 'Przegląd co kwartał' },
  { value: 'CUSTOM', label: 'Niestandardowy', description: 'Własny harmonogram' }
];

const GTDConfigModal: React.FC<GTDConfigModalProps> = ({
  stream,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');

  // Fetch current config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/v1/stream-management/${stream.id}/config`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setConfig(data.data);
        } else {
          // Set default config
          setConfig(getDefaultConfig(stream.gtdRole));
        }
      } catch (error: any) {
        console.error('Error fetching config:', error);
        setConfig(getDefaultConfig(stream.gtdRole));
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [stream.id, stream.gtdRole]);

  const getDefaultConfig = (role?: string) => ({
    inboxBehavior: {
      autoProcessing: false,
      autoCreateTasks: true,
      defaultContext: '@computer',
      defaultEnergyLevel: 'MEDIUM',
      processAfterDays: 3,
      purgeAfterDays: 30
    },
    availableContexts: ['@computer', '@phone', '@office', '@home'],
    energyLevels: ['HIGH', 'MEDIUM', 'LOW'],
    reviewFrequency: role === 'INBOX' ? 'DAILY' : 'WEEKLY',
    processingRules: [],
    automations: [],
    advanced: {
      enableAI: true,
      autoAssignContext: true,
      autoSetEnergyLevel: true,
      enableBulkProcessing: false,
      maxInboxItems: 100
    },
    analytics: {
      trackProcessingTime: true,
      trackDecisionTypes: true,
      generateInsights: true,
      enableReporting: true
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm('Czy na pewno chcesz przywrócić domyślną konfigurację?')) {
      setConfig(getDefaultConfig(stream.gtdRole));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Ustawienia strumienia - {stream.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Dostosuj zachowanie strumienia
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'inbox', label: 'Inbox', icon: <CogIcon className="w-4 h-4" /> },
              { id: 'contexts', label: 'Konteksty', icon: <Zap className="w-4 h-4" /> },
              { id: 'automation', label: 'Automatyzacja', icon: <Clock className="w-4 h-4" /> },
              { id: 'analytics', label: 'Analityka', icon: <BarChart3 className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Inbox Behavior */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Zachowanie Inbox</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Automatyczne przetwarzanie
                      </label>
                      <p className="text-xs text-gray-500">
                        Automatycznie przetwarzaj elementy według reguł
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.inboxBehavior?.autoProcessing || false}
                      onChange={(e) => setConfig({
                        ...config,
                        inboxBehavior: {
                          ...config.inboxBehavior,
                          autoProcessing: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Automatyczne tworzenie zadań
                      </label>
                      <p className="text-xs text-gray-500">
                        Tworz zadania z elementów inbox
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.inboxBehavior?.autoCreateTasks || false}
                      onChange={(e) => setConfig({
                        ...config,
                        inboxBehavior: {
                          ...config.inboxBehavior,
                          autoCreateTasks: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domyślny kontekst
                    </label>
                    <select
                      value={config?.inboxBehavior?.defaultContext || '@computer'}
                      onChange={(e) => setConfig({
                        ...config,
                        inboxBehavior: {
                          ...config.inboxBehavior,
                          defaultContext: e.target.value
                        }
                      })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      {CONTEXTS.map(context => (
                        <option key={context.value} value={context.value}>
                          {context.label} - {context.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domyślny poziom energii
                    </label>
                    <select
                      value={config?.inboxBehavior?.defaultEnergyLevel || 'MEDIUM'}
                      onChange={(e) => setConfig({
                        ...config,
                        inboxBehavior: {
                          ...config.inboxBehavior,
                          defaultEnergyLevel: e.target.value
                        }
                      })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      {ENERGY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Przetwarzaj po (dni)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={config?.inboxBehavior?.processAfterDays || 3}
                        onChange={(e) => setConfig({
                          ...config,
                          inboxBehavior: {
                            ...config.inboxBehavior,
                            processAfterDays: parseInt(e.target.value)
                          }
                        })}
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuń po (dni)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={config?.inboxBehavior?.purgeAfterDays || 30}
                        onChange={(e) => setConfig({
                          ...config,
                          inboxBehavior: {
                            ...config.inboxBehavior,
                            purgeAfterDays: parseInt(e.target.value)
                          }
                        })}
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Częstotliwość przeglądu</h3>
                <div className="grid grid-cols-2 gap-3">
                  {REVIEW_FREQUENCIES.map(freq => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        reviewFrequency: freq.value
                      })}
                      className={`
                        p-3 rounded-lg border text-left transition-all
                        ${config?.reviewFrequency === freq.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-medium">{freq.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{freq.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contexts */}
          {activeTab === 'contexts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dostępne konteksty</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Wybierz konteksty dostępne w tym streamie
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {CONTEXTS.map(context => {
                    const isSelected = config?.availableContexts?.includes(context.value);
                    return (
                      <button
                        key={context.value}
                        type="button"
                        onClick={() => {
                          const contexts = config?.availableContexts || [];
                          const newContexts = isSelected
                            ? contexts.filter((c: string) => c !== context.value)
                            : [...contexts, context.value];
                          setConfig({
                            ...config,
                            availableContexts: newContexts
                          });
                        }}
                        className={`
                          p-3 rounded-lg border text-left transition-all
                          ${isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{context.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{context.description}</div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Poziomy energii</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ENERGY_LEVELS.map(level => {
                    const isSelected = config?.energyLevels?.includes(level.value);
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => {
                          const levels = config?.energyLevels || [];
                          const newLevels = isSelected
                            ? levels.filter((l: string) => l !== level.value)
                            : [...levels, level.value];
                          setConfig({
                            ...config,
                            energyLevels: newLevels
                          });
                        }}
                        className={`
                          p-3 rounded-lg border text-left transition-all
                          ${isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{level.description}</div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Automation */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Zaawansowane ustawienia</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Włącz analizę AI
                      </label>
                      <p className="text-xs text-gray-500">
                        Używaj AI do analizy i kategoryzacji elementów
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.advanced?.enableAI || false}
                      onChange={(e) => setConfig({
                        ...config,
                        advanced: {
                          ...config.advanced,
                          enableAI: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Auto-przypisuj kontekst
                      </label>
                      <p className="text-xs text-gray-500">
                        Automatycznie przypisuj kontekst na podstawie treści
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.advanced?.autoAssignContext || false}
                      onChange={(e) => setConfig({
                        ...config,
                        advanced: {
                          ...config.advanced,
                          autoAssignContext: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Auto-ustaw poziom energii
                      </label>
                      <p className="text-xs text-gray-500">
                        Automatycznie oceniaj wymagany poziom energii
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.advanced?.autoSetEnergyLevel || false}
                      onChange={(e) => setConfig({
                        ...config,
                        advanced: {
                          ...config.advanced,
                          autoSetEnergyLevel: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Włącz masowe przetwarzanie
                      </label>
                      <p className="text-xs text-gray-500">
                        Pozwól na przetwarzanie wielu elementów naraz
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.advanced?.enableBulkProcessing || false}
                      onChange={(e) => setConfig({
                        ...config,
                        advanced: {
                          ...config.advanced,
                          enableBulkProcessing: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksymalna liczba elementów w inbox
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={config?.advanced?.maxInboxItems || 100}
                      onChange={(e) => setConfig({
                        ...config,
                        advanced: {
                          ...config.advanced,
                          maxInboxItems: parseInt(e.target.value)
                        }
                      })}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ustawienia analityki</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Śledź czas przetwarzania
                      </label>
                      <p className="text-xs text-gray-500">
                        Mierz czas potrzebny na przetworzenie elementów
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.analytics?.trackProcessingTime || false}
                      onChange={(e) => setConfig({
                        ...config,
                        analytics: {
                          ...config.analytics,
                          trackProcessingTime: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Śledź typy decyzji
                      </label>
                      <p className="text-xs text-gray-500">
                        Analizuj jakie decyzje podejmujesz najczęściej
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.analytics?.trackDecisionTypes || false}
                      onChange={(e) => setConfig({
                        ...config,
                        analytics: {
                          ...config.analytics,
                          trackDecisionTypes: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Generuj insights
                      </label>
                      <p className="text-xs text-gray-500">
                        Twórz automatyczne rekomendacje i spostrzeżenia
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.analytics?.generateInsights || false}
                      onChange={(e) => setConfig({
                        ...config,
                        analytics: {
                          ...config.analytics,
                          generateInsights: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Włącz raportowanie
                      </label>
                      <p className="text-xs text-gray-500">
                        Generuj okresowe raporty efektywności
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config?.analytics?.enableReporting || false}
                      onChange={(e) => setConfig({
                        ...config,
                        analytics: {
                          ...config.analytics,
                          enableReporting: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">Informacja o analityce</div>
                    <p className="text-blue-700">
                      Dane analityczne pomagają optymalizować Twój workflow.
                      Wszystkie dane są anonimizowane i używane tylko do generowania
                      personalnych insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset do domyślnych
          </Button>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Anuluj
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Zapisz konfigurację
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GTDConfigModal;