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
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FireIcon,
  TrophyIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

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
      toast.error('Failed to load habits');
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
      toast.error('Failed to load habits');
      console.error('Error loading habits:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await habitsApi.createHabit(data);
      toast.success('Habit created successfully');
      setIsHabitFormOpen(false);
      loadData(); // Reload both habits and stats
    } catch (error: any) {
      toast.error('Failed to create habit');
      console.error('Error creating habit:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await habitsApi.updateHabit(id, data);
      toast.success('Habit updated successfully');
      setEditingHabit(undefined);
      setIsHabitFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Failed to update habit');
      console.error('Error updating habit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await habitsApi.deleteHabit(id);
      toast.success('Habit deleted successfully');
      loadData();
    } catch (error: any) {
      if (error.response?.data?.entryCount) {
        toast.error(`Cannot delete habit: ${error.response.data.entryCount} entries exist`);
      } else {
        toast.error('Failed to delete habit');
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
    // Reload habits to get updated entry data and streaks
    loadData();
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habits Tracker</h1>
          <p className="text-gray-600">Build and maintain positive habits with streak tracking</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ViewColumnsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </button>

          {/* New Habit */}
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Habit
          </button>
        </div>
      </div>

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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 text-blue-600">🌱</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Habits</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalHabits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FireIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Longest Streak</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.longestStreak}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weekly Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.weeklyCompletionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Habits List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Habits Found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'No habits match your search criteria.' : 'Start building positive habits by creating your first habit tracker.'}
          </p>
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create First Habit
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Habits List</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredHabits.map((habit) => (
                  <div key={habit.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{habit.name}</h4>
                            {habit.description && (
                              <p className="text-sm text-gray-600">{habit.description}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              habit.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {habit.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FireIcon className="w-4 h-4 mr-1" />
                            {habitsApi.formatStreak(habit.currentStreak)}
                          </span>
                          <span>Frequency: {habit.frequency.toLowerCase()}</span>
                          <span>Best: {habit.bestStreak} days</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingHabit(habit);
                            setIsHabitFormOpen(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(habit.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn btn-outline btn-sm"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn btn-sm ${
                        page === pagination.page ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="btn btn-outline btn-sm"
                >
                  Next
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
    </motion.div>
  );
}