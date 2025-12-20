'use client';

import { useEffect } from 'react';

export function DisableErrorOverlay() {
  useEffect(() => {
    // Disable Next.js error overlay in browser
    if (typeof window !== 'undefined') {
      // Override the error overlay
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        // Block requests to Next.js stack frame endpoints
        if (typeof input === 'string' && input.includes('__nextjs_original-stack-frames')) {
          console.log('Blocked Next.js stack frame request');
          return Promise.reject(new Error('Stack frame requests disabled'));
        }
        return originalFetch.call(this, input, init);
      };

      // Also try to disable the error overlay
      if (window.__NEXT_DATA__) {
        window.__NEXT_DATA__.runtimeConfig = window.__NEXT_DATA__.runtimeConfig || {};
      }
    }
  }, []);

  return null;
}