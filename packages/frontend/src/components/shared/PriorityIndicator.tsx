'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Priority } from '@/types/views';

interface PriorityIndicatorProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'dot' | 'full' | 'minimal';
  showLabel?: boolean;
  className?: string;
}

const priorityConfig = {
  urgent: {
    label: 'Pilne',
    icon: '🔴',
    emoji: '🚨',
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    weight: 4
  },
  high: {
    label: 'Wysoki',
    icon: '🟠',
    emoji: '⚡',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    weight: 3
  },
  medium: {
    label: 'Średni',
    icon: '🟡',
    emoji: '➡️',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    weight: 2
  },
  low: {
    label: 'Niski',
    icon: '🟢',
    emoji: '⬇️',
    color: 'bg-green-100 text-green-800 border-green-200',
    dotColor: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    weight: 1
  }
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-1',
    dot: 'w-2 h-2',
    text: 'text-xs',
    icon: 'text-sm'
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    dot: 'w-3 h-3',
    text: 'text-sm',
    icon: 'text-base'
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    dot: 'w-4 h-4',
    text: 'text-base',
    icon: 'text-lg'
  }
};

export default function PriorityIndicator({
  priority,
  size = 'md',
  variant = 'badge',
  showLabel = true,
  className = ''
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority];
  const sizes = sizeConfig[size];

  if (variant === 'dot') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizes.dot} ${config.dotColor} rounded-full`} />
        {showLabel && (
          <span className={`${sizes.text} ${config.textColor} font-medium`}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center space-x-2 ${config.bgColor} rounded-lg px-3 py-2 ${className}`}>
        <span className={sizes.icon}>{config.emoji}</span>
        <div className="flex flex-col">
          <span className={`${sizes.text} ${config.textColor} font-semibold`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-500">
            Priority Level {config.weight}/4
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <span className={`${sizes.icon} ${className}`} title={config.label}>
        {config.icon}
      </span>
    );
  }

  // Default badge variant
  return (
    <Badge 
      variant="secondary" 
      className={`${sizes.badge} ${config.color} font-medium ${className}`}
    >
      <span className="mr-1">{config.icon}</span>
      {showLabel && config.label}
    </Badge>
  );
}