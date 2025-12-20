'use client';

import React, { useState } from 'react';
import { ErrorBoundary as BaseErrorBoundary } from '@/lib/errorTracker';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  CloudIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

interface AsyncErrorFallbackProps {
  error: Error;
  resetError: () => void;
  operationName?: string;
}

function AsyncErrorFallback({ error, resetError, operationName = 'Operation' }: AsyncErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    setIsRetrying(true);
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    resetError();
    setIsRetrying(false);
  };

  const isNetworkError = error.message.toLowerCase().includes('network') || 
                        error.message.toLowerCase().includes('fetch') ||
                        error.message.toLowerCase().includes('connection');

  return (
    <motion.div
      className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isNetworkError ? (
            <WifiIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <CloudIcon className="h-5 w-5 text-yellow-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {operationName} Failed
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            {isNetworkError 
              ? 'There seems to be a connection issue. Please check your internet connection and try again.'
              : 'The operation could not be completed. This might be a temporary issue.'
            }
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-yellow-600 hover:text-yellow-800">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div className="mt-4 flex items-center space-x-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
            
            {isNetworkError && (
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                Refresh Page
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  operationName?: string;
  fallback?: React.ComponentType<AsyncErrorFallbackProps>;
}

export default function AsyncErrorBoundary({ 
  children, 
  operationName,
  fallback: CustomFallback 
}: AsyncErrorBoundaryProps) {
  const FallbackComponent = CustomFallback || AsyncErrorFallback;
  
  return (
    <BaseErrorBoundary
      fallback={({ error, resetError }: any) => (
        <FallbackComponent
          error={error}
          resetError={resetError}
          operationName={operationName}
        />
      )}
    >
      {children}
    </BaseErrorBoundary>
  );
}