/**
 * WeeklyTrendWidget - Weekly trend chart with SVG
 */

'use client';

import { BentoCard } from './BentoCard';
import { WeeklySummary } from '@/lib/api/dashboardApi';

interface WeeklyTrendWidgetProps {
  data: WeeklySummary | null;
  weeklyReviewStats?: {
    burndownData: Array<{ week: string; completed: number; created: number }>;
    summary: { totalWeeks: number; averageTasksCompleted: number; reviewCompletionRate: number };
  } | null;
  loading?: boolean;
}

// SVG Line chart component
function TrendChart({
  data
}: {
  data: Array<{ week: string; completed: number; created: number }>;
}) {
  if (!data || data.length < 2) {
    // Generate mock data if not enough real data
    const mockData = Array.from({ length: 6 }, (_, i) => ({
      week: `W${i + 1}`,
      completed: Math.floor(Math.random() * 15) + 5,
      created: Math.floor(Math.random() * 12) + 3
    }));
    data = mockData;
  }

  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = data.flatMap(d => [d.completed, d.created]);
  const maxValue = Math.max(...allValues, 1);

  // Scale functions
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Generate path
  const createPath = (values: number[]) => {
    return values
      .map((val, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(val)}`)
      .join(' ');
  };

  const completedPath = createPath(data.map(d => d.completed));
  const createdPath = createPath(data.map(d => d.created));

  // Area path for completed
  const areaPath = `
    M ${xScale(0)} ${yScale(0)}
    ${data.map((d, i) => `L ${xScale(i)} ${yScale(d.completed)}`).join(' ')}
    L ${xScale(data.length - 1)} ${yScale(0)}
    Z
  `;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          y1={yScale(maxValue * ratio)}
          x2={width - padding.right}
          y2={yScale(maxValue * ratio)}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGradient)" opacity="0.3" />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Created line */}
      <path
        d={createdPath}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4,4"
      />

      {/* Completed line */}
      <path
        d={completedPath}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points for completed */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(d.completed)}
          r="4"
          fill="#8b5cf6"
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 4}
          textAnchor="middle"
          className="text-[10px] fill-gray-400"
        >
          {d.week.slice(0, 3)}
        </text>
      ))}

      {/* Y-axis labels */}
      <text x={padding.left - 5} y={padding.top + 4} textAnchor="end" className="text-[10px] fill-gray-400">
        {maxValue}
      </text>
      <text x={padding.left - 5} y={height - padding.bottom} textAnchor="end" className="text-[10px] fill-gray-400">
        0
      </text>
    </svg>
  );
}

// Legend component
function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-600">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-0.5 bg-purple-500 rounded" />
        <span>Ukończone</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-0.5 bg-gray-400 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8, #94a3b8 2px, transparent 2px, transparent 4px)' }} />
        <span>Nowe</span>
      </div>
    </div>
  );
}

export function WeeklyTrendWidget({ data, weeklyReviewStats, loading = false }: WeeklyTrendWidgetProps) {
  const completed = data?.completedThisWeek || 0;
  const created = data?.createdThisWeek || 0;
  const productivity = data?.productivity || 0;

  const burndownData = weeklyReviewStats?.burndownData || [];
  const avgCompleted = weeklyReviewStats?.summary?.averageTasksCompleted || 0;

  return (
    <BentoCard
      title="Trend Tygodnia"
      icon="📈"
      size="lg"
      variant="default"
      loading={loading}
    >
      <div className="flex flex-col h-full">
        {/* Summary stats */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600">{completed}</span>
              <span className="text-sm text-gray-500">ukończonych</span>
            </div>
            <div className="text-xs text-gray-400">
              {created} nowych zadań w tym tygodniu
            </div>
          </div>

          {/* Productivity badge */}
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            productivity >= 80
              ? 'bg-green-100 text-green-700'
              : productivity >= 50
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {productivity}% wydajność
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 flex items-center justify-center mb-2">
          <TrendChart data={burndownData} />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between">
          <Legend />
          {avgCompleted > 0 && (
            <span className="text-xs text-gray-400">
              śr. {avgCompleted.toFixed(1)}/tydzień
            </span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

export default WeeklyTrendWidget;
