'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Phone, Monitor, Building2, Home, Clock, Globe, BookOpen,
  Plus, Check, X, Target, Sparkles, ArrowLeft, Lightbulb,
  ShoppingCart,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

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

const CONTEXT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  '@calls': Phone,
  '@computer': Monitor,
  '@errands': ShoppingCart,
  '@home': Home,
  '@office': Building2,
  '@waiting': Clock,
  '@online': Globe,
  '@reading': BookOpen,
};

const DEFAULT_CONTEXTS = [
  { name: '@calls', description: 'Phone calls to make', color: '#10b981' },
  { name: '@computer', description: 'Tasks requiring computer', color: '#3b82f6' },
  { name: '@errands', description: 'Things to do while out', color: '#f59e0b' },
  { name: '@home', description: 'Tasks to do at home', color: '#8b5cf6' },
  { name: '@office', description: 'Tasks for the office', color: '#ef4444' },
  { name: '@waiting', description: 'Waiting for someone else', color: '#6b7280' },
  { name: '@online', description: 'Internet-based tasks', color: '#06b6d4' },
  { name: '@reading', description: 'Documents to read', color: '#84cc16' },
];

export default function ContextsPage() {
  const [contexts, setContexts] = useState<ContextWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContext, setNewContext] = useState({ name: '', description: '', color: '#3b82f6' });

  useEffect(() => {
    loadContextsData();
  }, []);

  useEffect(() => {
    if (selectedContext) {
      loadContextTasks(selectedContext);
    }
  }, [selectedContext]);

  const loadContextsData = async () => {
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
          lastUsed: contextTasks.length > 0 ? contextTasks[0].updatedAt : undefined,
        };
      });

      setContexts(contextStats);
      setLoading(false);
    }, 500);
  };

  const loadContextTasks = async (context: string) => {
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
      color: '#6b7280',
    };
  };

  const getContextIcon = (contextName: string) => {
    return CONTEXT_ICONS[contextName] || Target;
  };

  const handleCompleteTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: 'COMPLETED' } : task
    );
    setTasks(updatedTasks);
    toast.success('Task completed!');
    loadContextsData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Konteksty"
        subtitle="Organize tasks by location, tool, or situation"
        icon={Target}
        iconColor="text-teal-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'GTD', href: '/dashboard/gtd' },
          { label: 'Konteksty' },
        ]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Context
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contexts List */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                All Contexts ({contexts.length})
              </h2>
            </div>

            {contexts.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Contexts Yet</h3>
                <p className="text-slate-600 dark:text-slate-400">Create contexts to organize your tasks better</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {contexts.map((ctx, index) => {
                  const contextInfo = getContextInfo(ctx.context);
                  const IconComponent = getContextIcon(ctx.context);
                  return (
                    <motion.div
                      key={ctx.context}
                      className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all duration-200 ${
                        selectedContext === ctx.context ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500' : ''
                      }`}
                      onClick={() => setSelectedContext(ctx.context)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: contextInfo.color }}
                          >
                            <IconComponent className="w-6 h-6" />
                          </div>

                          <div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                              {ctx.context}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {contextInfo.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{ctx.activeTasks}</div>
                              <div className="text-slate-600 dark:text-slate-400">Active</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{ctx.totalTasks}</div>
                              <div className="text-slate-600 dark:text-slate-400">Total</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${ctx.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {ctx.overdueTasks}
                              </div>
                              <div className="text-slate-600 dark:text-slate-400">Overdue</div>
                            </div>
                          </div>
                          {ctx.lastUsed && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: getContextInfo(selectedContext).color }}
                  >
                    {(() => {
                      const Icon = getContextIcon(selectedContext);
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedContext}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {getContextInfo(selectedContext).description}
                  </div>

                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-400 text-sm">No tasks in this context</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Tasks ({tasks.length})</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {tasks.slice(0, 10).map((task, taskIndex) => (
                          <motion.div
                            key={task.id}
                            className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                                    {task.estimatedTime}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {task.title}
                              </h5>
                              {task.dueDate && (
                                <div className={`text-xs mt-1 ${
                                  new Date(task.dueDate) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
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
                              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors"
                              title="Complete task"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                        {tasks.length > 10 && (
                          <div className="text-center pt-2">
                            <button
                              onClick={() => window.location.href = `/dashboard/gtd/next-actions?context=${selectedContext}`}
                              className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                            >
                              View all {tasks.length} tasks in Next Actions
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => window.location.href = `/dashboard/gtd/next-actions?context=${selectedContext}`}
                      className="w-full px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/50"
                    >
                      Work in this context
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="p-6 text-center">
                <ArrowLeft className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Select a Context</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Click on a context to see its tasks and details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Wskazowki dotyczace kontekstow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
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
        <p className="text-blue-700 dark:text-blue-300 mt-3 text-sm">
          Contexts help you batch similar tasks and work more efficiently based on your current situation.
        </p>
      </div>

      {/* Create Context Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Custom Context</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Context Name *
                  </label>
                  <input
                    type="text"
                    value={newContext.name}
                    onChange={(e) => setNewContext({ ...newContext, name: e.target.value })}
                    placeholder="@custom-context"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rozpocznij od @ dla konwencji kontekstow</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newContext.description}
                    onChange={(e) => setNewContext({ ...newContext, description: e.target.value })}
                    placeholder="Tasks requiring..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newContext.color}
                    onChange={(e) => setNewContext({ ...newContext, color: e.target.value })}
                    className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
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
                      completedToday: 0,
                    };

                    setContexts(prev => [...prev, customContext]);
                    setNewContext({ name: '', description: '', color: '#3b82f6' });
                    setShowCreateModal(false);
                    toast.success('Custom context created!');
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                  disabled={!newContext.name.trim()}
                >
                  Create Context
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
