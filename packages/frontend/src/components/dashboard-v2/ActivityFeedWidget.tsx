'use client';

import React from 'react';
import { Activity as ActivityIcon, CheckCircle, Mail, Calendar, Phone, FileText, Briefcase, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { Activity } from '@/lib/api/dashboardApi';

interface ActivityFeedWidgetProps {
  activities: Activity[];
  loading?: boolean;
  onClick?: () => void;
}

const activityIcons: Record<string, React.ElementType> = {
  task: CheckCircle,
  deal: Briefcase,
  contact: Users,
  email: Mail,
  meeting: Calendar,
  call: Phone,
  note: FileText,
};

const activityColors: Record<string, string> = {
  task: 'text-blue-600 bg-blue-50',
  deal: 'text-emerald-600 bg-emerald-50',
  contact: 'text-pink-600 bg-pink-50',
  email: 'text-yellow-600 bg-yellow-50',
  meeting: 'text-purple-600 bg-purple-50',
  call: 'text-orange-600 bg-orange-50',
  note: 'text-cyan-600 bg-cyan-50',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'teraz';
  if (diffMins < 60) return diffMins + ' min';
  if (diffHours < 24) return diffHours + ' godz';
  if (diffDays < 7) return diffDays + ' dni';
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

export function ActivityFeedWidget({ activities, loading = false, onClick }: ActivityFeedWidgetProps) {
  const displayActivities = activities.slice(0, 5);

  return (
    <BentoCard
      title="Aktywnosc"
      subtitle="Ostatnie zdarzenia"
      icon={ActivityIcon}
      iconColor="text-teal-600"
      loading={loading}
      onClick={onClick}
      variant="glass"
    >
      <div className="space-y-2">
        {displayActivities.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            Brak ostatnich aktywnosci
          </div>
        ) : (
          displayActivities.map((activity, index) => {
            const IconComponent = activityIcons[activity.type] || ActivityIcon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className={"p-1.5 rounded-lg flex-shrink-0 " + (activityColors[activity.type] || 'text-slate-500 bg-slate-100')}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-800 truncate">{activity.action}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatTimeAgo(activity.createdAt)}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{activity.description}</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </BentoCard>
  );
}

export default ActivityFeedWidget;
