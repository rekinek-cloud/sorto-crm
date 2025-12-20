'use client';

import React, { useState, useEffect } from 'react';

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  progress: number; // 0-100%
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dependsOn: string[]; // Task IDs
  priority: 'urgent' | 'high' | 'normal' | 'low';
  gtdContext: string;
  project?: {
    id: string;
    name: string;
  };
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
}

interface GanttViewProps {
  viewType?: 'project' | 'deals' | 'critical_path';
  organizationId: string;
}

export const GanttView: React.FC<GanttViewProps> = ({ 
  viewType = 'project',
  organizationId 
}) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeScale, setTimeScale] = useState<'days' | 'weeks' | 'months'>('weeks');

  useEffect(() => {
    loadGanttData();
  }, [viewType, organizationId]);

  const loadGanttData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with API call
      const mockTasks: GanttTask[] = [
        {
          id: '1',
          name: 'Analiza wymagań',
          startDate: new Date(2025, 6, 1),
          endDate: new Date(2025, 6, 5),
          duration: 5,
          progress: 100,
          assignee: { id: '1', name: 'Michał Kowalski', avatar: '' },
          dependsOn: [],
          priority: 'high',
          gtdContext: '@computer',
          project: { id: 'proj-1', name: 'CRM Implementation' }
        },
        {
          id: '2',
          name: 'Projektowanie architektury',
          startDate: new Date(2025, 6, 6),
          endDate: new Date(2025, 6, 12),
          duration: 7,
          progress: 75,
          assignee: { id: '2', name: 'Anna Nowak', avatar: '' },
          dependsOn: ['1'],
          priority: 'high',
          gtdContext: '@computer',
          project: { id: 'proj-1', name: 'CRM Implementation' }
        },
        {
          id: '3',
          name: 'Implementacja backend',
          startDate: new Date(2025, 6, 13),
          endDate: new Date(2025, 6, 27),
          duration: 15,
          progress: 30,
          assignee: { id: '3', name: 'Piotr Kowalczyk', avatar: '' },
          dependsOn: ['2'],
          priority: 'urgent',
          gtdContext: '@computer',
          project: { id: 'proj-1', name: 'CRM Implementation' }
        },
        {
          id: '4',
          name: 'Implementacja frontend',
          startDate: new Date(2025, 6, 20),
          endDate: new Date(2025, 7, 3),
          duration: 15,
          progress: 10,
          assignee: { id: '4', name: 'Katarzyna Wójcik', avatar: '' },
          dependsOn: ['2'],
          priority: 'high',
          gtdContext: '@computer',
          project: { id: 'proj-1', name: 'CRM Implementation' }
        },
        {
          id: '5',
          name: 'Testowanie',
          startDate: new Date(2025, 7, 4),
          endDate: new Date(2025, 7, 10),
          duration: 7,
          progress: 0,
          assignee: { id: '5', name: 'Tomasz Krawczyk', avatar: '' },
          dependsOn: ['3', '4'],
          priority: 'normal',
          gtdContext: '@computer',
          project: { id: 'proj-1', name: 'CRM Implementation' }
        }
      ];

      const mockMilestones: Milestone[] = [
        {
          id: 'm1',
          name: 'Analiza ukończona',
          date: new Date(2025, 6, 5),
          completed: true
        },
        {
          id: 'm2',
          name: 'Design zatwierdzony',
          date: new Date(2025, 6, 12),
          completed: false
        },
        {
          id: 'm3',
          name: 'MVP gotowe',
          date: new Date(2025, 7, 3),
          completed: false
        },
        {
          id: 'm4',
          name: 'Go-live',
          date: new Date(2025, 7, 10),
          completed: false
        }
      ];

      setTasks(mockTasks);
      setMilestones(mockMilestones);
    } catch (err) {
      console.error('Error loading gantt data:', err);
      setError('Błąd ładowania wykresu Gantta');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-green-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const calculateTaskPosition = (task: GanttTask) => {
    const projectStart = Math.min(...tasks.map(t => t.startDate.getTime()));
    const projectEnd = Math.max(...tasks.map(t => t.endDate.getTime()));
    const totalDuration = projectEnd - projectStart;
    
    const taskStart = task.startDate.getTime() - projectStart;
    const taskDuration = task.endDate.getTime() - task.startDate.getTime();
    
    const leftPercent = (taskStart / totalDuration) * 100;
    const widthPercent = (taskDuration / totalDuration) * 100;
    
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const generateTimelineHeaders = () => {
    if (tasks.length === 0) return [];
    
    const projectStart = new Date(Math.min(...tasks.map(t => t.startDate.getTime())));
    const projectEnd = new Date(Math.max(...tasks.map(t => t.endDate.getTime())));
    
    const headers = [];
    const current = new Date(projectStart);
    
    while (current <= projectEnd) {
      headers.push(new Date(current));
      
      switch (timeScale) {
        case 'days':
          current.setDate(current.getDate() + 1);
          break;
        case 'weeks':
          current.setDate(current.getDate() + 7);
          break;
        case 'months':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return headers;
  };

  const formatHeaderDate = (date: Date) => {
    switch (timeScale) {
      case 'days':
        return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
      case 'weeks':
        return `T${Math.ceil(date.getDate() / 7)}`;
      case 'months':
        return date.toLocaleDateString('pl-PL', { month: 'short' });
      default:
        return date.toDateString();
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

  const timelineHeaders = generateTimelineHeaders();

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Wykres Gantta - {viewType === 'project' ? 'Projekty' : viewType === 'deals' ? 'Deale' : 'Ścieżka krytyczna'}
        </h2>
        <div className="flex items-center space-x-4">
          <select 
            value={timeScale}
            onChange={(e) => setTimeScale(e.target.value as any)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="days">Dni</option>
            <option value="weeks">Tygodnie</option>
            <option value="months">Miesiące</option>
          </select>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        {/* Timeline Header */}
        <div className="flex border-b">
          <div className="w-80 p-4 border-r bg-gray-50 font-medium">
            Zadanie
          </div>
          <div className="flex-1 flex">
            {timelineHeaders.map((date, index) => (
              <div 
                key={index} 
                className="flex-1 p-2 text-center text-sm border-r bg-gray-50 min-w-16"
              >
                {formatHeaderDate(date)}
              </div>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        <div className="relative">
          {tasks.map((task, index) => {
            const position = calculateTaskPosition(task);
            return (
              <div key={task.id} className="flex border-b hover:bg-gray-50">
                {/* Task Info */}
                <div className="w-80 p-4 border-r">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                    <span className="font-medium text-sm">{task.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    👤 {task.assignee.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    📅 {task.duration} dni
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 p-2 relative h-16">
                  {/* Task Bar */}
                  <div 
                    className={`absolute top-2 h-6 ${getPriorityColor(task.priority)} rounded-md cursor-pointer`}
                    style={position}
                    title={`${task.name} (${task.progress}%)`}
                  >
                    {/* Progress */}
                    <div 
                      className={`h-full ${getProgressColor(task.progress)} rounded-md opacity-80`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                    
                    {/* Task Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {task.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Dependencies */}
                  {task.dependsOn.map(depId => {
                    const dependentTask = tasks.find(t => t.id === depId);
                    if (!dependentTask) return null;
                    
                    const depPosition = calculateTaskPosition(dependentTask);
                    const depRight = parseFloat(depPosition.left.replace('%', '')) + parseFloat(depPosition.width.replace('%', ''));
                    const taskLeft = parseFloat(position.left.replace('%', ''));
                    
                    return (
                      <div
                        key={depId}
                        className="absolute top-4 h-0.5 bg-gray-400"
                        style={{
                          left: `${depRight}%`,
                          width: `${taskLeft - depRight}%`
                        }}
                      >
                        <div className="absolute right-0 top-0 w-2 h-2 bg-gray-400 transform rotate-45 -translate-y-1"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestones */}
        <div className="border-t bg-yellow-50">
          <div className="flex">
            <div className="w-80 p-4 border-r font-medium">
              Kamienie milowe
            </div>
            <div className="flex-1 p-2 relative">
              {milestones.map(milestone => {
                const projectStart = Math.min(...tasks.map(t => t.startDate.getTime()));
                const projectEnd = Math.max(...tasks.map(t => t.endDate.getTime()));
                const totalDuration = projectEnd - projectStart;
                const milestonePosition = ((milestone.date.getTime() - projectStart) / totalDuration) * 100;
                
                return (
                  <div
                    key={milestone.id}
                    className="absolute top-2"
                    style={{ left: `${milestonePosition}%` }}
                    title={milestone.name}
                  >
                    <div className={`w-4 h-4 ${milestone.completed ? 'bg-green-500' : 'bg-yellow-500'} transform rotate-45`}></div>
                    <div className="text-xs mt-1 transform -translate-x-1/2 whitespace-nowrap">
                      {milestone.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Pilne</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Wysokie</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Normalne</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Niskie</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 transform rotate-45"></div>
          <span>Kamień milowy</span>
        </div>
      </div>
    </div>
  );
};