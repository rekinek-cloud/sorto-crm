'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  Video,
  Phone,
  MapPin,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'IN_PERSON' | 'VIDEO' | 'PHONE';
  attendees: string[];
  location?: string;
  color?: string;
}

export default function MeetingsCalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockMeetings: Meeting[] = [
      {
        id: '1',
        title: 'Weekly Team Sync',
        description: 'Weekly team synchronization meeting',
        startTime: '2025-01-06T10:00:00',
        endTime: '2025-01-06T11:00:00',
        type: 'VIDEO',
        attendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        location: 'Zoom',
        color: 'bg-blue-500',
      },
      {
        id: '2',
        title: 'Client Presentation',
        description: 'Q1 Results presentation',
        startTime: '2025-01-08T14:00:00',
        endTime: '2025-01-08T15:30:00',
        type: 'IN_PERSON',
        attendees: ['Client Team', 'Sales Team'],
        location: 'Conference Room A',
        color: 'bg-green-500',
      },
      {
        id: '3',
        title: 'Sales Call',
        description: 'New lead discussion',
        startTime: '2025-01-10T09:00:00',
        endTime: '2025-01-10T09:30:00',
        type: 'PHONE',
        attendees: ['Sales Rep', 'Prospect'],
        color: 'bg-purple-500',
      },
    ];

    setMeetings(mockMeetings);
    setIsLoading(false);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'PHONE':
        return <Phone className="w-4 h-4" />;
      case 'IN_PERSON':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pl-PL', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageShell>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  return (
    <PageShell>
      <PageHeader
        title="Kalendarz spotkan"
        subtitle="Przegladaj i zarzadzaj spotkaniami"
        icon={Calendar}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/dashboard/meetings'}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Powrot do listy
            </button>
            <button className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Nowe spotkanie
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Calendar Controls */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">{monthYear}</h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Miesiac
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Tydzien
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Dzien
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {['Ndz', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0 border-t border-l border-slate-200 dark:border-slate-700">
              {days.map((dayInfo, index) => {
                const dayMeetings = getMeetingsForDate(dayInfo.date);
                const isToday =
                  dayInfo.date.toDateString() === new Date().toDateString() &&
                  dayInfo.isCurrentMonth;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 min-h-[120px] ${
                      dayInfo.isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'
                    } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      dayInfo.isCurrentMonth ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                    } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {dayInfo.day}
                    </div>

                    {/* Meeting items */}
                    <div className="space-y-1">
                      {dayMeetings.slice(0, 3).map(meeting => (
                        <div
                          key={meeting.id}
                          className={`text-xs p-1 rounded ${meeting.color} text-white truncate cursor-pointer hover:opacity-80 transition-opacity`}
                          title={`${meeting.title} - ${formatTime(meeting.startTime)}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(meeting.type)}
                            <span className="truncate">{formatTime(meeting.startTime)}</span>
                          </div>
                          <div className="truncate font-medium">{meeting.title}</div>
                        </div>
                      ))}
                      {dayMeetings.length > 3 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          +{dayMeetings.length - 3} wiecej
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Typy spotkan</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Wideo</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Telefon</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Osobiscie</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
