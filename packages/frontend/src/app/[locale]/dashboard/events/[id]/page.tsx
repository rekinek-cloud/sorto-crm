'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import {
  eventsApi,
  UpdateEventRequest,
  EventCompany,
  EventTeamMember,
  EventExpense,
  AddEventCompanyRequest,
  AddEventTeamMemberRequest,
  CreateEventExpenseRequest,
} from '@/lib/api/events';
import { Event as CRMEvent } from '@/types/gtd';

// ─── Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:       { label: 'Szkic',       color: 'bg-gray-100 text-gray-700' },
  PLANNING:    { label: 'Planowanie',  color: 'bg-blue-100 text-blue-700' },
  CONFIRMED:   { label: 'Potwierdzony', color: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'W trakcie',  color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED:   { label: 'Zakonczony', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:   { label: 'Anulowany',  color: 'bg-red-100 text-red-700' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  TRADE_SHOW:    'Targi',
  CONFERENCE:    'Konferencja',
  WEBINAR:       'Webinar',
  WORKSHOP:      'Warsztaty',
  NETWORKING:    'Networking',
  COMPANY_EVENT: 'Wydarzenie firmowe',
  OTHER:         'Inne',
};

const EXPENSE_CATEGORIES = [
  'Wynajem',
  'Catering',
  'Transport',
  'Noclegi',
  'Materialy',
  'Marketing',
  'Technologia',
  'Personel',
  'Ubezpieczenie',
  'Inne',
];

type TabType = 'overview' | 'companies' | 'team' | 'expenses' | 'tasks';

interface CompanyOption { id: string; name: string }
interface UserOption { id: string; firstName: string; lastName: string }

// ─── Helpers ─────────────────────────────────────────────────────────
function formatDate(d?: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pl-PL');
}

function formatCurrency(val?: number | null, currency?: string): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency || 'PLN' }).format(val);
}

// ─── Page ────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;

  // Core state
  const [event, setEvent] = useState<CRMEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Sub-data
  const [companies, setCompanies] = useState<EventCompany[]>([]);
  const [team, setTeam] = useState<EventTeamMember[]>([]);
  const [expenses, setExpenses] = useState<EventExpense[]>([]);

  // Options for adding
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  // Forms
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState<UpdateEventRequest>({});

  // Add company form
  const [companyForm, setCompanyForm] = useState<AddEventCompanyRequest>({ companyId: '', role: '' });
  // Add member form
  const [memberForm, setMemberForm] = useState<AddEventTeamMemberRequest>({ userId: '', role: '' });
  // Add expense form
  const [expenseForm, setExpenseForm] = useState<CreateEventExpenseRequest>({ category: EXPENSE_CATEGORIES[0], description: '', amount: 0, currency: 'PLN' });

  const [subLoading, setSubLoading] = useState(false);

  // ─── Load event ───────────────────────────────────────────────────
  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getEvent(eventId);
      setEvent(data);
      // Prefill edit form
      setEditForm({
        name: data.name,
        description: data.description || '',
        eventType: data.eventType,
        venue: data.venue || '',
        city: data.city || '',
        country: data.country || '',
        address: data.address || '',
        startDate: data.startDate?.slice(0, 10) || '',
        endDate: data.endDate?.slice(0, 10) || '',
        status: data.status,
        budgetPlanned: data.budgetPlanned || 0,
        currency: data.currency || 'PLN',
      });
    } catch {
      setError('Nie udalo sie pobrac danych wydarzenia');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // ─── Load sub-data ────────────────────────────────────────────────
  const loadCompanies = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await eventsApi.getEventCompanies(eventId);
      setCompanies(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [eventId]);

  const loadTeam = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await eventsApi.getEventTeam(eventId);
      setTeam(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [eventId]);

  const loadExpenses = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await eventsApi.getEventExpenses(eventId);
      setExpenses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [eventId]);

  // ─── Load options ─────────────────────────────────────────────────
  const loadOptions = useCallback(async () => {
    try {
      const [compRes, userRes] = await Promise.allSettled([
        apiClient.get('/companies?limit=200'),
        apiClient.get('/users?limit=100'),
      ]);
      if (compRes.status === 'fulfilled') {
        const d = compRes.value.data?.data || compRes.value.data;
        setCompanyOptions(Array.isArray(d) ? d : d?.companies || d?.items || []);
      }
      if (userRes.status === 'fulfilled') {
        const d = userRes.value.data?.data || userRes.value.data;
        setUserOptions(Array.isArray(d) ? d : d?.users || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadEvent();
    loadCompanies();
    loadTeam();
    loadExpenses();
    loadOptions();
  }, [loadEvent, loadCompanies, loadTeam, loadExpenses, loadOptions]);

  // ─── Edit event ───────────────────────────────────────────────────
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setSubLoading(true);
    try {
      const payload: UpdateEventRequest = {
        ...editForm,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
      };
      await eventsApi.updateEvent(eventId, payload);
      toast.success('Wydarzenie zaktualizowane');
      setShowEditModal(false);
      loadEvent();
    } catch {
      toast.error('Nie udalo sie zaktualizowac wydarzenia');
    } finally {
      setSubLoading(false);
    }
  };

  // ─── Companies CRUD ───────────────────────────────────────────────
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.companyId) {
      toast.error('Wybierz firme');
      return;
    }
    setSubLoading(true);
    try {
      await eventsApi.addEventCompany(eventId, companyForm);
      toast.success('Firma dodana do wydarzenia');
      setShowAddCompany(false);
      setCompanyForm({ companyId: '', role: '' });
      loadCompanies();
    } catch {
      toast.error('Nie udalo sie dodac firmy');
    } finally {
      setSubLoading(false);
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!confirm('Usunac firme z wydarzenia?')) return;
    try {
      await eventsApi.removeEventCompany(eventId, companyId);
      toast.success('Firma usunieta z wydarzenia');
      loadCompanies();
    } catch {
      toast.error('Nie udalo sie usunac firmy');
    }
  };

  // ─── Team CRUD ────────────────────────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.userId) {
      toast.error('Wybierz osobe');
      return;
    }
    setSubLoading(true);
    try {
      await eventsApi.addEventTeamMember(eventId, memberForm);
      toast.success('Czlonek zespolu dodany');
      setShowAddMember(false);
      setMemberForm({ userId: '', role: '' });
      loadTeam();
    } catch {
      toast.error('Nie udalo sie dodac czlonka zespolu');
    } finally {
      setSubLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Usunac osobe z zespolu?')) return;
    try {
      await eventsApi.removeEventTeamMember(eventId, memberId);
      toast.success('Osoba usunieta z zespolu');
      loadTeam();
    } catch {
      toast.error('Nie udalo sie usunac osoby');
    }
  };

  // ─── Expenses CRUD ────────────────────────────────────────────────
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      toast.error('Podaj kwote wydatku');
      return;
    }
    setSubLoading(true);
    try {
      await eventsApi.addEventExpense(eventId, expenseForm);
      toast.success('Wydatek dodany');
      setShowAddExpense(false);
      setExpenseForm({ category: EXPENSE_CATEGORIES[0], description: '', amount: 0, currency: 'PLN' });
      loadExpenses();
    } catch {
      toast.error('Nie udalo sie dodac wydatku');
    } finally {
      setSubLoading(false);
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    if (!confirm('Usunac ten wydatek?')) return;
    try {
      await eventsApi.removeEventExpense(eventId, expenseId);
      toast.success('Wydatek usuniety');
      loadExpenses();
    } catch {
      toast.error('Nie udalo sie usunac wydatku');
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budgetPlanned = event?.budgetPlanned || 0;
  const budgetUsedPct = budgetPlanned > 0 ? Math.round((totalExpenses / budgetPlanned) * 100) : 0;

  // ─── Loading / Error ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">Ladowanie wydarzenia...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Nie znaleziono wydarzenia'}</p>
          <button onClick={loadEvent} className="mt-3 text-blue-600 hover:text-blue-700 underline text-sm">
            Sprobuj ponownie
          </button>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;

  // ─── TABS ─────────────────────────────────────────────────────────
  const TABS: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Przeglad' },
    { key: 'companies', label: `Firmy (${companies.length})` },
    { key: 'team', label: `Zespol (${team.length})` },
    { key: 'expenses', label: `Wydatki (${expenses.length})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-500 mt-2">{event.description}</p>
            )}
            <div className="flex items-center gap-6 mt-3 text-sm text-gray-500 flex-wrap">
              {event.venue && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {event.venue}{event.city ? `, ${event.city}` : ''}{event.country ? `, ${event.country}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </span>
              {event.budgetPlanned != null && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Budzet: {formatCurrency(event.budgetPlanned, event.currency)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium shrink-0"
          >
            Edytuj
          </button>
        </div>
      </div>

      {/* ─── Tab navigation ──────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Overview ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-1">Firmy</div>
            <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-1">Zespol</div>
            <div className="text-2xl font-bold text-gray-900">{team.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-1">Planowany budzet</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(budgetPlanned, event.currency)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-1">Wydatki</div>
            <div className={`text-2xl font-bold ${budgetUsedPct > 100 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalExpenses, event.currency)}
            </div>
            {budgetPlanned > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${budgetUsedPct > 100 ? 'bg-red-500' : budgetUsedPct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-0.5">{budgetUsedPct}% budzetu</span>
              </div>
            )}
          </div>

          {/* Event details section */}
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-5 mt-2">
            <h3 className="font-medium text-gray-900 mb-3">Szczegoly wydarzenia</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Typ:</span>
                <span className="ml-2 text-gray-900">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
              </div>
              <div>
                <span className="text-gray-500">Miejsce:</span>
                <span className="ml-2 text-gray-900">{event.venue || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Miasto:</span>
                <span className="ml-2 text-gray-900">{event.city || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Kraj:</span>
                <span className="ml-2 text-gray-900">{event.country || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Adres:</span>
                <span className="ml-2 text-gray-900">{event.address || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Data rozpoczecia:</span>
                <span className="ml-2 text-gray-900">{formatDate(event.startDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Data zakonczenia:</span>
                <span className="ml-2 text-gray-900">{formatDate(event.endDate)}</span>
              </div>
              {event.setupDate && (
                <div>
                  <span className="text-gray-500">Przygotowanie:</span>
                  <span className="ml-2 text-gray-900">{formatDate(event.setupDate)}</span>
                </div>
              )}
              {event.teardownDate && (
                <div>
                  <span className="text-gray-500">Demontaz:</span>
                  <span className="ml-2 text-gray-900">{formatDate(event.teardownDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Companies ──────────────────────────────────────── */}
      {activeTab === 'companies' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddCompany(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Dodaj firme
            </button>
          </div>
          {companies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Brak firm przypisanych do tego wydarzenia</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Firma</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Rola</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.company?.name || `Firma #${c.companyId.slice(0, 8)}`}</td>
                      <td className="px-4 py-3 text-gray-500">{c.role || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveCompany(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          title="Usun z wydarzenia"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Team ───────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Dodaj osobe
            </button>
          </div>
          {team.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Brak czlonkow zespolu w tym wydarzeniu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {m.user?.firstName?.[0] || '?'}{m.user?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {m.user ? `${m.user.firstName} ${m.user.lastName}` : `Uzytkownik #${m.userId.slice(0, 8)}`}
                        </div>
                        {m.role && <div className="text-xs text-gray-500">{m.role}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      title="Usun z zespolu"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Expenses ───────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div>
          {/* Budget summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Planowany budzet</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(budgetPlanned, event.currency)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Faktyczne wydatki</div>
              <div className={`text-xl font-bold mt-1 ${budgetUsedPct > 100 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(totalExpenses, event.currency)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Pozostalo</div>
              <div className={`text-xl font-bold mt-1 ${budgetPlanned - totalExpenses < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(budgetPlanned - totalExpenses, event.currency)}
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Dodaj wydatek
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Brak wydatkow dla tego wydarzenia</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Kategoria</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Opis</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Kwota</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{exp.description || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(exp.amount, exp.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveExpense(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          title="Usun wydatek"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: Edit Event ───────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">Edytuj wydarzenie</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                  <select
                    value={editForm.eventType || ''}
                    onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value as CRMEvent['eventType'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as CRMEvent['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miejsce</label>
                <input
                  type="text"
                  value={editForm.venue || ''}
                  onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kraj</label>
                  <input
                    type="text"
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data rozpoczecia</label>
                  <input
                    type="date"
                    value={editForm.startDate?.slice(0, 10) || ''}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data zakonczenia</label>
                  <input
                    type="date"
                    value={editForm.endDate?.slice(0, 10) || ''}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planowany budzet</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={editForm.budgetPlanned || ''}
                    onChange={(e) => setEditForm({ ...editForm, budgetPlanned: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                  <select
                    value={editForm.currency || 'PLN'}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={subLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {subLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Company ──────────────────────────────────── */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCompany(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Dodaj firme do wydarzenia</h2>
              <button onClick={() => setShowAddCompany(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddCompany} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma *</label>
                <select
                  value={companyForm.companyId}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">-- Wybierz firme --</option>
                  {companyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                <input
                  type="text"
                  value={companyForm.role || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, role: e.target.value })}
                  placeholder="np. Sponsor, Wystawca, Partner"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddCompany(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Anuluj</button>
                <button type="submit" disabled={subLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {subLoading ? 'Dodawanie...' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Team Member ──────────────────────────────── */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddMember(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Dodaj osobe do zespolu</h2>
              <button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Osoba *</label>
                <select
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">-- Wybierz osobe --</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                <input
                  type="text"
                  value={memberForm.role || ''}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  placeholder="np. Koordynator, Prezenter, Logistyka"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Anuluj</button>
                <button type="submit" disabled={subLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {subLoading ? 'Dodawanie...' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Expense ──────────────────────────────────── */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddExpense(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nowy wydatek</h2>
              <button onClick={() => setShowAddExpense(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <input
                  type="text"
                  value={expenseForm.description || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Opis wydatku..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kwota *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                  <select
                    value={expenseForm.currency || 'PLN'}
                    onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddExpense(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Anuluj</button>
                <button type="submit" disabled={subLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {subLoading ? 'Dodawanie...' : 'Dodaj wydatek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
