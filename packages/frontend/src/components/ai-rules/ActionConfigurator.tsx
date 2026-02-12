'use client';

import React from 'react';

interface ActionConfiguratorProps {
  actions: Record<string, any>;
  onChange: (actions: Record<string, any>) => void;
}

export function ActionConfigurator({ actions, onChange }: ActionConfiguratorProps) {
  const toggleAction = (key: string, enabled: boolean) => {
    const updated = { ...actions };
    if (enabled) {
      updated[key] = actions[key] || getDefaultValue(key);
    } else {
      delete updated[key];
    }
    onChange(updated);
  };

  const updateActionValue = (key: string, value: any) => {
    onChange({ ...actions, [key]: value });
  };

  const getDefaultValue = (key: string) => {
    switch (key) {
      case 'addToRag': return { collection: 'default', priority: 'normal' };
      case 'addToFlow': return { streamId: '', priority: 'normal' };
      case 'classify': return { class: 'BUSINESS', confidence: 0.8 };
      case 'extract': return { fields: ['company', 'contact', 'amount'] };
      case 'notify': return { channel: 'app', message: '' };
      case 'ignore': return { reason: '' };
      default: return {};
    }
  };

  const ACTION_DEFS = [
    { key: 'addToRag', label: 'Dodaj do RAG', desc: 'Indeksuj w bazie wiedzy' },
    { key: 'addToFlow', label: 'Dodaj do Flow', desc: 'Przekaz do strumienia' },
    { key: 'classify', label: 'Klasyfikuj', desc: 'Ustaw klase dokumentu' },
    { key: 'extract', label: 'Ekstrahuj dane', desc: 'Wyciagnij informacje' },
    { key: 'notify', label: 'Powiadom', desc: 'Wyslij powiadomienie' },
    { key: 'ignore', label: 'Ignoruj', desc: 'Oznacz jako nieistotne' },
  ];

  return (
    <div className="space-y-3">
      {ACTION_DEFS.map((def) => {
        const isEnabled = def.key in actions;
        return (
          <div key={def.key} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{def.label}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{def.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => toggleAction(def.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isEnabled && def.key === 'addToFlow' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={actions[def.key]?.streamId || ''}
                  onChange={(e) => updateActionValue(def.key, { ...actions[def.key], streamId: e.target.value })}
                  placeholder="ID strumienia"
                  className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <select
                  value={actions[def.key]?.priority || 'normal'}
                  onChange={(e) => updateActionValue(def.key, { ...actions[def.key], priority: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="low">Niski</option>
                  <option value="normal">Normalny</option>
                  <option value="high">Wysoki</option>
                </select>
              </div>
            )}

            {isEnabled && def.key === 'classify' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  value={actions[def.key]?.class || 'BUSINESS'}
                  onChange={(e) => updateActionValue(def.key, { ...actions[def.key], class: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="BUSINESS">Biznesowy</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="SPAM">Spam</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="PERSONAL">Osobisty</option>
                </select>
                <input
                  type="number"
                  min="0" max="1" step="0.1"
                  value={actions[def.key]?.confidence || 0.8}
                  onChange={(e) => updateActionValue(def.key, { ...actions[def.key], confidence: parseFloat(e.target.value) })}
                  className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {isEnabled && def.key === 'notify' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={actions[def.key]?.message || ''}
                  onChange={(e) => updateActionValue(def.key, { ...actions[def.key], message: e.target.value })}
                  placeholder="Tresc powiadomienia..."
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
