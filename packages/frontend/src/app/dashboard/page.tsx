'use client';

/**
 * Dashboard - Miejsce spotkań User + AI
 * Poranny Briefing + Dialog z Asystentem STREAMS
 *
 * Filozofia: AI raportuje → User pyta → AI odpowiada → User decyduje
 */

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { KnowledgeChat } from '@/components/ai/KnowledgeChat';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Inbox,
  Target,
  BarChart3,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  CloudSun,
  Brain,
  Sparkles,
  Waves,
  Circle,
  MessageSquare,
  ArrowRight,
  Snowflake
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
  content?: string;
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
  const [showChat, setShowChat] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Dzień dobry', icon: Sun, period: 'rano' };
    if (hour < 18) return { text: 'Witaj', icon: CloudSun, period: 'po południu' };
    return { text: 'Dobry wieczór', icon: Moon, period: 'wieczorem' };
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

  // Generuj AI Briefing
  const generateAIBriefing = () => {
    const messages: string[] = [];

    if ((stats?.overdueCount || 0) > 0) {
      messages.push(`⚠️ Masz ${stats?.overdueCount} zaległych zadań wymagających uwagi.`);
    }
    if ((stats?.inboxCount || 0) > 3) {
      messages.push(`⚪ W Źródle czeka ${stats?.inboxCount} elementów do przetworzenia.`);
    }
    if ((stats?.urgentTasks || 0) > 0) {
      messages.push(`🔴 ${stats?.urgentTasks} pilnych zadań na dziś.`);
    }
    if (messages.length === 0) {
      messages.push(`✅ Wszystko pod kontrolą! Źródło czyste, brak zaległości.`);
    }

    return messages;
  };

  const aiBriefing = generateAIBriefing();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Executive Summary Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-purple-100 text-sm mb-2">
                <GreetingIcon className="h-4 w-4" />
                <span>{greeting.text}</span>
                <span className="mx-2">|</span>
                <span>{getTodayFormatted()}</span>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="h-8 w-8" />
                Poranny Briefing
              </h1>
              <p className="text-purple-100 mt-1">
                {user.firstName}, oto co przygotował dla Ciebie AI Asystent
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                AI STREAMS
              </Badge>
              <div className="text-sm text-purple-200 mt-2">
                {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* SEKCJA 1: AI Briefing - Dialog z AI */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Briefing
            </h2>
            <Button
              variant={showChat ? "default" : "outline"}
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={showChat ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {showChat ? 'Zwiń chat' : 'Porozmawiaj z AI'}
            </Button>
          </div>

          {/* AI Summary Card */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 mb-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                  <Brain className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    🤖 Twój poranny raport, {user.firstName}:
                  </h3>
                  <ul className="space-y-2">
                    {aiBriefing.map((msg, i) => (
                      <li key={i} className="text-gray-700">{msg}</li>
                    ))}
                  </ul>

                  {/* Sugestie AI */}
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm text-purple-700 font-medium mb-2">
                      💡 Sugeruję na {greeting.period}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(stats?.inboxCount || 0) > 0 && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-200"
                          onClick={() => window.location.href = '/dashboard/source'}>
                          ⚪ Przetworz Źródło
                        </Badge>
                      )}
                      {(stats?.urgentTasks || 0) > 0 && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-200"
                          onClick={() => window.location.href = '/dashboard/tasks?filter=urgent'}>
                          🔴 Pilne zadania
                        </Badge>
                      )}
                      <Badge variant="secondary" className="cursor-pointer hover:bg-purple-200"
                        onClick={() => window.location.href = '/dashboard/smart-day-planner'}>
                        📅 Zaplanuj dzień
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rozwijany Chat z AI */}
          {showChat && (
            <div className="animate-in slide-in-from-top duration-300">
              <KnowledgeChat context="general" className="border-purple-200" />
            </div>
          )}
        </section>

        {/* SEKCJA 2: Kluczowe alerty */}
        {((stats?.overdueCount || 0) > 0 || (stats?.urgentTasks || 0) > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
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
                          onClick={() => window.location.href = '/dashboard/tasks?filter=overdue'}
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
                          onClick={() => window.location.href = '/dashboard/tasks?filter=urgent'}
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
        )}

        {/* SEKCJA 3: Podsumowanie operacyjne - STREAMS style */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Waves className="h-4 w-4 text-blue-500" />
            Stan strumieni
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = '/dashboard/source'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">⚪ Źródło</p>
                    <p className="text-2xl font-bold">{stats?.inboxCount || 0}</p>
                    <p className="text-xs text-gray-500">do przetworzenia</p>
                  </div>
                  <Circle className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = '/dashboard/streams'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">🌊 Strumienie</p>
                    <p className="text-2xl font-bold">{stats?.totalStreams || stats?.activeProjects || 0}</p>
                    <p className="text-xs text-gray-500">aktywnych</p>
                  </div>
                  <Waves className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = '/dashboard/tasks'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Zadania</p>
                    <p className="text-2xl font-bold">{stats?.activeTasks || 0}</p>
                    <p className="text-xs text-gray-500">w realizacji</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = '/dashboard/goals'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">🎯 Cele RZUT</p>
                    <p className="text-2xl font-bold">
                      {stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">realizacji</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEKCJA 4: Dwie kolumny - Źródło + Priorytety */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Źródło */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                Nowe w Źródle
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard/source'}
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
                      <div key={item.id} className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => window.location.href = '/dashboard/source'}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {item.title || item.content?.substring(0, 50) || 'Nowy element'}
                            </p>
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
                    <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-3" />
                    <p className="text-gray-500 font-medium">Źródło jest czyste!</p>
                    <p className="text-sm text-gray-400 mt-1">Wszystko przetworzone</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Priorytety na dziś */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Priorytety na dziś
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard/smart-day-planner'}
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
                        <div key={task.id} className="p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => window.location.href = `/crm/dashboard/tasks/${task.id}`}>
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
                    <p className="text-gray-500 font-medium">Brak pilnych zadań</p>
                    <p className="text-sm text-gray-400 mt-1">Dobra robota!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* SEKCJA 5: Szybkie akcje */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Szybkie akcje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-gray-100"
              onClick={() => window.location.href = '/dashboard/source'}
            >
              <Circle className="h-5 w-5 text-gray-600" />
              <span className="text-sm">⚪ Źródło</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50"
              onClick={() => window.location.href = '/dashboard/streams'}
            >
              <Waves className="h-5 w-5 text-blue-600" />
              <span className="text-sm">🌊 Strumienie</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50"
              onClick={() => window.location.href = '/dashboard/ai-assistant'}
            >
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm">🤖 AI Asystent</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50"
              onClick={() => window.location.href = '/dashboard/goals'}
            >
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm">🎯 Cele RZUT</span>
            </Button>
          </div>
        </section>

        {/* Footer - filozofia */}
        <Card className="bg-gray-100 border-0">
          <CardContent className="p-4 text-center text-sm text-gray-500">
            <p className="flex items-center justify-center gap-2">
              <Brain className="h-4 w-4" />
              <strong>AI sugeruje</strong> → <strong>Ty decydujesz</strong> → <strong>AI się uczy</strong>
            </p>
            <p className="text-xs mt-1">
              Raport wygenerowany {new Date().toLocaleTimeString('pl-PL')} | STREAMS Methodology
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
