'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Clock,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  CalendarDays,
  Target,
  X,
  User,
  Building2,
  FolderOpen,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
  maxExecutions?: number;
  remainingExecutions?: number;
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
    maxExecutions: 0,
    limitExecutions: false
  });

  // Stream data
  const [streams, setStreams] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
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

  const [users] = useState([
    { id: '1', name: 'Anna Kowalska' },
    { id: '2', name: 'Piotr Nowak' },
    { id: '3', name: 'Katarzyna Wojcik' },
    { id: '4', name: 'Tomasz Krawczyk' },
    { id: '5', name: 'Michal Kowalski' }
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

  useEffect(() => {
    const mockTasks: RecurringTask[] = [
      {
        id: '1',
        title: 'Spotkania zespolu (Pon, Sr, Pt)',
        description: 'Spotkania zespolu w poniedzialki, srody i piatki',
        frequency: 'WEEKLY',
        pattern: '0 9 * * 1,3,5',
        interval: 1,
        daysOfWeek: [1, 3, 5],
        dayOfMonth: 1,
        weekOfMonth: 1,
        months: [1],
        time: '09:00',
        nextOccurrence: new Date(Date.now() + 86400000).toISOString(),
        lastExecuted: undefined,
        executionCount: 12,
        maxExecutions: 50,
        remainingExecutions: 38,
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
        title: 'Co 2 poniedzialki - newsletter',
        description: 'Wysylanie newslettera co drugi poniedzialek',
        frequency: 'BIWEEKLY',
        pattern: '0 10 * * 1',
        interval: 2,
        daysOfWeek: [1],
        dayOfMonth: 1,
        weekOfMonth: 1,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        time: '10:00',
        nextOccurrence: new Date(Date.now() + 7 * 86400000).toISOString(),
        lastExecuted: undefined,
        executionCount: 6,
        maxExecutions: 20,
        remainingExecutions: 14,
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
        daysOfWeek: [1, 2, 3, 4, 5],
        dayOfMonth: undefined,
        weekOfMonth: undefined,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        time: '02:00',
        nextOccurrence: new Date(Date.now() + 3600000).toISOString(),
        lastExecuted: new Date(Date.now() - 86400000).toISOString(),
        executionCount: 45,
        maxExecutions: undefined,
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
      case 'DAILY': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'WEEKLY': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'BIWEEKLY': return 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'MONTHLY': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'BIMONTHLY': return 'bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'QUARTERLY': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'YEARLY': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'CUSTOM': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const formatNextOccurrence = (date?: string) => {
    if (!date) return 'Nie zaplanowane';
    const occurrence = new Date(date);
    const now = new Date();
    const diff = occurrence.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Spoznione';
    if (days === 0) return 'Dzisiaj';
    if (days === 1) return 'Jutro';
    return `Za ${days} dni`;
  };

  const handleToggleActive = (id: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, isActive: !task.isActive } : task
    ));
    toast.success('Status zadania zostal zaktualizowany');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac to zadanie cykliczne?')) return;
    setTasks(prev => prev.filter(task => task.id !== id));
    toast.success('Zadanie cykliczne zostalo usuniete');
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
          return `${minute} ${hour} * * 1-5`;
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
    return day >= 1 && day <= 5;
  };

  const isPolishHoliday = (date: Date): boolean => {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const fixedHolidays = [
      { month: 1, day: 1 },
      { month: 1, day: 6 },
      { month: 5, day: 1 },
      { month: 5, day: 3 },
      { month: 8, day: 15 },
      { month: 11, day: 1 },
      { month: 11, day: 11 },
      { month: 12, day: 25 },
      { month: 12, day: 26 }
    ];

    return fixedHolidays.some(holiday => holiday.month === month && holiday.day === day);
  };

  const adjustForWorkdaysAndHolidays = (date: Date): Date => {
    if (!formData.workdaysOnly && formData.holidayHandling === 'EXECUTE_ANYWAY') {
      return date;
    }

    if (formData.workdaysOnly && !isWorkday(date)) {
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
      toast.error('Tytul zadania jest wymagany');
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
      toast.success('Zadanie cykliczne zostalo zaktualizowane');
    } else {
      setTasks(prev => [...prev, newTask]);
      toast.success('Zadanie cykliczne zostalo utworzone');
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
    <PageShell>
      <PageHeader
        title="Zadania Cykliczne"
        subtitle="Automatyzuj powtarzajace sie zadania z harmonogramami"
        icon={RefreshCw}
        iconColor="text-purple-600"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/dashboard/recurring-tasks/calendar'}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center text-slate-700 dark:text-slate-300 transition-colors"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Widok Kalendarza
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Utworz Zadanie Cykliczne
            </button>
          </div>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Laczna Liczba</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aktywne</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {tasks.filter(t => t.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <CalendarDays className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Dzisiaj</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {tasks.filter(t => formatNextOccurrence(t.nextOccurrence) === 'Dzisiaj').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Z Limitem</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {tasks.filter(t => t.maxExecutions).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak Zadan Cyklicznych</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Utworz szablony zadan, ktore automatycznie generuja nowe zadania wedlug harmonogramu.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 inline-flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Utworz Pierwszy Szablon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
                      {task.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
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
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {task.context}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {task.estimatedMinutes}min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => handleEdit(task)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleToggleActive(task.id)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 ${
                          task.isActive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {task.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                      >
                        Usun
                      </button>
                    </div>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{task.description}</p>
                )}

                {(task.assignedTo || task.company || task.project) && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Przypisania:</div>
                    <div className="space-y-1">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </div>
                      )}
                      {task.company && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {task.company.name}
                        </div>
                      )}
                      {task.project && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                          {task.project.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {task.maxExecutions && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">Postep wykonan:</span>
                      <span className="text-blue-900 dark:text-blue-300">
                        {task.executionCount} / {task.maxExecutions}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800/40 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((task.executionCount / task.maxExecutions) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {task.remainingExecutions && task.remainingExecutions > 0
                        ? `Pozostalo ${task.remainingExecutions} wykonan`
                        : task.executionCount >= task.maxExecutions
                          ? 'Zadanie ukonczone - osiagnieto limit'
                          : 'Trwa realizacja'}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Nastepne wystapienie:</span>
                    <span className={`font-medium ${
                      formatNextOccurrence(task.nextOccurrence) === 'Dzisiaj' ? 'text-green-600 dark:text-green-400' :
                      formatNextOccurrence(task.nextOccurrence) === 'Spoznione' ? 'text-red-600 dark:text-red-400' :
                      'text-slate-900 dark:text-slate-100'
                    }`}>
                      {formatNextOccurrence(task.nextOccurrence)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {task.isActive ? 'Aktywne' : 'Nieaktywne'}
                    </span>
                  </div>

                  {task.pattern && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Wzorzec:</span>
                      <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">{task.pattern}</code>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => handleToggleActive(task.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      task.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {task.isActive ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Wstrzymaj</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white/95 backdrop-blur-xl dark:bg-slate-800/95 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingTask ? 'Edytuj Zadanie Cykliczne' : 'Utworz Zaawansowane Zadanie Cykliczne'}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tytul Zadania *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="np. Cotygodniowe spotkanie zespolu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Opis
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Opcjonalny opis..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Czestotliwosc
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="DAILY">Codziennie</option>
                      <option value="WEEKLY">Co tydzien</option>
                      <option value="BIWEEKLY">Co dwa tygodnie</option>
                      <option value="MONTHLY">Co miesiac</option>
                      <option value="BIMONTHLY">Co dwa miesiace</option>
                      <option value="QUARTERLY">Co kwartal</option>
                      <option value="YEARLY">Co rok</option>
                      <option value="CUSTOM">Niestandardowe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Interwal
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.interval}
                      onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Godzina
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Szacowany Czas (minuty)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={formData.estimatedMinutes}
                      onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                      placeholder="30"
                    />
                  </div>
                </div>

                {(formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dni Tygodnia (wybierz wiele)
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Nie', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob'].map((day, index) => (
                        <label key={index} className="flex items-center justify-center p-2 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
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
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{day}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.daysOfWeek.length === 0 ? 'Wybierz przynajmniej jeden dzien' :
                       `Wybrano: ${formData.daysOfWeek.map(d => ['Nie', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob'][d]).join(', ')}`}
                    </p>
                  </div>
                )}

                {(formData.frequency === 'MONTHLY' || formData.frequency === 'BIMONTHLY' || formData.frequency === 'QUARTERLY' || formData.frequency === 'YEARLY') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Dzien Miesiaca
                      </label>
                      <select
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    {formData.frequency === 'MONTHLY' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tydzien Miesiaca
                        </label>
                        <select
                          value={formData.weekOfMonth}
                          onChange={(e) => setFormData({ ...formData, weekOfMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Miesiace (wybierz wiele)
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paz', 'Lis', 'Gru'].map((month, index) => (
                        <label key={index} className="flex items-center cursor-pointer">
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
                          <span className="text-xs text-slate-700 dark:text-slate-300">{month}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Kontekst
                    </label>
                    <select
                      value={formData.context}
                      onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Sredni</option>
                      <option value="HIGH">Wysoki</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Przypisane Do
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Wybierz uzytkownika</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Strumien docelowy
                    </label>
                    <select
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Wybierz strumien</option>
                      {streams.map(stream => (
                        <option key={stream.id} value={stream.id}>{stream.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Firma
                    </label>
                    <select
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Wybierz firme</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Projekt
                    </label>
                    <select
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Wybierz projekt</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Workday and holiday fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.workdaysOnly}
                        onChange={(e) => setFormData({ ...formData, workdaysOnly: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tylko dni robocze (Pon-Pt)</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Zadanie bedzie wykonywane tylko w dni robocze
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Obsluga Swiat
                    </label>
                    <select
                      value={formData.holidayHandling}
                      onChange={(e) => setFormData({ ...formData, holidayHandling: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    >
                      <option value="SKIP">Pomin swieto</option>
                      <option value="NEXT_WORKDAY">Nastepny dzien roboczy</option>
                      <option value="PREV_WORKDAY">Poprzedni dzien roboczy</option>
                      <option value="EXECUTE_ANYWAY">Wykonaj mimo wszystko</option>
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Co robic gdy termin wypada w swieto
                    </p>
                  </div>
                </div>

                {/* Execution limit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.limitExecutions}
                        onChange={(e) => setFormData({ ...formData, limitExecutions: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ograniczona liczba wykonan</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Zadanie zakonczy sie automatycznie po okreslonej liczbie wykonan
                    </p>
                  </div>

                  {formData.limitExecutions && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Maksymalna liczba wykonan
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="9999"
                        value={formData.maxExecutions}
                        onChange={(e) => setFormData({ ...formData, maxExecutions: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                        placeholder="np. 10, 20, 50"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Po {formData.maxExecutions} wykonaniach zadanie zostanie automatycznie dezaktywowane
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong>Podglad:</strong> To zadanie bedzie wykonywane {
                      formData.frequency === 'DAILY' ? 'codziennie' :
                      formData.frequency === 'WEEKLY' ? 'co tydzien' :
                      formData.frequency === 'BIWEEKLY' ? 'co dwa tygodnie' :
                      formData.frequency === 'MONTHLY' ? 'co miesiac' :
                      formData.frequency === 'BIMONTHLY' ? 'co dwa miesiace' :
                      formData.frequency === 'QUARTERLY' ? 'co kwartal' :
                      formData.frequency === 'YEARLY' ? 'co rok' :
                      formData.frequency.toLowerCase()
                    }
                    {(formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY') && formData.daysOfWeek.length > 0 &&
                      ` w dni: ${formData.daysOfWeek.map(d => ['Nie', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob'][d]).join(', ')}`}
                    {(formData.frequency === 'MONTHLY' || formData.frequency === 'BIMONTHLY' || formData.frequency === 'QUARTERLY' || formData.frequency === 'YEARLY') &&
                      ` ${formData.dayOfMonth}. dnia miesiaca`}
                    {formData.frequency === 'YEARLY' && formData.months.length > 0 &&
                      ` w miesiacach: ${formData.months.map(m => ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paz', 'Lis', 'Gru'][m-1]).join(', ')}`}
                    {' '}o godzinie {formData.time}
                    {formData.estimatedMinutes && ` (${formData.estimatedMinutes} min)`}
                    {formData.context && ` w kontekscie ${formData.context}`}
                    {formData.workdaysOnly ? ' (tylko dni robocze)' : ''}
                    {formData.limitExecutions ? ` - maksymalnie ${formData.maxExecutions} razy` : ' (nieskonczone)'}
                    .
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Wzorzec Cron: <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">{generateCronPattern()}</code>
                    {formData.holidayHandling !== 'EXECUTE_ANYWAY' && (
                      <span className="ml-2">
                        Swieta: {
                          formData.holidayHandling === 'SKIP' ? 'Pomin' :
                          formData.holidayHandling === 'NEXT_WORKDAY' ? 'Przeniez na nastepny dzien roboczy' :
                          formData.holidayHandling === 'PREV_WORKDAY' ? 'Przeniez na poprzedni dzien roboczy' :
                          'Wykonaj mimo wszystko'
                        }
                      </span>
                    )}
                    {formData.limitExecutions && (
                      <span className="ml-2">
                        Limit: {formData.maxExecutions} wykonan
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
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
                >
                  {editingTask ? 'Zaktualizuj Zadanie' : 'Utworz Zadanie'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PageShell>
  );
}
