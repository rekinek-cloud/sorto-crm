import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { prisma } from '../config/database';
import logger from '../config/logger';

const router = Router();
const performanceMonitor = new PerformanceMonitor(prisma);

// Validation schemas
const reportSchema = z.object({
  period: z.enum(['hour', 'day', 'week']).optional().default('day')
});

const metricSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  context: z.any().optional()
});

const dashboardSchema = z.object({
  hours: z.number().min(1).max(168).optional().default(1) // max 1 week
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * GET /api/v1/performance/health
 * Get current system health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = performanceMonitor.getSystemHealth();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Failed to get system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health'
    });
  }
});

/**
 * GET /api/v1/performance/dashboard
 * Get performance metrics for dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { hours } = dashboardSchema.parse(req.query);

    const metrics = performanceMonitor.getMetricsForDashboard(hours);

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    logger.error('Failed to get dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard metrics'
    });
  }
});

/**
 * POST /api/v1/performance/report
 * Generate performance report
 */
router.post('/report', async (req, res) => {
  try {
    const { period } = reportSchema.parse(req.body);

    const report = await performanceMonitor.generateReport(period);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Failed to generate performance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance report'
    });
  }
});

/**
 * POST /api/v1/performance/metrics
 * Record a custom performance metric
 */
router.post('/metrics', async (req, res) => {
  try {
    const { name, value, unit, context } = metricSchema.parse(req.body);

    performanceMonitor.recordMetric(name, value, unit, context);

    res.status(201).json({
      success: true,
      message: 'Metric recorded successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid metric data',
        details: error.errors
      });
    }

    logger.error('Failed to record metric:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record metric'
    });
  }
});

/**
 * GET /api/v1/performance/alerts
 * Get current performance alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const health = performanceMonitor.getSystemHealth();

    res.json({
      success: true,
      data: {
        alerts: health.alerts,
        summary: {
          total: health.alerts.length,
          critical: health.alerts.filter(a => a.level === 'critical').length,
          warnings: health.alerts.filter(a => a.level === 'warning').length,
          info: health.alerts.filter(a => a.level === 'info').length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

/**
 * GET /api/v1/performance/stats
 * Get quick performance statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const health = performanceMonitor.getSystemHealth();
    const dashboardMetrics = performanceMonitor.getMetricsForDashboard(1);

    res.json({
      success: true,
      data: {
        status: health.status,
        score: health.score,
        alerts: health.alerts.length,
        performance: dashboardMetrics.performance,
        counts: dashboardMetrics.counts,
        cache: dashboardMetrics.cacheStats
      }
    });

  } catch (error) {
    logger.error('Failed to get performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance stats'
    });
  }
});

/**
 * POST /api/v1/performance/test-load
 * Test endpoint to generate load for monitoring (development only)
 */
router.post('/test-load', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test load endpoint not available in production'
      });
    }

    const iterations = Math.floor(Math.random() * 10) + 5; // 5-15 iterations
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      const responseTime = Date.now() - startTime;
      const success = Math.random() > 0.1; // 90% success rate
      
      // Record metrics
      performanceMonitor.trackApiCall(
        '/api/v1/performance/test-load',
        'POST',
        responseTime,
        success ? 200 : 500
      );

      // Simulate database query
      const dbStartTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
      const dbTime = Date.now() - dbStartTime;
      
      performanceMonitor.trackDatabaseQuery('SELECT * FROM test_table', dbTime, Math.random() > 0.05);

      // Simulate vector search
      if (Math.random() > 0.7) {
        const vectorStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        const vectorTime = Date.now() - vectorStartTime;
        
        performanceMonitor.trackVectorSearch(
          'test query',
          Math.floor(Math.random() * 10) + 1,
          vectorTime,
          Math.random() > 0.3
        );
      }

      results.push({
        iteration: i + 1,
        responseTime,
        success,
        dbTime
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Load test completed',
        iterations,
        results: results.slice(0, 5) // Return first 5 results
      }
    });

  } catch (error) {
    logger.error('Load test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Load test failed'
    });
  }
});

// Performance monitoring middleware to track all API calls
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    performanceMonitor.trackApiCall(endpoint, method, responseTime, statusCode);
  });
  
  next();
};

export { performanceMonitor };
export default router;