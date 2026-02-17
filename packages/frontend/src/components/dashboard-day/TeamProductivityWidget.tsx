'use client';

import React from 'react';
import { BarChart3, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface TeamMember {
  userId: string;
  name: string;
  tasksCompleted: number;
  tasksTotal: number;
}

interface TeamProductivityWidgetProps {
  members: TeamMember[];
  loading?: boolean;
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

const BAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export function TeamProductivityWidget({ members, loading }: TeamProductivityWidgetProps) {
  const maxCompleted = Math.max(...members.map(m => m.tasksCompleted), 1);
  const topPerformerId = members.length > 0 && members[0].tasksCompleted > 0
    ? members[0].userId
    : null;

  return (
    <BentoCard
      title="Produktywnosc zespolu"
      subtitle="Ostatnie 7 dni"
      icon={BarChart3}
      iconColor="text-emerald-600"
      variant="glass"
      loading={loading}
    >
      {members.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          Brak danych o zespole
        </p>
      ) : (
        <div className="space-y-2.5">
          {members.slice(0, 6).map((member, idx) => {
            const barWidth = member.tasksCompleted > 0
              ? Math.max((member.tasksCompleted / maxCompleted) * 100, 8)
              : 0;
            const isTopPerformer = member.userId === topPerformerId;
            const barColor = BAR_COLORS[idx % BAR_COLORS.length];

            return (
              <div key={member.userId} className="flex items-center gap-2.5">
                {/* Name */}
                <div className="w-20 shrink-0 flex items-center gap-1">
                  {isTopPerformer && (
                    <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                  <span
                    className={`text-xs truncate ${
                      isTopPerformer
                        ? 'font-bold text-slate-800 dark:text-slate-200'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {getFirstName(member.name)}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className={`h-full rounded-full ${barColor} ${
                      isTopPerformer ? 'ring-1 ring-amber-300' : ''
                    }`}
                  />
                </div>

                {/* Count */}
                <span
                  className={`text-xs w-6 text-right shrink-0 tabular-nums ${
                    isTopPerformer
                      ? 'font-bold text-slate-800 dark:text-slate-200'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {member.tasksCompleted}
                </span>
              </div>
            );
          })}

          {/* Summary footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span>{members.length} czlonkow</span>
            <span>
              {members.reduce((s, m) => s + m.tasksCompleted, 0)} zadan ukonczone
            </span>
          </div>
        </div>
      )}
    </BentoCard>
  );
}
