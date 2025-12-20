'use client';

import React from 'react';

interface AIPrediction {
  type: 'win_probability' | 'close_date' | 'sentiment' | 'complexity' | 'risk';
  value: number | string;
  confidence: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

interface AIPredictionBadgeProps {
  prediction: AIPrediction;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const AIPredictionBadge: React.FC<AIPredictionBadgeProps> = ({
  prediction,
  size = 'md',
  showDetails = false
}) => {
  const getPredictionConfig = () => {
    switch (prediction.type) {
      case 'win_probability':
        return {
          icon: '🎯',
          label: 'Win Rate',
          unit: '%',
          color: getConfidenceColor(prediction.confidence),
          bgColor: getConfidenceBgColor(prediction.confidence)
        };
      case 'close_date':
        return {
          icon: '📅',
          label: 'Close Date',
          unit: '',
          color: 'text-blue-700',
          bgColor: 'bg-blue-100'
        };
      case 'sentiment':
        return {
          icon: getSentimentIcon(Number(prediction.value)),
          label: 'Sentiment',
          unit: '',
          color: getSentimentColor(Number(prediction.value)),
          bgColor: getSentimentBgColor(Number(prediction.value))
        };
      case 'complexity':
        return {
          icon: '🔧',
          label: 'Complexity',
          unit: '',
          color: getComplexityColor(String(prediction.value)),
          bgColor: getComplexityBgColor(String(prediction.value))
        };
      case 'risk':
        return {
          icon: '⚠️',
          label: 'Risk',
          unit: '',
          color: getRiskColor(String(prediction.value)),
          bgColor: getRiskBgColor(String(prediction.value))
        };
      default:
        return {
          icon: '🤖',
          label: 'AI',
          unit: '',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-700';
    if (confidence >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100';
    if (confidence >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSentimentIcon = (value: number) => {
    if (value >= 0.5) return '😊';
    if (value >= 0) return '😐';
    if (value >= -0.5) return '😟';
    return '😡';
  };

  const getSentimentColor = (value: number) => {
    if (value >= 0.5) return 'text-green-700';
    if (value >= 0) return 'text-blue-700';
    if (value >= -0.5) return 'text-orange-700';
    return 'text-red-700';
  };

  const getSentimentBgColor = (value: number) => {
    if (value >= 0.5) return 'bg-green-100';
    if (value >= 0) return 'bg-blue-100';
    if (value >= -0.5) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getComplexityColor = (value: string) => {
    switch (value) {
      case 'simple': return 'text-green-700';
      case 'moderate': return 'text-yellow-700';
      case 'complex': return 'text-orange-700';
      case 'very_complex': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const getComplexityBgColor = (value: string) => {
    switch (value) {
      case 'simple': return 'bg-green-100';
      case 'moderate': return 'bg-yellow-100';
      case 'complex': return 'bg-orange-100';
      case 'very_complex': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getRiskColor = (value: string) => {
    switch (value) {
      case 'low': return 'text-green-700';
      case 'medium': return 'text-yellow-700';
      case 'high': return 'text-orange-700';
      case 'critical': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const getRiskBgColor = (value: string) => {
    switch (value) {
      case 'low': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'high': return 'bg-orange-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getTrendIcon = () => {
    switch (prediction.trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const formatValue = (value: number | string, unit: string) => {
    if (typeof value === 'number') {
      if (unit === '%') {
        return `${Math.round(value)}${unit}`;
      }
      return `${value}${unit}`;
    }
    return String(value);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-xs px-2 py-1',
          icon: 'text-xs'
        };
      case 'lg':
        return {
          container: 'text-base px-4 py-2',
          icon: 'text-lg'
        };
      default:
        return {
          container: 'text-sm px-3 py-1.5',
          icon: 'text-sm'
        };
    }
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diffMs = now.getTime() - prediction.lastUpdated.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'just now';
  };

  const config = getPredictionConfig();
  const sizeClasses = getSizeClasses();

  return (
    <div className="relative">
      <span 
        className={`inline-flex items-center space-x-1 rounded-full border ${config.bgColor} ${config.color} border-current border-opacity-20 ${sizeClasses.container}`}
        title={showDetails ? undefined : `AI ${config.label}: ${formatValue(prediction.value, config.unit)} (${prediction.confidence}% confidence)`}
      >
        <span className={sizeClasses.icon}>
          {config.icon}
        </span>
        <span className="font-medium">
          {formatValue(prediction.value, config.unit)}
        </span>
        <span className="opacity-75">
          {prediction.confidence}%
        </span>
        {prediction.trend !== 'stable' && (
          <span className={sizeClasses.icon}>
            {getTrendIcon()}
          </span>
        )}
      </span>

      {showDetails && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-64">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">AI {config.label}</span>
              <span className={`px-2 py-1 rounded text-xs ${config.bgColor} ${config.color}`}>
                {prediction.confidence}% confidence
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Wartość:</span>
              <span className="font-medium">
                {formatValue(prediction.value, config.unit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Trend:</span>
              <span className="flex items-center space-x-1">
                <span>{getTrendIcon()}</span>
                <span className="capitalize">{prediction.trend}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Aktualizacja:</span>
              <span className="text-gray-500">
                {formatLastUpdated()}
              </span>
            </div>

            {prediction.type === 'win_probability' && (
              <div className="pt-2 border-t text-xs text-gray-600">
                Oparte na: historii dealów, aktywności klienta, czasie w pipeline
              </div>
            )}

            {prediction.type === 'sentiment' && (
              <div className="pt-2 border-t text-xs text-gray-600">
                Analiza: email, rozmowy, feedback klienta
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};