'use client';

import React from 'react';
import { ErrorBoundary as BaseErrorBoundary } from '@/lib/errorTracker';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug
} from 'lucide-react';

interface ComponentErrorFallbackProps {
  error: Error;
  resetError: () => void;
  componentName?: string;
}

function ComponentErrorFallback({ error, resetError, componentName = 'Component' }: ComponentErrorFallbackProps) {
  return (
    <motion.div
      className="min-h-96 flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center max-w-md">
        <motion.div
          className="mx-auto h-6 w-6 text-red-500 mb-4"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AlertTriangle />
        </motion.div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {componentName} Error
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm">
          Something went wrong while loading this component. The error has been reported automatically.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border overflow-auto">
              {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/'}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ComponentType<ComponentErrorFallbackProps>;
}

export default function ComponentErrorBoundary({ 
  children, 
  componentName,
  fallback: CustomFallback 
}: ComponentErrorBoundaryProps) {
  const FallbackComponent = CustomFallback || ComponentErrorFallback;
  
  return (
    <BaseErrorBoundary
      fallback={({ error, resetError }: any) => (
        <FallbackComponent 
          error={error} 
          resetError={resetError} 
          componentName={componentName}
        />
      )}
    >
      {children}
    </BaseErrorBoundary>
  );
}