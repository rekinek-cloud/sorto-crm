'use client';

/**
 * Dashboard - Bento Grid Layout V2
 * Modern light theme dashboard with widgets, AI chat, and real-time stats
 */

import { useDashboardData } from '@/hooks/useDashboardData';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  BentoGrid,
  BentoItem,
  PipelineWidget,
  TasksWidget,
  GoalsTodayWidget,
  AIAssistantWidget,
  WeeklyTrendWidget,
  AIInsightsWidget,
  QuickActionsWidget,
  ActivityFeedWidget
} from '@/components/dashboard-v2';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const {
    stats,
    statsLoading,
    pipeline,
    pipelineLoading,
    goals,
    goalsLoading,
    weeklySummary,
    weeklyLoading,
    weeklyReviewStats,
    weeklyReviewLoading,
    insights,
    insightsLoading,
    activities,
    activitiesLoading,
    chatMessages,
    chatLoading,
    sendChatMessage,
    clearChat,
    isInitialLoading,
    lastRefresh,
    refreshAll
  } = useDashboardData();

  if (isInitialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Ładuję Dashboard...</p>
        </div>
      </div>
    );
  }

  // Navigation handlers
  const handleTasksClick = () => router.push('/dashboard/tasks');
  const handleGoalsClick = () => router.push('/dashboard/goals');
  const handlePipelineClick = () => router.push('/dashboard/deals');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 pt-4 pb-2"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">STREAMS Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Przegląd Twojej aktywności i zadań
          </p>
        </div>

        {/* Status and refresh info */}
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="hidden sm:block text-xs text-slate-400">
              {lastRefresh.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => refreshAll()}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            title="Odśwież dane"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-600 font-medium">AI Online</span>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <BentoGrid className="px-0">
        {/* Row 1: Stats widgets (3 small cards) */}
        <BentoItem>
          <PipelineWidget
            data={pipeline}
            loading={pipelineLoading}
            onClick={handlePipelineClick}
          />
        </BentoItem>

        <BentoItem>
          <TasksWidget
            data={stats}
            loading={statsLoading}
            onClick={handleTasksClick}
          />
        </BentoItem>

        <BentoItem>
          <GoalsTodayWidget
            data={goals}
            loading={goalsLoading}
            onClick={handleGoalsClick}
          />
        </BentoItem>

        {/* Row 2: AI Assistant (larger) + Weekly Trend */}
        <BentoItem colSpan={2}>
          <AIAssistantWidget
            messages={chatMessages}
            loading={chatLoading}
            onSendMessage={sendChatMessage}
            onClear={clearChat}
          />
        </BentoItem>

        <BentoItem>
          <WeeklyTrendWidget
            data={weeklySummary}
            weeklyReviewData={weeklyReviewStats}
            loading={weeklyLoading || weeklyReviewLoading}
          />
        </BentoItem>

        {/* Row 3: Insights, Quick Actions, Activity */}
        <BentoItem>
          <AIInsightsWidget
            insights={insights}
            loading={insightsLoading}
          />
        </BentoItem>

        <BentoItem>
          <QuickActionsWidget
            onCreateTask={() => router.push('/dashboard/tasks?action=create')}
            onCreateDeal={() => router.push('/dashboard/deals?action=create')}
            onCreateMeeting={() => router.push('/dashboard/calendar?action=create')}
            onCreateNote={() => router.push('/dashboard/source?action=create')}
            onCreateContact={() => router.push('/dashboard/contacts?action=create')}
          />
        </BentoItem>

        <BentoItem>
          <ActivityFeedWidget
            activities={activities}
            loading={activitiesLoading}
          />
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
