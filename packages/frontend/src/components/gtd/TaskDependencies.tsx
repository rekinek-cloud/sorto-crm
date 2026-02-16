'use client';

import React, { useState, useEffect } from 'react';
import { tasksApi } from '@/lib/api/workflow';
import { Task } from '@/types/streams';
import { toast } from 'react-hot-toast';
import {
  Link,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface TaskDependenciesProps {
  taskId: string;
  onDependenciesChange?: () => void;
}

interface Dependency {
  id: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    completedAt?: string;
  };
  type: string;
  lag?: string;
  notes?: string;
  isCriticalPath: boolean;
}

interface DependenciesData {
  taskId: string;
  dependencies: Dependency[];
  dependents: Dependency[];
}

const DEPENDENCY_TYPES = [
  { value: 'FINISH_TO_START', label: 'Finish to Start (Default)', description: 'Task must finish before this can start' },
  { value: 'START_TO_START', label: 'Start to Start', description: 'Both tasks can start at the same time' },
  { value: 'FINISH_TO_FINISH', label: 'Finish to Finish', description: 'Both tasks must finish at the same time' },
  { value: 'START_TO_FINISH', label: 'Start to Finish', description: 'Task must start before this can finish' },
];

export default function TaskDependencies({ taskId, onDependenciesChange }: TaskDependenciesProps) {
  const [dependenciesData, setDependenciesData] = useState<DependenciesData | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newDependency, setNewDependency] = useState({
    toTaskId: '',
    type: 'FINISH_TO_START',
    lag: '',
    notes: ''
  });

  useEffect(() => {
    loadDependencies();
    loadAvailableTasks();
  }, [taskId]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await (tasksApi as any).getTaskDependencies(taskId);
      setDependenciesData(data);
    } catch (err: any) {
      setError('Failed to load dependencies');
      console.error('Error loading dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const response = await tasksApi.getTasks({ 
        limit: 100 
      });
      // Filter out current task, completed and canceled tasks
      const filtered = response.tasks.filter(task => 
        task.id !== taskId && 
        task.status !== 'COMPLETED' && 
        task.status !== 'CANCELED'
      );
      setAvailableTasks(filtered);
    } catch (err: any) {
      console.error('Error loading available tasks:', err);
    }
  };

  const handleAddDependency = async () => {
    if (!newDependency.toTaskId) {
      toast.error('Please select a task');
      return;
    }

    try {
      setIsSubmitting(true);
      await (tasksApi as any).addTaskDependency(taskId, {
        toTaskId: newDependency.toTaskId,
        type: newDependency.type as any,
        lag: newDependency.lag || undefined,
        notes: newDependency.notes || undefined
      });
      
      toast.success('Dependency added successfully');
      setShowAddForm(false);
      setNewDependency({ toTaskId: '', type: 'FINISH_TO_START', lag: '', notes: '' });
      
      // Reload dependencies
      await loadDependencies();
      onDependenciesChange?.();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add dependency');
      console.error('Error adding dependency:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDependency = async (relationshipId: string, taskTitle: string) => {
    if (!confirm(`Remove dependency on "${taskTitle}"?`)) return;

    try {
      await (tasksApi as any).removeTaskDependency(taskId, relationshipId);
      toast.success('Dependency removed');
      
      // Reload dependencies
      await loadDependencies();
      onDependenciesChange?.();
    } catch (err: any) {
      toast.error('Failed to remove dependency');
      console.error('Error removing dependency:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'WAITING':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'WAITING': return 'bg-yellow-100 text-yellow-800';
      case 'NEW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Dependencies</h2>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Dependencies</h2>
        </div>
        <div className="p-6 text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={loadDependencies}
            className="mt-2 btn btn-outline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { dependencies = [], dependents = [] } = dependenciesData || {};

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Task Dependencies</h2>
            <p className="text-sm text-gray-600">Manage dependencies between tasks</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Dependency
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add Dependency Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Dependency</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dependent Task *
                </label>
                <select
                  value={newDependency.toTaskId}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, toTaskId: e.target.value }))}
                  className="input"
                >
                  <option value="">Select a task...</option>
                  {availableTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.status.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dependency Type
                </label>
                <select
                  value={newDependency.type}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, type: e.target.value }))}
                  className="input"
                >
                  {DEPENDENCY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lag (optional)
                </label>
                <input
                  type="text"
                  value={newDependency.lag}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, lag: e.target.value }))}
                  placeholder="e.g., 2 days, 1 week"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={newDependency.notes}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddDependency}
                className="btn btn-primary"
                disabled={isSubmitting || !newDependency.toTaskId}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Dependency'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dependencies (tasks this task depends on) */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Dependencies ({dependencies.length})
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tasks that must be completed before this task can start
          </p>
          
          {dependencies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No dependencies defined</p>
              <p className="text-xs">This task can start immediately</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dependencies.map((dep) => (
                <div key={dep.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(dep.task.status)}
                        <a 
                          href={`/crm/dashboard/tasks/${dep.task.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {dep.task.title}
                        </a>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dep.task.status)}`}>
                          {dep.task.status.toLowerCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(dep.task.priority)}`}>
                          {dep.task.priority.toLowerCase()}
                        </span>
                        {dep.isCriticalPath && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Critical Path
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Type: <span className="font-medium">{dep.type.replace('_', ' ')}</span></div>
                        {dep.lag && <div>Lag: <span className="font-medium">{dep.lag}</span></div>}
                        {dep.notes && <div>Notes: <span className="font-medium">{dep.notes}</span></div>}
                        {dep.task.dueDate && (
                          <div>Due: <span className="font-medium">{formatDate(dep.task.dueDate)}</span></div>
                        )}
                        {dep.task.completedAt && (
                          <div>Completed: <span className="font-medium text-green-600">{formatDate(dep.task.completedAt)}</span></div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveDependency(dep.id, dep.task.title)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove dependency"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dependents (tasks that depend on this task) */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Dependents ({dependents.length})
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tasks that are waiting for this task to be completed
          </p>
          
          {dependents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No dependent tasks</p>
              <p className="text-xs">No other tasks are waiting for this one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dependents.map((dep) => (
                <div key={dep.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start space-x-2">
                    {getStatusIcon(dep.task.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <a 
                          href={`/crm/dashboard/tasks/${dep.task.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {dep.task.title}
                        </a>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dep.task.status)}`}>
                          {dep.task.status.toLowerCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(dep.task.priority)}`}>
                          {dep.task.priority.toLowerCase()}
                        </span>
                        {dep.isCriticalPath && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Critical Path
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Type: <span className="font-medium">{dep.type.replace('_', ' ')}</span></div>
                        {dep.lag && <div>Lag: <span className="font-medium">{dep.lag}</span></div>}
                        {dep.notes && <div>Notes: <span className="font-medium">{dep.notes}</span></div>}
                        {dep.task.dueDate && (
                          <div>Due: <span className="font-medium">{formatDate(dep.task.dueDate)}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}