'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Clock,
  Flag,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GanttProject, GanttTask, Milestone, Dependency } from '@/types/views';
import GanttTimeline from './GanttTimeline';

interface GanttChartProps {
  project: GanttProject;
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
  onDependencyAdd?: (dependency: Dependency) => void;
  onMilestoneToggle?: (milestoneId: string) => void;
  className?: string;
}

export default function GanttChart({ 
  project, 
  onTaskUpdate, 
  onDependencyAdd,
  onMilestoneToggle,
  className = '' 
}: GanttChartProps) {
  const [timeScale, setTimeScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [viewStart, setViewStart] = useState(new Date(project.startDate));
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  // Calculate timeline parameters
  const timelineData = useMemo(() => {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let timeUnits: Date[] = [];
    let unitWidth = 0;

    switch (timeScale) {
      case 'days':
        unitWidth = 60; // pixels per day
        for (let i = 0; i <= totalDays; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          timeUnits.push(date);
        }
        break;
      case 'weeks':
        unitWidth = 80; // pixels per week
        const weeks = Math.ceil(totalDays / 7);
        for (let i = 0; i <= weeks; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + (i * 7));
          timeUnits.push(date);
        }
        break;
      case 'months':
        unitWidth = 120; // pixels per month
        const months = Math.ceil(totalDays / 30);
        for (let i = 0; i <= months; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          timeUnits.push(date);
        }
        break;
    }

    return {
      timeUnits,
      unitWidth,
      totalWidth: timeUnits.length * unitWidth,
      pixelsPerDay: unitWidth / (timeScale === 'days' ? 1 : timeScale === 'weeks' ? 7 : 30)
    };
  }, [project.startDate, project.endDate, timeScale]);

  // Calculate task positions
  const getTaskPosition = (task: GanttTask) => {
    const projectStart = new Date(project.startDate).getTime();
    const taskStart = new Date(task.startDate).getTime();
    const taskEnd = new Date(task.endDate).getTime();
    
    const startOffset = (taskStart - projectStart) / (1000 * 60 * 60 * 24);
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);
    
    return {
      left: startOffset * timelineData.pixelsPerDay,
      width: Math.max(duration * timelineData.pixelsPerDay, 20)
    };
  };

  // Check if task is on critical path
  const isOnCriticalPath = (taskId: string) => {
    return project.criticalPath.includes(taskId);
  };

  // Handle task drag to update dates
  const handleTaskDrag = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
  };

  // Navigation handlers
  const navigateTimeline = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewStart);
    const offset = timeScale === 'days' ? 7 : timeScale === 'weeks' ? 28 : 90;
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - offset);
    } else {
      newDate.setDate(newDate.getDate() + offset);
    }
    
    setViewStart(newDate);
  };

  const formatTimeUnit = (date: Date) => {
    switch (timeScale) {
      case 'days':
        return date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
      case 'weeks':
        return `Tydz. ${Math.ceil(date.getDate() / 7)}`;
      case 'months':
        return date.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' });
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-600">
              {new Date(project.startDate).toLocaleDateString('pl-PL')} - {' '}
              {new Date(project.endDate).toLocaleDateString('pl-PL')}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Time Scale Selector */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(['days', 'weeks', 'months'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setTimeScale(scale)}
                  className={`px-3 py-1 text-sm ${
                    timeScale === scale
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {scale === 'days' ? 'Dni' : scale === 'weeks' ? 'Tygodnie' : 'Miesiące'}
                </button>
              ))}
            </div>

            {/* Critical Path Toggle */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showCriticalPath}
                onChange={(e) => setShowCriticalPath(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ścieżka krytyczna</span>
            </label>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateTimeline('prev')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateTimeline('next')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{project.tasks.length}</div>
            <div className="text-sm text-gray-600">Zadania</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(project.tasks.reduce((acc, task) => acc + task.progress, 0) / project.tasks.length)}%
            </div>
            <div className="text-sm text-gray-600">Ukończone</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{project.milestones.length}</div>
            <div className="text-sm text-gray-600">Kamienie milowe</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{project.criticalPath.length}</div>
            <div className="text-sm text-gray-600">Zadania krytyczne</div>
          </div>
        </div>
      </div>

      {/* Gantt Chart Content */}
      <div className="flex">
        {/* Task List Column */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h4 className="font-medium text-gray-900">Zadania</h4>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-gray-200">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                  selectedTask === task.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                } ${
                  showCriticalPath && isOnCriticalPath(task.id) ? 'bg-red-50' : ''
                }`}
                onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {task.name}
                    </h5>
                    <div className="flex items-center mt-1 space-x-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="w-3 h-3 mr-1" />
                        {task.assignee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.duration}d
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="ml-2">
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-600">
                      {task.progress}%
                    </div>
                  </div>
                </div>

                {/* GTD Context */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    task.gtdContext === '@calls' ? 'bg-blue-100 text-blue-800' :
                    task.gtdContext === '@email' ? 'bg-green-100 text-green-800' :
                    task.gtdContext === '@meetings' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.gtdContext}
                  </span>
                </div>

                {/* Priority & Critical Path Indicators */}
                <div className="flex items-center mt-2 space-x-2">
                  {task.priority === 'urgent' && (
                    <span className="flex items-center text-xs text-red-600">
                      <Flag className="w-3 h-3 mr-1" />
                      Pilne
                    </span>
                  )}
                  {showCriticalPath && isOnCriticalPath(task.id) && (
                    <span className="flex items-center text-xs text-red-600 font-medium">
                      🔴 Krytyczne
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Column */}
        <div className="flex-1 overflow-x-auto">
          <GanttTimeline
            timeUnits={timelineData.timeUnits}
            unitWidth={timelineData.unitWidth}
            formatTimeUnit={formatTimeUnit}
            tasks={project.tasks}
            milestones={project.milestones}
            dependencies={project.dependencies}
            criticalPath={project.criticalPath}
            showCriticalPath={showCriticalPath}
            getTaskPosition={getTaskPosition}
            onTaskUpdate={handleTaskDrag}
            onMilestoneToggle={onMilestoneToggle}
            selectedTask={selectedTask}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-2 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Zadanie w toku</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-2 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Ukończone</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-2 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Ścieżka krytyczna</span>
            </div>
            <div className="flex items-center">
              <Flag className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-sm text-gray-700">Kamień milowy</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Zależności</span>
          </div>
        </div>
      </div>
    </div>
  );
}