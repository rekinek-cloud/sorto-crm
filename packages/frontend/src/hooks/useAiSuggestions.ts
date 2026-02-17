'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiSuggestionsApi, AISuggestion } from '@/lib/api/aiSuggestionsApi';

export function useAiSuggestions(initialType?: string) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSuggestions = useCallback(async (status?: string) => {
    setIsLoading(true);
    try {
      const data = await aiSuggestionsApi.getSuggestions({
        status: status || 'PENDING',
        type: initialType,
        limit: 50,
      });
      setSuggestions(data);
    } catch {
      // Suggestions are optional
    } finally {
      setIsLoading(false);
    }
  }, [initialType]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const accept = useCallback(async (id: string, modifications?: Record<string, any>) => {
    const result = await aiSuggestionsApi.acceptSuggestion(id, modifications);
    setSuggestions(prev => prev.filter(s => s.id !== id));
    return result;
  }, []);

  const reject = useCallback(async (id: string, data?: {
    note?: string;
    correctClassification?: string;
    correctAction?: string;
    feedback?: string;
  }) => {
    await aiSuggestionsApi.rejectSuggestion(id, data);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  const edit = useCallback(async (id: string, data: {
    suggestion?: Record<string, any>;
    reasoning?: string;
    confidence?: number;
  }) => {
    const updated = await aiSuggestionsApi.editSuggestion(id, data);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    return updated;
  }, []);

  return { suggestions, isLoading, loadSuggestions, accept, reject, edit };
}
