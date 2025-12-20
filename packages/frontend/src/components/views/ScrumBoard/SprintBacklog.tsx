'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import TaskCard from './TaskCard';
import BurndownChart from './BurndownChart';
import { ScrumTask, SprintBoard, SprintMetrics } from '@/types/views';

interface SprintBacklogProps {
  sprintBoard: SprintBoard;
  metrics: SprintMetrics;
  onTaskSelect?: (tasks: ScrumTask[]) => void;
  onCreateTask?: () => void;
  onTaskEdit?: (task: ScrumTask) => void;
  onTaskDelete?: (taskId: string) => void;
  className?: string;
}

export default function SprintBacklog({
  sprintBoard,
  metrics,
  onTaskSelect,
  onCreateTask,
  onTaskEdit,
  onTaskDelete,
  className = ''
}: SprintBacklogProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'story_points' | 'assignee'>('priority');

  // Get all tasks from all columns
  const allTasks = sprintBoard.columns.flatMap(column => 
    column.tasks.map(task => ({ ...task, columnName: column.name }))
  );

  // Filter tasks
  const filteredTasks = allTasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'todo') return task.columnName === 'sprint_backlog';
    if (filter === 'in_progress') return task.columnName === 'in_progress';
    if (filter === 'done') return task.columnName === 'done';
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'story_points':
        return b.storyPoints - a.storyPoints;
      case 'assignee':
        return a.assignee.name.localeCompare(b.assignee.name);
      default:
        return 0;
    }
  });

  const handleTaskToggle = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    
    if (onTaskSelect) {
      const selectedTaskObjects = allTasks.filter(task => newSelected.has(task.id));
      onTaskSelect(selectedTaskObjects);
    }
  };

  const calculateSprintStats = () => {
    const totalStoryPoints = allTasks.reduce((sum, task) => sum + task.storyPoints, 0);
    const completedStoryPoints = allTasks
      .filter(task => task.columnName === 'done')
      .reduce((sum, task) => sum + task.storyPoints, 0);
    const blockedTasks = allTasks.filter(task => task.blockers.length > 0).length;
    const overEstimatedTasks = allTasks.filter(task => 
      task.actualHours && task.actualHours > task.estimatedHours
    ).length;

    return {
      totalStoryPoints,
      completedStoryPoints,
      completionPercentage: Math.round((completedStoryPoints / totalStoryPoints) * 100),
      blockedTasks,
      overEstimatedTasks
    };
  };

  const stats = calculateSprintStats();

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sprint {sprintBoard.sprintNumber} Backlog
            </h1>
            <p className="text-gray-600 mt-1">{sprintBoard.goal}</p>
          </div>
          {onCreateTask && (
            <Button onClick={onCreateTask}>
              + Nowe Zadanie
            </Button>
          )}
        </div>

        {/* Sprint Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalStoryPoints}</div>
            <div className="text-sm text-gray-500">Total SP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedStoryPoints}</div>
            <div className="text-sm text-gray-500">Completed SP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completionPercentage}%</div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.velocity}</div>
            <div className="text-sm text-gray-500">Velocity</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Filter by Status */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="priority">Priority</option>
                <option value="story_points">Story Points</option>
                <option value="assignee">Assignee</option>
              </select>
            </div>
          </div>

          {/* Selected Tasks Info */}
          {selectedTasks.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedTasks.size} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTasks(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`relative ${selectedTasks.has(task.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => handleTaskToggle(task.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Status indicator */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      task.columnName === 'done' ? 'bg-green-100 text-green-800' :
                      task.columnName === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      task.columnName === 'review' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {task.columnName.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="pl-8 pr-20">
                  <TaskCard
                    task={task}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    showDetails={false}
                  />
                </div>
              </div>
            ))}

            {sortedTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p>Try adjusting your filters or create a new task.</p>
                {onCreateTask && (
                  <Button onClick={onCreateTask} className="mt-4">
                    Create First Task
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with Charts */}
        <div className="w-96 border-l border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Burndown Chart */}
            <BurndownChart
              burndownData={sprintBoard.burndownData}
              sprintStartDate={sprintBoard.startDate}
              sprintEndDate={sprintBoard.endDate}
            />

            {/* Metrics Cards */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Sprint Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Burndown Rate</span>
                  <span className="text-sm font-medium">{metrics.burndownRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Scope Change</span>
                  <span className="text-sm font-medium">{metrics.scopeChange}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Blocked Tasks</span>
                  <span className="text-sm font-medium text-red-600">{stats.blockedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Over-estimated</span>
                  <span className="text-sm font-medium text-orange-600">{stats.overEstimatedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Team Satisfaction</span>
                  <span className="text-sm font-medium">{metrics.teamSatisfaction}/10</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📊 Generate Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  🚀 Start Sprint Review
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📅 Plan Next Sprint
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📈 View Retrospective
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}