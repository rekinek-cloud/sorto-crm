'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { industriesApi, IndustryTemplate } from '@/lib/api/industries';

type Step = 1 | 2 | 3 | 4;

interface OnboardingData {
  organizationName: string;
  industry: string | null;
  teamSize: string;
  goals: string[];
}

const TEAM_SIZES = [
  { value: '1', label: 'Solo / Freelancer', description: 'Pracuje sam' },
  { value: '2-5', label: 'Maly zespol', description: '2-5 osob' },
  { value: '6-20', label: 'Sredni zespol', description: '6-20 osob' },
  { value: '21-50', label: 'Duzy zespol', description: '21-50 osob' },
  { value: '50+', label: 'Enterprise', description: 'Ponad 50 osob' },
];

const GOALS = [
  { value: 'sales', label: 'Zwiekszenie sprzedazy' },
  { value: 'productivity', label: 'Poprawa produktywnosci' },
  { value: 'customer', label: 'Lepsza obsluga klienta' },
  { value: 'organization', label: 'Organizacja pracy' },
  { value: 'automation', label: 'Automatyzacja procesow' },
  { value: 'reporting', label: 'Lepsze raportowanie' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [data, setData] = useState<OnboardingData>({
    organizationName: '',
    industry: null,
    teamSize: '',
    goals: [],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await industriesApi.getAll();
      setTemplates(result.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = async () => {
    if (!data.industry) {
      toast.error('Wybierz branze');
      return;
    }

    setLoading(true);
    try {
      const result = await industriesApi.applyTemplate(data.industry);

      if (result.success) {
        toast.success('Konfiguracja zakonczona pomyslnie!');
        router.push('/dashboard');
      } else {
        toast.error(result.message || 'Blad konfiguracji');
      }
    } catch (error) {
      toast.error('Nie udalo sie zastosowac szablonu');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.organizationName.length >= 2;
      case 2:
        return data.industry !== null;
      case 3:
        return data.teamSize !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const selectedTemplate = templates.find((t) => t.slug === data.industry);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">STREAMS</span>
          </div>
          <div className="text-sm text-gray-500">
            Krok {step} z 4
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Organization */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <BuildingOffice2Icon className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Witaj w STREAMS!
              </h1>
              <p className="text-lg text-gray-600">
                Zacznijmy od podstawowych informacji o Twojej firmie.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa firmy lub projektu
              </label>
              <input
                type="text"
                value={data.organizationName}
                onChange={(e) => setData({ ...data, organizationName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                placeholder="np. Moja Firma Sp. z o.o."
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <SparklesIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Wybierz swoja branze
              </h1>
              <p className="text-lg text-gray-600">
                Dostosujemy STREAMS do specyfiki Twojej dzialalnosci.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.slug}
                  onClick={() => setData({ ...data, industry: template.slug })}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    data.industry === template.slug
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    <div
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: template.color }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
                  {data.industry === template.slug && (
                    <div className="mt-3 flex items-center text-indigo-600 text-sm font-medium">
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      Wybrano
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Team Size & Goals */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Opowiedz o swoim zespole
              </h1>
              <p className="text-lg text-gray-600">
                Pomoze nam to lepiej dostosowac funkcje.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
              {/* Team Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Wielkosc zespolu
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setData({ ...data, teamSize: size.value })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        data.teamSize === size.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{size.label}</div>
                      <div className="text-xs text-gray-500">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Glowne cele (opcjonalnie)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => toggleGoal(goal.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        data.goals.includes(goal.value)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {data.goals.includes(goal.value) && (
                          <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{goal.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <RocketLaunchIcon className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Wszystko gotowe!
              </h1>
              <p className="text-lg text-gray-600">
                Sprawdz podsumowanie i rozpocznij prace.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Organizacja</span>
                  <span className="font-medium text-gray-900">{data.organizationName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Branza</span>
                  <span className="font-medium text-gray-900">{selectedTemplate?.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Zespol</span>
                  <span className="font-medium text-gray-900">
                    {TEAM_SIZES.find((s) => s.value === data.teamSize)?.label || '-'}
                  </span>
                </div>
                {data.goals.length > 0 && (
                  <div className="py-2">
                    <span className="text-gray-500 block mb-2">Cele</span>
                    <div className="flex flex-wrap gap-2">
                      {data.goals.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                        >
                          {GOALS.find((goal) => goal.value === g)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <div className="bg-gray-50 p-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Co zostanie utworzone:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      {selectedTemplate.streams.length} strumieni roboczych
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      {selectedTemplate.pipelineStages.length} etapow pipeline'u
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      {selectedTemplate.taskCategories.length} kategorii zadan
                    </li>
                    {selectedTemplate.customFields.length > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        {selectedTemplate.customFields.length} pol niestandardowych
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 max-w-md mx-auto">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Wstecz
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dalej
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Konfigurowanie...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="h-5 w-5" />
                  Rozpocznij prace
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
