'use client';

import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { AIInsight } from '@/lib/api/dashboardApi';

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  loading?: boolean;
  onClick?: () => void;
}

const insightIcons: Record<string, React.ElementType> = {
  urgent: AlertTriangle,
  opportunity: TrendingUp,
  trend: Zap,
  warning: Info,
};

const insightColors: Record<string, string> = {
  urgent: 'text-red-600 bg-red-50',
  opportunity: 'text-emerald-600 bg-emerald-50',
  trend: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
};

const priorityColors: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

export function AIInsightsWidget({ insights, loading = false, onClick }: AIInsightsWidgetProps) {
  const displayInsights = insights.slice(0, 4);

  return (
    <BentoCard
      title="AI Insights"
      subtitle="Automatyczne spostrzezenia"
      icon={Lightbulb}
      iconColor="text-yellow-600"
      loading={loading}
      onClick={onClick}
      variant="glass"
    >
      <div className="space-y-2">
        {displayInsights.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            Brak nowych spostrzezen
          </div>
        ) : (
          displayInsights.map((insight, index) => {
            const IconComponent = insightIcons[insight.type] || Info;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={"flex items-start gap-3 p-2 rounded-lg bg-slate-50 border-l-2 " + (priorityColors[insight.priority] || 'border-l-slate-400')}
              >
                <div className={"p-1.5 rounded-lg " + (insightColors[insight.type] || 'text-slate-500 bg-slate-100')}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 truncate">{insight.title}</div>
                  <div className="text-xs text-slate-500 truncate">{insight.description}</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </BentoCard>
  );
}

export default AIInsightsWidget;
