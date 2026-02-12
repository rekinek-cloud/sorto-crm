// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Wallet,
  Trash2,
} from 'lucide-react';
import { eventsApi, CreateEventRequest, EventFilters } from '@/lib/api/events';
import { Event } from '@/types/gtd';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { FormModal } from '@/components/ui/FormModal';

// ─── Config ──────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value: 'CONFERENCE', label: 'Konferencja' },
  { value: 'TRADE_SHOW', label: 'Targi' },
  { value: 'EXHIBITION', label: 'Wystawa' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'WORKSHOP', label: 'Warsztaty' },
  { value: 'COMPANY_EVENT', label: 'Event firmowy' },
  { value: 'OTHER', label: 'Inne' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Szkic' },
  { value: 'PLANNING', label: 'Planowanie' },
  { value: 'CONFIRMED', label: 'Potwierdzone' },
  { value: 'IN_PROGRESS', label: 'W trakcie' },
  { value: 'COMPLETED', label: 'Zakonczone' },
  { value: 'CANCELLED', label: 'Anulowane' },
];

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const getStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case 'DRAFT': return 'neutral';
    case 'PLANNING': return 'info';
    case 'CONFIRMED': return 'success';
    case 'IN_PROGRESS': return 'warning';
    case 'COMPLETED': return 'default';
    case 'CANCELLED': return 'error';
    default: return 'neutral';
  }
};

const getStatusLabel = (status: string) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
};

const getEventTypeLabel = (type: string) => {
  return EVENT_TYPES.find(t => t.value === type)?.label || type;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pl-PL');
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency || 'PLN',
  }).format(amount);
};

// ─── Input class helper ──────────────────────────────────────────────
const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

// ─── Page ────────────────────────────────────────────────────────────
export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 });
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'CONFERENCE' as string,
    venue: '',
    city: '',
    country: 'Polska',
    startDate: '',
    endDate: '',
    budgetPlanned: '',
    currency: 'PLN',
    status: 'PLANNING' as string,
  });

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: EventFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.eventType = typeFilter;

      const response = await eventsApi.getEvents(filters);
      let sorted = [...response.events];
      sorted.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      setEvents(sorted);
      setPagination(prev => ({ ...prev, total: response.pagination.total, pages: response.pagination.pages }));
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Nie udalo sie zaladowac wydarzen');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nazwa wydarzenia jest wymagana');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Daty poczatkowa i koncowa sa wymagane');
      return;
    }

    try {
      setCreating(true);
      const data: CreateEventRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        eventType: formData.eventType as any,
        venue: formData.venue.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budgetPlanned: formData.budgetPlanned ? parseFloat(formData.budgetPlanned) : undefined,
        currency: formData.currency || 'PLN',
        status: formData.status as any,
      };

      await eventsApi.createEvent(data);
      toast.success('Wydarzenie utworzone pomyslnie!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        eventType: 'CONFERENCE',
        venue: '',
        city: '',
        country: 'Polska',
        startDate: '',
        endDate: '',
        budgetPlanned: '',
        currency: 'PLN',
        status: 'PLANNING',
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Nie udalo sie utworzyc wydarzenia');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteLoadingId(id);
    try {
      await eventsApi.deleteEvent(id);
      toast.success('Wydarzenie zostalo usuniete');
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Nie udalo sie usunac wydarzenia');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // ─── Filtered data ─────────────────────────────────────────────────
  const filteredEvents = searchQuery
    ? events.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  // ─── Table columns ─────────────────────────────────────────────────
  const columns: Column<Event>[] = [
    {
      key: 'name',
      label: 'Nazwa',
      sortable: true,
      render: (_val, row) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{row.name}</div>
          {row.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'eventType',
      label: 'Typ',
      sortable: true,
      render: (_val, row) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {getEventTypeLabel(row.eventType)}
        </span>
      ),
    },
    {
      key: 'venue',
      label: 'Miejsce',
      sortable: true,
      render: (_val, row) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <div>
            <div className="text-sm text-slate-700 dark:text-slate-300">{row.venue || '-'}</div>
            {row.city && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {row.city}{row.country ? `, ${row.country}` : ''}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'startDate',
      label: 'Daty',
      sortable: true,
      getValue: (row) => new Date(row.startDate).getTime(),
      render: (_val, row) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <div>
            <div className="text-sm text-slate-700 dark:text-slate-300">{formatDate(row.startDate)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">do {formatDate(row.endDate)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_val, row) => (
        <StatusBadge variant={getStatusVariant(row.status)} dot>
          {getStatusLabel(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: 'budgetPlanned',
      label: 'Budzet',
      sortable: true,
      render: (_val, row) => (
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {formatCurrency(row.budgetPlanned, row.currency)}
          </span>
        </div>
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
            loading={deleteLoadingId === row.id}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDelete(row.id, e)}
            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
          />
        </div>
      ),
    },
  ];

  // ─── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Wydarzenia / Targi"
        subtitle="Zarzadzaj wydarzeniami, targami i konferencjami"
        icon={CalendarDays}
        iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
        breadcrumbs={[
          { label: 'Wydarzenia' },
        ]}
        actions={
          <ActionButton
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Dodaj wydarzenie
          </ActionButton>
        }
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          label="Wszystkie"
          value={pagination.total}
          icon={Layers}
          iconColor="text-slate-600 bg-slate-50 dark:bg-slate-700/50 dark:text-slate-400"
        />
        <StatCard
          label="Planowane"
          value={events.filter(e => e.status === 'PLANNING').length}
          icon={Clock}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Potwierdzone"
          value={events.filter(e => e.status === 'CONFIRMED').length}
          icon={CheckCircle2}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="W trakcie"
          value={events.filter(e => e.status === 'IN_PROGRESS').length}
          icon={CalendarDays}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </motion.div>

      {/* FilterBar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <FilterBar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Szukaj po nazwie, miejscu, miescie..."
          filters={[
            {
              key: 'status',
              label: 'Wszystkie statusy',
              options: STATUS_OPTIONS,
            },
            {
              key: 'eventType',
              label: 'Wszystkie typy',
              options: EVENT_TYPES,
            },
          ]}
          filterValues={{
            status: statusFilter || 'all',
            eventType: typeFilter || 'all',
          }}
          onFilterChange={(key, value) => {
            const val = value === 'all' ? '' : value;
            if (key === 'status') setStatusFilter(val);
            if (key === 'eventType') setTypeFilter(val);
            setPagination(p => ({ ...p, page: 1 }));
          }}
          sortOptions={[
            { value: 'asc', label: 'Data: rosnaco' },
            { value: 'desc', label: 'Data: malejaco' },
          ]}
          sortValue={sortOrder}
          onSortChange={(val) => setSortOrder(val as 'asc' | 'desc')}
          actions={
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              Znaleziono: {filteredEvents.length}
            </span>
          }
        />
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {filteredEvents.length === 0 && !isLoading ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <EmptyState
              icon={CalendarDays}
              title="Brak wydarzen"
              description="Dodaj pierwsze wydarzenie aby rozpoczac"
              action={
                <ActionButton icon={Plus} onClick={() => setShowCreateModal(true)}>
                  Dodaj wydarzenie
                </ActionButton>
              }
            />
          </div>
        ) : (
          <DataTable<Event>
            columns={columns}
            data={filteredEvents}
            onRowClick={(row) => router.push(`/dashboard/events/${row.id}`)}
            storageKey="events-list"
            pageSize={20}
            emptyMessage="Brak wydarzen do wyswietlenia"
          />
        )}
      </motion.div>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nowe wydarzenie"
        subtitle="Uzupelnij dane nowego wydarzenia"
        size="lg"
        position="right"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              icon={Plus}
              loading={creating}
              onClick={handleCreate}
              disabled={!formData.name.trim() || !formData.startDate || !formData.endDate}
            >
              Utworz wydarzenie
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nazwa wydarzenia *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="Np. Targi ITM Poznan 2026"
            />
          </div>

          <div>
            <label className={labelClass}>Opis</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Krotki opis wydarzenia..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Typ wydarzenia *</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className={inputClass}
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputClass}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Miejsce</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className={inputClass}
                placeholder="Hala Expo"
              />
            </div>
            <div>
              <label className={labelClass}>Miasto</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={inputClass}
                placeholder="Poznan"
              />
            </div>
            <div>
              <label className={labelClass}>Kraj</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={inputClass}
                placeholder="Polska"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data rozpoczecia *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Data zakonczenia *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                value={formData.budgetPlanned}
                onChange={(e) => setFormData({ ...formData, budgetPlanned: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Waluta</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={inputClass}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>
      </FormModal>
    </PageShell>
  );
}
