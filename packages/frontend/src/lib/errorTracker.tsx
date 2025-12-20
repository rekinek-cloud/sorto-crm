import React from 'react';

interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  organizationId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  componentStack?: string;
}

class ErrorTracker {
  private sessionId: string;
  private userId?: string;
  private organizationId?: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowserInfo() {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server'
    };
  }

  private setupGlobalErrorHandlers() {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        ...this.getBrowserInfo(),
        url: event.filename || this.getBrowserInfo().url,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        severity: 'high',
        context: {
          line: event.lineno,
          column: event.colno,
          type: 'javascript'
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        ...this.getBrowserInfo(),
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        severity: 'high',
        context: {
          type: 'promise_rejection',
          reason: event.reason
        }
      });
    });
  }

  setUser(userId: string, organizationId: string) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  captureError(errorData: Partial<ErrorData>) {
    if (!this.isEnabled) return;

    const fullErrorData: ErrorData = {
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      organizationId: this.organizationId,
      sessionId: this.sessionId,
      severity: errorData.severity || 'medium',
      context: errorData.context,
      componentStack: errorData.componentStack,
      ...errorData
    };

    // Send to backend (non-blocking)
    this.sendToBackend(fullErrorData).catch(console.warn);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 Error Tracked');
      console.error('Message:', fullErrorData.message);
      console.error('Stack:', fullErrorData.stack);
      console.error('Context:', fullErrorData.context);
      console.groupEnd();
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: {
        ...context,
        type: 'exception',
        name: error.name
      }
    });
  }

  captureReactError(error: Error, errorInfo: { componentStack?: string | null }) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || '',
      severity: 'critical',
      context: {
        type: 'react_error',
        name: error.name
      }
    });
  }

  private async sendToBackend(errorData: ErrorData) {
    try {
      const response = await fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });

      if (!response.ok) {
        console.warn('Failed to send error to backend:', response.status);
      }
    } catch (err) {
      console.warn('Error tracker failed to send data:', err);
    }
  }

  // Manual error logging for specific cases
  logError(message: string, context?: Record<string, any>, severity?: ErrorData['severity']) {
    this.captureError({
      message,
      context,
      severity: severity || 'medium'
    });
  }

  // Performance monitoring
  logPerformance(name: string, duration: number, context?: Record<string, any>) {
    if (duration > 1000) { // Log slow operations
      this.captureError({
        message: `Slow operation: ${name} took ${duration}ms`,
        severity: 'low',
        context: {
          type: 'performance',
          operation: name,
          duration,
          ...context
        }
      });
    }
  }

  disable() {
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
  }
}

// Global instance
export const errorTracker = new ErrorTracker();

// React Error Boundary helper
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.captureReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-red-500 text-2xl">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900">Coś poszło nie tak</h1>
      </div>
      <p className="text-gray-600 mb-4">
        Wystąpił nieoczekiwany błąd. Informacja o problemie została automatycznie wysłana do zespołu technicznego.
      </p>
      <details className="text-sm text-gray-500 mb-4">
        <summary className="cursor-pointer">Szczegóły techniczne</summary>
        <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
      </details>
      <button 
        onClick={() => window.location.reload()} 
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Odśwież stronę
      </button>
    </div>
  </div>
);

export default errorTracker;