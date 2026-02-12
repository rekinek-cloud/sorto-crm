'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
      toast.error('Nie udalo sie zaladowac konwersacji');
    }
  };

  const startConversation = async () => {
    const itemId = prompt('Podaj ID elementu do rozpoczecia konwersacji:');
    if (!itemId) return;

    try {
      const res = await apiClient.post(`/flow/conversation/start/${itemId}`);
      setActiveConversation(res.data?.conversation);
      toast.success('Konwersacja rozpoczeta');
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie rozpoczac konwersacji');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    setSending(true);
    const userMessage = message;
    setMessage('');

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

      loadConversation(activeConversation.id);
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie wyslac wiadomosci');
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
      toast.success('Akcja wykonana pomyslnie');
      loadConversation(activeConversation.id);
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie wykonac akcji');
    }
  };

  const cancelConversation = async () => {
    if (!activeConversation || !confirm('Anulowac te konwersacje?')) return;

    try {
      await apiClient.post(`/flow/conversation/${activeConversation.id}/cancel`);
      toast.success('Konwersacja anulowana');
      setActiveConversation(null);
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie anulowac');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Konwersacje Flow"
        subtitle="Interaktywne przetwarzanie elementow z AI"
        icon={MessageSquare}
        iconColor="text-indigo-600"
      />

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="col-span-1 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Konwersacje</h2>
            <button
              onClick={startConversation}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full p-4 text-left border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                  activeConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{conv.itemType}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(conv.status)}`}>
                    {conv.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.itemId}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {conv.messages.length} wiadomosci - {new Date(conv.startedAt).toLocaleDateString('pl-PL')}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">Brak konwersacji</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-2 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{activeConversation.itemType}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeConversation.itemId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activeConversation.status)}`}>
                    {activeConversation.status}
                  </span>
                  {activeConversation.status === 'active' && (
                    <button
                      onClick={cancelConversation}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Square className="w-5 h-5" />
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
                      className={`max-w-[80%] p-3 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('pl-PL')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Sugestie:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(s)}
                        className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {activeConversation.status === 'active' && (
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Szybkie akcje:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => executeAction('categorize')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      Kategoryzuj
                    </button>
                    <button
                      onClick={() => executeAction('schedule')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
                    >
                      Zaplanuj
                    </button>
                    <button
                      onClick={() => executeAction('delegate')}
                      className="px-3 py-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50"
                    >
                      Deleguj
                    </button>
                    <button
                      onClick={() => executeAction('break_down')}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
                    >
                      Rozloz na czesci
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              {activeConversation.status === 'active' && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Wpisz wiadomosc..."
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !message.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {sending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Result */}
              {activeConversation.result && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-400">Akcja wykonana</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">{activeConversation.result.action}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p>Wybierz konwersacje lub rozpocznij nowa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
