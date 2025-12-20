'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrumTask, Priority } from '@/types/views';

interface TaskCardProps {
  task: ScrumTask;
  onClick?: (task: ScrumTask) => void;
  onEdit?: (task: ScrumTask) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
  showDetails?: boolean;
}

const priorityColors: Record<Priority, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

const priorityIcons: Record<Priority, string> = {
  urgent: '🔴',
  high: '🟠', 
  medium: '🟡',
  low: '🟢'
};

export default function TaskCard({ 
  task, 
  onClick, 
  onEdit, 
  onDelete,
  className = '',
  showDetails = false
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const getProgressPercentage = (): number => {
    if (!task.actualHours || !task.estimatedHours) return 0;
    return Math.min((task.actualHours / task.estimatedHours) * 100, 100);
  };

  const getProgressColor = (): string => {
    const progress = getProgressPercentage();
    if (progress > 100) return 'bg-red-500';
    if (progress > 80) return 'bg-orange-500';
    if (progress > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTaskStatusColor = (): string => {
    if (task.blockers.length > 0) return 'border-l-4 border-red-500';
    if (task.actualHours && task.actualHours > task.estimatedHours) return 'border-l-4 border-orange-500';
    return 'border-l-4 border-blue-500';
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all ${getTaskStatusColor()} ${className}`}
      onClick={() => onClick && onClick(task)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </h4>
            {isExpanded && task.description && (
              <p className="text-sm text-gray-600 mb-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <span className="text-lg">{priorityIcons[task.priority]}</span>
            <Badge 
              variant="secondary" 
              className={`text-xs ${priorityColors[task.priority]}`}
            >
              {task.priority.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Story Points & Hours */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">SP:</span>
              <span className="text-sm font-semibold text-blue-600">
                {task.storyPoints}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">⏱️</span>
              <span className="text-sm">
                {task.actualHours ? `${task.actualHours}/${task.estimatedHours}h` : `${task.estimatedHours}h`}
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? '▲' : '▼'}
          </Button>
        </div>

        {/* Progress Bar */}
        {task.actualHours && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.labels.slice(0, isExpanded ? task.labels.length : 3).map((label, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                #{label}
              </Badge>
            ))}
            {!isExpanded && task.labels.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Blockers */}
        {task.blockers.length > 0 && (
          <div className="mb-3">
            <Badge variant="destructive" className="text-xs">
              🚫 {task.blockers.length} blocker{task.blockers.length > 1 ? 's' : ''}
            </Badge>
            {isExpanded && (
              <div className="mt-2 space-y-1">
                {task.blockers.map((blocker, idx) => (
                  <div key={idx} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {blocker}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acceptance Criteria */}
        {isExpanded && task.acceptanceCriteria.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-semibold text-gray-700 mb-2">Acceptance Criteria:</h5>
            <ul className="space-y-1">
              {task.acceptanceCriteria.map((criteria, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=20`}
              alt={task.assignee.name}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs text-gray-600">
              {task.assignee.name.split(' ')[0]}
            </span>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex items-center space-x-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  ✏️
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
                      onDelete(task.id);
                    }
                  }}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                >
                  🗑️
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}