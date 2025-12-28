'use client';

import React from 'react';
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { BentoCard, MiniStat, ProgressBar } from './BentoCard';
import { DashboardStats } from '@/lib/api/dashboardApi';

interface TasksWidgetProps {
  data: DashboardStats | null;
  loading?: boolean;
  onClick?: () => void;
}

export function TasksWidget({ data, loading = false, onClick }: TasksWidgetProps) {
  const completionRate = data && data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;

  return (
    <BentoCard
      title="Zadania"
      subtitle="Status pracy"
      icon={CheckSquare}
      iconColor="text-blue-600"
      value={data ? data.activeTasks.toString() : "-"}
      loading={loading}
      onClick={onClick}
      variant="glass"
    >
      {data && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 -mt-1">do zrobienia</div>
          
          <ProgressBar
            value={completionRate}
            max={100}
            color="bg-blue-500"
          />

          <div className="space-y-1">
            <MiniStat
              label="Ukonczone"
              value={data.completedTasks}
              color="text-emerald-600"
            />
            
            {data.overdueCount > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  Zalegle
                </span>
                <span className="text-sm font-semibold text-red-600">{data.overdueCount}</span>
              </div>
            )}

            {data.urgentTasks > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  Pilne
                </span>
                <span className="text-sm font-semibold text-orange-600">{data.urgentTasks}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </BentoCard>
  );
}

export default TasksWidget;
