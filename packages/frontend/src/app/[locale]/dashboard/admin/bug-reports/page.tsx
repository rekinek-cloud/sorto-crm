'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { bugReportsApi, type BugReport, type BugPriority, type BugStatus } from '@/lib/api/bugReports';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  Bug,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Search,
  Filter,
} from 'lucide-react';

// Extended BugReport interface for admin view
interface AdminBugReport extends BugReport {
  adminNotes?: string;
  resolution?: string;
  resolvedAt?: string;
}

interface BugStats {
  totalBugs: number;
  openBugs: number;
  resolvedBugs: number;
  criticalBugs: number;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  WONT_FIX: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Niski',
  MEDIUM: 'Sredni',
  HIGH: 'Wysoki',
  CRITICAL: 'Krytyczny',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Otwarte',
  IN_PROGRESS: 'W trakcie',
  RESOLVED: 'Rozwiazane',
  CLOSED: 'Zamkniete',
  WONT_FIX: 'Nie zostanie naprawione',
};

const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemAnimation = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function AdminBugReportsPage() {
  const { user } = useAuth();
  const [bugReports, setBugReports] = useState<AdminBugReport[]>([]);
  const [stats, setStats] = useState<BugStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState<AdminBugReport | null>(null);
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as BugStatus | '',
    priority: '' as BugPriority | '',
    category: '',
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

  useEffect(() => {
    if (isAdmin) {
      loadBugReports();
      loadStats();
    }
  }, [isAdmin, filters]);

  const loadBugReports = async () => {
    try {
      setLoading(true);
      const data = await bugReportsApi.getBugReports({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category as any || undefined,
      });
      setBugReports((data.bugReports || []) as AdminBugReport[]);
    } catch (error: any) {
      console.error('Failed to load bug reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await bugReportsApi.getStats();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load bug stats:', error);
    }
  };

  const updateBugStatus = async (bugId: string, status: string, adminNotes?: string, resolution?: string) => {
    try {
      setUpdating(true);
      await bugReportsApi.updateStatus(bugId, {
        status,
        adminNotes,
        resolution,
      });

      await loadBugReports();
      await loadStats();
      setSelectedBug(null);
    } catch (error: any) {
      console.error('Failed to update bug status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <EmptyState
            icon={AlertTriangle}
            title="Brak dostepu"
            description="Nie masz uprawnien do przegladania tej strony."
          />
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <PageHeader
          title="Raporty bledow"
          subtitle="Zarzadzaj zgloszeniami i sledzeniem bledow"
          icon={Bug}
          iconColor="text-red-600"
          breadcrumbs={[
            { label: 'Admin' },
            { label: 'Raporty bledow' }
          ]}
        />
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Raporty bledow"
        subtitle="Zarzadzaj zgloszeniami i sledzeniem bledow"
        icon={Bug}
        iconColor="text-red-600"
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Raporty bledow' }
        ]}
      />

      <motion.div variants={containerAnimation} initial="hidden" animate="show" className="space-y-6">
        {/* Stats */}
        {stats && (
          <motion.div variants={itemAnimation} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Wszystkie zgloszenia"
              value={stats.totalBugs}
              icon={AlertTriangle}
              iconColor="text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
            />
            <StatCard
              label="Otwarte"
              value={stats.openBugs}
              icon={Clock}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              label="Rozwiazane"
              value={stats.resolvedBugs}
              icon={CheckCircle}
              iconColor="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              label="Krytyczne"
              value={stats.criticalBugs}
              icon={Bug}
              iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
            />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={itemAnimation}>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  <option value="OPEN">Otwarte</option>
                  <option value="IN_PROGRESS">W trakcie</option>
                  <option value="RESOLVED">Rozwiazane</option>
                  <option value="CLOSED">Zamkniete</option>
                  <option value="WONT_FIX">Nie zostanie naprawione</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priorytet</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  <option value="LOW">Niski</option>
                  <option value="MEDIUM">Sredni</option>
                  <option value="HIGH">Wysoki</option>
                  <option value="CRITICAL">Krytyczny</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategoria</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                >
                  <option value="">Wszystkie</option>
                  <option value="UI_UX">Interfejs uzytkownika</option>
                  <option value="FUNCTIONALITY">Funkcjonalnosc</option>
                  <option value="PERFORMANCE">Wydajnosc</option>
                  <option value="SECURITY">Bezpieczenstwo</option>
                  <option value="DATA">Dane</option>
                  <option value="INTEGRATION">Integracja</option>
                  <option value="OTHER">Inne</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bug Reports List */}
        <motion.div variants={itemAnimation}>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Zgloszenia bledow</h2>
            </div>

            {bugReports.length === 0 ? (
              <EmptyState
                icon={Bug}
                title="Brak zgloszen do wyswietlenia"
                description="Zmien filtry lub poczekaj na nowe zgloszenia"
              />
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {bugReports.map((bug) => (
                  <div
                    key={bug.id}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedBug(bug)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{bug.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{bug.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[bug.priority]}`}>
                            {priorityLabels[bug.priority]}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[bug.status]}`}>
                            {statusLabels[bug.status]}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Zgloszone przez: {bug.reporter?.firstName} {bug.reporter?.lastName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(bug.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBug(null)}></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
            >
              <div className="px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="w-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
                      {selectedBug.title}
                    </h3>
                    <button
                      onClick={() => setSelectedBug(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[selectedBug.priority]}`}>
                        {priorityLabels[selectedBug.priority]}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedBug.status]}`}>
                        {statusLabels[selectedBug.status]}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Opis</h4>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedBug.description}</p>
                    </div>

                    {selectedBug.stepsToReproduce && (
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Kroki do odtworzenia</h4>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{selectedBug.stepsToReproduce}</p>
                      </div>
                    )}

                    {selectedBug.expectedBehavior && (
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Oczekiwane zachowanie</h4>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedBug.expectedBehavior}</p>
                      </div>
                    )}

                    {selectedBug.actualBehavior && (
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Rzeczywiste zachowanie</h4>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedBug.actualBehavior}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">Zgloszone przez:</span>
                        <p className="text-slate-700 dark:text-slate-300">{selectedBug.reporter?.firstName} {selectedBug.reporter?.lastName}</p>
                        <p className="text-slate-500 dark:text-slate-400">{selectedBug.reporter?.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">Data zgloszenia:</span>
                        <p className="text-slate-700 dark:text-slate-300">{new Date(selectedBug.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {selectedBug.url && (
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">URL:</span>
                        <p className="text-blue-600 dark:text-blue-400 break-all">{selectedBug.url}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Update Form */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Aktualizuj status</h4>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      updateBugStatus(
                        selectedBug.id,
                        formData.get('status') as string,
                        formData.get('adminNotes') as string,
                        formData.get('resolution') as string
                      );
                    }}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                          <select name="status" defaultValue={selectedBug.status} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2" required>
                            <option value="OPEN">Otwarte</option>
                            <option value="IN_PROGRESS">W trakcie</option>
                            <option value="RESOLVED">Rozwiazane</option>
                            <option value="CLOSED">Zamkniete</option>
                            <option value="WONT_FIX">Nie zostanie naprawione</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notatki administratora</label>
                          <textarea
                            name="adminNotes"
                            defaultValue={selectedBug.adminNotes || ''}
                            rows={3}
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                            placeholder="Notatki wewnetrzne..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rozwiazanie</label>
                          <textarea
                            name="resolution"
                            defaultValue={selectedBug.resolution || ''}
                            rows={3}
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
                            placeholder="Opis rozwiazania problemu..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setSelectedBug(null)}
                          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          disabled={updating}
                        >
                          Anuluj
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          disabled={updating}
                        >
                          {updating ? 'Aktualizowanie...' : 'Aktualizuj'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
