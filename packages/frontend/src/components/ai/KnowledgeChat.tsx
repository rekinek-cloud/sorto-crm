'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import {
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Clock,
  BarChart3,
  MessageSquare,
  Zap,
  Target,
  Settings
} from 'lucide-react';
import apiClient from '@/lib/api/client';

interface KnowledgeMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  insights?: Insight[];
  actions?: ActionItem[];
  visualizations?: ChartData[];
  executionTime?: number;
  confidence?: number;
}

interface Insight {
  type: 'warning' | 'opportunity' | 'trend' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

interface ActionItem {
  type: 'call' | 'email' | 'meeting' | 'task' | 'review';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  entityId?: string;
  entityType?: string;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'progress';
  title: string;
  data: any[];
  labels?: string[];
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface KnowledgeChatProps {
  initialQuestion?: string;
  context?: 'dashboard' | 'projects' | 'deals' | 'tasks' | 'general';
  className?: string;
}

const insightIcons = {
  warning: AlertTriangle,
  opportunity: TrendingUp,
  trend: BarChart3,
  recommendation: Lightbulb
};

const insightColors = {
  warning: 'text-red-600 bg-red-50 border-red-200',
  opportunity: 'text-green-600 bg-green-50 border-green-200',
  trend: 'text-blue-600 bg-blue-50 border-blue-200',
  recommendation: 'text-blue-600 bg-blue-50 border-blue-200'
};

const priorityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-gray-500 text-white'
};

const actionIcons = {
  call: MessageSquare,
  email: Send,
  meeting: Target,
  task: Zap,
  review: BarChart3
};

export function KnowledgeChat({ initialQuestion, context = 'general', className }: KnowledgeChatProps) {
  const [messages, setMessages] = useState<KnowledgeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loadingProviders, setLoadingProviders] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProviders();
    loadSuggestions();

    if (initialQuestion) {
      handleSendMessage(initialQuestion);
    } else {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: 'Witaj! Jestem Twoim asystentem AI w systemie STREAMS.\n\n🤖 Pamiętaj: AI sugeruje → Ty decydujesz → AI się uczy\n\nMogę pomóc z:\n• ⚪ Routing elementów ze Źródła\n• 🌊 Analiza strumieni i dopływów\n• ❄️ Sugestie zamrożenia/odmrożenia\n• 🎯 Cele Precyzyjne (RZUT)\n• 📅 Planowanie dnia\n\nZapytaj mnie o cokolwiek!',
        timestamp: new Date()
      }]);
    }
  }, [initialQuestion]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await apiClient.get('/admin/ai-config/providers');

      if (response.data.success) {
        const availableProviders = response.data.data.filter((p: AIProvider) => p.enabled === true);
        setProviders(availableProviders);
        if (availableProviders.length > 0 && !selectedProvider) {
          setSelectedProvider(availableProviders[0].id);
        }
      }
    } catch (error: any) {
      console.log('AI providers not available');
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await apiClient.post('/ai-knowledge/suggestions');
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions);
      }
    } catch (error: any) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSendMessage = async (question: string = input) => {
    if (!question.trim() || isLoading) return;

    const userMessage: KnowledgeMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai-knowledge/query', {
        question,
        context,
        providerId: selectedProvider
      });

      if (response.data.success) {
        const assistantMessage: KnowledgeMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.data.data.answer,
          timestamp: new Date(),
          data: response.data.data.data,
          insights: response.data.data.insights,
          actions: response.data.data.actions,
          visualizations: response.data.data.visualizations,
          executionTime: response.data.data.executionTime,
          confidence: response.data.data.confidence
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);

      const errorMessage: KnowledgeMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Przepraszam, wystąpił błąd podczas przetwarzania pytania. Spróbuj ponownie lub sformułuj pytanie inaczej.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderInsight = (insight: Insight, index: number) => {
    const Icon = insightIcons[insight.type];

    return (
      <div
        key={index}
        className={`p-3 rounded-lg border ${insightColors[insight.type]} mb-2`}
      >
        <div className="flex items-start gap-2">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <Badge className={`text-xs ${priorityColors[insight.priority]}`}>
                {insight.priority}
              </Badge>
            </div>
            <p className="text-sm opacity-90">{insight.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAction = (action: ActionItem, index: number) => {
    const Icon = actionIcons[action.type];

    return (
      <Button
        key={index}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 mr-2 mb-2"
      >
        <Icon className="h-4 w-4" />
        {action.title}
      </Button>
    );
  };

  const renderVisualization = (viz: ChartData, index: number) => {
    return (
      <div key={index} className="bg-gray-50 p-4 rounded-lg mb-2">
        <h4 className="font-medium mb-2">{viz.title}</h4>
        <div className="text-sm text-gray-600">
          {viz.type.toUpperCase()} Chart ({viz.data.length} data points)
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Asystent STREAMS
          <Badge variant="secondary" className="ml-auto">
            AI
          </Badge>
        </CardTitle>

        {/* Provider Selection */}
        <div className="flex items-center gap-2 pt-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">AI Provider:</span>
          {loadingProviders ? (
            <LoadingSpinner size="sm" />
          ) : (
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {providers.length === 0 ? (
                <option value="">Brak dostępnych providerów</option>
              ) : (
                providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.description || provider.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border shadow-sm'
                }`}
              >
                {/* Message Content */}
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>

                {/* Insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      Insights
                    </h4>
                    {message.insights.map(renderInsight)}
                  </div>
                )}

                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Rekomendowane akcje
                    </h4>
                    <div className="flex flex-wrap">
                      {message.actions.map(renderAction)}
                    </div>
                  </div>
                )}

                {/* Visualizations */}
                {message.visualizations && message.visualizations.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      Wizualizacje
                    </h4>
                    {message.visualizations.map(renderVisualization)}
                  </div>
                )}

                {/* Metadata */}
                {message.type === 'assistant' && (message.executionTime || message.confidence) && (
                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                    {message.executionTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {message.executionTime}ms
                      </span>
                    )}
                    {message.confidence && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {Math.round(message.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm rounded-lg p-3">
                <LoadingSpinner size="sm" text="Analizuję dane..." />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && suggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Sugerowane pytania:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(suggestion)}
                  className="text-left justify-start h-auto py-2 px-3"
                  disabled={isLoading}
                >
                  <div className="text-xs leading-relaxed">{suggestion}</div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Zapytaj o strumienie, Źródło, cele RZUT... (np. 'Co jest w Źródle?')"
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <Button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 h-auto bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions - STREAMS */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('Co jest w Źródle do przetworzenia?')}
            disabled={isLoading}
          >
            ⚪ Źródło
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('Które strumienie wymagają uwagi?')}
            disabled={isLoading}
          >
            🌊 Strumienie
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('Zasugeruj zamrożenie nieaktywnych strumieni')}
            disabled={isLoading}
          >
            ❄️ Zamrożone
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('Jak wygląda postęp moich celów RZUT?')}
            disabled={isLoading}
          >
            🎯 Cele RZUT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
