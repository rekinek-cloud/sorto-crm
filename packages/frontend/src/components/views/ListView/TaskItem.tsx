'use client';

import React, { useState } from 'react';
import { UserAvatar } from '../shared/UserAvatar';
import { PriorityIndicator } from '../shared/PriorityIndicator';
import { GTDContextBadge } from '../shared/GTDContextBadge';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  estimatedTime: number;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate?: Date;
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  project?: {
    id: string;
    title: string;
  };
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete }) => {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-600 bg-red-100';
    if (daysUntil <= 1) return 'text-orange-600 bg-orange-100';
    if (daysUntil <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
  const dueDateColor = daysUntilDue ? getDueDateColor(daysUntilDue) : '';

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-400'
          }`}
          disabled={task.completed}
        >
          {task.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title and Priority */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-medium text-gray-900 ${task.completed ? 'line-through' : ''}`}>
                  {task.title}
                </h3>
                <PriorityIndicator priority={task.priority} size="sm" />
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Metadata Row */}
              <div className="flex items-center space-x-4 text-sm">
                {/* GTD Context */}
                <GTDContextBadge context={task.gtdContext} size="sm" />

                {/* Estimated Time */}
                <span className="text-gray-500">
                  ⏱️ {formatTime(task.estimatedTime)}
                </span>

                {/* Due Date */}
                {task.dueDate && (
                  <span className={`px-2 py-1 rounded-full text-xs ${dueDateColor}`}>
                    {daysUntilDue === 0 ? 'Dziś' : 
                     daysUntilDue === 1 ? 'Jutro' :
                     daysUntilDue! < 0 ? `Spóźnione ${Math.abs(daysUntilDue!)}d` :
                     `Za ${daysUntilDue}d`}
                  </span>
                )}

                {/* Project/Deal Link */}
                {task.deal && (
                  <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">
                    💼 {task.deal.company}
                  </span>
                )}
                {task.project && !task.deal && (
                  <span className="text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded">
                    📁 {task.project.title}
                  </span>
                )}
              </div>
            </div>

            {/* Assignee and Actions */}
            <div className="flex items-center space-x-3 ml-4">
              <UserAvatar 
                user={task.assignee}
                size="sm"
                showName={false}
              />
              
              {/* Expand Button */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Left Column */}
                <div className="space-y-2">
                  {task.dueDate && (
                    <div>
                      <span className="font-medium text-gray-700">Termin:</span>
                      <span className="ml-2 text-gray-600">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-gray-700">Utworzono:</span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>

                  {task.completedAt && (
                    <div>
                      <span className="font-medium text-gray-700">Ukończono:</span>
                      <span className="ml-2 text-gray-600">
                        {formatDate(task.completedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Przypisano:</span>
                    <span className="ml-2">
                      <UserAvatar 
                        user={task.assignee}
                        size="xs"
                        showName={true}
                      />
                    </span>
                  </div>

                  {task.deal && (
                    <div>
                      <span className="font-medium text-gray-700">Deal:</span>
                      <div className="ml-2 text-gray-600">
                        <div>{task.deal.title}</div>
                        <div className="text-xs text-gray-500">{task.deal.company}</div>
                      </div>
                    </div>
                  )}

                  {task.project && (
                    <div>
                      <span className="font-medium text-gray-700">Projekt:</span>
                      <span className="ml-2 text-gray-600">
                        {task.project.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {!task.completed && (
                <div className="flex space-x-2 mt-4">
                  <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
                    ✏️ Edytuj
                  </button>
                  <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">
                    ⏰ Zmień termin
                  </button>
                  <button className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200">
                    👥 Przypisz
                  </button>
                  <button 
                    onClick={() => onComplete(task.id)}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
                  >
                    ✅ Oznacz jako wykonane
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};