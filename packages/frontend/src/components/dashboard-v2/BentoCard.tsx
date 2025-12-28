/**
 * BentoCard - Universal card component for dashboard widgets
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

type CardSize = 'sm' | 'md' | 'lg' | 'xl' | 'wide' | 'tall';
type CardVariant = 'default' | 'gradient' | 'glass' | 'neon' | 'solid';
type GradientColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan' | 'amber';

interface BentoCardProps {
  title?: string;
  icon?: string;
  size?: CardSize;
  variant?: CardVariant;
  gradient?: GradientColor;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down';
  };
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-1 row-span-1 sm:col-span-1',
  lg: 'col-span-1 row-span-2 sm:col-span-2 sm:row-span-1',
  xl: 'col-span-1 row-span-2 sm:col-span-2 lg:col-span-2 lg:row-span-2',
  wide: 'col-span-1 sm:col-span-2',
  tall: 'col-span-1 row-span-2'
};

const gradientClasses: Record<GradientColor, string> = {
  purple: 'bg-gradient-to-br from-purple-500 to-indigo-600',
  blue: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  green: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  orange: 'bg-gradient-to-br from-orange-500 to-red-500',
  pink: 'bg-gradient-to-br from-pink-500 to-rose-500',
  cyan: 'bg-gradient-to-br from-cyan-400 to-blue-500',
  amber: 'bg-gradient-to-br from-amber-400 to-orange-500'
};

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 shadow-sm',
  gradient: '', // Will use gradientClasses
  glass: 'bg-white/80 backdrop-blur-lg border border-white/30 shadow-xl',
  neon: 'bg-gray-900 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  solid: 'bg-gray-50 border border-gray-100'
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

export function BentoCard({
  title,
  icon,
  size = 'md',
  variant = 'default',
  gradient = 'purple',
  trend,
  children,
  className = '',
  onClick,
  loading = false
}: BentoCardProps) {
  const isGradient = variant === 'gradient';
  const isNeon = variant === 'neon';
  const textColor = isGradient || isNeon ? 'text-white' : 'text-gray-900';
  const subTextColor = isGradient || isNeon ? 'text-white/70' : 'text-gray-500';

  return (
    <motion.div
      variants={itemVariants}
      whileHover={onClick ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
      className={`
        ${sizeClasses[size]}
        ${isGradient ? gradientClasses[gradient] : variantClasses[variant]}
        rounded-2xl p-5 overflow-hidden relative
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Header */}
      {(title || icon) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            {title && (
              <h3 className={`font-semibold ${textColor} text-sm uppercase tracking-wide`}>
                {title}
              </h3>
            )}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up'
                ? (isGradient ? 'text-green-200' : 'text-green-600')
                : (isGradient ? 'text-red-200' : 'text-red-600')
            }`}>
              <span>{trend.direction === 'up' ? '▲' : '▼'}</span>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className={subTextColor}>{trend.label}</span>}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`${textColor} h-full`}>
        {children}
      </div>

      {/* Decorative elements for gradient cards */}
      {isGradient && (
        <>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/10 rounded-full blur-xl" />
        </>
      )}

      {/* Neon glow effect */}
      {isNeon && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none" />
      )}
    </motion.div>
  );
}

// Skeleton loader for BentoCard
export function BentoCardSkeleton({ size = 'md' }: { size?: CardSize }) {
  return (
    <div className={`${sizeClasses[size]} bg-gray-100 rounded-2xl p-5 animate-pulse`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-8 bg-gray-200 rounded" />
        <div className="w-2/3 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default BentoCard;
