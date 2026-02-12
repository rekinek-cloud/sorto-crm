'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, RefreshCw, CheckCircle, X, List,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { contextsApi, Context, CreateContextData } from '@/lib/api/contexts';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

const PRESET_COLORS = [
  '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

export default function ContextsPage() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [formData, setFormData] = useState<CreateContextData>({
    name: '@',
    description: '',
    color: '#6B7280',
  });

  useEffect(() => {
    loadContexts();
  }, [showInactive]);

  const loadContexts = async () => {
    try {
      setLoading(true);
      const data = await contextsApi.getContexts(showInactive ? undefined : true);
      setContexts(data);
    } catch (error) {
      console.error('Failed to load contexts:', error);
      toast.error('Nie udalo sie zaladowac kontekstow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || formData.name === '@') {
        toast.error('Podaj nazwe kontekstu');
        return;
      }
      if (!formData.name.startsWith('@')) {
        setFormData({ ...formData, name: '@' + formData.name });
      }
      await contextsApi.createContext(formData);
      toast.success('Kontekst utworzony');
      setIsCreating(false);
      resetForm();
      loadContexts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Blad tworzenia kontekstu');
    }
  };

  const handleUpdate = async () => {
    if (!selectedContext) return;
    try {
      await contextsApi.updateContext(selectedContext.id, formData);
      toast.success('Kontekst zaktualizowany');
      setIsEditing(false);
      setSelectedContext(null);
      loadContexts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Blad aktualizacji');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten kontekst?')) return;
    try {
      await contextsApi.deleteContext(id);
      toast.success('Kontekst usuniety');
      loadContexts();
    } catch (error) {
      toast.error('Blad usuwania');
    }
  };

  const handleToggleActive = async (context: Context) => {
    try {
      await contextsApi.updateContext(context.id, { isActive: !context.isActive });
      toast.success(context.isActive ? 'Kontekst dezaktywowany' : 'Kontekst aktywowany');
      loadContexts();
    } catch (error) {
      toast.error('Blad zmiany statusu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '@',
      description: '',
      color: '#6B7280',
    });
  };

  const openEditModal = (context: Context) => {
    setSelectedContext(context);
    setFormData({
      name: context.name,
      description: context.description || '',
      color: context.color,
    });
    setIsEditing(true);
  };

  const openDetailView = async (context: Context) => {
    try {
      const fullContext = await contextsApi.getContext(context.id);
      setSelectedContext(fullContext);
    } catch (error) {
      toast.error('Blad ladowania kontekstu');
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Konteksty"
        subtitle="Zarzadzaj kontekstami dla zadan (np. @telefon, @komputer)"
        icon={MapPin}
        iconColor="text-teal-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Konteksty' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              Pokaz nieaktywne
            </label>
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nowy kontekst
            </button>
          </div>
        }
      />

      {/* Contexts Grid */}
      {loading ? (
        <SkeletonPage />
      ) : contexts.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <MapPin className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Brak kontekstow</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Utworz konteksty takie jak @telefon, @komputer, @dom
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contexts.map((context) => (
            <div
              key={context.id}
              className={`bg-white/80 backdrop-blur-xl border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer dark:bg-slate-800/80 ${
                context.isActive
                  ? 'border-white/20 dark:border-slate-700/30'
                  : 'border-dashed border-slate-300 dark:border-slate-600 opacity-60'
              }`}
              onClick={() => openDetailView(context)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: context.color }}
                  >
                    @
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{context.name}</h3>
                    {context._count && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {context._count.tasks} aktywnych zadan
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(context)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(context)}
                    className={`p-1.5 rounded ${
                      context.isActive
                        ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                        : 'text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(context.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {context.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{context.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail View Modal */}
      {selectedContext && !isEditing && selectedContext.tasks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div
              className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"
              style={{ backgroundColor: selectedContext.color + '20' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: selectedContext.color }}
                >
                  @
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedContext.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedContext._count?.tasks || 0} zadan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContext(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {selectedContext.description && (
                <p className="text-slate-600 dark:text-slate-400 mb-4">{selectedContext.description}</p>
              )}

              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <List className="h-5 w-5" />
                Zadania w tym kontekscie
              </h3>

              {selectedContext.tasks.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Brak aktywnych zadan</p>
              ) : (
                <div className="space-y-2">
                  {selectedContext.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                        {task.project && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{task.project.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            task.priority === 'HIGH'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm w-full max-w-md">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {isCreating ? 'Nowy kontekst' : 'Edytuj kontekst'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedContext(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nazwa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith('@')) value = '@' + value;
                    setFormData({ ...formData, name: value });
                  }}
                  placeholder="@kontekst"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nazwa musi zaczynac sie od @ (np. @telefon, @komputer)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kolor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === color
                          ? 'border-slate-900 dark:border-slate-100 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedContext(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Anuluj
              </button>
              <button
                onClick={isCreating ? handleCreate : handleUpdate}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                {isCreating ? 'Utworz' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
