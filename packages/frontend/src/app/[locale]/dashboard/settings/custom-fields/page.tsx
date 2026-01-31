'use client';

import React, { useState, useEffect } from 'react';
import {
  Squares2X2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { customFieldsApi, type CustomFieldDefinition, type EntityType } from '@/lib/api/customFields';

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
      toast.error('Nie udało się pobrać pól');
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
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Squares2X2Icon className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pola niestandardowe</h1>
            <p className="text-sm text-gray-600">Definiuj wlasne pola dla roznych encji</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nowe pole
        </button>
      </div>

      {/* Entity Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {ENTITY_TYPES.map((entity) => (
          <button
            key={entity.value}
            onClick={() => setSelectedEntity(entity.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedEntity === entity.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {entity.label}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingField ? 'Edytuj pole' : 'Nowe pole niestandardowe'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etykieta *</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="np. Wartosc kontraktu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ pola</label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opcje (oddzielone przecinkiem)
                    </label>
                    <input
                      type="text"
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Opcja 1, Opcja 2, Opcja 3"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Opcjonalny opis pola"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isRequired" className="text-sm text-gray-700">
                    Pole wymagane
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <CheckIcon className="h-5 w-5" />
                  {editingField ? 'Zapisz' : 'Utworz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fields List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak pol niestandardowych dla tej encji</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Dodaj pierwsze pole
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Etykieta</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Typ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Wymagane</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{field.label}</div>
                    {field.description && (
                      <div className="text-sm text-gray-500">{field.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {field.isRequired ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(field)}
                        className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
