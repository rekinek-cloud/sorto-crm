'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  Phone,
  Envelope,
  Handshake,
  Desktop,
  Car,
  Hourglass,
  BookOpen,
  Target,
  Tag as TagIcon,
} from 'phosphor-react';

// Typy tagów (ex GTDContext)
export type TagType =
  | '@calls'
  | '@email'
  | '@meetings'
  | '@computer'
  | '@errands'
  | '@waiting'
  | '@reading'
  | '@planning'
  | string;

interface TagBadgeProps {
  tag: TagType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'full' | 'minimal' | 'icon';
  showLabel?: boolean;
  showDescription?: boolean;
  className?: string;
}

// Konfiguracja tagów z ikonami Phosphor (zamiast emoji)
const tagConfig: Record<string, {
  label: string;
  Icon: React.ComponentType<any>;
  description: string;
  color: string;
  bgColor: string;
  optimalTiming: string;
  energyLevel: string;
}> = {
  '@calls': {
    label: 'Rozmowy',
    Icon: Phone,
    description: 'Rozmowy telefoniczne z klientami',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    optimalTiming: 'Morning',
    energyLevel: 'Medium'
  },
  '@email': {
    label: 'E-mail',
    Icon: Envelope,
    description: 'Korespondencja e-mailowa',
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50',
    optimalTiming: 'Anytime',
    energyLevel: 'Low'
  },
  '@meetings': {
    label: 'Spotkania',
    Icon: Handshake,
    description: 'Spotkania twarzą w twarz',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50',
    optimalTiming: 'Afternoon',
    energyLevel: 'High'
  },
  '@computer': {
    label: 'Komputer',
    Icon: Desktop,
    description: 'Praca przy komputerze',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    bgColor: 'bg-indigo-50',
    optimalTiming: 'Morning',
    energyLevel: 'Medium'
  },
  '@errands': {
    label: 'Sprawy',
    Icon: Car,
    description: 'Sprawy poza biurem',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    optimalTiming: 'Afternoon',
    energyLevel: 'Medium'
  },
  '@waiting': {
    label: 'Oczekiwanie',
    Icon: Hourglass,
    description: 'Oczekiwanie na odpowiedź',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50',
    optimalTiming: 'Anytime',
    energyLevel: 'Minimal'
  },
  '@reading': {
    label: 'Czytanie',
    Icon: BookOpen,
    description: 'Dokumenty do przeczytania',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    bgColor: 'bg-pink-50',
    optimalTiming: 'Evening',
    energyLevel: 'Low'
  },
  '@planning': {
    label: 'Planowanie',
    Icon: Target,
    description: 'Planowanie i strategia',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    bgColor: 'bg-cyan-50',
    optimalTiming: 'Morning',
    energyLevel: 'High'
  }
};

// Domyślna konfiguracja dla niestandardowych tagów
const defaultConfig = {
  label: 'Tag',
  Icon: TagIcon,
  description: 'Tag niestandardowy',
  color: 'bg-slate-100 text-slate-800 border-slate-200',
  bgColor: 'bg-slate-50',
  optimalTiming: 'Anytime',
  energyLevel: 'Medium'
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-1',
    text: 'text-xs',
    iconSize: 14,
    padding: 'px-2 py-1'
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    text: 'text-sm',
    iconSize: 16,
    padding: 'px-3 py-2'
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    text: 'text-base',
    iconSize: 20,
    padding: 'px-4 py-2'
  }
};

export default function TagBadge({
  tag,
  size = 'md',
  variant = 'badge',
  showLabel = true,
  showDescription = false,
  className = ''
}: TagBadgeProps) {
  const config = tagConfig[tag] || { ...defaultConfig, label: tag };
  const sizes = sizeConfig[size];
  const { Icon } = config;

  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={`${config.label}: ${config.description}`}
      >
        <Icon size={sizes.iconSize} weight="duotone" />
      </span>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Icon size={sizes.iconSize} weight="duotone" />
        {showLabel && (
          <span className={`${sizes.text} text-gray-700 font-medium`}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`${config.bgColor} rounded-lg ${sizes.padding} ${className}`}>
        <div className="flex items-start space-x-3">
          <Icon size={sizes.iconSize + 4} weight="duotone" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`${sizes.text} font-semibold text-gray-900`}>
                {config.label}
              </span>
              <Badge variant="outline" className="text-xs">
                {tag}
              </Badge>
            </div>
            {showDescription && (
              <p className="text-xs text-gray-600 mt-1">
                {config.description}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Hourglass size={12} /> {config.optimalTiming}
              </span>
              <span className="flex items-center gap-1">
                <Target size={12} /> {config.energyLevel} Energy
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default badge variant
  return (
    <Badge
      variant="secondary"
      className={`${sizes.badge} ${config.color} font-medium inline-flex items-center gap-1 ${className}`}
    >
      <Icon size={sizes.iconSize} weight="duotone" />
      {showLabel && (showDescription ? config.label : tag)}
    </Badge>
  );
}

// Helper functions
export const getTagOptimalTiming = (tag: TagType): string => {
  return (tagConfig[tag] || defaultConfig).optimalTiming;
};

export const getTagEnergyLevel = (tag: TagType): string => {
  return (tagConfig[tag] || defaultConfig).energyLevel;
};

export const groupTasksByTag = <T extends { tag?: TagType }>(tasks: T[]): Record<TagType, T[]> => {
  return tasks.reduce((groups, task) => {
    const tag = task.tag || '@custom';
    if (!groups[tag]) {
      groups[tag] = [];
    }
    groups[tag].push(task);
    return groups;
  }, {} as Record<TagType, T[]>);
};
