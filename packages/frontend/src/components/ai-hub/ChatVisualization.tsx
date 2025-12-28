'use client';

/**
 * ChatVisualization - Renders charts and visualizations in chat messages
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Visualization } from '@/lib/api/aiHub';

interface ChatVisualizationProps {
  visualization: Visualization;
  compact?: boolean;
  onAction?: (action: string, data: any) => void;
}

export function ChatVisualization({ visualization, compact = false }: ChatVisualizationProps) {
  switch (visualization.type) {
    case 'chart':
      return <ChartVisualization visualization={visualization} compact={compact} />;
    case 'table':
      return <TableVisualization visualization={visualization} />;
    case 'cards':
      return <CardsVisualization visualization={visualization} />;
    case 'list':
      return <ListVisualization visualization={visualization} />;
    case 'progress':
      return <ProgressVisualization visualization={visualization} />;
    default:
      return null;
  }
}

// ============= CHART VISUALIZATION =============

function ChartVisualization({ visualization, compact }: { visualization: Visualization; compact: boolean }) {
  const { chartType = 'bar', data, labels, title } = visualization;

  // Simple bar chart implementation
  if (chartType === 'bar' || chartType === 'line') {
    const maxValue = Math.max(...data.map((d: any) => d.value || d));

    return (
      <Card className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="space-y-2">
          {data.map((item: any, i: number) => {
            const value = typeof item === 'object' ? item.value : item;
            const label = typeof item === 'object' ? item.label : (labels?.[i] || `Item ${i + 1}`);
            const percentage = (value / maxValue) * 100;

            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-600 truncate">{label}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-xs text-right font-medium">
                  {typeof value === 'number' ? value.toLocaleString('pl-PL') : value}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  // Pie/Donut chart
  if (chartType === 'pie' || chartType === 'donut') {
    const total = data.reduce((sum: number, item: any) => sum + (item.value || item), 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
      <Card className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.map((item: any, i: number) => {
            const value = typeof item === 'object' ? item.value : item;
            const label = typeof item === 'object' ? item.label : (labels?.[i] || `Item ${i + 1}`);
            const percentage = ((value / total) * 100).toFixed(1);

            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-xs text-gray-600">{label}</span>
                <span className="text-xs font-medium">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  return null;
}

// ============= TABLE VISUALIZATION =============

function TableVisualization({ visualization }: { visualization: Visualization }) {
  const { data, title } = visualization;

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <Card className="p-4 bg-white overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={col} className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row: any, i: number) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="py-2 px-2 text-gray-700">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 5 && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            ...i {data.length - 5} więcej
          </div>
        )}
      </div>
    </Card>
  );
}

// ============= CARDS VISUALIZATION =============

function CardsVisualization({ visualization }: { visualization: Visualization }) {
  const { data, title } = visualization;

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((item: any, i: number) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {formatCellValue(item.value)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{item.label}</div>
            {item.trend !== undefined && (
              <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${
                item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {item.trend > 0 ? <ArrowUp className="w-3 h-3" /> :
                 item.trend < 0 ? <ArrowDown className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {Math.abs(item.trend)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============= LIST VISUALIZATION =============

function ListVisualization({ visualization }: { visualization: Visualization }) {
  const { data, title } = visualization;

  return (
    <Card className="p-4 bg-white">
      <span className="text-sm font-medium">{title}</span>
      <ul className="mt-3 space-y-2">
        {data.map((item: any, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-blue-600">•</span>
            <span className="text-gray-700">
              {typeof item === 'object' ? item.text || item.title : item}
            </span>
            {item.badge && (
              <Badge variant="outline" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ============= PROGRESS VISUALIZATION =============

function ProgressVisualization({ visualization }: { visualization: Visualization }) {
  const { data, title } = visualization;
  const item = data[0] || { current: 0, total: 100 };
  const percentage = Math.round((item.current / item.total) * 100);

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 80 ? 'bg-green-500' :
            percentage >= 50 ? 'bg-blue-500' :
            percentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{item.current} / {item.total}</span>
        {item.label && <span>{item.label}</span>}
      </div>
    </Card>
  );
}

// ============= HELPERS =============

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return value.toLocaleString('pl-PL');
  }
  if (typeof value === 'boolean') {
    return value ? 'Tak' : 'Nie';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('pl-PL');
  }
  return String(value);
}

export default ChatVisualization;
