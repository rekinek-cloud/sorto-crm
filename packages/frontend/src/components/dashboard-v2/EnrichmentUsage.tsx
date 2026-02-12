'use client';

import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnrichment } from '@/hooks/useEnrichment';

interface EnrichmentUsageProps {
  /** Dodatkowe klasy CSS */
  className?: string;
  /** Czy pokazać jako kompaktowy widget */
  compact?: boolean;
}

export function EnrichmentUsage({ className, compact = false }: EnrichmentUsageProps) {
  const { usage, isLoadingUsage, hasAccess, remaining, limit, plan, refetchUsage } =
    useEnrichment();

  if (isLoadingUsage) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const isUnlimited = limit === -1;
  const usagePercent = isUnlimited ? 0 : Math.round((usage?.used ?? 0) / limit * 100);
  const isLow = !isUnlimited && remaining <= 10;
  const isExhausted = !isUnlimited && remaining === 0;

  const renewDate = usage?.renewsAt
    ? new Date(usage.renewsAt).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm',
          isExhausted && 'text-red-600 dark:text-red-400',
          isLow && !isExhausted && 'text-amber-600 dark:text-amber-400',
          !isLow && 'text-gray-600 dark:text-gray-400',
          className
        )}
        title={`Wzbogacanie danych: ${isUnlimited ? 'bez limitu' : `${remaining}/${limit}`}`}
      >
        <Sparkles className="h-4 w-4" />
        <span>
          {isUnlimited ? '∞' : remaining}/{isUnlimited ? '∞' : limit}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Wzbogacanie AI
          </h3>
        </div>
        <button
          onClick={() => refetchUsage()}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          title="Odśwież"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Wykorzystano</span>
            <span>{usagePercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                isExhausted && 'bg-red-500',
                isLow && !isExhausted && 'bg-amber-500',
                !isLow && 'bg-violet-500'
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Pozostało</div>
          <div
            className={cn(
              'font-semibold',
              isExhausted && 'text-red-600 dark:text-red-400',
              isLow && !isExhausted && 'text-amber-600 dark:text-amber-400',
              !isLow && 'text-gray-900 dark:text-white'
            )}
          >
            {isUnlimited ? 'Bez limitu' : remaining}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Limit</div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {isUnlimited ? '∞' : limit}/mies.
          </div>
        </div>
      </div>

      {/* Plan info */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Plan: <span className="font-medium text-gray-700 dark:text-gray-300">{plan}</span>
        </span>
        {renewDate && (
          <span className="text-gray-500 dark:text-gray-400">
            Odnowienie: {renewDate}
          </span>
        )}
      </div>
    </div>
  );
}

export default EnrichmentUsage;
