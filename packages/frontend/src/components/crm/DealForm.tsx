'use client';

import React, { useState, useEffect } from 'react';
import { Deal, Company, Contact } from '@/types/crm';

interface DealFormProps {
  deal?: Deal;
  companies: Company[];
  contacts: Contact[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  preSelectedCompanyId?: string;
}

// Deal stages matching the backend DealStage enum
const DEAL_STAGES = [
  { value: 'PROSPECT', label: 'Prospect', probability: 10 },
  { value: 'QUALIFIED', label: 'Qualified', probability: 25 },
  { value: 'PROPOSAL', label: 'Proposal', probability: 50 },
  { value: 'NEGOTIATION', label: 'Negotiation', probability: 75 },
  { value: 'CLOSED_WON', label: 'Closed Won', probability: 100 },
  { value: 'CLOSED_LOST', label: 'Closed Lost', probability: 0 },
];

export default function DealForm({ deal, companies, contacts, onSubmit, onCancel, preSelectedCompanyId }: DealFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    currency: 'USD',
    probability: '10',
    stage: 'PROSPECT',
    companyId: preSelectedCompanyId || '',
    ownerId: '',
    expectedCloseDate: '',
    actualCloseDate: '',
    source: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        description: deal.description || '',
        value: deal.value?.toString() || '',
        currency: deal.currency || 'USD',
        probability: deal.probability?.toString() || '',
        stage: (deal as any).stage || 'PROSPECT',
        companyId: deal.companyId || '',
        ownerId: deal.ownerId || '',
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().slice(0, 16) : '',
        actualCloseDate: deal.actualCloseDate ? new Date(deal.actualCloseDate).toISOString().slice(0, 16) : '',
        source: deal.source || '',
        notes: deal.notes || ''
      });
    }
  }, [deal]);

  // Auto-set probability when stage changes
  useEffect(() => {
    if (formData.stage) {
      const stageConfig = DEAL_STAGES.find(s => s.value === formData.stage);
      if (stageConfig && !deal) {
        setFormData(prev => ({
          ...prev,
          probability: stageConfig.probability.toString(),
        }));
      }
    }
  }, [formData.stage, deal]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Deal title is required';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required';
    }

    if (!formData.stage) {
      newErrors.stage = 'Stage is required';
    }

    if (formData.value && isNaN(Number(formData.value))) {
      newErrors.value = 'Please enter a valid number';
    }

    if (formData.probability && (isNaN(Number(formData.probability)) || Number(formData.probability) < 0 || Number(formData.probability) > 100)) {
      newErrors.probability = 'Probability must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        value: formData.value ? Number(formData.value) : undefined,
        currency: formData.currency,
        probability: formData.probability ? Number(formData.probability) : undefined,
        stage: formData.stage,
        companyId: formData.companyId,
        ownerId: formData.ownerId || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        actualCloseDate: formData.actualCloseDate || undefined,
        source: formData.source?.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save deal. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {deal ? 'Edit Deal' : 'Create New Deal'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Enter deal title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="input"
              placeholder="Describe the deal..."
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => handleChange('companyId', e.target.value)}
              className={`input ${errors.companyId ? 'input-error' : ''}`}
            >
              <option value="">Select company...</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
            )}
          </div>

          {/* Value and Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Value
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleChange('value', e.target.value)}
                className={`input ${errors.value ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="input"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PLN">PLN</option>
              </select>
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage *
            </label>
            <select
              value={formData.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className={`input ${errors.stage ? 'input-error' : ''}`}
            >
              <option value="">Select stage...</option>
              {DEAL_STAGES.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label} ({stage.probability}%)
                </option>
              ))}
            </select>
            {errors.stage && (
              <p className="mt-1 text-sm text-red-600">{errors.stage}</p>
            )}
          </div>

          {/* Probability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Probability (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => handleChange('probability', e.target.value)}
              className={`input ${errors.probability ? 'input-error' : ''}`}
              placeholder="0-100"
            />
            {errors.probability && (
              <p className="mt-1 text-sm text-red-600">{errors.probability}</p>
            )}
          </div>

          {/* Expected Close Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <input
              type="datetime-local"
              value={formData.expectedCloseDate}
              onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
              className="input"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="input"
              placeholder="Additional notes about this deal..."
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline btn-md"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {deal ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                deal ? 'Update Deal' : 'Create Deal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
