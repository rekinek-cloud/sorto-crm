'use client';

import React, { useState, useEffect } from 'react';
import { Task, Context, Project, Stream, CreateTaskRequest, UpdateTaskRequest } from '@/types/gtd';

interface TaskFormUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface TaskFormProps {
  task?: Task;
  contexts: Context[];
  projects: Project[];
  streams: Stream[];
  users?: TaskFormUser[];
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskForm({
  task,
  contexts,
  projects,
  streams,
  users = [],
  onSubmit,
  onCancel,
  isLoading
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status: 'NEW' as 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELED',
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    contextId: '',
    projectId: '',
    streamId: '',
    assignedToId: '',
    energy: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    isWaitingFor: false,
    waitingForNote: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'NEW',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        estimatedHours: task.estimatedHours?.toString() || '',
        actualHours: task.actualHours?.toString() || '',
        contextId: task.contextId || '',
        projectId: task.projectId || '',
        streamId: task.streamId || '',
        assignedToId: task.assignedToId || '',
        energy: task.energy || 'MEDIUM',
        isWaitingFor: task.isWaitingFor || false,
        waitingForNote: task.waitingForNote || ''
      });
    }
  }, [task]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tytuł jest wymagany';
    }

    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Musi być prawidłową liczbą';
    }

    if (formData.actualHours && isNaN(Number(formData.actualHours))) {
      newErrors.actualHours = 'Musi być prawidłową liczbą';
    }

    if (formData.isWaitingFor && !formData.waitingForNote.trim()) {
      newErrors.waitingForNote = 'Notatka oczekiwania jest wymagana gdy zadanie oczekuje';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Prepare data for submission
    const submitData: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
      contextId: formData.contextId || undefined,
      projectId: formData.projectId || undefined,
      streamId: formData.streamId || undefined,
      assignedToId: formData.assignedToId || undefined,
      energy: formData.energy,
      isWaitingFor: formData.isWaitingFor,
      waitingForNote: formData.isWaitingFor ? formData.waitingForNote.trim() : undefined
    };

    // Add update-specific fields
    if (task) {
      submitData.status = formData.status;
      submitData.actualHours = formData.actualHours ? Number(formData.actualHours) : undefined;
    }

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {task ? 'Edytuj zadanie' : 'Utwórz nowe zadanie'}
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
              Tytuł *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Wprowadź tytuł zadania..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="input"
              placeholder="Opisz zadanie..."
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorytet
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="input"
              >
                <option value="LOW">Niski</option>
                <option value="MEDIUM">Średni</option>
                <option value="HIGH">Wysoki</option>
                <option value="URGENT">Pilny</option>
              </select>
            </div>

            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="input"
                >
                  <option value="NEW">Nowe</option>
                  <option value="IN_PROGRESS">W trakcie</option>
                  <option value="WAITING">Oczekuje</option>
                  <option value="COMPLETED">Ukończone</option>
                  <option value="CANCELED">Anulowane</option>
                </select>
              </div>
            )}
          </div>

          {/* Context and Energy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontekst
              </label>
              <select
                value={formData.contextId}
                onChange={(e) => handleChange('contextId', e.target.value)}
                className="input"
              >
                <option value="">Wybierz kontekst...</option>
                {contexts.map(context => (
                  <option key={context.id} value={context.id}>
                    {context.icon} {context.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poziom energii
              </label>
              <select
                value={formData.energy}
                onChange={(e) => handleChange('energy', e.target.value)}
                className="input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Project and Stream */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                className="input"
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stream
              </label>
              <select
                value={formData.streamId}
                onChange={(e) => handleChange('streamId', e.target.value)}
                className="input"
              >
                <option value="">Select stream...</option>
                {streams.map(stream => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Przypisz do
              </label>
              <select
                value={formData.assignedToId}
                onChange={(e) => handleChange('assignedToId', e.target.value)}
                className="input"
              >
                <option value="">Nieprzypisane</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="input"
            />
          </div>

          {/* Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', e.target.value)}
                className={`input ${errors.estimatedHours ? 'input-error' : ''}`}
                placeholder="0"
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>
              )}
            </div>

            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.actualHours}
                  onChange={(e) => handleChange('actualHours', e.target.value)}
                  className={`input ${errors.actualHours ? 'input-error' : ''}`}
                  placeholder="0"
                />
                {errors.actualHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.actualHours}</p>
                )}
              </div>
            )}
          </div>

          {/* Waiting For */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isWaitingFor"
                checked={formData.isWaitingFor}
                onChange={(e) => handleChange('isWaitingFor', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isWaitingFor" className="ml-2 block text-sm text-gray-900">
                Waiting for someone/something
              </label>
            </div>

            {formData.isWaitingFor && (
              <div className="mt-2">
                <input
                  type="text"
                  value={formData.waitingForNote}
                  onChange={(e) => handleChange('waitingForNote', e.target.value)}
                  className={`input ${errors.waitingForNote ? 'input-error' : ''}`}
                  placeholder="What are you waiting for?"
                />
                {errors.waitingForNote && (
                  <p className="mt-1 text-sm text-red-600">{errors.waitingForNote}</p>
                )}
              </div>
            )}
          </div>

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
                  {task ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}