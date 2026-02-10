'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { contextsApi, Context, CreateContextData } from '@/lib/api/contexts';

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <MapPinIcon className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Konteksty</h1>
            <p className="text-sm text-gray-600">
              Zarzadzaj kontekstami dla zadan (np. @telefon, @komputer)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Pokaz nieaktywne
          </label>
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nowy kontekst
          </button>
        </div>
      </div>

      {/* Contexts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      ) : contexts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak kontekstow</p>
          <p className="text-sm text-gray-400 mt-2">
            Utworz konteksty takie jak @telefon, @komputer, @dom
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contexts.map((context) => (
            <div
              key={context.id}
              className={`bg-white rounded-xl border-2 p-5 hover:shadow-md transition-all cursor-pointer ${
                context.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'
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
                    <h3 className="font-semibold text-gray-900">{context.name}</h3>
                    {context._count && (
                      <p className="text-sm text-gray-500">
                        {context._count.tasks} aktywnych zadan
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(context)}
                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(context)}
                    className={`p-1.5 rounded ${
                      context.isActive
                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(context.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {context.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{context.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail View Modal */}
      {selectedContext && !isEditing && selectedContext.tasks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div
              className="p-6 border-b flex items-center justify-between"
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
                  <h2 className="text-xl font-bold text-gray-900">{selectedContext.name}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedContext._count?.tasks || 0} zadan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContext(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {selectedContext.description && (
                <p className="text-gray-600 mb-4">{selectedContext.description}</p>
              )}

              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ListBulletIcon className="h-5 w-5" />
                Zadania w tym kontekscie
              </h3>

              {selectedContext.tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Brak aktywnych zadan</p>
              ) : (
                <div className="space-y-2">
                  {selectedContext.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.project && (
                          <p className="text-xs text-gray-500">{task.project.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            task.priority === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
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
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isCreating ? 'Nowy kontekst' : 'Edytuj kontekst'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedContext(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nazwa musi zaczynac sie od @ (np. @telefon, @komputer)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kolor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedContext(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Anuluj
              </button>
              <button
                onClick={isCreating ? handleCreate : handleUpdate}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                {isCreating ? 'Utworz' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
