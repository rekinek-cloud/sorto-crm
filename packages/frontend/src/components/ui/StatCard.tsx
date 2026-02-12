'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label?: string };
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400', trend, onClick, className }: StatCardProps) {
  const Wrapper = onClick ? motion.div : 'div';
  const wrapperProps = onClick ? {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 },
    onClick,
  } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={cn(
        'bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-4 shadow-sm',
        'transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-xl', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}>
          {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend.value)}%</span>
          {trend.label && <span className="text-slate-400 dark:text-slate-500 ml-1">{trend.label}</span>}
        </div>
      )}
    </Wrapper>
  );
}

export default StatCard;
