'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  Link2,
  Heart,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  ChevronDown,
  RefreshCw,
  UserPlus,
  StickyNote,
  MapPin,
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import { contactRelationsApi, CreateContactRelationRequest } from '@/lib/api/contactRelations';
import { ContactRelation } from '@/types/streams';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

// ─── Relation type config ────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const RELATION_TYPES: Record<string, { label: string; variant: BadgeVariant }> = {
  REPORTS_TO:       { label: 'Podlega',            variant: 'info' },
  WORKS_WITH:       { label: 'Wspolpracuje',       variant: 'default' },
  KNOWS:            { label: 'Zna',                 variant: 'neutral' },
  REFERRED_BY:      { label: 'Polecony przez',      variant: 'success' },
  FAMILY:           { label: 'Rodzina',             variant: 'error' },
  TECHNICAL:        { label: 'Kontakt techniczny',  variant: 'info' },
  FORMER_COLLEAGUE: { label: 'Byly wspolpracownik', variant: 'warning' },
  MENTOR:           { label: 'Mentor',              variant: 'warning' },
  PARTNER:          { label: 'Partner',             variant: 'success' },
};

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: { name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function contactName(c?: { firstName: string; lastName: string } | null): string {
  if (!c) return '(nieznany)';
  return `${c.firstName} ${c.lastName}`;
}

function strengthBar(strength: number) {
  const pct = Math.min(100, Math.max(0, strength));
  let color = 'bg-slate-300 dark:bg-slate-600';
  if (pct >= 80) color = 'bg-emerald-500 dark:bg-emerald-400';
  else if (pct >= 50) color = 'bg-blue-500 dark:bg-blue-400';
  else if (pct >= 25) color = 'bg-amber-500 dark:bg-amber-400';
  else color = 'bg-red-400 dark:bg-red-500';
  return { pct, color };
}

// ─── Animation variants ─────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─── Page ────────────────────────────────────────────────────────────
export default function ContactRelationsPage() {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [relations, setRelations] = useState<ContactRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    toContactId: '',
    type: 'WORKS_WITH' as CreateContactRelationRequest['type'],
    strength: 50,
    notes: '',
    meetingContext: '',
  });

  // ─── Load contacts ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/contacts?limit=200');
        const data = res.data?.data || res.data;
        const list: ContactOption[] = Array.isArray(data) ? data : data?.contacts || data?.items || [];
        setContacts(list);
      } catch {
        toast.error('Nie udalo sie pobrac kontaktow');
      } finally {
        setContactsLoading(false);
      }
    })();
  }, []);

  // ─── Load relations ───────────────────────────────────────────────
  const loadRelations = useCallback(async (contactId: string) => {
    if (!contactId) {
      setRelations([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await contactRelationsApi.getContactRelations({ contactId });
      const list = Array.isArray(data) ? data : [];
      setRelations(list);
    } catch {
      setError('Nie udalo sie pobrac relacji');
      toast.error('Blad podczas ladowania relacji kontaktu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadRelations(selectedContactId);
    }
  }, [selectedContactId, loadRelations]);

  // ─── Filtered relations ───────────────────────────────────────────
  const filteredRelations = useMemo(() => {
    let result = relations;
    if (typeFilter && typeFilter !== 'all') {
      result = result.filter((r) => r.relationType === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const isFrom = r.fromContactId === selectedContactId;
        const other = isFrom ? r.toContact : r.fromContact;
        const name = contactName(other).toLowerCase();
        return name.includes(q) || r.notes?.toLowerCase().includes(q);
      });
    }
    return result;
  }, [relations, typeFilter, search, selectedContactId]);

  // ─── Create relation ──────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toContactId || !selectedContactId) {
      toast.error('Wybierz kontakt docelowy');
      return;
    }
    if (form.toContactId === selectedContactId) {
      toast.error('Nie mozna utworzyc relacji z samym soba');
      return;
    }
    setFormLoading(true);
    try {
      const req: CreateContactRelationRequest = {
        fromContactId: selectedContactId,
        toContactId: form.toContactId,
        type: form.type,
        strength: form.strength,
        notes: form.notes.trim() || undefined,
        meetingContext: form.meetingContext.trim() || undefined,
      };
      await contactRelationsApi.createContactRelation(req);
      toast.success('Relacja utworzona');
      setShowForm(false);
      setForm({ toContactId: '', type: 'WORKS_WITH', strength: 50, notes: '', meetingContext: '' });
      loadRelations(selectedContactId);
    } catch {
      toast.error('Nie udalo sie utworzyc relacji');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete relation ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await contactRelationsApi.deleteContactRelation(id);
      toast.success('Relacja usunieta');
      setDeleteId(null);
      loadRelations(selectedContactId);
    } catch {
      toast.error('Nie udalo sie usunac relacji');
    }
  };

  // Currently selected contact name
  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Relacje kontaktow"
          subtitle="Mapuj powiazania i sile relacji miedzy kontaktami"
          icon={Users}
          iconColor="text-indigo-600"
          breadcrumbs={[
            { label: 'Panel', href: '/dashboard' },
            { label: 'Relacje kontaktow' },
          ]}
          actions={
            selectedContactId ? (
              <ActionButton icon={Plus} onClick={() => setShowForm(true)}>
                Dodaj relacje
              </ActionButton>
            ) : undefined
          }
        />

        {/* Contact selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Wybierz kontakt
          </label>
          {contactsLoading ? (
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse max-w-md" />
          ) : (
            <div className="relative max-w-md">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 appearance-none transition-colors"
              >
                <option value="">-- Wybierz kontakt --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </motion.div>

        {/* No contact selected */}
        {!selectedContactId && !contactsLoading && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <EmptyState
              icon={Users}
              title="Wybierz kontakt"
              description="Wybierz kontakt, aby zobaczyc jego relacje"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <SkeletonPage />
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadRelations(selectedContactId)}
            >
              Sprobuj ponownie
            </ActionButton>
          </motion.div>
        )}

        {/* Relations list */}
        {!loading && !error && selectedContactId && (
          <div className="space-y-5">
            {/* Summary */}
            {relations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                <StatCard
                  label="Relacje razem"
                  value={relations.length}
                  icon={Link2}
                  iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
                />
                <StatCard
                  label="Srednia sila relacji"
                  value={
                    relations.length > 0
                      ? Math.round(
                          relations.reduce((s, r) => s + (r.strength || 0), 0) / relations.length
                        )
                      : 0
                  }
                  icon={Zap}
                  iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard
                  label="Silne relacje (70+)"
                  value={relations.filter((r) => (r.strength || 0) >= 70).length}
                  icon={Heart}
                  iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
              </motion.div>
            )}

            {/* Filter bar (only when there are relations) */}
            {relations.length > 0 && (
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Szukaj po nazwie kontaktu..."
                filters={[
                  {
                    key: 'type',
                    label: 'Wszystkie typy',
                    options: Object.entries(RELATION_TYPES).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                    })),
                  },
                ]}
                filterValues={{ type: typeFilter }}
                onFilterChange={(key, value) => {
                  if (key === 'type') setTypeFilter(value);
                }}
              />
            )}

            {relations.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <EmptyState
                  icon={UserPlus}
                  title="Brak relacji"
                  description={
                    selectedContact
                      ? `${contactName(selectedContact)} nie ma jeszcze zadnych relacji`
                      : 'Brak relacji dla tego kontaktu'
                  }
                  action={
                    <ActionButton icon={Plus} onClick={() => setShowForm(true)} size="sm">
                      Dodaj pierwsza relacje
                    </ActionButton>
                  }
                />
              </div>
            ) : filteredRelations.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <EmptyState
                  icon={Users}
                  title="Brak wynikow"
                  description="Zmien filtry aby zobaczyc relacje"
                />
              </div>
            ) : (
              <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredRelations.map((r) => {
                  const tc = RELATION_TYPES[r.relationType] || RELATION_TYPES.KNOWS;
                  const sb = strengthBar(r.strength || 0);
                  // Determine which side is "the other" contact
                  const isFrom = r.fromContactId === selectedContactId;
                  const otherContact = isFrom ? r.toContact : r.fromContact;
                  const direction = isFrom ? 'do' : 'od';

                  return (
                    <motion.div
                      key={r.id}
                      variants={cardVariants}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Contact name & direction */}
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                              {otherContact?.firstName?.[0] || '?'}
                              {otherContact?.lastName?.[0] || ''}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                {contactName(otherContact)}
                              </h3>
                              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                Relacja {direction}
                              </span>
                            </div>
                          </div>

                          {/* Type badge */}
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge variant={tc.variant} dot>
                              {tc.label}
                            </StatusBadge>
                            {r.isBidirectional && (
                              <StatusBadge variant="neutral">
                                <ArrowLeftRight className="w-3 h-3 mr-0.5" />
                                Dwustronna
                              </StatusBadge>
                            )}
                          </div>

                          {/* Strength bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Sila relacji
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {r.strength || 0}/100
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${sb.pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full transition-colors ${sb.color}`}
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          {r.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 flex items-start gap-1">
                              <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{r.notes}</span>
                            </p>
                          )}
                          {r.discoveredVia && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {r.discoveredVia}
                            </p>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                          title="Usun relacje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

        {/* ─── Create Form Modal ────────────────────────────────────── */}
        <FormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Nowa relacja"
          subtitle="Dodaj powiazanie miedzy kontaktami"
          position="center"
          footer={
            <>
              <ActionButton variant="secondary" onClick={() => setShowForm(false)}>
                Anuluj
              </ActionButton>
              <ActionButton
                loading={formLoading}
                icon={Plus}
                onClick={() => {
                  const formEl = document.getElementById('relation-form') as HTMLFormElement;
                  if (formEl) formEl.requestSubmit();
                }}
              >
                Dodaj relacje
              </ActionButton>
            </>
          }
        >
          <form id="relation-form" onSubmit={handleCreate} className="space-y-4">
            {/* To contact */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Kontakt docelowy *
              </label>
              <select
                value={form.toContactId}
                onChange={(e) => setForm({ ...form, toContactId: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 transition-colors"
                required
              >
                <option value="">-- Wybierz kontakt --</option>
                {contacts
                  .filter((c) => c.id !== selectedContactId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
              </select>
            </div>
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Typ relacji *
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as CreateContactRelationRequest['type'] })
                }
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 transition-colors"
              >
                {Object.entries(RELATION_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Strength slider */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Sila relacji:{' '}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {form.strength}
                </span>
                /100
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: parseInt(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>Slaba</span>
                <span>Silna</span>
              </div>
            </div>
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notatki
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none transition-colors"
                placeholder="Dodatkowe informacje o relacji..."
              />
            </div>
            {/* Meeting Context */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Kontekst poznania
              </label>
              <input
                type="text"
                value={form.meetingContext}
                onChange={(e) => setForm({ ...form, meetingContext: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors"
                placeholder="np. Konferencja IT 2025, Spotkanie networkingowe"
              />
            </div>
          </form>
        </FormModal>

        {/* ─── Delete Confirmation Toast ──────────────────────────── */}
        <AnimatePresence>
          {deleteId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Czy na pewno chcesz usunac te relacje?
              </p>
              <div className="flex items-center gap-2">
                <ActionButton variant="secondary" size="sm" onClick={() => setDeleteId(null)}>
                  Anuluj
                </ActionButton>
                <ActionButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(deleteId)}
                >
                  Usun
                </ActionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
