'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VoiceResponseInterface } from '@/components/voice/VoiceResponseInterface';
import { VoiceAnalyticsDashboard } from '@/components/voice/VoiceAnalyticsDashboard';
import { VoiceResponseAPI, ABTestConfig, VoiceResponseData } from '@/lib/api/voice-response';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/context';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Mic,
  BarChart3,
  Settings,
  FlaskConical,
  Activity,
  X
} from 'lucide-react';

const VoiceAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assistant');
  const [showABTestModal, setShowABTestModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [recentResponses, setRecentResponses] = useState<VoiceResponseData[]>([]);

  useEffect(() => {
    loadUserPreferences();
    loadVoiceEngine();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const preferences = await VoiceResponseAPI.getUserPreferences();
      setUserPreferences(preferences);
    } catch (error: any) {
      console.error('Failed to load user preferences:', error);
      setUserPreferences({
        voiceSpeed: 'normal',
        formality: 'professional',
        motivation: true,
        analytics: true
      });
    }
  };

  const loadVoiceEngine = () => {
    const scripts = [
      '/voice-response-engine/voice-response-engine.js',
      '/voice-response-engine/response-handlers.js',
      '/voice-response-engine/nlp-processor.js',
      '/voice-response-engine/ssml-builder.js',
      '/voice-response-engine/ab-testing-framework.js',
      '/voice-response-engine/analytics-tracker.js'
    ];

    scripts.forEach((src) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => console.log(`Loaded: ${src}`);
      script.onerror = () => console.error(`Failed to load: ${src}`);
      document.head.appendChild(script);
    });
  };

  const handleResponse = (response: VoiceResponseData) => {
    setRecentResponses(prev => [response, ...prev.slice(0, 4)]);
  };

  const updatePreferences = async (newPreferences: any) => {
    try {
      await VoiceResponseAPI.updateUserPreferences(newPreferences);
      setUserPreferences(newPreferences);
      toast.success('Preferencje zaktualizowane!');
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      toast.error('Blad aktualizacji preferencji');
    }
  };

  const createABTest = async (config: ABTestConfig) => {
    try {
      const result = await VoiceResponseAPI.createABTest(config);
      toast.success(`Test A/B utworzony: ${result.testId}`);
      setShowABTestModal(false);
    } catch (error: any) {
      console.error('Failed to create A/B test:', error);
      toast.error('Blad tworzenia testu A/B');
    }
  };

  const tabs = [
    { id: 'assistant', label: 'Asystent', icon: Mic, desc: 'Glosowy interfejs' },
    { id: 'analytics', label: 'Analityka', icon: BarChart3, desc: 'Statystyki i wydajnosc' },
    { id: 'settings', label: 'Ustawienia', icon: Settings, desc: 'Preferencje i konfiguracja' }
  ];

  return (
    <PageShell>
      <PageHeader
        title="Asystent glosowy"
        subtitle="Steruj aplikacja glosem"
        icon={Mic}
        iconColor="text-rose-600"
        breadcrumbs={[{ label: 'Asystent glosowy' }]}
      />

      <div className="space-y-6">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="inline-flex bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-sm">{tab.label}</span>
                  <span className={`text-xs mt-0.5 ${activeTab === tab.id ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>{tab.desc}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        {/* Assistant Tab */}
        {activeTab === 'assistant' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Voice Interface */}
            <div className="lg:col-span-2">
              <VoiceResponseInterface
                onResponse={handleResponse}
                context={{
                  userId: user?.id,
                  productivity: 0.8,
                  emotionalState: 'focused',
                  userPreferences
                }}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Szybkie statystyki</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ostatnie odpowiedzi:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{recentResponses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Uzytkownik:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Anonim'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Tryb glosu:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {userPreferences?.voiceSpeed || 'normalny'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Responses */}
              {recentResponses.length > 0 && (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Ostatnie odpowiedzi</h3>
                  <div className="space-y-2">
                    {recentResponses.map((response, index) => (
                      <div key={response.id} className="text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {response.responseType}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 truncate">
                          {response.text.substring(0, 80)}...
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {response.emotionalContext.primaryEmotion} /
                          {response.generationTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Szybkie akcje</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowABTestModal(true)}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl transition-colors"
                  >
                    <FlaskConical className="h-4 w-4" />
                    Utworz test A/B
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Zobacz analityke
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Dostosuj ustawienia
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <VoiceAnalyticsDashboard />
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && userPreferences && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-500" />
                Ustawienia asystenta glosowego
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Preferencje glosu</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Predkosc mowy
                    </label>
                    <select
                      value={userPreferences.voiceSpeed || 'normal'}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        voiceSpeed: e.target.value
                      })}
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                    >
                      <option value="slow">Wolno</option>
                      <option value="normal">Normalnie</option>
                      <option value="fast">Szybko</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Styl komunikacji
                    </label>
                    <select
                      value={userPreferences.formality || 'professional'}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        formality: e.target.value
                      })}
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                    >
                      <option value="casual">Nieformalny</option>
                      <option value="professional">Profesjonalny</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="motivation"
                      checked={userPreferences.motivation || false}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        motivation: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded"
                    />
                    <label htmlFor="motivation" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                      Wlacz motywacyjne frazy
                    </label>
                  </div>
                </div>

                {/* Analytics Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Preferencje analityki</h3>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={userPreferences.analytics || false}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        analytics: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded"
                    />
                    <label htmlFor="analytics" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                      Sledz uzycie i satysfakcje
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="abTesting"
                      checked={userPreferences.abTesting || false}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        abTesting: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded"
                    />
                    <label htmlFor="abTesting" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                      Uczestnicz w testach A/B
                    </label>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Informacje systemowe</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Rozpoznawanie mowy:</span>
                    <span className={`ml-2 ${
                      typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
                        ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
                        ? 'Dostepne' : 'Niedostepne'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Synteza mowy:</span>
                    <span className={`ml-2 ${
                      typeof window !== 'undefined' && 'speechSynthesis' in window ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {typeof window !== 'undefined' && 'speechSynthesis' in window ? 'Dostepne' : 'Niedostepne'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Voice Engine:</span>
                    <span className="ml-2 text-blue-600 dark:text-blue-400">v1.0</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Jezyk:</span>
                    <span className="ml-2 text-blue-600 dark:text-blue-400">Polski (pl-PL)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* A/B Test Creation Modal */}
      {showABTestModal && (
        <ABTestModal
          onClose={() => setShowABTestModal(false)}
          onSubmit={createABTest}
        />
      )}
    </PageShell>
  );
};

// A/B Test Creation Modal Component
interface ABTestModalProps {
  onClose: () => void;
  onSubmit: (config: ABTestConfig) => void;
}

const ABTestModal: React.FC<ABTestModalProps> = ({ onClose, onSubmit }) => {
  const [config, setConfig] = useState<Partial<ABTestConfig>>({
    name: '',
    description: '',
    responseType: 'TASK',
    variants: [
      { name: 'Wariant A', weight: 0.5 },
      { name: 'Wariant B', weight: 0.5 }
    ],
    metrics: ['conversion_rate', 'user_satisfaction'],
    minSampleSize: 100,
    confidenceLevel: 0.95
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.name && config.responseType && config.variants) {
      onSubmit(config as ABTestConfig);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 border border-white/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Utworz test A/B</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nazwa testu
            </label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Typ odpowiedzi
            </label>
            <select
              value={config.responseType || 'TASK'}
              onChange={(e) => setConfig({ ...config, responseType: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
            >
              <option value="TASK">Zadania</option>
              <option value="CLIENT">Klienci</option>
              <option value="CALENDAR">Kalendarz</option>
              <option value="GOAL">Cele</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Opis (opcjonalny)
            </label>
            <textarea
              value={config.description || ''}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
              rows={2}
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-xl transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors"
            >
              Utworz test
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default VoiceAssistantPage;
