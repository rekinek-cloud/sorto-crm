'use client';

import { useState, useEffect, useCallback } from 'react';
import { dayDashboardApi, ManagerDashboardData } from '@/lib/api/dayDashboardApi';

export function useManagerDashboard(enabled: boolean) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      const result = await dayDashboardApi.getManagerDashboard();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load manager dashboard:', err);
      setError(err.message || 'Blad ladowania danych managera');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
