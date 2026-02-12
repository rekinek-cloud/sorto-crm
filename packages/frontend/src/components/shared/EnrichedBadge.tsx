'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrichedBadgeProps {
  /** Data wzbogacenia */
  enrichedAt?: string | Date;
  /** Źródło danych */
  source?: string;
  /** Czy dane pochodzą z cache */
  cacheHit?: boolean;
  /** Rozmiar badge'a */
  size?: 'sm' | 'md' | 'lg';
  /** Czy pokazać tooltip z datą */
  showTooltip?: boolean;
  /** Dodatkowe klasy CSS */
  className?: string;
  /** Wariant kolorystyczny */
  variant?: 'default' | 'success' | 'info';
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2 py-1 gap-1',
  lg: 'text-sm px-2.5 py-1 gap-1.5',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

const variantClasses = {
  default: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export function EnrichedBadge({
  enrichedAt,
  source,
  cacheHit,
  size = 'sm',
  showTooltip = true,
  className,
  variant = 'default',
}: EnrichedBadgeProps) {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const tooltipText = () => {
    const parts: string[] = ['Wzbogacone przez AI'];
    if (enrichedAt) {
      parts.push(`Data: ${formatDate(enrichedAt)}`);
    }
    if (source) {
      parts.push(`Źródło: ${source}`);
    }
    if (cacheHit) {
      parts.push('(z cache)');
    }
    return parts.join(' • ');
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={showTooltip ? tooltipText() : undefined}
    >
      <Sparkles className={iconSizes[size]} />
      <span>Wzbogacone AI</span>
    </span>
  );
}

/**
 * Prostsza wersja badge'a - tylko ikona
 */
export function EnrichedIcon({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Sparkles
      className={cn(
        'text-violet-500 dark:text-violet-400',
        iconSizes[size],
        className
      )}
      title="Dane wzbogacone przez AI"
    />
  );
}

export default EnrichedBadge;
