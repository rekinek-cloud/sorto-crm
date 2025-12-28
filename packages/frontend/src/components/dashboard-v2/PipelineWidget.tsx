/**
 * PipelineWidget - Shows pipeline value with mini chart
 */

'use client';

import { BentoCard } from './BentoCard';
import { PipelineForecast } from '@/lib/api/dashboardApi';

interface PipelineWidgetProps {
  data: PipelineForecast | null;
  loading?: boolean;
}

// Mini bar chart component
function MiniBarChart({ data }: { data: Array<{ stage: string; weightedValue: number }> }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.weightedValue), 1);

  return (
    <div className="flex items-end gap-1 h-10 mt-2">
      {data.slice(0, 6).map((item, index) => {
        const height = (item.weightedValue / maxValue) * 100;
        return (
          <div
            key={index}
            className="flex-1 bg-white/30 rounded-t transition-all hover:bg-white/50"
            style={{ height: `${Math.max(height, 10)}%` }}
            title={`${item.stage}: ${item.weightedValue.toLocaleString('pl-PL')} PLN`}
          />
        );
      })}
    </div>
  );
}

// Health indicator
function HealthBadge({ status, score }: { status: string; score: number }) {
  const colors = {
    healthy: 'bg-green-400/30 text-green-100',
    warning: 'bg-yellow-400/30 text-yellow-100',
    critical: 'bg-red-400/30 text-red-100'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.warning}`}>
      {score}%
    </span>
  );
}

export function PipelineWidget({ data, loading = false }: PipelineWidgetProps) {
  const revenue = data?.totalWeightedRevenue || 0;
  const health = data?.pipelineHealth || { score: 0, status: 'warning', issues: [] };
  const forecasts = data?.forecasts || [];

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M PLN`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k PLN`;
    }
    return `${value.toLocaleString('pl-PL')} PLN`;
  };

  return (
    <BentoCard
      title="Pipeline"
      icon="📊"
      variant="gradient"
      gradient="purple"
      loading={loading}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(revenue)}
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <span>Ważona wartość</span>
            <HealthBadge status={health.status} score={health.score} />
          </div>
        </div>

        {/* Mini chart */}
        <MiniBarChart data={forecasts} />

        {/* Issues hint */}
        {health.issues && health.issues.length > 0 && (
          <div className="text-xs text-white/60 mt-2 truncate">
            {health.issues[0]}
          </div>
        )}
      </div>
    </BentoCard>
  );
}

export default PipelineWidget;
