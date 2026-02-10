'use client';

import React, { useState, useEffect } from 'react';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/crm';
import { apiClient } from '@/lib/api/client';

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CreateCompanyRequest | UpdateCompanyRequest) => Promise<void>;
  onCancel: () => void;
}

export default function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: 'MEDIUM' as 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE',
    status: 'PROSPECT' as 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'INACTIVE' | 'ARCHIVED',
    address: '',
    phone: '',
    email: '',
    tags: [] as string[],
    nip: '',
    regon: '',
    krs: '',
    vatActive: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        website: company.website || '',
        industry: company.industry || '',
        size: company.size || 'MEDIUM',
        status: company.status || 'PROSPECT',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        tags: company.tags || [],
        nip: company.nip || '',
        regon: company.regon || '',
        krs: company.krs || '',
        vatActive: company.vatActive || false
      });
    }
  }, [company]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNipLookup = async () => {
    const nip = formData.nip.replace(/[^0-9]/g, '');
    if (nip.length !== 10) {
      setErrors(prev => ({ ...prev, nip: 'NIP musi mieć 10 cyfr' }));
      return;
    }
    setIsLookingUp(true);
    try {
      const { data } = await apiClient.get(`/companies/lookup-nip/${nip}`);
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        nip: data.nip || prev.nip,
        regon: data.regon || prev.regon,
        krs: data.krs || prev.krs,
        vatActive: data.vatActive ?? prev.vatActive,
        address: data.address || prev.address,
      }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, nip: error?.response?.data?.error || 'Nie znaleziono firmy' }));
    } finally {
      setIsLookingUp(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && formData.website.trim() && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must be a valid URL (starting with http or https)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare data for submission
      const submitData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        website: formData.website.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        size: formData.size,
        status: formData.status,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        nip: formData.nip.trim() || undefined,
        regon: formData.regon.trim() || undefined,
        krs: formData.krs.trim() || undefined,
        vatActive: formData.nip ? formData.vatActive : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save company. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {company ? 'Edit Company' : 'Add New Company'}
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
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter company name..."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* NIP Lookup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => handleChange('nip', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                className={`input flex-1 ${errors.nip ? 'input-error' : ''}`}
                placeholder="Wpisz NIP (10 cyfr)..."
                maxLength={10}
              />
              <button
                type="button"
                onClick={handleNipLookup}
                disabled={isLookingUp || formData.nip.length !== 10}
                className="btn btn-outline btn-sm whitespace-nowrap"
              >
                {isLookingUp ? 'Szukam...' : 'Pobierz dane'}
              </button>
            </div>
            {errors.nip && (
              <p className="mt-1 text-sm text-red-600">{errors.nip}</p>
            )}
            {formData.vatActive && formData.nip && (
              <p className="mt-1 text-xs text-green-600">Czynny podatnik VAT</p>
            )}
            {formData.nip && formData.vatActive === false && (
              <p className="mt-1 text-xs text-red-600">Nieczynny podatnik VAT</p>
            )}
          </div>

          {/* REGON and KRS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                REGON
              </label>
              <input
                type="text"
                value={formData.regon}
                onChange={(e) => handleChange('regon', e.target.value)}
                className="input"
                placeholder="REGON..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KRS
              </label>
              <input
                type="text"
                value={formData.krs}
                onChange={(e) => handleChange('krs', e.target.value)}
                className="input"
                placeholder="KRS..."
              />
            </div>
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
              placeholder="Describe the company..."
            />
          </div>

          {/* Status and Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="input"
              >
                <option value="PROSPECT">Prospect</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PARTNER">Partner</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size
              </label>
              <select
                value={formData.size}
                onChange={(e) => handleChange('size', e.target.value)}
                className="input"
              >
                <option value="STARTUP">Startup</option>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Industry and Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="input"
                placeholder="e.g., Technology, Healthcare"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className={`input ${errors.website ? 'input-error' : ''}`}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="company@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
              className="input"
              placeholder="Company address..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="input flex-1"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn btn-outline btn-sm"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
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
                  {company ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                company ? 'Update Company' : 'Create Company'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}