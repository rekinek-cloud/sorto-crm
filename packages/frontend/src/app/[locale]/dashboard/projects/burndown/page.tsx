'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import Cookies from 'js-cookie';
import { projectsApi } from '@/lib/api/projects';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  LineChart,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  tasks: Task[];
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  company?: {
    name: string;
  };
  stream?: {
    name: string;
    color: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedTime?: string;
  actualTime?: number;
  dueDate?: string;
  completedAt?: string;
  storyPoints?: number;
}

interface BurndownData {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  totalStoryPoints: number;
  completedToday: number;
}

export default function ProjectBurndownPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !Cookies.get('access_token'))) {
      window.location.href = '/auth/login/';
    }
  }, [isLoading, isAuthenticated]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      generateBurndownData(selectedProject);
    }
  }, [selectedProject, timeRange]);

  const loadProjects = async () => {
    if (!isAuthenticated || !Cookies.get('access_token')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const projectsData = await projectsApi.getProjects({
        status: 'IN_PROGRESS',
        limit: 100
      });

      const projectsWithTasks = (projectsData as any).projects || projectsData || [];
      setProjects(projectsWithTasks);

      if (projectsWithTasks.length > 0) {
        setSelectedProject(projectsWithTasks[0]);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('Nie udalo sie zaladowac projektow');
    } finally {
      setLoading(false);
    }
  };

  const generateBurndownData = (project: Project) => {
    const now = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = project.endDate ? new Date(project.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalStoryPoints = project.tasks.reduce((sum, task) => {
      if (task.storyPoints) return sum + task.storyPoints;
      if (task.estimatedTime) {
        const hours = parseEstimatedTime(task.estimatedTime);
        return sum + Math.max(1, Math.round(hours));
      }
      return sum + 2;
    }, 0);

    const data: BurndownData[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().split('T')[0];

      const idealRemaining = totalStoryPoints * (1 - i / daysDiff);

      const completedStoryPoints = project.tasks
        .filter(task => {
          if (task.status !== 'COMPLETED' || !task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate <= currentDate;
        })
        .reduce((sum, task) => {
          if (task.storyPoints) return sum + task.storyPoints;
          if (task.estimatedTime) {
            const hours = parseEstimatedTime(task.estimatedTime);
            return sum + Math.max(1, Math.round(hours));
          }
          return sum + 2;
        }, 0);

      const actualRemaining = totalStoryPoints - completedStoryPoints;

      const completedToday = project.tasks
        .filter(task => {
          if (task.status !== 'COMPLETED' || !task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate.toDateString() === currentDate.toDateString();
        }).length;

      data.push({
        date: dateStr,
        idealRemaining: Math.max(0, idealRemaining),
        actualRemaining: Math.max(0, actualRemaining),
        totalStoryPoints,
        completedToday
      });
    }

    setBurndownData(data);
  };

  const parseEstimatedTime = (estimatedTime: string): number => {
    const match = estimatedTime.match(/(\d+(?:\.\d+)?)(h|hour|hours|min|minutes?)/i);
    if (!match) return 1;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('h')) return value;
    if (unit.startsWith('min')) return value / 60;
    return 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 dark:text-red-400';
      case 'HIGH': return 'text-orange-600 dark:text-orange-400';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
      case 'LOW': return 'text-green-600 dark:text-green-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const calculateProjectStats = (project: Project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalStoryPoints = project.tasks.reduce((sum, task) => {
      if (task.storyPoints) return sum + task.storyPoints;
      if (task.estimatedTime) {
        const hours = parseEstimatedTime(task.estimatedTime);
        return sum + Math.max(1, Math.round(hours));
      }
      return sum + 2;
    }, 0);

    const completedStoryPoints = project.tasks
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, task) => {
        if (task.storyPoints) return sum + task.storyPoints;
        if (task.estimatedTime) {
          const hours = parseEstimatedTime(task.estimatedTime);
          return sum + Math.max(1, Math.round(hours));
        }
        return sum + 2;
      }, 0);

    return {
      totalTasks,
      completedTasks,
      progress,
      totalStoryPoints,
      completedStoryPoints,
      remainingStoryPoints: totalStoryPoints - completedStoryPoints
    };
  };

  const getProgressIndicator = () => {
    if (!selectedProject || burndownData.length === 0) return null;

    const latestData = burndownData[burndownData.length - 1];
    const isAhead = latestData.actualRemaining < latestData.idealRemaining;
    const isBehind = latestData.actualRemaining > latestData.idealRemaining;

    if (isAhead) {
      return {
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        text: 'Przed harmonogramem'
      };
    } else if (isBehind) {
      return {
        icon: TrendingDown,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        text: 'Za harmonogramem'
      };
    } else {
      return {
        icon: Minus,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'Zgodnie z planem'
      };
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageShell>
    );
  }

  const stats = selectedProject ? calculateProjectStats(selectedProject) : null;
  const progressIndicator = getProgressIndicator();

  return (
    <PageShell>
      <PageHeader
        title="Burndown Chart"
        subtitle="Sledzenie postepu projektow i predkosci realizacji"
        icon={LineChart}
        iconColor="text-blue-600"
        actions={
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Powrot do projektow
          </button>
        }
      />

      <div className="space-y-6">
        {/* Project Selector */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Wybierz projekt</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zakres czasu:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="week">Ostatni tydzien</option>
                <option value="month">Ostatni miesiac</option>
                <option value="quarter">Ostatni kwartal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedProject?.id === project.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">{project.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Zadania:</span>
                    <span>{project.tasks.filter(t => t.status === 'COMPLETED').length}/{project.tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Postep:</span>
                    <span>{Math.round((project.tasks.filter(t => t.status === 'COMPLETED').length / project.tasks.length) * 100 || 0)}%</span>
                  </div>
                  {project.assignedTo && (
                    <div className="flex justify-between">
                      <span>Przypisany:</span>
                      <span>{project.assignedTo.firstName} {project.assignedTo.lastName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedProject && (
          <>
            {/* Project Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lacznie zadan</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats?.totalTasks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ukonczone</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats?.completedTasks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Story Points</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats?.completedStoryPoints}/{stats?.totalStoryPoints}</p>
                  </div>
                </div>
              </div>

              {progressIndicator && (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${progressIndicator.bgColor}`}>
                      <progressIndicator.icon className={`w-6 h-6 ${progressIndicator.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</p>
                      <p className={`text-sm font-semibold ${progressIndicator.color}`}>{progressIndicator.text}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Burndown Chart */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Burndown Chart - {selectedProject.name}
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Idealny</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Rzeczywisty</span>
                  </div>
                </div>
              </div>

              {burndownData.length > 0 ? (
                <div className="relative h-96">
                  <svg className="w-full h-full" viewBox="0 0 800 400">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <g key={i}>
                        <line
                          x1="50"
                          y1={50 + i * 70}
                          x2="750"
                          y2={50 + i * 70}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-700"
                          strokeWidth="1"
                        />
                        <text
                          x="40"
                          y={55 + i * 70}
                          fontSize="12"
                          fill="currentColor"
                          className="text-slate-500 dark:text-slate-400"
                          textAnchor="end"
                        >
                          {Math.round((stats?.totalStoryPoints || 0) * (1 - i * 0.25))}
                        </text>
                      </g>
                    ))}

                    {/* Ideal line */}
                    <polyline
                      points={burndownData
                        .map((point, index) => {
                          const x = 50 + (index / (burndownData.length - 1)) * 700;
                          const y = 50 + (1 - point.idealRemaining / (stats?.totalStoryPoints || 1)) * 280;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />

                    {/* Actual line */}
                    <polyline
                      points={burndownData
                        .map((point, index) => {
                          const x = 50 + (index / (burndownData.length - 1)) * 700;
                          const y = 50 + (1 - point.actualRemaining / (stats?.totalStoryPoints || 1)) * 280;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                    />

                    {/* Data points */}
                    {burndownData.map((point, index) => {
                      const x = 50 + (index / (burndownData.length - 1)) * 700;
                      const y = 50 + (1 - point.actualRemaining / (stats?.totalStoryPoints || 1)) * 280;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#10b981"
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    })}

                    {/* X-axis labels */}
                    {burndownData.filter((_, i) => i % Math.ceil(burndownData.length / 10) === 0).map((point, index) => {
                      const actualIndex = index * Math.ceil(burndownData.length / 10);
                      const x = 50 + (actualIndex / (burndownData.length - 1)) * 700;
                      return (
                        <text
                          key={index}
                          x={x}
                          y="370"
                          fontSize="10"
                          fill="currentColor"
                          className="text-slate-500 dark:text-slate-400"
                          textAnchor="middle"
                        >
                          {new Date(point.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  Brak danych dla wykresu burndown
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak aktywnych projektow</h3>
            <p className="text-slate-600 dark:text-slate-400">Utworz projekt z zadaniami, aby zobaczyc wykresy burndown</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
