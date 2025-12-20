'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  iconWeight?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'teal' | 'orange' | 'amber' | 'rose';
  href?: string;
}

interface ResponsiveDashboardProps {
  cards: DashboardCard[];
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-600',
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    icon: 'text-teal-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'text-orange-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: 'text-rose-600',
  },
};

export default function ResponsiveDashboard({ cards, className = '' }: ResponsiveDashboardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.1 : 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className={`grid gap-4 sm:gap-6 ${
        isMobile 
          ? 'grid-cols-1 sm:grid-cols-2' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      } ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => {
        const colors = colorClasses[card.color];
        
        return (
          <motion.div
            key={card.id}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
            className={`relative overflow-hidden rounded-xl border ${colors.bg} ${colors.border} p-4 sm:p-6 transition-all duration-200 hover:shadow-lg`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-current"></div>
              <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-current"></div>
            </div>

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${colors.text} truncate`}>
                    {card.title}
                  </p>
                  <div className="mt-1 flex items-baseline">
                    <p className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>
                      {card.value}
                    </p>
                    {card.change && (
                      <p className={`ml-2 text-sm font-medium ${
                        card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl ${colors.icon}`}>
                  {card.icon && <card.icon size={32} weight={card.iconWeight || 'duotone'} />}
                </div>
              </div>

              {/* Progress Bar (if applicable) */}
              {card.id === 'tasks-progress' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={colors.text}>Progress</span>
                    <span className={colors.text}>75%</span>
                  </div>
                  <div className="mt-1 w-full bg-white rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${colors.icon.replace('text-', 'bg-')}`}
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Touch indicator for mobile */}
              {isMobile && card.href && (
                <div className="absolute bottom-2 right-2 opacity-50">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}