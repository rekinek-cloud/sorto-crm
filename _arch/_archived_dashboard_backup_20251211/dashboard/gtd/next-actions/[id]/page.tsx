'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  FolderIcon,
  TagIcon,
  BoltIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface NextAction {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  context?: string;
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedTime?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  stream?: {
    id: string;
    name: string;
    color: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function NextActionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const actionId = params.id as string;

  const [action, setAction] = useState<NextAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (actionId) {
      loadAction();
    }
  }, [actionId]);

  const loadAction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/nextactions/${actionId}`);
      setAction(response.data);
    } catch (err: any) {
      console.error('Error loading next action:', err);
      setError('Failed to load next action details');
      toast.error('Failed to load next action details');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnergyColor = (energy?: string) => {
    if (!energy) return 'bg-gray-100 text-gray-800';
    switch (energy) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const handleComplete = async () => {
    try {
      await apiClient.post(`/nextactions/${actionId}/complete`);
      toast.success('Next action completed!');
      await loadAction();
    } catch (error: any) {
      console.error('Error completing action:', error);
      toast.error('Failed to complete action');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Next Action not found</h3>
          <p className="text-gray-600">{error || 'The next action you are looking for does not exist.'}</p>
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

  const overdue = isOverdue(action.dueDate);

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
          <h1 className="text-2xl font-bold text-gray-900">Next Action Details</h1>
          <p className="text-gray-600">GTD Next Action Information</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{action.title}</h2>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(action.status)}`}>
                  {action.status.toLowerCase().replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(action.priority)}`}>
                  {action.priority.toLowerCase()}
                </span>
              </div>
              
              {action.description && (
                <p className="text-gray-700 mb-4">{action.description}</p>
              )}

              {/* Key Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {action.context && (
                  <div className="flex items-center space-x-1">
                    <TagIcon className="w-4 h-4" />
                    <span>@{action.context}</span>
                  </div>
                )}
                {action.energy && (
                  <div className="flex items-center space-x-1">
                    <BoltIcon className="w-4 h-4" />
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getEnergyColor(action.energy)}`}>
                      {action.energy.toLowerCase()} energy
                    </span>
                  </div>
                )}
                {action.estimatedTime && (
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{action.estimatedTime}</span>
                  </div>
                )}
                {action.dueDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className={overdue ? 'text-red-600 font-medium' : ''}>
                      Due: {formatDate(action.dueDate)}
                      {overdue && ' (Overdue)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {action.status !== 'COMPLETED' && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Complete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Business Context */}
      {(action.contact || action.company || action.project || action.stream) && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Business Context</h3>
          </div>
          <div className="p-6 space-y-4">
            {action.contact && (
              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Contact</p>
                  <p className="text-sm text-gray-600">
                    {action.contact.firstName} {action.contact.lastName}
                    {action.contact.email && ` (${action.contact.email})`}
                  </p>
                </div>
              </div>
            )}
            {action.company && (
              <div className="flex items-center space-x-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Company</p>
                  <p className="text-sm text-gray-600">{action.company.name}</p>
                </div>
              </div>
            )}
            {action.project && (
              <div className="flex items-center space-x-3">
                <FolderIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Project</p>
                  <p className="text-sm text-gray-600">{action.project.name}</p>
                </div>
              </div>
            )}
            {action.stream && (
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded`} style={{ backgroundColor: action.stream.color }}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Stream</p>
                  <p className="text-sm text-gray-600">{action.stream.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Created</p>
            <p className="text-sm text-gray-600">{formatDateTime(action.createdAt)}</p>
            {action.createdBy && (
              <p className="text-sm text-gray-500">
                by {action.createdBy.firstName} {action.createdBy.lastName}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Last Updated</p>
            <p className="text-sm text-gray-600">{formatDateTime(action.updatedAt)}</p>
          </div>
          {action.assignedTo && (
            <div>
              <p className="text-sm font-medium text-gray-900">Assigned To</p>
              <p className="text-sm text-gray-600">
                {action.assignedTo.firstName} {action.assignedTo.lastName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}