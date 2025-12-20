'use client';

/**
 * Chat Widget - AI Agent Week 1 Implementation
 * Prosty interfejs do rozmowy z AI Agent
 */

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceInfo[];
  timestamp: Date;
  confidence?: number;
  intent?: any;
  messageId?: string;  // UUID from backend response
  conversationId?: string;  // UUID from backend response
}

interface SourceInfo {
  type: string;
  id: string;
  title: string;
  relevanceScore: number;
  preview: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do końca wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call RAG Service AI Agent API
      // Note: AI responses can take 15-30 seconds due to LLM processing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/rag-api/api/v1/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: input,
          userId: '306923ca-88ed-4417-a41d-c9b4ebfdef08', // Owner Demo - TODO: Get from auth context
          organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449', // Tech Solutions - TODO: Get from auth context
          userRole: 'OWNER',
          userStreamIds: [],
          conversationId: currentConversationId  // Include conversationId for follow-ups
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date(),
        confidence: data.confidence,
        intent: data.intent
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Agent query failed:', error);

      // Error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Przepraszam, wystąpił błąd: ${error instanceof Error ? error.message : 'Unknown error'}. Spróbuj ponownie.`,
        timestamp: new Date(),
        confidence: 0
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const submitFeedback = async (messageIndex: number, feedbackType: 'HELPFUL' | 'NOT_HELPFUL') => {
    const message = messages[messageIndex];

    try {
      await fetch('/rag-api/api/v1/agent/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_id: `msg-${messageIndex}`,
          feedback_type: feedbackType
        })
      });

      console.log(`Feedback submitted: ${feedbackType}`);
    } catch (error: any) {
      console.error('Feedback submission failed:', error);
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-50"
        title="Otwórz AI Agent"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  // Chat widget when open
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white shadow-2xl rounded-lg flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">🤖 AI Agent</h3>
          <p className="text-xs text-indigo-100">Asystent biznesowy</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded p-1 transition"
          title="Zamknij"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-6xl mb-4">👋</div>
            <p className="font-medium">Cześć! W czym mogę pomóc?</p>
            <p className="text-sm mt-2">Zapytaj mnie o cokolwiek z Twojego CRM</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setInput('Ile mamy active deals?')}
                className="block w-full text-left text-sm bg-white p-2 rounded border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                💼 Ile mamy active deals?
              </button>
              <button
                onClick={() => setInput('Co działo się z projektem TechCorp?')}
                className="block w-full text-left text-sm bg-white p-2 rounded border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                📊 Co działo się z projektem TechCorp?
              </button>
              <button
                onClick={() => setInput('Jakie mam zadania na dziś?')}
                className="block w-full text-left text-sm bg-white p-2 rounded border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                ✅ Jakie mam zadania na dziś?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-bold mb-2 text-gray-600">📚 Źródła:</p>
                  {msg.sources.map((source, sidx) => (
                    <div key={sidx} className="text-xs mt-1 bg-gray-50 p-2 rounded">
                      <div className="font-medium">{source.title}</div>
                      <div className="text-gray-500 mt-1">{source.preview}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Confidence & Intent */}
              {msg.confidence !== undefined && msg.role === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Pewność: {(msg.confidence * 100).toFixed(0)}%</span>
                    {msg.intent && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {msg.intent.intent_type}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback buttons */}
              {msg.role === 'assistant' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => submitFeedback(idx, 'HELPFUL')}
                    className="text-xs hover:bg-gray-100 px-2 py-1 rounded transition flex items-center gap-1"
                    title="Pomocne"
                  >
                    👍 Pomocne
                  </button>
                  <button
                    onClick={() => submitFeedback(idx, 'NOT_HELPFUL')}
                    className="text-xs hover:bg-gray-100 px-2 py-1 rounded transition flex items-center gap-1"
                    title="Niepomocne"
                  >
                    👎 Niepomocne
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="text-sm text-gray-500">
                  <div>Analizuję z AI...</div>
                  <div className="text-xs text-gray-400 mt-1">To może potrwać 15-30 sekund</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Zapytaj o cokolwiek..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
            disabled={isLoading}
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end"
            title="Wyślij wiadomość"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii
        </p>
      </div>
    </div>
  );
}
