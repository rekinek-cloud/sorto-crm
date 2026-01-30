'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { communicationApi } from '@/lib/api/communication';
import MessageAnalysisReport from '@/components/MessageAnalysisReport';

// We'll create a communication API later
interface CommunicationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SLACK' | 'TEAMS' | 'WHATSAPP' | 'SMS';
  active: boolean;
  config: any;
  emailAddress?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface Message {
  id: string;
  channelId: string;
  channel: {
    name: string;
    type: string;
  };
  fromAddress: string;
  fromName?: string;
  subject?: string;
  content: string;
  receivedAt: string;
  isRead: boolean;
  actionNeeded: boolean;
  urgencyScore?: number;
  taskId?: string;
  task?: {
    id: string;
    title: string;
  };
  // CRM relations
  contactId?: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    status: string;
  };
  companyId?: string;
  company?: {
    id: string;
    name: string;
    status: string;
  };
  dealId?: string;
  deal?: {
    id: string;
    title: string;
    stage: string;
    value?: number;
  };
}

export default function CommunicationPage() {
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'action-needed' | 'processed'>('all');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Funkcja filtrowania wiadomości
  const getFilteredMessages = () => {
    let filteredMessages = messages;

    // Filtruj według typu filtru
    switch (selectedFilter) {
      case 'unread':
        filteredMessages = filteredMessages.filter(msg => !msg.isRead);
        break;
      case 'action-needed':
        filteredMessages = filteredMessages.filter(msg => msg.actionNeeded);
        break;
      case 'processed':
        filteredMessages = filteredMessages.filter(msg => msg.taskId);
        break;
      default: // 'all'
        break;
    }

    // Filtruj według kanału
    if (channelFilter !== 'all') {
      filteredMessages = filteredMessages.filter(msg => msg.channelId === channelFilter);
    }

    return filteredMessages;
  };

  useEffect(() => {
    loadCommunicationData();
    
    // Automatyczne odświeżanie co 30 sekund
    const interval = setInterval(() => {
      console.log('Auto-refreshing communication data...');
      loadCommunicationData();
    }, 30000); // 30 sekund

    // Keyboard shortcut for AI analysis (Ctrl/Cmd + A)
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && selectedMessage) {
        e.preventDefault();
        handleAnalyzeWithAI(selectedMessage.id);
      }
    };

    window.addEventListener('keydown', handleKeyboard);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [selectedMessage]);

  // Ponowne ładowanie gdy zmieni się filtr
  useEffect(() => {
    // Nie trzeba ponownie ładować z serwera - po prostu filtrujemy lokalne dane
  }, [selectedFilter, channelFilter]);

  const loadCommunicationData = async () => {
    try {
      setLoading(true);
      console.log('Loading communication data with filter:', selectedFilter);
      
      console.log('Making API calls to channels and messages...');
      
      const channelsResponse = await communicationApi.getChannels();
      console.log('Channels response:', channelsResponse);
      
      const messagesResponse = await communicationApi.getMessages({
        isRead: selectedFilter === 'unread' ? false : undefined,
        actionNeeded: selectedFilter === 'action-needed' ? true : undefined,
        processed: selectedFilter === 'processed' ? true : undefined,
        limit: 50
      });
      console.log('Messages response:', messagesResponse);
      console.log('Channels for message mapping:', channelsResponse.map(ch => ({ id: ch.id, name: ch.name })));

      // Add mock unread counts for display (until we have real message counting)
      const channelsWithCounts = channelsResponse.map((channel: any) => ({
        ...channel,
        unreadCount: channel._count?.messages || 0,
        lastMessage: 'Ostatnia wiadomość...',
        lastMessageAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }));

      setChannels(channelsWithCounts);
      setMessages(messagesResponse);
      setLastRefresh(new Date());
      console.log('Data loaded successfully:', { channels: channelsWithCounts.length, messages: messagesResponse.length });
      console.log('First message structure:', messagesResponse[0]);
      console.log('Channel IDs:', channelsWithCounts.map(ch => ({ id: ch.id, name: ch.name })));
      console.log('Message channel IDs:', messagesResponse.map(msg => ({ id: msg.id, channelId: msg.channelId, channel: msg.channel?.name })));
    } catch (error: any) {
      console.warn('Failed to load real data, using empty state:', error);
      setChannels([]);
      setMessages([]);
      toast.error('Nie udało się załadować danych komunikacji');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessMessage = async (messageId: string) => {
    // This would redirect to GTD Inbox for processing
    window.location.href = `/dashboard/gtd/inbox?messageId=${messageId}`;
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await communicationApi.markAsRead(messageId);
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, isRead: true } : m
      ));
      toast.success('Message marked as read');
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleAnalyzeWithAI = async (messageId: string) => {
    try {
      toast.loading('Analyzing message with AI...', { id: 'ai-analysis' });
      
      // Call AI analysis API using the proper API client
      const result = await communicationApi.analyzeMessage(messageId);
      
      // Update message with analysis results
      setMessages(messages.map(m => 
        m.id === messageId 
          ? { 
              ...m, 
              urgencyScore: result.urgencyScore || m.urgencyScore,
              actionNeeded: result.actionNeeded !== undefined ? result.actionNeeded : m.actionNeeded,
              // Update CRM data if analysis found new links
              contactId: result.contactId || m.contactId,
              contact: result.contact || m.contact,
              companyId: result.companyId || m.companyId,
              company: result.company || m.company,
              dealId: result.dealId || m.dealId,
              deal: result.deal || m.deal
            } 
          : m
      ));

      toast.success('AI analysis completed!', { id: 'ai-analysis' });
      
      // Show analysis results
      if (result.taskCreated) {
        toast.success(`Created task: ${result.taskTitle}`);
      }
      if (result.contactCreated) {
        toast.success(`Created contact: ${result.contactName}`);
      }
      if (result.dealCreated) {
        toast.success(`Created deal: ${result.dealTitle}`);
      }
      
    } catch (error: any) {
      console.error('Error analyzing message:', error);
      toast.error('Failed to analyze message', { id: 'ai-analysis' });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return '📧';
      case 'SLACK': return '💬';
      case 'WHATSAPP': return '📱';
      case 'TEAMS': return '👥';
      case 'SMS': return '💬';
      default: return '📨';
    }
  };

  const getUrgencyColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const totalUnread = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);
  const totalChannels = channels.length;
  const activeChannels = channels.filter(c => c.active).length;
  const processedMessages = messages.filter(m => m.taskId).length;
  const processingRate = messages.length > 0 ? Math.round((processedMessages / messages.length) * 100) : 0;

  console.log('Rendering component with state:', { loading, channelsCount: channels.length, messagesCount: messages.length });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centrum komunikacji</h1>
          <p className="text-gray-600">Zunifikowana skrzynka dla wszystkich kanałów komunikacji</p>
        </div>
        <div className="flex items-center space-x-3">
          {lastRefresh && (
            <div className="text-sm text-gray-500">
              Ostatnie odświeżenie: {lastRefresh.toLocaleTimeString('pl-PL')}
            </div>
          )}
          <button 
            onClick={() => loadCommunicationData()}
            disabled={loading}
            className="btn btn-outline clickable"
            title="Odśwież dane"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Odświeżanie...' : 'Odśwież'}
          </button>
          <button 
            onClick={() => setShowChannelModal(true)}
            className="btn btn-primary clickable"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj kanał
          </button>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Channels</p>
              <p className="text-2xl font-bold text-gray-900">{activeChannels}</p>
            </div>
            <div className="text-3xl">📡</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold text-red-600">{totalUnread}</p>
            </div>
            <div className="text-3xl">📬</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Auto-Processed</p>
              <p className="text-2xl font-bold text-green-600">{processingRate}%</p>
            </div>
            <div className="text-3xl">🤖</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
            <div className="text-3xl">📨</div>
          </div>
        </div>
      </div>

      {/* Inteligentne skrzynki - wzorowane na Outlook */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Inteligentne skrzynki</h2>
          <p className="text-sm text-gray-600">Automatycznie kategoryzowane wiadomości</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Skrzynka odbiorcza */}
            <button
              onClick={() => setSelectedFilter('all')}
              className={`clickable p-4 rounded-lg border-2 transition-all ${
                selectedFilter === 'all' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📬</div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Skrzynka odbiorcza</h3>
                  <p className="text-sm text-gray-600">{messages.length} wiadomości</p>
                </div>
              </div>
            </button>

            {/* Nieprzeczytane */}
            <button
              onClick={() => setSelectedFilter('unread')}
              className={`clickable p-4 rounded-lg border-2 transition-all ${
                selectedFilter === 'unread' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📭</div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Nieprzeczytane</h3>
                  <p className="text-sm text-gray-600">{messages.filter(m => !m.isRead).length} nowych</p>
                </div>
              </div>
            </button>

            {/* Ważne / Wymagają działania */}
            <button
              onClick={() => setSelectedFilter('action-needed')}
              className={`clickable p-4 rounded-lg border-2 transition-all ${
                selectedFilter === 'action-needed' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">⚡</div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Wymagają działania</h3>
                  <p className="text-sm text-gray-600">{messages.filter(m => m.actionNeeded).length} pilnych</p>
                </div>
              </div>
            </button>

            {/* Przetworzone */}
            <button
              onClick={() => setSelectedFilter('processed')}
              className={`clickable p-4 rounded-lg border-2 transition-all ${
                selectedFilter === 'processed' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">✅</div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Przetworzone</h3>
                  <p className="text-sm text-gray-600">{messages.filter(m => m.taskId).length} zadań</p>
                </div>
              </div>
            </button>
          </div>

          {/* Dodatkowe filtry w drugim rzędzie */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Filtr według kanałów */}
            <div className="relative">
              <select 
                onChange={(e) => setChannelFilter(e.target.value)}
                value={channelFilter}
                className="clickable w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">📡 Wszystkie kanały</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {getChannelIcon(channel.type)} {channel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtr według daty */}
            <div className="relative">
              <select className="clickable w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                <option>📅 Dzisiaj</option>
                <option>📅 Wczoraj</option>
                <option>📅 Ten tydzień</option>
                <option>📅 Ten miesiąc</option>
              </select>
            </div>

            {/* Filtr według nadawcy */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Szukaj nadawcy..."
                className="clickable w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtr według załączników */}
            <button className="clickable p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500">
              📎 Z załącznikami
            </button>

            {/* Filtr VIP */}
            <button className="clickable p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500">
              ⭐ VIP
            </button>

            {/* Reset filtrów */}
            <button 
              onClick={() => {
                setSelectedFilter('all');
                setChannelFilter('all');
              }}
              className="clickable p-2 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>


      {/* Recent Messages */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Messages ({getFilteredMessages().length} / {messages.length})
              </h2>
              {selectedFilter !== 'all' && (
                <p className="text-sm text-gray-600 mt-1">
                  Filtr: {selectedFilter.replace('-', ' ')}
                  {channelFilter !== 'all' && ` • Kanał: ${channels.find(ch => ch.id === channelFilter)?.name || 'Nieznany'}`}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => loadCommunicationData()}
                disabled={loading}
                className="btn btn-outline btn-sm"
                title="Odśwież wiadomości"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  const unprocessedMessages = getFilteredMessages().filter(msg => !msg.contactId && !msg.taskId);
                  if (unprocessedMessages.length > 0) {
                    const confirmMsg = `Analyze ${unprocessedMessages.length} unprocessed messages with AI?`;
                    if (confirm(confirmMsg)) {
                      unprocessedMessages.forEach((msg, index) => {
                        setTimeout(() => handleAnalyzeWithAI(msg.id), index * 1000); // 1 second delay between calls
                      });
                    }
                  } else {
                    toast('All visible messages are already processed', { icon: 'ℹ️' });
                  }
                }}
                disabled={loading}
                className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700"
                title="Analyze all unprocessed messages with AI"
              >
                🤖 Bulk AI Analysis
              </button>
            </div>
          </div>
        </div>
        
        {getFilteredMessages().length === 0 ? (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak wiadomości</h3>
              <p className="text-gray-600">
                {selectedFilter === 'all' 
                  ? 'Nie znaleziono wiadomości w żadnym kanale'
                  : `Brak wiadomości: ${selectedFilter.replace('-', ' ')}`
                }
              </p>
              <p className="text-sm text-red-600 mt-2">
                DEBUG: Załadowano {messages.length} wiadomości, wyfiltrowanych: {getFilteredMessages().length}
                <br />
                Kanały: {channels.map(ch => `${ch.name} (${ch.id.slice(0,8)})`).join(', ')}
                <br />
                Kanały w wiadomościach: {[...new Set(messages.map(m => m.channelId))].map(id => `${id.slice(0,8)}`).join(', ')}
              </p>
              {channels.length > 0 && messages.length === 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Wskazówka:</strong> Jeśli dodałeś nowy kanał, przejdź do <strong>Kanały komunikacji</strong> i użyj przycisku synchronizacji (🔄) aby pobrać wiadomości.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getFilteredMessages().map((message) => (
              <div key={message.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl">
                      {getChannelIcon(message.channel.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {message.fromName || message.fromAddress}
                        </h3>
                        <span className="text-xs text-gray-500">{message.channel.name}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(message.receivedAt)}</span>
                        
                        {message.urgencyScore && (
                          <span className={`text-xs font-medium ${getUrgencyColor(message.urgencyScore)}`}>
                            Urgency: {message.urgencyScore}%
                          </span>
                        )}
                        
                        {!message.isRead && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            NEW
                          </span>
                        )}
                        
                        {message.actionNeeded && (
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                            ACTION NEEDED
                          </span>
                        )}
                        
                        {message.taskId && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            PROCESSED
                          </span>
                        )}
                      </div>
                      
                      {message.subject && (
                        <h4 className="text-lg font-medium text-gray-900 mb-1">
                          {message.subject}
                        </h4>
                      )}
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {message.content}
                      </p>
                      
                      {message.task && (
                        <div className="text-sm text-gray-600">
                          📋 Created task: <span className="font-medium">{message.task.title}</span>
                        </div>
                      )}
                      
                      {/* CRM Information */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.contact && (
                          <div className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{message.contact.firstName} {message.contact.lastName}</span>
                            <span className="text-blue-500">({message.contact.status})</span>
                          </div>
                        )}
                        
                        {message.company && (
                          <div className="flex items-center space-x-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{message.company.name}</span>
                            <span className="text-purple-500">({message.company.status})</span>
                          </div>
                        )}
                        
                        {message.deal && (
                          <div className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{message.deal.title}</span>
                            <span className="text-green-500">({message.deal.stage})</span>
                            {message.deal.value && (
                              <span className="font-medium">${message.deal.value.toLocaleString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!message.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="clickable p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Mark as read"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    
                    {message.actionNeeded && !message.taskId && (
                      <button
                        onClick={() => handleProcessMessage(message.id)}
                        className="clickable px-3 py-1 text-sm font-medium text-green-600 hover:bg-green-100 rounded-md"
                      >
                        Process
                      </button>
                    )}
                    
                    {message.taskId && (
                      <button
                        onClick={() => window.location.href = `/dashboard/tasks/${message.taskId}`}
                        className="clickable px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-md"
                      >
                        View Task
                      </button>
                    )}

                    <button
                      onClick={() => handleAnalyzeWithAI(message.id)}
                      className="clickable px-3 py-1 text-sm font-medium text-purple-600 hover:bg-purple-100 rounded-md border border-purple-200"
                      title="Analyze with AI (CRM + GTD + SMART) - Shortcut: Ctrl/Cmd + A"
                    >
                      🤖 AI Analysis
                      <span className="text-xs text-purple-400 ml-1">⌘A</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('Opening message:', message);
                        setSelectedMessage(message);
                      }}
                      className="clickable p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      title="Zobacz szczegóły"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Communication Channel</h3>
                <button
                  onClick={() => setShowChannelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Choose a communication channel to add to your unified inbox.
                </p>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      toast('Email setup will be available in next update');
                      setShowChannelModal(false);
                    }}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📧</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Email Account</div>
                        <div className="text-sm text-gray-600">Connect Gmail, Outlook, or other IMAP</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => {
                      toast('Slack integration coming soon');
                      setShowChannelModal(false);
                    }}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💬</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Slack Workspace</div>
                        <div className="text-sm text-gray-600">Connect your Slack channels</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => {
                      toast('WhatsApp Business API integration planned');
                      setShowChannelModal(false);
                    }}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📱</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">WhatsApp Business</div>
                        <div className="text-sm text-gray-600">Business messaging integration</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowChannelModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Szczegóły wiadomości</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-6">
                {/* Message Header */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{getChannelIcon(selectedMessage.channel.type)}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {selectedMessage.fromName || selectedMessage.fromAddress}
                      </h4>
                      <p className="text-sm text-gray-600">{selectedMessage.channel.name}</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      {formatTimeAgo(selectedMessage.receivedAt)}
                    </div>
                  </div>
                  
                  {selectedMessage.subject && (
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedMessage.subject}
                    </h3>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    {selectedMessage.urgencyScore && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(selectedMessage.urgencyScore)}`}>
                        Pilność: {selectedMessage.urgencyScore}%
                      </span>
                    )}
                    
                    {!selectedMessage.isRead && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        NOWA
                      </span>
                    )}
                    
                    {selectedMessage.actionNeeded && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                        WYMAGA DZIAŁANIA
                      </span>
                    )}
                    
                    {selectedMessage.taskId && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        PRZETWORZONA
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Treść wiadomości</h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>

                {/* Associated Task */}
                {selectedMessage.task && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Powiązane zadanie</h4>
                    <p className="text-green-700">📋 {selectedMessage.task.title}</p>
                    <button
                      onClick={() => window.location.href = `/dashboard/tasks/${selectedMessage.taskId}`}
                      className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Zobacz zadanie →
                    </button>
                  </div>
                )}

                {/* AI Analysis Report */}
                <MessageAnalysisReport 
                  messageId={selectedMessage.id}
                  onAnalysisUpdate={(analysis) => {
                    // Update the message with analysis results if needed
                    console.log('Analysis updated:', analysis);
                  }}
                />

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    {!selectedMessage.isRead && (
                      <button
                        onClick={() => {
                          handleMarkAsRead(selectedMessage.id);
                          setSelectedMessage({ ...selectedMessage, isRead: true });
                        }}
                        className="btn btn-outline-primary"
                      >
                        Oznacz jako przeczytane
                      </button>
                    )}
                    
                    {selectedMessage.actionNeeded && !selectedMessage.taskId && (
                      <button
                        onClick={() => handleProcessMessage(selectedMessage.id)}
                        className="btn btn-primary"
                      >
                        Przetwórz wiadomość
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="btn btn-outline-secondary"
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}