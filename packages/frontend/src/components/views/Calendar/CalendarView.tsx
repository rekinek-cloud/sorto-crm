'use client';

import React, { useState, useEffect } from 'react';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'demo' | 'internal' | 'block';
  attendees: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  description?: string;
}

interface DailyTask {
  id: string;
  title: string;
  estimatedTime: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  deadline?: Date;
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  assignee: {
    id: string;
    name: string;
  };
}

interface CalendarViewProps {
  viewType?: 'week' | 'month';
  organizationId: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewType: initialViewType = 'week',
  organizationId
}) => {
  const [viewType, setViewType] = useState<'week' | 'month'>(initialViewType);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewType, organizationId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Mock data - w rzeczywistości z API
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Demo CRM dla TechStartup',
          startTime: new Date(2025, 0, 3, 10, 0), // 3 stycznia 2025, 10:00
          endTime: new Date(2025, 0, 3, 11, 30),
          type: 'demo',
          attendees: [
            { id: '1', name: 'Michał Kowalski', avatar: '' },
            { id: '2', name: 'Anna Kowalska', avatar: '' }
          ],
          deal: { id: '1', title: 'CRM Implementation', company: 'TechStartup Innovations' },
          location: 'Online - Teams',
          priority: 'high',
          gtdContext: '@meetings',
          description: 'Prezentacja funkcjonalności CRM Smart'
        },
        {
          id: '2',
          title: 'Call z RetailChain - follow up',
          startTime: new Date(2025, 0, 3, 14, 0),
          endTime: new Date(2025, 0, 3, 14, 30),
          type: 'call',
          attendees: [
            { id: '2', name: 'Anna Nowak', avatar: '' }
          ],
          deal: { id: '2', title: 'System Training', company: 'RetailChain Poland' },
          priority: 'medium',
          gtdContext: '@calls',
          description: 'Omówienie feedback po prezentacji'
        },
        {
          id: '3',
          title: 'Spotkanie zespołu - Sprint Planning',
          startTime: new Date(2025, 0, 6, 9, 0), // Poniedziałek
          endTime: new Date(2025, 0, 6, 10, 30),
          type: 'internal',
          attendees: [
            { id: '1', name: 'Michał Kowalski', avatar: '' },
            { id: '2', name: 'Anna Nowak', avatar: '' },
            { id: '3', name: 'Piotr Wiśniewski', avatar: '' }
          ],
          location: 'Sala konferencyjna',
          priority: 'medium',
          gtdContext: '@meetings',
          description: 'Planowanie sprintu na nowy tydzień'
        },
        {
          id: '4',
          title: 'Blok czasowy - Deep Work',
          startTime: new Date(2025, 0, 7, 8, 0), // Wtorek
          endTime: new Date(2025, 0, 7, 11, 0),
          type: 'block',
          attendees: [
            { id: '1', name: 'Michał Kowalski', avatar: '' }
          ],
          priority: 'high',
          gtdContext: '@computer',
          description: 'Koncentracja na rozwoju funkcjonalności AI'
        }
      ];

      const mockTasks: DailyTask[] = [
        {
          id: 't1',
          title: 'Przygotować prezentację dla TechStartup',
          estimatedTime: 120,
          priority: 'high',
          gtdContext: '@computer',
          deadline: new Date(2025, 0, 3, 9, 0),
          deal: { id: '1', title: 'CRM Implementation', company: 'TechStartup Innovations' },
          assignee: { id: '1', name: 'Michał Kowalski' }
        },
        {
          id: 't2',
          title: 'Wysłać follow-up email po demo',
          estimatedTime: 30,
          priority: 'medium',
          gtdContext: '@email',
          deadline: new Date(2025, 0, 3, 17, 0),
          deal: { id: '1', title: 'CRM Implementation', company: 'TechStartup Innovations' },
          assignee: { id: '1', name: 'Michał Kowalski' }
        },
        {
          id: 't3',
          title: 'Przygotować ofertę dla nowego klienta',
          estimatedTime: 90,
          priority: 'medium',
          gtdContext: '@computer',
          deadline: new Date(2025, 0, 4, 16, 0),
          assignee: { id: '2', name: 'Anna Nowak' }
        }
      ];

      setEvents(mockEvents);
      setTasks(mockTasks);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Błąd ładowania kalendarza');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateRange = () => {
    if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when Sunday
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Kalendarz
          </h2>
          
          {/* View Type Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewType === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tydzień
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewType === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Miesiąc
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 min-w-0">
              {formatDateRange()}
            </h3>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dziś
          </button>
        </div>

        {/* Summary */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-4">
          <span>Wydarzenia: {events.length}</span>
          <span>Zadania: {tasks.length}</span>
          <span>
            Czas zadań: {Math.round(tasks.reduce((sum, task) => sum + task.estimatedTime, 0) / 60 * 10) / 10}h
          </span>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1">
        {viewType === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
          />
        )}
      </div>
    </div>
  );
};