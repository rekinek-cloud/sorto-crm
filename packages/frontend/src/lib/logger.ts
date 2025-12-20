type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  component?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  private log(level: LogLevel, message: string, data?: any, component?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId: this.userId || undefined,
      component
    };

    // In development, log to console with formatting
    if (this.isDev) {
      const prefix = `[${level.toUpperCase()}] ${entry.timestamp}`;
      const componentStr = component ? ` [${component}]` : '';
      
      switch (level) {
        case 'debug':
          console.log(`%c${prefix}${componentStr}`, 'color: #666', message, data);
          break;
        case 'info':
          console.info(`%c${prefix}${componentStr}`, 'color: #0066cc', message, data);
          break;
        case 'warn':
          console.warn(`%c${prefix}${componentStr}`, 'color: #ff9900', message, data);
          break;
        case 'error':
          console.error(`%c${prefix}${componentStr}`, 'color: #cc0000', message, data);
          break;
      }
    }

    // In production, send to external logging service (if configured)
    if (!this.isDev && level !== 'debug') {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // TODO: Implement external logging service integration
    // For now, we'll just store critical errors
    if (entry.level === 'error') {
      try {
        // Could send to service like Sentry, LogRocket, etc.
        // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
      } catch (e) {
        // Fallback to console if logging service fails
        console.error('Failed to send log to service:', e);
      }
    }
  }

  debug(message: string, data?: any, component?: string) {
    this.log('debug', message, data, component);
  }

  info(message: string, data?: any, component?: string) {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string) {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: any, component?: string) {
    this.log('error', message, data, component);
  }

  // Convenience methods for common use cases
  apiError(endpoint: string, error: any, component?: string) {
    this.error(`API Error: ${endpoint}`, { error, endpoint }, component);
  }

  userAction(action: string, data?: any, component?: string) {
    this.info(`User Action: ${action}`, data, component);
  }

  performance(operation: string, duration: number, component?: string) {
    this.debug(`Performance: ${operation}`, { duration: `${duration}ms` }, component);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };
export type { LogLevel, LogEntry };