'use client';

/**
 * Dashboard Dnia — Action-oriented day dashboard
 * Shows what to do today: briefing, focus tasks, source, streams, deals, follow-ups, week progress
 * Manager/Admin/Owner users also see: team activity, productivity, and risks widgets
 */

import { useDayDashboard } from '@/hooks/useDayDashboard';
import { useManagerDashboard } from '@/hooks/useManagerDashboard';
import { useAuth } from '@/lib/auth/context';
import { BentoGrid, BentoItem } from '@/components/dashboard-v2';
import {
  BriefingWidget,
  SourceWidget,
  FocusDayWidget,
  ActiveStreamsWidget,
  UpcomingDealsWidget,
  FollowupsWidget,
  WeekProgressWidget,
  TimelineWidget,
  TeamActivityWidget,
  TeamProductivityWidget,
  RisksWidget,
} from '@/components/dashboard-day';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const MANAGER_ROLES = ['MANAGER', 'ADMIN', 'OWNER'];

export default function DashboardPage() {
  const { data, isLoading, lastRefresh, refresh } = useDayDashboard();
  const { user } = useAuth();
  const isManager = user?.role ? MANAGER_ROLES.includes(user.role) : false;
  const { data: managerData, isLoading: managerLoading } = useManagerDashboard(isManager);

  if (isLoading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Laduje Dashboard Dnia...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500">Nie udalo sie zaladowac danych</p>
          <button onClick={refresh} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
            Sprobuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Refresh indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-end gap-2 px-4 pt-3 pb-0"
      >
        {lastRefresh && (
          <span className="text-xs text-slate-400">
            {lastRefresh.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          onClick={refresh}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Odswiez dane"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      <BentoGrid className="px-4">
        {/* Row 1: Briefing (full width) */}
        <BentoItem colSpan={4}>
          <BriefingWidget
            greeting={data.briefing.greeting}
            date={data.briefing.date}
            summary={data.briefing.summary}
            tip={data.briefing.tip}
            urgencyLevel={data.briefing.urgencyLevel}
            hasSourceItems={data.source.unprocessedCount > 0}
          />
        </BentoItem>

        {/* Row 2: Focus (2) + Source (1) + Week (1) */}
        <BentoItem colSpan={2}>
          <FocusDayWidget tasks={data.focusTasks} />
        </BentoItem>

        <BentoItem>
          <SourceWidget
            unprocessedCount={data.source.unprocessedCount}
            awaitingDecisionCount={data.source.awaitingDecisionCount}
          />
        </BentoItem>

        <BentoItem>
          <WeekProgressWidget
            days={data.weekProgress.days}
            totalCompleted={data.weekProgress.totalCompleted}
            totalCreated={data.weekProgress.totalCreated}
          />
        </BentoItem>

        {/* Row 3: Streams (2) + Followups (1) + Deals (1) */}
        <BentoItem colSpan={2}>
          <ActiveStreamsWidget streams={data.streams} />
        </BentoItem>

        <BentoItem>
          <FollowupsWidget followups={data.followups} />
        </BentoItem>

        <BentoItem>
          <UpcomingDealsWidget deals={data.upcomingDeals} />
        </BentoItem>

        {/* Row 4: Timeline (2) */}
        <BentoItem colSpan={2}>
          <TimelineWidget loading={isLoading} />
        </BentoItem>

        {/* Row 5: Manager widgets (only for MANAGER, ADMIN, OWNER) */}
        {isManager && (
          <>
            <BentoItem colSpan={4}>
              <div className="flex items-center gap-2 mb-0">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Panel Managera
                </h2>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
            </BentoItem>

            <BentoItem colSpan={2}>
              <TeamActivityWidget
                activities={managerData?.teamActivity?.activities || []}
                loading={managerLoading}
              />
            </BentoItem>

            <BentoItem>
              <TeamProductivityWidget
                members={managerData?.productivity?.members || []}
                loading={managerLoading}
              />
            </BentoItem>

            <BentoItem>
              <RisksWidget
                risks={managerData?.risks?.risks || []}
                loading={managerLoading}
              />
            </BentoItem>
          </>
        )}
      </BentoGrid>
    </div>
  );
}
