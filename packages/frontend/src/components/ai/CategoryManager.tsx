'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag, X, Check, Info } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface CategoryConfig {
  validClasses: string[];
  descriptions: Record<string, string>;
}

const DEFAULT_CATEGORIES = ['BUSINESS', 'NEWSLETTER', 'SPAM', 'TRANSACTIONAL', 'PERSONAL'];

export function CategoryManager() {
  const [categories, setCategories] = useState<CategoryConfig>({ validClasses: [], descriptions: {} });
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [promptStatus, setPromptStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/pipeline-config');
      const config = res.data?.data || res.data;
      const classifications = config?.classifications || { validClasses: DEFAULT_CATEGORIES, descriptions: {} };
      setCategories(classifications);

      // Check which categories have prompts
      const statusMap: Record<string, boolean> = {};
      for (const cls of classifications.validClasses) {
        try {
          const promptRes = await apiClient.get(`/ai-prompts/code/EMAIL_POST_${cls}`);
          statusMap[cls] = !!promptRes.data?.data;
        } catch {
          statusMap[cls] = false;
        }
      }
      setPromptStatus(statusMap);
    } catch {
      toast.error('Nie udalo sie zaladowac kategorii');
    } finally {
      setLoading(false);
    }
  };

  const saveCategories = async (updated: CategoryConfig) => {
    try {
      await apiClient.put('/admin/pipeline-config', {
        section: 'classifications',
        data: updated,
      });
      setCategories(updated);
      toast.success('Kategorie zapisane');
    } catch {
      toast.error('Nie udalo sie zapisac kategorii');
    }
  };

  const addCategory = async () => {
    const name = newCategoryName.toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();
    if (!name) {
      toast.error('Nazwa kategorii jest wymagana');
      return;
    }
    if (categories.validClasses.includes(name)) {
      toast.error('Kategoria o tej nazwie juz istnieje');
      return;
    }
    const updated: CategoryConfig = {
      validClasses: [...categories.validClasses, name],
      descriptions: { ...categories.descriptions, [name]: newCategoryDesc || name },
    };
    await saveCategories(updated);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setShowAddForm(false);
  };

  const removeCategory = async (name: string) => {
    if (DEFAULT_CATEGORIES.includes(name)) {
      toast.error('Nie mozna usunac domyslnej kategorii');
      return;
    }
    if (!confirm(`Usunac kategorie ${name}? Reguly z ta klasyfikacja przestana dzialac.`)) return;
    const updated: CategoryConfig = {
      validClasses: categories.validClasses.filter(c => c !== name),
      descriptions: { ...categories.descriptions },
    };
    delete updated.descriptions[name];
    await saveCategories(updated);
  };

  const saveDescription = async (name: string) => {
    const updated: CategoryConfig = {
      ...categories,
      descriptions: { ...categories.descriptions, [name]: editDescription },
    };
    await saveCategories(updated);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kategorie emaili</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Definiuj kategorie klasyfikacji. AI odpala sie TYLKO jesli istnieje prompt EMAIL_POST_&#123;KATEGORIA&#125;.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nowa kategoria
        </button>
      </div>

      {/* Info box */}
      <div className="mb-4 p-4 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl">
        <div className="flex gap-2">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Jak to dziala:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>Reguly klasyfikuja maile do kategorii <strong>bez AI</strong></li>
              <li>AI odpala sie tylko jesli istnieje prompt <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">EMAIL_POST_KATEGORIA</code></li>
              <li>Brak promptu = brak AI = zero kosztow</li>
              <li>Dodaj kategorie, stworz regule z ta klasyfikacja, potem dodaj prompt w zakladce Prompty</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/30 rounded-xl">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nazwa (uppercase)</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                placeholder="np. REKLAMACJA"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Opis</label>
              <input
                type="text"
                value={newCategoryDesc}
                onChange={e => setNewCategoryDesc(e.target.value)}
                placeholder="np. Reklamacje i problemy klientow"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <button onClick={addCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowAddForm(false); setNewCategoryName(''); setNewCategoryDesc(''); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 text-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Categories grid */}
      <div className="grid gap-3">
        {categories.validClasses.map(cls => {
          const isDefault = DEFAULT_CATEGORIES.includes(cls);
          const hasPrompt = promptStatus[cls];
          const desc = categories.descriptions[cls] || '';

          return (
            <div
              key={cls}
              className="p-4 bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/30 rounded-xl flex items-center gap-4"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{cls}</span>
                  {isDefault && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                      domyslna
                    </span>
                  )}
                  {hasPrompt ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      AI aktywne
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                      bez AI
                    </span>
                  )}
                </div>
                {editingCategory === cls ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      autoFocus
                    />
                    <button onClick={() => saveDescription(cls)} className="text-green-600 hover:text-green-700">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{desc}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingCategory(cls); setEditDescription(desc); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Edytuj opis"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {!isDefault && (
                  <button
                    onClick={() => removeCategory(cls)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Usun kategorie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {categories.validClasses.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          Brak kategorii. Dodaj pierwsza kategorie.
        </p>
      )}
    </div>
  );
}
