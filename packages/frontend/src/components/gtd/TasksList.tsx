'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskFilters, Context, Project, Stream } from '@/types/gtd';
import { tasksApi, contextsApi, projectsApi, gtdHelpers } from '@/lib/api/gtd';
import { streamsApi } from '@/lib/api/streams';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { toast } from 'react-hot-toast';

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filters, setFilters] = useState<TaskFilters>({});

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
      const [tasksData, contextsData, projectsData, streamsData] = await Promise.all([
        tasksApi.getTasks(filters),
        contextsApi.getContexts(true), // Only active contexts
        projectsApi.getProjects({ limit: 100 }), // Get all projects for dropdown
        streamsApi.getStreams({ status: 'ACTIVE', limit: 100 }), // Get all active streams for dropdown
      ]);

      setTasks(tasksData.tasks);
      setContexts(contextsData);
      setProjects(projectsData.projects);
      setStreams(streamsData.streams || []);
    } catch (error: any) {
      toast.error('Failed to load data');
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
      toast.error('Failed to load tasks');
      console.error('Error loading tasks:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksApi.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      const updatedTask = await tasksApi.updateTaskStatus(taskId, status);
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      toast.success(`Task ${status === 'COMPLETED' ? 'completed' : 'updated'}`);
    } catch (error: any) {
      toast.error('Failed to update task status');
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskSubmit = async (data: any) => {
    try {
      if (editingTask) {
        const updatedTask = await tasksApi.updateTask(editingTask.id, data);
        setTasks(tasks.map(task => 
          task.id === editingTask.id ? updatedTask : task
        ));
        toast.success('Task updated successfully');
      } else {
        const newTask = await tasksApi.createTask(data);
        setTasks([newTask, ...tasks]);
        toast.success('Task created successfully');
      }
      setIsTaskFormOpen(false);
      setEditingTask(undefined);
    } catch (error: any) {
      toast.error(`Failed to ${editingTask ? 'update' : 'create'} task`);
      console.error('Error saving task:', error);
    }
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const sortedTasks = gtdHelpers.sortTasks(tasks);
  const activeTasks = sortedTasks.filter(task => 
    task.status !== 'COMPLETED' && task.status !== 'CANCELED'
  );
  const completedTasks = sortedTasks.filter(task => 
    task.status === 'COMPLETED'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zadania</h1>
          <p className="mt-1 text-sm text-gray-600">
            Zarządzaj zadaniami i tagami
          </p>
        </div>
        <button
          onClick={handleCreateTask}
          className="mt-4 sm:mt-0 btn btn-primary btn-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nowe zadanie
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Stream filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strumień
            </label>
            <select
              value={filters.streamId || ''}
              onChange={(e) => handleFilterChange('streamId', e.target.value)}
              className="input"
            >
              <option value="">Wszystkie strumienie</option>
              {streams.map(stream => (
                <option key={stream.id} value={stream.id}>
                  {stream.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">Wszystkie statusy</option>
              <option value="NEW">Nowy</option>
              <option value="IN_PROGRESS">W trakcie</option>
              <option value="WAITING">Oczekuje</option>
              <option value="COMPLETED">Zakończony</option>
              <option value="CANCELED">Anulowany</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorytet
            </label>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input"
            >
              <option value="">Wszystkie priorytety</option>
              <option value="URGENT">Pilny</option>
              <option value="HIGH">Wysoki</option>
              <option value="MEDIUM">Średni</option>
              <option value="LOW">Niski</option>
            </select>
          </div>

          {/* Context filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontekst
            </label>
            <select
              value={filters.contextId || ''}
              onChange={(e) => handleFilterChange('contextId', e.target.value)}
              className="input"
            >
              <option value="">Wszystkie konteksty</option>
              {contexts.map(context => (
                <option key={context.id} value={context.id}>
                  {context.icon} {context.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projekt
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
              className="input"
            >
              <option value="">Wszystkie projekty</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and clear */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Szukaj zadań..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={clearFilters}
            className="btn btn-outline btn-md"
          >
            Wyczyść filtry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{activeTasks.length}</div>
          <div className="text-sm text-gray-600">Aktywne zadania</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <div className="text-sm text-gray-600">Zakończone</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {activeTasks.filter(task => gtdHelpers.isTaskOverdue(task)).length}
          </div>
          <div className="text-sm text-gray-600">Przeterminowane</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-amber-600">
            {activeTasks.filter(task => task.isWaitingFor).length}
          </div>
          <div className="text-sm text-gray-600">Oczekujące</div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-4">
        {/* Active tasks */}
        {activeTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aktywne zadania ({activeTasks.length})
            </h2>
            <div className="space-y-3">
              {activeTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Zakończone zadania ({completedTasks.length})
            </h2>
            <div className="space-y-3">
              {completedTasks.slice(0, 10).map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {completedTasks.length > 10 && (
                <p className="text-sm text-gray-600 text-center py-4">
                  I jeszcze {completedTasks.length - 10} zakończonych zadań...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nie znaleziono zadań</h3>
            <p className="mt-2 text-sm text-gray-600">
              Utwórz swoje pierwsze zadanie, aby rozpocząć.
            </p>
            <button
              onClick={handleCreateTask}
              className="mt-4 btn btn-primary btn-md"
            >
              Utwórz zadanie
            </button>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm
          task={editingTask}
          contexts={contexts}
          projects={projects}
          streams={streams}
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setIsTaskFormOpen(false);
            setEditingTask(undefined);
          }}
        />
      )}
    </div>
  );
}