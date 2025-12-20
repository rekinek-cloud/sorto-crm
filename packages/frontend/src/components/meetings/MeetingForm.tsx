'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Meeting } from '@/lib/api/meetings';
import { meetingsApi } from '@/lib/api/meetings';
import { contactsApi } from '@/lib/api/contacts';
import { XMarkIcon, VideoCameraIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface MeetingFormProps {
  meeting?: Meeting;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function MeetingForm({ meeting, onSubmit, onCancel }: MeetingFormProps) {
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    startTime: meeting?.startTime ? new Date(meeting.startTime).toISOString().slice(0, 16) : '',
    endTime: meeting?.endTime ? new Date(meeting.endTime).toISOString().slice(0, 16) : '',
    location: meeting?.location || '',
    meetingUrl: meeting?.meetingUrl || '',
    agenda: meeting?.agenda || '',
    notes: meeting?.notes || '',
    contactId: meeting?.contactId || '',
    status: meeting?.status || 'SCHEDULED'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [meetingType, setMeetingType] = useState<'online' | 'in-person' | 'none'>(
    meeting?.meetingUrl ? 'online' : meeting?.location ? 'in-person' : 'none'
  );

  // Load contacts for dropdown
  useEffect(() => {
    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const data = await contactsApi.getContacts({ limit: 100 });
        setContacts(data.contacts);
      } catch (error: any) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };
    loadContacts();
  }, []);

  // Auto-set end time when start time changes
  useEffect(() => {
    if (formData.startTime && !formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Add 1 hour
      setFormData(prev => ({
        ...prev,
        endTime: end.toISOString().slice(0, 16)
      }));
    }
  }, [formData.startTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Meeting title is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const timeError = meetingsApi.validateMeetingTime(formData.startTime, formData.endTime);
      if (timeError) {
        newErrors.time = timeError;
      }
    }

    if (meetingType === 'online' && !formData.meetingUrl.trim()) {
      newErrors.meetingUrl = 'Meeting URL is required for online meetings';
    }

    if (meetingType === 'in-person' && !formData.location.trim()) {
      newErrors.location = 'Location is required for in-person meetings';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      location: meetingType === 'in-person' ? formData.location?.trim() : undefined,
      meetingUrl: meetingType === 'online' ? formData.meetingUrl?.trim() : undefined,
      agenda: formData.agenda?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      contactId: formData.contactId || undefined
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

  const handleMeetingTypeChange = (type: 'online' | 'in-person' | 'none') => {
    setMeetingType(type);
    
    // Clear the other type's field
    if (type === 'online') {
      setFormData(prev => ({ ...prev, location: '' }));
    } else if (type === 'in-person') {
      setFormData(prev => ({ ...prev, meetingUrl: '' }));
    } else {
      setFormData(prev => ({ ...prev, location: '', meetingUrl: '' }));
    }
    
    // Clear related errors
    setErrors(prev => ({ 
      ...prev, 
      meetingUrl: '', 
      location: '' 
    }));
  };

  const urlSuggestions = meetingsApi.getUrlSuggestions();

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
            {meeting ? 'Edit Meeting' : 'Schedule New Meeting'}
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
          {/* Meeting Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Weekly Team Standup, Client Presentation"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.endTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Time validation error */}
          {errors.time && (
            <p className="text-sm text-red-600">{errors.time}</p>
          )}

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleMeetingTypeChange('online')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
                  meetingType === 'online'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <VideoCameraIcon className="w-4 h-4" />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => handleMeetingTypeChange('in-person')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
                  meetingType === 'in-person'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MapPinIcon className="w-4 h-4" />
                <span>In-person</span>
              </button>
              <button
                type="button"
                onClick={() => handleMeetingTypeChange('none')}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  meetingType === 'none'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                TBD
              </button>
            </div>
          </div>

          {/* Meeting URL (Online) */}
          {meetingType === 'online' && (
            <div>
              <label htmlFor="meetingUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting URL *
              </label>
              <input
                type="url"
                id="meetingUrl"
                name="meetingUrl"
                value={formData.meetingUrl}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.meetingUrl ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://zoom.us/j/123456789"
              />
              {errors.meetingUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.meetingUrl}</p>
              )}
              
              {/* URL Suggestions */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {urlSuggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, meetingUrl: suggestion.placeholder }))}
                      className="text-xs text-left px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Location (In-person) */}
          {meetingType === 'in-person' && (
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Conference Room A, 123 Main St, Coffee Shop"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>
          )}

          {/* Contact */}
          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting With (Optional)
            </label>
            <select
              id="contactId"
              name="contactId"
              value={formData.contactId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingContacts}
            >
              <option value="">No specific contact</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                  {contact.company && ` (${contact.company.name})`}
                </option>
              ))}
            </select>
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
              placeholder="Brief description of the meeting purpose..."
            />
          </div>

          {/* Agenda */}
          <div>
            <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-2">
              Agenda
            </label>
            <textarea
              id="agenda"
              name="agenda"
              value={formData.agenda}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="1. Opening remarks&#10;2. Project updates&#10;3. Next steps&#10;4. Q&A"
            />
          </div>

          {/* Notes (for editing existing meetings) */}
          {meeting && (
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add notes from the meeting..."
              />
            </div>
          )}

          {/* Status (for editing existing meetings) */}
          {meeting && (
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
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
          )}

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
              {meeting ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}