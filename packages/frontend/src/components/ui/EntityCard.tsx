'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityCardProps {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EntityCard({ title, subtitle, meta, icon, badge, onClick, className, children }: EntityCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30',
        'rounded-2xl p-4 shadow-sm transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          {meta && <div className="mt-2">{meta}</div>}
          {children && <div className="mt-3">{children}</div>}
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1" />}
      </div>
    </motion.div>
  );
}

export default EntityCard;
