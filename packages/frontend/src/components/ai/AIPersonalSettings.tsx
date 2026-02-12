'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Bot,
  Inbox,
  Calendar,
  ClipboardList,
  BarChart3,
  Building2,
  Save,
  RefreshCw,
} from 'lucide-react';
import {
  AIContext,
  AutonomyLevel,
  UserAIPatterns,
  getUserPatterns,
  updateSettings
} from '@/lib/api/aiAssistant';

interface AIPersonalSettingsProps {
  onSettingsChange?: (patterns: UserAIPatterns) => void;
  className?: string;
}

const autonomyLevels: { level: AutonomyLevel; name: string; description: string }[] = [
  { level: 0, name: 'Wylaczony', description: 'Asystent AI nie podpowiada' },
  { level: 1, name: 'Sugestie', description: 'AI sugeruje, Ty zatwierdzasz kazda akcje' },
  { level: 2, name: 'Auto + Log', description: 'AI wykonuje i loguje, mozesz cofnac' },
  { level: 3, name: 'Auto cicha', description: 'AI dziala w tle automatycznie' }
];

const contextOptions: { id: AIContext; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'SOURCE', name: 'Zrodlo', icon: Inbox, description: 'Analiza nowych elementow w Zrodle' },
  { id: 'DAY_PLAN', name: 'Planowanie dnia', icon: Calendar, description: 'Optymalizacja planu dnia' },
  { id: 'REVIEW', name: 'Przeglad tygodniowy', icon: ClipboardList, description: 'Podsumowania i rekomendacje' },
  { id: 'TASK', name: 'Zadania', icon: BarChart3, description: 'Sugestie dla zadan' },
  { id: 'STREAM', name: 'Strumienie', icon: RefreshCw, description: 'Analiza strumieni' },
  { id: 'DEAL', name: 'CRM - Transakcje', icon: Building2, description: 'Sugestie dla transakcji' }
];

export function AIPersonalSettings({ onSettingsChange, className = '' }: AIPersonalSettingsProps) {
  const [patterns, setPatterns] = useState<UserAIPatterns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(1);
  const [enabledContexts, setEnabledContexts] = useState<AIContext[]>(['SOURCE', 'DAY_PLAN', 'REVIEW']);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { loadPatterns(); }, []);

  const loadPatterns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUserPatterns();
      if (response.success) {
        setPatterns(response.data);
        setAutonomyLevel(response.data.autonomyLevel);
        setEnabledContexts(response.data.enabledContexts);
      }
    } catch {
      setError('Nie udalo sie zaladowac ustawien AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutonomyChange = (level: AutonomyLevel) => {
    setAutonomyLevel(level);
    setHasChanges(true);
  };

  const handleContextToggle = (contextId: AIContext) => {
    setEnabledContexts(prev => {
      const newContexts = prev.includes(contextId)
        ? prev.filter(c => c !== contextId)
        : [...prev, contextId];
      setHasChanges(true);
      return newContexts;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await updateSettings({ autonomyLevel, enabledContexts });
      if (response.success) {
        setHasChanges(false);
        await loadPatterns();
        onSettingsChange?.(response.data);
      }
    } catch {
      setError('Nie udalo sie zapisac ustawien');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !patterns) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <p className="text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={loadPatterns} className="mt-2">
          Sprobuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Autonomy Level */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Poziom autonomii:</h3>
        <div className="space-y-2">
          {autonomyLevels.map(({ level, name, description }) => (
            <label
              key={level}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                autonomyLevel === level
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="autonomy"
                checked={autonomyLevel === level}
                onChange={() => handleAutonomyChange(level)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Enabled Contexts */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Wlaczone konteksty:</h3>
        <div className="space-y-2">
          {contextOptions.map(({ id, name, icon: Icon, description }) => (
            <label
              key={id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                enabledContexts.includes(id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={enabledContexts.includes(id)}
                onChange={() => handleContextToggle(id)}
              />
              <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {patterns && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Statystyki:</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">Sugestii lacznie</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{patterns.totalSuggestions}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">Zaakceptowanych</p>
              <p className="text-xl font-bold text-green-600">{patterns.acceptanceRate.toFixed(0)}%</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Akceptacja sugestii</span>
              <span>{patterns.totalAccepted} / {patterns.totalSuggestions}</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${patterns.acceptanceRate}%` }} />
            </div>
          </div>
          {patterns.autonomyLevel === 1 && patterns.totalAccepted >= 40 && patterns.acceptanceRate >= 70 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <Bot className="h-4 w-4 inline mr-1" />
                Masz wysoka akceptacje sugestii! Rozwaz zwiekszenie poziomu autonomii.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      {hasChanges && (
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <><LoadingSpinner size="sm" className="mr-2" />Zapisywanie...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Zapisz ustawienia</>
          )}
        </Button>
      )}
    </div>
  );
}
