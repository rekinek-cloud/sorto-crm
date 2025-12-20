import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: any;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  metrics: {
    database: PerformanceMetric[];
    api: PerformanceMetric[];
    memory: PerformanceMetric[];
    vector: PerformanceMetric[];
  };
  alerts: Alert[];
}

export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface PerformanceReport {
  period: string;
  summary: {
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  };
  trends: {
    responseTime: Array<{ timestamp: Date; value: number }>;
    requestVolume: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
  };
  topQueries: Array<{
    query: string;
    count: number;
    avgTime: number;
    errorRate: number;
  }>;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly MAX_METRICS_PER_TYPE = 1000;
  private thresholds = {
    apiResponseTime: 1000, // ms
    databaseQueryTime: 500, // ms
    memoryUsage: 85, // %
    vectorSearchTime: 2000, // ms
    errorRate: 5 // %
  };

  constructor(private prisma: PrismaClient) {
    this.startPeriodicCleanup();
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, context?: any): void {
    const metric: PerformanceMetric = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only recent metrics
    if (metricArray.length > this.MAX_METRICS_PER_TYPE) {
      metricArray.splice(0, metricArray.length - this.MAX_METRICS_PER_TYPE);
    }

    // Log critical metrics
    if (this.isMetricCritical(name, value)) {
      logger.warn(`Critical performance metric: ${name} = ${value}${unit}`, { context });
    }
  }

  /**
   * API response time tracking
   */
  trackApiCall(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    this.recordMetric('api_response_time', responseTime, 'ms', {
      endpoint,
      method,
      statusCode,
      success: statusCode < 400
    });

    this.recordMetric('api_request_count', 1, 'count', {
      endpoint,
      method,
      statusCode
    });

    if (statusCode >= 400) {
      this.recordMetric('api_error_count', 1, 'count', {
        endpoint,
        method,
        statusCode
      });
    }
  }

  /**
   * Database query performance tracking
   */
  trackDatabaseQuery(query: string, duration: number, success: boolean): void {
    this.recordMetric('db_query_time', duration, 'ms', {
      query: this.sanitizeQuery(query),
      success
    });

    this.recordMetric('db_query_count', 1, 'count', {
      query: this.sanitizeQuery(query),
      success
    });

    if (!success) {
      this.recordMetric('db_error_count', 1, 'count', {
        query: this.sanitizeQuery(query)
      });
    }
  }

  /**
   * Vector search performance tracking
   */
  trackVectorSearch(query: string, resultCount: number, searchTime: number, fromCache: boolean): void {
    this.recordMetric('vector_search_time', searchTime, 'ms', {
      resultCount,
      fromCache,
      queryLength: query.length
    });

    this.recordMetric('vector_search_count', 1, 'count', {
      resultCount,
      fromCache
    });

    if (fromCache) {
      this.recordMetric('vector_cache_hit', 1, 'count');
    } else {
      this.recordMetric('vector_cache_miss', 1, 'count');
    }
  }

  /**
   * Memory usage tracking
   */
  trackMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    this.recordMetric('memory_usage_percent', memoryUsagePercent, '%', {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    });

    this.recordMetric('memory_heap_used', memUsage.heapUsed / 1024 / 1024, 'MB');
    this.recordMetric('memory_heap_total', memUsage.heapTotal / 1024 / 1024, 'MB');
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

    const recentMetrics = this.getRecentMetrics(last5Minutes);
    const alerts = this.generateAlerts(recentMetrics);
    
    const score = this.calculateHealthScore(recentMetrics, alerts);
    const status = this.determineHealthStatus(score, alerts);

    return {
      status,
      score,
      metrics: {
        database: recentMetrics.filter(m => m.name.startsWith('db_')),
        api: recentMetrics.filter(m => m.name.startsWith('api_')),
        memory: recentMetrics.filter(m => m.name.startsWith('memory_')),
        vector: recentMetrics.filter(m => m.name.startsWith('vector_'))
      },
      alerts
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(period: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceReport> {
    const now = new Date();
    let startTime: Date;

    switch (period) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const metrics = this.getMetricsInRange(startTime, now);
    
    // Calculate summary statistics
    const apiResponseTimes = metrics
      .filter(m => m.name === 'api_response_time')
      .map(m => m.value);
    
    const apiRequests = metrics
      .filter(m => m.name === 'api_request_count');
    
    const apiErrors = metrics
      .filter(m => m.name === 'api_error_count');

    const avgResponseTime = apiResponseTimes.length > 0 
      ? apiResponseTimes.reduce((sum, val) => sum + val, 0) / apiResponseTimes.length 
      : 0;

    const totalRequests = apiRequests.length;
    const totalErrors = apiErrors.length;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Generate trends
    const responseTimeTrend = this.generateTrend(metrics, 'api_response_time', startTime, now, period);
    const requestVolumeTrend = this.generateTrend(metrics, 'api_request_count', startTime, now, period);
    const errorRateTrend = this.generateErrorRateTrend(metrics, startTime, now, period);

    // Top queries
    const topQueries = this.getTopQueries(metrics);

    return {
      period,
      summary: {
        avgResponseTime,
        totalRequests,
        errorRate,
        uptime: this.calculateUptime(metrics, startTime)
      },
      trends: {
        responseTime: responseTimeTrend,
        requestVolume: requestVolumeTrend,
        errorRate: errorRateTrend
      },
      topQueries
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsForDashboard(hours: number = 1): any {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const metrics = this.getMetricsInRange(startTime, now);

    return {
      summary: {
        totalMetrics: metrics.length,
        timeRange: `${hours}h`,
        startTime: startTime.toISOString(),
        endTime: now.toISOString()
      },
      performance: {
        avgApiResponseTime: this.getAverageValue(metrics, 'api_response_time'),
        avgDbQueryTime: this.getAverageValue(metrics, 'db_query_time'),
        avgVectorSearchTime: this.getAverageValue(metrics, 'vector_search_time'),
        currentMemoryUsage: this.getLatestValue(metrics, 'memory_usage_percent')
      },
      counts: {
        apiRequests: this.getCount(metrics, 'api_request_count'),
        dbQueries: this.getCount(metrics, 'db_query_count'),
        vectorSearches: this.getCount(metrics, 'vector_search_count'),
        errors: this.getCount(metrics, 'api_error_count') + this.getCount(metrics, 'db_error_count')
      },
      cacheStats: {
        hits: this.getCount(metrics, 'vector_cache_hit'),
        misses: this.getCount(metrics, 'vector_cache_miss'),
        hitRate: this.calculateCacheHitRate(metrics)
      }
    };
  }

  /**
   * Private helper methods
   */

  private isMetricCritical(name: string, value: number): boolean {
    switch (name) {
      case 'api_response_time':
        return value > this.thresholds.apiResponseTime;
      case 'db_query_time':
        return value > this.thresholds.databaseQueryTime;
      case 'memory_usage_percent':
        return value > this.thresholds.memoryUsage;
      case 'vector_search_time':
        return value > this.thresholds.vectorSearchTime;
      default:
        return false;
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data from query logging
    return query
      .replace(/VALUES\s*\([^)]*\)/gi, 'VALUES (...)')
      .replace(/'\w+'|"\w+"/g, "'***'")
      .substring(0, 200);
  }

  private getRecentMetrics(since: Date): PerformanceMetric[] {
    const recent: PerformanceMetric[] = [];
    
    for (const [, metricArray] of this.metrics) {
      for (const metric of metricArray) {
        if (metric.timestamp >= since) {
          recent.push(metric);
        }
      }
    }
    
    return recent.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private getMetricsInRange(start: Date, end: Date): PerformanceMetric[] {
    const inRange: PerformanceMetric[] = [];
    
    for (const [, metricArray] of this.metrics) {
      for (const metric of metricArray) {
        if (metric.timestamp >= start && metric.timestamp <= end) {
          inRange.push(metric);
        }
      }
    }
    
    return inRange.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private generateAlerts(metrics: PerformanceMetric[]): Alert[] {
    const alerts: Alert[] = [];
    
    // Check API response time
    const apiTimes = metrics.filter(m => m.name === 'api_response_time').map(m => m.value);
    if (apiTimes.length > 0) {
      const avgApiTime = apiTimes.reduce((sum, val) => sum + val, 0) / apiTimes.length;
      if (avgApiTime > this.thresholds.apiResponseTime) {
        alerts.push({
          level: avgApiTime > this.thresholds.apiResponseTime * 2 ? 'critical' : 'warning',
          message: 'High API response time detected',
          metric: 'api_response_time',
          value: avgApiTime,
          threshold: this.thresholds.apiResponseTime,
          timestamp: new Date()
        });
      }
    }

    // Check memory usage
    const memoryMetrics = metrics.filter(m => m.name === 'memory_usage_percent');
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1].value;
      if (latestMemory > this.thresholds.memoryUsage) {
        alerts.push({
          level: latestMemory > 95 ? 'critical' : 'warning',
          message: 'High memory usage detected',
          metric: 'memory_usage_percent',
          value: latestMemory,
          threshold: this.thresholds.memoryUsage,
          timestamp: new Date()
        });
      }
    }

    return alerts;
  }

  private calculateHealthScore(metrics: PerformanceMetric[], alerts: Alert[]): number {
    let score = 100;
    
    // Deduct points for alerts
    for (const alert of alerts) {
      switch (alert.level) {
        case 'critical':
          score -= 20;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  private determineHealthStatus(score: number, alerts: Alert[]): 'healthy' | 'warning' | 'critical' {
    const hasCriticalAlerts = alerts.some(a => a.level === 'critical');
    
    if (hasCriticalAlerts || score < 50) return 'critical';
    if (score < 80) return 'warning';
    return 'healthy';
  }

  private generateTrend(
    metrics: PerformanceMetric[], 
    metricName: string, 
    start: Date, 
    end: Date, 
    period: string
  ): Array<{ timestamp: Date; value: number }> {
    const relevantMetrics = metrics.filter(m => m.name === metricName);
    const intervalMs = this.getIntervalMs(period);
    const trend: Array<{ timestamp: Date; value: number }> = [];
    
    for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
      const intervalStart = new Date(time);
      const intervalEnd = new Date(time + intervalMs);
      
      const intervalMetrics = relevantMetrics.filter(m => 
        m.timestamp >= intervalStart && m.timestamp < intervalEnd
      );
      
      if (intervalMetrics.length > 0) {
        const avgValue = intervalMetrics.reduce((sum, m) => sum + m.value, 0) / intervalMetrics.length;
        trend.push({ timestamp: intervalStart, value: avgValue });
      }
    }
    
    return trend;
  }

  private generateErrorRateTrend(
    metrics: PerformanceMetric[], 
    start: Date, 
    end: Date, 
    period: string
  ): Array<{ timestamp: Date; value: number }> {
    const intervalMs = this.getIntervalMs(period);
    const trend: Array<{ timestamp: Date; value: number }> = [];
    
    for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
      const intervalStart = new Date(time);
      const intervalEnd = new Date(time + intervalMs);
      
      const requests = metrics.filter(m => 
        m.name === 'api_request_count' && 
        m.timestamp >= intervalStart && 
        m.timestamp < intervalEnd
      ).length;
      
      const errors = metrics.filter(m => 
        m.name === 'api_error_count' && 
        m.timestamp >= intervalStart && 
        m.timestamp < intervalEnd
      ).length;
      
      const errorRate = requests > 0 ? (errors / requests) * 100 : 0;
      trend.push({ timestamp: intervalStart, value: errorRate });
    }
    
    return trend;
  }

  private getTopQueries(metrics: PerformanceMetric[]): Array<{
    query: string;
    count: number;
    avgTime: number;
    errorRate: number;
  }> {
    const queryStats: Map<string, { count: number; totalTime: number; errors: number }> = new Map();
    
    // Process API calls
    metrics.filter(m => m.name === 'api_response_time').forEach(m => {
      if (m.context?.endpoint) {
        const key = `${m.context.method} ${m.context.endpoint}`;
        if (!queryStats.has(key)) {
          queryStats.set(key, { count: 0, totalTime: 0, errors: 0 });
        }
        const stats = queryStats.get(key)!;
        stats.count++;
        stats.totalTime += m.value;
        if (m.context.statusCode >= 400) {
          stats.errors++;
        }
      }
    });

    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
        errorRate: (stats.errors / stats.count) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getIntervalMs(period: string): number {
    switch (period) {
      case 'hour': return 5 * 60 * 1000; // 5 minute intervals
      case 'day': return 60 * 60 * 1000; // 1 hour intervals
      case 'week': return 24 * 60 * 60 * 1000; // 1 day intervals
      default: return 60 * 60 * 1000;
    }
  }

  private getAverageValue(metrics: PerformanceMetric[], name: string): number {
    const values = metrics.filter(m => m.name === name).map(m => m.value);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private getLatestValue(metrics: PerformanceMetric[], name: string): number {
    const relevantMetrics = metrics.filter(m => m.name === name);
    return relevantMetrics.length > 0 ? relevantMetrics[relevantMetrics.length - 1].value : 0;
  }

  private getCount(metrics: PerformanceMetric[], name: string): number {
    return metrics.filter(m => m.name === name).length;
  }

  private calculateUptime(metrics: PerformanceMetric[], startTime: Date): number {
    // Simplified uptime calculation based on successful API responses
    const apiMetrics = metrics.filter(m => m.name === 'api_response_time');
    if (apiMetrics.length === 0) return 100;
    
    const successfulCalls = apiMetrics.filter(m => 
      m.context?.statusCode && m.context.statusCode < 500
    ).length;
    
    return (successfulCalls / apiMetrics.length) * 100;
  }

  private calculateCacheHitRate(metrics: PerformanceMetric[]): number {
    const hits = this.getCount(metrics, 'vector_cache_hit');
    const misses = this.getCount(metrics, 'vector_cache_miss');
    const total = hits + misses;
    
    return total > 0 ? (hits / total) * 100 : 0;
  }

  private startPeriodicCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      for (const [name, metricArray] of this.metrics) {
        const filtered = metricArray.filter(m => m.timestamp > oneHourAgo);
        this.metrics.set(name, filtered);
      }
      
      logger.info('Cleaned up old performance metrics');
    }, 60 * 60 * 1000); // Every hour

    // Track memory usage every minute
    setInterval(() => {
      this.trackMemoryUsage();
    }, 60 * 1000); // Every minute
  }
}