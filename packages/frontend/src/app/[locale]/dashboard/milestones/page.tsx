'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Milestone as MilestoneIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
  CalendarDays,
  User,
  ListChecks,
  FolderKanban,
  ChevronDown,
  RefreshCw,
  Target,
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import { milestonesApi, CreateMilestoneRequest } from '@/lib/api/milestones';
import { Milestone, Project, User as UserType } from '@/types/gtd';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

// ─── Status config ───────────────────────────────────────────────────
type StatusVariant = 'neutral' | 'info' | 'success' | 'error' | 'warning';

const STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING:     { label: 'Oczekuje',    variant: 'neutral' },
  IN_PROGRESS: { label: 'W trakcie',   variant: 'info' },
  COMPLETED:   { label: 'Ukonczone',   variant: 'success' },
  DELAYED:     { label: 'Opoznione',   variant: 'error' },
  BLOCKED:     { label: 'Zablokowane', variant: 'warning' },
};

// ─── Helpers ─────────────────────────────────────────────────────────
function formatDate(d?: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pl-PL');
}

function daysUntil(d?: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Animation variants ─────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─── Page ────────────────────────────────────────────────────────────
export default function MilestonesPage() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail view
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    isCritical: false,
    responsibleId: '',
  });

  // ─── Load projects ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/projects?limit=200');
        const data = res.data?.data || res.data;
        const list = Array.isArray(data) ? data : data?.projects || [];
        setProjects(list);
      } catch {
        toast.error('Nie udalo sie pobrac projektow');
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, []);

  // ─── Load team members for form ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/users?limit=100');
        const data = res.data?.data || res.data;
        const list = Array.isArray(data) ? data : data?.users || [];
        setTeamMembers(list);
      } catch {
        // silent - team members are optional
      }
    })();
  }, []);

  // ─── Load milestones for selected project ─────────────────────────
  const loadMilestones = useCallback(async (projectId: string) => {
    if (!projectId) {
      setMilestones([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await milestonesApi.getMilestones({ projectId });
      const list = Array.isArray(data) ? data : [];
      // Sort by dueDate
      list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setMilestones(list);
    } catch {
      setError('Nie udalo sie pobrac kamieni milowych');
      toast.error('Blad podczas ladowania kamieni milowych');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestones(selectedProjectId);
    }
  }, [selectedProjectId, loadMilestones]);

  // ─── Filtered milestones ──────────────────────────────────────────
  const filteredMilestones = useMemo(() => {
    let result = milestones;
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [milestones, statusFilter, search]);

  // ─── Create milestone ──────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dueDate || !selectedProjectId) {
      toast.error('Nazwa i termin sa wymagane');
      return;
    }
    setFormLoading(true);
    try {
      const req: CreateMilestoneRequest = {
        projectId: selectedProjectId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        dueDate: new Date(form.dueDate).toISOString(),
        isCritical: form.isCritical,
        responsibleId: form.responsibleId || undefined,
      };
      await milestonesApi.createMilestone(req);
      toast.success('Kamien milowy utworzony');
      setShowForm(false);
      setForm({ name: '', description: '', dueDate: '', isCritical: false, responsibleId: '' });
      loadMilestones(selectedProjectId);
    } catch {
      toast.error('Nie udalo sie utworzyc kamienia milowego');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete milestone ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await milestonesApi.deleteMilestone(id);
      toast.success('Kamien milowy usuniety');
      setDeleteId(null);
      loadMilestones(selectedProjectId);
      if (selectedMilestone?.id === id) setSelectedMilestone(null);
    } catch {
      toast.error('Nie udalo sie usunac kamienia milowego');
    }
  };

  // ─── Update status ────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await milestonesApi.updateMilestone(id, { status: status as Milestone['status'] });
      toast.success('Status zaktualizowany');
      loadMilestones(selectedProjectId);
    } catch {
      toast.error('Nie udalo sie zmienic statusu');
    }
  };

  // ─── Progress calculation ─────────────────────────────────────────
  const getProgress = (m: Milestone) => {
    if (!m.tasks || m.tasks.length === 0) return null;
    const done = m.tasks.filter((t) => t.status === 'COMPLETED').length;
    return { done, total: m.tasks.length, pct: Math.round((done / m.tasks.length) * 100) };
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Kamienie milowe"
          subtitle="Sledz postep kluczowych etapow projektow"
          icon={MilestoneIcon}
          iconColor="text-violet-600"
          breadcrumbs={[
            { label: 'Panel', href: '/dashboard' },
            { label: 'Kamienie milowe' },
          ]}
          actions={
            selectedProjectId ? (
              <ActionButton icon={Plus} onClick={() => setShowForm(true)}>
                Nowy kamien milowy
              </ActionButton>
            ) : undefined
          }
        />

        {/* Project selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Wybierz projekt
          </label>
          {projectsLoading ? (
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse max-w-md" />
          ) : (
            <div className="relative max-w-md">
              <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedMilestone(null);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 appearance-none transition-colors"
              >
                <option value="">-- Wybierz projekt --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </motion.div>

        {/* No project selected */}
        {!selectedProjectId && !projectsLoading && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <EmptyState
              icon={FolderKanban}
              title="Wybierz projekt"
              description="Wybierz projekt, aby zobaczyc jego kamienie milowe"
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
              onClick={() => loadMilestones(selectedProjectId)}
            >
              Sprobuj ponownie
            </ActionButton>
          </motion.div>
        )}

        {/* Milestones list */}
        {!loading && !error && selectedProjectId && (
          <div className="space-y-5">
            {milestones.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <EmptyState
                  icon={Target}
                  title="Brak kamieni milowych"
                  description="W tym projekcie nie ma jeszcze kamieni milowych"
                  action={
                    <ActionButton icon={Plus} onClick={() => setShowForm(true)} size="sm">
                      Dodaj pierwszy kamien milowy
                    </ActionButton>
                  }
                />
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <StatCard
                    label="Razem"
                    value={milestones.length}
                    icon={MilestoneIcon}
                    iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
                  />
                  <StatCard
                    label="Ukonczone"
                    value={milestones.filter((m) => m.status === 'COMPLETED').length}
                    icon={CheckCircle2}
                    iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                  />
                  <StatCard
                    label="W trakcie"
                    value={milestones.filter((m) => m.status === 'IN_PROGRESS').length}
                    icon={Clock}
                    iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                  />
                  <StatCard
                    label="Krytyczne"
                    value={milestones.filter((m) => m.isCritical).length}
                    icon={AlertTriangle}
                    iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
                  />
                </motion.div>

                {/* Filter bar */}
                <FilterBar
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Szukaj kamienia milowego..."
                  filters={[
                    {
                      key: 'status',
                      label: 'Wszystkie statusy',
                      options: Object.entries(STATUS_CONFIG).map(([k, v]) => ({
                        value: k,
                        label: v.label,
                      })),
                    },
                  ]}
                  filterValues={{ status: statusFilter }}
                  onFilterChange={(key, value) => {
                    if (key === 'status') setStatusFilter(value);
                  }}
                />

                {/* Filtered empty */}
                {filteredMilestones.length === 0 && (
                  <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                    <EmptyState
                      icon={MilestoneIcon}
                      title="Brak wynikow"
                      description="Zmien filtry aby zobaczyc kamienie milowe"
                    />
                  </div>
                )}

                {/* Timeline list */}
                {filteredMilestones.length > 0 && (
                  <div className="relative">
                    {/* vertical line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredMilestones.map((m) => {
                        const progress = getProgress(m);
                        const days = daysUntil(m.dueDate);
                        const isOverdue = days !== null && days < 0 && m.status !== 'COMPLETED';
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.PENDING;

                        return (
                          <motion.div
                            key={m.id}
                            variants={itemVariants}
                            className="relative pl-14 pb-6"
                          >
                            {/* Circle on timeline */}
                            <div
                              className={`absolute left-[14px] w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center transition-colors ${
                                m.status === 'COMPLETED'
                                  ? 'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400'
                                  : m.isCritical
                                  ? 'border-red-500 bg-white dark:bg-slate-900 dark:border-red-400'
                                  : 'border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-600'
                              }`}
                            >
                              {m.status === 'COMPLETED' && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </div>

                            {/* Card */}
                            <motion.div
                              whileHover={{ scale: 1.005, y: -1 }}
                              className={`bg-white/80 backdrop-blur-xl border rounded-2xl p-4 cursor-pointer shadow-sm transition-all duration-300 ${
                                m.isCritical
                                  ? 'border-red-200 dark:border-red-800/40 ring-1 ring-red-100 dark:ring-red-900/30'
                                  : 'border-white/20 dark:border-slate-700/30'
                              } dark:bg-slate-800/80 ${
                                selectedMilestone?.id === m.id
                                  ? 'ring-2 ring-blue-400 dark:ring-blue-500'
                                  : ''
                              } hover:shadow-md`}
                              onClick={() =>
                                setSelectedMilestone(
                                  selectedMilestone?.id === m.id ? null : m
                                )
                              }
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                      {m.name}
                                    </h3>
                                    {m.isCritical && (
                                      <StatusBadge variant="error" dot>
                                        KRYTYCZNY
                                      </StatusBadge>
                                    )}
                                    <StatusBadge variant={sc.variant} dot>
                                      {sc.label}
                                    </StatusBadge>
                                  </div>
                                  {m.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                      {m.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="w-3.5 h-3.5" />
                                      Termin: {formatDate(m.dueDate)}
                                    </span>
                                    {days !== null && m.status !== 'COMPLETED' && (
                                      <span
                                        className={`flex items-center gap-1 ${
                                          isOverdue
                                            ? 'text-red-500 dark:text-red-400 font-medium'
                                            : 'text-slate-400 dark:text-slate-500'
                                        }`}
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                        {isOverdue
                                          ? `${Math.abs(days)} dni po terminie`
                                          : `${days} dni do terminu`}
                                      </span>
                                    )}
                                    {m.responsible && (
                                      <span className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        {m.responsible.firstName} {m.responsible.lastName}
                                      </span>
                                    )}
                                    {progress && (
                                      <span className="flex items-center gap-1">
                                        <ListChecks className="w-3.5 h-3.5" />
                                        Zadania: {progress.done}/{progress.total}
                                      </span>
                                    )}
                                  </div>

                                  {/* Progress bar */}
                                  {progress && (
                                    <div className="mt-2.5">
                                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progress.pct}%` }}
                                          transition={{ duration: 0.8, ease: 'easeOut' }}
                                          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                                        />
                                      </div>
                                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        {progress.pct}%
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={m.status}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(m.id, e.target.value);
                                    }}
                                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-400 transition-colors"
                                  >
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                      <option key={k} value={k}>
                                        {v.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteId(m.id);
                                    }}
                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Usun"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded detail */}
                              <AnimatePresence>
                                {selectedMilestone?.id === m.id &&
                                  m.tasks &&
                                  m.tasks.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 overflow-hidden"
                                    >
                                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Zadania ({m.tasks.length})
                                      </h4>
                                      <div className="space-y-1.5">
                                        {m.tasks.map((t) => (
                                          <div
                                            key={t.id}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <span
                                              className={`h-2 w-2 rounded-full shrink-0 ${
                                                t.status === 'COMPLETED'
                                                  ? 'bg-emerald-400 dark:bg-emerald-500'
                                                  : t.status === 'IN_PROGRESS'
                                                  ? 'bg-blue-400 dark:bg-blue-500'
                                                  : 'bg-slate-300 dark:bg-slate-600'
                                              }`}
                                            />
                                            <span
                                              className={
                                                t.status === 'COMPLETED'
                                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                                  : 'text-slate-700 dark:text-slate-300'
                                              }
                                            >
                                              {t.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Create Form Modal ────────────────────────────────────── */}
        <FormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Nowy kamien milowy"
          subtitle="Dodaj nowy etap do projektu"
          position="center"
          footer={
            <>
              <ActionButton variant="secondary" onClick={() => setShowForm(false)}>
                Anuluj
              </ActionButton>
              <ActionButton
                loading={formLoading}
                icon={Plus}
                onClick={(e) => {
                  const formEl = document.getElementById('milestone-form') as HTMLFormElement;
                  if (formEl) formEl.requestSubmit();
                }}
              >
                Utworz
              </ActionButton>
            </>
          }
        >
          <form id="milestone-form" onSubmit={handleCreate} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nazwa *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="np. Wdrozenie modulu CRM"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors"
                required
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Opis
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none transition-colors"
                placeholder="Opis kamienia milowego..."
              />
            </div>
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Termin *
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 transition-colors"
                required
              />
            </div>
            {/* Responsible */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Osoba odpowiedzialna
              </label>
              <select
                value={form.responsibleId}
                onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 transition-colors"
              >
                <option value="">-- Brak --</option>
                {teamMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            {/* Is Critical */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCritical}
                onChange={(e) => setForm({ ...form, isCritical: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-red-500" />
                Oznacz jako krytyczny
              </span>
            </label>
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
                Czy na pewno chcesz usunac ten kamien milowy?
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
