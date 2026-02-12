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
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  Clock,
  Folder,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Link,
  Pencil,
  Tag,
  Zap,
  Eye,
  Building2
} from 'lucide-react';

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
      case 'NEW': return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'WAITING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getEnergyColor = (energy?: string) => {
    if (!energy) return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
    switch (energy) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW': return <Clock className="w-5 h-5" />;
      case 'IN_PROGRESS': return <Play className="w-5 h-5" />;
      case 'WAITING': return <Pause className="w-5 h-5" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5" />;
      case 'CANCELED': return <Square className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
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
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (error || !task) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Task not found</h3>
            <p className="text-slate-600 dark:text-slate-400">{error || 'The task you are looking for does not exist.'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </PageShell>
    );
  }

  const overdue = isOverdue(task.dueDate);

  return (
    <PageShell>
      <PageHeader
        title={task.title}
        subtitle={`${task.status.toLowerCase().replace('_', ' ')} - ${task.priority.toLowerCase()} priority`}
        icon={Clock}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Tasks', href: '/dashboard/tasks' }, { label: task.title }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGraphModal(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Zobacz powiazania"
            >
              <Link className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Edit task"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  <span className="ml-1">{task.status.toLowerCase().replace('_', ' ')}</span>
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority.toLowerCase()}
                </span>
              </div>

              {task.description && (
                <p className="text-slate-700 dark:text-slate-300 mb-4">{task.description}</p>
              )}

              {/* Key Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {task.project && (
                  <div className="flex items-center space-x-1">
                    <Folder className="w-4 h-4" />
                    <a
                      href={`/dashboard/projects/${task.project.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {task.project.name}
                    </a>
                  </div>
                )}
                {task.contact && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <a
                      href={`/dashboard/contacts/${task.contact.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {task.contact.firstName} {task.contact.lastName}
                    </a>
                  </div>
                )}
                {task.company && (
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-4 h-4" />
                    <a
                      href={`/dashboard/companies/${task.company.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
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
                    <Calendar className="w-4 h-4" />
                    <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      Due: {formatDate(task.dueDate)}
                      {overdue && ' (Overdue)'}
                    </span>
                  </div>
                )}
                {task.completedAt && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>Completed: {formatDateTime(task.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GTD Properties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Context</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {task.context?.name || 'None'}
                </p>
                {task.context?.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{task.context.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Energy Required</p>
                <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${getEnergyColor(task.energy)}`}>
                  {task.energy?.toLowerCase() || 'not set'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Waiting For</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {task.isWaitingFor ? (task.waitingForNote || 'Yes') : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Task Details</h2>
            </div>

            <div className="p-6 space-y-4">
              {task.estimatedHours && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Duration</label>
                  <p className="text-slate-900 dark:text-slate-100">{task.estimatedHours} hours</p>
                </div>
              )}

              {task.actualHours && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Actual Duration</label>
                  <p className="text-slate-900 dark:text-slate-100">{task.actualHours} hours</p>
                </div>
              )}

              {task.description && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</label>
                  <p className="text-slate-900 dark:text-slate-100 mt-1 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {task.isWaitingFor && task.waitingForNote && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Waiting For</label>
                  <p className="text-yellow-600 dark:text-yellow-400 mt-1">{task.waitingForNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline / History */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Task Timeline</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {task.createdAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Task Created</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(task.createdAt)}</p>
                    </div>
                  </div>
                )}

                {task.completedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Task Completed</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(task.completedAt)}</p>
                    </div>
                  </div>
                )}

                {!task.completedAt && task.status !== 'COMPLETED' && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
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
      </div>

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
            <div className="fixed inset-0 transition-opacity bg-slate-500/75 dark:bg-slate-900/80" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
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
    </PageShell>
  );
}
