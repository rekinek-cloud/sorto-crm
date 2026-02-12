'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonPageProps {
  className?: string;
  rows?: number;
  withStats?: boolean;
  withTable?: boolean;
}

export function SkeletonPage({ className, rows = 5, withStats = true, withTable = false }: SkeletonPageProps) {
  return (
    <div className={cn('animate-pulse space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Stats skeleton */}
      {withStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-6"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="ml-4 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table skeleton */}
      {withTable ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {[...Array(rows)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-6">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="flex-1" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Card grid skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(rows)].map((_, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-6 space-y-3"
            >
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SkeletonPage;
