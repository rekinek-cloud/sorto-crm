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
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

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
      toast.error('Failed to load delegated tasks');
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
      toast.error('Failed to load delegated tasks');
      console.error('Error loading delegated tasks:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await delegatedApi.createDelegatedTask(data);
      toast.success('Task delegated successfully');
      setIsTaskFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Failed to delegate task');
      console.error('Error creating delegated task:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await delegatedApi.updateDelegatedTask(id, data);
      toast.success('Delegated task updated successfully');
      setEditingTask(undefined);
      setIsTaskFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Failed to update delegated task');
      console.error('Error updating delegated task:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD') => {
    try {
      await delegatedApi.updateDelegatedTask(id, { status });
      toast.success(`Task ${status.toLowerCase().replace('_', ' ')}`);
      loadData();
    } catch (error: any) {
      toast.error('Failed to update task status');
      console.error('Error updating task status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delegated task?')) return;
    
    try {
      await delegatedApi.deleteDelegatedTask(id);
      toast.success('Delegated task deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete delegated task');
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
          <h1 className="text-2xl font-bold text-gray-900">Delegated Tasks</h1>
          <p className="text-gray-600">Track tasks you've delegated to team members</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search delegated tasks..."
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

          {/* New Delegation */}
          <button
            onClick={() => setIsTaskFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Delegate Task
          </button>
        </div>
      </div>

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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Delegated</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDelegated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeDelegated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overdueDelegated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedDelegated}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Delegates */}
      {stats && stats.topDelegates.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Delegates</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.topDelegates.map((delegate, index) => (
              <div key={delegate.name} className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold text-primary-700">
                    {delegatedApi.getDelegateInitials(delegate.name)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{delegate.name}</p>
                <p className="text-xs text-gray-500">{delegate.count} tasks</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Delegated Tasks Found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'No tasks match your search criteria.' : 'Start delegating tasks to team members to track their progress.'}
          </p>
          <button
            onClick={() => setIsTaskFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Delegate First Task
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Delegated Tasks List</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredTasks.map((task) => {
                  const statusColors = delegatedApi.getStatusColor(task.status);
                  const isOverdue = delegatedApi.isOverdue(task.followUpDate);
                  const followUpText = delegatedApi.formatFollowUpDate(task.followUpDate);
                  
                  return (
                    <div key={task.id} className={`p-6 hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{task.description}</h4>
                              <p className="text-sm text-gray-600">Delegated to: {task.delegatedTo}</p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}
                            >
                              {task.status.replace('_', ' ')}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{delegatedApi.formatTimeSinceDelegation(task.delegatedOn)}</span>
                            {task.followUpDate && (
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {followUpText}
                              </span>
                            )}
                            {task.task && (
                              <span>🔗 {task.task.title}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setIsTaskFormOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
    </motion.div>
  );
}