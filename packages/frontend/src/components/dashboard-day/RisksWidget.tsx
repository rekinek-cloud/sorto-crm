'use client';

import React from 'react';
import { AlertTriangle, Clock, FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface Risk {
  type: 'PROJECT_BEHIND' | 'TASK_OVERDUE';
  title: string;
  deadline: string | null;
  progress?: number;
  assignee?: string;
}

interface RisksWidgetProps {
  risks: Risk[];
  loading?: boolean;
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Brak terminu';
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `${Math.abs(diff)}d po terminie`;
  if (diff === 0) return 'Dzis';
  if (diff === 1) return 'Jutro';
  return `za ${diff}d`;
}

function getRiskLevel(risk: Risk): { label: string; className: string } {
  if (risk.type === 'TASK_OVERDUE') {
    const d = risk.deadline ? new Date(risk.deadline) : null;
    const now = new Date();
    if (d && (now.getTime() - d.getTime()) > 3 * 24 * 60 * 60 * 1000) {
      return { label: 'Krytyczny', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    }
    return { label: 'Zalegly', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  }
  // PROJECT_BEHIND
  if (risk.progress !== undefined && risk.progress < 25) {
    return { label: 'Krytyczny', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  }
  return { label: 'Zagrozony', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
}

function getRiskIcon(type: Risk['type']) {
  switch (type) {
    case 'PROJECT_BEHIND':
      return <FolderKanban className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    case 'TASK_OVERDUE':
      return <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />;
  }
}

export function RisksWidget({ risks, loading }: RisksWidgetProps) {
  return (
    <BentoCard
      title="Ryzyka"
      icon={AlertTriangle}
      iconColor="text-red-600"
      variant="glass"
      loading={loading}
    >
      {risks.length === 0 ? (
        <div className="py-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Brak wykrytych ryzyk
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.slice(0, 5).map((risk, idx) => {
            const level = getRiskLevel(risk);
            return (
              <motion.div
                key={`${risk.type}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getRiskIcon(risk.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${level.className}`}>
                        {level.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDeadline(risk.deadline)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {risk.title}
                    </p>
                    {risk.type === 'PROJECT_BEHIND' && risk.progress !== undefined && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${risk.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${
                              risk.progress < 25 ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {risk.progress}%
                        </span>
                      </div>
                    )}
                    {risk.assignee && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {risk.assignee}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {risks.length > 5 && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1">
              +{risks.length - 5} wiecej
            </p>
          )}
        </div>
      )}
    </BentoCard>
  );
}
