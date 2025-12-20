'use client';

import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface FlowScoreBadgeProps {
  score: number | null;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function FlowScoreBadge({
  score,
  onClick,
  size = 'md',
  showIcon = true
}: FlowScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Doskonały';
    if (score >= 60) return 'Dobry';
    if (score >= 40) return 'Przeciętny';
    return 'Słaby';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  if (score === null) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center border border-gray-300 rounded-full font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors ${getSizeClasses()} ${
          onClick ? 'cursor-pointer' : 'cursor-default'
        }`}
        title="Kliknij, aby przeanalizować kryteria RZUT"
      >
        {showIcon && <ChartBarIcon className={`mr-1 ${getIconSize()}`} />}
        <span>Analizuj</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center border rounded-full font-medium transition-colors ${getScoreColor(score)} ${getSizeClasses()} ${
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      }`}
      title={`Flow Score: ${score}/100 (${getScoreLabel(score)}) - Kliknij po szczegóły`}
    >
      {showIcon && <ChartBarIcon className={`mr-1 ${getIconSize()}`} />}
      <span>{score}</span>
      {size === 'lg' && (
        <span className="ml-1 opacity-75">/ 100</span>
      )}
    </button>
  );
}
