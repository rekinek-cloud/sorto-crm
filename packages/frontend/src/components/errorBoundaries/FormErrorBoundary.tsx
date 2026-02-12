'use client';

import React from 'react';
import { ErrorBoundary as BaseErrorBoundary } from '@/lib/errorTracker';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';

interface FormErrorFallbackProps {
  error: Error;
  resetError: () => void;
  formName?: string;
}

function FormErrorFallback({ error, resetError, formName = 'Form' }: FormErrorFallbackProps) {
  return (
    <motion.div
      className="bg-red-50 border border-red-200 rounded-lg p-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {formName} Error
          </h3>
          <p className="mt-1 text-sm text-red-700">
            There was an error with the form. Please try refreshing or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="mt-4">
            <button
              onClick={resetError}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-800 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Form
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  formName?: string;
  fallback?: React.ComponentType<FormErrorFallbackProps>;
}

export default function FormErrorBoundary({ 
  children, 
  formName,
  fallback: CustomFallback 
}: FormErrorBoundaryProps) {
  const FallbackComponent = CustomFallback || FormErrorFallback;
  
  return (
    <BaseErrorBoundary
      fallback={({ error, resetError }: any) => (
        <FallbackComponent 
          error={error} 
          resetError={resetError} 
          formName={formName}
        />
      )}
    >
      {children}
    </BaseErrorBoundary>
  );
}