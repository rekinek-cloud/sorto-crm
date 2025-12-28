'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div
      className={`
        grid gap-4 p-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        auto-rows-min
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
}

export function BentoItem({
  children,
  className = '',
  colSpan = 1,
  rowSpan = 1
}: BentoItemProps) {
  const colSpanClasses: Record<number, string> = {
    1: 'col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-2 lg:col-span-3',
    4: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
  };

  const rowSpanClasses: Record<number, string> = {
    1: 'row-span-1',
    2: 'row-span-2',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        ${colSpanClasses[colSpan]}
        ${rowSpanClasses[rowSpan]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export default BentoGrid;
