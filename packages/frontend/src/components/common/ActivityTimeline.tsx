'use client';

import React, { useState } from 'react';
import {
  Clock,
  User,
  DollarSign,
  Building2,
  CheckCircle,
  Pencil,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { ActivityDetailModal } from './ActivityDetailModal';

export interface ActivityItem {
  id: string;
  type: 'deal_created' | 'deal_updated' | 'contact_added' | 'contact_updated' | 'task_completed' | 'meeting_scheduled' | 'email_sent' | 'email_received' | 'phone_call' | 'sms_sent' | 'chat_message' | 'note_added' | 'EMAIL_SENT' | 'EMAIL_RECEIVED' | 'CHAT_MESSAGE';
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  metadata?: {
    dealValue?: number;
    dealStage?: string;
    previousStage?: string;
    contactName?: string;
    taskTitle?: string;
    meetingDate?: string;
    emailSubject?: string;
    noteContent?: string;
    // Communication metadata
    communicationType?: string;
    communicationDirection?: string;
    callDuration?: number;
    callOutcome?: string;
    recipient?: string;
    sender?: string;
    followUpRequired?: boolean;
    // Email/message specific
    subject?: string;
    toAddress?: string;
    fromAddress?: string;
    fromName?: string;
    channelName?: string;
  };
  // Relations
  deal?: any;
  contact?: any;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
  onActivityClick?: (activity: ActivityItem) => void;
}

export function ActivityTimeline({ 
  activities, 
  loading = false, 
  emptyMessage = "No recent activity",
  maxItems = 10,
  onActivityClick
}: ActivityTimelineProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const handleActivityClick = (activity: ActivityItem) => {
    if (onActivityClick) {
      onActivityClick(activity);
      return;
    }

    // Open modal with activity details
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedActivity(null);
  };
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'deal_created':
      case 'deal_updated':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'contact_added':
      case 'contact_updated':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'meeting_scheduled':
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'email_sent':
      case 'email_received':
      case 'EMAIL_SENT':
      case 'EMAIL_RECEIVED':
        return <Mail className="w-4 h-4 text-indigo-600" />;
      case 'phone_call':
        return <Phone className="w-4 h-4 text-yellow-600" />;
      case 'sms_sent':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'chat_message':
      case 'CHAT_MESSAGE':
        return <Mail className="w-4 h-4 text-purple-600" />;
      case 'note_added':
        return <Pencil className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'deal_created':
      case 'deal_updated':
        return 'bg-green-100';
      case 'contact_added':
      case 'contact_updated':
        return 'bg-blue-100';
      case 'task_completed':
        return 'bg-purple-100';
      case 'meeting_scheduled':
        return 'bg-orange-100';
      case 'email_sent':
      case 'email_received':
      case 'EMAIL_SENT':
      case 'EMAIL_RECEIVED':
        return 'bg-indigo-100';
      case 'phone_call':
        return 'bg-yellow-100';
      case 'sms_sent':
        return 'bg-green-100';
      case 'chat_message':
      case 'CHAT_MESSAGE':
        return 'bg-purple-100';
      case 'note_added':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderActivityContent = (activity: ActivityItem) => {
    const { metadata } = activity;
    
    switch (activity.type) {
      case 'deal_created':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {metadata?.dealValue && (
              <p className="text-sm text-gray-600">
                Value: {formatCurrency(metadata.dealValue)}
              </p>
            )}
          </div>
        );
        
      case 'deal_updated':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {metadata?.previousStage && metadata?.dealStage && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {metadata.previousStage.toLowerCase()}
                </span>
                <ArrowRight className="w-3 h-3 mx-2" />
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {metadata.dealStage.toLowerCase()}
                </span>
              </div>
            )}
          </div>
        );
        
      case 'contact_added':
      case 'contact_updated':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {metadata?.contactName && (
              <p className="text-sm text-gray-600">{metadata.contactName}</p>
            )}
          </div>
        );
        
      case 'task_completed':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {metadata?.taskTitle && (
              <p className="text-sm text-gray-600">"{metadata.taskTitle}"</p>
            )}
          </div>
        );
        
      case 'meeting_scheduled':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {metadata?.meetingDate && (
              <p className="text-sm text-gray-600">
                Scheduled for {new Date(metadata.meetingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        );
        
      case 'email_sent':
      case 'EMAIL_SENT':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {(metadata?.emailSubject || metadata?.subject) && (
              <p className="text-sm text-gray-600">"{metadata.emailSubject || metadata.subject}"</p>
            )}
            {(metadata?.recipient || metadata?.toAddress) && (
              <p className="text-sm text-gray-500">To: {metadata.recipient || metadata.toAddress}</p>
            )}
            {(metadata?.channelName) && (
              <p className="text-xs text-gray-400">via {metadata.channelName}</p>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                Sent
              </span>
            </div>
          </div>
        );
        
      case 'email_received':
      case 'EMAIL_RECEIVED':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {(metadata?.emailSubject || metadata?.subject) && (
              <p className="text-sm text-gray-600">"{metadata.emailSubject || metadata.subject}"</p>
            )}
            {(metadata?.sender || metadata?.fromAddress || metadata?.fromName) && (
              <p className="text-sm text-gray-500">
                From: {metadata.sender || metadata.fromName || metadata.fromAddress}
              </p>
            )}
            {(metadata?.channelName) && (
              <p className="text-xs text-gray-400">via {metadata.channelName}</p>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                Received
              </span>
            </div>
          </div>
        );
        
      case 'phone_call':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
              {metadata?.callDuration && (
                <span>Duration: {metadata.callDuration} min</span>
              )}
              {metadata?.communicationDirection && (
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {metadata.communicationDirection}
                </span>
              )}
            </div>
            {metadata?.callOutcome && (
              <p className="text-sm text-gray-600 mt-1">Outcome: {metadata.callOutcome}</p>
            )}
          </div>
        );
        
      case 'sms_sent':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-gray-600 line-clamp-2">"{activity.description}"</p>
            )}
          </div>
        );
        
      case 'chat_message':
      case 'CHAT_MESSAGE':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-gray-600 line-clamp-2">"{activity.description}"</p>
            )}
            {(metadata?.fromName || metadata?.fromAddress) && (
              <p className="text-sm text-gray-500">
                From: {metadata.fromName || metadata.fromAddress}
              </p>
            )}
            {(metadata?.channelName) && (
              <p className="text-xs text-gray-400">via {metadata.channelName}</p>
            )}
          </div>
        );
        
      case 'note_added':
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {metadata?.noteContent && (
              <p className="text-sm text-gray-600 line-clamp-2">
                "{metadata.noteContent}"
              </p>
            )}
          </div>
        );
        
      default:
        return (
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-gray-600">{activity.description}</p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
        <p className="text-sm">Activity will appear here as interactions occur</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => (
        <div key={activity.id} className="flex items-start space-x-3 group">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          
          {/* Content - make clickable */}
          <div 
            className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            onClick={() => handleActivityClick(activity)}
            title="Click to view details"
          >
            {renderActivityContent(activity)}
            
            {/* User and timestamp */}
            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
              {activity.user && (
                <>
                  <User className="w-3 h-3" />
                  <span>{activity.user.firstName} {activity.user.lastName}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatTimestamp(activity.timestamp)}</span>
              
              {/* Visual indicator that it's clickable */}
              <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
          </div>
          
          {/* Connector line */}
          {index < displayActivities.length - 1 && (
            <div className="absolute left-4 mt-8 w-px h-6 bg-gray-200" 
                 style={{ marginLeft: '15px' }} />
          )}
        </div>
      ))}
      
      {activities.length > maxItems && (
        <div className="text-center pt-4">
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View all activity ({activities.length} total)
          </button>
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={showModal}
        onClose={closeModal}
      />
    </div>
  );
}