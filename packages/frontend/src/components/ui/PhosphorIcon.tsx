'use client';

/**
 * 🎨 Phosphor Icon Wrapper Component
 * Unified system dla ikon Phosphor z kontekstowym styling
 */

import React from 'react';
import { IconWeight } from 'phosphor-react';

export interface PhosphorIconProps {
  /** Komponent ikony z phosphor-react */
  icon: React.ComponentType<any>;
  /** Waga ikony - wpływa na grubość linii */
  weight?: IconWeight | string;
  /** Rozmiar w pikselach */
  size?: number;
  /** Priorytet - automatyczne mapowanie na weight */
  priority?: 'low' | 'medium' | 'high';
  /** Stan aktywny - używa fill weight */
  active?: boolean;
  /** Dodatkowe klasy CSS */
  className?: string;
  /** Callback onClick */
  onClick?: () => void;
}

/**
 * Mapowanie priorytetów na wagi ikon
 */
const PRIORITY_WEIGHTS: Record<string, IconWeight> = {
  low: 'thin',
  medium: 'regular', 
  high: 'bold'
};

/**
 * Wrapper component dla ikon Phosphor
 * Zapewnia spójny system wagowania i stylowania
 */
export function PhosphorIcon({
  icon: IconComponent,
  weight = 'regular',
  size = 24,
  priority,
  active = false,
  className = '',
  onClick
}: PhosphorIconProps) {
  // Ustal wagę na podstawie priorytu lub stanu aktywnego
  const finalWeight = active 
    ? 'fill' 
    : priority 
      ? PRIORITY_WEIGHTS[priority] 
      : weight;

  // Klasy bazowe + opcjonalne
  const baseClasses = 'transition-all duration-200';
  const interactiveClasses = onClick ? 'cursor-pointer hover:opacity-70' : '';
  const finalClasses = `${baseClasses} ${interactiveClasses} ${className}`.trim();

  return (
    <IconComponent
      weight={finalWeight}
      size={size}
      className={finalClasses}
      onClick={onClick}
    />
  );
}

/**
 * Hook do szybkiego użycia z różnymi presetami
 */
export const usePhosphorPresets = () => ({
  // GTD System
  gtd: {
    inbox: { weight: 'thin' as IconWeight, priority: 'low' as const },
    action: { weight: 'bold' as IconWeight, priority: 'high' as const },
    waiting: { weight: 'regular' as IconWeight, priority: 'medium' as const },
    completed: { weight: 'fill' as IconWeight, active: true }
  },
  
  // Priorities  
  priority: {
    low: { weight: 'thin' as IconWeight, className: 'text-gray-400' },
    medium: { weight: 'regular' as IconWeight, className: 'text-blue-500' },
    high: { weight: 'bold' as IconWeight, className: 'text-red-500' },
    critical: { weight: 'fill' as IconWeight, className: 'text-red-600' }
  },

  // UI States
  ui: {
    inactive: { weight: 'thin' as IconWeight, className: 'text-gray-300' },
    default: { weight: 'regular' as IconWeight, className: 'text-gray-600' },
    active: { weight: 'fill' as IconWeight, className: 'text-primary-600' },
    hover: { weight: 'bold' as IconWeight, className: 'text-primary-700' }
  }
});

export default PhosphorIcon;