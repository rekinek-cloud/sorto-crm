'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EnhancedCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  value?: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'glass' | 'modern' | 'neon' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function EnhancedCard({
  title,
  description,
  icon: Icon,
  value,
  trend,
  variant = 'glass',
  size = 'md',
  onClick,
  className = '',
  children,
  loading = false,
  disabled = false,
}: EnhancedCardProps) {
  const variants = {
    glass: 'glass-card',
    modern: 'card-modern',
    neon: 'card-neon',
    gradient: 'bg-gradient-aurora backdrop-blur-md border border-white/20 rounded-2xl p-6',
  };

  const sizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseClasses = `
    ${variants[variant]} 
    ${sizes[size]}
    ${onClick ? 'cursor-pointer hover-lift' : ''}
    ${disabled ? 'opacity-50 pointer-events-none' : ''}
    ${className}
    transition-all duration-300 relative overflow-hidden
  `;

  const cardContent = (
    <>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="relative floating">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-30" />
              <Icon className="relative z-10 w-6 h-6 text-blue-300" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-white/70 mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value display */}
      {value && (
        <div className="mb-4">
          <div className="text-3xl font-bold text-gradient-primary">
            {value}
          </div>
        </div>
      )}

      {/* Custom content */}
      {children && (
        <div className="space-y-4">
          {children}
        </div>
      )}

      {/* Shimmer effect for loading states */}
      {loading && variant === 'glass' && (
        <div className="shimmer absolute inset-0"></div>
      )}
    </>
  );

  if (onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={baseClasses}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {cardContent}
    </div>
  );
}

// Preset components for common use cases
export function MetricCard({ title, value, trend, icon, description }: {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon?: LucideIcon;
  description?: string;
}) {
  return (
    <EnhancedCard
      title={title}
      value={value}
      trend={trend}
      icon={icon}
      description={description}
      variant="glass"
    />
  );
}

export function ActionCard({ title, description, icon, onClick, loading }: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <EnhancedCard
      title={title}
      description={description}
      icon={icon}
      onClick={onClick}
      loading={loading}
      variant="modern"
    />
  );
}

export function FeatureCard({ title, description, icon, children }: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <EnhancedCard
      title={title}
      description={description}
      icon={icon}
      variant="neon"
    >
      {children}
    </EnhancedCard>
  );
}

export default EnhancedCard;