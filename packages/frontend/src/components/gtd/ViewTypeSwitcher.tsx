'use client';

import React from 'react';
import { BucketViewType, ViewTypeId } from '@/lib/api/streamsMapViews';

interface ViewTypeSwitcherProps {
  viewTypes: BucketViewType[];
  activeViewType: ViewTypeId;
  onViewTypeChange: (viewType: ViewTypeId) => void;
  isLoading?: boolean;
}

export default function ViewTypeSwitcher({
  viewTypes,
  activeViewType,
  onViewTypeChange,
  isLoading = false
}: ViewTypeSwitcherProps) {
  // Group view types by category
  const groupedViewTypes = viewTypes.reduce((groups, viewType) => {
    const category = viewType.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(viewType);
    return groups;
  }, {} as Record<string, BucketViewType[]>);

  const categoryNames = {
    perspective: 'Perspektywa',
    time: 'Czas',
    organization: 'Organizacja',
    execution: 'Wykonanie',
    workflow: 'Workflow'
  };

  const categoryDescriptions = {
    perspective: 'Poziomy abstrakcji',
    time: 'Pilność i terminy',
    organization: 'Struktura biznesowa',
    execution: 'Sposób wykonania',
    workflow: 'Narzędzia operacyjne'
  };

  return (
    <div className="py-4">
      {/* Main View Type Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {viewTypes.map((viewType) => {
          const isActive = activeViewType === viewType.id;
          
          return (
            <button
              key={viewType.id}
              onClick={() => onViewTypeChange(viewType.id as ViewTypeId)}
              disabled={isLoading}
              className={`group flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                isActive
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                borderColor: isActive ? viewType.color : undefined,
                backgroundColor: isActive ? `${viewType.color}10` : undefined
              }}
            >
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">
                {viewType.icon}
              </div>
              
              {/* Content */}
              <div className="text-left min-w-0">
                <div className="font-medium text-sm">
                  {viewType.name}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-48">
                  {viewType.description}
                </div>
              </div>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="flex-shrink-0">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: viewType.color }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Groups (Optional Details) */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-2">
          <span>Kategorie widoków</span>
          <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(groupedViewTypes).map(([category, types]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="text-lg">
                  {types[0]?.icon || '📋'}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-900">
                    {categoryNames[category as keyof typeof categoryNames] || category}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {types.map((viewType) => (
                  <button
                    key={viewType.id}
                    onClick={() => onViewTypeChange(viewType.id as ViewTypeId)}
                    disabled={isLoading}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                      activeViewType === viewType.id
                        ? 'bg-white text-primary-700 font-medium shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{viewType.icon}</span>
                    {viewType.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="text-sm">Ładowanie widoku...</span>
          </div>
        </div>
      )}
    </div>
  );
}