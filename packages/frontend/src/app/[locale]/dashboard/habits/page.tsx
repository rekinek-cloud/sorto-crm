'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Habit, HabitFilters, HabitStats } from '@/lib/api/habits';
import { habitsApi } from '@/lib/api/habits';
import HabitCard from '@/components/habits/HabitCard';
import HabitForm from '@/components/habits/HabitForm';
import HabitFiltersComponent from '@/components/habits/HabitFilters';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  Flame,
  Trophy,
  CheckCircle,
  BarChart3,
  Sprout,
  Pencil,
  Trash2,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonPage';

type ViewMode = 'grid' | 'list';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<HabitFilters>({
    page: 1,
    limit: 20,
    isActive: 'true',
    sortBy: 'name',
    sortOrder: 'asc'
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

  // Load habits when filters change
  useEffect(() => {
    if (!isLoading) {
      loadHabits();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [habitsData, statsData] = await Promise.all([
        habitsApi.getHabits(filters),
        habitsApi.getHabitsStats(),
      ]);

      setHabits(habitsData.habits);
      setPagination(habitsData.pagination);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac nawykow');
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHabits = async () => {
    try {
      const habitsData = await habitsApi.getHabits(filters);
      setHabits(habitsData.habits);
      setPagination(habitsData.pagination);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac nawykow');
      console.error('Error loading habits:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await habitsApi.createHabit(data);
      toast.success('Nawyk utworzony pomyslnie');
      setIsHabitFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie utworzyc nawyku');
      console.error('Error creating habit:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await habitsApi.updateHabit(id, data);
      toast.success('Nawyk zaktualizowany pomyslnie');
      setEditingHabit(undefined);
      setIsHabitFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie zaktualizowac nawyku');
      console.error('Error updating habit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten nawyk?')) return;

    try {
      await habitsApi.deleteHabit(id);
      toast.success('Nawyk usuniety pomyslnie');
      loadData();
    } catch (error: any) {
      if (error.response?.data?.entryCount) {
        toast.error(`Nie mozna usunac nawyku: ${error.response.data.entryCount} wpisow istnieje`);
      } else {
        toast.error('Nie udalo sie usunac nawyku');
      }
      console.error('Error deleting habit:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const filteredHabits = habits.filter(habit => {
    if (!searchQuery) return true;
    return habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           habit.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleEntryUpdate = () => {
    loadData();
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
        title="Tracker nawykow"
        subtitle="Buduj i utrzymuj pozytywne nawyki ze sledzeniem serii"
        icon={Sprout}
        iconColor="text-green-600"
        actions={
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj nawykow..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
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

            {/* New Habit */}
            <button
              onClick={() => setIsHabitFormOpen(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nowy nawyk
            </button>
          </div>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <HabitFiltersComponent
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
                <Sprout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie nawyki</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalHabits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Dzis ukonczone</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.todayCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Najdluzsza seria</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.longestStreak}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tygodniowy wynik</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.weeklyCompletionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Habits List */}
      {filteredHabits.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Sprout className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Nie znaleziono nawykow</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchQuery ? 'Zaden nawyk nie pasuje do kryteriow wyszukiwania.' : 'Zacznij budowac pozytywne nawyki tworzac pierwszy tracker.'}
          </p>
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center mx-auto transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Utworz pierwszy nawyk
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <HabitCard
                    habit={habit}
                    onEdit={(habit) => {
                      setEditingHabit(habit);
                      setIsHabitFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    onEntryUpdate={handleEntryUpdate}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Lista nawykow</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredHabits.map((habit) => (
                  <div key={habit.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">{habit.name}</h4>
                            {habit.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">{habit.description}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              habit.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {habit.isActive ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <Flame className="w-4 h-4 mr-1" />
                            {habitsApi.formatStreak(habit.currentStreak)}
                          </span>
                          <span>Czestotliwosc: {habit.frequency.toLowerCase()}</span>
                          <span>Najlepszy: {habit.bestStreak} dni</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingHabit(habit);
                            setIsHabitFormOpen(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(habit.id)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                          ? 'bg-green-600 text-white'
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

      {/* Habit Form Modal */}
      {isHabitFormOpen && (
        <HabitForm
          habit={editingHabit}
          onSubmit={editingHabit ?
            (data) => handleEdit(editingHabit.id, data) :
            handleCreate
          }
          onCancel={() => {
            setIsHabitFormOpen(false);
            setEditingHabit(undefined);
          }}
        />
      )}
    </PageShell>
  );
}
