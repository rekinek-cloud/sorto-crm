'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ children, variant = 'default', dot, size = 'sm', className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      variantStyles[variant],
      className
    )}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-emerald-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'error' && 'bg-red-500',
          variant === 'info' && 'bg-blue-500',
          variant === 'default' && 'bg-slate-500',
          variant === 'neutral' && 'bg-slate-400',
        )} />
      )}
      {children}
    </span>
  );
}

export default StatusBadge;
