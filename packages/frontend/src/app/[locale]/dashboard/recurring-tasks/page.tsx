'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
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
  maxExecutions?: number; // Maksymalna liczba wykonań
  remainingExecutions?: number; // Pozostałe wykonania
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
  createdAt: string;
  updatedAt: string;
}

export default function RecurringTasksPage() {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | undefined>();
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
    interval: number;
    daysOfWeek: number[];
    dayOfMonth: number;
    weekOfMonth: number;
    months: number[];
    time: string;
    context: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedMinutes: number;
    assignedTo: string;
    stream: string;
    company: string;
    project: string;
    workdaysOnly: boolean;
    holidayHandling: 'SKIP' | 'NEXT_WORKDAY' | 'PREV_WORKDAY' | 'EXECUTE_ANYWAY';
    maxExecutions: number;
    limitExecutions: boolean;
  }>({
    title: '',
    description: '',
    frequency: 'DAILY',
    interval: 1,
    daysOfWeek: [1], // Monday
    dayOfMonth: 1,
    weekOfMonth: 1,
    months: [1],
    time: '09:00',
    context: '',
    priority: 'MEDIUM',
    estimatedMinutes: 30,
    assignedTo: '',
    stream: '',
    company: '',
    project: '',
    workdaysOnly: false,
    holidayHandling: 'NEXT_WORKDAY',
    maxExecutions: 0, // 0 = nieskończone
    limitExecutions: false
  });

  // Stream data
  const [streams, setStreams] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    // Fetch real streams from API
    const fetchStreams = async () => {
      try {
        const res = await fetch('/api/v1/streams', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data.streams || [];
          setStreams(list.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (e) {
        console.error('Error loading streams:', e);
      }
    };
    fetchStreams();
  }, []);

  // Sample data for dropdowns
  const [users] = useState([
    { id: '1', name: 'Anna Kowalska' },
    { id: '2', name: 'Piotr Nowak' },
    { id: '3', name: 'Katarzyna Wójcik' },
    { id: '4', name: 'Tomasz Krawczyk' },
    { id: '5', name: 'Michał Kowalski' }
  ]);

  const [companies] = useState([
    { id: '1', name: 'Tech Solutions Sp. z o.o.' },
    { id: '2', name: 'Digital Marketing Group' },
    { id: '3', name: 'Innovative Systems Ltd' },
    { id: '4', name: 'Consulting Pro' },
    { id: '5', name: 'Software House' }
  ]);

  const [projects] = useState([
    { id: '1', name: 'CRM Integration Project' },
    { id: '2', name: 'System Enhancement' },
    { id: '3', name: 'Smart Mailboxes Development' },
    { id: '4', name: 'Mobile App Development' },
    { id: '5', name: 'AI Analytics Platform' }
  ]);

  // Mock data for demo
  useEffect(() => {
    const mockTasks: RecurringTask[] = [
      {
        id: '1',
        title: 'Spotkania zespołu (Pon, Śr, Pt)',
        description: 'Spotkania zespołu w poniedziałki, środy i piątki',
        frequency: 'WEEKLY',
        pattern: '0 9 * * 1,3,5',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Poniedziałek, Środa, Piątek
        dayOfMonth: 1,
        weekOfMonth: 1,
        months: [1],
        time: '09:00',
        nextOccurrence: new Date(Date.now() + 86400000).toISOString(),
        lastExecuted: undefined,
        executionCount: 12,
        maxExecutions: 50, // Ograniczone do 50 spotkań
        remainingExecutions: 38, // Pozostałe 38
        context: '@office',
        priority: 'HIGH',
        estimatedMinutes: 60,
        isActive: true,
        assignedTo: {
          firstName: 'Anna',
          lastName: 'Kowalska'
        },
        company: {
          name: 'Tech Solutions'
        },
        project: {
          name: 'CRM Development'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Co 2 poniedziałki - newsletter',
        description: 'Wysyłanie newslettera co drugi poniedziałek',
        frequency: 'BIWEEKLY',
        pattern: '0 10 * * 1',
        interval: 2,
        daysOfWeek: [1], // Tylko poniedziałki
        dayOfMonth: 1,
        weekOfMonth: 1,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        time: '10:00',
        nextOccurrence: new Date(Date.now() + 7 * 86400000).toISOString(),
        lastExecuted: undefined,
        executionCount: 6,
        maxExecutions: 20, // Tylko 20 newsletterów
        remainingExecutions: 14, // Zostało 14
        context: '@computer',
        priority: 'MEDIUM',
        estimatedMinutes: 45,
        isActive: true,
        assignedTo: {
          firstName: 'Piotr',
          lastName: 'Nowak'
        },
        company: undefined,
        project: {
          name: 'Marketing Campaign'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Backup tylko dni robocze',
        description: 'Backup systemu w dni robocze (Pon-Pt)',
        frequency: 'WEEKLY',
        pattern: '0 2 * * 1,2,3,4,5',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5], // Poniedziałek-Piątek
        dayOfMonth: undefined,
        weekOfMonth: undefined,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        time: '02:00',
        nextOccurrence: new Date(Date.now() + 3600000).toISOString(),
        lastExecuted: new Date(Date.now() - 86400000).toISOString(),
        executionCount: 45,
        maxExecutions: undefined, // Nieskończone
        remainingExecutions: undefined,
        context: '@automated',
        priority: 'LOW',
        estimatedMinutes: 15,
        isActive: true,
        assignedTo: undefined,
        company: undefined,
        project: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    setTimeout(() => {
      setTasks(mockTasks);
      setIsLoading(false);
    }, 500);
  }, []);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return 'bg-blue-100 text-blue-700';
      case 'WEEKLY': return 'bg-green-100 text-green-700';
      case 'BIWEEKLY': return 'bg-green-200 text-green-800';
      case 'MONTHLY': return 'bg-purple-100 text-purple-700';
      case 'BIMONTHLY': return 'bg-purple-200 text-purple-800';
      case 'QUARTERLY': return 'bg-orange-100 text-orange-700';
      case 'YEARLY': return 'bg-red-100 text-red-700';
      case 'CUSTOM': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNextOccurrence = (date?: string) => {
    if (!date) return 'Nie zaplanowane';
    const occurrence = new Date(date);
    const now = new Date();
    const diff = occurrence.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Spóźnione';
    if (days === 0) return 'Dzisiaj';
    if (days === 1) return 'Jutro';
    return `Za ${days} dni`;
  };

  const handleToggleActive = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, isActive: !task.isActive } : task
    ));
    toast.success('Status zadania został zaktualizowany');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie cykliczne?')) return;
    setTasks(prev => prev.filter(task => task.id !== id));
    toast.success('Zadanie cykliczne zostało usunięte');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'DAILY',
      interval: 1,
      daysOfWeek: [1],
      dayOfMonth: 1,
      weekOfMonth: 1,
      months: [1],
      time: '09:00',
      context: '',
      priority: 'MEDIUM',
      estimatedMinutes: 30,
      assignedTo: '',
      stream: '',
      company: '',
      project: '',
      workdaysOnly: false,
      holidayHandling: 'NEXT_WORKDAY',
      maxExecutions: 10,
      limitExecutions: false
    });
    setEditingTask(undefined);
  };

  const generateCronPattern = () => {
    const [hour, minute] = formData.time.split(':');
    switch (formData.frequency) {
      case 'DAILY':
        if (formData.workdaysOnly) {
          return `${minute} ${hour} * * 1-5`; // Tylko dni robocze
        }
        return `${minute} ${hour} * * *`;
      case 'WEEKLY':
        return `${minute} ${hour} * * ${formData.daysOfWeek.length > 0 ? formData.daysOfWeek.join(',') : '1'}`;
      case 'BIWEEKLY':
        return `${minute} ${hour} * * ${formData.daysOfWeek.length > 0 ? formData.daysOfWeek.join(',') : '1'}`;
      case 'MONTHLY':
        return `${minute} ${hour} ${formData.dayOfMonth} * *`;
      case 'BIMONTHLY':
        return `${minute} ${hour} ${formData.dayOfMonth} */2 *`;
      case 'QUARTERLY':
        return `${minute} ${hour} ${formData.dayOfMonth} */3 *`;
      case 'YEARLY':
        return `${minute} ${hour} ${formData.dayOfMonth} ${formData.months.length > 0 ? formData.months.join(',') : '1'} *`;
      case 'CUSTOM':
        return `${minute} ${hour} * * *`;
      default:
        return `${minute} ${hour} * * *`;
    }
  };

  const isWorkday = (date: Date): boolean => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  };

  const isPolishHoliday = (date: Date): boolean => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Fixed Polish holidays
    const fixedHolidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 1, day: 6 },   // Epiphany
      { month: 5, day: 1 },   // Labour Day
      { month: 5, day: 3 },   // Constitution Day
      { month: 8, day: 15 },  // Assumption of Mary
      { month: 11, day: 1 },  // All Saints' Day
      { month: 11, day: 11 }, // Independence Day
      { month: 12, day: 25 }, // Christmas Day
      { month: 12, day: 26 }  // Boxing Day
    ];

    return fixedHolidays.some(holiday => holiday.month === month && holiday.day === day);
  };

  const adjustForWorkdaysAndHolidays = (date: Date): Date => {
    if (!formData.workdaysOnly && formData.holidayHandling === 'EXECUTE_ANYWAY') {
      return date;
    }

    if (formData.workdaysOnly && !isWorkday(date)) {
      // If it's not a workday, move to next Monday
      const daysToAdd = (8 - date.getDay()) % 7 || 7;
      date.setDate(date.getDate() + daysToAdd);
    }

    if (isPolishHoliday(date) && formData.holidayHandling !== 'EXECUTE_ANYWAY') {
      if (formData.holidayHandling === 'NEXT_WORKDAY') {
        do {
          date.setDate(date.getDate() + 1);
        } while (!isWorkday(date) || isPolishHoliday(date));
      } else if (formData.holidayHandling === 'PREV_WORKDAY') {
        do {
          date.setDate(date.getDate() - 1);
        } while (!isWorkday(date) || isPolishHoliday(date));
      }
      // SKIP means don't execute at all - handled elsewhere
    }

    return date;
  };

  const calculateNextOccurrence = () => {
    const now = new Date();
    const [hour, minute] = formData.time.split(':').map(Number);
    
    switch (formData.frequency) {
      case 'DAILY': {
        const next = new Date(now);
        next.setHours(hour, minute, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + formData.interval);
        }
        return adjustForWorkdaysAndHolidays(next).toISOString();
      }
      case 'WEEKLY':
      case 'BIWEEKLY': {
        const next = new Date(now);
        const targetDay = formData.daysOfWeek[0] || 1;
        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        const intervalWeeks = formData.frequency === 'BIWEEKLY' ? 2 : 1;
        next.setDate(next.getDate() + (daysUntilTarget || 7 * intervalWeeks));
        next.setHours(hour, minute, 0, 0);
        return adjustForWorkdaysAndHolidays(next).toISOString();
      }
      case 'MONTHLY':
      case 'BIMONTHLY': {
        const next = new Date(now);
        next.setDate(formData.dayOfMonth);
        next.setHours(hour, minute, 0, 0);
        if (next <= now) {
          const monthsToAdd = formData.frequency === 'BIMONTHLY' ? 2 : 1;
          next.setMonth(next.getMonth() + monthsToAdd);
        }
        return adjustForWorkdaysAndHolidays(next).toISOString();
      }
      case 'QUARTERLY': {
        const next = new Date(now);
        next.setDate(formData.dayOfMonth);
        next.setHours(hour, minute, 0, 0);
        if (next <= now) {
          next.setMonth(next.getMonth() + 3);
        }
        return adjustForWorkdaysAndHolidays(next).toISOString();
      }
      case 'YEARLY': {
        const next = new Date(now);
        next.setMonth(formData.months[0] - 1 || 0);
        next.setDate(formData.dayOfMonth);
        next.setHours(hour, minute, 0, 0);
        if (next <= now) {
          next.setFullYear(next.getFullYear() + 1);
        }
        return adjustForWorkdaysAndHolidays(next).toISOString();
      }
      default:
        return new Date(now.getTime() + 86400000).toISOString();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Tytuł zadania jest wymagany');
      return;
    }

    const newTask: RecurringTask = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description || undefined,
      frequency: formData.frequency,
      pattern: generateCronPattern(),
      interval: formData.interval,
      daysOfWeek: formData.daysOfWeek,
      dayOfMonth: formData.dayOfMonth,
      weekOfMonth: formData.weekOfMonth,
      months: formData.months,
      time: formData.time,
      nextOccurrence: calculateNextOccurrence(),
      lastExecuted: editingTask?.lastExecuted,
      executionCount: editingTask?.executionCount || 0,
      maxExecutions: formData.limitExecutions ? formData.maxExecutions : undefined,
      remainingExecutions: formData.limitExecutions ? (formData.maxExecutions - (editingTask?.executionCount || 0)) : undefined,
      context: formData.context || undefined,
      priority: formData.priority,
      estimatedMinutes: formData.estimatedMinutes || undefined,
      isActive: true,
      assignedTo: formData.assignedTo ? {
        firstName: users.find(u => u.id === formData.assignedTo)?.name.split(' ')[0] || '',
        lastName: users.find(u => u.id === formData.assignedTo)?.name.split(' ')[1] || ''
      } : undefined,
      company: formData.company ? { name: companies.find(c => c.id === formData.company)?.name || '' } : undefined,
      project: formData.project ? { name: projects.find(p => p.id === formData.project)?.name || '' } : undefined,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingTask) {
      setTasks(prev => prev.map(task => task.id === editingTask.id ? newTask : task));
      toast.success('Zadanie cykliczne zostało zaktualizowane');
    } else {
      setTasks(prev => [...prev, newTask]);
      toast.success('Zadanie cykliczne zostało utworzone');
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleEdit = (task: RecurringTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      frequency: task.frequency,
      interval: task.interval || 1,
      daysOfWeek: task.daysOfWeek || [1],
      dayOfMonth: task.dayOfMonth || 1,
      weekOfMonth: task.weekOfMonth || 1,
      months: task.months || [1],
      time: task.time || '09:00',
      context: task.context || '',
      priority: task.priority || 'MEDIUM',
      estimatedMinutes: task.estimatedMinutes || 30,
      assignedTo: task.assignedTo ? users.find(u => u.name === `${task.assignedTo!.firstName} ${task.assignedTo!.lastName}`)?.id || '' : '',
      stream: '',
      company: task.company ? companies.find(c => c.name === task.company!.name)?.id || '' : '',
      project: task.project ? projects.find(p => p.name === task.project!.name)?.id || '' : '',
      workdaysOnly: false,
      holidayHandling: 'NEXT_WORKDAY',
      maxExecutions: task.maxExecutions || 10,
      limitExecutions: task.maxExecutions ? true : false
    });
    setIsFormOpen(true);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Zadania Cykliczne</h1>
          <p className="text-gray-600">Automatyzuj powtarzające się zadania z harmonogramami</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = '/dashboard/recurring-tasks/calendar'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Widok Kalendarza
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Utwórz Zadanie Cykliczne
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łączna Liczba</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktywne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(t => t.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 text-yellow-600">📅</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dzisiaj</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(t => formatNextOccurrence(t.nextOccurrence) === 'Dzisiaj').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 text-purple-600">🎯</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Z Limitem</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(t => t.maxExecutions).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak Zadań Cyklicznych</h3>
          <p className="text-gray-600 mb-6">
            Utwórz szablony zadań, które automatycznie generują nowe zadania według harmonogramu.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Utwórz Pierwszy Szablon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      {task.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}>
                        {task.frequency}
                      </span>
                      {task.context && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {task.context}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {task.estimatedMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => handleEdit(task)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleToggleActive(task.id)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          task.isActive ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {task.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                )}

                {(task.assignedTo || task.company || task.project) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Przypisania:</div>
                    <div className="space-y-1">
                      {task.assignedTo && (
                        <div className="text-sm text-gray-700">👤 {task.assignedTo.firstName} {task.assignedTo.lastName}</div>
                      )}
                      {task.company && (
                        <div className="text-sm text-gray-700">🏢 {task.company.name}</div>
                      )}
                      {task.project && (
                        <div className="text-sm text-gray-700">📁 {task.project.name}</div>
                      )}
                    </div>
                  </div>
                )}

                {task.maxExecutions && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">Postęp wykonań:</span>
                      <span className="text-blue-900">
                        {task.executionCount} / {task.maxExecutions}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((task.executionCount / task.maxExecutions) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {task.remainingExecutions && task.remainingExecutions > 0 
                        ? `Pozostało ${task.remainingExecutions} wykonań`
                        : task.executionCount >= task.maxExecutions 
                          ? 'Zadanie ukończone - osiągnięto limit'
                          : 'Trwa realizacja'}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Następne wystąpienie:</span>
                    <span className={`font-medium ${
                      formatNextOccurrence(task.nextOccurrence) === 'Dzisiaj' ? 'text-green-600' :
                      formatNextOccurrence(task.nextOccurrence) === 'Spóźnione' ? 'text-red-600' :
                      'text-gray-900'
                    }`}>
                      {formatNextOccurrence(task.nextOccurrence)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.isActive ? 'Aktywne' : 'Nieaktywne'}
                    </span>
                  </div>

                  {task.pattern && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Wzorzec:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{task.pattern}</code>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => handleToggleActive(task.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      task.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {task.isActive ? (
                      <>
                        <PauseIcon className="w-4 h-4" />
                        <span>Wstrzymaj</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        <span>Aktywuj</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTask ? 'Edytuj Zadanie Cykliczne' : 'Utwórz Zaawansowane Zadanie Cykliczne'}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tytuł Zadania *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="np. Cotygodniowe spotkanie zespołu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Opcjonalny opis..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Częstotliwość
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="DAILY">Codziennie</option>
                      <option value="WEEKLY">Co tydzień</option>
                      <option value="BIWEEKLY">Co dwa tygodnie</option>
                      <option value="MONTHLY">Co miesiąc</option>
                      <option value="BIMONTHLY">Co dwa miesiące</option>
                      <option value="QUARTERLY">Co kwartał</option>
                      <option value="YEARLY">Co rok</option>
                      <option value="CUSTOM">Niestandardowe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interwał
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.interval}
                      onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Godzina
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Szacowany Czas (minuty)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={formData.estimatedMinutes}
                      onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                {(formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dni Tygodnia (wybierz wiele)
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Nie', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'].map((day, index) => (
                        <label key={index} className="flex items-center justify-center p-2 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.daysOfWeek.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, daysOfWeek: [...formData.daysOfWeek, index].sort() });
                              } else {
                                setFormData({ ...formData, daysOfWeek: formData.daysOfWeek.filter(d => d !== index) });
                              }
                            }}
                            className="mr-1"
                          />
                          <span className="text-xs font-medium">{day}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.daysOfWeek.length === 0 ? 'Wybierz przynajmniej jeden dzień' : 
                       `Wybrano: ${formData.daysOfWeek.map(d => ['Nie', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'][d]).join(', ')}`}
                    </p>
                  </div>
                )}

                {(formData.frequency === 'MONTHLY' || formData.frequency === 'BIMONTHLY' || formData.frequency === 'QUARTERLY' || formData.frequency === 'YEARLY') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dzień Miesiąca
                      </label>
                      <select
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    {formData.frequency === 'MONTHLY' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tydzień Miesiąca
                        </label>
                        <select
                          value={formData.weekOfMonth}
                          onChange={(e) => setFormData({ ...formData, weekOfMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value={1}>Pierwszy</option>
                          <option value={2}>Drugi</option>
                          <option value={3}>Trzeci</option>
                          <option value={4}>Czwarty</option>
                          <option value={-1}>Ostatni</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {formData.frequency === 'YEARLY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Miesiące (wybierz wiele)
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'].map((month, index) => (
                        <label key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.months.includes(index + 1)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, months: [...formData.months, index + 1].sort() });
                              } else {
                                setFormData({ ...formData, months: formData.months.filter(m => m !== index + 1) });
                              }
                            }}
                            className="mr-1"
                          />
                          <span className="text-xs">{month}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kontekst
                    </label>
                    <select
                      value={formData.context}
                      onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Brak kontekstu</option>
                      <option value="@computer">@komputer</option>
                      <option value="@calls">@rozmowy</option>
                      <option value="@office">@biuro</option>
                      <option value="@home">@dom</option>
                      <option value="@errands">@sprawy</option>
                      <option value="@online">@online</option>
                      <option value="@waiting">@oczekiwanie</option>
                      <option value="@reading">@czytanie</option>
                      <option value="@automated">@automatyczne</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Przypisane Do
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wybierz użytkownika</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strumień docelowy
                    </label>
                    <select
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wybierz strumień</option>
                      {streams.map(stream => (
                        <option key={stream.id} value={stream.id}>{stream.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firma
                    </label>
                    <select
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wybierz firmę</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projekt
                    </label>
                    <select
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wybierz projekt</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pola dni roboczych i ograniczeń */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.workdaysOnly}
                        onChange={(e) => setFormData({ ...formData, workdaysOnly: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Tylko dni robocze (Pon-Pt)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Zadanie będzie wykonywane tylko w dni robocze
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obsługa Świąt
                    </label>
                    <select
                      value={formData.holidayHandling}
                      onChange={(e) => setFormData({ ...formData, holidayHandling: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="SKIP">Pomiń święto</option>
                      <option value="NEXT_WORKDAY">Następny dzień roboczy</option>
                      <option value="PREV_WORKDAY">Poprzedni dzień roboczy</option>
                      <option value="EXECUTE_ANYWAY">Wykonaj mimo wszystko</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Co robić gdy termin wypada w święto
                    </p>
                  </div>
                </div>

                {/* Ograniczenie liczby wykonań */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.limitExecutions}
                        onChange={(e) => setFormData({ ...formData, limitExecutions: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Ograniczona liczba wykonań</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Zadanie zakończy się automatycznie po określonej liczbie wykonań
                    </p>
                  </div>

                  {formData.limitExecutions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maksymalna liczba wykonań
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="9999"
                        value={formData.maxExecutions}
                        onChange={(e) => setFormData({ ...formData, maxExecutions: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="np. 10, 20, 50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Po {formData.maxExecutions} wykonaniach zadanie zostanie automatycznie dezaktywowane
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Podgląd:</strong> To zadanie będzie wykonywane {
                      formData.frequency === 'DAILY' ? 'codziennie' :
                      formData.frequency === 'WEEKLY' ? 'co tydzień' :
                      formData.frequency === 'BIWEEKLY' ? 'co dwa tygodnie' :
                      formData.frequency === 'MONTHLY' ? 'co miesiąc' :
                      formData.frequency === 'BIMONTHLY' ? 'co dwa miesiące' :
                      formData.frequency === 'QUARTERLY' ? 'co kwartał' :
                      formData.frequency === 'YEARLY' ? 'co rok' :
                      formData.frequency.toLowerCase()
                    }
                    {(formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY') && formData.daysOfWeek.length > 0 && 
                      ` w dni: ${formData.daysOfWeek.map(d => ['Nie', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'][d]).join(', ')}`}
                    {(formData.frequency === 'MONTHLY' || formData.frequency === 'BIMONTHLY' || formData.frequency === 'QUARTERLY' || formData.frequency === 'YEARLY') && 
                      ` ${formData.dayOfMonth}. dnia miesiąca`}
                    {formData.frequency === 'YEARLY' && formData.months.length > 0 && 
                      ` w miesiącach: ${formData.months.map(m => ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'][m-1]).join(', ')}`}
                    {' '}o godzinie {formData.time}
                    {formData.estimatedMinutes && ` (${formData.estimatedMinutes} min)`}
                    {formData.context && ` w kontekście ${formData.context}`}
                    {formData.workdaysOnly ? ' (tylko dni robocze)' : ''}
                    {formData.limitExecutions ? ` - maksymalnie ${formData.maxExecutions} razy` : ' (nieskończenie)'}
                    .
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Wzorzec Cron: <code>{generateCronPattern()}</code>
                    {formData.holidayHandling !== 'EXECUTE_ANYWAY' && (
                      <span className="ml-2">
                        • Święta: {
                          formData.holidayHandling === 'SKIP' ? 'Pomiń' :
                          formData.holidayHandling === 'NEXT_WORKDAY' ? 'Przenieś na następny dzień roboczy' :
                          formData.holidayHandling === 'PREV_WORKDAY' ? 'Przenieś na poprzedni dzień roboczy' :
                          'Wykonaj mimo wszystko'
                        }
                      </span>
                    )}
                    {formData.limitExecutions && (
                      <span className="ml-2">
                        • Limit: {formData.maxExecutions} wykonań
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  {editingTask ? 'Zaktualizuj Zadanie' : 'Utwórz Zadanie'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}