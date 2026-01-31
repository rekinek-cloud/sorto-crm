'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  StopIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface FlowConversation {
  id: string;
  itemId: string;
  itemType: string;
  status: 'active' | 'completed' | 'cancelled';
  messages: ConversationMessage[];
  result?: {
    action: string;
    changes: Record<string, any>;
  };
  startedAt: string;
  completedAt?: string;
}

export default function FlowConversationPage() {
  const [conversations, setConversations] = useState<FlowConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<FlowConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/flow/conversation', { params: { limit: 50 } });
      setConversations(res.data?.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const res = await apiClient.get(`/flow/conversation/${conversationId}`);
      setActiveConversation(res.data?.conversation || null);
    } catch (error: any) {
      toast.error('Failed to load conversation');
    }
  };

  const startConversation = async () => {
    const itemId = prompt('Enter item ID to start conversation:');
    if (!itemId) return;

    try {
      const res = await apiClient.post(`/flow/conversation/start/${itemId}`);
      setActiveConversation(res.data?.conversation);
      toast.success('Conversation started');
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start conversation');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    setSending(true);
    const userMessage = message;
    setMessage('');

    // Optimistically add user message
    const tempMessage: ConversationMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setActiveConversation({
      ...activeConversation,
      messages: [...activeConversation.messages, tempMessage],
    });

    try {
      const res = await apiClient.post(`/flow/conversation/${activeConversation.id}/message`, {
        message: userMessage,
      });

      // Update with actual response
      loadConversation(activeConversation.id);
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
      // Revert optimistic update
      loadConversation(activeConversation.id);
    } finally {
      setSending(false);
    }
  };

  const executeAction = async (actionType: string) => {
    if (!activeConversation) return;

    try {
      const res = await apiClient.post(`/flow/conversation/${activeConversation.id}/execute`, {
        type: actionType,
        params: {},
      });
      toast.success('Action executed successfully');
      loadConversation(activeConversation.id);
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to execute action');
    }
  };

  const cancelConversation = async () => {
    if (!activeConversation || !confirm('Cancel this conversation?')) return;

    try {
      await apiClient.post(`/flow/conversation/${activeConversation.id}/cancel`);
      toast.success('Conversation cancelled');
      setActiveConversation(null);
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600" />
          Flow Conversations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Interactive AI-powered item processing
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold">Conversations</h2>
            <button
              onClick={startConversation}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{conv.itemType}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(conv.status)}`}>
                    {conv.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.itemId}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {conv.messages.length} messages • {new Date(conv.startedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No conversations yet</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{activeConversation.itemType}</h3>
                  <p className="text-xs text-gray-500">{activeConversation.itemId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activeConversation.status)}`}>
                    {activeConversation.status}
                  </span>
                  {activeConversation.status === 'active' && (
                    <button
                      onClick={cancelConversation}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <StopIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(s)}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {activeConversation.status === 'active' && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => executeAction('categorize')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      Categorize
                    </button>
                    <button
                      onClick={() => executeAction('schedule')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => executeAction('delegate')}
                      className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                    >
                      Delegate
                    </button>
                    <button
                      onClick={() => executeAction('break_down')}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                    >
                      Break Down
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              {activeConversation.status === 'active' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !message.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {sending ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <PaperAirplaneIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Result */}
              {activeConversation.result && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Action Completed</span>
                  </div>
                  <p className="text-sm text-green-600">{activeConversation.result.action}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
