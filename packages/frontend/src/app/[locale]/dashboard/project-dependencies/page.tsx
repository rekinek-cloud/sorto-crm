'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  LinkIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  BoltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

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
  delay: number; // in days
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

  // Form state
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
      // Mock projects data
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Analiza wymagań systemu CRM',
          status: 'COMPLETED',
          startDate: '2024-01-01',
          endDate: '2024-01-15',
          progress: 100,
          priority: 'HIGH',
          description: 'Kompleksowa analiza wymagań dla nowego systemu CRM',
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
          description: 'Rozwój API i logiki biznesowej',
          owner: 'Tomasz Wiśniewski'
        },
        {
          id: '4',
          name: 'Implementacja frontendu',
          status: 'PLANNING',
          startDate: '2024-02-15',
          endDate: '2024-04-01',
          progress: 0,
          priority: 'HIGH',
          description: 'Tworzenie interfejsu użytkownika',
          owner: 'Katarzyna Zielińska'
        },
        {
          id: '5',
          name: 'Testy systemowe',
          status: 'PLANNING',
          startDate: '2024-03-15',
          endDate: '2024-04-15',
          progress: 0,
          priority: 'MEDIUM',
          description: 'Testy funkcjonalne i wydajnościowe',
          owner: 'Piotr Lewandowski'
        },
        {
          id: '6',
          name: 'Wdrożenie produkcyjne',
          status: 'PLANNING',
          startDate: '2024-04-15',
          endDate: '2024-04-30',
          progress: 0,
          priority: 'CRITICAL',
          description: 'Migracja i wdrożenie w środowisku produkcyjnym',
          owner: 'Robert Kaczmarek'
        }
      ];

      // Mock dependencies data
      const mockDependencies: Dependency[] = [
        {
          id: '1',
          fromProjectId: '1',
          toProjectId: '2',
          type: 'FINISH_TO_START',
          delay: 1,
          description: 'Architektura wymaga zakończenia analizy wymagań',
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
          description: 'Frontend może rozpocząć się po 2 tygodniach od startu backendu',
          isBlocking: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '4',
          fromProjectId: '3',
          toProjectId: '5',
          type: 'FINISH_TO_START',
          delay: 0,
          description: 'Testy wymagają ukończenia backendu',
          isBlocking: true,
          createdAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '5',
          fromProjectId: '4',
          toProjectId: '5',
          type: 'FINISH_TO_START',
          delay: 0,
          description: 'Testy wymagają ukończenia frontendu',
          isBlocking: true,
          createdAt: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: '6',
          fromProjectId: '5',
          toProjectId: '6',
          type: 'FINISH_TO_START',
          delay: 0,
          description: 'Wdrożenie po zakończeniu testów',
          isBlocking: true,
          createdAt: new Date().toISOString()
        }
      ];

      // Add project references to dependencies
      const dependenciesWithProjects = mockDependencies.map(dep => ({
        ...dep,
        fromProject: mockProjects.find(p => p.id === dep.fromProjectId),
        toProject: mockProjects.find(p => p.id === dep.toProjectId)
      }));

      // Calculate critical path
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
      toast.error('Wybierz projekty źródłowy i docelowy');
      return;
    }

    if (formData.fromProjectId === formData.toProjectId) {
      toast.error('Projekt nie może być zależny od siebie');
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
    toast.success('Zależność została utworzona!');
  };

  const deleteDependency = (depId: string) => {
    setDependencies(prev => prev.filter(dep => dep.id !== depId));
    toast.success('Zależność została usunięta');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-gray-100 text-gray-700';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FINISH_TO_START': return 'Zakończ → Rozpocznij';
      case 'START_TO_START': return 'Rozpocznij → Rozpocznij';
      case 'FINISH_TO_FINISH': return 'Zakończ → Zakończ';
      case 'START_TO_FINISH': return 'Rozpocznij → Zakończ';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Zależności Projektów</h1>
          <p className="text-gray-600">Zarządzaj zależnościami między projektami i ścieżką krytyczną</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm rounded-l-lg ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-2 text-sm rounded-r-lg ${
                viewMode === 'graph' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Wykres
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Dodaj Zależność
          </button>
        </div>
      </div>

      {/* Critical Path Alert */}
      {criticalPath && criticalPath.isDelayed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-1 mr-3" />
            <div className="flex-1">
              <h3 className="text-red-900 font-medium">Opóźnienie na ścieżce krytycznej</h3>
              <p className="text-red-700 text-sm mt-1">
                Projekt jest opóźniony o {criticalPath.delayDays} dni. 
                Wymaga natychmiastowej uwagi, aby uniknąć dalszych opóźnień.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie zależności</p>
              <p className="text-2xl font-semibold text-gray-900">{dependencies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blokujące</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dependencies.filter(d => d.isBlocking).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projekty aktywne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter(p => p.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ścieżka krytyczna</p>
              <p className="text-2xl font-semibold text-gray-900">
                {criticalPath?.totalDuration || 0} dni
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Szukaj zależności..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <LinkIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">Wszystkie typy</option>
                  <option value="FINISH_TO_START">Zakończ → Rozpocznij</option>
                  <option value="START_TO_START">Rozpocznij → Rozpocznij</option>
                  <option value="FINISH_TO_FINISH">Zakończ → Zakończ</option>
                  <option value="START_TO_FINISH">Rozpocznij → Zakończ</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">Wszystkie</option>
                  <option value="blocking">Blokujące</option>
                  <option value="non-blocking">Nieblokujące</option>
                  <option value="active">Aktywne</option>
                  <option value="completed">Ukończone</option>
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Znaleziono: {filteredDependencies.length} z {dependencies.length}
              </div>
            </div>
          </div>

          {/* Dependencies List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Zależności ({filteredDependencies.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredDependencies.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak zależności</h3>
                  <p className="text-gray-600">Utwórz pierwszą zależność między projektami</p>
                </div>
              ) : (
                filteredDependencies.map((dependency, index) => (
                  <motion.div
                    key={dependency.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {dependency.fromProject?.name}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {dependency.toProject?.name}
                            </span>
                          </div>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            dependency.isBlocking 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {dependency.isBlocking ? 'Blokujące' : 'Nieblokujące'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-600">Typ: </span>
                            <span className="text-sm font-medium text-gray-900">
                              {getTypeLabel(dependency.type)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Opóźnienie: </span>
                            <span className="text-sm font-medium text-gray-900">
                              {dependency.delay} dni
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Utworzono: </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(dependency.createdAt)}
                            </span>
                          </div>
                        </div>

                        {dependency.description && (
                          <p className="text-sm text-gray-600 mb-3">{dependency.description}</p>
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
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edytuj"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDependency(dependency.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Usuń"
                        >
                          <TrashIcon className="w-4 h-4" />
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ścieżka Krytyczna</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Czas trwania:</span>
                  <span className="font-medium text-gray-900">{criticalPath.totalDuration} dni</span>
                  {criticalPath.isDelayed && (
                    <span className="text-sm text-red-600 font-medium">
                      (+{criticalPath.delayDays} dni opóźnienia)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <div className="flex items-center space-x-2 overflow-x-auto pb-4">
                  {criticalPath.projects.map((project, index) => (
                    <div key={project.id} className="flex items-center flex-shrink-0">
                      <div className={`p-4 rounded-lg border-2 min-w-48 ${
                        project.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                        project.status === 'ACTIVE' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'TBD'}
                        </div>
                        <div className="flex items-center mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <span className="ml-2 text-xs text-gray-600">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full ${
                              project.status === 'COMPLETED' ? 'bg-green-500' :
                              project.status === 'ACTIVE' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {index < criticalPath.projects.length - 1 && (
                        <ArrowRightIcon className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Project Dependency Network */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sieć Zależności Projektów</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map(project => {
                const incoming = dependencies.filter(d => d.toProjectId === project.id);
                const outgoing = dependencies.filter(d => d.fromProjectId === project.id);
                
                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-center mb-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-lg font-bold ${
                        project.status === 'COMPLETED' ? 'bg-green-500' :
                        project.status === 'ACTIVE' ? 'bg-blue-500' :
                        project.status === 'ON_HOLD' ? 'bg-yellow-500' :
                        project.status === 'PLANNING' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`}>
                        {project.name.charAt(0)}
                      </div>
                      <h4 className="font-medium text-gray-900 mt-2 text-sm">{project.name}</h4>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{project.progress}% ukończone</div>
                    </div>

                    <div className="space-y-3">
                      {incoming.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Zależności przychodzące:</div>
                          <div className="space-y-1">
                            {incoming.map(dep => (
                              <div key={dep.id} className="flex items-center text-xs">
                                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                                <span className="text-gray-600 truncate">
                                  {dep.fromProject?.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {outgoing.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Zależności wychodzące:</div>
                          <div className="space-y-1">
                            {outgoing.map(dep => (
                              <div key={dep.id} className="flex items-center text-xs">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                <span className="text-gray-600 truncate">
                                  {dep.toProject?.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {incoming.length === 0 && outgoing.length === 0 && (
                        <div className="text-xs text-gray-500 text-center py-2">
                          Brak zależności
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dependency Flow Diagram */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagram Przepływu</h3>
            
            <div className="space-y-4">
              {dependencies.map((dependency, index) => (
                <div key={dependency.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        dependency.fromProject?.status === 'COMPLETED' ? 'bg-green-500' :
                        dependency.fromProject?.status === 'ACTIVE' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900 min-w-0 truncate">
                        {dependency.fromProject?.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {getTypeLabel(dependency.type)}
                      </span>
                      {dependency.delay > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          +{dependency.delay}d
                        </span>
                      )}
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        dependency.toProject?.status === 'COMPLETED' ? 'bg-green-500' :
                        dependency.toProject?.status === 'ACTIVE' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900 min-w-0 truncate">
                        {dependency.toProject?.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {dependency.isBlocking && (
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-500" title="Blokujące" />
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      dependency.isBlocking ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {dependency.isBlocking ? 'BLOK' : 'INFO'}
                    </span>
                  </div>
                </div>
              ))}
              
              {dependencies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔗</div>
                  <div className="text-sm">Brak zależności do wyświetlenia</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline View */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Oś Czasu Projektów</h3>
            
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
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-600">{project.owner}</div>
                      </div>
                      
                      <div className="flex-1 relative">
                        <div className="h-6 bg-gray-200 rounded-full relative overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              project.status === 'COMPLETED' ? 'bg-green-500' :
                              project.status === 'ACTIVE' ? 'bg-blue-500' :
                              project.status === 'ON_HOLD' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {project.progress}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Utwórz zależność</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projekt źródłowy *
                    </label>
                    <select
                      value={formData.fromProjectId}
                      onChange={(e) => setFormData({ ...formData, fromProjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projekt docelowy *
                    </label>
                    <select
                      value={formData.toProjectId}
                      onChange={(e) => setFormData({ ...formData, toProjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ zależności
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Dependency['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="FINISH_TO_START">Zakończ → Rozpocznij</option>
                      <option value="START_TO_START">Rozpocznij → Rozpocznij</option>
                      <option value="FINISH_TO_FINISH">Zakończ → Zakończ</option>
                      <option value="START_TO_FINISH">Rozpocznij → Zakończ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opóźnienie (dni)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.delay}
                      onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Opcjonalny opis zależności..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isBlocking"
                    checked={formData.isBlocking}
                    onChange={(e) => setFormData({ ...formData, isBlocking: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isBlocking" className="ml-2 text-sm text-gray-700">
                    Zależność blokująca
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCreateDependency}
                  className="btn btn-primary flex-1"
                  disabled={!formData.fromProjectId || !formData.toProjectId}
                >
                  Utwórz zależność
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}