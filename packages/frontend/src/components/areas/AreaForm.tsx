'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaOfResponsibility } from '@/lib/api/areas';
import { areasApi } from '@/lib/api/areas';
import { X, Plus, Trash2 } from 'lucide-react';

interface AreaFormProps {
  area?: AreaOfResponsibility;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function AreaForm({ area, onSubmit, onCancel }: AreaFormProps) {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    description: area?.description || '',
    color: area?.color || areasApi.getDefaultColors()[0],
    icon: area?.icon || '',
    purpose: area?.purpose || '',
    outcomes: area?.outcomes || [''],
    currentFocus: area?.currentFocus || '',
    reviewFrequency: area?.reviewFrequency || 'MONTHLY',
    isActive: area?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Area name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Filter out empty outcomes
    const filteredOutcomes = formData.outcomes.filter(outcome => outcome.trim());

    // Prepare data for submission
    const submitData = {
      ...formData,
      outcomes: filteredOutcomes.length > 0 ? filteredOutcomes : undefined,
      icon: formData.icon || undefined,
      description: formData.description || undefined,
      purpose: formData.purpose || undefined,
      currentFocus: formData.currentFocus || undefined
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

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = value;
    setFormData(prev => ({ ...prev, outcomes: newOutcomes }));
  };

  const addOutcome = () => {
    setFormData(prev => ({ 
      ...prev, 
      outcomes: [...prev.outcomes, ''] 
    }));
  };

  const removeOutcome = (index: number) => {
    const newOutcomes = formData.outcomes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, outcomes: newOutcomes }));
  };

  const defaultColors = areasApi.getDefaultColors();
  const defaultIcons = areasApi.getDefaultIcons();
  const reviewOptions = areasApi.getReviewFrequencyOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {area ? 'Edit Area of Responsibility' : 'Create New Area'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Area Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Area Name *
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
              placeholder="e.g., Health & Fitness, Professional Development"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Color and Icon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {defaultColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon (optional)
              </label>
              <div className="grid grid-cols-5 gap-2 max-h-24 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: '' }))}
                  className={`p-2 border rounded-md text-center text-sm ${
                    !formData.icon ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  None
                </button>
                {defaultIcons.map(({ icon, label }) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 border rounded-md text-center text-lg ${
                      formData.icon === icon 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title={label}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
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
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of this area"
            />
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Why is this area important? What is your vision for it?"
            />
          </div>

          {/* Key Outcomes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Outcomes
            </label>
            <div className="space-y-2">
              {formData.outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => handleOutcomeChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Desired outcome or goal"
                  />
                  {formData.outcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutcome(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOutcome}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Outcome</span>
              </button>
            </div>
          </div>

          {/* Current Focus and Review Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="currentFocus" className="block text-sm font-medium text-gray-700 mb-2">
                Current Focus
              </label>
              <input
                type="text"
                id="currentFocus"
                name="currentFocus"
                value={formData.currentFocus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="What are you focusing on right now?"
              />
            </div>

            <div>
              <label htmlFor="reviewFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                Review Frequency
              </label>
              <select
                id="reviewFrequency"
                name="reviewFrequency"
                value={formData.reviewFrequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {reviewOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Status */}
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
              This area is currently active
            </label>
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
              {area ? 'Update Area' : 'Create Area'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}