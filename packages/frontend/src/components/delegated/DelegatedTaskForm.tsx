'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DelegatedTask } from '@/lib/api/delegated';
import { delegatedApi } from '@/lib/api/delegated';
import { tasksApi } from '@/lib/api/tasks';
import { XMarkIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface DelegatedTaskFormProps {
  task?: DelegatedTask;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function DelegatedTaskForm({ task, onSubmit, onCancel }: DelegatedTaskFormProps) {
  const [formData, setFormData] = useState({
    description: task?.description || '',
    delegatedTo: task?.delegatedTo || '',
    followUpDate: task?.followUpDate ? new Date(task.followUpDate).toISOString().slice(0, 16) : '',
    notes: task?.notes || '',
    taskId: task?.taskId || '',
    status: task?.status || 'NEW'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [delegateSuggestions, setDelegateSuggestions] = useState<string[]>([]);

  // Load tasks for dropdown
  useEffect(() => {
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const data = await tasksApi.getTasks({
          limit: 100,
          status: 'all' as any
        });
        setTasks((data as any).tasks || data);
      } catch (error: any) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };
    const loadSuggestions = async () => {
      try {
        const suggestions = await delegatedApi.getDelegateSuggestions();
        setDelegateSuggestions(suggestions);
      } catch (error: any) {
        console.error('Error loading suggestions:', error);
      }
    };
    loadTasks();
    loadSuggestions();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    }

    if (!formData.delegatedTo.trim()) {
      newErrors.delegatedTo = 'Delegate name is required';
    }

    if (formData.followUpDate) {
      const dateError = delegatedApi.validateFollowUpDate(formData.followUpDate);
      if (dateError) {
        newErrors.followUpDate = dateError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      description: formData.description.trim(),
      delegatedTo: formData.delegatedTo.trim(),
      followUpDate: formData.followUpDate || undefined,
      notes: formData.notes?.trim() || undefined,
      taskId: formData.taskId || undefined
    };

    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDelegateSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, delegatedTo: suggestion }));
    setErrors(prev => ({ ...prev, delegatedTo: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Delegated Task' : 'Create Delegated Task'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Task Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe what needs to be done..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Delegated To */}
          <div>
            <label htmlFor="delegatedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Delegate To *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="delegatedTo"
                name="delegatedTo"
                value={formData.delegatedTo}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.delegatedTo ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Person or team name"
              />
            </div>
            {errors.delegatedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.delegatedTo}</p>
            )}
            
            {/* Delegate Suggestions */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {delegateSuggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleDelegateSuggestionClick(suggestion)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up Date */}
          <div>
            <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date (Optional)
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="datetime-local"
                id="followUpDate"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.followUpDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.followUpDate && (
              <p className="mt-1 text-sm text-red-600">{errors.followUpDate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              When do you want to check on the progress?
            </p>
          </div>

          {/* Related Task */}
          <div>
            <label htmlFor="taskId" className="block text-sm font-medium text-gray-700 mb-2">
              Related Task (Optional)
            </label>
            <select
              id="taskId"
              name="taskId"
              value={formData.taskId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingTasks}
            >
              <option value="">No related task</option>
              {tasks.map(taskItem => (
                <option key={taskItem.id} value={taskItem.id}>
                  {taskItem.title} ({taskItem.status})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Link this delegation to an existing task
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional context, instructions, or expectations..."
            />
          </div>

          {/* Status (for editing existing tasks) */}
          {task && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Delegation Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about what needs to be done and expected outcomes</li>
              <li>• Set clear deadlines and follow-up dates</li>
              <li>• Provide necessary context and resources</li>
              <li>• Define success criteria and how progress will be measured</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              {task ? 'Update Task' : 'Create Delegation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}