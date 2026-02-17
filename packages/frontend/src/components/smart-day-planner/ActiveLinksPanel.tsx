'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  smartDayPlannerApi,
  dashboardApi,
  type ScheduledTask,
  type DailyWidgetData
} from '../../lib/api/smartDayPlanner';

// =============================================================================
// ACTIVE LINKS PANEL - Dashboard Integration FAZA 3
// =============================================================================
// Panel szybkich linków do aktywnych zadań i bloków czasowych
// Autor: Claude Code 2025-07-07

interface ActiveLinksPanelProps {
  className?: string;
  maxItems?: number;
  showCategories?: boolean;
}

const ActiveLinksPanel: React.FC<ActiveLinksPanelProps> = ({ 
  className = '',
  maxItems = 5,
  showCategories = true
}) => {
  const [activeTasks, setActiveTasks] = useState<ScheduledTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<ScheduledTask[]>([]);
  const [currentBlock, setCurrentBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveLinks();
    
    // Auto-refresh co 2 minuty
    const interval = setInterval(fetchActiveLinks, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveLinks = async () => {
    try {
      setLoading(true);
      
      // Pobierz dane daily widget dla aktywnych informacji
      const widgetResponse = await dashboardApi.getDailyWidget();
      
      if (widgetResponse.success) {
        const data = widgetResponse.data;
        
        // Ustaw aktywny blok
        setCurrentBlock(data.currentActivity.currentBlock);
        
        // Pobierz dzisiejsze zadania z API
        const today = new Date().toISOString().split('T')[0];
        const tasksResponse = await smartDayPlannerApi.getDailySchedule(today);
        
        if (tasksResponse.success && tasksResponse.data.timeBlocks) {
          // Zbierz wszystkie zadania z bloków czasowych
          const allTasks: ScheduledTask[] = [];
          
          tasksResponse.data.timeBlocks.forEach((block: any) => {
            if (block.scheduledTasks && Array.isArray(block.scheduledTasks)) {
              allTasks.push(...block.scheduledTasks);
            }
          });
          
          setActiveTasks(allTasks.filter((task: any) => 
            task.status === 'IN_PROGRESS'
          ).slice(0, maxItems));
          
          setUpcomingTasks(allTasks.filter((task: any) => 
            task.status === 'PLANNED'
          ).slice(0, maxItems));
        }
      }
    } catch (error: any) {
      console.error('Error fetching active links:', error);
      toast.error('Błąd podczas pobierania aktywnych linków');
    } finally {
      setLoading(false);
    }
  };

  const getTaskIcon = (task: ScheduledTask) => {
    switch (task.context?.toLowerCase()) {
      case '@computer':
        return '💻';
      case '@calls':
        return '📞';
      case '@reading':
        return '📚';
      case '@office':
        return '🏢';
      case '@home':
        return '🏠';
      case '@errands':
        return '🚗';
      default:
        return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEnergyIcon = (energyLevel: string) => {
    switch (energyLevel) {
      case 'HIGH':
        return '🔥';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return '🌙';
      case 'CREATIVE':
        return '🎨';
      case 'ADMINISTRATIVE':
        return '📊';
      default:
        return '⚪';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-sm font-semibold text-gray-900">Aktywne Linki</h3>
        <p className="text-xs text-gray-600">Szybki dostęp do bieżących zadań</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Aktualny blok czasowy */}
        {currentBlock && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">TERAZ</h4>
            <Link
              href={`/dashboard/smart-day-planner?block=${currentBlock.id}`}
              className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">⏰</span>
                  <div>
                    <div className="text-sm font-medium text-blue-900">{currentBlock.name}</div>
                    <div className="text-xs text-blue-600">
                      {currentBlock.startTime} - {currentBlock.endTime}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  {currentBlock.activeTasks.length} zadań
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Aktywne zadania */}
        {showCategories && activeTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-700">W TOKU</h4>
              <Link
                href="/dashboard/smart-day-planner"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Zobacz wszystkie
              </Link>
            </div>
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <Link
                  key={task.id}
                  href="#"
                  className="block p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // POPRAWKA: Scheduled tasks nie mają strony szczegółów
                    alert(`Szczegóły zadania:\n\nTytuł: ${task.title}\nStatus: ${task.status}\nPriorytet: ${task.priority}\nCzas: ${task.estimatedMinutes}min\n\nTo jest zadanie zaplanowane w Smart Day Planner.\nAby zobaczyć pełne szczegóły, przejdź do Smart Day Planner.`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span>{getTaskIcon(task)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{getEnergyIcon(task.energyRequired)}</span>
                          <span>{formatTime(task.estimatedMinutes)}</span>
                          {task.startedAt && (
                            <span className="text-green-600">
                              Rozpoczęte {new Date(task.startedAt).toLocaleTimeString('pl-PL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Nadchodzące zadania */}
        {showCategories && upcomingTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-700">ZAPLANOWANE</h4>
              <Link
                href="/dashboard/smart-day-planner"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Planuj dzień
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingTasks.slice(0, 3).map((task) => (
                <Link
                  key={task.id}
                  href="#"
                  className="block p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // POPRAWKA: Scheduled tasks nie mają strony szczegółów
                    alert(`Szczegóły zadania:\n\nTytuł: ${task.title}\nStatus: ${task.status}\nPriorytet: ${task.priority}\nCzas: ${task.estimatedMinutes}min\n\nTo jest zadanie zaplanowane w Smart Day Planner.\nAby zobaczyć pełne szczegóły, przejdź do Smart Day Planner.`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span>{getTaskIcon(task)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{getEnergyIcon(task.energyRequired)}</span>
                          <span>{formatTime(task.estimatedMinutes)}</span>
                          <span>{task.context}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      ⏰
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access Links */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">SZYBKI DOSTĘP</h4>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/smart-day-planner"
              className="flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-sm">📅 Planner</span>
            </Link>
            <Link
              href="/dashboard/gtd/inbox"
              className="flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-sm">📥 Inbox</span>
            </Link>
            <Link
              href="/dashboard/projects"
              className="flex items-center justify-center p-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-sm">🎯 Projekty</span>
            </Link>
            <Link
              href="/dashboard/gtd/focus-modes"
              className="flex items-center justify-center p-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-sm">🎯 Focus</span>
            </Link>
          </div>
        </div>

        {/* Pusty stan */}
        {activeTasks.length === 0 && upcomingTasks.length === 0 && !currentBlock && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🌅</div>
            <p className="text-sm text-gray-600 mb-3">Brak aktywnych zadań</p>
            <Link
              href="/dashboard/smart-day-planner"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Zaplanuj dzień
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveLinksPanel;