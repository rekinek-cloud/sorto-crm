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
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  BarChart3,
  Layers,
  CheckCircle,
  FolderOpen,
  Clock,
  Map,
  Pencil,
  Trash2,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonPage';

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
      toast.error('Nie udalo sie zaladowac obszarow');
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
      toast.error('Nie udalo sie zaladowac obszarow');
      console.error('Error loading areas:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await areasApi.createArea(data);
      toast.success('Obszar utworzony pomyslnie');
      setIsAreaFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie utworzyc obszaru');
      console.error('Error creating area:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await areasApi.updateArea(id, data);
      toast.success('Obszar zaktualizowany pomyslnie');
      setEditingArea(undefined);
      setIsAreaFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie zaktualizowac obszaru');
      console.error('Error updating area:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten obszar?')) return;

    try {
      await areasApi.deleteArea(id);
      toast.success('Obszar usuniety pomyslnie');
      loadData();
    } catch (error: any) {
      if (error.response?.data?.projectCount) {
        toast.error(`Nie mozna usunac obszaru: ${error.response.data.projectCount} powiazanych projektow`);
      } else {
        toast.error('Nie udalo sie usunac obszaru');
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
        title="Obszary odpowiedzialnosci"
        subtitle="Definiuj role i zyciowe obszary do efektywnej organizacji projektow"
        icon={Layers}
        iconColor="text-indigo-600"
        actions={
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj obszarow..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
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

            {/* Roadmap */}
            <button
              onClick={() => window.location.href = '/dashboard/areas/roadmap'}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors"
            >
              <Map className="w-4 h-4 mr-2" />
              Roadmapa
            </button>

            {/* New Area */}
            <button
              onClick={() => setIsAreaFormOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nowy obszar
            </button>
          </div>
        }
      />

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
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie obszary</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalAreas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aktywne obszary</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.activeAreas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Z projektami</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.areasWithProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ostatnio zmienione</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.recentlyUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Areas List */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Layers className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Nie znaleziono obszarow</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchQuery ? 'Zaden obszar nie pasuje do kryteriow wyszukiwania.' : 'Zacznij organizowac swoje zycie definiujac pierwszy obszar odpowiedzialnosci.'}
          </p>
          <button
            onClick={() => setIsAreaFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center mx-auto transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Utworz pierwszy obszar
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Lista obszarow</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAreas.map((area) => (
                  <div key={area.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
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
                            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">{area.name}</h4>
                            {area.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">{area.description}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              area.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {area.isActive ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            {area._count?.projects || 0} projektow
                          </span>
                          <span>Przeglad: {area.reviewFrequency.toLowerCase()}</span>
                          {area.currentFocus && (
                            <span>Fokus: {area.currentFocus}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingArea(area);
                            setIsAreaFormOpen(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(area.id)}
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
                          ? 'bg-indigo-600 text-white'
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
    </PageShell>
  );
}
