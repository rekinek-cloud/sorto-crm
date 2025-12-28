/**
 * BentoGrid - Responsive grid container for dashboard widgets
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`
        grid gap-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        auto-rows-[minmax(120px,auto)]
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export default BentoGrid;
