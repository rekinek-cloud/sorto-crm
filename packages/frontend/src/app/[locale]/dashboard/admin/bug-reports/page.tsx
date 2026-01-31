'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { bugReportsApi, type BugReport, type BugPriority, type BugStatus } from '@/lib/api/bugReports';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  WONT_FIX: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  LOW: 'Niski',
  MEDIUM: 'Średni',
  HIGH: 'Wysoki',
  CRITICAL: 'Krytyczny',
};

const statusLabels = {
  OPEN: 'Otwarte',
  IN_PROGRESS: 'W trakcie',
  RESOLVED: 'Rozwiązane',
  CLOSED: 'Zamknięte',
  WONT_FIX: 'Nie zostanie naprawione',
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

  // Check if user is admin (simple check - in real app you'd have proper role checking)
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

      // Reload data
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Brak dostępu</h1>
          <p className="text-gray-600">Nie masz uprawnień do przeglądania tej strony.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Zarządzanie zgłoszeniami błędów</h1>
        <p className="text-gray-600 mt-1">Panel administracyjny do przeglądania i zarządzania zgłoszeniami</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wszystkie zgłoszenia</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBugs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Otwarte</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.openBugs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rozwiązane</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.resolvedBugs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Krytyczne</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.criticalBugs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Wszystkie</option>
              <option value="OPEN">Otwarte</option>
              <option value="IN_PROGRESS">W trakcie</option>
              <option value="RESOLVED">Rozwiązane</option>
              <option value="CLOSED">Zamknięte</option>
              <option value="WONT_FIX">Nie zostanie naprawione</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Wszystkie</option>
              <option value="LOW">Niski</option>
              <option value="MEDIUM">Średni</option>
              <option value="HIGH">Wysoki</option>
              <option value="CRITICAL">Krytyczny</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Wszystkie</option>
              <option value="UI_UX">Interfejs użytkownika</option>
              <option value="FUNCTIONALITY">Funkcjonalność</option>
              <option value="PERFORMANCE">Wydajność</option>
              <option value="SECURITY">Bezpieczeństwo</option>
              <option value="DATA">Dane</option>
              <option value="INTEGRATION">Integracja</option>
              <option value="OTHER">Inne</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bug Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Zgłoszenia błędów</h2>
        </div>
        
        {bugReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Brak zgłoszeń do wyświetlenia
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bugReports.map((bug) => (
              <div
                key={bug.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedBug(bug)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{bug.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{bug.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[bug.priority]}`}>
                        {priorityLabels[bug.priority]}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[bug.status]}`}>
                        {statusLabels[bug.status]}
                      </span>
                      <span className="text-xs text-gray-500">
                        Zgłoszone przez: {bug.reporter.firstName} {bug.reporter.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
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

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedBug(null)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedBug.title}
                      </h3>
                      <button
                        onClick={() => setSelectedBug(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-6 w-6" />
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
                        <h4 className="font-medium text-gray-900">Opis</h4>
                        <p className="text-gray-600 mt-1">{selectedBug.description}</p>
                      </div>
                      
                      {selectedBug.stepsToReproduce && (
                        <div>
                          <h4 className="font-medium text-gray-900">Kroki do odtworzenia</h4>
                          <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedBug.stepsToReproduce}</p>
                        </div>
                      )}
                      
                      {selectedBug.expectedBehavior && (
                        <div>
                          <h4 className="font-medium text-gray-900">Oczekiwane zachowanie</h4>
                          <p className="text-gray-600 mt-1">{selectedBug.expectedBehavior}</p>
                        </div>
                      )}
                      
                      {selectedBug.actualBehavior && (
                        <div>
                          <h4 className="font-medium text-gray-900">Rzeczywiste zachowanie</h4>
                          <p className="text-gray-600 mt-1">{selectedBug.actualBehavior}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Zgłoszone przez:</span>
                          <p>{selectedBug.reporter.firstName} {selectedBug.reporter.lastName}</p>
                          <p className="text-gray-600">{selectedBug.reporter.email}</p>
                        </div>
                        <div>
                          <span className="font-medium">Data zgłoszenia:</span>
                          <p>{new Date(selectedBug.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {selectedBug.url && (
                        <div>
                          <span className="font-medium">URL:</span>
                          <p className="text-blue-600 break-all">{selectedBug.url}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Status Update Form */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Aktualizuj status</h4>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select name="status" defaultValue={selectedBug.status} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
                              <option value="OPEN">Otwarte</option>
                              <option value="IN_PROGRESS">W trakcie</option>
                              <option value="RESOLVED">Rozwiązane</option>
                              <option value="CLOSED">Zamknięte</option>
                              <option value="WONT_FIX">Nie zostanie naprawione</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notatki administratora</label>
                            <textarea
                              name="adminNotes"
                              defaultValue={selectedBug.adminNotes || ''}
                              rows={3}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Notatki wewnętrzne..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rozwiązanie</label>
                            <textarea
                              name="resolution"
                              defaultValue={selectedBug.resolution || ''}
                              rows={3}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Opis rozwiązania problemu..."
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={() => setSelectedBug(null)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={updating}
                          >
                            Anuluj
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                            disabled={updating}
                          >
                            {updating ? 'Aktualizowanie...' : 'Aktualizuj'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}