'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customFieldsApi, type CustomFieldDefinition, type EntityType } from '@/lib/api/customFields';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

type CustomField = CustomFieldDefinition;

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Tekst', description: 'Pojedyncza linia tekstu' },
  { value: 'TEXTAREA', label: 'Tekst dlogi', description: 'Wieloliniowe pole tekstowe' },
  { value: 'NUMBER', label: 'Liczba', description: 'Wartosc numeryczna' },
  { value: 'CURRENCY', label: 'Waluta', description: 'Kwota pieniezna' },
  { value: 'DATE', label: 'Data', description: 'Wybor daty' },
  { value: 'BOOLEAN', label: 'Tak/Nie', description: 'Przelacznik' },
  { value: 'SELECT', label: 'Lista wyboru', description: 'Wybor jednej opcji' },
  { value: 'MULTISELECT', label: 'Wielokrotny wybor', description: 'Wybor wielu opcji' },
  { value: 'URL', label: 'Link', description: 'Adres URL' },
  { value: 'EMAIL', label: 'Email', description: 'Adres email' },
  { value: 'PHONE', label: 'Telefon', description: 'Numer telefonu' },
];

const ENTITY_TYPES = [
  { value: 'CONTACT', label: 'Kontakty' },
  { value: 'COMPANY', label: 'Firmy' },
  { value: 'DEAL', label: 'Transakcje' },
  { value: 'PROJECT', label: 'Projekty' },
  { value: 'TASK', label: 'Zadania' },
];

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedEntity, setSelectedEntity] = useState('CONTACT');
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
    fieldType: 'TEXT',
    entityType: 'CONTACT',
    isRequired: false,
    options: '',
  });

  useEffect(() => {
    loadFields();
  }, [selectedEntity]);

  const loadFields = async () => {
    try {
      const { definitions } = await customFieldsApi.getDefinitions(selectedEntity as EntityType);
      setFields(definitions || []);
    } catch (error) {
      console.error('Failed to load fields:', error);
      toast.error('Nie udalo sie pobrac pol');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.label.trim()) {
      toast.error('Nazwa pola jest wymagana');
      return;
    }

    try {
      const payload = {
        name: formData.name || formData.label.toLowerCase().replace(/\s+/g, '_'),
        label: formData.label,
        description: formData.description || undefined,
        fieldType: formData.fieldType as any,
        entityType: selectedEntity as EntityType,
        isRequired: formData.isRequired,
        options: formData.options ? formData.options.split(',').map((o) => o.trim()) : undefined,
      };

      if (editingField) {
        await customFieldsApi.updateDefinition(editingField.id, payload);
        toast.success('Pole zaktualizowane');
      } else {
        await customFieldsApi.createDefinition(payload);
        toast.success('Pole utworzone');
      }
      resetForm();
      loadFields();
    } catch (error: any) {
      console.error('Failed to save field:', error);
      toast.error(error.response?.data?.error || 'Nie udalo sie zapisac pola');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac to pole?')) return;

    try {
      await customFieldsApi.deleteDefinition(id);
      toast.success('Pole usuniete');
      loadFields();
    } catch (error) {
      console.error('Failed to delete field:', error);
      toast.error('Nie udalo sie usunac pola');
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      description: field.description || '',
      fieldType: field.fieldType,
      entityType: field.entityType,
      isRequired: field.isRequired,
      options: field.options?.join(', ') || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingField(null);
    setFormData({
      name: '',
      label: '',
      description: '',
      fieldType: 'TEXT',
      entityType: selectedEntity,
      isRequired: false,
      options: '',
    });
  };

  const needsOptions = ['SELECT', 'MULTISELECT'].includes(formData.fieldType);

  return (
    <PageShell>
      <PageHeader
        title="Pola niestandardowe"
        subtitle="Definiuj wlasne pola dla roznych encji"
        icon={LayoutGrid}
        iconColor="text-orange-600"
        breadcrumbs={[{ label: 'Ustawienia', href: '/dashboard/settings' }, { label: 'Pola niestandardowe' }]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nowe pole
          </button>
        }
      />

      {/* Entity Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {ENTITY_TYPES.map((entity) => (
          <button
            key={entity.value}
            onClick={() => setSelectedEntity(entity.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedEntity === entity.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {entity.label}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {editingField ? 'Edytuj pole' : 'Nowe pole niestandardowe'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etykieta *</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                    placeholder="np. Wartosc kontraktu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typ pola</label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {needsOptions && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Opcje (oddzielone przecinkiem)
                    </label>
                    <input
                      type="text"
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Opcja 1, Opcja 2, Opcja 3"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Opcjonalny opis pola"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="isRequired" className="text-sm text-slate-700 dark:text-slate-300">
                    Pole wymagane
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Check className="h-5 w-5" />
                  {editingField ? 'Zapisz' : 'Utworz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fields List */}
      {loading ? (
        <SkeletonPage />
      ) : fields.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          <LayoutGrid className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Brak pol niestandardowych dla tej encji</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            Dodaj pierwsze pole
          </button>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Etykieta</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Typ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Wymagane</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{field.label}</div>
                    {field.description && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">{field.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                      {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {field.isRequired ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(field)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
