/**
 * ActivityFeedWidget - Recent activity timeline
 */

'use client';

import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { Activity } from '@/lib/api/dashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ActivityFeedWidgetProps {
  activities: Activity[];
  loading?: boolean;
}

// Activity type configuration
const activityConfig: Record<string, { icon: string; color: string }> = {
  deal: { icon: '💰', color: 'bg-green-100 text-green-600' },
  contact: { icon: '👤', color: 'bg-blue-100 text-blue-600' },
  task: { icon: '✅', color: 'bg-purple-100 text-purple-600' },
  email: { icon: '📧', color: 'bg-yellow-100 text-yellow-600' },
  meeting: { icon: '📅', color: 'bg-indigo-100 text-indigo-600' },
  note: { icon: '📝', color: 'bg-orange-100 text-orange-600' },
  call: { icon: '📞', color: 'bg-cyan-100 text-cyan-600' }
};

// Format relative time
function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: pl });
  } catch {
    return 'Nieznana data';
  }
}

// Activity item component
function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const config = activityConfig[activity.type] || { icon: '📋', color: 'bg-gray-100 text-gray-600' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-3"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 w-0.5 h-full bg-gray-200" />
      )}

      {/* Icon */}
      <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0 z-10`}>
        <span className="text-sm">{config.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-gray-900 font-medium truncate">
              {activity.action}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {activity.description || activity.entityName}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
            {formatTime(activity.createdAt)}
          </span>
        </div>

        {/* User name */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-gray-400">przez</span>
          <span className="text-xs text-gray-600">{activity.userName || 'Nieznany'}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Empty state
function EmptyActivities() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-6">
      <div className="text-3xl mb-2">📋</div>
      <p className="text-sm text-gray-500">Brak aktywności</p>
      <p className="text-xs text-gray-400">Twoje działania pojawią się tutaj</p>
    </div>
  );
}

// Mock activities for empty state
const mockActivities: Activity[] = [
  {
    id: 'mock-1',
    type: 'task',
    action: 'Ukończono zadanie',
    description: 'Przygotowanie raportu miesięcznego',
    userId: 'mock',
    userName: 'Ty',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'mock-2',
    type: 'deal',
    action: 'Zaktualizowano deal',
    description: 'Nowa szansa sprzedaży',
    userId: 'mock',
    userName: 'System',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'mock-3',
    type: 'email',
    action: 'Wysłano email',
    description: 'Oferta współpracy',
    userId: 'mock',
    userName: 'Ty',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

export function ActivityFeedWidget({ activities, loading = false }: ActivityFeedWidgetProps) {
  // Use mock activities if empty
  const displayActivities = activities.length > 0 ? activities.slice(0, 5) : mockActivities;

  return (
    <BentoCard
      title="Aktywność"
      icon="📋"
      variant="default"
      loading={loading}
    >
      <div className="flex flex-col h-full">
        {displayActivities.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            {displayActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === displayActivities.length - 1}
              />
            ))}
          </div>
        ) : (
          <EmptyActivities />
        )}

        {/* View all link */}
        {activities.length > 5 && (
          <div className="mt-2 text-center">
            <button className="text-xs text-purple-600 hover:text-purple-700">
              Zobacz wszystkie →
            </button>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

export default ActivityFeedWidget;
