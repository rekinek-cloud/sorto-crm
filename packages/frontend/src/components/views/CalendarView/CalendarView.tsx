'use client';

import React, { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'demo' | 'internal' | 'block';
  attendees: string[];
  deal?: {
    id: string;
    title: string;
  };
  location?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  gtdContext: string;
}

interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarViewProps {
  viewType?: 'week' | 'month';
  organizationId: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  viewType = 'week',
  organizationId 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewType, organizationId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with API call
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Demo dla ABC Corp',
          startTime: new Date(2025, 6, 2, 10, 0),
          endTime: new Date(2025, 6, 2, 11, 0),
          type: 'demo',
          attendees: ['Michał Kowalski', 'Anna Nowak'],
          deal: { id: 'deal-1', title: 'ABC Corp Implementation' },
          priority: 'high',
          gtdContext: '@meetings'
        },
        {
          id: '2',
          title: 'Telefon do klienta XYZ',
          startTime: new Date(2025, 6, 2, 14, 0),
          endTime: new Date(2025, 6, 2, 14, 30),
          type: 'call',
          attendees: ['Piotr Kowalczyk'],
          priority: 'urgent',
          gtdContext: '@calls'
        },
        {
          id: '3',
          title: 'Sprint Planning',
          startTime: new Date(2025, 6, 3, 9, 0),
          endTime: new Date(2025, 6, 3, 10, 30),
          type: 'internal',
          attendees: ['Team Dev'],
          priority: 'normal',
          gtdContext: '@meetings'
        }
      ];

      const calendarDays = generateCalendarDays(currentDate, viewType, mockEvents);
      setDays(calendarDays);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Błąd ładowania kalendarza');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (date: Date, type: 'week' | 'month', events: CalendarEvent[]): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    if (type === 'week') {
      // Generate week view (7 days)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const dayEvents = events.filter(event => 
          event.startTime.toDateString() === dayDate.toDateString()
        );

        days.push({
          date: dayDate,
          events: dayEvents,
          isToday: dayDate.toDateString() === today.toDateString(),
          isCurrentMonth: dayDate.getMonth() === date.getMonth()
        });
      }
    } else {
      // Generate month view
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Start from Monday of the first week
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
      
      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        
        const dayEvents = events.filter(event => 
          event.startTime.toDateString() === dayDate.toDateString()
        );

        days.push({
          date: dayDate,
          events: dayEvents,
          isToday: dayDate.toDateString() === today.toDateString(),
          isCurrentMonth: dayDate.getMonth() === date.getMonth()
        });
      }
    }
    
    return days;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call': return 'bg-green-100 text-green-800 border-green-200';
      case 'demo': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'internal': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'block': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '🤝';
      case 'call': return '📞';
      case 'demo': return '🎥';
      case 'internal': return '🏢';
      case 'block': return '🚫';
      default: return '📅';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
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
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {viewType === 'week' ? 'Widok Tygodniowy' : 'Widok Miesięczny'}
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            ← Poprzedni
          </button>
          <span className="font-medium">
            {currentDate.toLocaleDateString('pl-PL', { 
              year: 'numeric', 
              month: 'long',
              ...(viewType === 'week' && { day: 'numeric' })
            })}
          </span>
          <button
            onClick={() => navigateDate('next')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Następny →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow border">
        {/* Days Headers */}
        <div className="grid grid-cols-7 gap-0 border-b">
          {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={`grid grid-cols-7 gap-0 ${viewType === 'month' ? 'grid-rows-6' : 'grid-rows-1'}`}>
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`
                min-h-32 p-2 border-r border-b last:border-r-0
                ${day.isToday ? 'bg-blue-50' : 'bg-white'}
                ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
              `}
            >
              {/* Day Number */}
              <div className={`
                text-sm font-medium mb-2
                ${day.isToday ? 'text-blue-600' : 'text-gray-900'}
              `}>
                {day.date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {day.events.slice(0, viewType === 'week' ? 10 : 3).map(event => (
                  <div 
                    key={event.id}
                    className={`
                      text-xs p-1 rounded border cursor-pointer
                      ${getEventTypeColor(event.type)}
                      hover:shadow-sm transition-shadow
                    `}
                    title={`${event.title} (${formatTime(event.startTime)}-${formatTime(event.endTime)})`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{getEventTypeIcon(event.type)}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                    {viewType === 'week' && (
                      <div className="text-xs opacity-75 mt-1">
                        {formatTime(event.startTime)}-{formatTime(event.endTime)}
                      </div>
                    )}
                  </div>
                ))}
                
                {day.events.length > (viewType === 'week' ? 10 : 3) && (
                  <div className="text-xs text-gray-500">
                    +{day.events.length - (viewType === 'week' ? 10 : 3)} więcej
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Spotkania</div>
          <div className="text-2xl font-bold text-blue-900">
            {days.reduce((sum, day) => sum + day.events.filter(e => e.type === 'meeting').length, 0)}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Telefony</div>
          <div className="text-2xl font-bold text-green-900">
            {days.reduce((sum, day) => sum + day.events.filter(e => e.type === 'call').length, 0)}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">Dema</div>
          <div className="text-2xl font-bold text-purple-900">
            {days.reduce((sum, day) => sum + day.events.filter(e => e.type === 'demo').length, 0)}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-sm font-medium">Łącznie</div>
          <div className="text-2xl font-bold text-gray-900">
            {days.reduce((sum, day) => sum + day.events.length, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};