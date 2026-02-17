'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { CommunicationHub } from '@/components/ai/CommunicationHub';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Waves,
  Calendar,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Plus,
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building,
  DollarSign,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

interface StreamData {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  dueDate?: string;
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignee?: {
      firstName: string;
      lastName: string;
    };
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    dueDate?: string;
    assignee?: {
      firstName: string;
      lastName: string;
    };
  }>;
  crmContext: {
    companies: Array<{
      id: string;
      name: string;
      status: string;
    }>;
    contacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      company?: string;
    }>;
    deals: Array<{
      id: string;
      title: string;
      value: number;
      stage: string;
      company?: string;
    }>;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    activeDealValue: number;
  };
}

export default function EnhancedStreamPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'projects' | 'crm' | 'communication'>('overview');

  useEffect(() => {
    if (streamId) {
      loadStreamData();
    }
  }, [streamId]);

  const loadStreamData = async () => {
    setLoading(true);
    try {
      // Load stream with all related data
      console.log('Loading stream data for ID:', streamId);
      // Użyj apiClient z automatyczną autoryzacją i interceptorami
      const response = await apiClient.get(`/streams/${streamId}`);
      console.log('Stream data received:', response.data);

      // Sprawdź strukturę danych - może być w response.data lub response.data.data
      const rawStreamData = response.data.data || response.data;
      console.log('Raw stream data:', rawStreamData);

      // Konwertuj dane stream na format oczekiwany przez interface StreamData
      const convertedData: StreamData = {
        id: rawStreamData.id,
        name: rawStreamData.name,
        description: rawStreamData.description || '',
        status: rawStreamData.status || 'ACTIVE',
        progress: 0, // TODO: Calculate from tasks
        dueDate: rawStreamData.dueDate,
        members: [], // TODO: Get from tasks assignees
        tasks: rawStreamData.tasks || [],
        projects: rawStreamData.projects || [],
        crmContext: {
          companies: [],
          contacts: [],
          deals: []
        },
        stats: {
          totalTasks: rawStreamData.tasks?.length || 0,
          completedTasks: rawStreamData.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0,
          overdueTasks: 0, // TODO: Calculate
          activeDealValue: 0 // TODO: Calculate
        }
      };

      setStreamData(convertedData);
    } catch (error: any) {
      console.error('Failed to load stream data:', error);

      // Sprawdź czy to błąd 404 (stream nie znaleziony lub brak dostępu)
      if (error.response?.status === 404) {
        console.error('Stream not found or access denied');
        // Nie przekierowuj automatycznie - pokaż komunikat
        setStreamData(null);
      } else if (error.response?.status === 401) {
        console.error('Unauthorized - user needs to login');
        // Tu ewentualnie redirect do loginu
        window.location.href = '/auth/login/';
      } else {
        console.error('Unexpected error:', error.message);
        setStreamData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'planning': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'completed': return 'bg-slate-500';
      default: return 'bg-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  if (loading) {
    return (
      <PageShell>
        <LoadingSpinner text="Loading stream details..." />
      </PageShell>
    );
  }

  if (!streamData) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <Waves className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Stream nie został znaleziony</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Żądany stream nie został znaleziony lub wystąpił błąd podczas ładowania.</p>
          <button
            onClick={() => window.location.href = '/dashboard/streams/'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrot do Streamow GTD
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => window.location.href = '/dashboard/streams/'}
          className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrot do Streamow GTD
        </button>
      </div>

      {/* Stream Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Waves className="h-8 w-8" />
              <h1 className="text-3xl font-bold">{streamData.name}</h1>
              <Badge className={`${getStatusColor(streamData.status)} text-white`}>
                {streamData.status}
              </Badge>
            </div>
            <p className="text-blue-100 mb-4 max-w-2xl">
              {streamData.description}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{streamData.progress}%</div>
                <div className="text-sm text-blue-200">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{streamData.members.length}</div>
                <div className="text-sm text-blue-200">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{streamData.stats.activeDealValue.toLocaleString()}</div>
                <div className="text-sm text-blue-200">Deal Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {streamData.stats.completedTasks}/{streamData.stats.totalTasks}
                </div>
                <div className="text-sm text-blue-200">Tasks Done</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Client
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send Update
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-blue-800 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${streamData.progress}%` }}
            />
          </div>
        </div>

        {/* Alerts */}
        {streamData.stats.overdueTasks > 0 && (
          <div className="mt-4 p-3 bg-red-600 bg-opacity-20 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-200" />
              <span className="font-medium">
                {streamData.stats.overdueTasks} tasks are overdue
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tasks', label: 'Tasks', icon: CheckCircle },
          { id: 'projects', label: 'Projects', icon: Target },
          { id: 'crm', label: 'CRM Context', icon: Building },
          { id: 'communication', label: 'Communication', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Tasks Overview */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Active Tasks ({streamData.tasks.filter(t => t.status !== 'COMPLETED').length})
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {streamData.tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{task.status}</Badge>
                            <span className={`text-sm ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                → {task.assignee.firstName} {task.assignee.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.dueDate && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Projects Overview */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Projects ({streamData.projects.length})
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {streamData.projects.map((project) => (
                      <div key={project.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            <a
                              href={`/dashboard/projects/${project.id}`}
                              className="text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {project.name}
                            </a>
                          </h4>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="text-slate-900 dark:text-slate-100">{project.progress}%</span>
                          </div>
                          <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 rounded-full h-2 transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        {project.assignee && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            <Users className="h-4 w-4 inline mr-1" />
                            {project.assignee.firstName} {project.assignee.lastName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">All Tasks</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {streamData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded" />
                        )}
                        <div>
                          <h4 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            <a
                              href={`/dashboard/tasks/${task.id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {task.title}
                            </a>
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{task.status}</Badge>
                            <span className={`text-sm ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {task.assignee && (
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6">
              {/* Companies */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Connected Companies
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {streamData.crmContext.companies.map((company) => (
                      <div key={company.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            <a
                              href={`/dashboard/companies/${company.id}`}
                              className="text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {company.name}
                            </a>
                          </h4>
                          <Badge variant="outline">{company.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deals */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Active Deals
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {streamData.crmContext.deals.map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div>
                          <h4 className="font-medium">
                            <a
                              href={`/dashboard/deals/${deal.id}`}
                              className="text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {deal.title}
                            </a>
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{deal.stage}</Badge>
                            {deal.company && (
                              <span className="text-sm text-slate-500 dark:text-slate-400">{deal.company}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            ${deal.value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Connected Contacts
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {streamData.crmContext.contacts.map((contact) => (
                      <div key={contact.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            <a
                              href={`/dashboard/contacts/${contact.id}`}
                              className="text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {contact.firstName} {contact.lastName}
                            </a>
                          </h4>
                          {contact.company && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">{contact.company}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <CommunicationHub streamId={streamId} />
          )}
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-6">
          <AIInsightsPanel streamId={streamId} scope="stream" />

          {/* Quick Stats */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Stats</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {Math.round((streamData.stats.completedTasks / streamData.stats.totalTasks) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Team Members</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{streamData.members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Active Projects</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {streamData.projects.filter(p => p.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Deal Pipeline</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  ${streamData.stats.activeDealValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
