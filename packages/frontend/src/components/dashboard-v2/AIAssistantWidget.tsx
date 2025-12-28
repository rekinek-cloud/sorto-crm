/**
 * AIAssistantWidget - Compact AI chat interface
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { ChatMessage } from '@/lib/api/dashboardApi';

interface AIAssistantWidgetProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (query: string) => Promise<void>;
  onClear: () => void;
}

// Suggested questions
const SUGGESTED_QUESTIONS = [
  'Pokaż moje zadania na dziś',
  'Jakie mam otwarte deale?',
  'Podsumuj tydzień',
  'Co powinienem zrobić teraz?'
];

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
          isUser
            ? 'bg-purple-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        {/* Simple markdown-like rendering */}
        <div className="whitespace-pre-wrap break-words">
          {message.content.split('\n').map((line, i) => {
            // Bold text
            const boldProcessed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            // Bullet points
            if (line.startsWith('• ') || line.startsWith('- ')) {
              return (
                <div key={i} className="flex gap-1.5">
                  <span>•</span>
                  <span dangerouslySetInnerHTML={{ __html: boldProcessed.slice(2) }} />
                </div>
              );
            }
            return (
              <div key={i}>
                <span dangerouslySetInnerHTML={{ __html: boldProcessed }} />
              </div>
            );
          })}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200/50 text-xs text-gray-500">
            <div className="flex items-center gap-1 mb-1">
              <span>📚</span>
              <span>Źródła:</span>
            </div>
            {message.sources.slice(0, 2).map((source, i) => (
              <div key={i} className="truncate">
                {source.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AIAssistantWidget({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClear
}: AIAssistantWidgetProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 1) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    setShowSuggestions(false);
    await onSendMessage(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (question: string) => {
    if (isLoading) return;
    setShowSuggestions(false);
    await onSendMessage(question);
  };

  // Show only last few messages in compact view
  const visibleMessages = messages.slice(-4);

  return (
    <BentoCard
      title="AI Assistant"
      icon="🤖"
      size="lg"
      variant="default"
    >
      <div className="flex flex-col h-full min-h-[200px]">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto mb-3 max-h-[180px] scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {visibleMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(question)}
                  className="px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors truncate max-w-[140px]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-2 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zapytaj o cokolwiek..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Clear button */}
        {messages.length > 1 && (
          <button
            onClick={onClear}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 self-center"
          >
            Wyczyść rozmowę
          </button>
        )}
      </div>
    </BentoCard>
  );
}

export default AIAssistantWidget;
