'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Target,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Pencil,
  Trash2,
  X,
  LayoutGrid,
  List,
  ArrowRight,
} from 'lucide-react';

import { leadsApi, Lead } from '@/lib/api/leads';
import { formatCurrency } from '@/lib/utils';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

interface NewLead {
  title: string;
  contactPerson: string;
  company: string;
  source: string;
  value: string;
  priority: string;
  description: string;
}

const EMPTY_NEW_LEAD: NewLead = {
  title: '',
  contactPerson: '',
  company: '',
  source: 'WEBSITE',
  value: '',
  priority: 'MEDIUM',
  description: '',
};

const STATUS_COLUMNS = [
  { id: 'NEW', title: 'Nowe', color: 'border-blue-400 dark:border-blue-500' },
  { id: 'CONTACTED', title: 'Kontakt', color: 'border-amber-400 dark:border-amber-500' },
  { id: 'QUALIFIED', title: 'Kwalifikacja', color: 'border-emerald-400 dark:border-emerald-500' },
  { id: 'PROPOSAL', title: 'Propozycja', color: 'border-amber-400 dark:border-amber-500' },
  { id: 'NEGOTIATION', title: 'Negocjacje', color: 'border-blue-400 dark:border-blue-500' },
  { id: 'WON', title: 'Wygrane', color: 'border-emerald-400 dark:border-emerald-500' },
  { id: 'LOST', title: 'Przegrane', color: 'border-red-400 dark:border-red-500' },
];

type StatusVariant = 'info' | 'warning' | 'success' | 'error' | 'neutral';

const STATUS_BADGE_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  NEW: { variant: 'info', label: 'Nowy' },
  CONTACTED: { variant: 'warning', label: 'Kontakt' },
  QUALIFIED: { variant: 'success', label: 'Kwalifikacja' },
  PROPOSAL: { variant: 'warning', label: 'Propozycja' },
  NEGOTIATION: { variant: 'info', label: 'Negocjacje' },
  WON: { variant: 'success', label: 'Wygrany' },
  LOST: { variant: 'error', label: 'Przegrany' },
};

const PRIORITY_BADGE_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  URGENT: { variant: 'error', label: 'Pilny' },
  HIGH: { variant: 'error', label: 'Wysoki' },
  MEDIUM: { variant: 'warning', label: 'Sredni' },
  LOW: { variant: 'neutral', label: 'Niski' },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Strona internetowa',
  REFERRAL: 'Referencje',
  SOCIAL_MEDIA: 'Social Media',
  EMAIL: 'Email',
  PHONE: 'Telefon',
  EVENT: 'Wydarzenie',
  OTHER: 'Inne',
};

// ---------------------------------------------------------------------------
// Filter configs for FilterBar
// ---------------------------------------------------------------------------

const STATUS_FILTER_OPTIONS = STATUS_COLUMNS.map(s => ({
  value: s.id,
  label: s.title,
}));

const PRIORITY_FILTER_OPTIONS = [
  { value: 'URGENT', label: 'Pilne' },
  { value: 'HIGH', label: 'Wysokie' },
  { value: 'MEDIUM', label: 'Srednie' },
  { value: 'LOW', label: 'Niskie' },
];

const FILTER_CONFIGS = [
  { key: 'status', label: 'Wszystkie statusy', options: STATUS_FILTER_OPTIONS },
  { key: 'priority', label: 'Wszystkie priorytety', options: PRIORITY_FILTER_OPTIONS },
];

// ---------------------------------------------------------------------------
// DataTable columns
// ---------------------------------------------------------------------------

const TABLE_COLUMNS: Column<Lead>[] = [
  {
    key: 'title',
    label: 'Tytul',
    sortable: true,
    render: (_val: any, row: Lead) => (
      <div>
        <span className="font-semibold text-slate-900 dark:text-slate-100">{row.title}</span>
        {row.contactPerson && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.contactPerson}</p>
        )}
      </div>
    ),
  },
  {
    key: 'contactPerson',
    label: 'Kontakt',
    sortable: true,
    render: (val: any) => (
      <span className="text-slate-700 dark:text-slate-300">{val || '-'}</span>
    ),
  },
  {
    key: 'company',
    label: 'Firma',
    sortable: true,
    render: (val: any) => (
      <span className="text-slate-700 dark:text-slate-300">{val || '-'}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (val: any) => {
      const mapping = STATUS_BADGE_MAP[val] || { variant: 'neutral' as StatusVariant, label: val };
      return <StatusBadge variant={mapping.variant} dot>{mapping.label}</StatusBadge>;
    },
  },
  {
    key: 'priority',
    label: 'Priorytet',
    sortable: true,
    render: (val: any) => {
      const mapping = PRIORITY_BADGE_MAP[val] || { variant: 'neutral' as StatusVariant, label: val };
      return <StatusBadge variant={mapping.variant}>{mapping.label}</StatusBadge>;
    },
  },
  {
    key: 'value',
    label: 'Wartosc',
    sortable: true,
    render: (val: any) => (
      <span className="font-medium text-slate-900 dark:text-slate-100">
        {val != null && val > 0 ? formatCurrency(val) : '-'}
      </span>
    ),
  },
  {
    key: 'source',
    label: 'Zrodlo',
    sortable: true,
    render: (val: any) => (
      <span className="text-slate-600 dark:text-slate-400">{val ? (SOURCE_LABELS[val] || val) : '-'}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pl-PL');
}

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------

const inputClass =
  'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [newLead, setNewLead] = useState<NewLead>({ ...EMPTY_NEW_LEAD });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await leadsApi.getLeads({ limit: 100 });
      setLeads(response.leads);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Nie udalo sie zaladowac leadow');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // ---------------------------------------------------------------------------
  // Filtered leads
  // ---------------------------------------------------------------------------

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.title.toLowerCase().includes(term) ||
          lead.contactPerson?.toLowerCase().includes(term) ||
          lead.company?.toLowerCase().includes(term)
      );
    }

    const statusFilter = filterValues.status;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    const priorityFilter = filterValues.priority;
    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    return filtered;
  }, [leads, searchTerm, filterValues]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'NEW').length;
    const contacted = leads.filter(
      (l) => l.status === 'CONTACTED' || l.status === 'QUALIFIED'
    ).length;
    const pipelineValue = leads
      .filter((l) => l.status !== 'LOST')
      .reduce((sum, l) => sum + (l.value || 0), 0);

    return { total, newCount, contacted, pipelineValue };
  }, [leads]);

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------

  const handleAddLead = useCallback(async () => {
    if (!newLead.title.trim()) {
      toast.error('Nazwa leada jest wymagana');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await leadsApi.createLead({
        title: newLead.title.trim(),
        contactPerson: newLead.contactPerson.trim() || undefined,
        company: newLead.company.trim() || undefined,
        source: newLead.source || undefined,
        value: newLead.value ? parseFloat(newLead.value) : undefined,
        priority: newLead.priority,
        description: newLead.description.trim() || undefined,
      });

      setLeads((prev) => [created, ...prev]);
      setNewLead({ ...EMPTY_NEW_LEAD });
      setShowAddModal(false);
      toast.success('Lead dodany pomyslnie!');
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast.error('Nie udalo sie dodac leada');
    } finally {
      setIsSubmitting(false);
    }
  }, [newLead]);

  const updateLeadStatus = useCallback(
    async (leadId: string, newStatus: string) => {
      try {
        const updated = await leadsApi.updateLead(leadId, { status: newStatus });
        setLeads((prev) => prev.map((lead) => (lead.id === leadId ? updated : lead)));
        toast.success('Status leada zaktualizowany');
      } catch (error) {
        console.error('Error updating lead:', error);
        toast.error('Nie udalo sie zaktualizowac statusu');
      }
    },
    []
  );

  const handleDeleteLead = useCallback(async (leadId: string) => {
    try {
      await leadsApi.deleteLead(leadId);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      setShowDetailsModal(false);
      setSelectedLead(null);
      toast.success('Lead usuniety');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Nie udalo sie usunac leada');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Filter change handler
  // ---------------------------------------------------------------------------

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageShell>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <PageHeader
          title="Leady"
          subtitle="Zarzadzaj potencjalnymi klientami i mozliwosciami"
          icon={Target}
          iconColor="text-blue-600"
          breadcrumbs={[{ label: 'Leady' }]}
          actions={
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Widok Kanban"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Widok tabeli"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <ActionButton icon={Plus} onClick={() => setShowAddModal(true)}>
                Dodaj lead
              </ActionButton>
            </div>
          }
        />

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatCard
            label="Lacznie"
            value={stats.total}
            icon={Users}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            label="Nowe"
            value={stats.newCount}
            icon={Target}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatCard
            label="W kontakcie"
            value={stats.contacted}
            icon={TrendingUp}
            iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatCard
            label="Wartosc pipeline"
            value={stats.pipelineValue > 0 ? formatCurrency(stats.pipelineValue) : '0 PLN'}
            icon={DollarSign}
            iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
          />
        </motion.div>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <FilterBar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Szukaj leadow..."
            filters={FILTER_CONFIGS}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Brak leadow"
              description="Nie znaleziono leadow pasujacych do filtrow. Dodaj nowego leada, aby rozpoczac."
              action={
                <ActionButton icon={Plus} onClick={() => setShowAddModal(true)}>
                  Dodaj lead
                </ActionButton>
              }
            />
          ) : viewMode === 'kanban' ? (
            <KanbanView
              leads={filteredLeads}
              onCardClick={(lead) => {
                setSelectedLead(lead);
                setShowDetailsModal(true);
              }}
            />
          ) : (
            <DataTable<Lead>
              columns={TABLE_COLUMNS}
              data={filteredLeads}
              onRowClick={(lead) => {
                setSelectedLead(lead);
                setShowDetailsModal(true);
              }}
              storageKey="leads-table"
              pageSize={20}
              emptyMessage="Brak leadow"
              stickyHeader
            />
          )}
        </motion.div>
      </motion.div>

      {/* Add Lead Modal (slide from right) */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Dodaj nowy lead"
        subtitle="Wypelnij dane potencjalnego klienta"
        position="right"
        size="md"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddModal(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              icon={Plus}
              onClick={handleAddLead}
              disabled={!newLead.title.trim()}
              loading={isSubmitting}
            >
              Dodaj lead
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Nazwa leada *</label>
            <input
              type="text"
              value={newLead.title}
              onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
              className={inputClass}
              placeholder="Np. Wdrozenie CRM dla klienta X"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Osoba kontaktowa</label>
              <input
                type="text"
                value={newLead.contactPerson}
                onChange={(e) =>
                  setNewLead({ ...newLead, contactPerson: e.target.value })
                }
                className={inputClass}
                placeholder="Jan Kowalski"
              />
            </div>
            <div>
              <label className={labelClass}>Firma</label>
              <input
                type="text"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                className={inputClass}
                placeholder="Nazwa firmy"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Zrodlo</label>
              <select
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                className={inputClass}
              >
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priorytet</label>
              <select
                value={newLead.priority}
                onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                className={inputClass}
              >
                <option value="LOW">Niski</option>
                <option value="MEDIUM">Sredni</option>
                <option value="HIGH">Wysoki</option>
                <option value="URGENT">Pilny</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Wartosc (PLN)</label>
            <input
              type="number"
              value={newLead.value}
              onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
              className={inputClass}
              placeholder="10000"
            />
          </div>

          <div>
            <label className={labelClass}>Opis / Notatki</label>
            <textarea
              value={newLead.description}
              onChange={(e) => setNewLead({ ...newLead, description: e.target.value })}
              className={inputClass}
              rows={4}
              placeholder="Dodatkowe informacje o leadzie..."
            />
          </div>
        </div>
      </FormModal>

      {/* Lead Details Modal (center) */}
      <FormModal
        isOpen={showDetailsModal && selectedLead !== null}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLead(null);
        }}
        title={selectedLead?.title || ''}
        subtitle={selectedLead?.company || undefined}
        position="center"
        size="lg"
        footer={
          <>
            <ActionButton
              variant="danger"
              icon={Trash2}
              size="sm"
              onClick={() => selectedLead && handleDeleteLead(selectedLead.id)}
            >
              Usun lead
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedLead(null);
              }}
            >
              Zamknij
            </ActionButton>
          </>
        }
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Informacje
                </h4>
                <div className="space-y-2.5">
                  {selectedLead.contactPerson && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      {selectedLead.contactPerson}
                    </div>
                  )}
                  {selectedLead.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Target className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      {selectedLead.company}
                    </div>
                  )}
                  {selectedLead.source && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Zrodlo: {SOURCE_LABELS[selectedLead.source] || selectedLead.source}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Status i priorytet
                </h4>
                <div className="space-y-2.5">
                  <div>
                    <StatusBadge
                      variant={STATUS_BADGE_MAP[selectedLead.status]?.variant || 'neutral'}
                      dot
                      size="md"
                    >
                      {STATUS_BADGE_MAP[selectedLead.status]?.label || selectedLead.status}
                    </StatusBadge>
                  </div>
                  <div>
                    <StatusBadge
                      variant={PRIORITY_BADGE_MAP[selectedLead.priority]?.variant || 'neutral'}
                      size="md"
                    >
                      Priorytet:{' '}
                      {PRIORITY_BADGE_MAP[selectedLead.priority]?.label || selectedLead.priority}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedLead.description && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Opis
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  {selectedLead.description}
                </p>
              </div>
            )}

            {/* Value & Date */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                  Wartosc
                </h4>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedLead.value != null && selectedLead.value > 0
                    ? formatCurrency(selectedLead.value)
                    : '-'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                  Utworzono
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(selectedLead.createdAt)}
                </p>
              </div>
            </div>

            {/* Status change */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Zmien status
              </h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_COLUMNS.map((status) => (
                  <ActionButton
                    key={status.id}
                    variant={selectedLead.status === status.id ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={selectedLead.status === status.id}
                    onClick={() => {
                      updateLeadStatus(selectedLead.id, status.id);
                      setSelectedLead({
                        ...selectedLead,
                        status: status.id as Lead['status'],
                      });
                    }}
                  >
                    {status.title}
                  </ActionButton>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Kanban View sub-component
// ---------------------------------------------------------------------------

interface KanbanViewProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

function KanbanView({ leads, onCardClick }: KanbanViewProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: '1400px' }}>
        {STATUS_COLUMNS.map((column, colIndex) => {
          const columnLeads = leads.filter((lead) => lead.status === column.id);
          return (
            <motion.div
              key={column.id}
              className="flex-1 min-w-[220px]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: colIndex * 0.05 }}
            >
              <div
                className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border-t-4 ${column.color} border border-white/20 dark:border-slate-700/30 shadow-sm`}
              >
                {/* Column header */}
                <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {column.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-2.5 max-h-[450px] overflow-y-auto">
                  <AnimatePresence>
                    {columnLeads.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group"
                        onClick={() => onCardClick(lead)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        whileHover={{ y: -1 }}
                      >
                        {/* Title + priority */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                            {lead.title}
                          </h4>
                          <StatusBadge
                            variant={
                              PRIORITY_BADGE_MAP[lead.priority]?.variant || 'neutral'
                            }
                          >
                            {PRIORITY_BADGE_MAP[lead.priority]?.label || lead.priority}
                          </StatusBadge>
                        </div>

                        {/* Company / contact */}
                        {lead.company && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                            {lead.company}
                          </p>
                        )}
                        {lead.contactPerson && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                            {lead.contactPerson}
                          </p>
                        )}

                        {/* Value */}
                        {lead.value != null && lead.value > 0 && (
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                            {formatCurrency(lead.value)}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <span>{formatDate(lead.updatedAt)}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400">
                            <Eye className="w-3 h-3" />
                            <span>Szczegoly</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {columnLeads.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Brak leadow
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
