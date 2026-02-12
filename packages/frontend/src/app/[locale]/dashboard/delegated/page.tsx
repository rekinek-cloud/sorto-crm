'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DelegatedTask, DelegatedTaskFilters, DelegatedTaskStats } from '@/lib/api/delegated';
import { delegatedApi } from '@/lib/api/delegated';
import DelegatedTaskCard from '@/components/delegated/DelegatedTaskCard';
import DelegatedTaskForm from '@/components/delegated/DelegatedTaskForm';
import DelegatedTaskFiltersComponent from '@/components/delegated/DelegatedTaskFilters';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Pencil,
  Trash2,
  Link,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonPage';

type ViewMode = 'grid' | 'list';

export default function DelegatedTasksPage() {
  const [tasks, setTasks] = useState<DelegatedTask[]>([]);
  const [stats, setStats] = useState<DelegatedTaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DelegatedTask | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DelegatedTaskFilters>({
    page: 1,
    limit: 20,
    sortBy: 'delegatedOn',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load tasks when filters change
  useEffect(() => {
    if (!isLoading) {
      loadTasks();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, statsData] = await Promise.all([
        delegatedApi.getDelegatedTasks(filters),
        delegatedApi.getDelegatedTasksStats(),
      ]);

      setTasks(tasksData.delegatedTasks);
      setPagination(tasksData.pagination);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac delegowanych zadan');
      console.error('Error loading delegated tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await delegatedApi.getDelegatedTasks(filters);
      setTasks(tasksData.delegatedTasks);
      setPagination(tasksData.pagination);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac delegowanych zadan');
      console.error('Error loading delegated tasks:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await delegatedApi.createDelegatedTask(data);
      toast.success('Zadanie delegowane pomyslnie');
      setIsTaskFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie delegowac zadania');
      console.error('Error creating delegated task:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await delegatedApi.updateDelegatedTask(id, data);
      toast.success('Zadanie zaktualizowane pomyslnie');
      setEditingTask(undefined);
      setIsTaskFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie zaktualizowac zadania');
      console.error('Error updating delegated task:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD') => {
    try {
      await delegatedApi.updateDelegatedTask(id, { status });
      toast.success(`Status zadania zmieniony na ${status.toLowerCase().replace('_', ' ')}`);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie zmienic statusu zadania');
      console.error('Error updating task status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac to delegowane zadanie?')) return;

    try {
      await delegatedApi.deleteDelegatedTask(id);
      toast.success('Zadanie usuniete pomyslnie');
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie usunac zadania');
      console.error('Error deleting delegated task:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    return task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           task.delegatedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
           task.notes?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage withStats={true} rows={6} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Delegowane zadania"
        subtitle="Sledz zadania delegowane do czlonkow zespolu"
        icon={Users}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj zadan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtry
            </button>

            {/* New Delegation */}
            <button
              onClick={() => setIsTaskFormOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Deleguj zadanie
            </button>
          </div>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <DelegatedTaskFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie delegowane</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalDelegated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aktywne zadania</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.activeDelegated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Zaleglosci</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.overdueDelegated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ukonczone</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.completedDelegated}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Delegates */}
      {stats && stats.topDelegates.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Najczesciej delegowani</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.topDelegates.map((delegate, index) => (
              <div key={delegate.name} className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {delegatedApi.getDelegateInitials(delegate.name)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{delegate.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{delegate.count} zadan</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Nie znaleziono delegowanych zadan</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchQuery ? 'Zadne zadania nie pasuja do kryteriow wyszukiwania.' : 'Zacznij delegowac zadania do czlonkow zespolu, aby sledzic ich postepy.'}
          </p>
          <button
            onClick={() => setIsTaskFormOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center mx-auto transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Deleguj pierwsze zadanie
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <DelegatedTaskCard
                    task={task}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setIsTaskFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Lista delegowanych zadan</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTasks.map((task) => {
                  const statusColors = delegatedApi.getStatusColor(task.status);
                  const isOverdue = delegatedApi.isOverdue(task.followUpDate);
                  const followUpText = delegatedApi.formatFollowUpDate(task.followUpDate);

                  return (
                    <div key={task.id} className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">{task.description}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Delegowane do: {task.delegatedTo}</p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}
                            >
                              {task.status.replace('_', ' ')}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                Zaleglosc
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                            <span>{delegatedApi.formatTimeSinceDelegation(task.delegatedOn)}</span>
                            {task.followUpDate && (
                              <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                {followUpText}
                              </span>
                            )}
                            {task.task && (
                              <span className="flex items-center">
                                <Link className="w-3 h-3 mr-1" />
                                {task.task.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setIsTaskFormOpen(true);
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Wyswietlanie {(pagination.page - 1) * pagination.limit + 1} do{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} z{' '}
                {pagination.total} wynikow
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Poprzednia
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      } transition-colors`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Nastepna
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <DelegatedTaskForm
          task={editingTask}
          onSubmit={editingTask ?
            (data) => handleEdit(editingTask.id, data) :
            handleCreate
          }
          onCancel={() => {
            setIsTaskFormOpen(false);
            setEditingTask(undefined);
          }}
        />
      )}
    </PageShell>
  );
}
