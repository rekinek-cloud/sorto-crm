/**
 * GoalsTodayWidget - Shows daily goals progress
 */

'use client';

import { BentoCard } from './BentoCard';
import { GoalsOverview } from '@/lib/api/dashboardApi';

interface GoalsTodayWidgetProps {
  data: GoalsOverview | null;
  loading?: boolean;
  onClick?: () => void;
}

// Progress bar component
function ProgressBar({ value, max, color = 'blue' }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} transition-all duration-500 rounded-full`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Goal item component
function GoalItem({
  icon,
  label,
  current,
  target,
  color
}: {
  icon: string;
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-700 truncate">{label}</span>
          <span className="text-xs text-gray-500">{current}/{target}</span>
        </div>
        <ProgressBar value={current} max={target} color={color} />
      </div>
    </div>
  );
}

export function GoalsTodayWidget({ data, loading = false, onClick }: GoalsTodayWidgetProps) {
  const total = data?.total || 0;
  const active = data?.active || 0;
  const achieved = data?.achieved || 0;
  const achievementRate = data?.achievementRate || 0;
  const approaching = data?.approaching || 0;

  // Create mock goals based on real data
  const mockGoals = [
    { icon: '🎯', label: 'Ukończone cele', current: achieved, target: total, color: 'green' },
    { icon: '🔥', label: 'Aktywne cele', current: active, target: total, color: 'orange' },
    { icon: '⏰', label: 'Zbliżające się', current: approaching, target: active || 1, color: 'purple' }
  ].filter(g => g.target > 0);

  return (
    <BentoCard
      title="Cele"
      icon="🎯"
      variant="glass"
      loading={loading}
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        {/* Main stat */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-gray-900">{achievementRate}%</span>
          <span className="text-sm text-gray-500">realizacji</span>
        </div>

        {/* Goals list */}
        <div className="flex-1 space-y-1">
          {mockGoals.length > 0 ? (
            mockGoals.map((goal, index) => (
              <GoalItem key={index} {...goal} />
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              Brak aktywnych celów
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
          <span>{achieved} z {total} osiągnięte</span>
          {approaching > 0 && (
            <span className="text-orange-600">{approaching} zbliża się</span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

export default GoalsTodayWidget;
