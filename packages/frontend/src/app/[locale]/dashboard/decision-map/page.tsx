// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { dealStakeholdersApi, DealStakeholdersResponse, CreateDealStakeholderRequest } from '@/lib/api/dealStakeholders';
import { DealStakeholder } from '@/types/gtd';
import { dealsApi } from '@/lib/api/deals';
import { contactsApi } from '@/lib/api/contacts';

const ROLES = [
  { value: 'DECISION_MAKER', label: 'Decydent', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'INFLUENCER', label: 'Influencer', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'CHAMPION', label: 'Champion', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'BLOCKER', label: 'Bloker', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'USER_ROLE', label: 'Uzytkownik', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'TECHNICAL', label: 'Techniczny', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'FINANCIAL', label: 'Finansowy', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'LEGAL', label: 'Prawny', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'PROCUREMENT', label: 'Zakupy', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const SENTIMENTS = [
  { value: 'POSITIVE', label: 'Pozytywny', emoji: '😊', color: 'text-green-600' },
  { value: 'NEUTRAL', label: 'Neutralny', emoji: '😐', color: 'text-gray-600' },
  { value: 'SKEPTICAL', label: 'Sceptyczny', emoji: '🤨', color: 'text-orange-600' },
  { value: 'NEGATIVE', label: 'Negatywny', emoji: '😟', color: 'text-red-600' },
  { value: 'UNKNOWN', label: 'Nieznany', emoji: '❓', color: 'text-gray-400' },
];

const getRoleColor = (role: string) => {
  return ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getRoleLabel = (role: string) => {
  return ROLES.find(r => r.value === role)?.label || role;
};

const getSentimentEmoji = (sentiment: string) => {
  return SENTIMENTS.find(s => s.value === sentiment)?.emoji || '❓';
};

const getSentimentLabel = (sentiment: string) => {
  return SENTIMENTS.find(s => s.value === sentiment)?.label || sentiment;
};

const getInfluenceColor = (influence: number) => {
  if (influence >= 70) return 'bg-red-500';
  if (influence >= 40) return 'bg-yellow-500';
  return 'bg-blue-500';
};

export default function DecisionMapPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [selectedDealTitle, setSelectedDealTitle] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);

  const [stakeholders, setStakeholders] = useState<DealStakeholder[]>([]);
  const [summary, setSummary] = useState<DealStakeholdersResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Contact search for form
  const [contactSearch, setContactSearch] = useState('');
  const [contactOptions, setContactOptions] = useState<{ id: string; label: string }[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const [formData, setFormData] = useState({
    contactId: '',
    contactLabel: '',
    role: 'INFLUENCER' as string,
    influence: 50,
    sentiment: 'NEUTRAL' as string,
    isChampion: false,
    objections: '',
    motivations: '',
    winStrategy: '',
  });

  // Load deals
  useEffect(() => {
    const loadDeals = async () => {
      try {
        const res = await dealsApi.getDeals({ limit: 100 });
        setDeals(res.deals);
      } catch (error) {
        console.error('Failed to load deals:', error);
      }
    };
    loadDeals();
  }, []);

  // Search deals
  useEffect(() => {
    if (dealSearch.length < 1) {
      setFilteredDeals(deals.slice(0, 10));
    } else {
      const term = dealSearch.toLowerCase();
      setFilteredDeals(deals.filter(d => d.title.toLowerCase().includes(term)).slice(0, 10));
    }
  }, [dealSearch, deals]);

  // Search contacts
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (contactSearch.length < 2) {
        setContactOptions([]);
        return;
      }
      try {
        const res = await contactsApi.getContacts({ search: contactSearch, limit: 20 });
        setContactOptions(res.contacts.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}${c.position ? ` (${c.position})` : ''}` })));
        setShowContactDropdown(true);
      } catch (error) {
        console.error('Contact search failed:', error);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [contactSearch]);

  // Load stakeholders
  const loadStakeholders = useCallback(async () => {
    if (!selectedDealId) return;
    try {
      setIsLoading(true);
      const res = await dealStakeholdersApi.getStakeholders(selectedDealId);
      setStakeholders(res.stakeholders || []);
      setSummary(res.summary || null);
    } catch (error) {
      console.error('Failed to load stakeholders:', error);
      toast.error('Nie udalo sie zaladowac interesariuszy');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDealId]);

  useEffect(() => {
    if (selectedDealId) {
      loadStakeholders();
    } else {
      setStakeholders([]);
      setSummary(null);
    }
  }, [selectedDealId, loadStakeholders]);

  const selectDeal = (deal: any) => {
    setSelectedDealId(deal.id);
    setSelectedDealTitle(deal.title);
    setDealSearch(deal.title);
    setShowDealDropdown(false);
  };

  const handleAddStakeholder = async () => {
    if (!formData.contactId) {
      toast.error('Wybierz kontakt');
      return;
    }
    try {
      const data: CreateDealStakeholderRequest = {
        dealId: selectedDealId,
        contactId: formData.contactId,
        role: formData.role as any,
        influence: formData.influence,
        sentiment: formData.sentiment as any,
        isChampion: formData.isChampion,
        objections: formData.objections.trim() || undefined,
        motivations: formData.motivations.trim() || undefined,
        winStrategy: formData.winStrategy.trim() || undefined,
      };

      await dealStakeholdersApi.createStakeholder(data);
      toast.success('Interesariusz dodany!');
      setShowAddForm(false);
      setFormData({
        contactId: '',
        contactLabel: '',
        role: 'INFLUENCER',
        influence: 50,
        sentiment: 'NEUTRAL',
        isChampion: false,
        objections: '',
        motivations: '',
        winStrategy: '',
      });
      setContactSearch('');
      loadStakeholders();
    } catch (error) {
      console.error('Failed to add stakeholder:', error);
      toast.error('Nie udalo sie dodac interesariusza');
    }
  };

  const handleDeleteStakeholder = async (id: string) => {
    if (!confirm('Usunac tego interesariusza?')) return;
    try {
      await dealStakeholdersApi.deleteStakeholder(id);
      toast.success('Interesariusz usuniety');
      loadStakeholders();
    } catch (error) {
      console.error('Failed to delete stakeholder:', error);
      toast.error('Blad usuwania');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa decyzji</h1>
          <p className="text-gray-600">Zarzadzaj interesariuszami w dealach</p>
        </div>
      </div>

      {/* Deal Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Wybierz deal</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={dealSearch}
              onChange={(e) => { setDealSearch(e.target.value); if (selectedDealId) { setSelectedDealId(''); setSelectedDealTitle(''); } }}
              onFocus={() => setShowDealDropdown(true)}
              onBlur={() => setTimeout(() => setShowDealDropdown(false), 200)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Szukaj deala..."
            />
            {showDealDropdown && filteredDeals.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredDeals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => selectDeal(deal)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm transition-colors"
                  >
                    <div className="font-medium">{deal.title}</div>
                    <div className="text-xs text-gray-500">
                      {deal.stage} | {deal.value ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: deal.currency || 'PLN' }).format(deal.value) : '-'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDealId && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj interesariusza
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedDealId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-3">🗺️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Wybierz deal</h3>
          <p className="text-gray-600">Wyszukaj deal powyzej aby zobaczyc mape interesariuszy</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Panel */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-600">Interesariusze</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-gray-600">Championi</p>
                <p className="text-2xl font-bold text-green-600">{summary.champions}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
                <p className="text-sm text-gray-600">Blokerzy</p>
                <p className="text-2xl font-bold text-red-600">{summary.blockers}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <p className="text-sm text-gray-600">Sredni wplyw</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(summary.averageInfluence)}</p>
              </div>
            </div>
          )}

          {/* Stakeholder Cards */}
          {stakeholders.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-4xl mb-3">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Brak interesariuszy</h3>
              <p className="text-gray-600 mb-4">Dodaj pierwszego interesariusza do tego deala</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dodaj interesariusza
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stakeholders.map((stakeholder) => (
                <div key={stakeholder.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {stakeholder.isChampion && (
                        <span className="text-yellow-500 text-lg" title="Champion">⭐</span>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {stakeholder.contact
                            ? `${stakeholder.contact.firstName} ${stakeholder.contact.lastName}`
                            : 'Kontakt'}
                        </h4>
                        {stakeholder.contact?.position && (
                          <p className="text-xs text-gray-500">{stakeholder.contact.position}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl" title={getSentimentLabel(stakeholder.sentiment)}>
                      {getSentimentEmoji(stakeholder.sentiment)}
                    </span>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(stakeholder.role)}`}>
                      {getRoleLabel(stakeholder.role)}
                    </span>
                  </div>

                  {/* Influence Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Wplyw</span>
                      <span className="font-semibold text-gray-900">{stakeholder.influence}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getInfluenceColor(stakeholder.influence)}`}
                        style={{ width: `${stakeholder.influence}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-600">
                    {stakeholder.objections && (
                      <div><span className="font-medium text-red-600">Obiekcje:</span> {stakeholder.objections}</div>
                    )}
                    {stakeholder.motivations && (
                      <div><span className="font-medium text-green-600">Motywacje:</span> {stakeholder.motivations}</div>
                    )}
                    {stakeholder.winStrategy && (
                      <div><span className="font-medium text-blue-600">Strategia:</span> {stakeholder.winStrategy}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteStakeholder(stakeholder.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Usun
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Stakeholder Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Nowy interesariusz</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact picker */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt *</label>
                <input
                  type="text"
                  value={formData.contactLabel || contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    if (formData.contactId) {
                      setFormData({ ...formData, contactId: '', contactLabel: '' });
                    }
                  }}
                  onFocus={() => contactOptions.length > 0 && setShowContactDropdown(true)}
                  onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Szukaj kontaktu..."
                />
                {showContactDropdown && contactOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {contactOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, contactId: option.id, contactLabel: option.label });
                          setContactSearch(option.label);
                          setShowContactDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sentyment</label>
                  <select
                    value={formData.sentiment}
                    onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {SENTIMENTS.map(s => (
                      <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wplyw: {formData.influence}/100
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.influence}
                  onChange={(e) => setFormData({ ...formData, influence: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Niski</span>
                  <span>Wysoki</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isChampion}
                  onChange={(e) => setFormData({ ...formData, isChampion: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  id="isChampion"
                />
                <label htmlFor="isChampion" className="text-sm text-gray-700">Jest championem (wspiera nas wewnetrznie)</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obiekcje</label>
                <textarea
                  value={formData.objections}
                  onChange={(e) => setFormData({ ...formData, objections: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Jakie ma obiekcje/obawy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motywacje</label>
                <textarea
                  value={formData.motivations}
                  onChange={(e) => setFormData({ ...formData, motivations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Co go motywuje do wspolpracy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strategia wygrania</label>
                <textarea
                  value={formData.winStrategy}
                  onChange={(e) => setFormData({ ...formData, winStrategy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Jak przekonac te osobe..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddStakeholder}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.contactId}
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
