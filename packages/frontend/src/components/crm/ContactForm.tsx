'use client';

import React, { useState, useEffect } from 'react';
import { Contact, Company } from '@/types/crm';

interface ContactFormProps {
  contact?: Contact;
  companies: Company[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  preSelectedCompanyId?: string;
}

export default function ContactForm({ contact, companies, onSubmit, onCancel, preSelectedCompanyId }: ContactFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    companyId: '',
    notes: '',
    tags: [] as string[],
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        department: contact.department || '',
        companyId: contact.companyId || contact.assignedCompany?.id || '',
        notes: contact.notes || '',
        tags: contact.tags || [],
        socialLinks: {
          linkedin: contact.socialLinks?.linkedin || '',
          twitter: contact.socialLinks?.twitter || '',
          facebook: contact.socialLinks?.facebook || ''
        }
      });
    }
  }, [contact]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Imię jest wymagane';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nazwisko jest wymagane';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Wprowadź prawidłowy adres email';
    }

    // Validate social links if provided
    const urlPattern = /^https?:\/\/.+/;
    if (formData.socialLinks.linkedin && !urlPattern.test(formData.socialLinks.linkedin)) {
      newErrors['socialLinks.linkedin'] = 'Wprowadź prawidłowy URL (zaczynający się od http lub https)';
    }
    if (formData.socialLinks.twitter && !urlPattern.test(formData.socialLinks.twitter)) {
      newErrors['socialLinks.twitter'] = 'Wprowadź prawidłowy URL (zaczynający się od http lub https)';
    }
    if (formData.socialLinks.facebook && !urlPattern.test(formData.socialLinks.facebook)) {
      newErrors['socialLinks.facebook'] = 'Wprowadź prawidłowy URL (zaczynający się od http lub https)';
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
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        position: formData.position.trim() || undefined,
        department: formData.department.trim() || undefined,
        companyId: formData.companyId || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      // Add social links if any are provided
      const socialLinks = Object.fromEntries(
        Object.entries(formData.socialLinks).filter(([_, value]) => value.trim())
      );
      if (Object.keys(socialLinks).length > 0) {
        submitData.socialLinks = socialLinks;
      }

      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Nie udało się zapisać kontaktu. Spróbuj ponownie.' });
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
              {contact ? 'Edytuj kontakt' : 'Dodaj nowy kontakt'}
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
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imię *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`input ${errors.firstName ? 'input-error' : ''}`}
                placeholder="Wprowadź imię..."
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwisko *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`input ${errors.lastName ? 'input-error' : ''}`}
                placeholder="Enter last name..."
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
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
                placeholder="contact@example.com"
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

          {/* Company and Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => handleChange('companyId', e.target.value)}
                className="input"
              >
                <option value="">Select company...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className="input"
                placeholder="e.g., Sales Manager"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="input"
              placeholder="e.g., Sales, Marketing, Engineering"
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Social Links
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleChange('socialLinks.linkedin', e.target.value)}
                  className={`input ${errors['socialLinks.linkedin'] ? 'input-error' : ''}`}
                  placeholder="https://linkedin.com/in/username"
                />
                {errors['socialLinks.linkedin'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['socialLinks.linkedin']}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Twitter</label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleChange('socialLinks.twitter', e.target.value)}
                  className={`input ${errors['socialLinks.twitter'] ? 'input-error' : ''}`}
                  placeholder="https://twitter.com/username"
                />
                {errors['socialLinks.twitter'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['socialLinks.twitter']}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                <input
                  type="url"
                  value={formData.socialLinks.facebook}
                  onChange={(e) => handleChange('socialLinks.facebook', e.target.value)}
                  className={`input ${errors['socialLinks.facebook'] ? 'input-error' : ''}`}
                  placeholder="https://facebook.com/username"
                />
                {errors['socialLinks.facebook'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['socialLinks.facebook']}</p>
                )}
              </div>
            </div>
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
              placeholder="Additional notes about this contact..."
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
                  {contact ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                contact ? 'Update Contact' : 'Create Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}