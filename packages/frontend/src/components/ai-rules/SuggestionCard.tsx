'use client';

import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: {
    id: string;
    type: string;
    title?: string;
    description?: string;
    suggestedRule?: any;
    confidence?: number;
    reason?: string;
    source?: string;
    createdAt: string;
  };
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const typeLabels: Record<string, string> = {
    NEW_RULE: 'Nowa regula',
    MODIFY_RULE: 'Modyfikacja reguly',
    DOMAIN_ADD: 'Dodaj domene',
    PATTERN_ADD: 'Dodaj wzorzec',
  };

  return (
    <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-200/50 dark:border-purple-700/30 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {suggestion.title || typeLabels[suggestion.type] || suggestion.type}
              </span>
              {suggestion.confidence != null && (
                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                  {(suggestion.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {suggestion.description || suggestion.reason}
            </p>
            {suggestion.source && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Zrodlo: {suggestion.source}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAccept(suggestion.id)}
            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="Akceptuj"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={() => onReject(suggestion.id)}
            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Odrzuc"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
