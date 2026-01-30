'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  UserGroupIcon,
  VideoCameraIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

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
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'PHONE':
        return <PhoneIcon className="w-4 h-4" />;
      case 'IN_PERSON':
        return <MapPinIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings Calendar</h1>
          <p className="text-gray-600">View and manage all your meetings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = '/crm/dashboard/meetings'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to List
          </button>
          <button className="btn btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{monthYear}</h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'day' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0 border-t border-l">
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
                  className={`border-r border-b p-2 min-h-[120px] ${
                    dayInfo.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    dayInfo.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {dayInfo.day}
                  </div>
                  
                  {/* Meeting items */}
                  <div className="space-y-1">
                    {dayMeetings.slice(0, 3).map(meeting => (
                      <div
                        key={meeting.id}
                        className={`text-xs p-1 rounded ${meeting.color} text-white truncate cursor-pointer hover:opacity-80`}
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
                      <div className="text-xs text-gray-500 text-center">
                        +{dayMeetings.length - 3} more
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
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Meeting Types</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <VideoCameraIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Video Call</span>
          </div>
          <div className="flex items-center space-x-2">
            <PhoneIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">Phone Call</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">In Person</span>
          </div>
        </div>
      </div>
    </div>
  );
}