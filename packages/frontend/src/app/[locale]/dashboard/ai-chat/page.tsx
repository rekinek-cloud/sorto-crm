'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Archive,
  Star,
  X,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import aiChat, {
  Conversation,
  ConversationWithMessages,
  AIModel,
} from '@/lib/api/aiChat';
import { PageShell } from '@/components/ui/PageShell';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('qwen-max-2025-01-25');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
    loadModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingContent]);

  const loadConversations = async () => {
    try {
      const data = await aiChat.listConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadModels = async () => {
    try {
      const data = await aiChat.getModels();
      setModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadConversation = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await aiChat.getConversation(id);
      setCurrentConversation(data);
      setSelectedModel(data.model);
    } catch (error) {
      toast.error('Nie udało się załadować rozmowy');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const conv = await aiChat.createConversation({
        title: 'Nowa rozmowa',
        model: selectedModel,
      });
      setConversations([conv, ...conversations]);
      await loadConversation(conv.id);
      inputRef.current?.focus();
    } catch (error) {
      toast.error('Nie udało się utworzyć rozmowy');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversation || isSending) return;

    const content = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingContent('');

    // Add user message optimistically
    const userMessage = {
      id: 'temp-user',
      role: 'user' as const,
      content,
      tokens: 0,
      createdAt: new Date().toISOString(),
    };

    setCurrentConversation({
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
    });

    try {
      const cancel = aiChat.streamMessage(
        currentConversation.id,
        content,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        async () => {
          setIsSending(false);
          setStreamingContent('');
          await loadConversation(currentConversation.id);
        },
        (error) => {
          setIsSending(false);
          setStreamingContent('');
          toast.error('Błąd podczas generowania odpowiedzi');
          console.error(error);
        }
      );
    } catch (error) {
      setIsSending(false);
      toast.error('Nie udało się wysłać wiadomości');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePin = async (conv: Conversation) => {
    try {
      await aiChat.updateConversation(conv.id, { isPinned: !conv.isPinned });
      loadConversations();
    } catch (error) {
      toast.error('Nie udało się zaktualizować');
    }
  };

  const archiveConversation = async (conv: Conversation) => {
    try {
      await aiChat.updateConversation(conv.id, { isArchived: true });
      loadConversations();
      if (currentConversation?.id === conv.id) {
        setCurrentConversation(null);
      }
      toast.success('Rozmowa zarchiwizowana');
    } catch (error) {
      toast.error('Nie udało się zarchiwizować');
    }
  };

  const deleteConversation = async (conv: Conversation) => {
    if (!confirm('Czy na pewno chcesz usunąć tę rozmowę?')) return;
    try {
      await aiChat.deleteConversation(conv.id);
      loadConversations();
      if (currentConversation?.id === conv.id) {
        setCurrentConversation(null);
      }
      toast.success('Rozmowa usunięta');
    } catch (error) {
      toast.error('Nie udało się usunąć');
    }
  };

  const saveTitle = async (conv: Conversation) => {
    if (!newTitle.trim()) {
      setEditingTitle(null);
      return;
    }
    try {
      await aiChat.updateConversation(conv.id, { title: newTitle.trim() });
      loadConversations();
      setEditingTitle(null);
    } catch (error) {
      toast.error('Nie udało się zapisać tytułu');
    }
  };

  const pinnedConversations = conversations.filter((c) => c.isPinned);
  const regularConversations = conversations.filter((c) => !c.isPinned);

  return (
    <PageShell noPadding>
      <div className="flex h-[calc(100vh-120px)] bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden m-6">
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nowa rozmowa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {pinnedConversations.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1">Przypięte</div>
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={currentConversation?.id === conv.id}
                    onClick={() => loadConversation(conv.id)}
                    onPin={() => togglePin(conv)}
                    onArchive={() => archiveConversation(conv)}
                    onDelete={() => deleteConversation(conv)}
                    editingTitle={editingTitle}
                    setEditingTitle={setEditingTitle}
                    newTitle={newTitle}
                    setNewTitle={setNewTitle}
                    onSaveTitle={() => saveTitle(conv)}
                  />
                ))}
              </div>
            )}

            <div className="p-2">
              {pinnedConversations.length > 0 && (
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1">Rozmowy</div>
              )}
              {regularConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversation?.id === conv.id}
                  onClick={() => loadConversation(conv.id)}
                  onPin={() => togglePin(conv)}
                  onArchive={() => archiveConversation(conv)}
                  onDelete={() => deleteConversation(conv)}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  newTitle={newTitle}
                  setNewTitle={setNewTitle}
                  onSaveTitle={() => saveTitle(conv)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-medium text-slate-900 dark:text-slate-100">{currentConversation.title}</h2>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-xl px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      <p className="whitespace-pre-wrap">{streamingContent}</p>
                      <span className="inline-block w-2 h-4 bg-slate-400 dark:bg-slate-500 animate-pulse ml-1" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Napisz wiadomość..."
                    rows={1}
                    className="flex-1 resize-none border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p>Wybierz rozmowę lub utwórz nową</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onPin,
  onArchive,
  onDelete,
  editingTitle,
  setEditingTitle,
  newTitle,
  setNewTitle,
  onSaveTitle,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  editingTitle: string | null;
  setEditingTitle: (id: string | null) => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  onSaveTitle: () => void;
}) {
  const isEditing = editingTitle === conversation.id;

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
      onClick={onClick}
    >
      <MessageSquare className="w-5 h-5 flex-shrink-0" />

      {isEditing ? (
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={onSaveTitle}
          onKeyDown={(e) => e.key === 'Enter' && onSaveTitle()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-slate-900 dark:text-slate-100"
          autoFocus
        />
      ) : (
        <span className="flex-1 truncate text-sm">{conversation.title}</span>
      )}

      <div className="hidden group-hover:flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
        >
          {conversation.isPinned ? (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <Star className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNewTitle(conversation.title);
            setEditingTitle(conversation.id);
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
        >
          <Pencil className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
        >
          <Archive className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
