'use client';

import React from 'react';
import { EventCard } from './EventCard';
import { GTDContextBadge } from '../shared/GTDContextBadge';
import { PriorityIndicator } from '../shared/PriorityIndicator';

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

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: DailyTask[];
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  tasks
}) => {
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
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
    }).sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  };

  const getHourSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long'
    });
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDays = getWeekDays();
  const hourSlots = getHourSlots();

  return (
    <div className="h-full flex flex-col">
      {/* Week Grid */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header with Days */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          {/* Time Column Header */}
          <div className="p-3 bg-gray-50 border-r border-gray-200">
            <span className="text-sm font-medium text-gray-600">Czas</span>
          </div>
          
          {/* Day Headers */}
          {weekDays.map(day => (
            <div 
              key={day.toISOString()} 
              className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                isToday(day) ? 'bg-indigo-50' : 'bg-gray-50'
              }`}
            >
              <div className={`text-sm font-medium ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>
                {formatDayName(day)}
              </div>
              <div className={`text-xl font-bold mt-1 ${
                isToday(day) 
                  ? 'bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' 
                  : 'text-gray-900'
              }`}>
                {formatDayNumber(day)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8">
            {/* Time Labels Column */}
            <div className="bg-gray-50 border-r border-gray-200">
              {hourSlots.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-200 p-2 text-right">
                  <span className="text-sm text-gray-600">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const dayTasks = getTasksForDay(day);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`border-r border-gray-200 last:border-r-0 relative ${
                    isToday(day) ? 'bg-indigo-50 bg-opacity-30' : ''
                  }`}
                >
                  {/* Hour Slots */}
                  {hourSlots.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-200 relative">
                      {/* Events in this hour */}
                      {dayEvents
                        .filter(event => event.startTime.getHours() === hour)
                        .map(event => (
                          <EventCard 
                            key={event.id} 
                            event={event} 
                            compact={true}
                          />
                        ))
                      }
                    </div>
                  ))}

                  {/* Daily Tasks Section */}
                  {dayTasks.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 border-t border-gray-300 p-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Zadania ({dayTasks.length})
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                          <div 
                            key={task.id}
                            className="flex items-center space-x-1 text-xs bg-white rounded p-1 border"
                          >
                            <PriorityIndicator priority={task.priority} size="sm" />
                            <span className="truncate flex-1">{task.title}</span>
                            <GTDContextBadge context={task.gtdContext} size="sm" showIcon={false} />
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayTasks.length - 3} więcej
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Legenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Spotkania</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Rozmowy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Demo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Blok czasowy</span>
          </div>
        </div>
      </div>
    </div>
  );
};