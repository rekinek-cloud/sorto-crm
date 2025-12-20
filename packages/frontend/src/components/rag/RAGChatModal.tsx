'use client';

import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, PaperPlaneTilt, SpinnerGap, Trash } from 'phosphor-react';

const RAG_CHAT_STORAGE_KEY = 'rag_chat_history';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    url?: string;
    type: string;
  }>;
}

interface StoredMessage extends Omit<Message, 'timestamp'> {
  timestamp: string;
}

interface RAGChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to save messages to localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  try {
    const storedMessages: StoredMessage[] = messages.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString()
    }));
    localStorage.setItem(RAG_CHAT_STORAGE_KEY, JSON.stringify(storedMessages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

// Helper function to load messages from localStorage
const loadMessagesFromStorage = (): Message[] => {
  try {
    const stored = localStorage.getItem(RAG_CHAT_STORAGE_KEY);
    if (!stored) return [];

    const storedMessages: StoredMessage[] = JSON.parse(stored);
    return storedMessages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
};

export default function RAGChatModal({ isOpen, onClose }: RAGChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (!isInitialized) {
      const storedMessages = loadMessagesFromStorage();
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages, isInitialized]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Welcome message only if no history
  useEffect(() => {
    if (isOpen && isInitialized && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Cześć! Jestem asystentem RAG. Mogę przeszukać Twoje dokumenty, emaile i dane z CRM. O co chcesz zapytać?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, isInitialized, messages.length]);

  // Function to clear chat history
  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(RAG_CHAT_STORAGE_KEY);
    // Add welcome message after clearing
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Cześć! Jestem asystentem RAG. Mogę przeszukać Twoje dokumenty, emaile i dane z CRM. O co chcesz zapytać?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call RAG API
      const response = await fetch('/rag/api/v1/search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449', // TODO: Get from auth context
          streamIds: [], // TODO: Get user's accessible streams
          limit: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('RAG API error');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Nie znalazłem odpowiedzi w dokumentach.',
        timestamp: new Date(),
        sources: data.sources?.map((s: any) => ({
          title: s.title || s.fileName || 'Dokument',
          url: s.url,
          type: s.sourceType || 'document',
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('RAG error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Upewnij się, że klucze API są skonfigurowane w /opt/rag-service/.env',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-primary-600 px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-white flex items-center">
                          <span className="mr-2">🤖</span>
                          RAG Search Assistant
                        </Dialog.Title>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="rounded-md text-primary-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white p-1"
                            onClick={clearHistory}
                            title="Wyczyść historię"
                          >
                            <Trash className="h-5 w-5" weight="bold" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md text-primary-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="sr-only">Zamknij</span>
                            <X className="h-6 w-6" weight="bold" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-primary-100">
                        Przeszukaj dokumenty, emaile i dane CRM
                        {messages.length > 1 && (
                          <span className="ml-2 text-primary-200">
                            ({messages.length - 1} wiadomości w historii)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === 'user'
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                              {/* Sources */}
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-3 space-y-2 border-t border-gray-300 pt-2">
                                  <p className="text-xs font-semibold text-gray-700">Źródła:</p>
                                  {message.sources.map((source, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start text-xs bg-white rounded p-2 border border-gray-200"
                                    >
                                      <span className="mr-2">
                                        {source.type === 'email' ? '📧' : '📄'}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        {source.url ? (
                                          <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:text-primary-800 hover:underline font-medium truncate block"
                                          >
                                            {source.title}
                                          </a>
                                        ) : (
                                          <span className="text-gray-700 font-medium truncate block">
                                            {source.title}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <p className="mt-1 text-xs opacity-60">
                                {message.timestamp.toLocaleTimeString('pl-PL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}

                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                              <div className="flex items-center space-x-2 text-gray-600">
                                <SpinnerGap className="h-4 w-4 animate-spin" weight="bold" />
                                <span className="text-sm">Szukam...</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                      <form onSubmit={handleSubmit} className="flex space-x-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Zadaj pytanie..."
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <PaperPlaneTilt className="h-5 w-5" weight="fill" />
                        </button>
                      </form>
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Enter - wyślij, Shift+Enter - nowa linia
                      </p>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
