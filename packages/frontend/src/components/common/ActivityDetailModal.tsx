'use client';

import React from 'react';
import { X, Mail, Phone, Calendar, User, Building2, DollarSign } from 'lucide-react';
import { ActivityItem } from './ActivityTimeline';

interface ActivityDetailModalProps {
  activity: ActivityItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
  if (!isOpen || !activity) return null;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'deal_created':
      case 'deal_updated':
        return <CurrencyDollarIcon className="w-6 h-6 text-green-600" />;
      case 'contact_added':
      case 'contact_updated':
        return <User className="w-6 h-6 text-blue-600" />;
      case 'email_sent':
      case 'email_received':
      case 'EMAIL_SENT':
      case 'EMAIL_RECEIVED':
        return <Mail className="w-6 h-6 text-indigo-600" />;
      case 'phone_call':
        return <Phone className="w-6 h-6 text-yellow-600" />;
      case 'meeting_scheduled':
        return <Calendar className="w-6 h-6 text-orange-600" />;
      default:
        return <div className="w-6 h-6 bg-gray-400 rounded-full" />;
    }
  };

  const getTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'deal_created': return 'Deal utworzony';
      case 'deal_updated': return 'Deal zaktualizowany';
      case 'contact_added': return 'Kontakt dodany';
      case 'contact_updated': return 'Kontakt zaktualizowany';
      case 'email_sent':
      case 'EMAIL_SENT': return 'Email wysłany';
      case 'email_received':
      case 'EMAIL_RECEIVED': return 'Email otrzymany';
      case 'phone_call': return 'Rozmowa telefoniczna';
      case 'meeting_scheduled': return 'Spotkanie zaplanowane';
      case 'task_completed': return 'Zadanie ukończone';
      case 'CHAT_MESSAGE': return 'Wiadomość chat';
      default: return type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getActivityIcon(activity.type)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getTypeLabel(activity.type)}
              </h3>
              <p className="text-sm text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Title and Description */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{activity.title}</h4>
              {activity.description && (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {activity.description}
                </p>
              )}
            </div>

            {/* Email/Communication Details */}
            {(activity.type.includes('email') || activity.type.includes('EMAIL')) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Szczegóły komunikacji</h5>
                <div className="space-y-2 text-sm">
                  {(activity.metadata?.subject || activity.metadata?.emailSubject) && (
                    <div>
                      <span className="font-medium text-gray-600">Temat:</span>
                      <span className="ml-2 text-gray-900">
                        {activity.metadata.subject || activity.metadata.emailSubject}
                      </span>
                    </div>
                  )}
                  
                  {activity.type.includes('sent') || activity.type.includes('SENT') ? (
                    <div>
                      <span className="font-medium text-gray-600">Do:</span>
                      <span className="ml-2 text-gray-900">
                        {activity.metadata?.recipient || activity.metadata?.toAddress || 'Nieznany'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium text-gray-600">Od:</span>
                      <span className="ml-2 text-gray-900">
                        {activity.metadata?.sender || activity.metadata?.fromName || activity.metadata?.fromAddress || 'Nieznany'}
                      </span>
                    </div>
                  )}

                  {activity.metadata?.channelName && (
                    <div>
                      <span className="font-medium text-gray-600">Kanał:</span>
                      <span className="ml-2 text-gray-900">{activity.metadata.channelName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phone Call Details */}
            {activity.type === 'phone_call' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Szczegóły rozmowy</h5>
                <div className="space-y-2 text-sm">
                  {activity.metadata?.callDuration && (
                    <div>
                      <span className="font-medium text-gray-600">Czas trwania:</span>
                      <span className="ml-2 text-gray-900">{activity.metadata.callDuration} min</span>
                    </div>
                  )}
                  
                  {activity.metadata?.communicationDirection && (
                    <div>
                      <span className="font-medium text-gray-600">Kierunek:</span>
                      <span className="ml-2 text-gray-900">
                        {activity.metadata.communicationDirection === 'inbound' ? 'Przychodzące' : 'Wychodzące'}
                      </span>
                    </div>
                  )}

                  {activity.metadata?.callOutcome && (
                    <div>
                      <span className="font-medium text-gray-600">Wynik:</span>
                      <span className="ml-2 text-gray-900">{activity.metadata.callOutcome}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deal Details */}
            {activity.deal && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  Powiązany Deal
                </h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Nazwa:</span>
                    <span className="ml-2 text-gray-900">{activity.deal.title}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Etap:</span>
                    <span className="ml-2 text-gray-900">{activity.deal.stage}</span>
                  </div>
                  {activity.deal.value && (
                    <div>
                      <span className="font-medium text-gray-600">Wartość:</span>
                      <span className="ml-2 text-gray-900">
                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(activity.deal.value)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Details */}
            {activity.contact && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Powiązany Kontakt
                </h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Imię i nazwisko:</span>
                    <span className="ml-2 text-gray-900">
                      {activity.contact.firstName} {activity.contact.lastName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* User who performed action */}
            {activity.user && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Wykonane przez</h5>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {activity.user.firstName.charAt(0)}{activity.user.lastName.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900">
                    {activity.user.firstName} {activity.user.lastName}
                  </span>
                </div>
              </div>
            )}

            {/* Raw metadata for debugging */}
            {process.env.NODE_ENV === 'development' && activity.metadata && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Debug Metadata</h5>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}