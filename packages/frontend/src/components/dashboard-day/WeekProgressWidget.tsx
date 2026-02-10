'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface WeekDay {
  dayName: string;
  date: string;
  completed: number;
  isToday: boolean;
}

interface WeekProgressWidgetProps {
  days: WeekDay[];
  totalCompleted: number;
  totalCreated: number;
  loading?: boolean;
}

export function WeekProgressWidget({ days, totalCompleted, totalCreated, loading }: WeekProgressWidgetProps) {
  const maxCompleted = Math.max(...days.map(d => d.completed), 1);

  return (
    <BentoCard
      title="Tydzien"
      icon={BarChart3}
      iconColor="text-indigo-600"
      variant="glass"
      loading={loading}
    >
      {/* Bar chart */}
      <div className="flex items-end justify-between gap-1.5 h-20 mb-3">
        {days.map((day, i) => {
          const height = day.completed > 0 ? Math.max((day.completed / maxCompleted) * 100, 12) : 4;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              {day.completed > 0 && (
                <span className="text-[10px] font-semibold text-slate-600">{day.completed}</span>
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`w-full rounded-t-md ${
                  day.isToday ? 'bg-indigo-500' : day.completed > 0 ? 'bg-slate-300' : 'bg-slate-100'
                }`}
              />
              <span className={`text-[10px] ${day.isToday ? 'font-bold text-indigo-600' : 'text-slate-400'}`}>
                {day.dayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>{totalCompleted} ukonczone</span>
        <span>{totalCreated} utworzone</span>
      </div>
    </BentoCard>
  );
}
