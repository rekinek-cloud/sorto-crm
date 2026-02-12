'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  BarChart3,
  Filter,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  Rocket,
  Users,
  AlarmClock,
  Target,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface TimelineEvent {
  id: string;
  eventId: string;
  eventType: 'TASK' | 'PROJECT' | 'MEETING' | 'DEADLINE' | 'MILESTONE';
  title: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'timeline' | 'calendar' | 'list';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const EventTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'TASK': return <ClipboardList className="h-4 w-4" />;
    case 'PROJECT': return <Rocket className="h-4 w-4" />;
    case 'MEETING': return <Users className="h-4 w-4" />;
    case 'DEADLINE': return <AlarmClock className="h-4 w-4" />;
    case 'MILESTONE': return <Target className="h-4 w-4" />;
    default: return <CalendarDays className="h-4 w-4" />;
  }
};

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data for demo
  useEffect(() => {
    const now = new Date();
    const mockEvents: TimelineEvent[] = [
      {
        id: '1',
        eventId: 'task-1',
        eventType: 'TASK',
        title: 'Raport Q4',
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        eventId: 'project-1',
        eventType: 'PROJECT',
        title: 'Redesign strony',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        eventId: 'meeting-1',
        eventType: 'MEETING',
        title: 'Spotkanie strategiczne z klientem',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        eventId: 'deadline-1',
        eventType: 'DEADLINE',
        title: 'Deadline projektu Alpha',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        eventId: 'milestone-1',
        eventType: 'MILESTONE',
        title: 'Wydanie Beta',
        startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setIsLoading(false);
    }, 500);
  }, []);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'TASK': return 'bg-blue-500';
      case 'PROJECT': return 'bg-green-500';
      case 'MEETING': return 'bg-purple-500';
      case 'DEADLINE': return 'bg-red-500';
      case 'MILESTONE': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysFromNow = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} dni temu`;
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Jutro';
    return `Za ${diffDays} dni`;
  };

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const upcomingEvents = events.filter(event =>
    new Date(event.startDate) > new Date()
  );

  const pastEvents = events.filter(event =>
    new Date(event.startDate) <= new Date()
  );

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Os czasu"
        subtitle="Wizualizacja zadan, projektow i wydarzen w czasie"
        icon={Calendar}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/30 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Os czasu
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Kalendarz
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Lista
              </button>
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
            >
              <option value="week">Tydzien</option>
              <option value="month">Miesiac</option>
              <option value="quarter">Kwartal</option>
              <option value="year">Rok</option>
            </select>
          </div>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lacznie wydarzen</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <ArrowUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nadchodzace</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <ArrowDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Zakonczone</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{pastEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ten tydzien</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {events.filter(e => {
                  const eventDate = new Date(e.startDate);
                  const now = new Date();
                  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return eventDate >= weekStart && eventDate <= weekEnd;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {events.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <CalendarDays className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak wydarzen na osi czasu</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Os czasu uzupelni sie automatycznie w miare tworzenia zadan, projektow i spotkan.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'timeline' && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

                <div className="space-y-8">
                  {sortedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="relative flex items-start space-x-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getEventTypeColor(event.eventType)} text-white text-sm font-medium`}>
                        <EventTypeIcon type={event.eventType} />
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.eventType === 'TASK' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              event.eventType === 'PROJECT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              event.eventType === 'MEETING' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              event.eventType === 'DEADLINE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {event.eventType}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(event.startDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(event.startDate)}</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-500">
                              {getDaysFromNow(event.startDate)}
                            </span>
                          </div>

                          {event.endDate && (
                            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                              <span>Konczy sie: {formatDate(event.endDate)} o {formatTime(event.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Wszystkie wydarzenia ({events.length})</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)}`}></div>
                        <div>
                          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">{event.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <span>{formatDate(event.startDate)}</span>
                            <span>{formatTime(event.startDate)}</span>
                            <span className="text-slate-500 dark:text-slate-500">{getDaysFromNow(event.startDate)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        event.eventType === 'TASK' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        event.eventType === 'PROJECT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        event.eventType === 'MEETING' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        event.eventType === 'DEADLINE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {event.eventType}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {selectedDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                  >
                    Dzisiaj
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Nie', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const year = selectedDate.getFullYear();
                  const month = selectedDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  const endDate = new Date(lastDay);
                  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

                  const dates = [];
                  const current = new Date(startDate);

                  while (current <= endDate) {
                    dates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                  }

                  return dates.map(date => {
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayEvents = events.filter(event => {
                      const eventDate = new Date(event.startDate);
                      return eventDate.toDateString() === date.toDateString();
                    });

                    return (
                      <div
                        key={date.toISOString()}
                        className={`min-h-24 p-1 border border-slate-100 dark:border-slate-700/50 rounded-lg ${
                          isCurrentMonth ? 'bg-white dark:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-900/30'
                        } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isCurrentMonth ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'
                        } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`px-1 py-0.5 text-xs rounded ${
                                event.eventType === 'TASK' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                event.eventType === 'PROJECT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                event.eventType === 'MEETING' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                event.eventType === 'DEADLINE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                              title={event.title}
                            >
                              {event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              +{dayEvents.length - 2} wiecej
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
