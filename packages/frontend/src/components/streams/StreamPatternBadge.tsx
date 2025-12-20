'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  Folder,
  ArrowsClockwise,
  BookBookmark,
  Buildings,
  Funnel,
  House,
  Sparkle,
} from 'phosphor-react';
import { StreamPattern } from '@/types/streams';

interface StreamPatternBadgeProps {
  pattern: StreamPattern;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const patternConfig: Record<StreamPattern, {
  label: string;
  labelPL: string;
  description: string;
  Icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}> = {
  project: {
    label: 'Project',
    labelPL: 'Projektowy',
    description: 'Strumień z określonym końcem i rezultatem',
    Icon: Folder,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 border-purple-200',
  },
  continuous: {
    label: 'Continuous',
    labelPL: 'Ciągły',
    description: 'Strumień bez określonego końca (obszar życia)',
    Icon: ArrowsClockwise,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-200',
  },
  reference: {
    label: 'Reference',
    labelPL: 'Referencyjny',
    description: 'Baza wiedzy i materiały referencyjne',
    Icon: BookBookmark,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 border-amber-200',
  },
  client: {
    label: 'Client',
    labelPL: 'Klient',
    description: 'Strumień dedykowany klientowi',
    Icon: Buildings,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 border-indigo-200',
  },
  pipeline: {
    label: 'Pipeline',
    labelPL: 'Pipeline',
    description: 'Strumień sprzedażowy / procesowy',
    Icon: Funnel,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 border-rose-200',
  },
  workspace: {
    label: 'Workspace',
    labelPL: 'Przestrzeń',
    description: 'Główna przestrzeń robocza',
    Icon: House,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-200',
  },
  custom: {
    label: 'Custom',
    labelPL: 'Własny',
    description: 'Niestandardowy wzorzec strumienia',
    Icon: Sparkle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 border-slate-200',
  },
};

const sizeConfig = {
  sm: { iconSize: 14, text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { iconSize: 16, text: 'text-sm', padding: 'px-2.5 py-1' },
  lg: { iconSize: 20, text: 'text-base', padding: 'px-3 py-1.5' },
};

export default function StreamPatternBadge({
  pattern,
  size = 'md',
  showLabel = true,
  className = '',
}: StreamPatternBadgeProps) {
  const config = patternConfig[pattern] || patternConfig.custom;
  const sizes = sizeConfig[size];
  const { Icon } = config;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 ${sizes.padding} ${config.bgColor} ${config.color} font-medium ${className}`}
      title={config.description}
    >
      <Icon size={sizes.iconSize} weight="duotone" />
      {showLabel && <span className={sizes.text}>{config.labelPL}</span>}
    </Badge>
  );
}

// Export helpers
export const getStreamPatternIcon = (pattern: StreamPattern) => {
  return (patternConfig[pattern] || patternConfig.custom).Icon;
};

export const getStreamPatternLabel = (pattern: StreamPattern, lang: 'en' | 'pl' = 'pl') => {
  const config = patternConfig[pattern] || patternConfig.custom;
  return lang === 'pl' ? config.labelPL : config.label;
};

export const getStreamPatternDescription = (pattern: StreamPattern) => {
  return (patternConfig[pattern] || patternConfig.custom).description;
};
