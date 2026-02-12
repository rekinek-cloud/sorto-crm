'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiSuggestionsApi, AISuggestion } from '@/lib/api/aiSuggestionsApi';

export function useAiSuggestions(initialType?: string) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await aiSuggestionsApi.getSuggestions({
        status: 'PENDING',
        type: initialType,
        limit: 20,
      });
      setSuggestions(data);
    } catch {
      // Suggestions are optional
    } finally {
      setIsLoading(false);
    }
  }, [initialType]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const accept = useCallback(async (id: string) => {
    await aiSuggestionsApi.acceptSuggestion(id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  const reject = useCallback(async (id: string, note?: string) => {
    await aiSuggestionsApi.rejectSuggestion(id, note);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  return { suggestions, isLoading, loadSuggestions, accept, reject };
}
