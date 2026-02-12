'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AreaOfResponsibility } from '@/lib/api/areas';
import {
  BarChart3,
  MoreHorizontal,
  Clock,
  Flag,
} from 'lucide-react';

interface AreaCardProps {
  area: AreaOfResponsibility;
  onEdit: (area: AreaOfResponsibility) => void;
  onDelete: (id: string) => void;
}

export default function AreaCard({ area, onEdit, onDelete }: AreaCardProps) {
  const projectCount = area._count?.projects || 0;
  const hasProjects = projectCount > 0;

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
              style={{ backgroundColor: area.color }}
            >
              {area.icon || area.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{area.name}</h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  area.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {area.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => onEdit(area)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(area.id)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {area.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{area.description}</p>
        )}

        {/* Purpose */}
        {area.purpose && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Purpose</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{area.purpose}</p>
          </div>
        )}

        {/* Current Focus */}
        {area.currentFocus && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-1">
              <Flag className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-medium text-gray-700">Current Focus</h4>
            </div>
            <p className="text-sm text-gray-600">{area.currentFocus}</p>
          </div>
        )}

        {/* Outcomes */}
        {area.outcomes && area.outcomes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Outcomes</h4>
            <ul className="space-y-1">
              {area.outcomes.slice(0, 3).map((outcome, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span className="line-clamp-1">{outcome}</span>
                </li>
              ))}
              {area.outcomes.length > 3 && (
                <li className="text-sm text-gray-400">
                  +{area.outcomes.length - 3} more outcomes...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{projectCount}</div>
            <div className="text-xs text-gray-500">Projects</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {area.reviewFrequency.toLowerCase()}
            </div>
            <div className="text-xs text-gray-500">Review</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span>
              {hasProjects 
                ? `${projectCount} active project${projectCount !== 1 ? 's' : ''}` 
                : 'No projects yet'
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(area.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom border with area color */}
      <div
        className="h-1 rounded-b-lg"
        style={{ backgroundColor: area.color }}
      />
    </motion.div>
  );
}