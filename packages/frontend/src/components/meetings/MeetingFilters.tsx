'use client';

import React from 'react';
import { MeetingFilters } from '@/lib/api/meetings';

interface MeetingFiltersProps {
  filters: MeetingFilters;
  onFiltersChange: (filters: MeetingFilters) => void;
}

export default function MeetingFiltersComponent({ 
  filters, 
  onFiltersChange 
}: MeetingFiltersProps) {
  
  const handleFilterChange = (key: keyof MeetingFilters, value: any) => {
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
      sortBy: 'startTime',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.status && filters.status !== 'all') ||
    filters.startDate ||
    filters.endDate ||
    filters.contactId
  );

  // Get date ranges for quick filters
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

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
            <option value="all">All Meetings</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy || 'startTime'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="startTime">Start Time</option>
              <option value="title">Title</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Last Updated</option>
              <option value="status">Status</option>
            </select>
            <select
              value={filters.sortOrder || 'asc'}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="asc">↑ A-Z</option>
              <option value="desc">↓ Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items per page */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Items per page
        </label>
        <select
          value={filters.limit || 20}
          onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
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
            {filters.startDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                From: {filters.startDate}
                <button
                  onClick={() => handleFilterChange('startDate', undefined)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                To: {filters.endDate}
                <button
                  onClick={() => handleFilterChange('endDate', undefined)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
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
                startDate: formatDateForInput(today),
                endDate: formatDateForInput(today),
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                startDate: formatDateForInput(tomorrow),
                endDate: formatDateForInput(tomorrow),
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                startDate: formatDateForInput(today),
                endDate: formatDateForInput(nextWeek),
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Next 7 Days
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                startDate: formatDateForInput(today),
                endDate: formatDateForInput(nextMonth),
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Next 30 Days
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                status: 'SCHEDULED',
                startDate: formatDateForInput(today),
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Upcoming
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                sortBy: 'startTime',
                sortOrder: 'asc',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Chronological
          </button>
        </div>
      </div>
    </div>
  );
}