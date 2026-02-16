'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, Task, Stream, User } from '@/types/streams';
import { projectsApi } from '@/lib/api/projects';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import TaskForm from '@/components/gtd/TaskForm';
import TaskItem from '@/components/gtd/TaskItem';
import ProjectForm from '@/components/gtd/ProjectForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  Folder,
  Clock,
  User as UserIcon,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Link,
  Pencil,
  Plus,
  Building2
} from 'lucide-react';

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
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ON_HOLD': return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING': return <Clock className="w-5 h-5" />;
      case 'IN_PROGRESS': return <Play className="w-5 h-5" />;
      case 'ON_HOLD': return <Pause className="w-5 h-5" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5" />;
      case 'CANCELED': return <Square className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
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
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (error || !project) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <Folder className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Project not found</h3>
            <p className="text-slate-600 dark:text-slate-400">{error || 'The project you are looking for does not exist.'}</p>
          </div>
          <button onClick={() => router.back()} className="btn btn-primary">Go Back</button>
        </div>
      </PageShell>
    );
  }

  const daysRemaining = getDaysRemaining(project.endDate);
  const overdue = isOverdue(project.endDate);

  return (
    <PageShell>
      <PageHeader
        title={project.name}
        subtitle={`${project.status.toLowerCase().replace('_', ' ')} - ${project.priority.toLowerCase()} priority`}
        icon={Folder}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Projects', href: '/dashboard/projects' }, { label: project.name }]}
        actions={
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowGraphModal(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Zobacz powiazania">
              <Link className="w-5 h-5" />
            </button>
            <button onClick={() => setShowProjectForm(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors" title="Edit project">
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
              <Folder className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{project.status.toLowerCase().replace('_', ' ')}</span>
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                  {project.priority.toLowerCase()}
                </span>
              </div>
              {project.description && <p className="text-slate-700 dark:text-slate-300 mb-4">{project.description}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {project.stream && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.stream.color || '#6B7280' }} />
                    <a href={`/dashboard/streams/${project.stream.id}`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400">{project.stream.name}</a>
                  </div>
                )}
                {project.assignedTo && (
                  <div className="flex items-center space-x-1"><UserIcon className="w-4 h-4" /><span>{project.assignedTo.firstName} {project.assignedTo.lastName}</span></div>
                )}
                {project.startDate && (
                  <div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>Start: {formatDate(project.startDate)}</span></div>
                )}
                {project.endDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      End: {formatDate(project.endDate)}{overdue && ' (Overdue)'}{!overdue && daysRemaining !== null && daysRemaining > 0 && ` (${daysRemaining} days)`}
                    </span>
                  </div>
                )}
                {project.completedAt && (
                  <div className="flex items-center space-x-1"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /><span>Completed: {formatDate(project.completedAt)}</span></div>
                )}
                {project.createdAt && (
                  <div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>Created: {formatDate(project.createdAt)}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center"><Clock className="w-8 h-8 text-blue-500" /><div className="ml-3"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.stats?.totalTasks || 0}</p></div></div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center"><CheckCircle className="w-8 h-8 text-green-500" /><div className="ml-3"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.stats?.completedTasks || 0}</p></div></div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center"><BarChart3 className="w-8 h-8 text-purple-500" /><div className="ml-3"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Progress</p><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.stats?.progress || 0}%</p></div></div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${overdue ? 'bg-red-100 dark:bg-red-900/30' : daysRemaining && daysRemaining <= 7 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <Calendar className={`w-4 h-4 ${overdue ? 'text-red-600 dark:text-red-400' : daysRemaining && daysRemaining <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{overdue ? 'Overdue by' : project.status === 'COMPLETED' ? 'Completed' : 'Days left'}</p>
                <p className={`text-2xl font-bold ${overdue ? 'text-red-600 dark:text-red-400' : project.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {project.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6 inline" /> : overdue && daysRemaining ? Math.abs(daysRemaining) : daysRemaining || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {project.stats && project.stats.totalTasks > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Progress</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">{project.stats.completedTasks} / {project.stats.totalTasks} tasks completed</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full transition-all duration-300" style={{ width: `${project.stats.progress}%` }} />
            </div>
          </div>
        )}

        {/* Tasks Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center"><Clock className="w-5 h-5 mr-2" />Tasks ({project.tasks?.length || 0})</h2>
              <button onClick={() => setShowTaskForm(true)} className="btn btn-sm btn-primary"><Plus className="w-4 h-4 mr-1" />Add Task</button>
            </div>
          </div>
          <div className="p-6">
            {project.tasks && project.tasks.length > 0 ? (
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} onEdit={() => {}} onDelete={() => {}} onStatusChange={() => {}} onTaskUpdate={loadProject} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p>No tasks in this project</p>
                <button onClick={() => setShowTaskForm(true)} className="mt-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm">Create the first task</button>
              </div>
            )}
          </div>
        </div>

        {/* CRM Context */}
        {(project.relatedCompany || project.relatedContacts?.length || project.relatedDeals?.length) && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center mb-4"><Building2 className="w-5 h-5 mr-2" />CRM Context</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {project.relatedCompany && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Company</h3>
                  <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h4 className="font-medium"><a href={`/dashboard/companies/${project.relatedCompany.id}`} className="text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{project.relatedCompany.name}</a></h4>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{project.relatedCompany.status}</span>
                  </div>
                </div>
              )}
              {project.relatedContacts && project.relatedContacts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Contacts ({project.relatedContacts.length})</h3>
                  <div className="space-y-2">
                    {project.relatedContacts.slice(0, 3).map((contact) => (
                      <div key={contact.id} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <h4 className="text-sm font-medium"><a href={`/dashboard/contacts/${contact.id}`} className="text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{contact.firstName} {contact.lastName}</a></h4>
                        {contact.email && <span className="text-xs text-slate-500 dark:text-slate-400">{contact.email}</span>}
                      </div>
                    ))}
                    {project.relatedContacts.length > 3 && <div className="text-xs text-slate-500 dark:text-slate-400">+{project.relatedContacts.length - 3} more...</div>}
                  </div>
                </div>
              )}
              {project.relatedDeals && project.relatedDeals.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Deals ({project.relatedDeals.length})</h3>
                  <div className="space-y-2">
                    {project.relatedDeals.slice(0, 3).map((deal) => (
                      <div key={deal.id} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <h4 className="text-sm font-medium"><a href={`/dashboard/deals/${deal.id}`} className="text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{deal.title}</a></h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">{deal.stage}</span>
                          {deal.value && <span className="text-green-600 dark:text-green-400 font-medium">${deal.value.toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                    {project.relatedDeals.length > 3 && <div className="text-xs text-slate-500 dark:text-slate-400">+{project.relatedDeals.length - 3} more...</div>}
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
            ...(project.assignedTo ? [{ id: project.assignedTo.id, firstName: project.assignedTo.firstName, lastName: project.assignedTo.lastName, email: project.assignedTo.email, phone: (project.assignedTo as any).phone || undefined }] : []),
            ...(project.createdBy && project.createdBy.id !== project.assignedTo?.id ? [{ id: project.createdBy.id, firstName: project.createdBy.firstName, lastName: project.createdBy.lastName, email: project.createdBy.email, phone: (project.createdBy as any).phone || undefined }] : [])
          ]}
          onCommunicationSent={loadProject}
        />
      </div>

      {showGraphModal && <GraphModal isOpen={showGraphModal} onClose={() => setShowGraphModal(false)} entityId={project.id} entityType="project" entityName={project.name} />}

      {showTaskForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-500/75 dark:bg-slate-900/80" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
              <TaskForm projects={[project]} contexts={[]} streams={[]} onSubmit={async (data) => { console.log('Task data:', data); setShowTaskForm(false); await loadProject(); }} onCancel={() => setShowTaskForm(false)} />
            </div>
          </div>
        </div>
      )}

      {showProjectForm && project && (
        <ProjectForm
          project={project}
          onSubmit={async (data) => { try { await projectsApi.updateProject(project.id, data); toast.success('Project updated successfully'); setShowProjectForm(false); await loadProject(); } catch (error: any) { toast.error('Failed to update project'); console.error('Error updating project:', error); } }}
          onCancel={() => setShowProjectForm(false)}
        />
      )}
    </PageShell>
  );
}
