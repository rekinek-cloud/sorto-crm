'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  X,
  Link2,
  ArrowRight,
  AlertTriangle,
  Clock,
  Calendar,
  Trash2,
  Pencil,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Zap,
  Eye,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Project {
  id: string;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  progress: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  owner: string;
}

interface Dependency {
  id: string;
  fromProjectId: string;
  toProjectId: string;
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  delay: number;
  description?: string;
  isBlocking: boolean;
  createdAt: string;
  fromProject?: Project;
  toProject?: Project;
}

interface CriticalPath {
  projects: Project[];
  totalDuration: number;
  isDelayed: boolean;
  delayDays: number;
}

export default function ProjectDependenciesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [filteredDependencies, setFilteredDependencies] = useState<Dependency[]>([]);
  const [criticalPath, setCriticalPath] = useState<CriticalPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<Dependency | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  const [formData, setFormData] = useState({
    fromProjectId: '',
    toProjectId: '',
    type: 'FINISH_TO_START' as Dependency['type'],
    delay: 0,
    description: '',
    isBlocking: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDependencies();
  }, [dependencies, searchTerm, typeFilter, statusFilter]);

  const loadData = async () => {
    setTimeout(() => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Analiza wymagan systemu CRM',
          status: 'COMPLETED',
          startDate: '2024-01-01',
          endDate: '2024-01-15',
          progress: 100,
          priority: 'HIGH',
          description: 'Kompleksowa analiza wymagan dla nowego systemu CRM',
          owner: 'Anna Kowalska'
        },
        {
          id: '2',
          name: 'Projektowanie architektury',
          status: 'COMPLETED',
          startDate: '2024-01-16',
          endDate: '2024-02-01',
          progress: 100,
          priority: 'HIGH',
          description: 'Zaprojektowanie architektury systemu i bazy danych',
          owner: 'Marcin Nowak'
        },
        {
          id: '3',
          name: 'Implementacja backendu',
          status: 'ACTIVE',
          startDate: '2024-02-02',
          endDate: '2024-03-15',
          progress: 65,
          priority: 'CRITICAL',
          description: 'Rozwoj API i logiki biznesowej',
          owner: 'Tomasz Wisniewski'
        },
        {
          id: '4',
          name: 'Implementacja frontendu',
          status: 'PLANNING',
          startDate: '2024-02-15',
          endDate: '2024-04-01',
          progress: 0,
          priority: 'HIGH',
          description: 'Tworzenie interfejsu uzytkownika',
          owner: 'Katarzyna Zielinska'
        },
        {
          id: '5',
          name: 'Testy systemowe',
          status: 'PLANNING',
          startDate: '2024-03-15',
          endDate: '2024-04-15',
          progress: 0,
          priority: 'MEDIUM',
          description: 'Testy funkcjonalne i wydajnosciowe',
          owner: 'Piotr Lewandowski'
        },
        {
          id: '6',
          name: 'Wdrozenie produkcyjne',
          status: 'PLANNING',
          startDate: '2024-04-15',
          endDate: '2024-04-30',
          progress: 0,
          priority: 'CRITICAL',
          description: 'Migracja i wdrozenie w srodowisku produkcyjnym',
          owner: 'Robert Kaczmarek'
        }
      ];

      const mockDependencies: Dependency[] = [
        {
          id: '1',
          fromProjectId: '1',
          toProjectId: '2',
          type: 'FINISH_TO_START',
          delay: 1,
          description: 'Architektura wymaga zakonczenia analizy wymagan',
          isBlocking: true,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '2',
          fromProjectId: '2',
          toProjectId: '3',
          type: 'FINISH_TO_START',
          delay: 1,
          description: 'Backend wymaga gotowej architektury',
          isBlocking: true,
          createdAt: new Date(Date.now() - 5400000).toISOString()
        },
        {
          id: '3',
          fromProjectId: '3',
          toProjectId: '4',
          type: 'START_TO_START',
          delay: 14,
          description: 'Frontend moze rozpoczac sie po 2 tygodniach od startu backendu',
          isBlocking: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '4',
          fromProjectId: '3',
          toProjectId: '5',
          type: 'FINISH_TO_START',
          delay: 0,
          description: 'Testy wymagaja ukonczenia backendu',
          isBlocking: true,
          createdAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '5',
          fromProjectId: '4',
          toProjectId: '5',
          type: 'FINISH_TO_START',
          delay: 0,
          description: 'Testy wymagaja ukonczenia frontendu',
          isBlocking: true,
          createdAt: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: '6',
          fromProjectId: '5',
          toProjectId: '6',
          type: 'FINISH_TO_START',
          delay: 0,
          description: 'Wdrozenie po zakonczeniu testow',
          isBlocking: true,
          createdAt: new Date().toISOString()
        }
      ];

      const dependenciesWithProjects = mockDependencies.map(dep => ({
        ...dep,
        fromProject: mockProjects.find(p => p.id === dep.fromProjectId),
        toProject: mockProjects.find(p => p.id === dep.toProjectId)
      }));

      const mockCriticalPath: CriticalPath = {
        projects: mockProjects.filter(p => ['1', '2', '3', '5', '6'].includes(p.id)),
        totalDuration: 120,
        isDelayed: true,
        delayDays: 5
      };

      setProjects(mockProjects);
      setDependencies(dependenciesWithProjects);
      setCriticalPath(mockCriticalPath);
      setIsLoading(false);
    }, 500);
  };

  const filterDependencies = () => {
    let filtered = dependencies.filter(dep => {
      const matchesSearch =
        dep.fromProject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.toProject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || dep.type === typeFilter;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'blocking' && dep.isBlocking) ||
        (statusFilter === 'non-blocking' && !dep.isBlocking) ||
        (statusFilter === 'active' &&
          (dep.fromProject?.status === 'ACTIVE' || dep.toProject?.status === 'ACTIVE')) ||
        (statusFilter === 'completed' &&
          dep.fromProject?.status === 'COMPLETED' && dep.toProject?.status === 'COMPLETED');

      return matchesSearch && matchesType && matchesStatus;
    });

    setFilteredDependencies(filtered);
  };

  const handleCreateDependency = () => {
    if (!formData.fromProjectId || !formData.toProjectId) {
      toast.error('Wybierz projekty zrodlowy i docelowy');
      return;
    }

    if (formData.fromProjectId === formData.toProjectId) {
      toast.error('Projekt nie moze byc zalezny od siebie');
      return;
    }

    const fromProject = projects.find(p => p.id === formData.fromProjectId);
    const toProject = projects.find(p => p.id === formData.toProjectId);

    const newDependency: Dependency = {
      id: Date.now().toString(),
      fromProjectId: formData.fromProjectId,
      toProjectId: formData.toProjectId,
      type: formData.type,
      delay: formData.delay,
      description: formData.description.trim() || undefined,
      isBlocking: formData.isBlocking,
      createdAt: new Date().toISOString(),
      fromProject,
      toProject
    };

    setDependencies(prev => [newDependency, ...prev]);
    setFormData({
      fromProjectId: '',
      toProjectId: '',
      type: 'FINISH_TO_START',
      delay: 0,
      description: '',
      isBlocking: true
    });
    setShowCreateModal(false);
    toast.success('Zaleznosc zostala utworzona!');
  };

  const deleteDependency = (depId: string) => {
    setDependencies(prev => prev.filter(dep => dep.id !== depId));
    toast.success('Zaleznosc zostala usunieta');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'CRITICAL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FINISH_TO_START': return 'Zakoncz -> Rozpocznij';
      case 'START_TO_START': return 'Rozpocznij -> Rozpocznij';
      case 'FINISH_TO_FINISH': return 'Zakoncz -> Zakoncz';
      case 'START_TO_FINISH': return 'Rozpocznij -> Zakoncz';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Zaleznosci Projektow"
        subtitle="Zarzadzaj zaleznosciami miedzy projektami i sciezka krytyczna"
        icon={Link2}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Wykres
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Dodaj Zaleznosc
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Critical Path Alert */}
        {criticalPath && criticalPath.isDelayed && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1 mr-3" />
              <div className="flex-1">
                <h3 className="text-red-900 dark:text-red-300 font-medium">Opoznienie na sciezce krytycznej</h3>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                  Projekt jest opozniony o {criticalPath.delayDays} dni.
                  Wymaga natychmiastowej uwagi, aby uniknac dalszych opoznien.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lacznie zaleznosci</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{dependencies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Blokujace</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {dependencies.filter(d => d.isBlocking).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Projekty aktywne</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {projects.filter(p => p.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sciezka krytyczna</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {criticalPath?.totalDuration || 0} dni
                </p>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Szukaj zaleznosci..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <Link2 className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">Wszystkie typy</option>
                    <option value="FINISH_TO_START">Zakoncz -&gt; Rozpocznij</option>
                    <option value="START_TO_START">Rozpocznij -&gt; Rozpocznij</option>
                    <option value="FINISH_TO_FINISH">Zakoncz -&gt; Zakoncz</option>
                    <option value="START_TO_FINISH">Rozpocznij -&gt; Zakoncz</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">Wszystkie</option>
                    <option value="blocking">Blokujace</option>
                    <option value="non-blocking">Nieblokujace</option>
                    <option value="active">Aktywne</option>
                    <option value="completed">Ukonczone</option>
                  </select>
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Znaleziono: {filteredDependencies.length} z {dependencies.length}
                </div>
              </div>
            </div>

            {/* Dependencies List */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Zaleznosci ({filteredDependencies.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredDependencies.length === 0 ? (
                  <div className="p-12 text-center">
                    <Link2 className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak zaleznosci</h3>
                    <p className="text-slate-600 dark:text-slate-400">Utworz pierwsza zaleznosc miedzy projektami</p>
                  </div>
                ) : (
                  filteredDependencies.map((dependency, index) => (
                    <motion.div
                      key={dependency.id}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {dependency.fromProject?.name}
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {dependency.toProject?.name}
                              </span>
                            </div>

                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              dependency.isBlocking
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {dependency.isBlocking ? 'Blokujace' : 'Nieblokujace'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">Typ: </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {getTypeLabel(dependency.type)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">Opoznienie: </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {dependency.delay} dni
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">Utworzono: </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatDate(dependency.createdAt)}
                              </span>
                            </div>
                          </div>

                          {dependency.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{dependency.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {dependency.fromProject && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                getStatusColor(dependency.fromProject.status)
                              }`}>
                                {dependency.fromProject.name}: {dependency.fromProject.status}
                              </span>
                            )}
                            {dependency.toProject && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                getStatusColor(dependency.toProject.status)
                              }`}>
                                {dependency.toProject.name}: {dependency.toProject.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedDependency(dependency);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Edytuj"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDependency(dependency.id)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Usun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          /* Graph View */
          <div className="space-y-6">
            {/* Critical Path Visualization */}
            {criticalPath && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sciezka Krytyczna</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Czas trwania:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{criticalPath.totalDuration} dni</span>
                    {criticalPath.isDelayed && (
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        (+{criticalPath.delayDays} dni opoznienia)
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center space-x-2 overflow-x-auto pb-4">
                    {criticalPath.projects.map((project, index) => (
                      <div key={project.id} className="flex items-center flex-shrink-0">
                        <div className={`p-4 rounded-lg border-2 min-w-48 ${
                          project.status === 'COMPLETED' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' :
                          project.status === 'ACTIVE' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30' :
                          'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                        }`}>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{project.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'TBD'}
                          </div>
                          <div className="flex items-center mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            <span className="ml-2 text-xs text-slate-600 dark:text-slate-400">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div
                              className={`h-1.5 rounded-full ${
                                project.status === 'COMPLETED' ? 'bg-green-500' :
                                project.status === 'ACTIVE' ? 'bg-blue-500' :
                                'bg-slate-400 dark:bg-slate-500'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {index < criticalPath.projects.length - 1 && (
                          <ArrowRight className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-2 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Project Dependency Network */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Siec Zaleznosci Projektow</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map(project => {
                  const incoming = dependencies.filter(d => d.toProjectId === project.id);
                  const outgoing = dependencies.filter(d => d.fromProjectId === project.id);

                  return (
                    <div key={project.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="text-center mb-4">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-lg font-bold ${
                          project.status === 'COMPLETED' ? 'bg-green-500' :
                          project.status === 'ACTIVE' ? 'bg-blue-500' :
                          project.status === 'ON_HOLD' ? 'bg-yellow-500' :
                          project.status === 'PLANNING' ? 'bg-slate-500' :
                          'bg-red-500'
                        }`}>
                          {project.name.charAt(0)}
                        </div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 mt-2 text-sm">{project.name}</h4>
                        <div className="flex items-center justify-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{project.progress}% ukonczone</div>
                      </div>

                      <div className="space-y-3">
                        {incoming.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Zaleznosci przychodzace:</div>
                            <div className="space-y-1">
                              {incoming.map(dep => (
                                <div key={dep.id} className="flex items-center text-xs">
                                  <div className="w-2 h-2 bg-red-400 dark:bg-red-500 rounded-full mr-2"></div>
                                  <span className="text-slate-600 dark:text-slate-400 truncate">
                                    {dep.fromProject?.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {outgoing.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Zaleznosci wychodzace:</div>
                            <div className="space-y-1">
                              {outgoing.map(dep => (
                                <div key={dep.id} className="flex items-center text-xs">
                                  <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full mr-2"></div>
                                  <span className="text-slate-600 dark:text-slate-400 truncate">
                                    {dep.toProject?.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {incoming.length === 0 && outgoing.length === 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                            Brak zaleznosci
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dependency Flow Diagram */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Diagram Przeplywu</h3>

              <div className="space-y-4">
                {dependencies.map((dependency, index) => (
                  <div key={dependency.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          dependency.fromProject?.status === 'COMPLETED' ? 'bg-green-500' :
                          dependency.fromProject?.status === 'ACTIVE' ? 'bg-blue-500' :
                          'bg-slate-500'
                        }`}></div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-0 truncate">
                          {dependency.fromProject?.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {getTypeLabel(dependency.type)}
                        </span>
                        {dependency.delay > 0 && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                            +{dependency.delay}d
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          dependency.toProject?.status === 'COMPLETED' ? 'bg-green-500' :
                          dependency.toProject?.status === 'ACTIVE' ? 'bg-blue-500' :
                          'bg-slate-500'
                        }`}></div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-0 truncate">
                          {dependency.toProject?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {dependency.isBlocking && (
                        <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" title="Blokujace" />
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        dependency.isBlocking ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {dependency.isBlocking ? 'BLOK' : 'INFO'}
                      </span>
                    </div>
                  </div>
                ))}

                {dependencies.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Link2 className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                    <div className="text-sm">Brak zaleznosci do wyswietlenia</div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline View */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Os Czasu Projektow</h3>

              <div className="space-y-4">
                {projects
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((project, index) => {
                    const startDate = new Date(project.startDate);
                    const endDate = project.endDate ? new Date(project.endDate) : new Date();
                    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={project.id} className="flex items-center space-x-4">
                        <div className="w-48 flex-shrink-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{project.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{project.owner}</div>
                        </div>

                        <div className="flex-1 relative">
                          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                project.status === 'COMPLETED' ? 'bg-green-500' :
                                project.status === 'ACTIVE' ? 'bg-blue-500' :
                                project.status === 'ON_HOLD' ? 'bg-yellow-500' :
                                'bg-slate-400 dark:bg-slate-500'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {project.progress}%
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-1">
                            <span>{formatDate(project.startDate)}</span>
                            <span>{duration} dni</span>
                            <span>{project.endDate ? formatDate(project.endDate) : 'TBD'}</span>
                          </div>
                        </div>

                        <div className="w-24 flex-shrink-0 text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Utworz zaleznosc</h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Projekt zrodlowy *
                      </label>
                      <select
                        value={formData.fromProjectId}
                        onChange={(e) => setFormData({ ...formData, fromProjectId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Wybierz projekt</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Projekt docelowy *
                      </label>
                      <select
                        value={formData.toProjectId}
                        onChange={(e) => setFormData({ ...formData, toProjectId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Wybierz projekt</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Typ zaleznosci
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Dependency['type'] })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="FINISH_TO_START">Zakoncz -&gt; Rozpocznij</option>
                        <option value="START_TO_START">Rozpocznij -&gt; Rozpocznij</option>
                        <option value="FINISH_TO_FINISH">Zakoncz -&gt; Zakoncz</option>
                        <option value="START_TO_FINISH">Rozpocznij -&gt; Zakoncz</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Opoznienie (dni)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.delay}
                        onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Opis
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      rows={3}
                      placeholder="Opcjonalny opis zaleznosci..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isBlocking"
                      checked={formData.isBlocking}
                      onChange={(e) => setFormData({ ...formData, isBlocking: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded"
                    />
                    <label htmlFor="isBlocking" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                      Zaleznosc blokujaca
                    </label>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleCreateDependency}
                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={!formData.fromProjectId || !formData.toProjectId}
                  >
                    Utworz zaleznosc
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
