'use client';

import { useEffect } from 'react';
import { errorTracker } from '@/lib/errorTracker';

export function ErrorTrackerInit() {
  useEffect(() => {
    // Initialize error tracker with user context if available
    const initErrorTracker = () => {
      try {
        // Try to get user info from localStorage or context
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          if (user.id && user.organizationId) {
            errorTracker.setUser(user.id, user.organizationId);
          }
        }
      } catch (error: any) {
        console.warn('Could not initialize error tracker with user context:', error);
      }
    };

    initErrorTracker();

    // Performance monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
          
          if (loadTime > 3000) { // Log slow page loads
            errorTracker.logPerformance('page_load', loadTime, {
              url: window.location.href,
              type: 'navigation'
            });
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (error: any) {
      // Ignore if performance observer is not supported
    }

    return () => {
      try {
        observer.disconnect();
      } catch (error: any) {
        // Ignore cleanup errors
      }
    };
  }, []);

  return null; // This component doesn't render anything
}