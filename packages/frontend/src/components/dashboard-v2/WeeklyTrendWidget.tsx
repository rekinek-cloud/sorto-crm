'use client';

import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { WeeklySummary } from '@/lib/api/dashboardApi';

interface WeeklyTrendWidgetProps {
  data: WeeklySummary | null;
  weeklyReviewData?: {
    burndownData: Array<{ week: string; completed: number; created: number }>;
  } | null;
  loading?: boolean;
  onClick?: () => void;
}

export function WeeklyTrendWidget({
  data,
  weeklyReviewData,
  loading = false,
  onClick,
}: WeeklyTrendWidgetProps) {
  // Generate sample data if no real data
  const chartData = weeklyReviewData?.burndownData?.slice(-7) || [
    { week: 'Pon', completed: 5, created: 8 },
    { week: 'Wt', completed: 8, created: 6 },
    { week: 'Sr', completed: 4, created: 7 },
    { week: 'Czw', completed: 10, created: 5 },
    { week: 'Pt', completed: 6, created: 9 },
    { week: 'Sob', completed: 2, created: 1 },
    { week: 'Nd', completed: 1, created: 2 },
  ];

  const maxValue = Math.max(...chartData.map(d => Math.max(d.completed, d.created)), 1);

  return (
    <BentoCard
      title="Trend Tygodnia"
      subtitle="Aktywnosc zadaniowa"
      icon={BarChart3}
      iconColor="text-indigo-600"
      loading={loading}
      onClick={onClick}
      variant="glass"
    >
      <div className="space-y-4">
        {/* Stats summary */}
        {data && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-lg font-bold text-emerald-600">{data.completedThisWeek}</div>
              <div className="text-xs text-slate-500">Ukonczone</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-lg font-bold text-blue-600">{data.createdThisWeek}</div>
              <div className="text-xs text-slate-500">Utworzone</div>
            </div>
          </div>
        )}

        {/* Mini bar chart */}
        <div className="h-24 flex items-end justify-between gap-1">
          {chartData.map((item, index) => {
            const completedHeight = (item.completed / maxValue) * 100;
            const createdHeight = (item.created / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-16">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: completedHeight + "%" }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="w-2 bg-emerald-500 rounded-t"
                    style={{ minHeight: item.completed > 0 ? 4 : 0 }}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: createdHeight + "%" }}
                    transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                    className="w-2 bg-blue-500 rounded-t"
                    style={{ minHeight: item.created > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-xs text-slate-500">{item.week.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Ukonczone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-500">Utworzone</span>
          </div>
        </div>

        {/* Productivity indicator */}
        {data && data.productivity > 0 && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-200">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-slate-800 font-medium">Produktywnosc: {data.productivity}%</span>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

export default WeeklyTrendWidget;
