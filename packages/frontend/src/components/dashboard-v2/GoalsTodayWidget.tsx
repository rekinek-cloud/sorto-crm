'use client';

import React from 'react';
import { Target, Trophy, TrendingUp } from 'lucide-react';
import { BentoCard, ProgressBar } from './BentoCard';
import { GoalsOverview } from '@/lib/api/dashboardApi';
import { useTranslations } from 'next-intl';

interface GoalsTodayWidgetProps {
  data: GoalsOverview | null;
  loading?: boolean;
  onClick?: () => void;
}

export function GoalsTodayWidget({ data, loading = false, onClick }: GoalsTodayWidgetProps) {
  const t = useTranslations('dashboard.goals');

  return (
    <BentoCard
      title={t('title')}
      subtitle={t('progress')}
      icon={Target}
      iconColor="text-purple-600"
      loading={loading}
      onClick={onClick}
      variant="glass"
    >
      {data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-800">
              {data.achieved}/{data.total}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              <Trophy className="w-3 h-3" />
              <span>{data.achievementRate}%</span>
            </div>
          </div>

          <ProgressBar
            value={data.achieved}
            max={data.total || 1}
            color="bg-purple-500"
            size="md"
          />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-50">
              <div className="text-lg font-semibold text-emerald-600">{data.achieved}</div>
              <div className="text-xs text-slate-500">Osiagniete</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <div className="text-lg font-semibold text-blue-600">{data.active}</div>
              <div className="text-xs text-slate-500">Aktywne</div>
            </div>
            <div className="p-2 rounded-lg bg-orange-50">
              <div className="text-lg font-semibold text-orange-600">{data.approaching}</div>
              <div className="text-xs text-slate-500">Zblizajace</div>
            </div>
          </div>
        </div>
      )}
    </BentoCard>
  );
}

export default GoalsTodayWidget;
