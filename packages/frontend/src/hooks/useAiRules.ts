'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiRulesApi, AIRule, RulesFilters } from '@/lib/api/aiRules';

export function useAiRules(initialFilters: RulesFilters = {}) {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RulesFilters>(initialFilters);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });

  const loadRules = useCallback(async (f?: RulesFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiRulesApi.getRules(f || filters);
      setRules(result.rules);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || 'Blad ladowania regul');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const toggleRule = useCallback(async (id: string, enabled: boolean) => {
    await aiRulesApi.toggleRule(id, enabled);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    await aiRulesApi.deleteRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const createRule = useCallback(async (data: any) => {
    const rule = await aiRulesApi.createRule(data);
    setRules(prev => [rule, ...prev]);
    return rule;
  }, []);

  const updateRule = useCallback(async (id: string, data: any) => {
    const rule = await aiRulesApi.updateRule(id, data);
    setRules(prev => prev.map(r => r.id === id ? rule : r));
    return rule;
  }, []);

  return {
    rules, isLoading, error, pagination,
    filters, setFilters,
    loadRules, toggleRule, deleteRule, createRule, updateRule,
  };
}

export function useAiRule(id: string | null) {
  const [rule, setRule] = useState<AIRule | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    aiRulesApi.getRule(id)
      .then(setRule)
      .catch(() => setRule(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { rule, setRule, isLoading };
}
