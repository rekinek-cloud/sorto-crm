/**
 * TasksWidget - Shows task statistics with progress
 */

'use client';

import { BentoCard } from './BentoCard';
import { DashboardStats } from '@/lib/api/dashboardApi';

interface TasksWidgetProps {
  data: DashboardStats | null;
  loading?: boolean;
  onClick?: () => void;
}

// Circular progress component
function CircularProgress({ value, max, size = 48 }: { value: number; max: number; size?: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" viewBox="0 0 40 40" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

// Stat item component
function StatItem({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-semibold ${alert ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
        {alert && <span className="ml-1 text-xs">!</span>}
      </span>
    </div>
  );
}

export function TasksWidget({ data, loading = false, onClick }: TasksWidgetProps) {
  const active = data?.activeTasks || 0;
  const completed = data?.completedTasks || 0;
  const total = data?.totalTasks || 0;
  const overdue = data?.overdueCount || 0;
  const urgent = data?.urgentTasks || 0;

  return (
    <BentoCard
      title="Zadania"
      icon="✅"
      variant="default"
      loading={loading}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Progress circle */}
        <CircularProgress value={completed} max={total} />

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {active} <span className="text-sm font-normal text-gray-500">do zrobienia</span>
          </div>

          <div className="space-y-0">
            <StatItem label="Ukończone" value={completed} />
            <StatItem label="Zaległe" value={overdue} alert={overdue > 0} />
            {urgent > 0 && <StatItem label="Pilne" value={urgent} alert />}
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {overdue > 0 && (
        <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{overdue} {overdue === 1 ? 'zaległe zadanie' : 'zaległych zadań'}</span>
        </div>
      )}
    </BentoCard>
  );
}

export default TasksWidget;
