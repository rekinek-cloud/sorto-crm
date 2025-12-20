'use client';

import React from 'react';

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  size = 'md',
  showLabel = false
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-100',
          emoji: '🔴',
          label: 'Pilne'
        };
      case 'high':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-100',
          emoji: '🟡',
          label: 'Wysokie'
        };
      case 'medium':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-100',
          emoji: '🟢',
          label: 'Średnie'
        };
      case 'low':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-100',
          emoji: '🔵',
          label: 'Niskie'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100',
          emoji: '⚪',
          label: 'Brak'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          dot: 'w-2 h-2',
          container: 'text-xs',
          padding: 'px-1.5 py-0.5'
        };
      case 'lg':
        return {
          dot: 'w-4 h-4',
          container: 'text-base',
          padding: 'px-3 py-1.5'
        };
      default:
        return {
          dot: 'w-3 h-3',
          container: 'text-sm',
          padding: 'px-2 py-1'
        };
    }
  };

  const config = getPriorityConfig();
  const sizeClasses = getSizeClasses();

  if (showLabel) {
    return (
      <span 
        className={`inline-flex items-center space-x-1 rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses.container} ${sizeClasses.padding}`}
      >
        <span className={`rounded-full ${config.color} ${sizeClasses.dot}`}></span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div 
      className={`rounded-full ${config.color} ${sizeClasses.dot}`}
      title={`Priorytet: ${config.label}`}
    ></div>
  );
};