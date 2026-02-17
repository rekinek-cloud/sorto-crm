'use client';

import React from 'react';
import { Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface TeamActivity {
  type: 'TASK_COMPLETED' | 'DEAL_UPDATED';
  userId: string;
  userName: string;
  title: string;
  timestamp: string;
}

interface TeamActivityWidgetProps {
  activities: TeamActivity[];
  loading?: boolean;
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return 'teraz';
  if (diffMin < 60) return `${diffMin} min temu`;
  if (diffHours < 24) return `${diffHours}h temu`;
  if (diffDays === 1) return 'wczoraj';
  return `${diffDays}d temu`;
}

function getActivityIcon(type: TeamActivity['type']) {
  switch (type) {
    case 'TASK_COMPLETED':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    case 'DEAL_UPDATED':
      return <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  }
}

function getActivityLabel(type: TeamActivity['type']): string {
  switch (type) {
    case 'TASK_COMPLETED':
      return 'ukonczyl/a zadanie';
    case 'DEAL_UPDATED':
      return 'zaktualizowal/a deal';
  }
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

export function TeamActivityWidget({ activities, loading }: TeamActivityWidgetProps) {
  return (
    <BentoCard
      title="Aktywnosc zespolu"
      icon={Users}
      iconColor="text-violet-600"
      variant="glass"
      loading={loading}
    >
      {activities.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          Brak aktywnosci zespolu w ostatnim tygodniu
        </p>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, 8).map((activity, idx) => (
            <div
              key={`${activity.type}-${activity.userId}-${idx}`}
              className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold">{getFirstName(activity.userName)}</span>
                  {' '}
                  <span className="text-slate-500 dark:text-slate-400">
                    {getActivityLabel(activity.type)}
                  </span>
                  {' '}
                  <span className="font-medium truncate">{activity.title}</span>
                </p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 mt-0.5">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
