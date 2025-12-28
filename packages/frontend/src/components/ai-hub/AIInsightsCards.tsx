'use client';

/**
 * AIInsightsCards - Side panel showing AI-generated insights
 * Categorized by urgency: urgent, opportunity, trend, warning
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertCircle,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  X,
  ExternalLink,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AIInsight, InsightAction } from '@/lib/api/aiHub';

interface AIInsightsCardsProps {
  insights: AIInsight[];
  isLoading: boolean;
  onDismiss: (id: string) => void;
  onRefresh?: () => void;
}

const categoryStyles = {
  urgent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700'
  },
  opportunity: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: Lightbulb,
    iconColor: 'text-green-600',
    badge: 'bg-green-100 text-green-700'
  },
  trend: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700'
  }
};

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export function AIInsightsCards({ insights, isLoading, onDismiss, onRefresh }: AIInsightsCardsProps) {
  // Sort by priority
  const sortedInsights = [...insights].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">AI Insights</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="w-full h-3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">AI Insights</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="Odśwież insights"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {sortedInsights.length === 0 ? (
        <Card className="p-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">Brak aktywnych insights</p>
          <p className="text-xs text-gray-400 mt-1">Wszystko wygląda dobrze!</p>
        </Card>
      ) : (
        sortedInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onDismiss={onDismiss} />
        ))
      )}
    </div>
  );
}

interface InsightCardProps {
  insight: AIInsight;
  onDismiss: (id: string) => void;
}

function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const style = categoryStyles[insight.category] || categoryStyles.trend;
  const Icon = style.icon;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'urgent':
        return 'Pilne';
      case 'opportunity':
        return 'Okazja';
      case 'trend':
        return 'Trend';
      case 'warning':
        return 'Ostrzeżenie';
      default:
        return category;
    }
  };

  return (
    <Card className={`p-3 ${style.bg} ${style.border} border relative group`}>
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Odrzuć"
      >
        <X className="w-3 h-3 text-gray-400" />
      </button>

      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <span className={`text-xs px-1.5 py-0.5 rounded ${style.badge} font-medium`}>
            {getCategoryLabel(insight.category)}
          </span>

          {/* Title */}
          <h4 className="text-sm font-medium text-gray-800 mt-1.5">{insight.title}</h4>

          {/* Description */}
          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>

          {/* Context */}
          {insight.context && (
            <p className="text-xs text-gray-500 mt-1">
              {insight.context.entityType}: {insight.context.entityName}
            </p>
          )}

          {/* Actions */}
          {insight.actions && insight.actions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {insight.actions.map((action) => (
                <InsightActionButton key={action.id} action={action} />
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {formatTimestamp(insight.timestamp)}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface InsightActionButtonProps {
  action: InsightAction;
}

function InsightActionButton({ action }: InsightActionButtonProps) {
  const getButtonStyle = (type: string) => {
    switch (type) {
      case 'primary':
        return 'bg-gray-800 hover:bg-gray-900 text-white';
      case 'secondary':
        return 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';
      case 'dismiss':
        return 'text-gray-500 hover:text-gray-700';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-700';
    }
  };

  if (action.href) {
    return (
      <a
        href={action.href}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${getButtonStyle(action.type)}`}
      >
        {action.label}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <button
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${getButtonStyle(action.type)}`}
    >
      {action.label}
    </button>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const timestamp = new Date(date);
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'teraz';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours}h temu`;
  return timestamp.toLocaleDateString('pl-PL');
}

export default AIInsightsCards;
