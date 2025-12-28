/**
 * AIInsightsWidget - Shows AI-generated insights
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { AIInsight } from '@/lib/api/dashboardApi';

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  loading?: boolean;
  onDismiss?: (id: string) => void;
}

// Priority colors and icons
const priorityConfig = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: '🚨' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚠️' },
  medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '💡' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'ℹ️' }
};

const typeIcons = {
  urgent: '🔥',
  opportunity: '✨',
  trend: '📊',
  warning: '⚠️'
};

// Insight item component
function InsightItem({
  insight,
  onDismiss
}: {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
}) {
  const config = priorityConfig[insight.priority] || priorityConfig.medium;
  const typeIcon = typeIcons[insight.type] || '💡';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-3 rounded-lg border ${config.color} relative group`}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(insight.id)}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}

      <div className="flex items-start gap-2">
        <span className="text-lg">{typeIcon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate pr-4">{insight.title}</h4>
          <p className="text-xs opacity-80 line-clamp-2 mt-0.5">{insight.description}</p>

          {/* Action button */}
          {insight.action && (
            <button className="mt-2 px-2 py-1 text-xs font-medium bg-white/50 rounded hover:bg-white/80 transition-colors">
              {insight.action.label}
            </button>
          )}

          {/* Confidence badge */}
          {insight.confidence && insight.confidence > 0.8 && (
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-white/30 rounded-full">
              {Math.round(insight.confidence * 100)}% pewności
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Empty state
function EmptyInsights() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-6">
      <div className="text-3xl mb-2">✨</div>
      <p className="text-sm text-gray-500">Wszystko pod kontrolą!</p>
      <p className="text-xs text-gray-400">Brak nowych sugestii AI</p>
    </div>
  );
}

export function AIInsightsWidget({ insights, loading = false, onDismiss }: AIInsightsWidgetProps) {
  // Sort by priority (critical first)
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  // Show max 3 insights
  const visibleInsights = sortedInsights.slice(0, 3);

  return (
    <BentoCard
      title="AI Insights"
      icon="💡"
      variant="default"
      loading={loading}
    >
      <div className="flex flex-col h-full">
        {visibleInsights.length > 0 ? (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {visibleInsights.map((insight) => (
                  <InsightItem
                    key={insight.id}
                    insight={insight}
                    onDismiss={onDismiss}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* More insights indicator */}
            {insights.length > 3 && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-400">
                  +{insights.length - 3} więcej
                </span>
              </div>
            )}
          </>
        ) : (
          <EmptyInsights />
        )}
      </div>
    </BentoCard>
  );
}

export default AIInsightsWidget;
