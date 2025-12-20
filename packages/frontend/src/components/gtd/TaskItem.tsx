'use client';

import React, { useState } from 'react';
import { Task } from '@/types/gtd';
import { gtdHelpers } from '@/lib/api/gtd';
import FlowScoreBadge from '@/components/streams/FlowScoreBadge';
import FlowAnalysisModal from '@/components/streams/FlowAnalysisModal';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onTaskUpdate?: (task: Task) => void;
}

export default function TaskItem({ task, onEdit, onDelete, onStatusChange, onTaskUpdate }: TaskItemProps) {
  const [showFlowModal, setShowFlowModal] = useState(false);
  const isOverdue = gtdHelpers.isTaskOverdue(task);
  const priorityColor = gtdHelpers.getPriorityColor(task.priority);
  const statusColor = gtdHelpers.getTaskStatusColor(task.status);
  
  const handleStatusToggle = () => {
    const newStatus = task.status === 'COMPLETED' ? 'NEW' : 'COMPLETED';
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className={`bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow p-4 ${
      isOverdue ? 'border-red-500 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        {/* Left side - Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start space-x-3">
            {/* Checkbox */}
            <button
              onClick={handleStatusToggle}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.status === 'COMPLETED'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {task.status === 'COMPLETED' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Task details */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium text-gray-900 truncate ${
                task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''
              }`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta information */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                {/* Priority */}
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: priorityColor }}
                  />
                  <span>{task.priority}</span>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                  <span>{task.status.replace('_', ' ')}</span>
                </div>

                {/* Context */}
                {task.context && (
                  <div className="flex items-center space-x-1">
                    <span>{task.context.icon}</span>
                    <span>{task.context.name}</span>
                  </div>
                )}

                {/* Project */}
                {task.project && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>{task.project.name}</span>
                  </div>
                )}

                {/* Due date */}
                {task.dueDate && (
                  <div className={`flex items-center space-x-1 ${
                    isOverdue ? 'text-red-600 font-medium' : ''
                  }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{gtdHelpers.formatDate(task.dueDate)}</span>
                    {isOverdue && (
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Estimated hours */}
                {task.estimatedHours && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{task.estimatedHours}h</span>
                  </div>
                )}

                {/* Waiting for */}
                {task.isWaitingFor && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Oczekuje</span>
                  </div>
                )}
              </div>

              {/* Waiting note */}
              {task.isWaitingFor && task.waitingForNote && (
                <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                  <p className="text-xs text-amber-800">
                    <strong>Oczekuje na:</strong> {task.waitingForNote}
                  </p>
                </div>
              )}

              {/* Assigned to */}
              {task.assignedTo && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {task.assignedTo.firstName[0]}{task.assignedTo.lastName[0]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Energy level indicator */}
          {task.energy && (
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: gtdHelpers.getEnergyColor(task.energy) }}
              title={`Energy: ${task.energy}`}
            />
          )}

          {/* Flow score */}
          <FlowScoreBadge
            score={task.smartScore ?? null}
            onClick={() => setShowFlowModal(true)}
            size="sm"
          />

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Flow Analysis Modal */}
      {showFlowModal && (
        <FlowAnalysisModal
          isOpen={showFlowModal}
          onClose={() => setShowFlowModal(false)}
          itemId={task.id}
          itemType="task"
          itemTitle={task.title}
          currentAnalysis={task.smartAnalysis}
          onAnalysisComplete={(analysis) => {
            if (onTaskUpdate) {
              onTaskUpdate({ ...task, smartScore: analysis.overallScore, smartAnalysis: analysis });
            }
            setShowFlowModal(false);
          }}
        />
      )}
    </div>
  );
}