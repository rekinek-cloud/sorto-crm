'use client';

import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  gtdContext: string;
  estimatedTime: number; // minutes
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate?: Date;
  completed: boolean;
  deal?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

interface TaskSection {
  priority: 'urgent' | 'high' | 'normal' | 'low';
  color: string;
  tasks: Task[];
  totalTime: number;
}

interface ListViewProps {
  viewType?: 'today' | 'gtd_context' | 'filtered';
  organizationId: string;
}

export const ListView: React.FC<ListViewProps> = ({ 
  viewType = 'today',
  organizationId 
}) => {
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadListData();
  }, [viewType, organizationId]);

  const loadListData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with API call
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Zadzwoń do klienta ABC Corp',
          description: 'Omówić szczegóły implementacji',
          priority: 'urgent',
          gtdContext: '@calls',
          estimatedTime: 30,
          assignee: { id: '1', name: 'Michał Kowalski', avatar: '' },
          dueDate: new Date(),
          completed: false,
          deal: { id: 'deal-1', title: 'ABC Corp Implementation' }
        },
        {
          id: '2',
          title: 'Przygotować ofertę dla XYZ Ltd',
          priority: 'high',
          gtdContext: '@computer',
          estimatedTime: 120,
          assignee: { id: '2', name: 'Anna Nowak', avatar: '' },
          dueDate: new Date(),
          completed: false,
          project: { id: 'proj-1', name: 'Q4 Sales Push' }
        },
        {
          id: '3',
          title: 'Odpowiedzieć na emaile',
          priority: 'normal',
          gtdContext: '@email',
          estimatedTime: 45,
          assignee: { id: '1', name: 'Michał Kowalski', avatar: '' },
          completed: false
        }
      ];

      // Group tasks by priority
      const priorityColors = {
        urgent: 'bg-red-100 border-red-200 text-red-800',
        high: 'bg-orange-100 border-orange-200 text-orange-800',
        normal: 'bg-green-100 border-green-200 text-green-800',
        low: 'bg-blue-100 border-blue-200 text-blue-800'
      };

      const groupedSections = ['urgent', 'high', 'normal', 'low'].map(priority => {
        const priorityTasks = mockTasks.filter(task => task.priority === priority);
        return {
          priority: priority as any,
          color: priorityColors[priority as keyof typeof priorityColors],
          tasks: priorityTasks,
          totalTime: priorityTasks.reduce((sum, task) => sum + task.estimatedTime, 0)
        };
      }).filter(section => section.tasks.length > 0);

      setSections(groupedSections);
    } catch (err) {
      console.error('Error loading list data:', err);
      setError('Błąd ładowania listy zadań');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟡';
      case 'normal': return '🟢';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const getGTDContextIcon = (context: string) => {
    if (context.includes('calls')) return '📞';
    if (context.includes('email')) return '📧';
    if (context.includes('computer')) return '💻';
    if (context.includes('meeting')) return '🤝';
    return '📋';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {viewType === 'today' && 'Lista Zadań na Dziś'}
          {viewType === 'gtd_context' && 'Zadania według Kontekstu'}
          {viewType === 'filtered' && 'Przefiltrowane Zadania'}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Łączny czas: {sections.reduce((sum, section) => sum + section.totalTime, 0)} min</span>
          <span>Zadań: {sections.reduce((sum, section) => sum + section.tasks.length, 0)}</span>
        </div>
      </div>

      {/* Task Sections */}
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.priority} className={`border rounded-lg p-4 ${section.color.replace('text-', 'border-').split(' ')[1]}`}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getPriorityIcon(section.priority)}</span>
                <h3 className="font-semibold capitalize">{section.priority}</h3>
                <span className="text-sm text-gray-500">({section.tasks.length})</span>
              </div>
              <span className="text-sm text-gray-600">
                {formatTime(section.totalTime)}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {section.tasks.map(task => (
                <div key={task.id} className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          className="rounded border-gray-300"
                          onChange={() => {/* TODO: Handle completion */}}
                        />
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <span>{getGTDContextIcon(task.gtdContext)}</span>
                          <span>{task.gtdContext}</span>
                        </span>
                        <span>⏱️ {formatTime(task.estimatedTime)}</span>
                        <span>👤 {task.assignee.name}</span>
                        {task.dueDate && (
                          <span>📅 {new Date(task.dueDate).toLocaleDateString('pl-PL')}</span>
                        )}
                      </div>

                      {(task.deal || task.project) && (
                        <div className="mt-2 flex items-center space-x-2">
                          {task.deal && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              💼 {task.deal.title}
                            </span>
                          )}
                          {task.project && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              📁 {task.project.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        ✏️
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        ✅
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zadań</h3>
          <p className="text-gray-600">Nie ma zadań do wyświetlenia dla wybranego widoku.</p>
        </div>
      )}
    </div>
  );
};