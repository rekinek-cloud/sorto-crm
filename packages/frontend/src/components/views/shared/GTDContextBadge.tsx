'use client';

import React from 'react';

interface GTDContextBadgeProps {
  context: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const GTDContextBadge: React.FC<GTDContextBadgeProps> = ({
  context,
  size = 'md',
  showIcon = true
}) => {
  const getContextConfig = () => {
    const normalizedContext = context.toLowerCase().replace('@', '');
    
    switch (normalizedContext) {
      case 'calls':
      case 'call':
        return {
          icon: '📞',
          label: '@calls',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'email':
      case 'emails':
        return {
          icon: '📧',
          label: '@email',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'meeting':
      case 'meetings':
        return {
          icon: '🤝',
          label: '@meetings',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'computer':
        return {
          icon: '💻',
          label: '@computer',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
      case 'proposal':
      case 'proposals':
        return {
          icon: '📄',
          label: '@proposals',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200'
        };
      case 'errands':
        return {
          icon: '🚗',
          label: '@errands',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'waiting':
        return {
          icon: '⏳',
          label: '@waiting',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
      case 'reading':
        return {
          icon: '📚',
          label: '@reading',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-200'
        };
      case 'planning':
        return {
          icon: '🎯',
          label: '@planning',
          bgColor: 'bg-teal-100',
          textColor: 'text-teal-700',
          borderColor: 'border-teal-200'
        };
      case 'office':
        return {
          icon: '🏢',
          label: '@office',
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-700',
          borderColor: 'border-slate-200'
        };
      case 'home':
        return {
          icon: '🏠',
          label: '@home',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200'
        };
      case 'online':
        return {
          icon: '🌐',
          label: '@online',
          bgColor: 'bg-cyan-100',
          textColor: 'text-cyan-700',
          borderColor: 'border-cyan-200'
        };
      default:
        return {
          icon: '📋',
          label: context.startsWith('@') ? context : `@${context}`,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          text: 'text-xs',
          padding: 'px-2 py-1',
          icon: 'text-xs'
        };
      case 'lg':
        return {
          text: 'text-base',
          padding: 'px-4 py-2',
          icon: 'text-lg'
        };
      default:
        return {
          text: 'text-sm',
          padding: 'px-3 py-1.5',
          icon: 'text-sm'
        };
    }
  };

  const config = getContextConfig();
  const sizeClasses = getSizeClasses();

  return (
    <span 
      className={`inline-flex items-center space-x-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses.text} ${sizeClasses.padding}`}
    >
      {showIcon && (
        <span className={sizeClasses.icon}>
          {config.icon}
        </span>
      )}
      <span className="font-medium">
        {config.label}
      </span>
    </span>
  );
};