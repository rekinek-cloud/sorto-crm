'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { BurndownPoint } from '@/types/views';

interface BurndownChartProps {
  burndownData: BurndownPoint[];
  sprintStartDate: Date;
  sprintEndDate: Date;
  className?: string;
}

export default function BurndownChart({ 
  burndownData, 
  sprintStartDate, 
  sprintEndDate,
  className = '' 
}: BurndownChartProps) {
  const chartWidth = 400;
  const chartHeight = 200;
  const padding = 40;

  // Calculate chart dimensions
  const maxPoints = Math.max(...burndownData.map(point => Math.max(point.remainingPoints, point.idealRemaining)));
  const minPoints = 0;
  const totalDays = Math.ceil((sprintEndDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24));

  // Create path for actual burndown
  const actualPath = burndownData.map((point, index) => {
    const x = padding + (index / (burndownData.length - 1)) * (chartWidth - 2 * padding);
    const y = padding + (1 - (point.remainingPoints - minPoints) / (maxPoints - minPoints)) * (chartHeight - 2 * padding);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create path for ideal burndown
  const idealPath = burndownData.map((point, index) => {
    const x = padding + (index / (burndownData.length - 1)) * (chartWidth - 2 * padding);
    const y = padding + (1 - (point.idealRemaining - minPoints) / (maxPoints - minPoints)) * (chartHeight - 2 * padding);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Calculate current status
  const latestData = burndownData[burndownData.length - 1];
  const isAheadOfSchedule = latestData && latestData.remainingPoints < latestData.idealRemaining;
  const completionPercentage = latestData ? Math.round((1 - latestData.remainingPoints / burndownData[0]?.remainingPoints) * 100) : 0;

  // Y-axis labels
  const yAxisLabels = [];
  const labelCount = 5;
  for (let i = 0; i <= labelCount; i++) {
    const value = maxPoints - (maxPoints / labelCount) * i;
    const y = padding + (i / labelCount) * (chartHeight - 2 * padding);
    yAxisLabels.push({ value: Math.round(value), y });
  }

  // X-axis labels (dates)
  const xAxisLabels = [];
  const dayInterval = Math.ceil(totalDays / 5);
  for (let i = 0; i <= Math.min(5, burndownData.length - 1); i++) {
    const dataIndex = Math.min(i * dayInterval, burndownData.length - 1);
    const point = burndownData[dataIndex];
    if (point) {
      const x = padding + (dataIndex / (burndownData.length - 1)) * (chartWidth - 2 * padding);
      xAxisLabels.push({
        date: point.date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
        x
      });
    }
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sprint Burndown</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center space-x-1 ${isAheadOfSchedule ? 'text-green-600' : 'text-orange-600'}`}>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Actual</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <div className="w-3 h-3 border-2 border-gray-400 border-dashed rounded-full"></div>
            <span>Ideal</span>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <div className={`text-2xl font-bold ${isAheadOfSchedule ? 'text-green-600' : 'text-orange-600'}`}>
            {completionPercentage}%
          </div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {latestData?.remainingPoints || 0}
          </div>
          <div className="text-sm text-gray-500">Remaining SP</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${isAheadOfSchedule ? 'text-green-600' : 'text-red-600'}`}>
            {isAheadOfSchedule ? '📈 Ahead' : '📉 Behind'}
          </div>
          <div className="text-sm text-gray-500">Schedule</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {yAxisLabels.map((label, index) => (
            <g key={index}>
              <line
                x1={padding}
                y1={label.y}
                x2={chartWidth - padding}
                y2={label.y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Ideal burndown line */}
          <path
            d={idealPath}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Actual burndown line */}
          <path
            d={actualPath}
            fill="none"
            stroke={isAheadOfSchedule ? '#10b981' : '#f59e0b'}
            strokeWidth="3"
          />

          {/* Data points */}
          {burndownData.map((point, index) => {
            const x = padding + (index / (burndownData.length - 1)) * (chartWidth - 2 * padding);
            const y = padding + (1 - (point.remainingPoints - minPoints) / (maxPoints - minPoints)) * (chartHeight - 2 * padding);
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={isAheadOfSchedule ? '#10b981' : '#f59e0b'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-6 transition-all"
              >
                <title>
                  {point.date.toLocaleDateString()}: {point.remainingPoints} SP remaining
                </title>
              </circle>
            );
          })}

          {/* Y-axis labels */}
          {yAxisLabels.map((label, index) => (
            <text
              key={index}
              x={padding - 10}
              y={label.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {label.value}
            </text>
          ))}

          {/* X-axis labels */}
          {xAxisLabels.map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={chartHeight - padding + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {label.date}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-600">
        <p>
          <strong>Story Points:</strong> Measures of effort/complexity. 
          <strong className="ml-4">Ideal Line:</strong> Expected progress if work is completed evenly.
        </p>
      </div>
    </Card>
  );
}