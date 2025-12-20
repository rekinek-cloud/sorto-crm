'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export interface MessageFilters {
  search: string
  channels: string[]
  dateRange: string
  customDateFrom: string
  customDateTo: string
  priority: string
  status: string
  sender: string
  hasAttachments: string
  isRead: string
  urgencyMin: number
  urgencyMax: number
}

export interface MessageFiltersProps {
  filters: MessageFilters
  onFiltersChange: (filters: MessageFilters) => void
  availableChannels: string[]
  isVisible: boolean
  onToggle: () => void
  totalMessages: number
  filteredMessages: number
}

export function MessageFilters({
  filters,
  onFiltersChange,
  availableChannels,
  isVisible,
  onToggle,
  totalMessages,
  filteredMessages
}: MessageFiltersProps) {
  const updateFilter = (key: keyof MessageFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      channels: [],
      dateRange: 'ALL',
      customDateFrom: '',
      customDateTo: '',
      priority: 'ALL',
      status: 'ALL',
      sender: '',
      hasAttachments: 'ALL',
      isRead: 'ALL',
      urgencyMin: 0,
      urgencyMax: 100
    })
  }

  const hasActiveFilters = () => {
    return filters.search || 
           filters.channels.length > 0 ||
           filters.dateRange !== 'ALL' ||
           filters.customDateFrom ||
           filters.customDateTo ||
           filters.priority !== 'ALL' ||
           filters.status !== 'ALL' ||
           filters.sender ||
           filters.hasAttachments !== 'ALL' ||
           filters.isRead !== 'ALL' ||
           filters.urgencyMin > 0 ||
           filters.urgencyMax < 100
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggle}
            className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="font-medium">Filtry</span>
            {hasActiveFilters() && (
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                Aktywne
              </span>
            )}
          </button>
          
          <div className="text-sm text-gray-500">
            {filteredMessages} z {totalMessages} wiadomości
          </div>
        </div>
        
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Wyczyść wszystkie
          </button>
        )}
      </div>

      {/* Filter Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MagnifyingGlassIcon className="h-4 w-4 inline mr-2" />
                  Wyszukaj
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder="Szukaj w temacie, treści, nadawcy..."
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {filters.search && (
                    <button
                      onClick={() => updateFilter('search', '')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-2" />
                  Kanały ({filters.channels.length} wybranych)
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableChannels.map(channel => (
                    <label key={channel} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filters.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('channels', [...filters.channels, channel])
                          } else {
                            updateFilter('channels', filters.channels.filter(c => c !== channel))
                          }
                        }}
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{channel}</span>
                    </label>
                  ))}
                  {availableChannels.length === 0 && (
                    <div className="text-sm text-gray-500 p-2">Brak dostępnych kanałów</div>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-2" />
                  Zakres dat
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">Wszystkie</option>
                  <option value="TODAY">Dzisiaj</option>
                  <option value="YESTERDAY">Wczoraj</option>
                  <option value="LAST_7_DAYS">Ostatnie 7 dni</option>
                  <option value="LAST_30_DAYS">Ostatnie 30 dni</option>
                  <option value="CUSTOM">Niestandardowy</option>
                </select>
                
                {filters.dateRange === 'CUSTOM' && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Od</label>
                      <input
                        type="date"
                        value={filters.customDateFrom}
                        onChange={(e) => updateFilter('customDateFrom', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Do</label>
                      <input
                        type="date"
                        value={filters.customDateTo}
                        onChange={(e) => updateFilter('customDateTo', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Priority & Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ExclamationTriangleIcon className="h-4 w-4 inline mr-2" />
                    Priorytet
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => updateFilter('priority', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ALL">Wszystkie</option>
                    <option value="LOW">Niski</option>
                    <option value="MEDIUM">Średni</option>
                    <option value="HIGH">Wysoki</option>
                    <option value="URGENT">Pilny</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ALL">Wszystkie</option>
                    <option value="UNREAD">Nieprzeczytane</option>
                    <option value="READ">Przeczytane</option>
                    <option value="ARCHIVED">Zarchiwizowane</option>
                    <option value="PROCESSED">Przetworzone</option>
                  </select>
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PaperClipIcon className="h-4 w-4 inline mr-2" />
                    Załączniki
                  </label>
                  <select
                    value={filters.hasAttachments}
                    onChange={(e) => updateFilter('hasAttachments', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ALL">Wszystkie</option>
                    <option value="WITH">Z załącznikami</option>
                    <option value="WITHOUT">Bez załączników</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EyeIcon className="h-4 w-4 inline mr-2" />
                    Przeczytane
                  </label>
                  <select
                    value={filters.isRead}
                    onChange={(e) => updateFilter('isRead', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ALL">Wszystkie</option>
                    <option value="READ">Przeczytane</option>
                    <option value="UNREAD">Nieprzeczytane</option>
                  </select>
                </div>
              </div>

              {/* Urgency Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="h-4 w-4 inline mr-2" />
                  Pilność ({filters.urgencyMin}-{filters.urgencyMax}%)
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min: {filters.urgencyMin}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.urgencyMin}
                      onChange={(e) => updateFilter('urgencyMin', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max: {filters.urgencyMax}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.urgencyMax}
                      onChange={(e) => updateFilter('urgencyMax', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Sender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-2" />
                  Nadawca
                </label>
                <input
                  type="text"
                  value={filters.sender}
                  onChange={(e) => updateFilter('sender', e.target.value)}
                  placeholder="Wpisz email lub nazwę nadawcy..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}