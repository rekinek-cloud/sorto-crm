'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface CommunicationHistory {
  id: string;
  type: string;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  fromAddress?: string;
  fromName?: string;
  toAddress?: string;
  createdAt: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  channel?: {
    name: string;
    type: string;
  };
}

interface CommunicationThread {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  subject?: string;
  messages: CommunicationHistory[];
  lastActivity: string;
  unreadCount: number;
  messageCount: number;
}

interface CommunicationHistoryProps {
  history: CommunicationHistory[];
  loading: boolean;
  onRefresh: () => void;
}

export function CommunicationHistory({ history, loading, onRefresh }: CommunicationHistoryProps) {
  const [viewMode, setViewMode] = useState<'conversations' | 'timeline'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'email' | 'phone' | 'sms'>('all');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  // Group messages into conversation threads
  const groupIntoThreads = (messages: CommunicationHistory[]): CommunicationThread[] => {
    const threadsMap = new Map<string, CommunicationThread>();

    messages.forEach(message => {
      // Group by contact + subject (for emails) or just contact (for calls/sms)
      const threadKey = message.contact 
        ? `${message.contact.id}-${message.type === 'email' ? message.subject || 'no-subject' : message.type}`
        : `unknown-${message.type}`;

      if (!threadsMap.has(threadKey)) {
        threadsMap.set(threadKey, {
          contact: message.contact || null,
          subject: message.subject,
          messages: [],
          lastActivity: message.createdAt,
          unreadCount: 0,
          messageCount: 0
        });
      }

      const thread = threadsMap.get(threadKey)!;
      thread.messages.push(message);
      thread.messageCount++;
      
      // Update last activity if this message is newer
      if (new Date(message.createdAt) > new Date(thread.lastActivity)) {
        thread.lastActivity = message.createdAt;
      }
    });

    // Sort messages within threads by date
    threadsMap.forEach(thread => {
      thread.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    // Convert to array and sort by last activity
    return Array.from(threadsMap.values())
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  };

  // Filter messages
  const filteredHistory = history.filter(message => {
    const matchesSearch = !searchQuery || 
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.contact?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.contact?.lastName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || message.type.toLowerCase().includes(filterType);

    return matchesSearch && matchesFilter;
  });

  const threads = groupIntoThreads(filteredHistory);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} min temu`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} godz. temu`;
    } else if (diffInHours < 48) {
      return 'Wczoraj';
    } else {
      return date.toLocaleDateString('pl-PL', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'sms':
      case 'chat':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const toggleThread = (threadKey: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadKey)) {
      newExpanded.delete(threadKey);
    } else {
      newExpanded.add(threadKey);
    }
    setExpandedThreads(newExpanded);
  };

  const getThreadKey = (thread: CommunicationThread) => {
    return `${thread.contact?.id || 'unknown'}-${thread.subject || thread.messages[0]?.type}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            Historia komunikacji
          </h3>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('conversations')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'conversations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Konwersacje
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Timeline
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Odśwież
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj w komunikacji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Wszystkie typy</option>
            <option value="email">📧 Email</option>
            <option value="phone">📞 Telefon</option>
            <option value="sms">💬 SMS</option>
          </select>
          <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Brak komunikacji spełniającej kryteria</p>
          <p className="text-sm">Spróbuj zmienić filtry wyszukiwania</p>
        </div>
      ) : viewMode === 'conversations' ? (
        /* Conversation View */
        <div className="space-y-2">
          {threads.map((thread) => {
            const threadKey = getThreadKey(thread);
            const isExpanded = expandedThreads.has(threadKey);
            const latestMessage = thread.messages[thread.messages.length - 1];
            
            return (
              <div key={threadKey} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Thread Header */}
                <button
                  onClick={() => toggleThread(threadKey)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        {getCommunicationIcon(latestMessage.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {thread.contact 
                              ? `${thread.contact.firstName} ${thread.contact.lastName}`
                              : 'Nieznany kontakt'
                            }
                          </span>
                          
                          {thread.messageCount > 1 && (
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                              {thread.messageCount}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-1">
                          {thread.subject && (
                            <div className="font-medium">{thread.subject}</div>
                          )}
                          <div className="truncate">
                            {latestMessage.content.length > 100 
                              ? `${latestMessage.content.substring(0, 100)}...`
                              : latestMessage.content
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(thread.lastActivity)}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {thread.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              msg.direction === 'outbound' 
                                ? 'bg-blue-400' 
                                : 'bg-green-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Messages */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {thread.messages.map((message, idx) => (
                      <div
                        key={message.id}
                        className={`p-4 ${idx !== thread.messages.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.direction === 'outbound' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {getCommunicationIcon(message.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {message.direction === 'outbound' ? 'Wysłane' : 'Otrzymane'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString('pl-PL')}
                              </span>
                              {message.channel && (
                                <span className="text-xs text-gray-400">
                                  via {message.channel.name}
                                </span>
                              )}
                            </div>
                            
                            {message.subject && (
                              <div className="font-medium text-gray-900 mb-1">
                                {message.subject}
                              </div>
                            )}
                            
                            <div className="text-gray-700 text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-4">
          {filteredHistory.map((message, idx) => (
            <div key={message.id} className="flex items-start space-x-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.direction === 'outbound' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {getCommunicationIcon(message.type)}
                </div>
                {idx < filteredHistory.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 mt-2" />
                )}
              </div>
              
              {/* Message content */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {message.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      message.direction === 'outbound' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {message.direction === 'outbound' ? 'Wychodzące' : 'Przychodzące'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(message.createdAt)}
                  </span>
                </div>
                
                {message.subject && (
                  <h4 className="font-medium text-gray-900 mb-2">
                    {message.subject}
                  </h4>
                )}
                
                <p className="text-gray-700 text-sm mb-3">
                  {message.content}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {message.contact && (
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{message.contact.firstName} {message.contact.lastName}</span>
                    </div>
                  )}
                  {message.channel && (
                    <span>via {message.channel.name}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}