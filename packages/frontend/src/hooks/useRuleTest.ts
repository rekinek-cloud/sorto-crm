'use client';

import { useState, useCallback } from 'react';
import { aiRulesApi } from '@/lib/api/aiRules';

interface TestResult {
  ruleId: string;
  ruleName: string;
  testResult: {
    crmMatch?: any;
    listMatch?: any;
    patternMatch?: any;
    aiClassification?: string;
    aiConfidence?: number;
    aiExtraction?: any;
    finalClass?: string;
    finalConfidence?: number;
    addedToRag?: boolean;
    addedToFlow?: boolean;
    linkedEntities?: any;
  };
}

export function useRuleTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(async (ruleId: string, entityType: string, entityData: any) => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await aiRulesApi.testRule(ruleId, { entityType, entityData });
      setResult(response as any);
      return response;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Blad testowania';
      setError(msg);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isRunning, result, error, runTest, reset };
}
