'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export type BentoCardVariant = 'default' | 'glass' | 'gradient' | 'neon';
export type BentoCardSize = 'sm' | 'md' | 'lg' | 'xl';

interface BentoCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  value?: string | number;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: BentoCardVariant;
  size?: BentoCardSize;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export function BentoCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  value,
  trend,
  variant = "glass",
  size = "md",
  loading = false,
  onClick,
  className = "",
  children,
  footer,
  headerAction,
}: BentoCardProps) {
  const variantStyles: Record<BentoCardVariant, string> = {
    default: "bg-white border-slate-200 shadow-sm",
    glass: "bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm",
    gradient: "bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm",
    neon: "bg-white border-blue-200 shadow-md shadow-blue-100",
  };

  const sizeStyles: Record<BentoCardSize, string> = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
    xl: "p-6",
  };

  const isClickable = typeof onClick === "function";

  const baseClasses = [
    "relative rounded-2xl border overflow-hidden",
    "transition-all duration-300 ease-out",
    variantStyles[variant],
    sizeStyles[size],
    isClickable ? "cursor-pointer hover:border-slate-300 hover:shadow-md" : "",
    className
  ].filter(Boolean).join(" ");

  const content = (
    <>
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={"p-2 rounded-xl bg-slate-100 " + iconColor}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {headerAction}
      </div>

      {(value !== undefined || trend) && (
        <div className="flex items-end justify-between mb-3">
          {value !== undefined && (
            <div className="text-2xl font-bold text-slate-800">{value}</div>
          )}
          {trend && (
            <div className={"flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full " + (trend.value >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
              {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-slate-400 ml-1">{trend.label}</span>}
            </div>
          )}
        </div>
      )}

      {children && <div className="flex-1">{children}</div>}

      {footer && (
        <div className="mt-3 pt-3 border-t border-slate-100">{footer}</div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={baseClasses}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

interface MiniStatProps {
  label: string;
  value: string | number;
  color?: string;
}

export function MiniStat({ label, value, color = "text-blue-600" }: MiniStatProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={"text-sm font-semibold " + color}>{value}</span>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  max = 100,
  color = "bg-blue-500",
  showLabel = false,
  size = "sm",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      <div className={"w-full bg-slate-200 rounded-full overflow-hidden " + (size === "sm" ? "h-1.5" : "h-2.5")}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: percentage + "%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={"h-full rounded-full " + color}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">{value}</span>
          <span className="text-xs text-slate-400">{max}</span>
        </div>
      )}
    </div>
  );
}

export default BentoCard;
