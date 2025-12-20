'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DelegatedTask } from '@/lib/api/delegated';
import { delegatedApi } from '@/lib/api/delegated';
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface DelegatedTaskCardProps {
  task: DelegatedTask;
  onEdit: (task: DelegatedTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD') => void;
}

export default function DelegatedTaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: DelegatedTaskCardProps) {
  const statusColors = delegatedApi.getStatusColor(task.status);
  const statusIcon = delegatedApi.getStatusIcon(task.status);
  const isOverdue = delegatedApi.isOverdue(task.followUpDate);
  const followUpText = delegatedApi.formatFollowUpDate(task.followUpDate);
  const urgency = delegatedApi.getDelegationUrgency(task);
  const urgencyColor = delegatedApi.getUrgencyColor(urgency);
  const timeSince = delegatedApi.formatTimeSinceDelegation(task.delegatedOn);
  const delegateInitials = delegatedApi.getDelegateInitials(task.delegatedTo);

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(task.id, newStatus as any);
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{statusIcon}</span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
              >
                {task.status.replace('_', ' ')}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Overdue
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.description}</h3>
          </div>
          
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => onEdit(task)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              {task.status !== 'COMPLETED' && task.status !== 'CANCELED' && (
                <>
                  {task.status === 'NEW' && (
                    <button
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                    >
                      Start Progress
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('COMPLETED')}
                        className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange('ON_HOLD')}
                        className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                      >
                        Put On Hold
                      </button>
                    </>
                  )}
                  {task.status === 'ON_HOLD' && (
                    <button
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('CANCELED')}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(task.id)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Delegate Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">
              {delegateInitials}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Delegated to</p>
            <p className="text-sm text-gray-600">{task.delegatedTo}</p>
          </div>
        </div>

        {/* Follow-up Date */}
        {task.followUpDate && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                {followUpText}
              </span>
            </div>
          </div>
        )}

        {/* Related Task */}
        {task.task && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Related Task:</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{task.task.title}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${
                task.task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                task.task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.task.priority}
              </span>
              <span className="text-xs text-gray-500">{task.task.status}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{task.notes}</p>
          </div>
        )}

        {/* Quick Actions */}
        {task.status === 'NEW' && (
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Start</span>
            </button>
          </div>
        )}

        {task.status === 'IN_PROGRESS' && (
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Complete</span>
            </button>
            <button
              onClick={() => handleStatusChange('ON_HOLD')}
              className="flex items-center space-x-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
            >
              <PauseIcon className="w-4 h-4" />
              <span>Hold</span>
            </button>
          </div>
        )}

        {task.status === 'ON_HOLD' && (
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Resume</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>Delegated {timeSince}</span>
          </div>
          
          <div className={`font-medium ${urgencyColor}`}>
            {urgency === 'high' ? '🔴 High' : urgency === 'medium' ? '🟡 Medium' : '🟢 Low'} priority
          </div>
        </div>
      </div>
    </motion.div>
  );
}