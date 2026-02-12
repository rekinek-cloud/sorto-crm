'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, RotateCcw } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
  systemPrompt?: string;
  onSystemPromptChange?: (prompt: string) => void;
}

const PROMPT_TEMPLATES = [
  {
    name: 'Klasyfikacja emaili',
    prompt: `Przeanalizuj ponizszy email i sklasyfikuj go wedlug kategorii:
- BUSINESS: email biznesowy wymagajacy odpowiedzi
- MARKETING: marketing, reklamy, oferty
- NEWSLETTER: newslettery, subskrypcje
- SPAM: spam, phishing
- PERSONAL: osobisty

Zwroc JSON: { "class": "KATEGORIA", "confidence": 0.0-1.0, "reason": "krotkie uzasadnienie" }`,
  },
  {
    name: 'Ekstrakcja danych',
    prompt: `Wyciagnij z emaila nastepujace informacje:
- nazwa firmy
- imie i nazwisko kontaktu
- email kontaktu
- telefon
- kwota (jesli wspomniana)
- temat/produkt

Zwroc JSON z polami. Jezeli brak danych, uzyj null.`,
  },
  {
    name: 'Ocena priorytetu',
    prompt: `Ocen priorytet emaila w skali 1-5:
1 - spam/nieistotny
2 - informacyjny, nie wymaga reakcji
3 - wymaga reakcji w ciagu tygodnia
4 - wymaga reakcji w ciagu dnia
5 - pilny, wymaga natychmiastowej reakcji

Zwroc JSON: { "priority": 1-5, "reason": "uzasadnienie" }`,
  },
];

export function PromptEditor({ prompt, onChange, systemPrompt, onSystemPromptChange }: PromptEditorProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'system'>('main');

  const applyTemplate = (template: string) => {
    onChange(template);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {onSystemPromptChange && (
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'main'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Prompt glowny
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'system'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Prompt systemowy
          </button>
        </div>
      )}

      <div className="relative">
        <textarea
          value={activeTab === 'main' ? prompt : (systemPrompt || '')}
          onChange={(e) => {
            if (activeTab === 'main') onChange(e.target.value);
            else onSystemPromptChange?.(e.target.value);
          }}
          rows={10}
          placeholder={activeTab === 'main' ? 'Wpisz prompt dla AI...' : 'Prompt systemowy (opcjonalny)...'}
          className="w-full px-4 py-3 text-sm font-mono border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-y"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => copyToClipboard(activeTab === 'main' ? prompt : (systemPrompt || ''))}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
            title="Kopiuj"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => activeTab === 'main' ? onChange('') : onSystemPromptChange?.('')}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
            title="Wyczysc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'main' && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Szablony promptow
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => applyTemplate(tpl.prompt)}
                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
