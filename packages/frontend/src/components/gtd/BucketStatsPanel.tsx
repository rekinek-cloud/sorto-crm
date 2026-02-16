'use client';

import React from 'react';
import { BucketViewData, BucketGroup, BucketViewType, bucketViewHelpers } from '@/lib/api/streamsMapViews';

interface BucketStatsPanelProps {
  bucketData: BucketViewData;
  viewType: BucketViewType;
  selectedBucket?: BucketGroup | null;
}

export default function BucketStatsPanel({
  bucketData,
  viewType,
  selectedBucket
}: BucketStatsPanelProps) {
  const nonEmptyBuckets = bucketViewHelpers.getNonEmptyBuckets(bucketData.buckets);
  const totalTasks = bucketViewHelpers.getTotalTaskCount(bucketData.buckets);
  const avgTasksPerBucket = nonEmptyBuckets.length > 0 ? Math.round(totalTasks / nonEmptyBuckets.length) : 0;
  
  // Calculate view-specific metrics
  const getViewSpecificMetrics = () => {
    switch (viewType.id) {
      case 'urgency':
        const overdue = bucketData.buckets.find(b => b.id === 'overdue')?.count || 0;
        const urgent = bucketData.buckets.find(b => b.id === 'urgent')?.count || 0;
        const important = bucketData.buckets.find(b => b.id === 'important')?.count || 0;
        const criticalTasks = overdue + urgent;
        const urgencyScore = totalTasks > 0 ? Math.round(((overdue * 3 + urgent * 2 + important * 1) / totalTasks) * 100) : 0;
        
        return [
          { label: 'Krytyczne', value: criticalTasks, color: '#DC2626', icon: '🚨' },
          { label: 'Wskaźnik pilności', value: `${urgencyScore}%`, color: urgencyScore > 60 ? '#DC2626' : urgencyScore > 30 ? '#F59E0B' : '#10B981', icon: '📊' }
        ];
        
      case 'energy':
        const highEnergy = bucketData.buckets.find(b => b.id === 'high-energy')?.count || 0;
        const mediumEnergy = bucketData.buckets.find(b => b.id === 'medium-energy')?.count || 0;
        const lowEnergy = bucketData.buckets.find(b => b.id === 'low-energy')?.count || 0;
        const energyBalance = totalTasks > 0 ? Math.round((lowEnergy / totalTasks) * 100) : 0;
        
        return [
          { label: 'Wysokiej energii', value: highEnergy, color: '#DC2626', icon: '🔋' },
          { label: 'Równowaga energii', value: `${energyBalance}% łatwych`, color: energyBalance > 40 ? '#10B981' : '#F59E0B', icon: '⚖️' }
        ];
        
      case 'horizon':
        const activeHorizons = bucketData.buckets.filter(b => b.count > 0).length;
        const operationalTasks = (bucketData.buckets.find(b => b.metadata?.horizonLevel === 0)?.count || 0) + 
                                (bucketData.buckets.find(b => b.metadata?.horizonLevel === 1)?.count || 0);
        const strategicTasks = totalTasks - operationalTasks;
        const operationalRatio = totalTasks > 0 ? Math.round((operationalTasks / totalTasks) * 100) : 0;
        
        return [
          { label: 'Aktywne poziomy', value: activeHorizons, color: '#3B82F6', icon: '🛩️' },
          { label: 'Operacyjne vs Strategic', value: `${operationalRatio}% / ${100 - operationalRatio}%`, color: '#8B5CF6', icon: '📈' }
        ];
        
      case 'business':
        const companiesWithTasks = bucketData.buckets.filter(b => b.count > 0).length;
        const largestProject = bucketData.buckets.reduce((max, bucket) => bucket.count > max ? bucket.count : max, 0);
        const distributionScore = totalTasks > 0 && companiesWithTasks > 0 ? Math.round((largestProject / totalTasks) * 100) : 0;
        
        return [
          { label: 'Aktywne projekty', value: companiesWithTasks, color: '#10B981', icon: '🏢' },
          { label: 'Koncentracja', value: `${distributionScore}% w największym`, color: distributionScore > 50 ? '#F59E0B' : '#10B981', icon: '📊' }
        ];
        
      case 'stream':
        const activeStreams = bucketData.buckets.filter(b => b.count > 0).length;
        const avgEfficiency = bucketData.buckets.reduce((sum, bucket) => {
          return sum + (bucket.metadata?.efficiency || 0);
        }, 0) / bucketData.buckets.length;
        
        return [
          { label: 'Aktywne streamy', value: activeStreams, color: '#8B5CF6', icon: '🌊' },
          { label: 'Średnia skuteczność', value: `${Math.round(avgEfficiency)}%`, color: avgEfficiency > 70 ? '#10B981' : '#F59E0B', icon: '📊' }
        ];
        
      default:
        return [];
    }
  };

  const viewSpecificMetrics = getViewSpecificMetrics();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{viewType.icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Statystyki: {viewType.name}
            </h2>
            <p className="text-sm text-gray-600">
              Wygenerowano: {new Date(bucketData.metadata.generatedAt).toLocaleString('pl-PL')}
            </p>
          </div>
        </div>
        
        {selectedBucket && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2 text-blue-700">
              <span className="text-lg">{selectedBucket.icon}</span>
              <span className="text-sm font-medium">Wybrane: {selectedBucket.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {/* Universal Metrics */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
          <div className="text-xs text-gray-600">Łączne zadania</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{bucketData.buckets.length}</div>
          <div className="text-xs text-gray-600">Wszystkie grupy</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{nonEmptyBuckets.length}</div>
          <div className="text-xs text-gray-600">Aktywne grupy</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{avgTasksPerBucket}</div>
          <div className="text-xs text-gray-600">Średnia na grupę</div>
        </div>
        
        {/* View-Specific Metrics */}
        {viewSpecificMetrics.map((metric, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="text-lg">{metric.icon}</span>
            </div>
            <div 
              className="text-2xl font-bold"
              style={{ color: metric.color }}
            >
              {metric.value}
            </div>
            <div className="text-xs text-gray-600">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Rozkład zadań w grupach:</h3>
        
        <div className="space-y-2">
          {bucketData.buckets
            .filter(bucket => bucket.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8) // Show top 8 buckets
            .map((bucket) => {
              const percentage = totalTasks > 0 ? (bucket.count / totalTasks) * 100 : 0;
              
              return (
                <div key={bucket.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm">{bucket.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 truncate">{bucket.name}</span>
                      <span className="text-gray-600 ml-2">
                        {bucket.count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: bucket.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        
        {bucketData.buckets.filter(b => b.count > 0).length > 8 && (
          <div className="text-xs text-gray-500 text-center pt-2">
            i {bucketData.buckets.filter(b => b.count > 0).length - 8} więcej grup z zadaniami...
          </div>
        )}
      </div>

      {/* Selected Bucket Details */}
      {selectedBucket && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Szczegóły wybranej grupy: {selectedBucket.name}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white rounded p-2">
              <div className="font-medium text-blue-900">Zadania</div>
              <div className="text-blue-700">{selectedBucket.count}</div>
            </div>
            
            <div className="bg-white rounded p-2">
              <div className="font-medium text-blue-900">Udział</div>
              <div className="text-blue-700">
                {totalTasks > 0 ? Math.round((selectedBucket.count / totalTasks) * 100) : 0}%
              </div>
            </div>
            
            {selectedBucket.metadata?.urgencyLevel && (
              <div className="bg-white rounded p-2">
                <div className="font-medium text-blue-900">Pilność</div>
                <div className="text-blue-700">{selectedBucket.metadata.urgencyLevel}</div>
              </div>
            )}
            
            {selectedBucket.metadata?.horizonLevel !== undefined && (
              <div className="bg-white rounded p-2">
                <div className="font-medium text-blue-900">Poziom</div>
                <div className="text-blue-700">H{selectedBucket.metadata.horizonLevel}</div>
              </div>
            )}
          </div>
          
          <div className="mt-3 text-xs text-blue-700">
            <strong>Rekomendacja:</strong> {bucketViewHelpers.getRecommendedAction(selectedBucket, viewType.id)}
          </div>
        </div>
      )}
    </div>
  );
}