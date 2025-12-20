'use client';

import React, { useState } from 'react';
import { BucketGroup, ViewTypeId, bucketViewHelpers } from '@/lib/api/gtdMapViews';

interface BucketViewCardProps {
  bucket: BucketGroup;
  viewType: ViewTypeId;
  onSelect?: (bucket: BucketGroup) => void;
  isSelected?: boolean;
  mode?: 'grid' | 'list';
  showItems?: boolean;
}

export default function BucketViewCard({
  bucket,
  viewType,
  onSelect,
  isSelected = false,
  mode = 'grid',
  showItems = false
}: BucketViewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const urgencyScore = bucketViewHelpers.calculateUrgencyScore(bucket);
  const recommendedAction = bucketViewHelpers.getRecommendedAction(bucket, viewType);
  const formattedMetadata = bucketViewHelpers.formatMetadata(bucket.metadata || {});
  const bucketGradient = bucketViewHelpers.getBucketGradient(bucket);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(bucket);
    }
    if (mode === 'list') {
      setIsExpanded(!isExpanded);
    }
  };

  const getTaskPreview = () => {
    if (!bucket.items || bucket.items.length === 0) return [];
    return bucket.items.slice(0, 3); // Show first 3 tasks
  };

  const getUrgencyBadge = () => {
    if (viewType !== 'urgency') return null;
    
    const badgeColors = {
      overdue: 'bg-red-100 text-red-800',
      urgent: 'bg-yellow-100 text-yellow-800',
      important: 'bg-blue-100 text-blue-800',
      normal: 'bg-green-100 text-green-800'
    };

    const badgeClass = badgeColors[bucket.id as keyof typeof badgeColors] || 'bg-gray-100 text-gray-800';

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {bucket.icon} {urgencyScore}/100
      </div>
    );
  };

  const getEnergyBadge = () => {
    if (viewType !== 'energy') return null;
    
    const energyColors = {
      'high-energy': 'bg-red-100 text-red-800',
      'medium-energy': 'bg-yellow-100 text-yellow-800',
      'low-energy': 'bg-green-100 text-green-800'
    };

    const badgeClass = energyColors[bucket.id as keyof typeof energyColors] || 'bg-gray-100 text-gray-800';
    const bestTime = bucket.metadata?.bestTime || 'anytime';

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {bucket.icon} {bestTime}
      </div>
    );
  };

  const getHorizonBadge = () => {
    if (viewType !== 'horizon') return null;
    
    const level = bucket.metadata?.horizonLevel || 0;
    const reviewFreq = bucket.metadata?.reviewFrequency || 'as-needed';
    
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {bucket.icon} Level {level} • {reviewFreq}
      </div>
    );
  };

  if (mode === 'list') {
    return (
      <div
        className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer ${
          isSelected ? 'border-primary-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                style={{ background: bucketGradient }}
              >
                {bucket.icon}
              </div>
              
              {/* Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {bucket.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {bucket.description}
                </p>
              </div>
            </div>
            
            {/* Stats and Badges */}
            <div className="flex items-center space-x-4">
              {/* Count */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {bucket.count}
                </div>
                <div className="text-xs text-gray-500">
                  zadań
                </div>
              </div>
              
              {/* Badges */}
              <div className="space-y-1">
                {getUrgencyBadge()}
                {getEnergyBadge()}
                {getHorizonBadge()}
              </div>
              
              {/* Expand Arrow */}
              <svg 
                className={`w-5 h-5 text-gray-400 transform transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Recommended Action */}
          {recommendedAction && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                💡 {recommendedAction}
              </p>
            </div>
          )}
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {/* Metadata */}
            {formattedMetadata.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Szczegóły:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {formattedMetadata.map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Task Preview */}
            {bucket.count > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Przykładowe zadania ({Math.min(3, bucket.count)} z {bucket.count}):
                </h4>
                <div className="space-y-2">
                  {getTaskPreview().map((task, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="flex-1">{task.title}</span>
                      {task.priority && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  ))}
                  {bucket.count > 3 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      i {bucket.count - 3} więcej zadań...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grid Mode
  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
        isSelected ? 'border-primary-500 shadow-lg transform scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={handleCardClick}
    >
      {/* Header with gradient background */}
      <div 
        className="p-4 rounded-t-lg"
        style={{ background: bucketGradient }}
      >
        <div className="flex items-center justify-between text-white">
          <div className="text-2xl">{bucket.icon}</div>
          <div className="text-right">
            <div className="text-2xl font-bold">{bucket.count}</div>
            <div className="text-xs opacity-90">zadań</div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {bucket.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {bucket.description}
        </p>
        
        {/* Badges */}
        <div className="space-y-2">
          {getUrgencyBadge()}
          {getEnergyBadge()}
          {getHorizonBadge()}
        </div>
        
        {/* Progress Bar (for non-empty buckets) */}
        {bucket.count > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (bucket.count / 20) * 100)}%`,
                  backgroundColor: bucket.color 
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {bucket.count > 20 ? '20+' : bucket.count} elementów
            </div>
          </div>
        )}
        
        {/* Recommended Action */}
        {recommendedAction && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 {recommendedAction}
          </div>
        )}
      </div>
    </div>
  );
}