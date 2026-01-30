'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gtdApi } from '@/lib/api/gtd';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface WaitingForItem {
  id: string;
  description: string;
  waitingForWho: string;
  sinceDate: string;
  expectedResponseDate?: string;
  followUpDate?: string;
  status: 'PENDING' | 'RESPONDED' | 'OVERDUE' | 'CANCELED';
  notes?: string;
  organizationId: string;
  createdById: string;
  taskId?: string;
  task?: {
    id: string;
    title: string;
    status: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function WaitingForDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<WaitingForItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [newExpectedDate, setNewExpectedDate] = useState('');

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get waiting for items and find the specific one
      const items = await gtdApi.getWaitingFor({});
      const foundItem = items.find((i: WaitingForItem) => i.id === itemId);
      if (foundItem) {
        setItem(foundItem);
      } else {
        setError('Waiting for item not found');
      }
    } catch (err: any) {
      console.error('Error loading waiting for item:', err);
      setError('Failed to load waiting for item details');
      toast.error('Failed to load waiting for item details');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = () => {
    setFollowUpModalOpen(true);
    setFollowUpNotes('');
    setNewExpectedDate(item?.expectedResponseDate ? item.expectedResponseDate.split('T')[0] : '');
  };

  const submitFollowUp = async () => {
    if (!item) return;

    try {
      await gtdApi.followUp(item.id, {
        notes: followUpNotes,
        newExpectedDate: newExpectedDate
      });
      
      toast.success('Follow-up recorded');
      setFollowUpModalOpen(false);
      await loadItem();
    } catch (error: any) {
      console.error('Error recording follow-up:', error);
      toast.error('Failed to record follow-up');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'RESPONDED': return 'text-blue-600 bg-blue-100';
      case 'OVERDUE': return 'text-red-600 bg-red-100';
      case 'CANCELED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isOverdue = (expectedDate?: string) => {
    if (!expectedDate) return false;
    return new Date(expectedDate) < new Date();
  };

  const getDaysWaiting = (sinceDate: string) => {
    const since = new Date(sinceDate);
    const now = new Date();
    const diffTime = now.getTime() - since.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Waiting For item not found</h3>
          <p className="text-gray-600">{error || 'The waiting for item you are looking for does not exist.'}</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="btn btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const overdue = isOverdue(item.expectedResponseDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waiting For Details</h1>
          <p className="text-gray-600">GTD Waiting For Item Information</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{item.description}</h2>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                  {item.status.replace('_', ' ')}
                </span>
                {overdue && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                    OVERDUE
                  </span>
                )}
              </div>

              {/* Key Information */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>Waiting for: <span className="font-medium">{item.waitingForWho}</span></span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Since: {formatDate(item.sinceDate)}</span>
                  </span>
                  <span className="text-orange-600 font-medium">
                    Waiting {getDaysWaiting(item.sinceDate)} days
                  </span>
                </div>
                
                {item.expectedResponseDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className={overdue ? 'text-red-600 font-medium' : ''}>
                      Expected response: {formatDate(item.expectedResponseDate)}
                      {overdue && ' (Overdue)'}
                    </span>
                  </div>
                )}
                
                {item.followUpDate && (
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>Last follow-up: {formatDate(item.followUpDate)}</span>
                  </div>
                )}
              </div>

              {item.task && (
                <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-md">
                  <p><strong>Related task:</strong> {item.task.title}</p>
                  <p><strong>Task status:</strong> {item.task.status}</p>
                </div>
              )}

              {item.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <p className="font-medium mb-1">Notes:</p>
                  <p className="whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {(item.status === 'PENDING' || item.status === 'OVERDUE') && (
              <button
                onClick={handleFollowUp}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Follow Up</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Created</p>
            <p className="text-sm text-gray-600">{formatDateTime(item.createdAt)}</p>
            <p className="text-sm text-gray-500">
              by {item.createdBy.firstName} {item.createdBy.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Last Updated</p>
            <p className="text-sm text-gray-600">{formatDateTime(item.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      {followUpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Follow Up
                </h3>
                <button
                  onClick={() => setFollowUpModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Following up on: <span className="font-medium">{item.description}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    With: <span className="font-medium">{item.waitingForWho}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Notes
                  </label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="What happened in the follow-up? Any updates?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Expected Response Date (optional)
                  </label>
                  <input
                    type="date"
                    value={newExpectedDate}
                    onChange={(e) => setNewExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setFollowUpModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFollowUp}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Record Follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}