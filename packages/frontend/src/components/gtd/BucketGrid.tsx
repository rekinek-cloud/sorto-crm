'use client';

import React from 'react';
import { BucketGroup, ViewTypeId, bucketViewHelpers } from '@/lib/api/streamsMapViews';
import BucketViewCard from './BucketViewCard';

interface BucketGridProps {
  buckets: BucketGroup[];
  viewType: ViewTypeId;
  onBucketSelect?: (bucket: BucketGroup) => void;
  selectedBucket?: BucketGroup | null;
  showEmptyBuckets?: boolean;
}

export default function BucketGrid({
  buckets,
  viewType,
  onBucketSelect,
  selectedBucket,
  showEmptyBuckets = true
}: BucketGridProps) {
  // Filter and sort buckets
  const displayBuckets = showEmptyBuckets 
    ? buckets 
    : bucketViewHelpers.getNonEmptyBuckets(buckets);

  // Sort by count for better visual hierarchy
  const sortedBuckets = bucketViewHelpers.getBucketsSortedByCount(displayBuckets);

  // Determine grid layout based on number of buckets
  const getGridCols = () => {
    const count = sortedBuckets.length;
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  if (sortedBuckets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Brak elementów do wyświetlenia
        </h3>
        <p className="text-gray-600">
          {showEmptyBuckets 
            ? 'Ten widok nie zawiera żadnych grup.'
            : 'Wszystkie grupy są puste. Spróbuj włączyć wyświetlanie pustych grup.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {sortedBuckets.length}
            </div>
            <div className="text-sm text-gray-600">Aktywnych grup</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bucketViewHelpers.getTotalTaskCount(sortedBuckets)}
            </div>
            <div className="text-sm text-gray-600">Łączna liczba zadań</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sortedBuckets[0]?.count || 0}
            </div>
            <div className="text-sm text-gray-600">Największa grupa</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(bucketViewHelpers.getTotalTaskCount(sortedBuckets) / sortedBuckets.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Średnia na grupę</div>
          </div>
        </div>
      </div>

      {/* Bucket Grid */}
      <div className={`grid ${getGridCols()} gap-6`}>
        {sortedBuckets.map((bucket, index) => (
          <div 
            key={bucket.id}
            className="relative"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <BucketViewCard
              bucket={bucket}
              viewType={viewType}
              onSelect={onBucketSelect}
              isSelected={selectedBucket?.id === bucket.id}
              mode="grid"
            />
            
            {/* Priority Badge for top buckets */}
            {index === 0 && bucket.count > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
                #1
              </div>
            )}
            
            {/* Empty State Overlay */}
            {bucket.count === 0 && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl text-gray-400 mb-2">📭</div>
                  <div className="text-sm text-gray-500">Pusta grupa</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View-Specific Insights */}
      {viewType === 'urgency' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-xl">🚦</div>
            <div>
              <h4 className="font-medium text-amber-800">Analiza pilności</h4>
              <p className="text-sm text-amber-700 mt-1">
                {sortedBuckets.find(b => b.id === 'overdue')?.count || 0} zadań po terminie, 
                {' '}{sortedBuckets.find(b => b.id === 'urgent')?.count || 0} na dziś.
                {(sortedBuckets.find(b => b.id === 'overdue')?.count || 0) > 0 &&
                  ' Priorytetem są zadania przeterminowane!'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {viewType === 'energy' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-xl">⚡</div>
            <div>
              <h4 className="font-medium text-blue-800">Rekomendacje energetyczne</h4>
              <p className="text-sm text-blue-700 mt-1">
                Rano: {sortedBuckets.find(b => b.id === 'high-energy')?.count || 0} zadań wysokiej energii.
                Popołudnie: {sortedBuckets.find(b => b.id === 'medium-energy')?.count || 0} zadań średniej energii.
                Wieczór: {sortedBuckets.find(b => b.id === 'low-energy')?.count || 0} zadań niskiej energii.
              </p>
            </div>
          </div>
        </div>
      )}

      {viewType === 'horizon' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-xl">🛩️</div>
            <div>
              <h4 className="font-medium text-purple-800">Przegląd horyzontu</h4>
              <p className="text-sm text-purple-700 mt-1">
                Najwięcej pracy na poziomie {' '}
                {sortedBuckets[0]?.metadata?.horizonLevel !== undefined && 
                  `${sortedBuckets[0].metadata.horizonLevel} (${sortedBuckets[0].name})`
                }.
                Pamiętaj o regularnych przeglądach według częstotliwości GTD.
              </p>
            </div>
          </div>
        </div>
      )}

      {viewType === 'business' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-xl">🏢</div>
            <div>
              <h4 className="font-medium text-green-800">Rozkład biznesowy</h4>
              <p className="text-sm text-green-700 mt-1">
                Aktywnych projektów: {sortedBuckets.length}.
                Największe obciążenie: {sortedBuckets[0]?.name || 'brak'} 
                ({sortedBuckets[0]?.count || 0} zadań).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle for Empty Buckets */}
      {buckets.some(b => b.count === 0) && (
        <div className="flex justify-center">
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showEmptyBuckets}
              onChange={() => {/* This would be handled by parent component */}}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled
            />
            <span>Pokaż puste grupy</span>
          </label>
        </div>
      )}
    </div>
  );
}