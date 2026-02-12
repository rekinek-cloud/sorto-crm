// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  MapPin,
  Calendar,
  Wallet,
  Building2,
  Users,
  Receipt,
  Pencil,
  Plus,
  Trash2,
  X,
  Eye,
  ArrowLeft,
  DollarSign,
  PiggyBank,
  TrendingDown,
  Tag,
  Globe,
  MapPinned,
  CalendarCheck,
  CalendarX,
  Clock,
  RefreshCw,
} from 'lucide-react';
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

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { FormModal } from '@/components/ui/FormModal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EntityCard } from '@/components/ui/EntityCard';

// ─── Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  DRAFT:       { label: 'Szkic',       variant: 'neutral' },
  PLANNING:    { label: 'Planowanie',  variant: 'info' },
  CONFIRMED:   { label: 'Potwierdzony', variant: 'success' },
  IN_PROGRESS: { label: 'W trakcie',  variant: 'warning' },
  COMPLETED:   { label: 'Zakonczony', variant: 'default' },
  CANCELLED:   { label: 'Anulowany',  variant: 'error' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  TRADE_SHOW:    'Targi',
  CONFERENCE:    'Konferencja',
  WEBINAR:       'Webinar',
  WORKSHOP:      'Warsztaty',
  NETWORKING:    'Networking',
  COMPANY_EVENT: 'Wydarzenie firmowe',
  EXHIBITION:    'Wystawa',
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

type TabType = 'overview' | 'companies' | 'team' | 'expenses';

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

// ─── Input class helpers ─────────────────────────────────────────────
const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

// ─── Page ────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
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
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (error || !event) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-8 text-center max-w-md">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 inline-flex mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-700 dark:text-red-400 font-medium">{error || 'Nie znaleziono wydarzenia'}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <ActionButton variant="secondary" icon={ArrowLeft} onClick={() => router.push('/dashboard/events')}>
                Powrot do listy
              </ActionButton>
              <ActionButton variant="secondary" icon={RefreshCw} onClick={loadEvent}>
                Sprobuj ponownie
              </ActionButton>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const sc = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;

  // ─── TABS ─────────────────────────────────────────────────────────
  const TABS: { key: TabType; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Przeglad', icon: Eye },
    { key: 'companies', label: 'Firmy', icon: Building2, count: companies.length },
    { key: 'team', label: 'Zespol', icon: Users, count: team.length },
    { key: 'expenses', label: 'Wydatki', icon: Receipt, count: expenses.length },
  ];

  // ─── Company table columns ────────────────────────────────────────
  const companyColumns: Column<EventCompany>[] = [
    {
      key: 'name',
      label: 'Firma',
      sortable: true,
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {row.company?.name || `Firma #${row.companyId.slice(0, 8)}`}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rola',
      sortable: true,
      render: (_val, row) => (
        <span className="text-slate-500 dark:text-slate-400">{row.role || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Akcje',
      sortable: false,
      render: (_val, row) => (
        <div className="flex justify-end">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleRemoveCompany(row.id)}
            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
          />
        </div>
      ),
    },
  ];

  // ─── Expense table columns ────────────────────────────────────────
  const expenseColumns: Column<EventExpense>[] = [
    {
      key: 'category',
      label: 'Kategoria',
      sortable: true,
      render: (_val, row) => (
        <StatusBadge variant="neutral">{row.category}</StatusBadge>
      ),
    },
    {
      key: 'description',
      label: 'Opis',
      sortable: true,
      render: (_val, row) => (
        <span className="text-slate-700 dark:text-slate-300">{row.description || '-'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Kwota',
      sortable: true,
      render: (_val, row) => (
        <span className="font-medium text-slate-900 dark:text-slate-100 text-right block">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Akcje',
      sortable: false,
      render: (_val, row) => (
        <div className="flex justify-end">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleRemoveExpense(row.id)}
            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
          />
        </div>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title={event.name}
        subtitle={event.description || EVENT_TYPE_LABELS[event.eventType] || event.eventType}
        icon={CalendarDays}
        iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
        breadcrumbs={[
          { label: 'Wydarzenia', href: '/dashboard/events' },
          { label: event.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge variant={sc.variant} dot size="md">{sc.label}</StatusBadge>
            <ActionButton variant="secondary" icon={Pencil} onClick={() => setShowEditModal(true)}>
              Edytuj
            </ActionButton>
          </div>
        }
      />

      {/* Event info bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-4 mb-6 text-sm text-slate-500 dark:text-slate-400"
      >
        {event.venue && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            {event.venue}{event.city ? `, ${event.city}` : ''}{event.country ? `, ${event.country}` : ''}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          {formatDate(event.startDate)} - {formatDate(event.endDate)}
        </span>
        {event.budgetPlanned != null && (
          <span className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-slate-400" />
            Budzet: {formatCurrency(event.budgetPlanned, event.currency)}
          </span>
        )}
        <StatusBadge variant="neutral" size="sm">
          {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
        </StatusBadge>
      </motion.div>

      {/* ─── Tab navigation ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 mb-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1"
      >
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ─── TAB: Overview ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Firmy"
                value={companies.length}
                icon={Building2}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                label="Zespol"
                value={team.length}
                icon={Users}
                iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
              />
              <StatCard
                label="Planowany budzet"
                value={formatCurrency(budgetPlanned, event.currency)}
                icon={PiggyBank}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Wydatki</p>
                    <p className={`text-2xl font-bold mt-1 ${budgetUsedPct > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(totalExpenses, event.currency)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${budgetUsedPct > 100 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                    <DollarSign className={`w-5 h-5 ${budgetUsedPct > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  </div>
                </div>
                {budgetPlanned > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className={`h-full rounded-full ${budgetUsedPct > 100 ? 'bg-red-500' : budgetUsedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">{budgetUsedPct}% budzetu</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event details card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-slate-400" />
                Szczegoly wydarzenia
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Typ</span>
                    <span className="text-slate-900 dark:text-slate-100">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Status</span>
                    <StatusBadge variant={sc.variant} dot size="sm">{sc.label}</StatusBadge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinned className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Miejsce</span>
                    <span className="text-slate-900 dark:text-slate-100">{event.venue || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Miasto</span>
                    <span className="text-slate-900 dark:text-slate-100">{event.city || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Kraj</span>
                    <span className="text-slate-900 dark:text-slate-100">{event.country || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Adres</span>
                    <span className="text-slate-900 dark:text-slate-100">{event.address || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Data rozpoczecia</span>
                    <span className="text-slate-900 dark:text-slate-100">{formatDate(event.startDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarX className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Data zakonczenia</span>
                    <span className="text-slate-900 dark:text-slate-100">{formatDate(event.endDate)}</span>
                  </div>
                </div>
                {event.setupDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Przygotowanie</span>
                      <span className="text-slate-900 dark:text-slate-100">{formatDate(event.setupDate)}</span>
                    </div>
                  </div>
                )}
                {event.teardownDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Demontaz</span>
                      <span className="text-slate-900 dark:text-slate-100">{formatDate(event.teardownDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── TAB: Companies ──────────────────────────────────────── */}
        {activeTab === 'companies' && (
          <motion.div
            key="companies"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-end mb-4">
              <ActionButton icon={Plus} onClick={() => setShowAddCompany(true)}>
                Dodaj firme
              </ActionButton>
            </div>
            {companies.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <EmptyState
                  icon={Building2}
                  title="Brak firm"
                  description="Brak firm przypisanych do tego wydarzenia"
                  action={
                    <ActionButton icon={Plus} onClick={() => setShowAddCompany(true)}>
                      Dodaj firme
                    </ActionButton>
                  }
                />
              </div>
            ) : (
              <DataTable<EventCompany>
                columns={companyColumns}
                data={companies}
                storageKey="event-companies"
                emptyMessage="Brak firm"
              />
            )}
          </motion.div>
        )}

        {/* ─── TAB: Team ───────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-end mb-4">
              <ActionButton icon={Plus} onClick={() => setShowAddMember(true)}>
                Dodaj osobe
              </ActionButton>
            </div>
            {team.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <EmptyState
                  icon={Users}
                  title="Brak czlonkow zespolu"
                  description="Dodaj osoby do zespolu tego wydarzenia"
                  action={
                    <ActionButton icon={Plus} onClick={() => setShowAddMember(true)}>
                      Dodaj osobe
                    </ActionButton>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <EntityCard
                      title={m.user ? `${m.user.firstName} ${m.user.lastName}` : `Uzytkownik #${m.userId.slice(0, 8)}`}
                      subtitle={m.role || undefined}
                      icon={
                        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                          {m.user?.firstName?.[0] || '?'}{m.user?.lastName?.[0] || ''}
                        </div>
                      }
                      badge={
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Usun z zespolu"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      }
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── TAB: Expenses ───────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Budget summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Planowany budzet"
                value={formatCurrency(budgetPlanned, event.currency)}
                icon={PiggyBank}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                label="Faktyczne wydatki"
                value={formatCurrency(totalExpenses, event.currency)}
                icon={DollarSign}
                iconColor={budgetUsedPct > 100
                  ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
                  : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                }
              />
              <StatCard
                label="Pozostalo"
                value={formatCurrency(budgetPlanned - totalExpenses, event.currency)}
                icon={TrendingDown}
                iconColor={budgetPlanned - totalExpenses < 0
                  ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
                  : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                }
              />
            </div>

            <div className="flex justify-end">
              <ActionButton icon={Plus} onClick={() => setShowAddExpense(true)}>
                Dodaj wydatek
              </ActionButton>
            </div>

            {expenses.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <EmptyState
                  icon={Receipt}
                  title="Brak wydatkow"
                  description="Dodaj pierwszy wydatek dla tego wydarzenia"
                  action={
                    <ActionButton icon={Plus} onClick={() => setShowAddExpense(true)}>
                      Dodaj wydatek
                    </ActionButton>
                  }
                />
              </div>
            ) : (
              <DataTable<EventExpense>
                columns={expenseColumns}
                data={expenses}
                storageKey="event-expenses"
                emptyMessage="Brak wydatkow"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: Edit Event ───────────────────────────────────── */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edytuj wydarzenie"
        subtitle="Zaktualizuj dane wydarzenia"
        size="lg"
        position="right"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowEditModal(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              loading={subLoading}
              onClick={(e: any) => handleEditEvent(e)}
            >
              Zapisz zmiany
            </ActionButton>
          </>
        }
      >
        <form onSubmit={handleEditEvent} className="space-y-4">
          <div>
            <label className={labelClass}>Nazwa *</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Opis</label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Typ</label>
              <select
                value={editForm.eventType || ''}
                onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value as CRMEvent['eventType'] })}
                className={inputClass}
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={editForm.status || ''}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as CRMEvent['status'] })}
                className={inputClass}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Miejsce</label>
            <input
              type="text"
              value={editForm.venue || ''}
              onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Miasto</label>
              <input
                type="text"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Kraj</label>
              <input
                type="text"
                value={editForm.country || ''}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data rozpoczecia</label>
              <input
                type="date"
                value={editForm.startDate?.slice(0, 10) || ''}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Data zakonczenia</label>
              <input
                type="date"
                value={editForm.endDate?.slice(0, 10) || ''}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Planowany budzet</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={editForm.budgetPlanned || ''}
                onChange={(e) => setEditForm({ ...editForm, budgetPlanned: parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Waluta</label>
              <select
                value={editForm.currency || 'PLN'}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                className={inputClass}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </form>
      </FormModal>

      {/* ─── MODAL: Add Company ──────────────────────────────────── */}
      <FormModal
        isOpen={showAddCompany}
        onClose={() => setShowAddCompany(false)}
        title="Dodaj firme do wydarzenia"
        subtitle="Wybierz firme i okresl jej role"
        size="md"
        position="center"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddCompany(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              loading={subLoading}
              onClick={(e: any) => handleAddCompany(e)}
            >
              Dodaj
            </ActionButton>
          </>
        }
      >
        <form onSubmit={handleAddCompany} className="space-y-4">
          <div>
            <label className={labelClass}>Firma *</label>
            <select
              value={companyForm.companyId}
              onChange={(e) => setCompanyForm({ ...companyForm, companyId: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">-- Wybierz firme --</option>
              {companyOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Rola</label>
            <input
              type="text"
              value={companyForm.role || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, role: e.target.value })}
              placeholder="np. Sponsor, Wystawca, Partner"
              className={inputClass}
            />
          </div>
        </form>
      </FormModal>

      {/* ─── MODAL: Add Team Member ──────────────────────────────── */}
      <FormModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="Dodaj osobe do zespolu"
        subtitle="Wybierz osobe i okresl jej role"
        size="md"
        position="center"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddMember(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              loading={subLoading}
              onClick={(e: any) => handleAddMember(e)}
            >
              Dodaj
            </ActionButton>
          </>
        }
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className={labelClass}>Osoba *</label>
            <select
              value={memberForm.userId}
              onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">-- Wybierz osobe --</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Rola</label>
            <input
              type="text"
              value={memberForm.role || ''}
              onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
              placeholder="np. Koordynator, Prezenter, Logistyka"
              className={inputClass}
            />
          </div>
        </form>
      </FormModal>

      {/* ─── MODAL: Add Expense ──────────────────────────────────── */}
      <FormModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        title="Nowy wydatek"
        subtitle="Dodaj wydatek do tego wydarzenia"
        size="md"
        position="center"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddExpense(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              loading={subLoading}
              onClick={(e: any) => handleAddExpense(e)}
            >
              Dodaj wydatek
            </ActionButton>
          </>
        }
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className={labelClass}>Kategoria *</label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className={inputClass}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Opis</label>
            <input
              type="text"
              value={expenseForm.description || ''}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              placeholder="Opis wydatku..."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kwota *</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={expenseForm.amount || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Waluta</label>
              <select
                value={expenseForm.currency || 'PLN'}
                onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                className={inputClass}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </form>
      </FormModal>
    </PageShell>
  );
}
