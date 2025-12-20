'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Contact, Company } from '@/types/crm';
import { Task, Context, User, Project } from '@/types/gtd';
import { tasksApi } from '@/lib/api/gtd';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import TaskForm from '@/components/gtd/TaskForm';
import TaskDependencies from '@/components/gtd/TaskDependencies';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import { 
  ClockIcon,
  FolderIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  LinkIcon,
  PencilIcon,
  TagIcon,
  BoltIcon,
  EyeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface TaskWithRelations extends Task {
  project?: Project;
  contact?: Contact;
  company?: Company;
  context?: Context;
  assignedTo?: User;
  dependencies?: Task[];
  dependents?: Task[];
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksApi.getTask(taskId);
      setTask(response as unknown as TaskWithRelations);
    } catch (err: any) {
      console.error('Error loading task:', err);
      setError('Failed to load task details');
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'WAITING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW': return <ClockIcon className="w-5 h-5" />;
      case 'IN_PROGRESS': return <PlayIcon className="w-5 h-5" />;
      case 'WAITING': return <PauseIcon className="w-5 h-5" />;
      case 'COMPLETED': return <CheckCircleIcon className="w-5 h-5" />;
      case 'CANCELED': return <StopIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ClockIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Task not found</h3>
          <p className="text-gray-600">{error || 'The task you are looking for does not exist.'}</p>
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

  const overdue = isOverdue(task.dueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  <span className="ml-1">{task.status.toLowerCase().replace('_', ' ')}</span>
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority.toLowerCase()}
                </span>
              </div>
              
              {task.description && (
                <p className="text-gray-700 mb-4">{task.description}</p>
              )}

              {/* Key Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {task.project && (
                  <div className="flex items-center space-x-1">
                    <FolderIcon className="w-4 h-4" />
                    <a 
                      href={`/crm/dashboard/projects/${task.project.id}`} 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {task.project.name}
                    </a>
                  </div>
                )}
                {task.contact && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <a 
                      href={`/crm/dashboard/contacts/${task.contact.id}`} 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {task.contact.firstName} {task.contact.lastName}
                    </a>
                  </div>
                )}
                {task.company && (
                  <div className="flex items-center space-x-1">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <a 
                      href={`/crm/dashboard/companies/${task.company.id}`} 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {task.company.name}
                    </a>
                  </div>
                )}
                {task.assignedTo && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className={overdue ? 'text-red-600 font-medium' : ''}>
                      Due: {formatDate(task.dueDate)}
                      {overdue && ' (Overdue)'}
                    </span>
                  </div>
                )}
                {task.completedAt && (
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span>Completed: {formatDateTime(task.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGraphModal(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Zobacz powiązania"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit task"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* GTD Properties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <TagIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Context</p>
              <p className="text-lg font-semibold text-gray-900">
                {task.context?.name || 'None'}
              </p>
              {task.context?.description && (
                <p className="text-sm text-gray-600">{task.context.description}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <BoltIcon className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Energy Required</p>
              <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${getEnergyColor(task.energy)}`}>
                {task.energy?.toLowerCase() || 'not set'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <EyeIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Waiting For</p>
              <p className="text-lg font-semibold text-gray-900">
                {task.isWaitingFor ? (task.waitingForNote || 'Yes') : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {task.estimatedHours && (
              <div>
                <label className="text-sm font-medium text-gray-500">Estimated Duration</label>
                <p className="text-gray-900">{task.estimatedHours} hours</p>
              </div>
            )}
            
            {task.actualHours && (
              <div>
                <label className="text-sm font-medium text-gray-500">Actual Duration</label>
                <p className="text-gray-900">{task.actualHours} hours</p>
              </div>
            )}
            
            {task.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
            
            {task.isWaitingFor && task.waitingForNote && (
              <div>
                <label className="text-sm font-medium text-gray-500">Waiting For</label>
                <p className="text-yellow-600 mt-1">{task.waitingForNote}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline / History */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Task Timeline</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {task.createdAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Task Created</p>
                    <p className="text-sm text-gray-500">{formatDateTime(task.createdAt)}</p>
                  </div>
                </div>
              )}
              
              {task.completedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Task Completed</p>
                    <p className="text-sm text-gray-500">{formatDateTime(task.completedAt)}</p>
                  </div>
                </div>
              )}
              
              {!task.completedAt && task.status !== 'COMPLETED' && (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Task in progress</p>
                  <p className="text-sm">Timeline will update as task progresses</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dependencies Section */}
      <div id="dependencies">
        <TaskDependencies 
          taskId={task.id} 
          onDependenciesChange={loadTask}
        />
      </div>

      {/* Communication Panel */}
      <CommunicationPanel
        companyId={task.company?.id || task.id}
        contacts={[
          ...(task.contact ? [{
            id: task.contact.id,
            firstName: task.contact.firstName,
            lastName: task.contact.lastName,
            email: task.contact.email,
            phone: task.contact.phone
          }] : []),
          ...(task.assignedTo ? [{
            id: task.assignedTo.id,
            firstName: task.assignedTo.firstName,
            lastName: task.assignedTo.lastName,
            email: task.assignedTo.email,
            phone: (task.assignedTo as any).phone || undefined
          }] : [])
        ]}
        onCommunicationSent={loadTask}
      />

      {/* Graph Modal */}
      {showGraphModal && (
        <GraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          entityId={task.id}
          entityType="task"
          entityName={task.title}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <TaskForm
                task={task}
                contexts={[]}
                projects={[]}
                streams={[]}
                onSubmit={async (data) => {
                  console.log('Task data:', data);
                  setShowTaskForm(false);
                  await loadTask();
                }}
                onCancel={() => {
                  setShowTaskForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}