'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Project, ProjectFilters, Stream } from '@/types/gtd';
import { projectsApi, gtdHelpers } from '@/lib/api/gtd';
import { streamsApi } from '@/lib/api/streams';
import ProjectForm from '@/components/projects/ProjectForm';
import { toast } from 'react-hot-toast';
import {
  FolderKanban,
  Plus,
  LayoutGrid,
  List,
  BarChart3,
  Map,
  FolderTree,
  Link2,
  Pencil,
  Trash2,
  Calendar,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
} from 'lucide-react';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

type ViewMode = 'grid' | 'list';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  PLANNING: { label: 'Planowanie', variant: 'info' },
  IN_PROGRESS: { label: 'W trakcie', variant: 'warning' },
  ON_HOLD: { label: 'Wstrzymany', variant: 'neutral' },
  COMPLETED: { label: 'Ukończony', variant: 'success' },
  CANCELED: { label: 'Anulowany', variant: 'error' },
};

const PRIORITY_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  LOW: { label: 'Niski', variant: 'neutral' },
  MEDIUM: { label: 'Średni', variant: 'info' },
  HIGH: { label: 'Wysoki', variant: 'warning' },
  URGENT: { label: 'Pilny', variant: 'error' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortValue, setSortValue] = useState('name-asc');
  const [filters, setFilters] = useState<ProjectFilters>({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadProjects();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, streamsData] = await Promise.all([
        projectsApi.getProjects(filters),
        streamsApi.getStreams({ limit: 100 }),
      ]);

      setProjects(projectsData.projects);
      setPagination(projectsData.pagination);
      setStreams(streamsData.streams);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac projektow');
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await projectsApi.getProjects(filters);
      setProjects(projectsData.projects);
      setPagination(projectsData.pagination);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac projektow');
      console.error('Error loading projects:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await projectsApi.createProject(data);
      toast.success('Projekt utworzony pomyslnie');
      setIsProjectFormOpen(false);
      loadProjects();
    } catch (error: any) {
      toast.error('Nie udalo sie utworzyc projektu');
      console.error('Error creating project:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await projectsApi.updateProject(id, data);
      toast.success('Projekt zaktualizowany pomyslnie');
      setEditingProject(undefined);
      setIsProjectFormOpen(false);
      loadProjects();
    } catch (error: any) {
      toast.error('Nie udalo sie zaktualizowac projektu');
      console.error('Error updating project:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten projekt?')) return;

    try {
      await projectsApi.deleteProject(id);
      toast.success('Projekt usuniety pomyslnie');
      loadProjects();
    } catch (error: any) {
      toast.error('Nie udalo sie usunac projektu');
      console.error('Error deleting project:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    if (key === 'status') {
      setFilters(prev => ({
        ...prev,
        status: value === 'all' ? undefined : value,
        page: 1,
      }));
    } else if (key === 'priority') {
      setFilters(prev => ({
        ...prev,
        priority: value === 'all' ? undefined : value,
        page: 1,
      }));
    } else if (key === 'stream') {
      setFilters(prev => ({
        ...prev,
        streamId: value === 'all' ? undefined : value,
        page: 1,
      }));
    }
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1,
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const filteredProjects = useMemo(() => {
    return projects;
  }, [projects]);

  const activeCount = useMemo(() => projects.filter(p => p.status === 'IN_PROGRESS').length, [projects]);
  const completedCount = useMemo(() => projects.filter(p => p.status === 'COMPLETED').length, [projects]);
  const onHoldCount = useMemo(() => projects.filter(p => p.status === 'ON_HOLD').length, [projects]);

  const navigateToProject = (id: string) => {
    router.push(`/dashboard/projects/${id}`);
  };

  const tableColumns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Nazwa',
      sortable: true,
      render: (_val: any, row: Project) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_val: any, row: Project) => {
        const s = STATUS_MAP[row.status] || { label: row.status, variant: 'default' as const };
        return <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>;
      },
    },
    {
      key: 'priority',
      label: 'Priorytet',
      sortable: true,
      render: (_val: any, row: Project) => {
        const p = PRIORITY_MAP[row.priority] || { label: row.priority, variant: 'default' as const };
        return <StatusBadge variant={p.variant}>{p.label}</StatusBadge>;
      },
    },
    {
      key: 'stream',
      label: 'Strumien',
      sortable: false,
      render: (_val: any, row: Project) => (
        <span className="text-slate-600 dark:text-slate-400">
          {row.stream?.name || '-'}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Postep',
      sortable: true,
      getValue: (row: Project) => row.stats?.progress || 0,
      render: (_val: any, row: Project) => {
        const progress = row.stats?.progress || 0;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-9 text-right">
              {Math.round(progress)}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'tasks',
      label: 'Zadania',
      sortable: false,
      render: (_val: any, row: Project) => {
        const total = row.stats?.totalTasks || 0;
        const done = row.stats?.completedTasks || 0;
        return (
          <span className="text-slate-600 dark:text-slate-400 text-sm">
            {done}/{total}
          </span>
        );
      },
    },
    {
      key: 'endDate',
      label: 'Termin',
      sortable: true,
      render: (_val: any, row: Project) => {
        if (!row.endDate) return <span className="text-slate-400 dark:text-slate-500">-</span>;
        const isOverdue = new Date(row.endDate) < new Date() && row.status !== 'COMPLETED';
        return (
          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
            {gtdHelpers.formatDate(row.endDate)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: 'w-20',
      render: (_val: any, row: Project) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setEditingProject(row);
              setIsProjectFormOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title="Edytuj"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Usun"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const streamFilterOptions = useMemo(
    () => streams.map(s => ({ value: s.id, label: s.name })),
    [streams]
  );

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Projekty"
        subtitle="Organizuj prace w znaczace projekty"
        icon={FolderKanban}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Projekty' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="ghost"
              size="sm"
              icon={BarChart3}
              onClick={() => router.push('/dashboard/projects/burndown')}
            >
              Wykresy
            </ActionButton>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={Map}
              onClick={() => router.push('/dashboard/projects/roadmap')}
            >
              Mapa drogowa
            </ActionButton>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={FolderTree}
              onClick={() => router.push('/dashboard/projects/wbs-templates')}
            >
              Szablony WBS
            </ActionButton>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={Link2}
              onClick={() => router.push('/dashboard/projects/wbs-dependencies')}
            >
              Zaleznosci
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => setIsProjectFormOpen(true)}
            >
              Nowy projekt
            </ActionButton>
          </div>
        }
      />

      {/* Statystyki */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          label="Wszystkie projekty"
          value={pagination.total}
          icon={FolderKanban}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="W trakcie"
          value={activeCount}
          icon={Activity}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          label="Ukonczone"
          value={completedCount}
          icon={CheckCircle2}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Wstrzymane"
          value={onHoldCount}
          icon={PauseCircle}
          iconColor="text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
        />
      </motion.div>

      {/* Filtrowanie */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <FilterBar
          search={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Szukaj projektow..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'PLANNING', label: 'Planowanie' },
                { value: 'IN_PROGRESS', label: 'W trakcie' },
                { value: 'ON_HOLD', label: 'Wstrzymany' },
                { value: 'COMPLETED', label: 'Ukończony' },
                { value: 'CANCELED', label: 'Anulowany' },
              ],
            },
            {
              key: 'priority',
              label: 'Priorytet',
              options: [
                { value: 'LOW', label: 'Niski' },
                { value: 'MEDIUM', label: 'Sredni' },
                { value: 'HIGH', label: 'Wysoki' },
                { value: 'URGENT', label: 'Pilny' },
              ],
            },
            {
              key: 'stream',
              label: 'Strumien',
              options: streamFilterOptions,
            },
          ]}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          sortOptions={[
            { value: 'name-asc', label: 'Nazwa A-Z' },
            { value: 'name-desc', label: 'Nazwa Z-A' },
            { value: 'createdAt-desc', label: 'Najnowsze' },
            { value: 'createdAt-asc', label: 'Najstarsze' },
            { value: 'updatedAt-desc', label: 'Ostatnio zmienione' },
          ]}
          sortValue={sortValue}
          onSortChange={handleSortChange}
          actions={
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Widok siatki"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Widok listy"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          }
        />
      </motion.div>

      {/* Zawartosc */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Brak projektow"
          description={
            searchQuery
              ? 'Nie znaleziono projektow pasujacych do kryteriow wyszukiwania.'
              : 'Zacznij organizowac swoja prace tworzac pierwszy projekt.'
          }
          action={
            !searchQuery ? (
              <ActionButton variant="primary" icon={Plus} onClick={() => setIsProjectFormOpen(true)}>
                Utworz pierwszy projekt
              </ActionButton>
            ) : undefined
          }
        />
      ) : viewMode === 'list' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DataTable<Project>
            columns={tableColumns}
            data={filteredProjects}
            onRowClick={(row) => navigateToProject(row.id)}
            storageKey="projects-table"
            pageSize={20}
            emptyMessage="Brak projektow"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigateToProject(project.id)}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group"
            >
              <div className="p-5">
                {/* Naglowek karty */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge variant={STATUS_MAP[project.status]?.variant || 'default'} dot>
                        {STATUS_MAP[project.status]?.label || project.status}
                      </StatusBadge>
                      <StatusBadge variant={PRIORITY_MAP[project.priority]?.variant || 'default'}>
                        {PRIORITY_MAP[project.priority]?.label || project.priority}
                      </StatusBadge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setIsProjectFormOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edytuj"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                      title="Usun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Opis */}
                {project.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Pasek postepu */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Postep</span>
                    <span className="font-medium">{Math.round(project.stats?.progress || 0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${project.stats?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Statystyki zadań */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2">
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {project.stats?.totalTasks || 0}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Zadania</div>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2">
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {project.stats?.completedTasks || 0}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Ukonczone</div>
                  </div>
                </div>

                {/* Stopka */}
                <div className="space-y-1.5 text-sm">
                  {project.stream && (
                    <div className="flex items-center text-slate-500 dark:text-slate-400">
                      <Activity className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                      <span className="truncate">{project.stream.name}</span>
                    </div>
                  )}
                  {project.assignedTo && (
                    <div className="flex items-center text-slate-500 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {project.assignedTo.firstName} {project.assignedTo.lastName}
                      </span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                      <span
                        className={
                          new Date(project.endDate) < new Date() && project.status !== 'COMPLETED'
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {gtdHelpers.formatDate(project.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dolna krawedz z kolorem priorytetu */}
              <div
                className="h-1 rounded-b-2xl"
                style={{ backgroundColor: gtdHelpers.getPriorityColor(project.priority) }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Formularz projektu */}
      {isProjectFormOpen && (
        <ProjectForm
          project={editingProject}
          streams={streams}
          onSubmit={editingProject
            ? (data: any) => handleEdit(editingProject.id, data)
            : handleCreate
          }
          onCancel={() => {
            setIsProjectFormOpen(false);
            setEditingProject(undefined);
          }}
        />
      )}
    </PageShell>
  );
}
