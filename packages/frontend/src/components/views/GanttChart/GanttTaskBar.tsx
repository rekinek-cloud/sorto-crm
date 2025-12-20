'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GanttTask } from '@/types/views';

interface GanttTaskBarProps {
  task: GanttTask;
  position: { left: number; width: number };
  isSelected: boolean;
  isCritical: boolean;
  onUpdate?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}

export default function GanttTaskBar({
  task,
  position,
  isSelected,
  isCritical,
  onUpdate
}: GanttTaskBarProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getTaskBarColor = () => {
    if (task.progress === 100) {
      return isCritical ? 'bg-green-400' : 'bg-green-500';
    }
    return isCritical ? 'bg-red-400' : 'bg-blue-500';
  };

  const getBorderColor = () => {
    if (isSelected) return 'border-yellow-400';
    if (isCritical) return 'border-red-600';
    return 'border-transparent';
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      className="absolute z-10 cursor-pointer group"
      style={{
        left: position.left,
        width: position.width,
        top: 15,
        height: 30
      }}
      whileHover={{ scale: 1.02 }}
      animate={isDragging ? { scale: 1.05 } : {}}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Main Task Bar */}
      <div
        className={`
          h-full rounded-lg shadow-sm border-2 transition-all relative overflow-hidden
          ${getTaskBarColor()}
          ${getBorderColor()}
          ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        `}
      >
        {/* Progress Fill */}
        <div
          className="h-full bg-black bg-opacity-20 transition-all duration-300"
          style={{ width: `${task.progress}%` }}
        />

        {/* Task Label */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-white text-xs font-medium truncate">
            {task.name}
          </span>
        </div>

        {/* Progress Percentage */}
        {position.width > 60 && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <span className="text-white text-xs font-bold">
              {task.progress}%
            </span>
          </div>
        )}

        {/* Critical Path Indicator */}
        {isCritical && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white" />
        )}

        {/* Dependencies Indicator */}
        {task.dependsOn.length > 0 && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white">
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
              {task.dependsOn.length}
            </span>
          </div>
        )}
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500 opacity-0 group-hover:opacity-50" />
          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500 opacity-0 group-hover:opacity-50" />
        </>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-3 px-4 whitespace-nowrap shadow-xl">
          <div className="font-semibold text-sm mb-2">{task.name}</div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">📅</span>
              <span>
                {task.startDate.toLocaleDateString('pl-PL')} - {task.endDate.toLocaleDateString('pl-PL')}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">⏱️</span>
              <span>{task.duration} dni</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">👤</span>
              <span>{task.assignee.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">📊</span>
              <span>{task.progress}% ukończone</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">🏷️</span>
              <span className="capitalize">{task.priority}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">🎯</span>
              <span>{task.gtdContext}</span>
            </div>
          </div>

          {task.dependsOn.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-300 text-xs">
                Zależy od {task.dependsOn.length} zadań
              </div>
            </div>
          )}

          {isCritical && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-red-300 font-medium text-xs">
                🔴 Ścieżka krytyczna
              </div>
            </div>
          )}
        </div>
        
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </motion.div>
  );
}