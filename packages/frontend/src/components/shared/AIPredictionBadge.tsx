'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { AIPrediction, RiskFactor, Recommendation } from '@/types/views';

interface AIPredictionBadgeProps {
  prediction: AIPrediction;
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function AIPredictionBadge({ 
  prediction, 
  showDetails = false,
  onClick,
  className = '' 
}: AIPredictionBadgeProps) {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getProbabilityColor = (probability: number): string => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskSeverityIcon = (severity: RiskFactor['severity']): string => {
    switch (severity) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getRecommendationIcon = (type: Recommendation['type']): string => {
    switch (type) {
      case 'action': return '⚡';
      case 'timing': return '⏰';
      case 'resource': return '👥';
      case 'strategy': return '🎯';
      default: return '💡';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pl-PL', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const daysUntilClose = Math.ceil(
    (prediction.predictedCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Main Prediction Badge */}
      <div className="flex items-center space-x-2">
        <Badge 
          variant="secondary" 
          className={`text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}
        >
          🤖 AI: {Math.round(prediction.winProbability)}%
        </Badge>
        
        <span className={`text-xs font-medium ${getProbabilityColor(prediction.winProbability)}`}>
          📅 {daysUntilClose > 0 ? `${daysUntilClose}d` : 'Overdue'}
        </span>

        <Badge variant="outline" className="text-xs">
          ✅ {prediction.confidence}%
        </Badge>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 text-sm">AI Analysis</h4>
            <span className="text-xs text-gray-500">
              Updated: {formatDate(prediction.lastUpdated)}
            </span>
          </div>

          {/* Win Probability */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Win Probability</span>
              <span className={`text-sm font-bold ${getProbabilityColor(prediction.winProbability)}`}>
                {Math.round(prediction.winProbability)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  prediction.winProbability >= 75 ? 'bg-green-500' :
                  prediction.winProbability >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${prediction.winProbability}%` }}
              />
            </div>
          </div>

          {/* Predicted Close Date */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Predicted Close</span>
            <span className="text-sm text-gray-900">
              {formatDate(prediction.predictedCloseDate)}
              {daysUntilClose <= 7 && daysUntilClose > 0 && (
                <span className="ml-1 text-orange-600 font-medium">⚠️ Soon</span>
              )}
              {daysUntilClose <= 0 && (
                <span className="ml-1 text-red-600 font-medium">🚨 Overdue</span>
              )}
            </span>
          </div>

          {/* Risk Factors */}
          {prediction.riskFactors.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Risk Factors</h5>
              <div className="space-y-1">
                {prediction.riskFactors.slice(0, 3).map((risk, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-sm">{getRiskSeverityIcon(risk.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 truncate">{risk.description}</p>
                      {risk.mitigation && (
                        <p className="text-xs text-gray-600 italic mt-1 truncate">
                          💡 {risk.mitigation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {prediction.riskFactors.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{prediction.riskFactors.length - 3} more risks
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Top Recommendations */}
          {prediction.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">AI Recommendations</h5>
              <div className="space-y-1">
                {prediction.recommendations
                  .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
                  .slice(0, 2)
                  .map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-sm">{getRecommendationIcon(rec.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800">{rec.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            +{rec.estimatedImpact}% impact
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              rec.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">AI Confidence</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${
                      prediction.confidence >= 80 ? 'bg-green-500' :
                      prediction.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {prediction.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}