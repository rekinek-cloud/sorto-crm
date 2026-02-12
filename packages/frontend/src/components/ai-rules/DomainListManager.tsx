'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Search, Shield, ShieldAlert, Star } from 'lucide-react';
import { useDomainRules } from '@/hooks/useDomainRules';

interface DomainListManagerProps {
  listType?: 'BLACKLIST' | 'WHITELIST' | 'VIP';
}

const LIST_TABS = [
  { key: 'BLACKLIST', label: 'Czarna lista', icon: ShieldAlert, color: 'text-red-500' },
  { key: 'WHITELIST', label: 'Biala lista', icon: Shield, color: 'text-green-500' },
  { key: 'VIP', label: 'VIP', icon: Star, color: 'text-amber-500' },
] as const;

export function DomainListManager({ listType: initialType }: DomainListManagerProps) {
  const [activeList, setActiveList] = useState<string>(initialType || 'BLACKLIST');
  const { rules: domains, isLoading, addRule, removeRule, setSearch } = useDomainRules(activeList);
  const [newDomain, setNewDomain] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = async () => {
    if (!newDomain.trim()) return;
    await addRule({ pattern: newDomain.trim(), listType: activeList as any });
    setNewDomain('');
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setSearch(q);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
        {LIST_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveList(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeList === tab.key
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeList === tab.key ? tab.color : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Szukaj domeny..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="np. example.com"
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 w-48"
          />
          <button
            onClick={handleAdd}
            disabled={!newDomain.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Dodaj
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Ladowanie...</div>
      ) : domains.length === 0 ? (
        <div className="text-center py-8 text-slate-400">Brak domen na tej liscie</div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {domains.map((domain: any) => (
            <div key={domain.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{domain.pattern}</span>
                {domain.reason && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{domain.reason}</p>
                )}
              </div>
              <button
                onClick={() => removeRule(domain.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
