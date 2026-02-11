// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { clientIntelligenceApi, CreateClientIntelligenceRequest, ClientBriefing } from '@/lib/api/clientIntelligence';
import { ClientIntelligence } from '@/types/gtd';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';

const CATEGORIES = [
  { value: 'LIKES', label: 'Lubi', color: 'bg-blue-100 text-blue-700' },
  { value: 'DISLIKES', label: 'Nie lubi', color: 'bg-orange-100 text-orange-700' },
  { value: 'PREFERENCE', label: 'Preferencja', color: 'bg-purple-100 text-purple-700' },
  { value: 'FACT', label: 'Fakt', color: 'bg-gray-100 text-gray-700' },
  { value: 'WARNING', label: 'Ostrzezenie', color: 'bg-red-100 text-red-700' },
  { value: 'TIP', label: 'Wskazowka', color: 'bg-green-100 text-green-700' },
  { value: 'IMPORTANT_DATE', label: 'Wazna data', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'DECISION_PROCESS', label: 'Proces decyzyjny', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'COMMUNICATION', label: 'Komunikacja', color: 'bg-teal-100 text-teal-700' },
  { value: 'SUCCESS', label: 'Sukces', color: 'bg-emerald-100 text-emerald-700' },
];

const getCategoryColor = (category: string) => {
  return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
};

const getCategoryLabel = (category: string) => {
  return CATEGORIES.find(c => c.value === category)?.label || category;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pl-PL');
};

export default function ClientIntelligencePage() {
  const [entityType, setEntityType] = useState<'COMPANY' | 'CONTACT'>('COMPANY');
  const [entityId, setEntityId] = useState<string>('');
  const [entitySearch, setEntitySearch] = useState('');
  const [entityOptions, setEntityOptions] = useState<{ id: string; label: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEntityLabel, setSelectedEntityLabel] = useState('');

  const [items, setItems] = useState<ClientIntelligence[]>([]);
  const [briefing, setBriefing] = useState<ClientBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    category: 'FACT' as string,
    content: '',
    importance: 3,
    source: '',
  });

  // Search entities
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (entitySearch.length < 2) {
        setEntityOptions([]);
        return;
      }
      try {
        if (entityType === 'COMPANY') {
          const res = await companiesApi.searchCompanies(entitySearch);
          setEntityOptions(res.map(c => ({ id: c.id, label: c.name })));
        } else {
          const res = await contactsApi.getContacts({ search: entitySearch, limit: 20 });
          setEntityOptions(res.contacts.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}` })));
        }
        setShowDropdown(true);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [entitySearch, entityType]);

  const selectEntity = (option: { id: string; label: string }) => {
    setEntityId(option.id);
    setSelectedEntityLabel(option.label);
    setEntitySearch(option.label);
    setShowDropdown(false);
  };

  // Load intelligence + briefing when entity selected
  const loadIntelligence = useCallback(async () => {
    if (!entityId) return;
    try {
      setIsLoading(true);
      const [itemsRes, briefingRes] = await Promise.allSettled([
        clientIntelligenceApi.getIntelligence({ entityType, entityId, limit: 100 }),
        clientIntelligenceApi.getBriefing(entityType, entityId),
      ]);
      if (itemsRes.status === 'fulfilled') {
        setItems(itemsRes.value.items);
      }
      if (briefingRes.status === 'fulfilled') {
        setBriefing(briefingRes.value);
      } else {
        setBriefing(null);
      }
    } catch (error) {
      console.error('Failed to load intelligence:', error);
      toast.error('Nie udalo sie zaladowac wywiadu');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      loadIntelligence();
    } else {
      setItems([]);
      setBriefing(null);
    }
  }, [entityId, loadIntelligence]);

  const handleAdd = async () => {
    if (!formData.content.trim()) {
      toast.error('Tresc jest wymagana');
      return;
    }
    if (!entityId) {
      toast.error('Wybierz najpierw podmiot');
      return;
    }

    try {
      const data: CreateClientIntelligenceRequest = {
        entityType,
        entityId,
        category: formData.category as any,
        content: formData.content.trim(),
        importance: formData.importance,
        source: formData.source.trim() || undefined,
      };

      await clientIntelligenceApi.createIntelligence(data);
      toast.success('Informacja dodana!');
      setFormData({ category: 'FACT', content: '', importance: 3, source: '' });
      setShowAddForm(false);
      loadIntelligence();
    } catch (error) {
      console.error('Failed to create intelligence:', error);
      toast.error('Nie udalo sie dodac informacji');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Usunac te informacje?')) return;
    try {
      await clientIntelligenceApi.deleteIntelligence(id);
      toast.success('Informacja usunieta');
      loadIntelligence();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Blad usuwania');
    }
  };

  // Group items by category
  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat.value);
    if (catItems.length > 0) {
      acc.push({ category: cat.value, label: cat.label, color: cat.color, items: catItems });
    }
    return acc;
  }, [] as { category: string; label: string; color: string; items: ClientIntelligence[] }[]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wywiad klienta</h1>
          <p className="text-gray-600">Zbieraj kluczowe informacje o klientach i kontaktach</p>
        </div>
      </div>

      {/* Entity Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Wybierz podmiot</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => { setEntityType('COMPANY'); setEntityId(''); setEntitySearch(''); setSelectedEntityLabel(''); setItems([]); setBriefing(null); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${entityType === 'COMPANY' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Firma
            </button>
            <button
              onClick={() => { setEntityType('CONTACT'); setEntityId(''); setEntitySearch(''); setSelectedEntityLabel(''); setItems([]); setBriefing(null); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${entityType === 'CONTACT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Kontakt
            </button>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={entitySearch}
              onChange={(e) => { setEntitySearch(e.target.value); if (entityId) { setEntityId(''); setSelectedEntityLabel(''); } }}
              onFocus={() => entityOptions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={entityType === 'COMPANY' ? 'Szukaj firmy...' : 'Szukaj kontaktu...'}
            />
            {showDropdown && entityOptions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {entityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectEntity(option)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {entityId && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj info
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!entityId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Wybierz firme lub kontakt</h3>
          <p className="text-gray-600">Wyszukaj podmiot powyzej aby zobaczyc zebrane informacje</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Briefing Summary */}
          {briefing && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Briefing: {selectedEntityLabel}</h3>
              {briefing.summary && (
                <p className="text-gray-700 mb-4">{briefing.summary}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Kluczowe fakty</p>
                  <p className="text-lg font-bold text-gray-900">{briefing.keyFacts?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Ostrzezenia</p>
                  <p className="text-lg font-bold text-red-600">{briefing.warnings?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Preferencje</p>
                  <p className="text-lg font-bold text-purple-600">{briefing.preferences?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Nadchodzace daty</p>
                  <p className="text-lg font-bold text-yellow-600">{briefing.upcomingDates?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Intelligence Items */}
          {groupedItems.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-4xl mb-3">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Brak informacji</h3>
              <p className="text-gray-600 mb-4">Dodaj pierwsza informacje o tym podmiocie</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dodaj informacje
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => (
                <div key={group.category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${group.color}`}>
                        {group.label}
                      </span>
                      <span className="text-sm text-gray-500">{group.items.length} elementow</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{item.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>Waznosc: {item.importance}/5</span>
                              {item.source && <span>Zrodlo: {item.source}</span>}
                              <span>{formatDate(item.createdAt)}</span>
                              {item.isPrivate && (
                                <span className="text-amber-600 font-medium">Prywatne</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                            title="Usun"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Nowa informacja</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tresc *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Np. Preferuje kontakt mailowy przed 10:00..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waznosc (1-5): {formData.importance}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={formData.importance}
                    onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Niska</span>
                    <span>Wysoka</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zrodlo</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Np. Spotkanie, email..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!formData.content.trim()}
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
