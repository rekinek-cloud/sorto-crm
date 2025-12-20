'use client';

import React from 'react';
import { HabitFilters } from '@/lib/api/habits';
import { habitsApi } from '@/lib/api/habits';

interface HabitFiltersProps {
  filters: HabitFilters;
  onFiltersChange: (filters: HabitFilters) => void;
}

export default function HabitFiltersComponent({ 
  filters, 
  onFiltersChange 
}: HabitFiltersProps) {
  
  const handleFilterChange = (key: keyof HabitFilters, value: any) => {
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
      isActive: 'true',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.isActive && filters.isActive !== 'true') ||
    (filters.frequency && filters.frequency !== 'all')
  );

  const frequencyOptions = habitsApi.getFrequencyOptions();

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
            value={filters.isActive || 'true'}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Habits</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* Frequency Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <select
            value={filters.frequency || 'all'}
            onChange={(e) => handleFilterChange('frequency', e.target.value === 'all' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Frequencies</option>
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy || 'name'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="name">Name</option>
              <option value="currentStreak">Current Streak</option>
              <option value="bestStreak">Best Streak</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Last Updated</option>
              <option value="frequency">Frequency</option>
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
            {filters.isActive && filters.isActive !== 'true' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {filters.isActive === 'false' ? 'Inactive' : 'All'}
                <button
                  onClick={() => handleFilterChange('isActive', 'true')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.frequency && filters.frequency !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Frequency: {filters.frequency}
                <button
                  onClick={() => handleFilterChange('frequency', undefined)}
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
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Quick filters:</span>
          <button
            onClick={() => handleFilterChange('isActive', 'true')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.isActive === 'true'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active Habits
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                sortBy: 'currentStreak',
                sortOrder: 'desc',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Best Streaks
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                frequency: 'DAILY',
                isActive: 'true',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Daily Habits
          </button>
          <button
            onClick={() => {
              onFiltersChange({
                ...filters,
                sortBy: 'createdAt',
                sortOrder: 'desc',
                page: 1
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            Recently Added
          </button>
        </div>
      </div>
    </div>
  );
}