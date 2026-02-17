'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

interface SmartScoreBadgeProps {
  score: number | null;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function SmartScoreBadge({ 
  score, 
  onClick, 
  size = 'md',
  showIcon = true 
}: SmartScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
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
        title="Click to analyze SMART criteria"
      >
        {showIcon && <BarChart3 className={`mr-1 ${getIconSize()}`} />}
        <span>Analyze</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center border rounded-full font-medium transition-colors ${getScoreColor(score)} ${getSizeClasses()} ${
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      }`}
      title={`SMART Score: ${score}/100 (${getScoreLabel(score)}) - Click for details`}
    >
      {showIcon && <BarChart3 className={`mr-1 ${getIconSize()}`} />}
      <span>{score}</span>
      {size === 'lg' && (
        <span className="ml-1 opacity-75">/ 100</span>
      )}
    </button>
  );
}