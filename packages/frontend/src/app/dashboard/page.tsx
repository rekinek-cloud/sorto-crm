'use client';

/**
 * Dashboard - Bento Grid Layout
 * Modern dashboard with widgets, AI chat, and real-time stats
 */

import { useDashboardData } from '@/hooks/useDashboardData';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  BentoGrid,
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
    chatError,
    sendChatMessage,
    clearChat,
    isInitialLoading,
    lastRefresh
  } = useDashboardData();

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Ładuję Dashboard..." />
      </div>
    );
  }

  // Navigation handlers
  const handleTasksClick = () => router.push('/dashboard/tasks');
  const handleGoalsClick = () => router.push('/dashboard/goals');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Przegląd Twojej aktywności i zadań
          </p>
        </div>

        {/* Status and refresh info */}
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="hidden sm:block text-xs text-gray-400">
              Ostatnia aktualizacja: {lastRefresh.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-700 font-medium">AI Online</span>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <BentoGrid>
        {/* Row 1: Stats widgets */}
        <PipelineWidget
          data={pipeline}
          loading={pipelineLoading}
        />

        <TasksWidget
          data={stats}
          loading={statsLoading}
          onClick={handleTasksClick}
        />

        <GoalsTodayWidget
          data={goals}
          loading={goalsLoading}
          onClick={handleGoalsClick}
        />

        {/* Row 2: Main widgets */}
        <AIAssistantWidget
          messages={chatMessages}
          isLoading={chatLoading}
          error={chatError}
          onSendMessage={sendChatMessage}
          onClear={clearChat}
        />

        <WeeklyTrendWidget
          data={weeklySummary}
          weeklyReviewStats={weeklyReviewStats}
          loading={weeklyLoading || weeklyReviewLoading}
        />

        {/* Row 3: Secondary widgets */}
        <AIInsightsWidget
          insights={insights}
          loading={insightsLoading}
        />

        <QuickActionsWidget />

        <ActivityFeedWidget
          activities={activities}
          loading={activitiesLoading}
        />
      </BentoGrid>
    </div>
  );
}
