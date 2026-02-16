'use client';

import { useState } from 'react';
import { workflowApi, WorkflowProcessingDecision } from '@/lib/api/workflow';
import { toast } from 'react-hot-toast';

interface ProcessingModalProps {
  item: {
    id: string;
    type: 'MESSAGE' | 'TASK' | 'IDEA' | 'REQUEST';
    title: string;
    description?: string;
    source: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    urgencyScore?: number;
    estimatedTime?: string;
    contextSuggested?: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

export default function ProcessingModal({ item, onClose, onComplete }: ProcessingModalProps) {
  const [decision, setDecision] = useState<'DO' | 'DEFER' | 'DELEGATE' | 'DELETE' | 'REFERENCE'>('DO');
  const [taskTitle, setTaskTitle] = useState(item.title);
  const [taskDescription, setTaskDescription] = useState(item.description || '');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [context, setContext] = useState(item.contextSuggested || '@computer');
  const [estimatedTime, setEstimatedTime] = useState(item.estimatedTime || '30m');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (decision === 'DELEGATE' && !assignedTo) {
      toast.error('Please specify who to delegate to');
      return;
    }

    const processingDecision: WorkflowProcessingDecision = {
      itemId: item.id,
      decision,
      actionData: {
        taskTitle,
        taskDescription,
        dueDate: dueDate || undefined,
        assignedTo: assignedTo || undefined,
        context: context || undefined,
        estimatedTime: estimatedTime || undefined
      },
      notes: notes || undefined
    };

    try {
      setIsProcessing(true);
      await workflowApi.processInboxItem(item.id, processingDecision);
      
      toast.success(`Item ${decision.toLowerCase()}d successfully`);
      onComplete();
    } catch (error: any) {
      console.error('Error processing item:', error);
      toast.error('Failed to process item');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDecisionForm = () => {
    switch (decision) {
      case 'DO':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (optional)
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="@calls">@calls</option>
                <option value="@computer">@computer</option>
                <option value="@errands">@errands</option>
                <option value="@home">@home</option>
                <option value="@office">@office</option>
                <option value="@waiting">@waiting</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time
              </label>
              <select
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="2h">2 hours</option>
                <option value="4h">4 hours</option>
                <option value="1d">1 day</option>
              </select>
            </div>
          </div>
        );

      case 'DEFER':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When to do this? <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="@calls">@calls</option>
                <option value="@computer">@computer</option>
                <option value="@errands">@errands</option>
                <option value="@home">@home</option>
                <option value="@office">@office</option>
                <option value="@waiting">@waiting</option>
              </select>
            </div>
          </div>
        );

      case 'DELEGATE':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delegate to <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Enter person's name or ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected completion date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case 'DELETE':
        return (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Delete this item?
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This action cannot be undone. The item will be permanently removed from your inbox.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'REFERENCE':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Category
              </label>
              <select
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="General">General</option>
                <option value="Research">Research</option>
                <option value="Documentation">Documentation</option>
                <option value="Ideas">Ideas</option>
                <option value="Contacts">Contacts</option>
                <option value="Resources">Resources</option>
              </select>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    This item will be stored in your reference system for future lookup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Process Inbox Item
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Item Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">
                  {item.source === 'email' ? '📧' : 
                   item.source === 'slack' ? '💬' : '✏️'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Source: {item.source}</span>
                  <span>Priority: {item.priority}</span>
                  {item.urgencyScore && (
                    <span>Urgency: {item.urgencyScore}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* GTD Decision */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What should you do with this item?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'DO', label: 'Do it', color: 'green', icon: '✅' },
                { value: 'DEFER', label: 'Defer it', color: 'yellow', icon: '⏰' },
                { value: 'DELEGATE', label: 'Delegate it', color: 'blue', icon: '👥' },
                { value: 'DELETE', label: 'Delete it', color: 'red', icon: '🗑️' },
                { value: 'REFERENCE', label: 'Reference it', color: 'purple', icon: '📚' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDecision(option.value as any)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    decision === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{option.icon}</div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Decision-specific form */}
          {renderDecisionForm()}

          {/* Notes */}
          {decision !== 'DELETE' && decision !== 'REFERENCE' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add any additional context or notes..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md ${
                decision === 'DELETE'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? 'Processing...' : `${decision.charAt(0) + decision.slice(1).toLowerCase()} Item`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}