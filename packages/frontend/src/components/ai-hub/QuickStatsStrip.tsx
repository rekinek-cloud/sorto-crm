'use client';

/**
 * QuickStatsStrip - Horizontal strip showing key metrics
 * Displays inbox count, tasks, deals pipeline, and messages
 */

import React from 'react';
import {
  Inbox,
  CheckSquare,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { QuickStats } from '@/lib/api/aiHub';

interface QuickStatsStripProps {
  stats: QuickStats | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export function QuickStatsStrip({ stats, isLoading, onRefresh }: QuickStatsStripProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-2">
        <div className="flex items-center gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      icon: Inbox,
      label: 'Inbox',
      value: stats.inbox.count,
      badge: stats.inbox.new > 0 ? `+${stats.inbox.new}` : null,
      badgeColor: 'bg-blue-100 text-blue-700',
      href: '/dashboard/source'
    },
    {
      icon: CheckSquare,
      label: 'Zadania',
      value: stats.tasks.today,
      badge: stats.tasks.overdue > 0 ? `${stats.tasks.overdue} zaległe` : null,
      badgeColor: 'bg-red-100 text-red-700',
      href: '/dashboard/tasks'
    },
    {
      icon: TrendingUp,
      label: 'Pipeline',
      value: formatCurrency(stats.deals.pipelineValue),
      badge: stats.deals.closingSoon > 0 ? `${stats.deals.closingSoon} do zamkn.` : null,
      badgeColor: 'bg-green-100 text-green-700',
      href: '/dashboard/deals'
    },
    {
      icon: MessageSquare,
      label: 'Wiadomości',
      value: stats.messages.unread,
      badge: stats.messages.unread > 0 ? 'nieprzeczytane' : null,
      badgeColor: 'bg-purple-100 text-purple-700',
      href: '/dashboard/communication'
    }
  ];

  return (
    <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-2">
      <div className="flex items-center gap-6 overflow-x-auto">
        {statItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="flex items-center gap-2 min-w-fit hover:bg-gray-50 px-2 py-1 rounded transition-colors"
          >
            <item.icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{item.label}:</span>
            <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            {item.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
          title="Odśwież statystyki"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M PLN`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k PLN`;
  }
  return `${value.toLocaleString('pl-PL')} PLN`;
}

export default QuickStatsStrip;
