'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { milestonesApi, CreateMilestoneRequest } from '@/lib/api/milestones';
import { Milestone, Project, User } from '@/types/gtd';

// ─── Status config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Oczekuje',    color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'W trakcie',   color: 'bg-blue-100 text-blue-700' },
  COMPLETED:   { label: 'Ukonczone',   color: 'bg-green-100 text-green-700' },
  DELAYED:     { label: 'Opoznione',   color: 'bg-red-100 text-red-700' },
  BLOCKED:     { label: 'Zablokowane', color: 'bg-yellow-100 text-yellow-700' },
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

// ─── Page ────────────────────────────────────────────────────────────
export default function MilestonesPage() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

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
    if (!confirm('Czy na pewno chcesz usunac ten kamien milowy?')) return;
    try {
      await milestonesApi.deleteMilestone(id);
      toast.success('Kamien milowy usuniety');
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kamienie milowe</h1>
          <p className="text-sm text-gray-500 mt-1">Sledz postep kluczowych etapow projektow</p>
        </div>
        {selectedProjectId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nowy kamien milowy
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz projekt</label>
        {projectsLoading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedMilestone(null);
            }}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Wybierz projekt --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* No project selected */}
      {!selectedProjectId && !projectsLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          <p className="mt-3 text-gray-500">Wybierz projekt, aby zobaczyc kamienie milowe</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-500">Ladowanie...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
          <button onClick={() => loadMilestones(selectedProjectId)} className="ml-3 underline">
            Sprobuj ponownie
          </button>
        </div>
      )}

      {/* Milestones list */}
      {!loading && !error && selectedProjectId && (
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Brak kamieni milowych w tym projekcie</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Dodaj pierwszy kamien milowy
              </button>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-gray-900">{milestones.length}</div>
                  <div className="text-xs text-gray-500">Razem</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {milestones.filter((m) => m.status === 'COMPLETED').length}
                  </div>
                  <div className="text-xs text-gray-500">Ukonczone</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {milestones.filter((m) => m.status === 'IN_PROGRESS').length}
                  </div>
                  <div className="text-xs text-gray-500">W trakcie</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {milestones.filter((m) => m.isCritical).length}
                  </div>
                  <div className="text-xs text-gray-500">Krytyczne</div>
                </div>
              </div>

              {/* Timeline list */}
              <div className="relative">
                {/* vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {milestones.map((m, idx) => {
                  const progress = getProgress(m);
                  const days = daysUntil(m.dueDate);
                  const isOverdue = days !== null && days < 0 && m.status !== 'COMPLETED';
                  const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.PENDING;

                  return (
                    <div key={m.id} className="relative pl-14 pb-6">
                      {/* Circle on timeline */}
                      <div
                        className={`absolute left-4 w-5 h-5 rounded-full border-2 bg-white z-10 ${
                          m.status === 'COMPLETED'
                            ? 'border-green-500 bg-green-500'
                            : m.isCritical
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {m.status === 'COMPLETED' && (
                          <svg className="h-3 w-3 text-white m-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Card */}
                      <div
                        className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                          m.isCritical ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'
                        } ${selectedMilestone?.id === m.id ? 'ring-2 ring-blue-300' : ''}`}
                        onClick={() => setSelectedMilestone(selectedMilestone?.id === m.id ? null : m)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{m.name}</h3>
                              {m.isCritical && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                                  KRYTYCZNY
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                                {sc.label}
                              </span>
                            </div>
                            {m.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span>Termin: {formatDate(m.dueDate)}</span>
                              {days !== null && m.status !== 'COMPLETED' && (
                                <span className={isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}>
                                  {isOverdue ? `${Math.abs(days)} dni po terminie` : `${days} dni do terminu`}
                                </span>
                              )}
                              {m.responsible && (
                                <span>
                                  Odpowiedzialny: {m.responsible.firstName} {m.responsible.lastName}
                                </span>
                              )}
                              {progress && (
                                <span>
                                  Zadania: {progress.done}/{progress.total}
                                </span>
                              )}
                            </div>

                            {/* Progress bar */}
                            {progress && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${progress.pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 mt-0.5">{progress.pct}%</span>
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
                              className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:ring-1 focus:ring-blue-400"
                            >
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(m.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                              title="Usun"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {selectedMilestone?.id === m.id && m.tasks && m.tasks.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Zadania ({m.tasks.length})</h4>
                            <div className="space-y-1">
                              {m.tasks.map((t) => (
                                <div key={t.id} className="flex items-center gap-2 text-sm">
                                  <span
                                    className={`h-2 w-2 rounded-full shrink-0 ${
                                      t.status === 'COMPLETED' ? 'bg-green-400' : t.status === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-gray-300'
                                    }`}
                                  />
                                  <span className={t.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-700'}>
                                    {t.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Create Form Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nowy kamien milowy</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="np. Wdrozenie modulu CRM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  placeholder="Opis kamienia milowego..."
                />
              </div>
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termin *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              {/* Responsible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Osoba odpowiedzialna</label>
                <select
                  value={form.responsibleId}
                  onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isCritical}
                  onChange={(e) => setForm({ ...form, isCritical: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Oznacz jako krytyczny</span>
              </label>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {formLoading ? 'Tworzenie...' : 'Utworz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
