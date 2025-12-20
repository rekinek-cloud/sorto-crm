'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { GTDContext } from '@/types/views';

interface GTDContextBadgeProps {
  context: GTDContext;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'full' | 'minimal' | 'icon';
  showLabel?: boolean;
  showDescription?: boolean;
  className?: string;
}

const contextConfig = {
  '@calls': {
    label: 'Rozmowy',
    icon: '📞',
    description: 'Rozmowy telefoniczne z klientami',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    optimalTiming: 'Morning',
    energyLevel: 'Medium'
  },
  '@email': {
    label: 'E-mail',
    icon: '📧',
    description: 'Korespondencja e-mailowa',
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50',
    optimalTiming: 'Anytime',
    energyLevel: 'Low'
  },
  '@meetings': {
    label: 'Spotkania',
    icon: '🤝',
    description: 'Spotkania twarzą w twarz',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50',
    optimalTiming: 'Afternoon',
    energyLevel: 'High'
  },
  '@computer': {
    label: 'Komputer',
    icon: '💻',
    description: 'Praca przy komputerze',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    bgColor: 'bg-indigo-50',
    optimalTiming: 'Morning',
    energyLevel: 'Medium'
  },
  '@errands': {
    label: 'Sprawy',
    icon: '🚗',
    description: 'Sprawy poza biurem',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    optimalTiming: 'Afternoon',
    energyLevel: 'Medium'
  },
  '@waiting': {
    label: 'Oczekiwanie',
    icon: '⏳',
    description: 'Oczekiwanie na odpowiedź',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50',
    optimalTiming: 'Anytime',
    energyLevel: 'Minimal'
  },
  '@reading': {
    label: 'Czytanie',
    icon: '📚',
    description: 'Dokumenty do przeczytania',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    bgColor: 'bg-pink-50',
    optimalTiming: 'Evening',
    energyLevel: 'Low'
  },
  '@planning': {
    label: 'Planowanie',
    icon: '🎯',
    description: 'Planowanie i strategia',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    bgColor: 'bg-cyan-50',
    optimalTiming: 'Morning',
    energyLevel: 'High'
  }
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-1',
    text: 'text-xs',
    icon: 'text-sm',
    padding: 'px-2 py-1'
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    text: 'text-sm',
    icon: 'text-base',
    padding: 'px-3 py-2'
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    text: 'text-base',
    icon: 'text-lg',
    padding: 'px-4 py-2'
  }
};

export default function GTDContextBadge({
  context,
  size = 'md',
  variant = 'badge',
  showLabel = true,
  showDescription = false,
  className = ''
}: GTDContextBadgeProps) {
  const config = contextConfig[context];
  const sizes = sizeConfig[size];

  if (variant === 'icon') {
    return (
      <span 
        className={`${sizes.icon} ${className}`} 
        title={`${config.label}: ${config.description}`}
      >
        {config.icon}
      </span>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <span className={sizes.icon}>{config.icon}</span>
        {showLabel && (
          <span className={`${sizes.text} text-gray-700 font-medium`}>
            {context}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`${config.bgColor} rounded-lg ${sizes.padding} ${className}`}>
        <div className="flex items-start space-x-3">
          <span className={sizes.icon}>{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`${sizes.text} font-semibold text-gray-900`}>
                {config.label}
              </span>
              <Badge variant="outline" className="text-xs">
                {context}
              </Badge>
            </div>
            {showDescription && (
              <p className="text-xs text-gray-600 mt-1">
                {config.description}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>⏰ {config.optimalTiming}</span>
              <span>⚡ {config.energyLevel} Energy</span>
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
      className={`${sizes.badge} ${config.color} font-medium ${className}`}
    >
      <span className="mr-1">{config.icon}</span>
      {showLabel && (showDescription ? config.label : context)}
    </Badge>
  );
}

// Helper function to get optimal timing for context
export const getContextOptimalTiming = (context: GTDContext): string => {
  return contextConfig[context].optimalTiming;
};

// Helper function to get energy level for context
export const getContextEnergyLevel = (context: GTDContext): string => {
  return contextConfig[context].energyLevel;
};

// Helper function to group tasks by context
export const groupTasksByContext = <T extends { gtdContext: GTDContext }>(tasks: T[]): Record<GTDContext, T[]> => {
  return tasks.reduce((groups, task) => {
    const context = task.gtdContext;
    if (!groups[context]) {
      groups[context] = [];
    }
    groups[context].push(task);
    return groups;
  }, {} as Record<GTDContext, T[]>);
};

// Helper function to suggest optimal contexts based on time of day
export const suggestOptimalContexts = (timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime'): GTDContext[] => {
  return Object.entries(contextConfig)
    .filter(([_, config]) => 
      config.optimalTiming.toLowerCase() === timeOfDay || 
      config.optimalTiming.toLowerCase() === 'anytime'
    )
    .map(([context]) => context as GTDContext);
};

// Helper function to get contexts by energy level
export const getContextsByEnergyLevel = (energyLevel: 'high' | 'medium' | 'low' | 'minimal'): GTDContext[] => {
  return Object.entries(contextConfig)
    .filter(([_, config]) => config.energyLevel.toLowerCase() === energyLevel)
    .map(([context]) => context as GTDContext);
};