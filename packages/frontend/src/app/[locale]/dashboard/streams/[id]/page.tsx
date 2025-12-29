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
  MessageSquare
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
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner text="Loading stream details..." />
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Waves className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Stream nie został znaleziony</h2>
          <p className="text-gray-600 mb-4">Żądany stream nie został znaleziony lub wystąpił błąd podczas ładowania.</p>
          <button
            onClick={() => window.location.href = '/dashboard/streams/'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ← Powrót do Streamów GTD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => window.location.href = '/dashboard/streams/'}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Powrót do Streamów GTD
        </button>
      </div>

      {/* Stream Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
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
      <div className="flex gap-2 border-b">
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Active Tasks ({streamData.tasks.filter(t => t.status !== 'COMPLETED').length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {streamData.tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{task.status}</Badge>
                            <span className={`text-sm ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <span className="text-sm text-gray-500">
                                → {task.assignee.firstName} {task.assignee.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.dueDate && (
                          <div className="text-sm text-gray-500">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Projects Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Projects ({streamData.projects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {streamData.projects.map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            <a 
                              href={`/crm/dashboard/projects/${project.id}`}
                              className="text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {project.name}
                            </a>
                          </h4>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 rounded-full h-2 transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        {project.assignee && (
                          <div className="text-sm text-gray-500">
                            <Users className="h-4 w-4 inline mr-1" />
                            {project.assignee.firstName} {project.assignee.lastName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'tasks' && (
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {streamData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                        )}
                        <div>
                          <h4 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                            <a 
                              href={`/crm/dashboard/tasks/${task.id}`}
                              className="text-gray-900 hover:text-blue-600 transition-colors"
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
                          <div className="text-sm font-medium">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="text-sm text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6">
              {/* Companies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Connected Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {streamData.crmContext.companies.map((company) => (
                      <div key={company.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            <a 
                              href={`/crm/dashboard/companies/${company.id}`}
                              className="text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {company.name}
                            </a>
                          </h4>
                          <Badge variant="outline">{company.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Active Deals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {streamData.crmContext.deals.map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            <a 
                              href={`/crm/dashboard/deals/${deal.id}`}
                              className="text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {deal.title}
                            </a>
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{deal.stage}</Badge>
                            {deal.company && (
                              <span className="text-sm text-gray-500">{deal.company}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${deal.value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Connected Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {streamData.crmContext.contacts.map((contact) => (
                      <div key={contact.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            <a 
                              href={`/crm/dashboard/contacts/${contact.id}`}
                              className="text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {contact.firstName} {contact.lastName}
                            </a>
                          </h4>
                          {contact.company && (
                            <span className="text-sm text-gray-500">{contact.company}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="font-bold">
                  {Math.round((streamData.stats.completedTasks / streamData.stats.totalTasks) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Team Members</span>
                <span className="font-bold">{streamData.members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Projects</span>
                <span className="font-bold">
                  {streamData.projects.filter(p => p.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Deal Pipeline</span>
                <span className="font-bold text-green-600">
                  ${streamData.stats.activeDealValue.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}