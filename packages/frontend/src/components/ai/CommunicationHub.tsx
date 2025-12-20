'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { 
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Paperclip,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Video,
  Slack,
  FileText
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  receivedAt: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
  attachments?: any[];
}

interface Channel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SLACK' | 'PHONE' | 'SMS' | 'TEAMS';
  isActive: boolean;
  unreadCount?: number;
  lastActivity?: string;
}

interface CommunicationStats {
  totalMessages: number;
  uniqueContacts: number;
  avgResponseTime: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
}

interface CommunicationHubProps {
  streamId?: string;
  className?: string;
}

const channelIcons = {
  EMAIL: Mail,
  SLACK: MessageCircle,
  PHONE: Phone,
  SMS: MessageCircle,
  TEAMS: Video
};

const channelColors = {
  EMAIL: 'bg-blue-100 text-blue-700',
  SLACK: 'bg-purple-100 text-purple-700',
  PHONE: 'bg-green-100 text-green-700',
  SMS: 'bg-yellow-100 text-yellow-700',
  TEAMS: 'bg-indigo-100 text-indigo-700'
};

export function CommunicationHub({ streamId, className }: CommunicationHubProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    loadCommunicationData();
  }, [streamId]);

  useEffect(() => {
    if (selectedChannel) {
      loadChannelInsights(selectedChannel);
    }
  }, [selectedChannel]);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      // Load channels for stream
      const channelsResponse = await fetch(
        `/api/v1/streams/${streamId}/channels`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        setChannels(channelsData.data || []);
        
        // Auto-select first active channel
        const activeChannel = channelsData.data?.find((c: Channel) => c.isActive);
        if (activeChannel) {
          setSelectedChannel(activeChannel.id);
        }
      }

      // Load recent messages across all channels
      const messagesResponse = await fetch(
        `/api/v1/streams/${streamId}/messages?limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.data || []);
      }

    } catch (error: any) {
      console.error('Failed to load communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelInsights = async (channelId: string) => {
    try {
      const response = await fetch(
        `/api/v1/ai-insights/communication/${channelId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setInsights(data.data.insights || []);
      }
    } catch (error: any) {
      console.error('Failed to load channel insights:', error);
    }
  };

  const getChannelIcon = (type: string) => {
    const Icon = channelIcons[type as keyof typeof channelIcons] || MessageCircle;
    return <Icon className="h-4 w-4" />;
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const getSentimentColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4" />;
      case 'declining': return <TrendingDown className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const startComposing = (type: 'email' | 'message' | 'call') => {
    setComposing(true);
    // Here you would implement the compose functionality
    // For now, just simulate
    setTimeout(() => {
      setComposing(false);
      // Refresh data after sending
      loadCommunicationData();
    }, 2000);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>📨 Communication Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading communication data..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📨 Communication Hub</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startComposing('email')}
              disabled={composing}
              className="flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => startComposing('call')}
              disabled={composing}
              className="flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startComposing('message')}
              disabled={composing}
              className="flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              Message
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Channels */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Channels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedChannel === channel.id 
                    ? 'ring-2 ring-blue-500 border-blue-200' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedChannel(channel.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${channelColors[channel.type]}`}>
                      {getChannelIcon(channel.type)}
                    </span>
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {channel.lastActivity && (
                    <span>Last: {new Date(channel.lastActivity).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats for Selected Channel */}
        {stats && selectedChannel && (
          <div>
            <h3 className="font-medium mb-3">Channel Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Messages</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Contacts</span>
                </div>
                <div className="text-2xl font-bold">{stats.uniqueContacts}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Response Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatResponseTime(stats.avgResponseTime)}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className={getSentimentColor(stats.sentimentTrend)}>
                    {getSentimentIcon(stats.sentimentTrend)}
                  </span>
                  <span className="text-sm font-medium">Sentiment</span>
                </div>
                <div className={`text-lg font-bold capitalize ${getSentimentColor(stats.sentimentTrend)}`}>
                  {stats.sentimentTrend}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights for Communication */}
        {insights.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              🤖 AI Communication Insights
            </h3>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-blue-700 text-sm mb-2">
                        {insight.description}
                      </p>
                      {insight.actions && insight.actions.length > 0 && (
                        <div className="flex gap-2">
                          {insight.actions.map((action: any, actionIndex: number) => (
                            <Button 
                              key={actionIndex}
                              variant="outline" 
                              size="sm"
                              className="text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Messages */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Recent Messages
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent messages</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id}
                  className={`p-3 rounded-lg border ${
                    message.direction === 'INBOUND' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {message.contact && (
                        <span className="font-medium text-sm">
                          {message.contact.firstName} {message.contact.lastName}
                        </span>
                      )}
                      {message.company && (
                        <Badge variant="outline" className="text-xs">
                          {message.company.name}
                        </Badge>
                      )}
                      <Badge 
                        variant={message.direction === 'INBOUND' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {message.direction === 'INBOUND' ? 'In' : 'Out'}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {message.content.length > 200 
                      ? `${message.content.substring(0, 200)}...`
                      : message.content
                    }
                  </p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Paperclip className="h-3 w-3" />
                      <span>{message.attachments.length} attachment(s)</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              disabled={composing}
            >
              <Mail className="h-4 w-4" />
              Team Update
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              disabled={composing}
            >
              <FileText className="h-4 w-4" />
              Share File
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              disabled={composing}
            >
              <Phone className="h-4 w-4" />
              Start Call
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              disabled={composing}
            >
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}