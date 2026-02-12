'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '@/types/gtd';
import { gtdHelpers } from '@/lib/api/gtd';
import {
  Calendar,
  User,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onOpen?: (id: string) => void;
}

export default function ProjectCard({ project, onEdit, onDelete, onOpen }: ProjectCardProps) {
  const progress = project.stats?.progress || 0;
  const taskCount = project.stats?.totalTasks || 0;
  const completedTasks = project.stats?.completedTasks || 0;

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen?.(project.id)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
            <div className="flex items-center space-x-2 mb-3">
              <span
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: gtdHelpers.getProjectStatusColor(project.status) + '20',
                  color: gtdHelpers.getProjectStatusColor(project.status)
                }}
              >
                {project.status}
              </span>
              <span
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: gtdHelpers.getPriorityColor(project.priority) + '20',
                  color: gtdHelpers.getPriorityColor(project.priority)
                }}
              >
                {project.priority}
              </span>
            </div>
          </div>
          
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{taskCount}</div>
            <div className="text-xs text-gray-500">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2 text-sm text-gray-500">
          {/* Stream */}
          {project.stream && (
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Stream: {project.stream.name}</span>
            </div>
          )}

          {/* Assigned to */}
          {project.assignedTo && (
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>
                {project.assignedTo.firstName} {project.assignedTo.lastName}
              </span>
            </div>
          )}

          {/* Due date */}
          {project.endDate && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span className={`${
                new Date(project.endDate) < new Date() && project.status !== 'COMPLETED'
                  ? 'text-red-600 font-medium'
                  : 'text-gray-500'
              }`}>
                Due: {gtdHelpers.formatDate(project.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom border with priority color */}
      <div
        className="h-1 rounded-b-lg"
        style={{ backgroundColor: gtdHelpers.getPriorityColor(project.priority) }}
      />
    </motion.div>
  );
}