'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Clock,
  User,
  AlertTriangle,
  Eye,
  Tag
} from 'lucide-react'

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface MessageSortingProps {
  sortConfig: SortConfig
  onSortChange: (config: SortConfig) => void
  totalMessages: number
}

const SORT_OPTIONS = [
  { 
    value: 'receivedAt', 
    label: 'Data otrzymania', 
    icon: Clock 
  },
  { 
    value: 'sentAt', 
    label: 'Data wysłania', 
    icon: Clock 
  },
  { 
    value: 'subject', 
    label: 'Temat', 
    icon: Tag 
  },
  { 
    value: 'fromName', 
    label: 'Nadawca', 
    icon: User 
  },
  { 
    value: 'urgencyScore', 
    label: 'Pilność', 
    icon: AlertTriangle 
  },
  { 
    value: 'priority', 
    label: 'Priorytet', 
    icon: AlertTriangle 
  },
  { 
    value: 'isRead', 
    label: 'Status przeczytania', 
    icon: Eye 
  }
]

export function MessageSorting({ sortConfig, onSortChange, totalMessages }: MessageSortingProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSortChange = (field: string) => {
    if (sortConfig.field === field) {
      // Toggle direction if same field
      onSortChange({
        field,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      })
    } else {
      // New field, default to desc for dates, asc for text
      const defaultDirection = ['receivedAt', 'sentAt', 'urgencyScore'].includes(field) ? 'desc' : 'asc'
      onSortChange({
        field,
        direction: defaultDirection
      })
    }
    setIsOpen(false)
  }

  const currentOption = SORT_OPTIONS.find(opt => opt.value === sortConfig.field)
  const IconComponent = currentOption?.icon || ArrowUpDown

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <ArrowUpDown className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700">
          {currentOption?.label || 'Sortuj'}
        </span>
        {sortConfig.direction === 'asc' ? (
          <ChevronUp className="h-4 w-4 text-indigo-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-indigo-600" />
        )}
        <div className="text-xs text-gray-500 ml-2">
          ({totalMessages})
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20"
          >
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                SORTUJ WEDŁUG
              </div>
              
              {SORT_OPTIONS.map((option) => {
                const IconComp = option.icon
                const isActive = sortConfig.field === option.value
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComp className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span>{option.label}</span>
                    </div>
                    
                    {isActive && (
                      <div className="flex items-center space-x-1">
                        {sortConfig.direction === 'asc' ? (
                          <>
                            <ChevronUp className="h-3 w-3 text-indigo-600" />
                            <span className="text-xs text-indigo-600">A-Z</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 text-indigo-600" />
                            <span className="text-xs text-indigo-600">Z-A</span>
                          </>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}