/**
 * useDashboardData Hook
 * Aggregates all dashboard data with caching and refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  dashboardApi,
  DashboardStats,
  WeeklySummary,
  PipelineForecast,
  GoalsOverview,
  AIInsight,
  Activity,
  ChatMessage
} from '@/lib/api/dashboardApi';

interface UseDashboardDataReturn {
  // Stats
  stats: DashboardStats | null;
  statsLoading: boolean;

  // Weekly Summary
  weeklySummary: WeeklySummary | null;
  weeklyLoading: boolean;

  // Pipeline
  pipeline: PipelineForecast | null;
  pipelineLoading: boolean;

  // Goals
  goals: GoalsOverview | null;
  goalsLoading: boolean;

  // AI Insights
  insights: AIInsight[];
  insightsLoading: boolean;

  // Activities
  activities: Activity[];
  activitiesLoading: boolean;

  // Weekly Review Stats (for chart)
  weeklyReviewStats: {
    burndownData: Array<{ week: string; completed: number; created: number }>;
    summary: {
      totalWeeks: number;
      averageTasksCompleted: number;
      reviewCompletionRate: number;
    };
  } | null;
  weeklyReviewLoading: boolean;

  // AI Chat State
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatError: string | null;
  conversationId: string | null;

  // Actions
  refreshAll: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshPipeline: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  sendChatMessage: (query: string) => Promise<void>;
  clearChat: () => void;

  // Global state
  isInitialLoading: boolean;
  lastRefresh: Date | null;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Witaj! 🤖 Jestem Twoim asystentem STREAMS.

Zapytaj mnie o:
• Twoje zadania i projekty
• Deale i kontakty w CRM
• Strumienie
• Statystyki i raporty

**Jak mogę Ci pomóc?**`,
  timestamp: new Date()
};

export function useDashboardData(): UseDashboardDataReturn {
  const { user, organization } = useAuth();

  // Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Weekly Summary State
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  // Pipeline State
  const [pipeline, setPipeline] = useState<PipelineForecast | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  // Goals State
  const [goals, setGoals] = useState<GoalsOverview | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(true);

  // Insights State
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Activities State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Weekly Review Stats
  const [weeklyReviewStats, setWeeklyReviewStats] = useState<{
    burndownData: Array<{ week: string; completed: number; created: number }>;
    summary: { totalWeeks: number; averageTasksCompleted: number; reviewCompletionRate: number };
  } | null>(null);
  const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(true);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Global State
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs
  const userRef = useRef(user);
  const orgRef = useRef(organization);
  userRef.current = user;
  orgRef.current = organization;

  // Computed
  const isInitialLoading = statsLoading && pipelineLoading && goalsLoading;

  // ============= LOAD FUNCTIONS =============

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await dashboardApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadWeeklySummary = useCallback(async () => {
    setWeeklyLoading(true);
    try {
      const data = await dashboardApi.getWeeklySummary();
      setWeeklySummary(data);
    } catch (error) {
      console.error('Failed to load weekly summary:', error);
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  const loadPipeline = useCallback(async () => {
    setPipelineLoading(true);
    try {
      const data = await dashboardApi.getPipelineForecast();
      setPipeline(data);
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    setGoalsLoading(true);
    try {
      const data = await dashboardApi.getGoalsOverview();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const data = await dashboardApi.getAIInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const data = await dashboardApi.getRecentActivities(5);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const loadWeeklyReviewStats = useCallback(async () => {
    setWeeklyReviewLoading(true);
    try {
      const data = await dashboardApi.getWeeklyReviewStats();
      setWeeklyReviewStats(data);
    } catch (error) {
      console.error('Failed to load weekly review stats:', error);
    } finally {
      setWeeklyReviewLoading(false);
    }
  }, []);

  // ============= REFRESH FUNCTIONS =============

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadStats(),
      loadWeeklySummary(),
      loadPipeline(),
      loadGoals(),
      loadInsights(),
      loadActivities(),
      loadWeeklyReviewStats()
    ]);
    setLastRefresh(new Date());
  }, [loadStats, loadWeeklySummary, loadPipeline, loadGoals, loadInsights, loadActivities, loadWeeklyReviewStats]);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  const refreshPipeline = useCallback(async () => {
    await loadPipeline();
  }, [loadPipeline]);

  const refreshGoals = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  const refreshInsights = useCallback(async () => {
    await loadInsights();
  }, [loadInsights]);

  const refreshActivities = useCallback(async () => {
    await loadActivities();
  }, [loadActivities]);

  // ============= CHAT FUNCTIONS =============

  const sendChatMessage = useCallback(async (query: string) => {
    if (!userRef.current?.id || !orgRef.current?.id) {
      setChatError('Nie jesteś zalogowany');
      return;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuery,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);
    setChatError(null);

    try {
      const response = await dashboardApi.sendAIQuery({
        query: trimmedQuery,
        userId: userRef.current.id,
        organizationId: orgRef.current.id,
        conversationId
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'Brak odpowiedzi',
        timestamp: new Date(),
        sources: response.sources
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send chat message:', error);
      setChatError(error.message || 'Wystąpił błąd');

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  }, [conversationId]);

  const clearChat = useCallback(() => {
    setChatMessages([WELCOME_MESSAGE]);
    setConversationId(null);
    setChatError(null);
  }, []);

  // ============= INITIAL LOAD =============

  useEffect(() => {
    if (organization?.id) {
      refreshAll();
    }
  }, [organization?.id]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!organization?.id) return;

    const interval = setInterval(() => {
      refreshAll();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [organization?.id, refreshAll]);

  // ============= RETURN =============

  return {
    // Stats
    stats,
    statsLoading,

    // Weekly Summary
    weeklySummary,
    weeklyLoading,

    // Pipeline
    pipeline,
    pipelineLoading,

    // Goals
    goals,
    goalsLoading,

    // Insights
    insights,
    insightsLoading,

    // Activities
    activities,
    activitiesLoading,

    // Weekly Review
    weeklyReviewStats,
    weeklyReviewLoading,

    // Chat
    chatMessages,
    chatLoading,
    chatError,
    conversationId,

    // Actions
    refreshAll,
    refreshStats,
    refreshPipeline,
    refreshGoals,
    refreshInsights,
    refreshActivities,
    sendChatMessage,
    clearChat,

    // Global
    isInitialLoading,
    lastRefresh
  };
}

export default useDashboardData;
