'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageShell({ children, className, noPadding }: PageShellProps) {
  return (
    <div className={cn(
      'min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-slate-100',
      'dark:from-slate-900 dark:via-slate-950 dark:to-slate-900',
      !noPadding && 'p-4 sm:p-6',
      className
    )}>
      {children}
    </div>
  );
}

export default PageShell;
