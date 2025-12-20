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
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  pattern?: string;
  nextOccurrence?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RecurringTasksPage() {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | undefined>();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    time: '09:00',
    dayOfWeek: '1', // Monday
    dayOfMonth: '1'
  });

  // Mock data for demo
  useEffect(() => {
    const mockTasks: RecurringTask[] = [
      {
        id: '1',
        title: 'Weekly Team Meeting',
        description: 'Regular team sync every Monday',
        frequency: 'WEEKLY',
        pattern: '0 9 * * 1',
        nextOccurrence: new Date(Date.now() + 86400000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Monthly Report Generation',
        description: 'Generate monthly performance reports',
        frequency: 'MONTHLY',
        pattern: '0 10 1 * *',
        nextOccurrence: new Date(Date.now() + 7 * 86400000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Daily Backup Process',
        description: 'Automated database backup',
        frequency: 'DAILY',
        pattern: '0 2 * * *',
        nextOccurrence: new Date(Date.now() + 3600000).toISOString(),
        isActive: false,
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
      case 'MONTHLY': return 'bg-purple-100 text-purple-700';
      case 'QUARTERLY': return 'bg-orange-100 text-orange-700';
      case 'YEARLY': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatNextOccurrence = (date?: string) => {
    if (!date) return 'Not scheduled';
    const occurrence = new Date(date);
    const now = new Date();
    const diff = occurrence.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const handleToggleActive = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, isActive: !task.isActive } : task
    ));
    toast.success('Task status updated');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring task?')) return;
    setTasks(prev => prev.filter(task => task.id !== id));
    toast.success('Recurring task deleted');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'DAILY',
      time: '09:00',
      dayOfWeek: '1',
      dayOfMonth: '1'
    });
    setEditingTask(undefined);
  };

  const generateCronPattern = () => {
    const [hour, minute] = formData.time.split(':');
    switch (formData.frequency) {
      case 'DAILY':
        return `${minute} ${hour} * * *`;
      case 'WEEKLY':
        return `${minute} ${hour} * * ${formData.dayOfWeek}`;
      case 'MONTHLY':
        return `${minute} ${hour} ${formData.dayOfMonth} * *`;
      case 'QUARTERLY':
        return `${minute} ${hour} ${formData.dayOfMonth} */3 *`;
      case 'YEARLY':
        return `${minute} ${hour} ${formData.dayOfMonth} 1 *`;
      default:
        return `${minute} ${hour} * * *`;
    }
  };

  const calculateNextOccurrence = () => {
    const now = new Date();
    const [hour, minute] = formData.time.split(':').map(Number);
    
    switch (formData.frequency) {
      case 'DAILY': {
        const next = new Date(now);
        next.setHours(hour, minute, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        return next.toISOString();
      }
      case 'WEEKLY': {
        const next = new Date(now);
        const targetDay = parseInt(formData.dayOfWeek);
        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        next.setDate(next.getDate() + (daysUntilTarget || 7));
        next.setHours(hour, minute, 0, 0);
        return next.toISOString();
      }
      case 'MONTHLY': {
        const next = new Date(now);
        next.setDate(parseInt(formData.dayOfMonth));
        next.setHours(hour, minute, 0, 0);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        return next.toISOString();
      }
      default:
        return new Date(now.getTime() + 86400000).toISOString();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const newTask: RecurringTask = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description || undefined,
      frequency: formData.frequency,
      pattern: generateCronPattern(),
      nextOccurrence: calculateNextOccurrence(),
      isActive: true,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingTask) {
      setTasks(prev => prev.map(task => task.id === editingTask.id ? newTask : task));
      toast.success('Recurring task updated');
    } else {
      setTasks(prev => [...prev, newTask]);
      toast.success('Recurring task created');
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
      time: '09:00', // Default time since we don't store it separately
      dayOfWeek: '1',
      dayOfMonth: '1'
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
          <h1 className="text-2xl font-bold text-gray-900">Recurring Tasks</h1>
          <p className="text-gray-600">Automate repetitive tasks with schedules</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Recurring Task
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
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
              <p className="text-sm font-medium text-gray-600">Active</p>
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
              <p className="text-sm font-medium text-gray-600">Next Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(t => formatNextOccurrence(t.nextOccurrence) === 'Today').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 text-purple-600">🔄</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(t => t.frequency === 'WEEKLY').length}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recurring Tasks</h3>
          <p className="text-gray-600 mb-6">
            Create task templates that automatically generate new tasks on a schedule.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create First Template
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}>
                      {task.frequency}
                    </span>
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
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(task.id)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          task.isActive ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {task.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Next occurrence:</span>
                    <span className={`font-medium ${
                      formatNextOccurrence(task.nextOccurrence) === 'Today' ? 'text-green-600' :
                      formatNextOccurrence(task.nextOccurrence) === 'Overdue' ? 'text-red-600' :
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
                      {task.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {task.pattern && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Pattern:</span>
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
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        <span>Activate</span>
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
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTask ? 'Edit Recurring Task' : 'Create Recurring Task'}
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
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Weekly team meeting"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {formData.frequency === 'WEEKLY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                )}

                {(formData.frequency === 'MONTHLY' || formData.frequency === 'QUARTERLY' || formData.frequency === 'YEARLY') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Month
                    </label>
                    <select
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Preview:</strong> This task will run {formData.frequency.toLowerCase()} 
                    {formData.frequency === 'WEEKLY' && ` on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(formData.dayOfWeek)]}`}
                    {(formData.frequency === 'MONTHLY' || formData.frequency === 'QUARTERLY' || formData.frequency === 'YEARLY') && ` on the ${formData.dayOfMonth}${['th', 'st', 'nd', 'rd'][parseInt(formData.dayOfMonth) % 10] || 'th'} day`}
                    {' '}at {formData.time}.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cron pattern: <code>{generateCronPattern()}</code>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}