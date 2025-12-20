'use client';

import React from 'react';
import { DelegatedTaskFilters } from '@/lib/api/delegated';

interface DelegatedTaskFiltersProps {
  filters: DelegatedTaskFilters;
  onFiltersChange: (filters: DelegatedTaskFilters) => void;
}

export default function DelegatedTaskFiltersComponent({ 
  filters, 
  onFiltersChange 
}: DelegatedTaskFiltersProps) {
  
  const handleFilterChange = (key: keyof DelegatedTaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 20,
      sortBy: 'delegatedOn',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.status && filters.status !== 'all') ||
    filters.delegatedTo ||
    filters.overdue
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Tasks</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>

        {/* Delegated To Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delegated To
          </label>
          <input
            type="text"
            value={filters.delegatedTo || ''}
            onChange={(e) => handleFilterChange('delegatedTo', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Person name..."
          />
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy || 'delegatedOn'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="delegatedOn">Delegated Date</option>
              <option value="followUpDate">Follow-up Date</option>
              <option value="status">Status</option>
              <option value="delegatedTo">Delegate Name</option>
              <option value="updatedAt">Last Updated</option>
            </select>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="asc">↑ A-Z</option>
              <option value="desc">↓ Z-A</option>
            </select>
          </div>
        </div>

        {/* Items per page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items per page
          </label>
          <select
            value={filters.limit || 20}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Special Filters */}
      <div className="mt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="overdue"
            checked={filters.overdue || false}
            onChange={(e) => handleFilterChange('overdue', e.target.checked || undefined)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="overdue" className="ml-2 block text-sm text-gray-900">
            Show only overdue tasks
          </label>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {filters.status.replace('_', ' ')}
                <button
                  onClick={() => handleFilterChange('status', undefined)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.delegatedTo && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Delegate: {filters.delegatedTo}
                <button
                  onClick={() => handleFilterChange('delegatedTo', undefined)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.overdue && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Overdue only
                <button
                  onClick={() => handleFilterChange('overdue', undefined)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Quick filters:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                status: 'NEW',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            New Tasks
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                status: 'IN_PROGRESS',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            In Progress
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                overdue: true,
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Overdue
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                sortBy: 'followUpDate',
                sortOrder: 'asc',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            By Follow-up
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                sortBy: 'delegatedOn',
                sortOrder: 'desc',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Recently Delegated
          </button>
        </div>
      </div>
    </div>
  );
}