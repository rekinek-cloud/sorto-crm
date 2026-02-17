'use client';

import React, { useState, useEffect } from 'react';
import { Service, ServiceQuery, ServiceCreateData, ServiceUpdateData } from '@/types/products';
import { servicesApi } from '@/lib/api/services';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceForm from '@/components/services/ServiceForm';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Settings,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [filters, setFilters] = useState<ServiceQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadServices();
  }, [filters]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm || undefined,
        page: 1
      }));
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getServices(filters);
      setServices(response.services);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Failed to load services:', error);
      toast.error('Błąd ładowania usług');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (data: ServiceCreateData) => {
    try {
      const newService = await servicesApi.createService(data);
      setServices(prev => [newService, ...prev]);
      setShowForm(false);
      toast.success('Usługa utworzona pomyślnie');
    } catch (error: any) {
      console.error('Failed to create service:', error);
      toast.error('Błąd tworzenia usługi')
    }
  };

  const handleUpdateService = async (data: ServiceUpdateData) => {
    if (!editingService) return;

    try {
      const updatedService = await servicesApi.updateService(editingService.id, data);
      setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
      setEditingService(undefined);
      setShowForm(false);
      toast.success('Usługa zaktualizowana pomyślnie');
    } catch (error: any) {
      console.error('Failed to update service:', error);
      toast.error('Błąd aktualizacji usługi')
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      await servicesApi.deleteService(service.id);
      setServices(prev => prev.filter(s => s.id !== service.id));
      toast.success('Usługa usunięta pomyślnie');
    } catch (error: any) {
      console.error('Failed to delete service:', error);
      toast.error('Błąd usuwania usługi')
    }
  };

  const handleDuplicateService = async (service: Service) => {
    try {
      const duplicatedService = await servicesApi.duplicateService(service.id);
      setServices(prev => [duplicatedService, ...prev]);
      // TODO: Show success toast
    } catch (error: any) {
      console.error('Failed to duplicate service:', error);
      // TODO: Show error toast
    }
  };

  const handleViewService = (service: Service) => {
    // TODO: Navigate to service detail page
    console.log('View service:', service);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  return (
    <PageShell>
      <PageHeader
        title="Services"
        subtitle="Manage your service offerings"
        icon={Settings}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadServices()}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>
        }
      />

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {/* TODO: Load categories dynamically */}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="TEMPORARILY_UNAVAILABLE">Temporarily Unavailable</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>

          {/* Billing Type Filter */}
          <select
            value={filters.billingType || ''}
            onChange={(e) => handleFilterChange('billingType', e.target.value || undefined)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Billing Types</option>
            <option value="ONE_TIME">One Time</option>
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="PROJECT_BASED">Project Based</option>
          </select>

          {/* Active Filter */}
          <select
            value={filters.isActive?.toString() || ''}
            onChange={(e) => handleFilterChange('isActive', e.target.value ? e.target.value === 'true' : undefined)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Services</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Services</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pagination.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 dark:bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {services.filter(s => s.status === 'AVAILABLE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Featured</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {services.filter(s => s.isFeatured).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {services.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500 dark:text-slate-400">Loading services...</div>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Settings className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No services found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {searchTerm || filters.category || filters.status
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first service'
            }
          </p>
          {!searchTerm && !filters.category && !filters.status && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onView={handleViewService}
                  onDuplicate={handleDuplicateService}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
              {/* TODO: Implement list view */}
              <div className="p-4 text-slate-700 dark:text-slate-300">List view coming soon...</div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, pagination.page - 2) + i;
                  if (page > pagination.pages) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded-md ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ServiceForm
          service={editingService}
          onSubmit={(editingService ? handleUpdateService : handleCreateService) as any}
          onCancel={() => {
            setShowForm(false);
            setEditingService(undefined);
          }}
          isOpen={showForm}
        />
      )}
    </PageShell>
  );
};

export default ServicesPage;
