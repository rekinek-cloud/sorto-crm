'use client';

import React from 'react';
import { Pencil, Trash2, ChevronDown, ChevronRight, ShieldAlert, Clock } from 'lucide-react';
import Link from 'next/link';

interface RuleCardProps {
  rule: any;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  TESTING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const categoryIcons: Record<string, string> = {
  CLASSIFICATION: '📧',
  ROUTING: '🎯',
  EXTRACTION: '📋',
  INDEXING: '📚',
};

export function RuleCard({ rule, onToggle, onDelete, expanded, onToggleExpand }: RuleCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onToggleExpand && (
              <button onClick={onToggleExpand} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            )}
            <span className="text-lg flex-shrink-0">{categoryIcons[rule.category] || '⚙️'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/ai-rules/${rule.id}`}
                  className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 truncate"
                >
                  {rule.name}
                </Link>
                {rule.isSystem && (
                  <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" title="Regula systemowa" />
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{rule.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{rule.executionCount || 0}</span>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[rule.status] || statusColors.INACTIVE}`}>
              {rule.status === 'ACTIVE' ? 'ON' : rule.status === 'TESTING' ? 'TEST' : 'OFF'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rule.enabled || rule.status === 'ACTIVE'}
                onChange={(e) => onToggle(rule.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <Link
              href={`/dashboard/ai-rules/${rule.id}`}
              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            {!rule.isSystem && (
              <button
                onClick={() => onDelete(rule.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Kategoria:</span>
              <span className="ml-2 text-slate-900 dark:text-slate-100">{rule.category}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Typ danych:</span>
              <span className="ml-2 text-slate-900 dark:text-slate-100">{rule.dataType}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Priorytet:</span>
              <span className="ml-2 text-slate-900 dark:text-slate-100">{rule.priority}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
