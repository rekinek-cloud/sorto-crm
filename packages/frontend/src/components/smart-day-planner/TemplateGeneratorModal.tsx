'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wand2, 
  Settings, 
  Clock, 
  Target,
  Sparkles,
  Calendar,
  Download,
  Save,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  smartDayPlannerApi, 
  type UserProfile, 
  type DayTemplate, 
  type GenerateTemplateRequest 
} from '../../lib/api/smartDayPlanner';

interface TemplateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateGenerated?: (template: DayTemplate) => void;
}

const TEMPLATE_TYPES = [
  {
    value: 'WORKDAY',
    label: 'Dzień roboczy',
    icon: '💼',
    description: 'Standardowy dzień pracy z balansem zadań',
    color: 'border-blue-500 bg-blue-50'
  },
  {
    value: 'CREATIVE',
    label: 'Dzień kreatywny',
    icon: '🎨',
    description: 'Skupienie na kreatywności i innowacjach',
    color: 'border-purple-500 bg-purple-50'
  },
  {
    value: 'ADMIN',
    label: 'Dzień administracyjny',
    icon: '📊',
    description: 'Zadania administracyjne i organizacyjne',
    color: 'border-gray-500 bg-gray-50'
  },
  {
    value: 'MEETING',
    label: 'Dzień spotkań',
    icon: '🤝',
    description: 'Komunikacja i współpraca z zespołem',
    color: 'border-green-500 bg-green-50'
  },
  {
    value: 'MIXED',
    label: 'Dzień mieszany',
    icon: '🔄',
    description: 'Kombinacja różnych typów zadań',
    color: 'border-orange-500 bg-orange-50'
  }
];

const INTENSITY_LEVELS = [
  {
    value: 'LIGHT',
    label: 'Lekki',
    icon: '🌤️',
    description: 'Spokojny dzień z więcej przerwami',
    workTime: '5-6h',
    breaks: 'Częste'
  },
  {
    value: 'MEDIUM',
    label: 'Średni',
    icon: '⚡',
    description: 'Standardowa intensywność pracy',
    workTime: '7-8h',
    breaks: 'Regularne'
  },
  {
    value: 'HEAVY',
    label: 'Intensywny',
    icon: '🔥',
    description: 'Wysokie obciążenie z krótkimi przerwami',
    workTime: '8-9h',
    breaks: 'Minimalne'
  }
];

const FOCUS_STYLES = [
  {
    value: 'DEEP_WORK',
    label: 'Głęboka praca',
    icon: '🧠',
    description: 'Długie bloki koncentracji',
    blockLength: '90-120 min'
  },
  {
    value: 'MEETINGS',
    label: 'Spotkania',
    icon: '📞',
    description: 'Komunikacja i współpraca',
    blockLength: '30-90 min'
  },
  {
    value: 'CREATIVE',
    label: 'Kreatywność',
    icon: '🎭',
    description: 'Sesje brainstormingu i design',
    blockLength: '60-90 min'
  },
  {
    value: 'ADMIN',
    label: 'Administracja',
    icon: '📋',
    description: 'Zadania organizacyjne',
    blockLength: '30-60 min'
  },
  {
    value: 'MIXED',
    label: 'Mieszany',
    icon: '🎯',
    description: 'Różnorodne style pracy',
    blockLength: 'Zmienny'
  }
];

export default function TemplateGeneratorModal({ 
  isOpen, 
  onClose, 
  onTemplateGenerated 
}: TemplateGeneratorModalProps) {
  const [step, setStep] = useState(1); // 1 = Config, 2 = Profile Check, 3 = Generate, 4 = Preview
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<DayTemplate | null>(null);
  
  const [templateConfig, setTemplateConfig] = useState<GenerateTemplateRequest>({
    templateType: 'WORKDAY',
    dayIntensity: 'MEDIUM',
    focusStyle: 'MIXED',
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  // Auto-generate template when reaching step 3
  useEffect(() => {
    if (step === 3 && !loading && !generatedTemplate) {
      generateTemplate();
    }
  }, [step]);

  const fetchUserProfile = async () => {
    try {
      const response = await smartDayPlannerApi.getUserProfile();
      if (response.success) {
        setUserProfile(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast.error('Błąd podczas pobierania profilu użytkownika');
    }
  };

  const generateTemplate = async () => {
    setLoading(true);
    try {
      console.log('Generating template with config:', templateConfig);
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30s timeout
      );
      
      const response = await Promise.race([
        smartDayPlannerApi.generateTemplate({
          ...templateConfig,
          name: templateConfig.name || `${templateConfig.templateType} Template`
        }),
        timeoutPromise
      ]) as any;

      console.log('Template generation response:', response);

      if (response.success) {
        setGeneratedTemplate(response.data);
        setStep(4);
        toast.success('Szablon został wygenerowany!');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error generating template:', error);
      
      if (error.message === 'Request timeout') {
        toast.error('Generowanie szablonu zajęło zbyt długo. Spróbuj ponownie.');
      } else if (error.response?.status === 401) {
        toast.error('Brak autoryzacji. Zaloguj się ponownie.');
      } else if (error.response?.status === 404) {
        toast.error('Endpoint nie został znaleziony. Sprawdź konfigurację backendu.');
      } else {
        toast.error(`Błąd podczas generowania szablonu: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!generatedTemplate) return;
    
    try {
      onTemplateGenerated?.(generatedTemplate);
      toast.success('Szablon został zapisany!');
      onClose();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error('Błąd podczas zapisywania szablonu');
    }
  };

  const resetGenerator = () => {
    setStep(1);
    setGeneratedTemplate(null);
    setTemplateConfig({
      templateType: 'WORKDAY',
      dayIntensity: 'MEDIUM',
      focusStyle: 'MIXED',
      name: '',
      description: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Day Template Generator</h2>
                <p className="text-indigo-100">Wygeneruj idealny szablon dnia na podstawie swojego profilu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            {[
              { num: 1, label: 'Konfiguracja' },
              { num: 2, label: 'Profil' },
              { num: 3, label: 'Generowanie' },
              { num: 4, label: 'Podgląd' }
            ].map((stepItem, index) => (
              <div key={stepItem.num} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= stepItem.num 
                    ? 'bg-white text-indigo-600' 
                    : 'bg-indigo-400 text-white'
                }`}>
                  {step > stepItem.num ? '✓' : stepItem.num}
                </div>
                <span className="ml-2 text-sm text-indigo-100">{stepItem.label}</span>
                {index < 3 && (
                  <div className={`mx-4 h-px w-8 ${
                    step > stepItem.num ? 'bg-white' : 'bg-indigo-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Konfiguruj swój idealny dzień</h3>
                <p className="text-gray-600">Wybierz typ, intensywność i styl pracy dla swojego szablonu</p>
              </div>

              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa szablonu
                </label>
                <input
                  type="text"
                  value={templateConfig.name}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="np. Mój Produktywny Poniedziałek"
                />
              </div>

              {/* Template Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Target className="inline h-4 w-4 mr-1" />
                  Typ dnia
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TEMPLATE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTemplateConfig({ ...templateConfig, templateType: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        templateConfig.templateType === type.value
                          ? type.color
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Sparkles className="inline h-4 w-4 mr-1" />
                  Intensywność dnia
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INTENSITY_LEVELS.map((intensity) => (
                    <button
                      key={intensity.value}
                      type="button"
                      onClick={() => setTemplateConfig({ ...templateConfig, dayIntensity: intensity.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        templateConfig.dayIntensity === intensity.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{intensity.icon}</div>
                      <div className="font-medium text-gray-900">{intensity.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{intensity.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        <div>Praca: {intensity.workTime}</div>
                        <div>Przerwy: {intensity.breaks}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Styl koncentracji
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FOCUS_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setTemplateConfig({ ...templateConfig, focusStyle: style.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        templateConfig.focusStyle === style.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <div className="font-medium text-gray-900">{style.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{style.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        Bloki: {style.blockLength}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis szablonu (opcjonalnie)
                </label>
                <textarea
                  value={templateConfig.description}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Opisz w jakich sytuacjach będziesz używać tego szablonu..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  Dalej <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Profile Check */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sprawdź swój profil</h3>
                <p className="text-gray-600">AI wykorzysta Twoje preferencje do wygenerowania idealnego szablonu</p>
              </div>

              {userProfile ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900 mb-2">Profil skonfigurowany ✓</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>• Czas pracy: {userProfile.workStartTime} - {userProfile.workEndTime}</div>
                        <div>• Częstotliwość przerw: co {userProfile.breakFrequency} minut</div>
                        <div>• Długość przerw: {userProfile.breakDuration} minut</div>
                        <div>• Preferowane konteksty: {userProfile.preferredContexts?.length || 0} zdefiniowanych</div>
                        <div>• Wzorce energii: {userProfile.energyPeaks?.length || 0} szczytów zdefiniowanych</div>
                      </div>
                      <p className="text-xs text-green-700 mt-3">
                        AI wykorzysta te ustawienia do wygenerowania personalizowanego szablonu
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500 text-white rounded-full p-2">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-900 mb-2">Profil wymagajeTechnical konfiguracji</h4>
                      <p className="text-sm text-amber-800 mb-3">
                        AI utworzy domyślny szablon, ale zalecamy skonfigurowanie profilu dla lepszych wyników.
                      </p>
                      <button
                        onClick={() => {
                          // TODO: Open profile configuration modal
                          toast('Funkcja konfiguracji profilu będzie wkrótce dostępna');
                        }}
                        className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Skonfiguruj profil
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Preview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Podgląd konfiguracji</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Typ</div>
                    <div className="font-medium">{TEMPLATE_TYPES.find(t => t.value === templateConfig.templateType)?.label}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Intensywność</div>
                    <div className="font-medium">{INTENSITY_LEVELS.find(i => i.value === templateConfig.dayIntensity)?.label}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Styl</div>
                    <div className="font-medium">{FOCUS_STYLES.find(s => s.value === templateConfig.focusStyle)?.label}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Nazwa</div>
                    <div className="font-medium">{templateConfig.name || 'Domyślna'}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Wstecz
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Generuj szablon
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="animate-spin text-6xl mb-6">🤖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI generuje Twój szablon...</h3>
                <p className="text-gray-600 mb-6">Analizuję Twój profil i tworzę optymalny harmonogram</p>
                
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: loading ? '75%' : '100%' }}></div>
                  </div>
                  
                  {loading && (
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>Przetwarzam dane... To może potrwać do 30 sekund</div>
                      <div className="text-xs text-gray-500">
                        Analizuję profil użytkownika, optymalizuję energię i konteksty...
                      </div>
                    </div>
                  )}
                  
                  {!loading && !generatedTemplate && (
                    <button
                      onClick={generateTemplate}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Wand2 className="h-5 w-5" />
                      Ponów generowanie
                    </button>
                  )}
                </div>
              </div>

              {!loading && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Wstecz
                  </button>
                  <button
                    onClick={() => {
                      if (!generatedTemplate) {
                        generateTemplate();
                      }
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Generowanie...' : 'Spróbuj ponownie'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview Generated Template */}
          {step === 4 && generatedTemplate && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">🎉 Twój szablon jest gotowy!</h3>
                <p className="text-gray-600">Sprawdź wygenerowany harmonogram i zapisz go do wykorzystania</p>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{generatedTemplate.blocksCount}</div>
                  <div className="text-sm text-blue-800">Bloków</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(generatedTemplate.totalWorkTime / 60)}h</div>
                  <div className="text-sm text-green-800">Praca</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(generatedTemplate.totalBreakTime / 60)}h</div>
                  <div className="text-sm text-orange-800">Przerwy</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{Math.round((generatedTemplate.aiConfidence || 0) * 100)}%</div>
                  <div className="text-sm text-purple-800">Pewność AI</div>
                </div>
              </div>

              {/* Template Preview */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Podgląd harmonogramu: {generatedTemplate.name}
                </h4>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {JSON.parse(generatedTemplate.timeBlocks).map((block: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        block.isBreak 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono text-gray-600">
                          {block.startTime} - {block.endTime}
                        </div>
                        <div className="font-medium">
                          {block.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {!block.isBreak && (
                          <>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              block.energyLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                              block.energyLevel === 'CREATIVE' ? 'bg-purple-100 text-purple-800' :
                              block.energyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              block.energyLevel === 'ADMINISTRATIVE' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {block.energyLevel}
                            </span>
                            <span className="text-gray-500">{block.primaryContext}</span>
                          </>
                        )}
                        {block.isBreak && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            {block.breakType}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetGenerator}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Wygeneruj nowy
                </button>
                <button
                  onClick={saveTemplate}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Zapisz szablon
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}