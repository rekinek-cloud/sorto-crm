'use client';

import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { BentoCard, ProgressBar } from './BentoCard';
import { PipelineForecast } from '@/lib/api/dashboardApi';

interface PipelineWidgetProps {
  data: PipelineForecast | null;
  loading?: boolean;
  onClick?: () => void;
}

export function PipelineWidget({ data, loading = false, onClick }: PipelineWidgetProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M PLN";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + "K PLN";
    }
    return value.toFixed(0) + " PLN";
  };

  const healthColors: Record<string, string> = {
    healthy: "bg-emerald-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
  };

  return (
    <BentoCard
      title="Pipeline"
      subtitle="Prognoza przychodu"
      icon={DollarSign}
      iconColor="text-emerald-600"
      value={data ? formatCurrency(data.totalWeightedRevenue) : "-"}
      trend={data ? { value: 15, label: "vs tydzień" } : undefined}
      loading={loading}
      onClick={onClick}
      variant="glass"
    >
      {data && (
        <div className="space-y-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Zdrowie pipeline:</span>
            <div className="flex items-center gap-1">
              <div className={"w-2 h-2 rounded-full " + (healthColors[data.pipelineHealth.status] || "bg-slate-500")} />
              <span className="text-xs text-slate-800 font-medium capitalize">{data.pipelineHealth.score}%</span>
            </div>
          </div>
          
          <ProgressBar
            value={data.pipelineHealth.score}
            max={100}
            color={healthColors[data.pipelineHealth.status] || "bg-blue-500"}
          />

          {data.forecasts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {data.forecasts.slice(0, 4).map((forecast, i) => (
                <div key={i} className="text-xs">
                  <span className="text-slate-500">{forecast.stage}:</span>
                  <span className="text-slate-800 font-medium ml-1">{formatCurrency(forecast.weightedValue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </BentoCard>
  );
}

export default PipelineWidget;
