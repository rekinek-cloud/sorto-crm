'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Zap, 
  Hash, 
  Calendar,
  Coffee,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: TimeBlockData) => void;
  block?: TimeBlockData | null;
  dayOfWeek?: string;
}

interface TimeBlockData {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  energyLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CREATIVE' | 'ADMINISTRATIVE';
  primaryContext: string;
  alternativeContexts: string[];
  isBreak: boolean;
  breakType?: 'COFFEE' | 'MEAL' | 'STRETCH' | 'WALK' | 'MEDITATION' | 'SOCIAL' | 'FREE' | 'TRANSITION';
  dayOfWeek?: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  
  // Extended Day Selection
  workdays: boolean;      // Dni robocze (Mon-Fri)
  weekends: boolean;      // Weekendy (Sat-Sun)
  holidays: boolean;      // Święta państwowe
  specificDays: string[]; // Konkretne dni tygodnia: ["MONDAY", "WEDNESDAY"]
  
  order?: number;
}

const ENERGY_LEVELS = [
  { 
    value: 'HIGH', 
    label: 'Wysoka energia', 
    color: 'bg-green-500', 
    icon: '⚡',
    description: 'Najwyższa koncentracja i motywacja',
    recommendedTimes: ['07:00-09:00', '09:00-11:00'],
    suggestedContexts: ['@computer', '@focus', '@planning'],
    idealDuration: '90-120 min',
    bestFor: 'Trudne zadania, deep work, strategiczne planowanie'
  },
  { 
    value: 'MEDIUM', 
    label: 'Średnia energia', 
    color: 'bg-yellow-500', 
    icon: '🔋',
    description: 'Stabilna energia do codziennych zadań',
    recommendedTimes: ['11:00-13:00', '14:00-16:00'],
    suggestedContexts: ['@computer', '@calls', '@office'],
    idealDuration: '60-90 min',
    bestFor: 'Rutynowe zadania, komunikacja, organizacja'
  },
  { 
    value: 'LOW', 
    label: 'Niska energia', 
    color: 'bg-orange-500', 
    icon: '🔌',
    description: 'Ograniczona energia, proste działania',
    recommendedTimes: ['13:00-14:00', '16:00-17:00'],
    suggestedContexts: ['@reading', '@admin', '@waiting'],
    idealDuration: '30-60 min',
    bestFor: 'Czytanie, admin, odpowiadanie na emaile'
  },
  { 
    value: 'CREATIVE', 
    label: 'Kreatywna', 
    color: 'bg-purple-500', 
    icon: '🎨',
    description: 'Energia dla innowacyjnych rozwiązań',
    recommendedTimes: ['10:00-12:00', '15:00-17:00'],
    suggestedContexts: ['@creative', '@planning', '@online'],
    idealDuration: '45-90 min',
    bestFor: 'Brainstorming, design, pisanie, innowacje'
  },
  { 
    value: 'ADMINISTRATIVE', 
    label: 'Administracyjna', 
    color: 'bg-gray-500', 
    icon: '📊',
    description: 'Systematyczna praca z danymi',
    recommendedTimes: ['08:00-10:00', '14:00-16:00'],
    suggestedContexts: ['@admin', '@computer', '@office'],
    idealDuration: '30-75 min',
    bestFor: 'Raporty, analizy, dokumentacja, procesy'
  }
];

const CONTEXTS = [
  '@computer',
  '@calls',
  '@office',
  '@home',
  '@errands',
  '@online',
  '@waiting',
  '@reading',
  '@planning',
  '@creative',
  '@admin',
  '@focus'
];

const BREAK_TYPES = [
  { value: 'COFFEE', label: 'Kawa/Herbata', icon: '☕' },
  { value: 'MEAL', label: 'Posiłek', icon: '🍽️' },
  { value: 'STRETCH', label: 'Rozciąganie', icon: '🧘' },
  { value: 'WALK', label: 'Spacer', icon: '🚶' },
  { value: 'MEDITATION', label: 'Medytacja', icon: '🧘‍♂️' },
  { value: 'SOCIAL', label: 'Rozmowa z zespołem', icon: '💬' },
  { value: 'FREE', label: 'Wolny czas', icon: '🎮' },
  { value: 'TRANSITION', label: 'Przejście między zadaniami', icon: '🔄' }
];

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Poniedziałek', short: 'Pn' },
  { value: 'TUESDAY', label: 'Wtorek', short: 'Wt' },
  { value: 'WEDNESDAY', label: 'Środa', short: 'Śr' },
  { value: 'THURSDAY', label: 'Czwartek', short: 'Cz' },
  { value: 'FRIDAY', label: 'Piątek', short: 'Pt' },
  { value: 'SATURDAY', label: 'Sobota', short: 'So' },
  { value: 'SUNDAY', label: 'Niedziela', short: 'Nd' }
];

export default function TimeBlockModal({ 
  isOpen, 
  onClose, 
  onSave, 
  block,
  dayOfWeek 
}: TimeBlockModalProps) {
  const [formData, setFormData] = useState<TimeBlockData>({
    name: '',
    startTime: '09:00',
    endTime: '10:00',
    energyLevel: 'MEDIUM',
    primaryContext: '@computer',
    alternativeContexts: [],
    isBreak: false,
    dayOfWeek: dayOfWeek as any,
    workdays: true,
    weekends: false,
    holidays: false,
    specificDays: []
  });

  const [selectedAltContext, setSelectedAltContext] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);

  useEffect(() => {
    if (block) {
      setFormData(block);
    } else {
      setFormData({
        name: '',
        startTime: '09:00',
        endTime: '10:00',
        energyLevel: 'MEDIUM',
        primaryContext: '@computer',
        alternativeContexts: [],
        isBreak: false,
        dayOfWeek: dayOfWeek as any,
        workdays: true,
        weekends: false,
        holidays: false,
        specificDays: []
      });
    }
  }, [block, dayOfWeek]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Czas rozpoczęcia jest wymagany';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Czas zakończenia jest wymagany';
    }

    if (formData.startTime >= formData.endTime) {
      newErrors.time = 'Czas zakończenia musi być późniejszy niż rozpoczęcia';
    }

    if (formData.isBreak && !formData.breakType) {
      newErrors.breakType = 'Typ przerwy jest wymagany';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Popraw błędy w formularzu');
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleAddAltContext = () => {
    if (selectedAltContext && !formData.alternativeContexts.includes(selectedAltContext)) {
      setFormData({
        ...formData,
        alternativeContexts: [...formData.alternativeContexts, selectedAltContext]
      });
      setSelectedAltContext('');
    }
  };

  const handleRemoveAltContext = (context: string) => {
    setFormData({
      ...formData,
      alternativeContexts: formData.alternativeContexts.filter(c => c !== context)
    });
  };

  // Helper function to suggest optimal times based on energy level
  const suggestOptimalTimes = (energyLevel: string) => {
    const level = ENERGY_LEVELS.find(l => l.value === energyLevel);
    if (!level) return;

    const suggestedTime = level.recommendedTimes[0];
    if (suggestedTime) {
      const [startTime, endTime] = suggestedTime.split('-');
      setFormData({
        ...formData,
        startTime,
        endTime: endTime || calculateEndTime(startTime, level.idealDuration)
      });
    }
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMinutes = parseInt(duration.split('-')[0]) || 60; // Take lower bound
    const endMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {block ? 'Edytuj blok czasowy' : 'Nowy blok czasowy'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nazwa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nazwa bloku
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="np. Poranny Deep Work"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Czas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Od
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Do
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>
          {errors.time && (
            <p className="-mt-4 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.time}
            </p>
          )}

          {/* Typ bloku */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.isBreak}
                onChange={() => setFormData({ ...formData, isBreak: false })}
                className="mr-2"
              />
              <span className="text-sm font-medium">Blok pracy</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.isBreak}
                onChange={() => setFormData({ ...formData, isBreak: true })}
                className="mr-2"
              />
              <span className="text-sm font-medium">Przerwa</span>
            </label>
          </div>

          {/* Poziom energii (tylko dla bloków pracy) */}
          {!formData.isBreak && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="inline h-4 w-4 mr-1" />
                Poziom energii
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ENERGY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      energyLevel: level.value as any,
                      // Auto-suggest primary context based on energy level
                      primaryContext: level.suggestedContexts[0] || formData.primaryContext
                    })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.energyLevel === level.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{level.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {level.label}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {level.description}
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Idealne dla:</span> {level.bestFor}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Czas:</span> {level.idealDuration}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Konteksty:</span> {level.suggestedContexts.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Energy Level Tips */}
              {formData.energyLevel && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 text-sm">💡</span>
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">Rekomendowane godziny dla {ENERGY_LEVELS.find(l => l.value === formData.energyLevel)?.label}:</span>
                        <div className="mt-1 text-xs">
                          {ENERGY_LEVELS.find(l => l.value === formData.energyLevel)?.recommendedTimes.join(', ')}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => suggestOptimalTimes(formData.energyLevel)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      ⚡ Sugeruj czas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Typ przerwy (tylko dla przerw) */}
          {formData.isBreak && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Coffee className="inline h-4 w-4 mr-1" />
                Typ przerwy
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BREAK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, breakType: type.value as any })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.breakType === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
              {errors.breakType && (
                <p className="mt-1 text-sm text-red-600">{errors.breakType}</p>
              )}
            </div>
          )}

          {/* Konteksty (tylko dla bloków pracy) */}
          {!formData.isBreak && (
            <>
              {/* Główny kontekst */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Główny kontekst
                </label>
                <select
                  value={formData.primaryContext}
                  onChange={(e) => setFormData({ ...formData, primaryContext: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CONTEXTS.map((context) => (
                    <option key={context} value={context}>
                      {context}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alternatywne konteksty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Alternatywne konteksty
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedAltContext}
                    onChange={(e) => setSelectedAltContext(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Wybierz kontekst</option>
                    {CONTEXTS.filter(c => 
                      c !== formData.primaryContext && 
                      !formData.alternativeContexts.includes(c)
                    ).map((context) => (
                      <option key={context} value={context}>
                        {context}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAltContext}
                    disabled={!selectedAltContext}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                  >
                    Dodaj
                  </button>
                </div>
                {formData.alternativeContexts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.alternativeContexts.map((context) => (
                      <span
                        key={context}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                      >
                        {context}
                        <button
                          type="button"
                          onClick={() => handleRemoveAltContext(context)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dzień tygodnia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Dzień tygodnia (opcjonalnie)
            </label>
            <div className="grid grid-cols-7 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dayOfWeek: undefined })}
                className={`p-2 rounded-lg border-2 text-sm transition-all ${
                  !formData.dayOfWeek
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Każdy
              </button>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, dayOfWeek: day.value as any })}
                  className={`p-2 rounded-lg border-2 text-sm transition-all ${
                    formData.dayOfWeek === day.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={day.label}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Extended Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="inline h-4 w-4 mr-1" />
              Zastosowanie bloku
            </label>
            
            {/* Basic Day Types */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="workdays"
                    checked={formData.workdays}
                    onChange={(e) => setFormData({ ...formData, workdays: e.target.checked })}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="workdays" className="text-sm font-medium text-gray-700">
                    📅 Dni robocze (Pn-Pt)
                  </label>
                </div>
                <span className="text-xs text-gray-500">Poniedziałek - Piątek</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weekends"
                    checked={formData.weekends}
                    onChange={(e) => setFormData({ ...formData, weekends: e.target.checked })}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="weekends" className="text-sm font-medium text-gray-700">
                    🏖️ Weekendy (So-Nd)
                  </label>
                </div>
                <span className="text-xs text-gray-500">Sobota - Niedziela</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="holidays"
                    checked={formData.holidays}
                    onChange={(e) => setFormData({ ...formData, holidays: e.target.checked })}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="holidays" className="text-sm font-medium text-gray-700">
                    🎉 Święta państwowe
                  </label>
                </div>
                <span className="text-xs text-gray-500">Dni wolne od pracy</span>
              </div>
            </div>

            {/* Specific Days Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📌 Konkretne dni tygodnia (opcjonalne)
              </label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = formData.specificDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const newSpecificDays = isSelected
                          ? formData.specificDays.filter(d => d !== day.value)
                          : [...formData.specificDays, day.value];
                        setFormData({ ...formData, specificDays: newSpecificDays });
                      }}
                      className={`p-2 rounded-lg border-2 text-sm transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={day.label}
                    >
                      <div className="font-medium">{day.short}</div>
                      {isSelected && <div className="text-xs">✓</div>}
                    </button>
                  );
                })}
              </div>
              {formData.specificDays.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Wybrane:</span> {formData.specificDays.map(day => 
                    DAYS_OF_WEEK.find(d => d.value === day)?.label
                  ).join(', ')}
                </div>
              )}
            </div>

            {/* Usage Summary */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <span className="font-medium">📋 Podsumowanie zastosowania:</span>
                <div className="mt-1 text-xs space-y-1">
                  {formData.workdays && <div>• Będzie aktywny w dni robocze (Pn-Pt)</div>}
                  {formData.weekends && <div>• Będzie aktywny w weekendy (So-Nd)</div>}
                  {formData.holidays && <div>• Będzie aktywny w święta państwowe</div>}
                  {formData.specificDays.length > 0 && (
                    <div>• Dodatkowo w konkretne dni: {formData.specificDays.map(day => 
                      DAYS_OF_WEEK.find(d => d.value === day)?.short
                    ).join(', ')}</div>
                  )}
                  {!formData.workdays && !formData.weekends && !formData.holidays && formData.specificDays.length === 0 && (
                    <div className="text-amber-600">⚠️ Blok nie będzie aktywny w żadne dni</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {block ? 'Zapisz zmiany' : 'Utwórz blok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}