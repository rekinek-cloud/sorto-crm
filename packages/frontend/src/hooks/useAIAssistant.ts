'use client';

/**
 * Hook useAIAssistant - Human-in-the-Loop
 * Zgodny ze spec.md sekcja 7
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AIContext,
  SuggestionStatus,
  SourceItemSuggestion,
  DayPlanSuggestion,
  WeeklyReviewSuggestion,
  UserAIPatterns,
  AISuggestion,
  AnalyzeResponse,
  analyze,
  submitFeedback,
  analyzeSourceItem,
  analyzeSourceItemById,
  optimizeDay,
  getWeeklyReview,
  getUserPatterns,
  updateSettings,
  getSuggestions
} from '@/lib/api/aiAssistant';

interface UseAIAssistantOptions {
  autoLoadPatterns?: boolean;
  autoLoadSuggestions?: boolean;
}

interface UseAIAssistantReturn {
  // State
  patterns: UserAIPatterns | null;
  suggestions: AISuggestion[];
  pendingSuggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;

  // Pattern actions
  loadPatterns: () => Promise<void>;
  updateAutonomyLevel: (level: 0 | 1 | 2 | 3) => Promise<void>;
  updateEnabledContexts: (contexts: AIContext[]) => Promise<void>;

  // Suggestion actions
  loadSuggestions: (params?: { status?: SuggestionStatus; context?: AIContext; limit?: number }) => Promise<void>;
  acceptSuggestion: (suggestionId: string, modifications?: any) => Promise<void>;
  rejectSuggestion: (suggestionId: string) => Promise<void>;

  // Analysis actions
  analyzeContent: (context: AIContext, data: any) => Promise<AnalyzeResponse | null>;
  analyzeInboxItem: (content: string, source?: string) => Promise<SourceItemSuggestion | null>;
  analyzeInboxItemById: (itemId: string) => Promise<SourceItemSuggestion | null>;
  getDayPlan: (date?: string) => Promise<DayPlanSuggestion | null>;
  getWeekReview: () => Promise<WeeklyReviewSuggestion | null>;

  // Utility
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export function useAIAssistant(options: UseAIAssistantOptions = {}): UseAIAssistantReturn {
  const { autoLoadPatterns = true, autoLoadSuggestions = false } = options;

  const [patterns, setPatterns] = useState<UserAIPatterns | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed: pending suggestions only
  const pendingSuggestions = suggestions.filter(s => s.status === 'PENDING');

  // Load user patterns
  const loadPatterns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUserPatterns();
      if (response.success) {
        setPatterns(response.data);
      }
    } catch (err) {
      console.error('Failed to load AI patterns:', err);
      setError('Nie udało się załadować wzorców AI');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load suggestions
  const loadSuggestions = useCallback(async (params?: { status?: SuggestionStatus; context?: AIContext; limit?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSuggestions(params);
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setError('Nie udało się załadować sugestii');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update autonomy level
  const updateAutonomyLevel = useCallback(async (level: 0 | 1 | 2 | 3) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await updateSettings({ autonomyLevel: level });
      if (response.success) {
        await loadPatterns();
      }
    } catch (err) {
      console.error('Failed to update autonomy level:', err);
      setError('Nie udało się zaktualizować poziomu autonomii');
    } finally {
      setIsLoading(false);
    }
  }, [loadPatterns]);

  // Update enabled contexts
  const updateEnabledContexts = useCallback(async (contexts: AIContext[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await updateSettings({ enabledContexts: contexts });
      if (response.success) {
        await loadPatterns();
      }
    } catch (err) {
      console.error('Failed to update enabled contexts:', err);
      setError('Nie udało się zaktualizować kontekstów');
    } finally {
      setIsLoading(false);
    }
  }, [loadPatterns]);

  // Accept suggestion
  const acceptSuggestion = useCallback(async (suggestionId: string, modifications?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await submitFeedback(suggestionId, true, modifications);
      // Update local state
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestionId
            ? { ...s, status: modifications ? 'MODIFIED' : 'ACCEPTED', userModifications: modifications }
            : s
        )
      );
      // Reload patterns to update statistics
      await loadPatterns();
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
      setError('Nie udało się zaakceptować sugestii');
    } finally {
      setIsLoading(false);
    }
  }, [loadPatterns]);

  // Reject suggestion
  const rejectSuggestion = useCallback(async (suggestionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await submitFeedback(suggestionId, false);
      // Update local state
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestionId
            ? { ...s, status: 'REJECTED' as SuggestionStatus }
            : s
        )
      );
      // Reload patterns to update statistics
      await loadPatterns();
    } catch (err) {
      console.error('Failed to reject suggestion:', err);
      setError('Nie udało się odrzucić sugestii');
    } finally {
      setIsLoading(false);
    }
  }, [loadPatterns]);

  // Analyze content (generic)
  const analyzeContent = useCallback(async (context: AIContext, data: any): Promise<AnalyzeResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyze(context, data);
      return response;
    } catch (err) {
      console.error('Failed to analyze content:', err);
      setError('Nie udało się przeanalizować zawartości');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Analyze inbox item by content
  const analyzeInboxItem = useCallback(async (content: string, source?: string): Promise<SourceItemSuggestion | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyzeSourceItem(content, source);
      if (response.success) {
        return response.suggestion;
      }
      return null;
    } catch (err) {
      console.error('Failed to analyze inbox item:', err);
      setError('Nie udało się przeanalizować elementu');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Analyze inbox item by ID
  const analyzeInboxItemById = useCallback(async (itemId: string): Promise<SourceItemSuggestion | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyzeSourceItemById(itemId);
      if (response.success) {
        return response.suggestion;
      }
      return null;
    } catch (err) {
      console.error('Failed to analyze inbox item by ID:', err);
      setError('Nie udało się przeanalizować elementu');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get day plan suggestion
  const getDayPlan = useCallback(async (date?: string): Promise<DayPlanSuggestion | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await optimizeDay(date);
      if (response.success) {
        return response.suggestion;
      }
      return null;
    } catch (err) {
      console.error('Failed to get day plan:', err);
      setError('Nie udało się wygenerować planu dnia');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get weekly review
  const getWeekReview = useCallback(async (): Promise<WeeklyReviewSuggestion | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getWeeklyReview();
      if (response.success) {
        return response.suggestion;
      }
      return null;
    } catch (err) {
      console.error('Failed to get weekly review:', err);
      setError('Nie udało się wygenerować przeglądu tygodniowego');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadPatterns(),
      loadSuggestions()
    ]);
  }, [loadPatterns, loadSuggestions]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoadPatterns) {
      loadPatterns();
    }
    if (autoLoadSuggestions) {
      loadSuggestions();
    }
  }, [autoLoadPatterns, autoLoadSuggestions, loadPatterns, loadSuggestions]);

  return {
    // State
    patterns,
    suggestions,
    pendingSuggestions,
    isLoading,
    error,

    // Pattern actions
    loadPatterns,
    updateAutonomyLevel,
    updateEnabledContexts,

    // Suggestion actions
    loadSuggestions,
    acceptSuggestion,
    rejectSuggestion,

    // Analysis actions
    analyzeContent,
    analyzeInboxItem,
    analyzeInboxItemById,
    getDayPlan,
    getWeekReview,

    // Utility
    clearError,
    refreshAll
  };
}

export default useAIAssistant;
