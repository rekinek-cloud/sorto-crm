'use client';

import React, { useState, useEffect } from 'react';
import { VoiceResponseInterface } from '@/components/voice/VoiceResponseInterface';
import { VoiceAnalyticsDashboard } from '@/components/voice/VoiceAnalyticsDashboard';
import { VoiceResponseAPI, ABTestConfig, VoiceResponseData } from '@/lib/api/voice-response';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/context';

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
      // Set default preferences
      setUserPreferences({
        voiceSpeed: 'normal',
        formality: 'professional',
        motivation: true,
        analytics: true
      });
    }
  };

  const loadVoiceEngine = () => {
    // Load voice response engine scripts
    const scripts = [
      '/crm/voice-response-engine/voice-response-engine.js',
      '/crm/voice-response-engine/response-handlers.js',
      '/crm/voice-response-engine/nlp-processor.js',
      '/crm/voice-response-engine/ssml-builder.js',
      '/crm/voice-response-engine/ab-testing-framework.js',
      '/crm/voice-response-engine/analytics-tracker.js'
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
      toast.error('Błąd aktualizacji preferencji');
    }
  };

  const createABTest = async (config: ABTestConfig) => {
    try {
      const result = await VoiceResponseAPI.createABTest(config);
      toast.success(`Test A/B utworzony: ${result.testId}`);
      setShowABTestModal(false);
    } catch (error: any) {
      console.error('Failed to create A/B test:', error);
      toast.error('Błąd tworzenia testu A/B');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎤 Asystent Głosowy CRM-GTD
          </h1>
          <p className="text-gray-600">
            Inteligentny system odpowiedzi głosowych z analityką i optymalizacją A/B
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'assistant', label: '🎤 Asystent', desc: 'Głosowy interfejs' },
            { id: 'analytics', label: '📊 Analityka', desc: 'Statystyki i wydajność' },
            { id: 'settings', label: '⚙️ Ustawienia', desc: 'Preferencje i konfiguracja' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-6 py-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-md text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{tab.label}</span>
              <span className="text-xs text-gray-500 mt-1">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Assistant Tab */}
          {activeTab === 'assistant' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Szybkie statystyki</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ostatnie odpowiedzi:</span>
                      <span className="font-semibold">{recentResponses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Użytkownik:</span>
                      <span className="font-semibold">{user?.firstName || user?.email || 'Anonim'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tryb głosu:</span>
                      <span className="font-semibold">
                        {userPreferences?.voiceSpeed || 'normalny'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Responses */}
                {recentResponses.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Ostatnie odpowiedzi</h3>
                    <div className="space-y-2">
                      {recentResponses.map((response, index) => (
                        <div key={response.id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="font-medium text-gray-900">
                            {response.responseType}
                          </div>
                          <div className="text-gray-600 truncate">
                            {response.text.substring(0, 80)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {response.emotionalContext.primaryEmotion} • 
                            {response.generationTime}ms
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Szybkie akcje</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowABTestModal(true)}
                      className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                    >
                      🧪 Utwórz test A/B
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors"
                    >
                      📊 Zobacz analitykę
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded transition-colors"
                    >
                      ⚙️ Dostosuj ustawienia
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <VoiceAnalyticsDashboard />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && userPreferences && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">⚙️ Ustawienia asystenta głosowego</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Preferencje głosu</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prędkość mowy
                    </label>
                    <select
                      value={userPreferences.voiceSpeed || 'normal'}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        voiceSpeed: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="slow">Wolno</option>
                      <option value="normal">Normalnie</option>
                      <option value="fast">Szybko</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Styl komunikacji
                    </label>
                    <select
                      value={userPreferences.formality || 'professional'}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        formality: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="motivation" className="ml-2 text-sm text-gray-700">
                      Włącz motywacyjne frazy
                    </label>
                  </div>
                </div>

                {/* Analytics Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Preferencje analityki</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={userPreferences.analytics || false}
                      onChange={(e) => updatePreferences({
                        ...userPreferences,
                        analytics: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="analytics" className="ml-2 text-sm text-gray-700">
                      Śledź użycie i satysfakcję
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
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="abTesting" className="ml-2 text-sm text-gray-700">
                      Uczestnic w testach A/B
                    </label>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informacje systemowe</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Rozpoznawanie mowy:</span>
                    <span className={`ml-2 ${
                      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
                        ? 'Dostępne' : 'Niedostępne'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Synteza mowy:</span>
                    <span className={`ml-2 ${
                      'speechSynthesis' in window ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {'speechSynthesis' in window ? 'Dostępne' : 'Niedostępne'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Voice Engine:</span>
                    <span className="ml-2 text-blue-600">v1.0</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Język:</span>
                    <span className="ml-2 text-blue-600">Polski (pl-PL)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* A/B Test Creation Modal */}
      {showABTestModal && (
        <ABTestModal
          onClose={() => setShowABTestModal(false)}
          onSubmit={createABTest}
        />
      )}
    </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Utwórz test A/B</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa testu
            </label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ odpowiedzi
            </label>
            <select
              value={config.responseType || 'TASK'}
              onChange={(e) => setConfig({ ...config, responseType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="TASK">Zadania</option>
              <option value="CLIENT">Klienci</option>
              <option value="CALENDAR">Kalendarz</option>
              <option value="GOAL">Cele</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis (opcjonalny)
            </label>
            <textarea
              value={config.description || ''}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Utwórz test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoiceAssistantPage;
