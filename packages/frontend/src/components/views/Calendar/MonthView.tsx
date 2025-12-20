'use client';

import React from 'react';
import { EventCard } from './EventCard';

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
  estimatedTime: number;
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

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: DailyTask[];
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  tasks
}) => {
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Pierwszy dzień miesiąca
    const firstDay = new Date(year, month, 1);
    // Ostatni dzień miesiąca
    const lastDay = new Date(year, month + 1, 0);
    
    // Pierwszy dzień tygodnia w kalendarzu (poniedziałek)
    const startCalendar = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startCalendar.setDate(firstDay.getDate() + diff);
    
    // Ostatni dzień tygodnia w kalendarzu (niedziela)
    const endCalendar = new Date(lastDay);
    const endDayOfWeek = lastDay.getDay();
    const endDiff = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endCalendar.setDate(lastDay.getDate() + endDiff);
    
    const days = [];
    const current = new Date(startCalendar);
    
    while (current <= endCalendar) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate();
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'call': return 'bg-green-500';
      case 'demo': return 'bg-orange-500';
      case 'internal': return 'bg-gray-500';
      case 'block': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300';
      case 'high': return 'bg-orange-100 border-orange-300';
      case 'medium': return 'bg-green-100 border-green-300';
      case 'low': return 'bg-blue-100 border-blue-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const monthDays = getMonthDays();
  const weeks = [];
  
  // Podziel dni na tygodnie
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7));
  }

  const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

  return (
    <div className="h-full flex flex-col">
      {/* Month Grid */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header with Day Names */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map(dayName => (
            <div key={dayName} className="p-3 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
              <span className="text-sm font-medium text-gray-600">{dayName}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex-1 flex flex-col">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex-1 grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map(day => {
                const dayEvents = getEventsForDay(day);
                const dayTasks = getTasksForDay(day);
                const totalItems = dayEvents.length + dayTasks.length;
                
                return (
                  <div 
                    key={day.toISOString()}
                    className={`border-r border-gray-200 last:border-r-0 p-2 relative min-h-[120px] ${
                      !isCurrentMonth(day) ? 'bg-gray-50' : ''
                    } ${isToday(day) ? 'bg-indigo-50' : ''}`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        !isCurrentMonth(day) ? 'text-gray-400' :
                        isToday(day) ? 'text-indigo-600 font-bold' :
                        'text-gray-900'
                      }`}>
                        {formatDayNumber(day)}
                      </span>
                      
                      {/* Today indicator */}
                      {isToday(day) && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div 
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded text-white truncate ${getEventTypeColor(event.type)}`}
                          title={`${event.title} (${event.startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})`}
                        >
                          {event.startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} {event.title}
                        </div>
                      ))}

                      {/* Tasks */}
                      {(dayEvents.length < 2 ? dayTasks.slice(0, 2 - dayEvents.length) : []).map(task => (
                        <div 
                          key={task.id}
                          className={`text-xs px-1 py-0.5 rounded border truncate ${getPriorityColor(task.priority)}`}
                          title={`Zadanie: ${task.title}`}
                        >
                          📋 {task.title}
                        </div>
                      ))}

                      {/* More indicator */}
                      {totalItems > 2 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{totalItems - 2} więcej
                        </div>
                      )}
                    </div>

                    {/* Priority indicators */}
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-1 right-1 flex space-x-1">
                        {dayTasks.some(t => t.priority === 'urgent') && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" title="Pilne zadania"></div>
                        )}
                        {dayTasks.some(t => t.priority === 'high') && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full" title="Wysokie priorytety"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Panel */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upcoming Events */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Najbliższe wydarzenia</h4>
          <div className="space-y-2">
            {events
              .filter(event => event.startTime >= new Date())
              .slice(0, 3)
              .map(event => (
                <div key={event.id} className="text-sm">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-gray-600">
                    {event.startTime.toLocaleDateString('pl-PL', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            }
            {events.filter(event => event.startTime >= new Date()).length === 0 && (
              <p className="text-gray-500 text-sm">Brak nadchodzących wydarzeń</p>
            )}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Pilne zadania</h4>
          <div className="space-y-2">
            {tasks
              .filter(task => task.priority === 'urgent' || task.priority === 'high')
              .slice(0, 3)
              .map(task => (
                <div key={task.id} className="text-sm">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-gray-600">
                    {task.deadline?.toLocaleDateString('pl-PL', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            }
            {tasks.filter(task => task.priority === 'urgent' || task.priority === 'high').length === 0 && (
              <p className="text-gray-500 text-sm">Brak pilnych zadań</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Statystyki miesiąca</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Wydarzenia:</span>
              <span className="font-medium">{events.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Zadania:</span>
              <span className="font-medium">{tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Czas zadań:</span>
              <span className="font-medium">
                {Math.round(tasks.reduce((sum, task) => sum + task.estimatedTime, 0) / 60 * 10) / 10}h
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pilne:</span>
              <span className="font-medium text-red-600">
                {tasks.filter(t => t.priority === 'urgent').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};