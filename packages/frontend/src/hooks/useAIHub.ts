/**
 * useAIHub Hook
 * Central state management for Conversational AI Hub Dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  aiHubApi,
  ChatMessage,
  AIInsight,
  SmartSuggestion,
  QuickStats,
  SearchResult,
  QuickAction,
  QueryResponse
} from '@/lib/api/aiHub';

interface UseAIHubReturn {
  // Chat State
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;

  // Chat Actions
  sendMessage: (query: string) => Promise<void>;
  clearConversation: () => void;
  executeAction: (action: QuickAction) => Promise<{ success: boolean; message?: string }>;

  // Insights State
  insights: AIInsight[];
  insightsLoading: boolean;

  // Insights Actions
  refreshInsights: () => Promise<void>;
  dismissInsight: (id: string) => void;

  // Suggestions State
  suggestions: SmartSuggestion[];
  suggestionsLoading: boolean;

  // Suggestions Actions
  acceptSuggestion: (suggestion: SmartSuggestion) => Promise<void>;
  dismissSuggestion: (suggestion: SmartSuggestion) => Promise<void>;

  // Quick Stats
  stats: QuickStats | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;

  // Search
  searchResults: SearchResult[];
  searchLoading: boolean;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Witaj w AI Hub! 🤖

Jestem Twoim asystentem STREAMS. Mogę pomóc z:
• 📊 Analiza danych CRM (deale, kontakty, firmy)
• ✅ Zarządzanie zadaniami i projektami
• 🌊 Przegląd strumieni GTD
• 📈 Raporty i statystyki
• 🔍 Wyszukiwanie informacji

**Zapytaj o cokolwiek** - odpowiem na podstawie Twoich danych.`,
  timestamp: new Date()
};

export function useAIHub(): UseAIHubReturn {
  const { user, organization } = useAuth();

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insights State
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Search State
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Refs for avoiding stale closures
  const userRef = useRef(user);
  const orgRef = useRef(organization);
  userRef.current = user;
  orgRef.current = organization;

  // ============= INITIAL LOAD =============

  useEffect(() => {
    if (organization?.id) {
      loadInsights();
      loadSuggestions();
      loadStats();
    }
  }, [organization?.id]);

  // Periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!organization?.id) return;

    const interval = setInterval(() => {
      loadInsights();
      loadSuggestions();
      loadStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [organization?.id]);

  // ============= CHAT FUNCTIONS =============

  const sendMessage = useCallback(async (query: string) => {
    if (!userRef.current?.id || !orgRef.current?.id) {
      setError('Nie jesteś zalogowany');
      return;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      const response: QueryResponse = await aiHubApi.sendQuery({
        query: trimmedQuery,
        userId: userRef.current.id,
        organizationId: orgRef.current.id,
        userRole: userRef.current.role || 'MEMBER',
        conversationId
      });

      // Update conversation ID
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Create assistant message with safe defaults
      const routing = response.routing || {};
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'Brak odpowiedzi',
        timestamp: new Date(),
        sources: response.sources,
        visualizations: response.visualizations,
        actions: response.suggestedActions,
        intent: routing.intent ? {
          type: routing.intent,
          confidence: routing.confidence || 0,
          keywords: routing.keywords || [],
          sourceTypes: routing.sourceTypes || []
        } : undefined,
        processingTime: response.processingTime,
        confidence: routing.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Wystąpił błąd podczas przetwarzania zapytania');

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [conversationId]);

  const clearConversation = useCallback(() => {
    if (conversationId) {
      aiHubApi.clearConversation(conversationId);
    }
    setMessages([WELCOME_MESSAGE]);
    setConversationId(null);
    setError(null);
  }, [conversationId]);

  const executeAction = useCallback(async (action: QuickAction) => {
    return aiHubApi.executeAction(action);
  }, []);

  // ============= INSIGHTS FUNCTIONS =============

  const loadInsights = useCallback(async () => {
    if (!orgRef.current?.id) return;

    setInsightsLoading(true);
    try {
      const data = await aiHubApi.getInsights({
        organizationId: orgRef.current.id,
        days: 7
      });
      setInsights(data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const refreshInsights = useCallback(async () => {
    await loadInsights();
  }, [loadInsights]);

  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  }, []);

  // ============= SUGGESTIONS FUNCTIONS =============

  const loadSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const data = await aiHubApi.getSuggestions({ limit: 5 });
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const acceptSuggestion = useCallback(async (suggestion: SmartSuggestion) => {
    const result = await aiHubApi.acceptSuggestion(suggestion);
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  }, []);

  const dismissSuggestion = useCallback(async (suggestion: SmartSuggestion) => {
    const result = await aiHubApi.dismissSuggestion(suggestion);
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  }, []);

  // ============= STATS FUNCTIONS =============

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await aiHubApi.getQuickStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // ============= SEARCH FUNCTIONS =============

  const search = useCallback(async (query: string) => {
    if (!userRef.current?.id || !orgRef.current?.id) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await aiHubApi.searchNaturalLanguage({
        query: trimmedQuery,
        userId: userRef.current.id,
        organizationId: orgRef.current.id,
        limit: 10
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  // ============= RETURN =============

  return {
    // Chat
    messages,
    conversationId,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearConversation,
    executeAction,

    // Insights
    insights,
    insightsLoading,
    refreshInsights,
    dismissInsight,

    // Suggestions
    suggestions,
    suggestionsLoading,
    acceptSuggestion,
    dismissSuggestion,

    // Stats
    stats,
    statsLoading,
    refreshStats,

    // Search
    searchResults,
    searchLoading,
    search,
    clearSearch
  };
}

export default useAIHub;
