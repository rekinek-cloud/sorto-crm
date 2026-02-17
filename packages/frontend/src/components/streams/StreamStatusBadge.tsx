'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Waves, Snowflake, FileText } from 'phosphor-react';
import { StreamStatus } from '@/types/streams';

interface StreamStatusBadgeProps {
  status: StreamStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<StreamStatus, {
  label: string;
  labelPL: string;
  Icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}> = {
  ACTIVE: {
    label: 'Active',
    labelPL: 'Aktywny',
    Icon: Waves,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-200',
  },
  ARCHIVED: {
    label: 'Archived',
    labelPL: 'Zarchiwizowany',
    Icon: FileText,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 border-gray-200',
  },
  FLOWING: {
    label: 'Flowing',
    labelPL: 'Płynie',
    Icon: Waves,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-200',
  },
  FROZEN: {
    label: 'Frozen',
    labelPL: 'Zamrożony',
    Icon: Snowflake,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 border-slate-200',
  },
  TEMPLATE: {
    label: 'Template',
    labelPL: 'Szablon',
    Icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 border-purple-200',
  },
};

const sizeConfig = {
  sm: { iconSize: 14, text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { iconSize: 16, text: 'text-sm', padding: 'px-2.5 py-1' },
  lg: { iconSize: 20, text: 'text-base', padding: 'px-3 py-1.5' },
};

export default function StreamStatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}: StreamStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const { Icon } = config;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 ${sizes.padding} ${config.bgColor} ${config.color} font-medium ${className}`}
    >
      <Icon size={sizes.iconSize} weight="duotone" />
      {showLabel && <span className={sizes.text}>{config.labelPL}</span>}
    </Badge>
  );
}

// Export dla użycia w innych komponentach
export const getStreamStatusIcon = (status: StreamStatus) => {
  return statusConfig[status].Icon;
};

export const getStreamStatusLabel = (status: StreamStatus, lang: 'en' | 'pl' = 'pl') => {
  return lang === 'pl' ? statusConfig[status].labelPL : statusConfig[status].label;
};
