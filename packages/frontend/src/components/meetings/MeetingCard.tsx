'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Meeting } from '@/lib/api/meetings';
import { meetingsApi } from '@/lib/api/meetings';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  VideoCameraIcon,
  MapPinIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SCHEDULED') => void;
}

export default function MeetingCard({ meeting, onEdit, onDelete, onStatusChange }: MeetingCardProps) {
  const statusColors = meetingsApi.getStatusColor(meeting.status);
  const timeRange = meetingsApi.formatTimeRange(meeting.startTime, meeting.endTime);
  const duration = meetingsApi.formatDuration(meeting.startTime, meeting.endTime);
  const isToday = meetingsApi.isToday(meeting.startTime);
  const isUpcoming = meetingsApi.isUpcoming(meeting.startTime);
  const isOngoing = meetingsApi.isOngoing(meeting.startTime, meeting.endTime);
  const meetingType = meetingsApi.getMeetingTypeIcon(meeting.location, meeting.meetingUrl);

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(meeting.id, newStatus as any);
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
              {isOngoing && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                  Live
                </span>
              )}
              {isToday && !isOngoing && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Today
                </span>
              )}
            </div>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
            >
              {meeting.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => onEdit(meeting)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              {meeting.status === 'SCHEDULED' && isUpcoming && (
                <>
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                  >
                    Start Meeting
                  </button>
                  <button
                    onClick={() => handleStatusChange('CANCELED')}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </>
              )}
              {meeting.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                >
                  Mark Complete
                </button>
              )}
              <button
                onClick={() => onDelete(meeting.id)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {meeting.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{meeting.description}</p>
        )}

        {/* Meeting Details */}
        <div className="space-y-3 mb-4">
          {/* Time */}
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{timeRange}</span>
            <span className="mx-2">•</span>
            <span>{duration}</span>
          </div>

          {/* Location/URL */}
          {(meeting.location || meeting.meetingUrl) && (
            <div className="flex items-center text-sm text-gray-600">
              {meeting.meetingUrl ? (
                <VideoCameraIcon className="w-4 h-4 mr-2 text-gray-400" />
              ) : (
                <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
              )}
              <span>{meetingType}</span>
              {meeting.meetingUrl && (
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Join
                </a>
              )}
            </div>
          )}

          {/* Contact */}
          {meeting.contact && (
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                {meeting.contact.firstName} {meeting.contact.lastName}
                {meeting.contact.company && (
                  <>
                    <span className="mx-1">from</span>
                    <span className="font-medium">{meeting.contact.company.name}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Organizer */}
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              Organized by {meeting.organizedBy.firstName} {meeting.organizedBy.lastName}
            </span>
          </div>
        </div>

        {/* Agenda Preview */}
        {meeting.agenda && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Agenda</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{meeting.agenda}</p>
          </div>
        )}

        {/* Notes Preview */}
        {meeting.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{meeting.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {meeting.status === 'SCHEDULED' && isUpcoming && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Start</span>
            </button>
            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <VideoCameraIcon className="w-4 h-4" />
                <span>Join</span>
              </a>
            )}
          </div>
        )}

        {meeting.status === 'IN_PROGRESS' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Complete</span>
            </button>
            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <VideoCameraIcon className="w-4 h-4" />
                <span>Join</span>
              </a>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {new Date(meeting.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          
          {isUpcoming && (
            <div className="text-primary-600 font-medium">
              {meetingsApi.isToday(meeting.startTime) ? 'Today' : 'Upcoming'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}