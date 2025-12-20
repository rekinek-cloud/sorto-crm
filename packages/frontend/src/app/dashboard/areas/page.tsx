'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaOfResponsibility, AreaFilters, AreaStats } from '@/lib/api/areas';
import { areasApi } from '@/lib/api/areas';
import AreaCard from '@/components/areas/AreaCard';
import AreaForm from '@/components/areas/AreaForm';
import AreaFiltersComponent from '@/components/areas/AreaFilters';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'grid' | 'list';

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaOfResponsibility[]>([]);
  const [stats, setStats] = useState<AreaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaOfResponsibility | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AreaFilters>({
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

  // Load areas when filters change
  useEffect(() => {
    if (!isLoading) {
      loadAreas();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [areasData, statsData] = await Promise.all([
        areasApi.getAreas(filters),
        areasApi.getAreasStats(),
      ]);

      setAreas(areasData.areas);
      setPagination(areasData.pagination);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Failed to load areas');
      console.error('Error loading areas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAreas = async () => {
    try {
      const areasData = await areasApi.getAreas(filters);
      setAreas(areasData.areas);
      setPagination(areasData.pagination);
    } catch (error: any) {
      toast.error('Failed to load areas');
      console.error('Error loading areas:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await areasApi.createArea(data);
      toast.success('Area created successfully');
      setIsAreaFormOpen(false);
      loadData(); // Reload both areas and stats
    } catch (error: any) {
      toast.error('Failed to create area');
      console.error('Error creating area:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await areasApi.updateArea(id, data);
      toast.success('Area updated successfully');
      setEditingArea(undefined);
      setIsAreaFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Failed to update area');
      console.error('Error updating area:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this area?')) return;
    
    try {
      await areasApi.deleteArea(id);
      toast.success('Area deleted successfully');
      loadData();
    } catch (error: any) {
      if (error.response?.data?.projectCount) {
        toast.error(`Cannot delete area: ${error.response.data.projectCount} associated projects`);
      } else {
        toast.error('Failed to delete area');
      }
      console.error('Error deleting area:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const filteredAreas = areas.filter(area => {
    if (!searchQuery) return true;
    return area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           area.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           area.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-2xl font-bold text-gray-900">Areas of Responsibility</h1>
          <p className="text-gray-600">Define your roles and life areas to organize projects effectively</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search areas..."
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

          {/* Roadmap */}
          <button
            onClick={() => window.location.href = '/dashboard/areas/roadmap'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Roadmap
          </button>

          {/* New Area */}
          <button
            onClick={() => setIsAreaFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Area
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <AreaFiltersComponent
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
                <div className="w-6 h-6 text-blue-600">🏞️</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Areas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalAreas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 text-green-600">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Areas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeAreas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 text-purple-600">📁</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.areasWithProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 text-yellow-600">🕒</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recently Updated</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recentlyUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Areas List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🏞️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Areas Found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'No areas match your search criteria.' : 'Start organizing your life by defining your first area of responsibility.'}
          </p>
          <button
            onClick={() => setIsAreaFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create First Area
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAreas.map((area, index) => (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <AreaCard
                    area={area}
                    onEdit={(area) => {
                      setEditingArea(area);
                      setIsAreaFormOpen(true);
                    }}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Areas List</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredAreas.map((area) => (
                  <div key={area.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: area.color }}
                          >
                            {area.icon || area.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{area.name}</h4>
                            {area.description && (
                              <p className="text-sm text-gray-600">{area.description}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              area.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {area.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-1" />
                            {area._count?.projects || 0} projects
                          </span>
                          <span>Review: {area.reviewFrequency.toLowerCase()}</span>
                          {area.currentFocus && (
                            <span>Focus: {area.currentFocus}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingArea(area);
                            setIsAreaFormOpen(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(area.id)}
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

      {/* Area Form Modal */}
      {isAreaFormOpen && (
        <AreaForm
          area={editingArea}
          onSubmit={editingArea ? 
            (data) => handleEdit(editingArea.id, data) : 
            handleCreate
          }
          onCancel={() => {
            setIsAreaFormOpen(false);
            setEditingArea(undefined);
          }}
        />
      )}
    </motion.div>
  );
}