'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Habit } from '@/lib/api/habits';
import { habitsApi } from '@/lib/api/habits';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    frequency: habit?.frequency || 'DAILY',
    isActive: habit?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      description: formData.description || undefined,
    };

    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const frequencyOptions = habitsApi.getFrequencyOptions();
  const defaultIcons = habitsApi.getDefaultIcons();

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
            {habit ? 'Edit Habit' : 'Create New Habit'}
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
          {/* Habit Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Habit Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Drink 8 glasses of water, Exercise for 30 minutes"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Optional description of your habit..."
            />
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Habit Icons for inspiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popular Habit Types
            </label>
            <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 rounded-md">
              {defaultIcons.slice(0, 10).map(({ icon, label }) => (
                <div
                  key={icon}
                  className="flex flex-col items-center space-y-1 p-2 rounded hover:bg-white transition-colors cursor-pointer"
                  onClick={() => {
                    if (!formData.name) {
                      setFormData(prev => ({ ...prev, name: label }));
                    }
                  }}
                  title={`Click to use "${label}" as habit name`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs text-gray-600 text-center">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click on any icon to use it as your habit name
            </p>
          </div>

          {/* Active Status */}
          {habit && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                This habit is currently active
              </label>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Success</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Start small - it's better to do 5 minutes daily than 30 minutes weekly</li>
              <li>• Be specific - "Exercise for 20 minutes" is better than "Exercise"</li>
              <li>• Stack habits - attach new habits to existing routines</li>
              <li>• Track consistently - even logging "not done" builds awareness</li>
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
              {habit ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}