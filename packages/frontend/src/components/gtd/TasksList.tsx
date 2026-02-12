'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  Circle,
  CheckCircle2,
  ListTodo,
  Filter,
} from 'lucide-react';
import { Task, TaskFilters, Context, Project, Stream } from '@/types/gtd';
import { tasksApi, contextsApi, projectsApi, gtdHelpers } from '@/lib/api/gtd';
import { streamsApi } from '@/lib/api/streams';
import { apiClient } from '@/lib/api/client';
import TaskForm from './TaskForm';
import { toast } from 'react-hot-toast';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { InlineEdit } from '@/components/ui/InlineEdit';

// --- Status & Priority mapping helpers ---

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function getStatusVariant(status: Task['status']): StatusVariant {
  switch (status) {
    case 'NEW':
      return 'info';
    case 'IN_PROGRESS':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'CANCELED':
      return 'error';
    case 'WAITING':
      return 'neutral';
    default:
      return 'info';
  }
}

function getStatusLabel(status: Task['status']): string {
  switch (status) {
    case 'NEW':
      return 'Do zrobienia';
    case 'IN_PROGRESS':
      return 'W toku';
    case 'COMPLETED':
      return 'Ukonczone';
    case 'CANCELED':
      return 'Anulowane';
    case 'WAITING':
      return 'Oczekuje';
    default:
      return status;
  }
}

function getPriorityVariant(priority: Task['priority']): StatusVariant {
  switch (priority) {
    case 'URGENT':
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function getPriorityLabel(priority: Task['priority']): string {
  switch (priority) {
    case 'URGENT':
      return 'Pilny';
    case 'HIGH':
      return 'Wysoki';
    case 'MEDIUM':
      return 'Sredni';
    case 'LOW':
      return 'Niski';
    default:
      return priority;
  }
}

function formatRelativeDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)} dni temu`;
  if (diffDays === -1) return 'Wczoraj';
  if (diffDays === 0) return 'Dzisiaj';
  if (diffDays === 1) return 'Jutro';
  if (diffDays <= 7) return `Za ${diffDays} dni`;
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// --- Framer Motion variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// --- Status options for InlineEdit ---

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Do zrobienia' },
  { value: 'IN_PROGRESS', label: 'W toku' },
  { value: 'WAITING', label: 'Oczekuje' },
  { value: 'COMPLETED', label: 'Ukonczone' },
  { value: 'CANCELED', label: 'Anulowane' },
];

// --- Main Component ---

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [subtaskParentId, setSubtaskParentId] = useState<string | undefined>();
  const [filters, setFilters] = useState<TaskFilters>({});

  // --- Data loading ---

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadTasks();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, contextsData, projectsData, streamsData, usersData] = await Promise.all([
        tasksApi.getTasks(filters),
        contextsApi.getContexts(true),
        projectsApi.getProjects({ limit: 100 }),
        streamsApi.getStreams({ status: 'ACTIVE', limit: 100 }),
        apiClient.get('/users').then(r => r.data).catch(() => ({ users: [] })),
      ]);

      setTasks(tasksData.tasks);
      setContexts(contextsData);
      setProjects(projectsData.projects);
      setStreams(streamsData.streams || []);
      setUsers(usersData.users || usersData || []);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac danych');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await tasksApi.getTasks(filters);
      setTasks(tasksData.tasks);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac zadan');
      console.error('Error loading tasks:', error);
    }
  };

  // --- CRUD Handlers ---

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setSubtaskParentId(undefined);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Zadanie zostalo usuniete');
    } catch (error: any) {
      toast.error('Nie udalo sie usunac zadania');
      console.error('Error deleting task:', error);
    }
  }, []);

  const handleStatusChange = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      const updatedTask = await tasksApi.updateTaskStatus(taskId, status);
      setTasks(prev => prev.map(task => (task.id === taskId ? updatedTask : task)));
      toast.success(
        status === 'COMPLETED' ? 'Zadanie ukonczone' : 'Status zaktualizowany'
      );
    } catch (error: any) {
      toast.error('Nie udalo sie zaktualizowac statusu');
      console.error('Error updating task status:', error);
    }
  }, []);

  const handleTaskSubmit = async (data: any) => {
    try {
      if (editingTask) {
        const updatedTask = await tasksApi.updateTask(editingTask.id, data);
        setTasks(prev =>
          prev.map(task => (task.id === editingTask.id ? updatedTask : task))
        );
        toast.success('Zadanie zaktualizowane');
      } else {
        const newTask = await tasksApi.createTask(data);
        setTasks(prev => [newTask, ...prev]);
        toast.success('Zadanie utworzone');
      }
      setIsTaskFormOpen(false);
      setEditingTask(undefined);
    } catch (error: any) {
      toast.error(
        `Nie udalo sie ${editingTask ? 'zaktualizowac' : 'utworzyc'} zadania`
      );
      console.error('Error saving task:', error);
    }
  };

  // --- FilterBar integration ---

  const filterBarValues = useMemo(
    () => ({
      status: filters.status || 'all',
      priority: filters.priority || 'all',
      streamId: filters.streamId || 'all',
      contextId: filters.contextId || 'all',
      projectId: filters.projectId || 'all',
    }),
    [filters]
  );

  const handleFilterBarChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }));
  }, []);

  const filterConfigs = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'NEW', label: 'Do zrobienia' },
          { value: 'IN_PROGRESS', label: 'W toku' },
          { value: 'WAITING', label: 'Oczekuje' },
          { value: 'COMPLETED', label: 'Ukonczone' },
          { value: 'CANCELED', label: 'Anulowane' },
        ],
      },
      {
        key: 'priority',
        label: 'Priorytet',
        options: [
          { value: 'URGENT', label: 'Pilny' },
          { value: 'HIGH', label: 'Wysoki' },
          { value: 'MEDIUM', label: 'Sredni' },
          { value: 'LOW', label: 'Niski' },
        ],
      },
      {
        key: 'streamId',
        label: 'Strumien',
        options: streams.map(s => ({ value: s.id, label: s.name })),
      },
      {
        key: 'contextId',
        label: 'Kontekst',
        options: contexts.map(c => ({ value: c.id, label: c.name })),
      },
      {
        key: 'projectId',
        label: 'Projekt',
        options: projects.map(p => ({ value: p.id, label: p.name })),
      },
    ],
    [streams, contexts, projects]
  );

  // --- Derived data ---

  const sortedTasks = useMemo(() => gtdHelpers.sortTasks(tasks), [tasks]);

  const stats = useMemo(() => {
    const all = sortedTasks.length;
    const todo = sortedTasks.filter(t => t.status === 'NEW').length;
    const inProgress = sortedTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = sortedTasks.filter(t => t.status === 'COMPLETED').length;
    return { all, todo, inProgress, completed };
  }, [sortedTasks]);

  // --- DataTable columns ---

  const columns: Column<Task>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Tytul',
        sortable: true,
        render: (_value: any, row: Task) => (
          <span
            className={`font-semibold text-slate-900 dark:text-slate-100 ${
              row.status === 'COMPLETED'
                ? 'line-through text-slate-400 dark:text-slate-500'
                : ''
            }`}
          >
            {row.title}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_value: any, row: Task) => (
          <InlineEdit
            value={row.status}
            type="select"
            options={STATUS_OPTIONS}
            onSave={async (newStatus) => {
              await handleStatusChange(row.id, newStatus as Task['status']);
            }}
            renderDisplay={(val) => (
              <StatusBadge variant={getStatusVariant(val as Task['status'])} dot>
                {getStatusLabel(val as Task['status'])}
              </StatusBadge>
            )}
          />
        ),
      },
      {
        key: 'priority',
        label: 'Priorytet',
        sortable: true,
        render: (_value: any, row: Task) => (
          <StatusBadge variant={getPriorityVariant(row.priority)} dot>
            {getPriorityLabel(row.priority)}
          </StatusBadge>
        ),
      },
      {
        key: 'dueDate',
        label: 'Termin',
        sortable: true,
        getValue: (row: Task) => row.dueDate,
        render: (_value: any, row: Task) => {
          if (!row.dueDate) return <span className="text-slate-400 dark:text-slate-500">-</span>;
          const isOverdue = gtdHelpers.isTaskOverdue(row);
          return (
            <span
              className={
                isOverdue
                  ? 'text-red-600 dark:text-red-400 font-medium flex items-center gap-1'
                  : 'text-slate-600 dark:text-slate-400'
              }
            >
              {isOverdue && <AlertTriangle className="w-3.5 h-3.5 inline-block" />}
              {formatRelativeDate(row.dueDate)}
            </span>
          );
        },
      },
      {
        key: 'assignee',
        label: 'Przypisany',
        sortable: false,
        getValue: (row: Task) =>
          row.assignedTo
            ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}`
            : null,
        render: (_value: any, row: Task) => {
          if (!row.assignedTo)
            return <span className="text-slate-400 dark:text-slate-500">-</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {row.assignedTo.firstName[0]}
                {row.assignedTo.lastName[0]}
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-sm">
                {row.assignedTo.firstName} {row.assignedTo.lastName}
              </span>
            </div>
          );
        },
      },
      {
        key: 'stream',
        label: 'Strumien',
        sortable: false,
        getValue: (row: Task) => row.stream?.name ?? null,
        render: (_value: any, row: Task) => {
          if (!row.stream)
            return <span className="text-slate-400 dark:text-slate-500">-</span>;
          return (
            <span className="text-slate-700 dark:text-slate-300 text-sm">
              {row.stream.name}
            </span>
          );
        },
      },
    ],
    [handleStatusChange]
  );

  // --- Loading state ---

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  // --- Render ---

  return (
    <PageShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Zadania"
            subtitle="Zarzadzaj zadaniami i przypisuj do strumieni"
            icon={CheckSquare}
            iconColor="text-blue-600"
            breadcrumbs={[{ label: 'Zadania' }]}
            actions={
              <ActionButton icon={Plus} onClick={handleCreateTask}>
                Dodaj zadanie
              </ActionButton>
            }
          />
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            label="Wszystkie"
            value={stats.all}
            icon={ListTodo}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            label="Do zrobienia"
            value={stats.todo}
            icon={Circle}
            iconColor="text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400"
          />
          <StatCard
            label="W toku"
            value={stats.inProgress}
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatCard
            label="Ukonczone"
            value={stats.completed}
            icon={CheckCircle2}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
        </motion.div>

        {/* FilterBar */}
        <motion.div variants={itemVariants}>
          <FilterBar
            search={filters.search || ''}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Szukaj zadan..."
            filters={filterConfigs}
            filterValues={filterBarValues}
            onFilterChange={handleFilterBarChange}
          />
        </motion.div>

        {/* DataTable or EmptyState */}
        <motion.div variants={itemVariants}>
          {sortedTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Nie znaleziono zadan"
              description="Utworz swoje pierwsze zadanie, aby rozpoczac."
              action={
                <ActionButton icon={Plus} onClick={handleCreateTask}>
                  Utworz zadanie
                </ActionButton>
              }
            />
          ) : (
            <DataTable<Task>
              columns={columns}
              data={sortedTasks}
              onRowClick={handleEditTask}
              storageKey="tasks-list"
              pageSize={20}
              emptyMessage="Brak zadan"
              emptyIcon={<CheckSquare className="w-8 h-8" />}
              stickyHeader
            />
          )}
        </motion.div>
      </motion.div>

      {/* Task Form Modal */}
      <AnimatePresence>
        {isTaskFormOpen && (
          <TaskForm
            task={editingTask}
            contexts={contexts}
            projects={projects}
            streams={streams}
            users={users}
            parentTaskId={subtaskParentId}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setIsTaskFormOpen(false);
              setEditingTask(undefined);
              setSubtaskParentId(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
