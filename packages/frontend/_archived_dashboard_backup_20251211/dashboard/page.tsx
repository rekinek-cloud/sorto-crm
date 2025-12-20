'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Inbox,
  Target,
  Users,
  DollarSign,
  ArrowRight,
  BarChart3,
  Zap,
  Bell,
  ChevronRight,
  Sun,
  Moon,
  CloudSun
} from 'lucide-react';

interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalStreams: number;
  inboxCount: number;
  urgentTasks: number;
  overdueCount: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName?: string;
}

interface SourceItem {
  id: string;
  title: string;
  sourceType: string;
  createdAt: string;
  aiSuggestion?: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [sourceItems, setSourceItems] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Dzień dobry', icon: Sun };
    if (hour < 18) return { text: 'Witaj', icon: CloudSun };
    return { text: 'Dobry wieczór', icon: Moon };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Dzisiaj';
    if (date.toDateString() === tomorrow.toDateString()) return 'Jutro';
    return date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, sourceResponse] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/source?limit=5').catch(() => ({ data: { items: [] } }))
      ]);

      setStats(statsResponse.data.stats);
      setRecentTasks(statsResponse.data.recentTasks || []);
      setSourceItems(sourceResponse.data.items || []);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setStats({
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalProjects: 0,
        activeProjects: 0,
        totalStreams: 0,
        inboxCount: 0,
        urgentTasks: 0,
        overdueCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Przygotowuję raport..." />
      </div>
    );
  }

  if (!user) return null;

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Oblicz priorytety na dziś
  const todaysTasks = recentTasks.filter(t =>
    t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()
  );
  const overdueTasks = recentTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
  );
  const highPriorityTasks = recentTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Executive Summary Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <GreetingIcon className="h-4 w-4" />
                <span>{greeting.text}</span>
                <span className="mx-2">|</span>
                <span>{getTodayFormatted()}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Poranny Briefing
              </h1>
              <p className="text-gray-600 mt-1">
                {user.firstName}, oto najważniejsze informacje na dziś
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Raport wygenerowany</div>
              <div className="text-sm font-medium">{new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* SEKCJA 1: Kluczowe alerty */}
        {(stats?.overdueCount || 0) > 0 || (stats?.urgentTasks || 0) > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Wymaga natychmiastowej uwagi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(stats?.overdueCount || 0) > 0 && (
                <Card className="border-l-4 border-l-red-500 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900">
                          {stats?.overdueCount} zadań po terminie
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          Wymagają natychmiastowego działania lub przełożenia
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                          onClick={() => window.location.href = '/crm/dashboard/tasks?filter=overdue'}
                        >
                          Przejrzyj zaległe
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(stats?.urgentTasks || 0) > 0 && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-900">
                          {stats?.urgentTasks} pilnych zadań
                        </h3>
                        <p className="text-sm text-orange-700 mt-1">
                          Wysokie priorytety wymagające uwagi dziś
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-orange-700 border-orange-300 hover:bg-orange-100"
                          onClick={() => window.location.href = '/crm/dashboard/tasks?filter=urgent'}
                        >
                          Zobacz pilne
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        ) : null}

        {/* SEKCJA 2: Podsumowanie operacyjne */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Podsumowanie operacyjne
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Źródło</p>
                    <p className="text-2xl font-bold">{stats?.inboxCount || 0}</p>
                    <p className="text-xs text-gray-500">elementów do przetworzenia</p>
                  </div>
                  <Inbox className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aktywne zadania</p>
                    <p className="text-2xl font-bold">{stats?.activeTasks || 0}</p>
                    <p className="text-xs text-gray-500">w trakcie realizacji</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Projekty</p>
                    <p className="text-2xl font-bold">{stats?.activeProjects || 0}</p>
                    <p className="text-xs text-gray-500">aktywnych z {stats?.totalProjects || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ukończone</p>
                    <p className="text-2xl font-bold">
                      {stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">{stats?.completedTasks || 0} z {stats?.totalTasks || 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEKCJA 3: Dwie kolumny - Źródło + Dzisiejsze priorytety */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Źródło - nowe elementy */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Nowe w Źródle
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/crm/dashboard/source'}
              >
                Otwórz Źródło
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {sourceItems.length > 0 ? (
                  <div className="divide-y">
                    {sourceItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.sourceType}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString('pl-PL')}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Źródło jest puste</p>
                    <p className="text-sm text-gray-400 mt-1">Wszystko przetworzone</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Dzisiejsze priorytety */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Priorytety na dziś
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/crm/dashboard/day-planner'}
              >
                Day Planner
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {highPriorityTasks.length > 0 || todaysTasks.length > 0 ? (
                  <div className="divide-y">
                    {[...highPriorityTasks, ...todaysTasks]
                      .filter((task, index, self) => self.findIndex(t => t.id === task.id) === index)
                      .slice(0, 5)
                      .map((task) => (
                        <div key={task.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              task.priority === 'HIGH' || task.priority === 'URGENT'
                                ? 'bg-red-500'
                                : task.priority === 'MEDIUM'
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 line-clamp-1">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                                {task.projectName && (
                                  <span className="text-xs text-blue-600">{task.projectName}</span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={task.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {task.status === 'NEW' ? 'Nowe' :
                               task.status === 'IN_PROGRESS' ? 'W toku' :
                               task.status === 'COMPLETED' ? 'Gotowe' : task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-3" />
                    <p className="text-gray-500">Brak pilnych zadań</p>
                    <p className="text-sm text-gray-400 mt-1">Dobra robota!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* SEKCJA 4: Szybkie akcje */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Szybkie akcje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.location.href = '/crm/dashboard/source'}
            >
              <Inbox className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Przetworz Źródło</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.location.href = '/crm/dashboard/day-planner'}
            >
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="text-sm">Zaplanuj dzień</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.location.href = '/crm/dashboard/ai-assistant'}
            >
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="text-sm">AI Assistant</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.location.href = '/crm/dashboard/reviews/weekly'}
            >
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <span className="text-sm">Przegląd tygodnia</span>
            </Button>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400 pt-8 border-t">
          Raport wygenerowany automatycznie | Dane aktualne na {new Date().toLocaleTimeString('pl-PL')}
        </div>
      </div>
    </div>
  );
}
