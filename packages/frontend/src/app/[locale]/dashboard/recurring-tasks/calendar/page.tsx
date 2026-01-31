'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import Cookies from 'js-cookie';
import { recurringTasksApi } from '@/lib/api/recurring';
import { toast } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface RecurringTask {
  id: string;
  title: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  pattern?: string;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  months: number[];
  time: string;
  nextOccurrence?: string;
  lastExecuted?: string;
  executionCount: number;
  context?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedMinutes?: number;
  isActive: boolean;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  company?: {
    name: string;
  };
  project?: {
    name: string;
  };
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: RecurringTaskOccurrence[];
}

interface RecurringTaskOccurrence {
  task: RecurringTask;
  time: string;
  isCompleted: boolean;
  canComplete: boolean; // czy można oznaczyć jako wykonane
}

export default function RecurringTasksCalendarPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !Cookies.get('access_token'))) {
      window.location.href = '/auth/login/';
    }
  }, [isLoading, isAuthenticated]);

  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      generateCalendarDays();
    }
  }, [currentDate, tasks, completedTasks]);

  const loadTasks = async () => {
    if (!isAuthenticated || !Cookies.get('access_token')) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await recurringTasksApi.getTasks({
        isActive: true,
        limit: 500
      });
      setTasks(response.recurringTasks || []);
    } catch (error: any) {
      console.error('Error loading recurring tasks:', error);
      toast.error('Failed to load recurring tasks');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();
    
    const days: CalendarDay[] = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonth.getDate() - i;
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: []
      });
    }
    
    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDay = new Date(year, month, date);
      const isToday = isDateToday(currentDay);
      const taskOccurrences = getTaskOccurrencesForDate(currentDay);
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        tasks: taskOccurrences
      });
    }
    
    // Next month days
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDate = 1;
    while (days.length < totalCells) {
      days.push({
        date: nextMonthDate++,
        isCurrentMonth: false,
        isToday: false,
        tasks: []
      });
    }
    
    setCalendarDays(days);
  };

  const getTaskOccurrencesForDate = (date: Date): RecurringTaskOccurrence[] => {
    const occurrences: RecurringTaskOccurrence[] = [];
    
    tasks.forEach(task => {
      if (!task.isActive) return;
      
      const shouldOccurOnDate = checkIfTaskOccursOnDate(task, date);
      if (shouldOccurOnDate) {
        const dateKey = getDateKey(date);
        const taskKey = `${task.id}-${dateKey}`;
        
        occurrences.push({
          task,
          time: task.time,
          isCompleted: completedTasks.has(taskKey),
          canComplete: !isDateFuture(date)
        });
      }
    });
    
    return occurrences.sort((a, b) => a.time.localeCompare(b.time));
  };

  const checkIfTaskOccursOnDate = (task: RecurringTask, date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    
    switch (task.frequency) {
      case 'DAILY':
        return true;
        
      case 'WEEKLY':
        return task.daysOfWeek.includes(dayOfWeek);
        
      case 'MONTHLY':
        return task.dayOfMonth ? dayOfMonth === task.dayOfMonth : dayOfMonth === 1;
        
      case 'QUARTERLY':
        return [1, 4, 7, 10].includes(month) && dayOfMonth === (task.dayOfMonth || 1);
        
      case 'YEARLY':
        return month === (task.months[0] || 1) && dayOfMonth === (task.dayOfMonth || 1);
        
      default:
        return false;
    }
  };

  const isDateToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDateFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleCompleteTask = (task: RecurringTask, date: Date) => {
    const dateKey = getDateKey(date);
    const taskKey = `${task.id}-${dateKey}`;
    
    const newCompleted = new Set(completedTasks);
    if (completedTasks.has(taskKey)) {
      newCompleted.delete(taskKey);
      toast.success('Task marked as incomplete');
    } else {
      newCompleted.add(taskKey);
      toast.success('Task marked as completed');
    }
    setCompletedTasks(newCompleted);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date): string => {
    const months = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return '📅';
      case 'WEEKLY': return '📆';
      case 'MONTHLY': return '🗓️';
      case 'QUARTERLY': return '📊';
      case 'YEARLY': return '🎯';
      default: return '🔄';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const selectedDay = selectedDate ? calendarDays.find(day => 
    day.isCurrentMonth && getDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)) === selectedDate
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Tasks Calendar</h1>
          <p className="text-gray-600">View and manage your recurring tasks schedule</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/recurring-tasks')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            List View
          </button>
          <button 
            onClick={() => router.push('/dashboard/recurring-tasks/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Recurring Task
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(t => t.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calendarDays.find(d => d.isToday)?.tasks.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 text-purple-600">✅</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calendarDays.find(d => d.isToday)?.tasks.filter(t => t.isCompleted).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {formatMonthYear(currentDate)}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Dziś
              </button>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 ${
                  day.isToday ? 'bg-blue-50 border-blue-200' : ''
                } ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''} ${
                  selectedDate === getDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)) 
                    ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    const dateKey = getDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date));
                    setSelectedDate(selectedDate === dateKey ? null : dateKey);
                  }
                }}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-medium mb-1 ${
                    day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {day.date}
                  </div>
                  <div className="flex-1 overflow-hidden space-y-1">
                    {day.tasks.slice(0, 3).map((occurrence, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={`text-xs p-1 rounded border ${getPriorityColor(occurrence.task.priority)} ${
                          occurrence.isCompleted ? 'opacity-50 line-through' : ''
                        }`}
                        title={`${occurrence.time} - ${occurrence.task.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (occurrence.canComplete) {
                            handleCompleteTask(
                              occurrence.task, 
                              new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)
                            );
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{getFrequencyIcon(occurrence.task.frequency)}</span>
                          <span>{occurrence.time}</span>
                          {occurrence.isCompleted && <span>✅</span>}
                        </div>
                        <div className="truncate">{occurrence.task.title}</div>
                      </div>
                    ))}
                    {day.tasks.length > 3 && (
                      <div className="text-xs text-gray-500 p-1">
                        +{day.tasks.length - 3} więcej
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && selectedDay.tasks.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Zadania na {selectedDay.date} {formatMonthYear(currentDate)}
            </h3>
            <div className="space-y-3">
              {selectedDay.tasks.map((occurrence, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getPriorityColor(occurrence.task.priority)} ${
                    occurrence.isCompleted ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFrequencyIcon(occurrence.task.frequency)}</span>
                      <div>
                        <h4 className={`font-medium ${occurrence.isCompleted ? 'line-through' : ''}`}>
                          {occurrence.task.title}
                        </h4>
                        <div className="text-sm space-x-2">
                          <span>🕒 {occurrence.time}</span>
                          <span>🔄 {occurrence.task.frequency}</span>
                          {occurrence.task.estimatedMinutes && (
                            <span>⏱️ {occurrence.task.estimatedMinutes}min</span>
                          )}
                          {occurrence.task.context && (
                            <span>📍 {occurrence.task.context}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {occurrence.canComplete && (
                      <button
                        onClick={() => handleCompleteTask(
                          occurrence.task,
                          new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay.date)
                        )}
                        className={`p-2 rounded-md ${
                          occurrence.isCompleted
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={occurrence.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      >
                        {occurrence.isCompleted ? <XMarkIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {occurrence.task.description && (
                    <p className="text-sm mt-2 opacity-75">{occurrence.task.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-lg shadow text-center py-12">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recurring Tasks</h3>
          <p className="text-gray-600">Create your first recurring task to see it on the calendar</p>
        </div>
      )}
    </div>
  );
}