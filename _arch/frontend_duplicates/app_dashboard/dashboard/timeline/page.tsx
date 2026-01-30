'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

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
        title: 'Complete Q4 Report',
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        eventId: 'project-1',
        eventType: 'PROJECT',
        title: 'Website Redesign Project',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        eventId: 'meeting-1',
        eventType: 'MEETING',
        title: 'Client Strategy Meeting',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        eventId: 'deadline-1',
        eventType: 'DEADLINE',
        title: 'Project Alpha Deadline',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        eventId: 'milestone-1',
        eventType: 'MILESTONE',
        title: 'Beta Release',
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
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK': return '📋';
      case 'PROJECT': return '🚀';
      case 'MEETING': return '👥';
      case 'DEADLINE': return '⏰';
      case 'MILESTONE': return '🎯';
      default: return '📅';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysFromNow = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
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

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
          <p className="text-gray-600">Visualize your tasks, projects, and events over time</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowDownIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{pastEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timeline Events</h3>
          <p className="text-gray-600 mb-6">
            Your timeline will automatically populate as you create tasks, projects, and meetings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'timeline' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
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
                        {getEventTypeIcon(event.eventType)}
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.eventType === 'TASK' ? 'bg-blue-100 text-blue-700' :
                              event.eventType === 'PROJECT' ? 'bg-green-100 text-green-700' :
                              event.eventType === 'MEETING' ? 'bg-purple-100 text-purple-700' :
                              event.eventType === 'DEADLINE' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {event.eventType}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(event.startDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{formatTime(event.startDate)}</span>
                            </div>
                            <span className="text-gray-500">
                              {getDaysFromNow(event.startDate)}
                            </span>
                          </div>
                          
                          {event.endDate && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span>Ends: {formatDate(event.endDate)} at {formatTime(event.endDate)}</span>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Events ({events.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)}`}></div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{formatDate(event.startDate)}</span>
                            <span>{formatTime(event.startDate)}</span>
                            <span className="text-gray-500">{getDaysFromNow(event.startDate)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        event.eventType === 'TASK' ? 'bg-blue-100 text-blue-700' :
                        event.eventType === 'PROJECT' ? 'bg-green-100 text-green-700' :
                        event.eventType === 'MEETING' ? 'bg-purple-100 text-purple-700' :
                        event.eventType === 'DEADLINE' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
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
                        className={`min-h-24 p-1 border border-gray-100 ${
                          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${isToday ? 'text-blue-600' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`px-1 py-0.5 text-xs rounded ${
                                event.eventType === 'TASK' ? 'bg-blue-100 text-blue-700' :
                                event.eventType === 'PROJECT' ? 'bg-green-100 text-green-700' :
                                event.eventType === 'MEETING' ? 'bg-purple-100 text-purple-700' :
                                event.eventType === 'DEADLINE' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}
                              title={event.title}
                            >
                              {event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2} more
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
    </motion.div>
  );
}