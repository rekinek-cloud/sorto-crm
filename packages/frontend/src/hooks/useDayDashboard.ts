'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dayDashboardApi, DayDashboardData } from '@/lib/api/dayDashboardApi';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useDayDashboard() {
  const [data, setData] = useState<DayDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(prev => prev || !data); // only show loading on first load
      const result = await dayDashboardApi.getDayDashboard();
      setData(result);
      setError(null);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Failed to load day dashboard:', err);
      setError(err.message || 'Blad ladowania dashboardu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { data, isLoading, error, lastRefresh, refresh };
}
