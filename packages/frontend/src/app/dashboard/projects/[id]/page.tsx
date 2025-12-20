'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, Task, Stream, User } from '@/types/gtd';
import { projectsApi } from '@/lib/api/projects';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import TaskForm from '@/components/gtd/TaskForm';
import TaskItem from '@/components/gtd/TaskItem';
import ProjectForm from '@/components/gtd/ProjectForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import { 
  FolderIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface ProjectWithRelations extends Omit<Project, 'createdById'> {
  stream?: Stream;
  createdBy?: User;
  createdById: string;
  assignedTo?: User;
  tasks?: Task[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
  // CRM Context
  relatedCompany?: {
    id: string;
    name: string;
    status: string;
  };
  relatedContacts?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  }>;
  relatedDeals?: Array<{
    id: string;
    title: string;
    value?: number;
    stage: string;
  }>;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.getProject(projectId);
      setProject(response as unknown as ProjectWithRelations);
    } catch (err: any) {
      console.error('Error loading project:', err);
      setError('Failed to load project details');
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING': return <ClockIcon className="w-5 h-5" />;
      case 'IN_PROGRESS': return <PlayIcon className="w-5 h-5" />;
      case 'ON_HOLD': return <PauseIcon className="w-5 h-5" />;
      case 'COMPLETED': return <CheckCircleIcon className="w-5 h-5" />;
      case 'CANCELED': return <StopIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <FolderIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Project not found</h3>
          <p className="text-gray-600">{error || 'The project you are looking for does not exist.'}</p>
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

  const daysRemaining = getDaysRemaining(project.endDate);
  const overdue = isOverdue(project.endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{project.status.toLowerCase().replace('_', ' ')}</span>
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                  {project.priority.toLowerCase()}
                </span>
              </div>
              
              {project.description && (
                <p className="text-gray-700 mb-4">{project.description}</p>
              )}

              {/* Key Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {project.stream && (
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.stream.color || '#6B7280' }}
                    />
                    <a 
                      href={`/dashboard/streams/${project.stream.id}`} 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {project.stream.name}
                    </a>
                  </div>
                )}
                {project.assignedTo && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{project.assignedTo.firstName} {project.assignedTo.lastName}</span>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Start: {formatDate(project.startDate)}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className={overdue ? 'text-red-600 font-medium' : ''}>
                      End: {formatDate(project.endDate)}
                      {overdue && ' (Overdue)'}
                      {!overdue && daysRemaining !== null && daysRemaining > 0 && ` (${daysRemaining} days)`}
                    </span>
                  </div>
                )}
                {project.completedAt && (
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span>Completed: {formatDate(project.completedAt)}</span>
                  </div>
                )}
                {project.createdAt && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created: {formatDate(project.createdAt)}</span>
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
              onClick={() => setShowProjectForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit project"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{project.stats?.totalTasks || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{project.stats?.completedTasks || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-gray-900">{project.stats?.progress || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              overdue ? 'bg-red-100' : daysRemaining && daysRemaining <= 7 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <CalendarIcon className={`w-4 h-4 ${
                overdue ? 'text-red-600' : daysRemaining && daysRemaining <= 7 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                {overdue ? 'Overdue by' : project.status === 'COMPLETED' ? 'Completed' : 'Days left'}
              </p>
              <p className={`text-2xl font-bold ${
                overdue ? 'text-red-600' : project.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-900'
              }`}>
                {project.status === 'COMPLETED' ? '✓' : overdue && daysRemaining ? Math.abs(daysRemaining) : daysRemaining || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {project.stats && project.stats.totalTasks > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
            <span className="text-sm text-gray-500">
              {project.stats.completedTasks} / {project.stats.totalTasks} tasks completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${project.stats.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Tasks ({project.tasks?.length || 0})
            </h2>
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn btn-sm btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Task
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {project.tasks && project.tasks.length > 0 ? (
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onStatusChange={() => {}}
                  onTaskUpdate={loadProject}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks in this project</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
              >
                Create the first task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CRM Context */}
      {(project.relatedCompany || project.relatedContacts?.length || project.relatedDeals?.length) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <BuildingOfficeIcon className="w-5 h-5 mr-2" />
            CRM Context
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Related Company */}
            {project.relatedCompany && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Company</h3>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">
                    <a 
                      href={`/crm/dashboard/companies/${project.relatedCompany.id}`}
                      className="text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {project.relatedCompany.name}
                    </a>
                  </h4>
                  <span className="text-sm text-gray-500">{project.relatedCompany.status}</span>
                </div>
              </div>
            )}
            
            {/* Related Contacts */}
            {project.relatedContacts && project.relatedContacts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Contacts ({project.relatedContacts.length})</h3>
                <div className="space-y-2">
                  {project.relatedContacts.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="p-2 border rounded-lg">
                      <h4 className="text-sm font-medium">
                        <a 
                          href={`/crm/dashboard/contacts/${contact.id}`}
                          className="text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {contact.firstName} {contact.lastName}
                        </a>
                      </h4>
                      {contact.email && (
                        <span className="text-xs text-gray-500">{contact.email}</span>
                      )}
                    </div>
                  ))}
                  {project.relatedContacts.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{project.relatedContacts.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Related Deals */}
            {project.relatedDeals && project.relatedDeals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Deals ({project.relatedDeals.length})</h3>
                <div className="space-y-2">
                  {project.relatedDeals.slice(0, 3).map((deal) => (
                    <div key={deal.id} className="p-2 border rounded-lg">
                      <h4 className="text-sm font-medium">
                        <a 
                          href={`/crm/dashboard/deals/${deal.id}`}
                          className="text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {deal.title}
                        </a>
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{deal.stage}</span>
                        {deal.value && (
                          <span className="text-green-600 font-medium">
                            ${deal.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {project.relatedDeals.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{project.relatedDeals.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Communication Panel */}
      <CommunicationPanel
        companyId={project.id}
        contacts={[
          ...(project.assignedTo ? [{
            id: project.assignedTo.id,
            firstName: project.assignedTo.firstName,
            lastName: project.assignedTo.lastName,
            email: project.assignedTo.email,
            phone: (project.assignedTo as any).phone || undefined
          }] : []),
          ...(project.createdBy && project.createdBy.id !== project.assignedTo?.id ? [{
            id: project.createdBy.id,
            firstName: project.createdBy.firstName,
            lastName: project.createdBy.lastName,
            email: project.createdBy.email,
            phone: (project.createdBy as any).phone || undefined
          }] : [])
        ]}
        onCommunicationSent={loadProject}
      />

      {/* Graph Modal */}
      {showGraphModal && (
        <GraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          entityId={project.id}
          entityType="project"
          entityName={project.name}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <TaskForm
                projects={[project]}
                contexts={[]}
                streams={[]}
                onSubmit={async (data) => {
                  console.log('Task data:', data);
                  setShowTaskForm(false);
                  await loadProject();
                }}
                onCancel={() => {
                  setShowTaskForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && project && (
        <ProjectForm
          project={project}
          onSubmit={async (data) => {
            try {
              await projectsApi.updateProject(project.id, data);
              toast.success('Project updated successfully');
              setShowProjectForm(false);
              // Reload project data
              await loadProject();
            } catch (error: any) {
              toast.error('Failed to update project');
              console.error('Error updating project:', error);
            }
          }}
          onCancel={() => {
            setShowProjectForm(false);
          }}
        />
      )}
    </div>
  );
}