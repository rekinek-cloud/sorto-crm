'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, ClockIcon, FlagIcon } from '@heroicons/react/24/outline';
import { GanttTask, Priority } from '@/types/views';

interface GanttTaskRowProps {
  task: GanttTask;
  isSelected: boolean;
  isOnCriticalPath: boolean;
  showCriticalPath: boolean;
  onClick: () => void;
  className?: string;
}

const priorityColors: Record<Priority, string> = {
  urgent: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50'
};

const gtdContextColors = {
  '@calls': 'bg-blue-100 text-blue-800',
  '@email': 'bg-green-100 text-green-800',
  '@meetings': 'bg-purple-100 text-purple-800',
  '@computer': 'bg-indigo-100 text-indigo-800',
  '@errands': 'bg-orange-100 text-orange-800',
  '@waiting': 'bg-gray-100 text-gray-800',
  '@reading': 'bg-pink-100 text-pink-800',
  '@planning': 'bg-cyan-100 text-cyan-800'
};

export default function GanttTaskRow({
  task,
  isSelected,
  isOnCriticalPath,
  showCriticalPath,
  onClick,
  className = ''
}: GanttTaskRowProps) {
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getProgressColor = (progress: number): string => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (progress: number): string => {
    if (progress === 100) return 'Ukończone';
    if (progress >= 75) return 'Prawie ukończone';
    if (progress >= 50) return 'W połowie';
    if (progress >= 25) return 'Rozpoczęte';
    return 'Nie rozpoczęte';
  };

  return (
    <motion.div
      className={`p-3 hover:bg-gray-100 cursor-pointer transition-colors border-l-4 ${
        isSelected 
          ? 'bg-blue-50 border-blue-500' 
          : showCriticalPath && isOnCriticalPath 
          ? 'bg-red-50 border-red-500' 
          : 'border-transparent'
      } ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-gray-900 truncate">
            {task.name}
          </h5>
          <div className="flex items-center mt-1 space-x-3">
            {/* Assignee */}
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center mr-1">
                <span className="text-xs font-medium text-gray-700">
                  {getInitials(task.assignee.name)}
                </span>
              </div>
              <span className="truncate max-w-20">{task.assignee.name.split(' ')[0]}</span>
            </div>
            
            {/* Duration */}
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="w-3 h-3 mr-1" />
              <span>{task.duration}d</span>
            </div>
          </div>
        </div>
        
        {/* Progress Circle */}
        <div className="ml-2 flex-shrink-0">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                className={getProgressColor(task.progress).replace('bg-', 'text-')}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${task.progress}, 100`}
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-700">
                {task.progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Dates */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
        <span>📅 {task.startDate.toLocaleDateString('pl-PL')}</span>
        <span>→</span>
        <span>📅 {task.endDate.toLocaleDateString('pl-PL')}</span>
      </div>

      {/* GTD Context */}
      <div className="mb-2">
        <span 
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            gtdContextColors[task.gtdContext] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {task.gtdContext}
        </span>
      </div>

      {/* Priority & Status Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Priority */}
          <span 
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority === 'urgent' && <FlagIcon className="w-3 h-3 mr-1" />}
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {/* Critical Path Indicator */}
          {showCriticalPath && isOnCriticalPath && (
            <span className="inline-flex items-center text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
              🔴 Krytyczne
            </span>
          )}
        </div>

        {/* Status */}
        <span className="text-xs text-gray-500">
          {getStatusText(task.progress)}
        </span>
      </div>

      {/* Dependencies Info */}
      {task.dependsOn.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Zależy od:</span>
            <span className="ml-1">{task.dependsOn.length} zadań</span>
          </div>
        </div>
      )}

      {/* Expanded Details (when selected) */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Start:</span>
              <span>{task.startDate.toLocaleDateString('pl-PL', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Koniec:</span>
              <span>{task.endDate.toLocaleDateString('pl-PL', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Czas trwania:</span>
              <span>{task.duration} dni</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wykonawca:</span>
              <span>{task.assignee.name}</span>
            </div>
            {task.dependsOn.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Zależności:</span>
                <span>{task.dependsOn.length} zadań</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}