'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  StarIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import aiChat, {
  Conversation,
  ConversationWithMessages,
  AIModel,
} from '@/lib/api/aiChat';

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
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nowa rozmowa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pinnedConversations.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-2 py-1">Przypięte</div>
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
              <div className="text-xs font-medium text-gray-500 px-2 py-1">Rozmowy</div>
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-medium text-gray-900">{currentConversation.title}</h2>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
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
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                    <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Napisz wiadomość..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Wybierz rozmowę lub utwórz nową</p>
            </div>
          </div>
        )}
      </div>
    </div>
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
        isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <ChatBubbleLeftRightIcon className="w-5 h-5 flex-shrink-0" />

      {isEditing ? (
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={onSaveTitle}
          onKeyDown={(e) => e.key === 'Enter' && onSaveTitle()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-0.5"
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
          className="p-1 hover:bg-gray-200 rounded"
        >
          {conversation.isPinned ? (
            <StarIconSolid className="w-4 h-4 text-yellow-500" />
          ) : (
            <StarIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNewTitle(conversation.title);
            setEditingTitle(conversation.id);
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <PencilIcon className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <ArchiveBoxIcon className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <TrashIcon className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
