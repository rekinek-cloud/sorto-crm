'use client';

import { useState, useEffect, useCallback } from 'react';
import { emailDomainRulesApi, type EmailDomainRule, type DomainRulesStats, type CreateDomainRuleRequest, type BulkDomainRuleRequest } from '@/lib/api/emailDomainRulesApi';

export function useDomainRules(listType: string = 'BLACKLIST') {
  const [rules, setRules] = useState<EmailDomainRule[]>([]);
  const [stats, setStats] = useState<DomainRulesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesData, statsData] = await Promise.all([
        emailDomainRulesApi.getRules({ listType, search: search || undefined }),
        emailDomainRulesApi.getStats(),
      ]);
      setRules(rulesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load domain rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, [listType, search]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const addRule = useCallback(async (data: CreateDomainRuleRequest) => {
    const rule = await emailDomainRulesApi.createRule(data);
    await loadRules();
    return rule;
  }, [loadRules]);

  const removeRule = useCallback(async (id: string) => {
    await emailDomainRulesApi.deleteRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const bulkAction = useCallback(async (action: 'ADD' | 'REMOVE', patterns: string[], lt: BulkDomainRuleRequest['listType']) => {
    await emailDomainRulesApi.bulkOperation({ action, patterns, listType: lt });
    await loadRules();
  }, [loadRules]);

  return { rules, stats, isLoading, search, setSearch, loadRules, addRule, removeRule, bulkAction };
}
