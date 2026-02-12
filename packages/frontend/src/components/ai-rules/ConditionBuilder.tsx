'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface ConditionBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  mainOperator: 'AND' | 'OR';
  onOperatorChange: (op: 'AND' | 'OR') => void;
}

const OPERATORS = [
  { value: 'contains', label: 'zawiera' },
  { value: 'not_contains', label: 'nie zawiera' },
  { value: 'equals', label: 'rowna sie' },
  { value: 'not_equals', label: 'nie rowna sie' },
  { value: 'starts_with', label: 'zaczyna sie od' },
  { value: 'ends_with', label: 'konczy sie na' },
  { value: 'matches_regex', label: 'regex' },
  { value: 'in_list', label: 'na liscie' },
];

const FIELDS = [
  { value: 'sender.email', label: 'Email nadawcy' },
  { value: 'sender.domain', label: 'Domena nadawcy' },
  { value: 'subject', label: 'Temat' },
  { value: 'body', label: 'Tresc' },
  { value: 'headers.from', label: 'Naglowek From' },
  { value: 'headers.reply-to', label: 'Naglowek Reply-To' },
  { value: 'attachments.count', label: 'Liczba zalacznikow' },
  { value: 'attachments.types', label: 'Typy zalacznikow' },
];

export function ConditionBuilder({ conditions, onChange, mainOperator, onOperatorChange }: ConditionBuilderProps) {
  const addCondition = () => {
    onChange([...conditions, { field: 'sender.email', operator: 'contains', value: '' }]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-300">Lacz warunki:</span>
        <button
          onClick={() => onOperatorChange('AND')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            mainOperator === 'AND'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          AND
        </button>
        <button
          onClick={() => onOperatorChange('OR')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            mainOperator === 'OR'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          OR
        </button>
      </div>

      {conditions.map((cond, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-xs font-medium text-purple-500 w-8 text-center">{mainOperator}</span>
          )}
          <select
            value={cond.field}
            onChange={(e) => updateCondition(i, 'field', e.target.value)}
            className="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={cond.operator}
            onChange={(e) => updateCondition(i, 'operator', e.target.value)}
            className="w-36 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={cond.value}
            onChange={(e) => updateCondition(i, 'value', e.target.value)}
            placeholder="Wartosc..."
            className="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => removeCondition(i)}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        onClick={addCondition}
        className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
      >
        <Plus className="w-4 h-4" /> Dodaj warunek
      </button>
    </div>
  );
}
