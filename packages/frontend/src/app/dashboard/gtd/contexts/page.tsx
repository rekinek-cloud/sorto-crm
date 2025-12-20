'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PhoneIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ClockIcon,
  GlobeAltIcon,
  BookOpenIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ContextWithStats {
  context: string;
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completedToday: number;
  avgCompletionTime?: number;
  lastUsed?: string;
}

interface Task {
  id: string;
  title: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  dueDate?: string;
  estimatedTime?: string;
  context?: string;
  updatedAt: string;
}

const DEFAULT_CONTEXTS = [
  { name: '@calls', description: 'Phone calls to make', icon: '📞', color: '#10b981' },
  { name: '@computer', description: 'Tasks requiring computer', icon: '💻', color: '#3b82f6' },
  { name: '@errands', description: 'Things to do while out', icon: '🛒', color: '#f59e0b' },
  { name: '@home', description: 'Tasks to do at home', icon: '🏠', color: '#8b5cf6' },
  { name: '@office', description: 'Tasks for the office', icon: '🏢', color: '#ef4444' },
  { name: '@waiting', description: 'Waiting for someone else', icon: '⏳', color: '#6b7280' },
  { name: '@online', description: 'Internet-based tasks', icon: '🌐', color: '#06b6d4' },
  { name: '@reading', description: 'Documents to read', icon: '📚', color: '#84cc16' }
];

export default function ContextsPage() {
  const [contexts, setContexts] = useState<ContextWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContext, setNewContext] = useState({ name: '', description: '', icon: '🎯', color: '#3b82f6' });

  useEffect(() => {
    loadContextsData();
  }, []);

  useEffect(() => {
    if (selectedContext) {
      loadContextTasks(selectedContext);
    }
  }, [selectedContext]);

  const loadContextsData = async () => {
    // Mock data for demo
    setTimeout(() => {
      const mockTasks: Task[] = [
        { id: '1', title: 'Call client about proposal', priority: 'HIGH', status: 'NEW', context: '@calls', estimatedTime: '15min', dueDate: new Date(Date.now() + 86400000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', title: 'Book dentist appointment', priority: 'MEDIUM', status: 'NEW', context: '@calls', estimatedTime: '5min', updatedAt: new Date().toISOString() },
        { id: '3', title: 'Review project documentation', priority: 'MEDIUM', status: 'IN_PROGRESS', context: '@computer', estimatedTime: '2hr', updatedAt: new Date().toISOString() },
        { id: '4', title: 'Update website analytics', priority: 'LOW', status: 'NEW', context: '@computer', estimatedTime: '30min', updatedAt: new Date().toISOString() },
        { id: '5', title: 'Pick up dry cleaning', priority: 'LOW', status: 'NEW', context: '@errands', estimatedTime: '10min', updatedAt: new Date().toISOString() },
        { id: '6', title: 'Buy groceries for dinner', priority: 'MEDIUM', status: 'NEW', context: '@errands', estimatedTime: '45min', dueDate: new Date(Date.now() + 7200000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '7', title: 'Fix kitchen faucet', priority: 'HIGH', status: 'NEW', context: '@home', estimatedTime: '1hr', dueDate: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '8', title: 'Organize garage storage', priority: 'LOW', status: 'NEW', context: '@home', estimatedTime: '3hr', updatedAt: new Date().toISOString() },
        { id: '9', title: 'Prepare quarterly report', priority: 'URGENT', status: 'IN_PROGRESS', context: '@office', estimatedTime: '4hr', dueDate: new Date(Date.now() + 172800000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '10', title: 'Schedule team meeting', priority: 'MEDIUM', status: 'NEW', context: '@office', estimatedTime: '15min', updatedAt: new Date().toISOString() },
        { id: '11', title: 'Research new software tools', priority: 'LOW', status: 'NEW', context: '@online', estimatedTime: '2hr', updatedAt: new Date().toISOString() },
        { id: '12', title: 'Read industry newsletter', priority: 'LOW', status: 'NEW', context: '@reading', estimatedTime: '30min', updatedAt: new Date().toISOString() },
      ];

      // Calculate statistics for each context
      const contextStats: ContextWithStats[] = DEFAULT_CONTEXTS.map(defaultCtx => {
        const contextTasks = mockTasks.filter(task => task.context === defaultCtx.name);
        const activeTasks = contextTasks.filter(task => 
          task.status === 'NEW' || task.status === 'IN_PROGRESS'
        );
        const overdueTasks = contextTasks.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
        });

        return {
          context: defaultCtx.name,
          totalTasks: contextTasks.length,
          activeTasks: activeTasks.length,
          overdueTasks: overdueTasks.length,
          completedToday: Math.floor(Math.random() * 3),
          lastUsed: contextTasks.length > 0 ? contextTasks[0].updatedAt : undefined
        };
      });

      setContexts(contextStats);
      setLoading(false);
    }, 500);
  };

  const loadContextTasks = async (context: string) => {
    // Mock data for selected context
    setTimeout(() => {
      const allMockTasks: Task[] = [
        { id: '1', title: 'Call client about proposal', priority: 'HIGH', status: 'NEW', context: '@calls', estimatedTime: '15min', dueDate: new Date(Date.now() + 86400000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', title: 'Book dentist appointment', priority: 'MEDIUM', status: 'NEW', context: '@calls', estimatedTime: '5min', updatedAt: new Date().toISOString() },
        { id: '3', title: 'Review project documentation', priority: 'MEDIUM', status: 'IN_PROGRESS', context: '@computer', estimatedTime: '2hr', updatedAt: new Date().toISOString() },
        { id: '4', title: 'Update website analytics', priority: 'LOW', status: 'NEW', context: '@computer', estimatedTime: '30min', updatedAt: new Date().toISOString() },
        { id: '5', title: 'Pick up dry cleaning', priority: 'LOW', status: 'NEW', context: '@errands', estimatedTime: '10min', updatedAt: new Date().toISOString() },
        { id: '6', title: 'Buy groceries for dinner', priority: 'MEDIUM', status: 'NEW', context: '@errands', estimatedTime: '45min', dueDate: new Date(Date.now() + 7200000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '7', title: 'Fix kitchen faucet', priority: 'HIGH', status: 'NEW', context: '@home', estimatedTime: '1hr', dueDate: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '8', title: 'Organize garage storage', priority: 'LOW', status: 'NEW', context: '@home', estimatedTime: '3hr', updatedAt: new Date().toISOString() },
        { id: '9', title: 'Prepare quarterly report', priority: 'URGENT', status: 'IN_PROGRESS', context: '@office', estimatedTime: '4hr', dueDate: new Date(Date.now() + 172800000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '10', title: 'Schedule team meeting', priority: 'MEDIUM', status: 'NEW', context: '@office', estimatedTime: '15min', updatedAt: new Date().toISOString() },
        { id: '11', title: 'Research new software tools', priority: 'LOW', status: 'NEW', context: '@online', estimatedTime: '2hr', updatedAt: new Date().toISOString() },
        { id: '12', title: 'Read industry newsletter', priority: 'LOW', status: 'NEW', context: '@reading', estimatedTime: '30min', updatedAt: new Date().toISOString() },
      ];

      const contextTasks = allMockTasks.filter(task => task.context === context);
      setTasks(contextTasks);
    }, 200);
  };

  const getContextInfo = (contextName: string) => {
    return DEFAULT_CONTEXTS.find(ctx => ctx.name === contextName) || {
      name: contextName,
      description: 'Custom context',
      icon: '🎯',
      color: '#6b7280'
    };
  };

  const handleCompleteTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: 'COMPLETED' } : task
    );
    setTasks(updatedTasks);
    toast.success('Task completed!');
    // Refresh context stats
    loadContextsData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">GTD Contexts</h1>
          <p className="text-gray-600">Organize tasks by location, tool, or situation</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Context
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contexts List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Contexts ({contexts.length})
              </h2>
            </div>

            {contexts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contexts Yet</h3>
                <p className="text-gray-600">Create contexts to organize your tasks better</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contexts.map((ctx, index) => {
                  const contextInfo = getContextInfo(ctx.context);
                  return (
                    <motion.div 
                      key={ctx.context} 
                      className={`p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                        selectedContext === ctx.context ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                      onClick={() => setSelectedContext(ctx.context)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md"
                            style={{ backgroundColor: contextInfo.color }}
                          >
                            {contextInfo.icon}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {ctx.context}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {contextInfo.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{ctx.activeTasks}</div>
                              <div className="text-gray-600">Active</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{ctx.totalTasks}</div>
                              <div className="text-gray-600">Total</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${ctx.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {ctx.overdueTasks}
                              </div>
                              <div className="text-gray-600">Overdue</div>
                            </div>
                          </div>
                          {ctx.lastUsed && (
                            <div className="text-xs text-gray-500 mt-2">
                              Last used: {formatDate(ctx.lastUsed)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Context Details */}
        <div className="lg:col-span-1">
          {selectedContext ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: getContextInfo(selectedContext).color }}
                  >
                    {getContextInfo(selectedContext).icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedContext}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {getContextInfo(selectedContext).description}
                  </div>

                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">✨</div>
                      <p className="text-gray-600 text-sm">No tasks in this context</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Tasks ({tasks.length})</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {tasks.slice(0, 10).map((task, taskIndex) => (
                          <motion.div 
                            key={task.id} 
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: taskIndex * 0.05 }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.estimatedTime && (
                                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                    {task.estimatedTime}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {task.title}
                              </h5>
                              {task.dueDate && (
                                <div className={`text-xs mt-1 ${
                                  new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  Due: {formatDate(task.dueDate)}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteTask(task.id);
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                              title="Complete task"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                        {tasks.length > 10 && (
                          <div className="text-center pt-2">
                            <button 
                              onClick={() => window.location.href = `/dashboard/gtd/next-actions?context=${selectedContext}`}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              View all {tasks.length} tasks in Next Actions
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => window.location.href = `/dashboard/gtd/next-actions?context=${selectedContext}`}
                      className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                    >
                      Work in this context
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">👈</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Context</h3>
                <p className="text-gray-600 text-sm">Click on a context to see its tasks and details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 GTD Context Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>@calls:</strong> Phone calls when you have your phone
          </div>
          <div>
            <strong>@computer:</strong> Tasks requiring computer work
          </div>
          <div>
            <strong>@errands:</strong> Things to do when you're out and about
          </div>
          <div>
            <strong>@home:</strong> Tasks you can only do at home
          </div>
          <div>
            <strong>@office:</strong> Work tasks requiring office resources
          </div>
          <div>
            <strong>@waiting:</strong> Items you're waiting on from others
          </div>
        </div>
        <p className="text-blue-700 mt-3 text-sm">
          Contexts help you batch similar tasks and work more efficiently based on your current situation.
        </p>
      </div>

      {/* Create Context Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Custom Context</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Context Name *
                  </label>
                  <input
                    type="text"
                    value={newContext.name}
                    onChange={(e) => setNewContext({ ...newContext, name: e.target.value })}
                    placeholder="@custom-context"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Start with @ for GTD convention</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newContext.description}
                    onChange={(e) => setNewContext({ ...newContext, description: e.target.value })}
                    placeholder="Tasks requiring..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <input
                      type="text"
                      value={newContext.icon}
                      onChange={(e) => setNewContext({ ...newContext, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={newContext.color}
                      onChange={(e) => setNewContext({ ...newContext, color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newContext.name.trim()) {
                      toast.error('Context name is required');
                      return;
                    }
                    
                    const customContext: ContextWithStats = {
                      context: newContext.name.trim(),
                      totalTasks: 0,
                      activeTasks: 0,
                      overdueTasks: 0,
                      completedToday: 0
                    };
                    
                    setContexts(prev => [...prev, customContext]);
                    setNewContext({ name: '', description: '', icon: '🎯', color: '#3b82f6' });
                    setShowCreateModal(false);
                    toast.success('Custom context created!');
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  disabled={!newContext.name.trim()}
                >
                  Create Context
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}