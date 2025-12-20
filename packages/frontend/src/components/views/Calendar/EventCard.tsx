'use client';

import React, { useState } from 'react';
import { UserAvatar } from '../shared/UserAvatar';
import { PriorityIndicator } from '../shared/PriorityIndicator';
import { GTDContextBadge } from '../shared/GTDContextBadge';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'demo' | 'internal' | 'block';
  attendees: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  description?: string;
}

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getEventTypeConfig = () => {
    switch (event.type) {
      case 'meeting':
        return {
          color: 'bg-blue-500',
          lightColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: '🤝',
          label: 'Spotkanie'
        };
      case 'call':
        return {
          color: 'bg-green-500',
          lightColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: '📞',
          label: 'Rozmowa'
        };
      case 'demo':
        return {
          color: 'bg-orange-500',
          lightColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          icon: '🎥',
          label: 'Demo'
        };
      case 'internal':
        return {
          color: 'bg-gray-500',
          lightColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '🏢',
          label: 'Wewnętrzne'
        };
      case 'block':
        return {
          color: 'bg-purple-500',
          lightColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          icon: '🚫',
          label: 'Blok czasowy'
        };
      default:
        return {
          color: 'bg-gray-400',
          lightColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '📅',
          label: 'Wydarzenie'
        };
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = () => {
    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const typeConfig = getEventTypeConfig();

  if (compact) {
    return (
      <div 
        className={`absolute inset-x-1 mt-1 p-1 rounded text-white text-xs cursor-pointer ${typeConfig.color}`}
        onClick={() => setShowDetails(!showDetails)}
        title={`${event.title} - ${formatTime(event.startTime)}-${formatTime(event.endTime)}`}
      >
        <div className="truncate">
          {typeConfig.icon} {event.title}
        </div>
        
        {showDetails && (
          <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-gray-200 rounded shadow-lg z-10 text-black">
            <div className="space-y-2">
              <div>
                <span className="font-medium">{event.title}</span>
              </div>
              <div className="text-sm text-gray-600">
                {formatTime(event.startTime)} - {formatTime(event.endTime)} ({formatDuration()})
              </div>
              {event.location && (
                <div className="text-sm text-gray-600">
                  📍 {event.location}
                </div>
              )}
              {event.deal && (
                <div className="text-sm text-blue-600">
                  💼 {event.deal.company}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`border-l-4 p-4 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${typeConfig.lightColor} ${typeConfig.color}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{typeConfig.icon}</span>
            <h3 className={`font-medium ${typeConfig.textColor}`}>
              {event.title}
            </h3>
            <PriorityIndicator priority={event.priority} size="sm" />
          </div>
          
          <div className={`text-sm ${typeConfig.textColor} opacity-75`}>
            {formatTime(event.startTime)} - {formatTime(event.endTime)} ({formatDuration()})
          </div>
        </div>
        
        <span className={`text-xs px-2 py-1 rounded ${typeConfig.color} text-white`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Event Details */}
      <div className="space-y-2">
        {event.location && (
          <div className={`text-sm ${typeConfig.textColor}`}>
            📍 {event.location}
          </div>
        )}

        {event.deal && (
          <div className="text-sm">
            <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded">
              💼 {event.deal.title} - {event.deal.company}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <GTDContextBadge context={event.gtdContext} size="sm" />
        </div>

        {/* Attendees */}
        {event.attendees.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${typeConfig.textColor} opacity-75`}>
              Uczestnicy:
            </span>
            <div className="flex -space-x-1">
              {event.attendees.slice(0, 3).map(attendee => (
                <UserAvatar 
                  key={attendee.id}
                  user={attendee}
                  size="xs"
                  showName={false}
                  className="border-2 border-white"
                />
              ))}
              {event.attendees.length > 3 && (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600 border-2 border-white">
                  +{event.attendees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          {event.description && (
            <div className="mb-3">
              <span className={`text-sm font-medium ${typeConfig.textColor}`}>
                Opis:
              </span>
              <p className={`text-sm ${typeConfig.textColor} mt-1`}>
                {event.description}
              </p>
            </div>
          )}

          {/* Full Attendees List */}
          {event.attendees.length > 0 && (
            <div className="mb-3">
              <span className={`text-sm font-medium ${typeConfig.textColor}`}>
                Uczestnicy ({event.attendees.length}):
              </span>
              <div className="mt-1 space-y-1">
                {event.attendees.map(attendee => (
                  <UserAvatar 
                    key={attendee.id}
                    user={attendee}
                    size="sm"
                    showName={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button className={`text-xs px-3 py-1 rounded hover:opacity-80 ${typeConfig.color} text-white`}>
              ✏️ Edytuj
            </button>
            {event.type === 'call' && (
              <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                📞 Dołącz
              </button>
            )}
            {event.type === 'meeting' && event.location?.includes('Teams') && (
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                💻 Teams
              </button>
            )}
            <button className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
              📧 Przypomnienie
            </button>
          </div>
        </div>
      )}
    </div>
  );
};