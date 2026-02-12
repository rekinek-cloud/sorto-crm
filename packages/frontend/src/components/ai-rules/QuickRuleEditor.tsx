'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionConfigurator } from './ActionConfigurator';

interface QuickRuleEditorProps {
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  initialData?: any;
}

export function QuickRuleEditor({ onSave, onClose, initialData }: QuickRuleEditorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'CLASSIFICATION');
  const [dataType, setDataType] = useState(initialData?.dataType || 'EMAIL');
  const [conditions, setConditions] = useState(initialData?.conditions?.conditions || []);
  const [mainOperator, setMainOperator] = useState<'AND' | 'OR'>(initialData?.conditions?.operator || 'AND');
  const [actions, setActions] = useState(initialData?.actions || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name,
        description,
        category,
        dataType,
        priority: initialData?.priority || 100,
        conditions: { operator: mainOperator, conditions },
        actions,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {initialData ? 'Edytuj regule' : 'Nowa regula'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                <option value="CLASSIFICATION">Klasyfikacja</option>
                <option value="ROUTING">Routing</option>
                <option value="EXTRACTION">Ekstrakcja</option>
                <option value="INDEXING">Indeksowanie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typ danych</label>
              <select value={dataType} onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                <option value="EMAIL">Email</option>
                <option value="DOCUMENT">Dokument</option>
                <option value="OFFER">Oferta</option>
                <option value="ALL">Wszystkie</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Warunki</h4>
            <ConditionBuilder conditions={conditions} onChange={setConditions} mainOperator={mainOperator} onOperatorChange={setMainOperator} />
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Akcje</h4>
            <ActionConfigurator actions={actions} onChange={setActions} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            Anuluj
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
}
