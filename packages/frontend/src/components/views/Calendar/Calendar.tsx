'use client';

import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  startOfDay,
  isWithinInterval
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: 'meeting' | 'task' | 'project' | 'deal' | 'lead' | 'order' | 'offer';
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
  view?: 'month' | 'week' | 'day';
  showWeekends?: boolean;
  title?: string;
  height?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onEventClick,
  onDateClick,
  onEventDrop,
  view = 'month',
  showWeekends = true,
  title = 'Calendar',
  height = '600px'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(view);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      if (event.allDay) {
        return isSameDay(event.start, date);
      }
      
      if (event.end) {
        return isWithinInterval(date, {
          start: startOfDay(event.start),
          end: startOfDay(event.end)
        }) || isSameDay(event.start, date) || isSameDay(event.end, date);
      }
      
      return isSameDay(event.start, date);
    });
  };

  const getEventColor = (event: CalendarEvent): string => {
    if (event.color) return event.color;
    
    // Color by type
    switch (event.type) {
      case 'meeting': return '#3B82F6'; // Blue
      case 'task': return '#10B981'; // Green
      case 'project': return '#8B5CF6'; // Purple
      case 'deal': return '#F59E0B'; // Amber
      case 'lead': return '#EF4444'; // Red
      case 'order': return '#06B6D4'; // Cyan
      case 'offer': return '#84CC16'; // Lime
      default: return '#6B7280'; // Gray
    }
  };

  const getEventTextColor = (backgroundColor: string): string => {
    // Simple logic to determine if text should be white or black
    return ['#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'].includes(backgroundColor) ? '#FFFFFF' : '#000000';
  };

  const renderCalendarDays = () => {
    const days: React.ReactNode[] = [];
    const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];
    
    if (!showWeekends) {
      dayNames.splice(5, 2); // Remove Saturday and Sunday
    }

    // Render day headers
    dayNames.forEach(day => {
      days.push(
        <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-50 border-b">
          {day}
        </div>
      );
    });

    // Render calendar days
    let day = startDate;
    const rows = [];
    
    while (day <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if (!showWeekends && (i === 5 || i === 6)) {
          day = addDays(day, 1);
          continue;
        }

        const currentDay = day;
        const dayEvents = getEventsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isDayToday = isToday(currentDay);

        week.push(
          <motion.div
            key={format(currentDay, 'yyyy-MM-dd')}
            className={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 ${
              !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
            } ${isDayToday ? 'bg-blue-50 border-blue-200' : ''}`}
            onClick={() => onDateClick && onDateClick(currentDay)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`text-right mb-1 ${isDayToday ? 'font-bold text-blue-600' : ''}`}>
              {format(currentDay, 'd')}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => {
                const bgColor = getEventColor(event);
                const textColor = getEventTextColor(bgColor);
                
                return (
                  <motion.div
                    key={event.id}
                    className="text-xs p-1 rounded cursor-pointer truncate"
                    style={{ 
                      backgroundColor: bgColor + '20', // 20% opacity
                      borderLeft: `3px solid ${bgColor}`,
                      color: textColor === '#FFFFFF' ? bgColor : '#374151'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick && onEventClick(event);
                    }}
                    whileHover={{ scale: 1.05 }}
                    title={`${event.title} - ${format(event.start, 'HH:mm')}`}
                  >
                    <div className="flex items-center">
                      {event.type === 'meeting' && <Clock className="w-3 h-3 mr-1" />}
                      <span className="truncate">{event.title}</span>
                    </div>
                  </motion.div>
                );
              })}
              
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 font-medium">
                  +{dayEvents.length - 3} więcej
                </div>
              )}
            </div>
          </motion.div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={format(day, 'yyyy-MM-dd')} className="grid grid-cols-7">
          {week}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <div className="grid grid-cols-7 border-t border-l border-gray-200">
          {days}
        </div>
        <div className="border-l border-gray-200">
          {rows}
        </div>
      </div>
    );
  };

  const renderEventsList = () => {
    const todayEvents = events.filter(event => isSameDay(event.start, new Date()));
    const upcomingEvents = events
      .filter(event => event.start > new Date())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Dzisiaj</h4>
          {todayEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">Brak wydarzeń</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(event => (
                <div key={event.id} className="flex items-center p-2 rounded hover:bg-gray-50">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(event.start, 'HH:mm')} {event.location && `• ${event.location}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Nadchodzące</h4>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">Brak nadchodzących wydarzeń</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center p-2 rounded hover:bg-gray-50">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(event.start, 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200" style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={previousMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium min-w-[160px] text-center">
              {format(currentDate, 'LLLL yyyy', { locale: pl })}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setCurrentView('month')}
              className={`px-3 py-1 text-sm ${
                currentView === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Miesiąc
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-3 py-1 text-sm ${
                currentView === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tydzień
            </button>
            <button
              onClick={() => setCurrentView('day')}
              className={`px-3 py-1 text-sm ${
                currentView === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dzień
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex" style={{ height: 'calc(100% - 73px)' }}>
        <div className="flex-1 overflow-auto">
          {currentView === 'month' && renderCalendarDays()}
          {currentView === 'week' && (
            <div className="p-4 text-center text-gray-500">
              Widok tygodniowy w przygotowaniu
            </div>
          )}
          {currentView === 'day' && (
            <div className="p-4 text-center text-gray-500">
              Widok dzienny w przygotowaniu
            </div>
          )}
        </div>
        
        <div className="w-80 border-l border-gray-200 p-4 overflow-auto">
          {renderEventsList()}
        </div>
      </div>
    </div>
  );
};

export default Calendar;