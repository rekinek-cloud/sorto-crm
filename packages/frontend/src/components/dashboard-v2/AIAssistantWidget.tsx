'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { ChatMessage } from '@/lib/api/dashboardApi';
import { useTranslations } from 'next-intl';

interface AIAssistantWidgetProps {
  messages: ChatMessage[];
  loading?: boolean;
  onSendMessage: (query: string) => void;
  onClear: () => void;
}

export function AIAssistantWidget({
  messages,
  loading = false,
  onSendMessage,
  onClear,
}: AIAssistantWidgetProps) {
  const t = useTranslations('dashboard.aiAssistant');
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What tasks do I have today?",
    "Show my streams",
    "What deals are open?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleSuggestion = (question: string) => {
    if (!loading) {
      onSendMessage(question);
    }
  };

  return (
    <BentoCard
      title={t('title')}
      subtitle="STREAMS RAG"
      icon={Bot}
      iconColor="text-cyan-600"
      variant="neon"
      headerAction={
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Clear chat"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      }
    >
      <div className="flex flex-col h-[280px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
          <AnimatePresence>
            {messages.slice(-5).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={"max-w-[85%] rounded-xl px-3 py-2 text-sm " + (
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  <div className="whitespace-pre-wrap text-xs leading-relaxed">
                    {msg.content.length > 200 ? msg.content.slice(0, 200) + "..." : msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500">Sources: {msg.sources.length}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(q)}
                className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </BentoCard>
  );
}

export default AIAssistantWidget;
