'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem } from './TaskItem';
import { FilterBar } from './FilterBar';
import { GTDContextList } from './GTDContextList';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  estimatedTime: number; // minutes
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate?: Date;
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  project?: {
    id: string;
    title: string;
  };
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

interface TaskSection {
  priority: 'urgent' | 'high' | 'normal' | 'low';
  color: string;
  tasks: Task[];
  totalTime: number;
}

interface TaskListProps {
  viewType?: 'today' | 'gtd_contexts' | 'filtered';
  organizationId: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  viewType = 'today',
  organizationId
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    assignee: '',
    gtdContext: '',
    project: '',
    deal: '',
    priority: '',
    dueDate: '',
    completed: false
  });

  useEffect(() => {
    loadTasks();
  }, [viewType, organizationId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Mock data - w rzeczywistości z API
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Przygotować prezentację produktu',
          description: 'Kompletna prezentacja CRM-GTD Smart dla klienta TechStartup',
          priority: 'high',
          gtdContext: '@computer',
          estimatedTime: 120,
          assignee: { id: '1', name: 'Michał Kowalski', avatar: '' },
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // jutro
          deal: { id: '1', title: 'CRM Implementation', company: 'TechStartup Innovations' },
          completed: false,
          createdAt: new Date()
        },
        {
          id: '2', 
          title: 'Zadzwonić do klienta RetailChain',
          description: 'Omówić szczegóły wdrożenia GTD w organizacji',
          priority: 'urgent',
          gtdContext: '@calls',
          estimatedTime: 30,
          assignee: { id: '2', name: 'Anna Nowak', avatar: '' },
          dueDate: new Date(), // dziś
          deal: { id: '2', title: 'GTD System Training', company: 'RetailChain Poland' },
          completed: false,
          createdAt: new Date()
        },
        {
          id: '3',
          title: 'Wysłać ofertę do FinanceGroup',
          description: 'Przygotowana oferta na rozwiązanie BI + CRM',
          priority: 'medium',
          gtdContext: '@email',
          estimatedTime: 45,
          assignee: { id: '3', name: 'Piotr Wiśniewski', avatar: '' },
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // za 3 dni
          project: { id: '1', title: 'Q4 Sales Pipeline' },
          completed: false,
          createdAt: new Date()
        },
        {
          id: '4',
          title: 'Przeczytać raport konkurencji',
          description: 'Analiza rozwiązań CRM na rynku polskim',
          priority: 'low',
          gtdContext: '@reading',
          estimatedTime: 60,
          assignee: { id: '1', name: 'Michał Kowalski', avatar: '' },
          completed: true,
          completedAt: new Date(),
          createdAt: new Date()
        }
      ];

      setTasks(mockTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Błąd ładowania zadań');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filtruj po zakończeniu
    if (!filters.completed) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filtruj po assignee
    if (filters.assignee) {
      filtered = filtered.filter(task => task.assignee.id === filters.assignee);
    }

    // Filtruj po kontekście GTD
    if (filters.gtdContext) {
      filtered = filtered.filter(task => task.gtdContext === filters.gtdContext);
    }

    // Filtruj po projekcie
    if (filters.project) {
      filtered = filtered.filter(task => task.project?.id === filters.project);
    }

    // Filtruj po dealu
    if (filters.deal) {
      filtered = filtered.filter(task => task.deal?.id === filters.deal);
    }

    // Filtruj po priorytecie
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Filtruj po terminie
    if (filters.dueDate) {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const week = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      switch (filters.dueDate) {
        case 'today':
          filtered = filtered.filter(task => 
            task.dueDate && task.dueDate.toDateString() === today.toDateString()
          );
          break;
        case 'tomorrow':
          filtered = filtered.filter(task => 
            task.dueDate && task.dueDate.toDateString() === tomorrow.toDateString()
          );
          break;
        case 'week':
          filtered = filtered.filter(task => 
            task.dueDate && task.dueDate <= week
          );
          break;
        case 'overdue':
          filtered = filtered.filter(task => 
            task.dueDate && task.dueDate < today
          );
          break;
      }
    }

    setFilteredTasks(filtered);

    // Organizuj w sekcje według priorytetu
    const priorityOrder = ['urgent', 'high', 'normal', 'low'] as const;
    const newSections = priorityOrder.map(priority => {
      const sectionTasks = filtered.filter(task => {
        if (priority === 'normal') return task.priority === 'medium';
        return task.priority === priority;
      });

      return {
        priority,
        color: getPriorityColor(priority),
        tasks: sectionTasks.sort((a, b) => {
          // Sortuj po terminie (najwcześniej pierwsze)
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return 0;
        }),
        totalTime: sectionTasks.reduce((sum, task) => sum + task.estimatedTime, 0)
      };
    }).filter(section => section.tasks.length > 0);

    setSections(newSections);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'normal': return '#10B981';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      // Aktualizuj lokalnie
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: true, completedAt: new Date() }
          : task
      ));

      // TODO: Wywołaj API
      // await api.completeTask(taskId);
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (viewType === 'gtd_contexts') {
    return <GTDContextList tasks={filteredTasks} onTaskComplete={handleTaskComplete} />;
  }

  const totalTasks = filteredTasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTime = filteredTasks.reduce((sum, task) => sum + task.estimatedTime, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {viewType === 'today' ? 'Zadania na Dziś' : 'Lista Zadań'}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Zadań: {totalTasks}</span>
          <span>Ukończonych: {completedTasks}</span>
          <span>Czas: {formatTime(totalTime)}</span>
          {totalTasks > 0 && (
            <span>Efektywność: {Math.round((completedTasks / (completedTasks + totalTasks)) * 100)}%</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar 
        filters={filters}
        onFiltersChange={setFilters}
        tasks={tasks}
      />

      {/* Task Sections */}
      <div className="flex-1 space-y-6">
        {sections.map(section => (
          <div key={section.priority} className="bg-white rounded-lg shadow-sm border">
            {/* Section Header */}
            <div 
              className="px-4 py-3 border-b border-gray-200"
              style={{ borderLeftColor: section.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {section.priority === 'urgent' ? '🔴 Pilne' :
                   section.priority === 'high' ? '🟡 Wysokie' :
                   section.priority === 'normal' ? '🟢 Średnie' :
                   '🔵 Niskie'} ({section.tasks.length})
                </h3>
                <span className="text-sm text-gray-500">
                  {formatTime(section.totalTime)}
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className="divide-y divide-gray-200">
              {section.tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {sections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Brak zadań do wykonania
            </h3>
            <p className="text-gray-600">
              Świetnie! Wszystkie zadania zostały ukończone lub nie ma żadnych zgodnych z filtrami.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};