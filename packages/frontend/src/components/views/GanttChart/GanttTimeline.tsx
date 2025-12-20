'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GanttTask, Milestone, Dependency } from '@/types/views';

interface GanttTimelineProps {
  timeUnits: Date[];
  unitWidth: number;
  formatTimeUnit: (date: Date) => string;
  tasks: GanttTask[];
  milestones: Milestone[];
  dependencies: Dependency[];
  criticalPath: string[];
  showCriticalPath: boolean;
  getTaskPosition: (task: GanttTask) => { left: number; width: number };
  onTaskUpdate?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onMilestoneToggle?: (milestoneId: string) => void;
  selectedTask?: string | null;
}

export default function GanttTimeline({
  timeUnits,
  unitWidth,
  formatTimeUnit,
  tasks,
  milestones,
  dependencies,
  criticalPath,
  showCriticalPath,
  getTaskPosition,
  onTaskUpdate,
  onMilestoneToggle,
  selectedTask
}: GanttTimelineProps) {
  const rowHeight = 60;
  const totalWidth = timeUnits.length * unitWidth;

  const isOnCriticalPath = (taskId: string) => {
    return criticalPath.includes(taskId);
  };

  const getTaskColor = (task: GanttTask) => {
    if (showCriticalPath && isOnCriticalPath(task.id)) {
      return task.progress === 100 ? 'bg-red-400' : 'bg-red-500';
    }
    return task.progress === 100 ? 'bg-green-500' : 'bg-blue-500';
  };

  const getMilestonePosition = (milestone: Milestone) => {
    const projectStart = new Date(tasks[0]?.startDate || new Date()).getTime();
    const milestoneTime = new Date(milestone.date).getTime();
    const dayOffset = (milestoneTime - projectStart) / (1000 * 60 * 60 * 24);
    return dayOffset * (unitWidth / 7); // Assuming weeks as base unit
  };

  return (
    <div className="relative">
      {/* Timeline Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex" style={{ width: totalWidth }}>
          {timeUnits.map((timeUnit, index) => (
            <div
              key={index}
              className="flex-shrink-0 border-r border-gray-200 p-2 text-center"
              style={{ width: unitWidth }}
            >
              <div className="text-xs font-medium text-gray-700">
                {formatTimeUnit(timeUnit)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative" style={{ height: tasks.length * rowHeight }}>
        {/* Vertical Grid Lines */}
        <div className="absolute inset-0">
          {timeUnits.map((_, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 border-r border-gray-100"
              style={{ left: index * unitWidth }}
            />
          ))}
        </div>

        {/* Horizontal Grid Lines */}
        {tasks.map((_, index) => (
          <div
            key={index}
            className="absolute left-0 right-0 border-b border-gray-100"
            style={{ top: index * rowHeight + rowHeight }}
          />
        ))}

        {/* Task Bars */}
        {tasks.map((task, index) => {
          const position = getTaskPosition(task);
          const isSelected = selectedTask === task.id;
          const isCritical = showCriticalPath && isOnCriticalPath(task.id);

          return (
            <motion.div
              key={task.id}
              className={`absolute cursor-pointer group ${
                isSelected ? 'z-20' : 'z-10'
              }`}
              style={{
                top: index * rowHeight + 15,
                left: position.left,
                width: position.width,
                height: 30
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Task Bar */}
              <div
                className={`h-full rounded-lg shadow-sm border-2 ${
                  isSelected ? 'border-blue-400' : 'border-transparent'
                } ${getTaskColor(task)} transition-all relative overflow-hidden`}
              >
                {/* Progress Fill */}
                <div
                  className="h-full bg-black bg-opacity-10 transition-all"
                  style={{ width: `${task.progress}%` }}
                />

                {/* Task Label */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-white text-xs font-medium truncate">
                    {task.name}
                  </span>
                </div>

                {/* Critical Path Indicator */}
                {isCritical && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full transform translate-x-1 -translate-y-1" />
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                  <div className="font-medium">{task.name}</div>
                  <div className="text-gray-300">
                    {task.startDate.toLocaleDateString('pl-PL')} - {task.endDate.toLocaleDateString('pl-PL')}
                  </div>
                  <div className="text-gray-300">
                    Progress: {task.progress}% | Duration: {task.duration} days
                  </div>
                  <div className="text-gray-300">
                    Assignee: {task.assignee.name}
                  </div>
                  {isCritical && (
                    <div className="text-red-300 font-medium">🔴 Critical Path</div>
                  )}
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </motion.div>
          );
        })}

        {/* Milestones */}
        {milestones.map((milestone) => {
          const position = getMilestonePosition(milestone);
          
          return (
            <div
              key={milestone.id}
              className="absolute cursor-pointer z-15 group"
              style={{
                left: position,
                top: 0,
                bottom: 0
              }}
              onClick={() => onMilestoneToggle && onMilestoneToggle(milestone.id)}
            >
              {/* Milestone Line */}
              <div className="w-px bg-orange-400 h-full relative">
                {/* Milestone Diamond */}
                <div 
                  className={`absolute w-4 h-4 transform rotate-45 -translate-x-1/2 ${
                    milestone.completed ? 'bg-green-500' : 'bg-orange-500'
                  } border-2 border-white shadow-lg`}
                  style={{ top: '50%', transform: 'translateY(-50%) translateX(-50%) rotate(45deg)' }}
                />
                
                {/* Milestone Label */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {milestone.icon} {milestone.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {milestone.date.toLocaleDateString('pl-PL')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dependencies - simplified arrows */}
        {dependencies.map((dependency, index) => {
          const fromTask = tasks.find(t => t.id === dependency.fromTask);
          const toTask = tasks.find(t => t.id === dependency.toTask);
          
          if (!fromTask || !toTask) return null;

          const fromIndex = tasks.findIndex(t => t.id === dependency.fromTask);
          const toIndex = tasks.findIndex(t => t.id === dependency.toTask);
          
          const fromPosition = getTaskPosition(fromTask);
          const toPosition = getTaskPosition(toTask);
          
          const startX = fromPosition.left + fromPosition.width;
          const startY = fromIndex * rowHeight + 30;
          const endX = toPosition.left;
          const endY = toIndex * rowHeight + 30;

          return (
            <div key={index} className="absolute pointer-events-none z-5">
              <svg
                className="absolute"
                style={{
                  left: Math.min(startX, endX),
                  top: Math.min(startY, endY),
                  width: Math.abs(endX - startX) + 20,
                  height: Math.abs(endY - startY) + 20
                }}
              >
                <defs>
                  <marker
                    id={`arrowhead-${index}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>
                <path
                  d={`M ${startX < endX ? 0 : Math.abs(endX - startX)} ${startY < endY ? 0 : Math.abs(endY - startY)} 
                      L ${startX < endX ? Math.abs(endX - startX) : 0} ${startY < endY ? Math.abs(endY - startY) : 0}`}
                  stroke="#6b7280"
                  strokeWidth="2"
                  fill="none"
                  markerEnd={`url(#arrowhead-${index})`}
                  strokeDasharray={dependency.type === 'start-to-start' ? '5,5' : ''}
                />
              </svg>
            </div>
          );
        })}

        {/* Today Line */}
        <div className="absolute top-0 bottom-0 border-l-2 border-red-500 z-20 pointer-events-none">
          <div className="absolute -top-6 left-0 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Dziś
          </div>
        </div>
      </div>
    </div>
  );
}