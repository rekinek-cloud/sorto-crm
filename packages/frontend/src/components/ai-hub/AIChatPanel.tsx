'use client';

/**
 * AIChatPanel - Main conversational AI interface
 * Renders messages with visualizations, sources, and quick actions
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Send,
  Sparkles,
  User,
  Bot,
  BarChart3,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Clock,
  Zap,
  FileText
} from 'lucide-react';
import { ChatMessage, QuickAction, Source, Visualization } from '@/lib/api/aiHub';
import ChatVisualization from './ChatVisualization';
import ChatQuickActions from './ChatQuickActions';

interface AIChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onSendMessage: (query: string) => Promise<void>;
  onClearConversation: () => void;
  onExecuteAction: (action: QuickAction) => Promise<{ success: boolean; message?: string }>;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  className?: string;
}

const suggestedQuestions = [
  'Pokaż moje zaległe zadania',
  'Jaki jest stan pipeline dealów?',
  'Kto wymaga kontaktu?',
  'Podsumuj dzisiejszy dzień'
];

export function AIChatPanel({
  messages,
  isLoading,
  isStreaming,
  error,
  onSendMessage,
  onClearConversation,
  onExecuteAction,
  onFeedback,
  className = ''
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    await onSendMessage(query);
  };

  const handleSuggestedQuestion = async (question: string) => {
    if (isLoading) return;
    await onSendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-gray-500">STREAMS Intelligence</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearConversation}
          className="text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Nowa rozmowa
        </Button>
      </div>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onExecuteAction={onExecuteAction}
            onFeedback={onFeedback}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-600">
                  {isStreaming ? 'Analizuję...' : 'Przetwarzam...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Suggested questions (only show at start) */}
        {messages.length === 1 && !isLoading && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Sugerowane pytania:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zapytaj o cokolwiek..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-full px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

// ============= MESSAGE BUBBLE COMPONENT =============

interface MessageBubbleProps {
  message: ChatMessage;
  onExecuteAction: (action: QuickAction) => Promise<{ success: boolean; message?: string }>;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
}

function MessageBubble({ message, onExecuteAction, onFeedback }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gray-200'
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-gray-600" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Visualizations */}
        {message.visualizations && message.visualizations.length > 0 && (
          <div className="mt-3 space-y-3">
            {message.visualizations.map((viz, i) => (
              <ChatVisualization key={i} visualization={viz} />
            ))}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <SourcesList sources={message.sources} />
          </div>
        )}

        {/* Quick Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3">
            <ChatQuickActions actions={message.actions} onExecute={onExecuteAction} />
          </div>
        )}

        {/* Metadata & Feedback (only for assistant) */}
        {!isUser && (
          <div className="flex items-center gap-3 mt-2">
            {/* Processing time */}
            {message.processingTime && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {message.processingTime.toFixed(2)}s
              </span>
            )}

            {/* Confidence */}
            {message.confidence && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {Math.round(message.confidence * 100)}%
              </span>
            )}

            {/* Feedback buttons */}
            {onFeedback && message.id !== 'welcome' && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => onFeedback(message.id, true)}
                  className="p-1 hover:bg-green-100 rounded text-gray-400 hover:text-green-600 transition-colors"
                  title="Pomocna odpowiedź"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onFeedback(message.id, false)}
                  className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                  title="Niepomocna odpowiedź"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= SOURCES LIST COMPONENT =============

interface SourcesListProps {
  sources: Source[];
}

function SourcesList({ sources }: SourcesListProps) {
  const [expanded, setExpanded] = useState(false);
  const displaySources = expanded ? sources : sources.slice(0, 3);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '✅';
      case 'deal':
        return '💰';
      case 'contact':
        return '👤';
      case 'company':
        return '🏢';
      case 'message':
        return '📧';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-600">
          Źródła ({sources.length})
        </span>
      </div>
      <div className="space-y-2">
        {displaySources.map((source, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            <span>{getSourceIcon(source.sourceType)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{source.title}</div>
              {source.content && (
                <div className="text-gray-500 truncate">{source.content}</div>
              )}
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {Math.round(source.score * 100)}%
            </Badge>
          </div>
        ))}
      </div>
      {sources.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
        >
          {expanded ? 'Pokaż mniej' : `Pokaż więcej (${sources.length - 3})`}
        </button>
      )}
    </div>
  );
}

export default AIChatPanel;
