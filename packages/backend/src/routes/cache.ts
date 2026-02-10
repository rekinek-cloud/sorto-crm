import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { CacheService } from '../services/CacheService';
import { prisma } from '../config/database';
import logger from '../config/logger';

const router = Router();
const cacheService = new CacheService(prisma);

// Validation schemas
const setSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.any(),
  options: z.object({
    ttl: z.number().min(1).max(86400 * 7).optional(), // Max 1 week
    namespace: z.string().optional().default('default'),
    tags: z.array(z.string()).optional().default([]),
    compressionThreshold: z.number().min(100).optional()
  }).optional().default({})
});

const getSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  namespace: z.string().optional().default('default')
});

const clearSchema = z.object({
  namespace: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pattern: z.string().optional()
});

const warmSchema = z.object({
  namespace: z.string().min(1, 'Namespace is required'),
  entries: z.array(z.object({
    key: z.string().min(1),
    value: z.any(),
    options: z.object({
      ttl: z.number().optional(),
      tags: z.array(z.string()).optional()
    }).optional()
  })).min(1, 'At least one entry is required')
});

// Apply authentication middleware
router.use(authenticateUser);

/**
 * GET /api/v1/cache/stats
 * Get cache statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

/**
 * GET /api/v1/cache/:key
 * Get value from cache
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { namespace } = getSchema.parse({ key, ...req.query });

    const value = await cacheService.get(key, namespace);

    if (value === null) {
      return res.status(404).json({
        success: false,
        error: 'Cache entry not found'
      });
    }

    res.json({
      success: true,
      data: {
        key,
        namespace,
        value
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      });
    }

    logger.error('Cache get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache value'
    });
  }
});

/**
 * POST /api/v1/cache
 * Set value in cache
 */
router.post('/', async (req, res) => {
  try {
    const { key, value, options } = setSchema.parse(req.body);

    await cacheService.set(key, value, options);

    res.status(201).json({
      success: true,
      message: 'Cache entry created successfully',
      data: {
        key,
        namespace: options.namespace,
        ttl: options.ttl
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Cache set error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set cache value'
    });
  }
});

/**
 * PUT /api/v1/cache/:key
 * Update value in cache
 */
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, options } = req.body;

    // Check if key exists
    const existing = await cacheService.get(key, options?.namespace || 'default');
    if (existing === null) {
      return res.status(404).json({
        success: false,
        error: 'Cache entry not found'
      });
    }

    await cacheService.set(key, value, options || {});

    res.json({
      success: true,
      message: 'Cache entry updated successfully'
    });

  } catch (error) {
    logger.error('Cache update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cache value'
    });
  }
});

/**
 * DELETE /api/v1/cache/:key
 * Delete value from cache
 */
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { namespace = 'default' } = req.query;

    await cacheService.delete(key, namespace as string);

    res.json({
      success: true,
      message: 'Cache entry deleted successfully'
    });

  } catch (error) {
    logger.error('Cache delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cache value'
    });
  }
});

/**
 * POST /api/v1/cache/clear
 * Clear cache entries
 */
router.post('/clear', async (req, res) => {
  try {
    const { namespace, tags, pattern } = clearSchema.parse(req.body);
    let deletedCount = 0;

    if (namespace) {
      deletedCount = await cacheService.clearNamespace(namespace);
    } else if (tags && tags.length > 0) {
      deletedCount = await cacheService.clearByTags(tags);
    } else if (pattern) {
      deletedCount = await cacheService.invalidatePattern(pattern);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Must specify namespace, tags, or pattern'
      });
    }

    res.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries`,
      data: { deletedCount }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * POST /api/v1/cache/warm
 * Warm cache with predefined data
 */
router.post('/warm', async (req, res) => {
  try {
    const { namespace, entries } = warmSchema.parse(req.body);

    const warmingFunctions = entries.map(entry => ({
      key: entry.key,
      fn: async () => entry.value,
      options: entry.options || {}
    }));

    await cacheService.warmCache(namespace, warmingFunctions);

    res.json({
      success: true,
      message: `Cache warming completed for namespace: ${namespace}`,
      data: {
        namespace,
        entriesWarmed: entries.length
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Cache warm error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to warm cache'
    });
  }
});

/**
 * POST /api/v1/cache/warm-system
 * Warm cache with system data (development/admin)
 */
router.post('/warm-system', async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    logger.info(`Starting system cache warming for organization: ${organizationId}`);

    // Define system cache warming functions
    const systemWarmingFunctions = [
      {
        key: 'user_settings',
        fn: async () => {
          const users = await prisma.user.findMany({
            where: { organizationId },
            select: { id: true, settings: true, role: true }
          });
          return users;
        },
        options: { ttl: 3600, tags: ['users', 'settings'] }
      },
      {
        key: 'organization_config',
        fn: async () => {
          const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { settings: true, limits: true }
          });
          return org;
        },
        options: { ttl: 7200, tags: ['organization', 'config'] }
      },
      {
        key: 'active_projects_summary',
        fn: async () => {
          const projects = await prisma.project.findMany({
            where: { 
              organizationId,
              status: { in: ['PLANNING', 'IN_PROGRESS'] }
            },
            select: {
              id: true,
              name: true,
              status: true,
              endDate: true,
              _count: { select: { tasks: true } }
            }
          });
          return projects;
        },
        options: { ttl: 1800, tags: ['projects', 'dashboard'] }
      },
      {
        key: 'task_statistics',
        fn: async () => {
          const stats = await prisma.task.groupBy({
            by: ['status', 'priority'],
            where: { organizationId },
            _count: { id: true }
          });
          return stats;
        },
        options: { ttl: 600, tags: ['tasks', 'statistics'] }
      },
      {
        key: 'recent_communications',
        fn: async () => {
          const messages = await prisma.message.findMany({
            where: { 
              organizationId,
              receivedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            select: {
              id: true,
              subject: true,
              receivedAt: true,
              urgencyScore: true
            },
            orderBy: { receivedAt: 'desc' },
            take: 50
          });
          return messages;
        },
        options: { ttl: 300, tags: ['communications', 'recent'] }
      }
    ];

    await cacheService.warmCache('system', systemWarmingFunctions);

    res.json({
      success: true,
      message: 'System cache warming completed',
      data: {
        namespace: 'system',
        entriesWarmed: systemWarmingFunctions.length,
        organizationId
      }
    });

  } catch (error) {
    logger.error('System cache warm error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to warm system cache'
    });
  }
});

/**
 * GET /api/v1/cache/health
 * Get cache health status
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    
    const health = {
      status: stats.hitRate > 70 ? 'healthy' : stats.hitRate > 40 ? 'warning' : 'critical',
      hitRate: stats.hitRate,
      totalEntries: stats.totalEntries,
      totalSize: stats.totalSize,
      expiredEntries: stats.expiredEntries,
      recommendations: []
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (stats.hitRate < 50) {
      recommendations.push('Low hit rate detected. Consider reviewing cache keys and TTL values.');
    }
    
    if (stats.expiredEntries > stats.totalEntries * 0.1) {
      recommendations.push('High number of expired entries. Consider increasing cleanup frequency.');
    }
    
    if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Cache size is large. Consider implementing compression or reducing TTL.');
    }

    health.recommendations = recommendations;

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Cache health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check cache health'
    });
  }
});

/**
 * POST /api/v1/cache/test
 * Test cache performance (development only)
 */
router.post('/test', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Cache test endpoint not available in production'
      });
    }

    const testData = { message: 'This is test data', timestamp: new Date().toISOString() };
    const testKey = 'test_performance';
    const namespace = 'test';

    // Test set performance
    const setStart = Date.now();
    await cacheService.set(testKey, testData, { namespace, ttl: 300 });
    const setTime = Date.now() - setStart;

    // Test get performance
    const getStart = Date.now();
    const retrieved = await cacheService.get(testKey, namespace);
    const getTime = Date.now() - getStart;

    // Test cache hit
    const hitStart = Date.now();
    const hitTest = await cacheService.get(testKey, namespace);
    const hitTime = Date.now() - hitStart;

    // Cleanup
    await cacheService.delete(testKey, namespace);

    res.json({
      success: true,
      data: {
        performance: {
          setTime: `${setTime}ms`,
          getTime: `${getTime}ms`,
          hitTime: `${hitTime}ms`
        },
        dataIntegrity: {
          original: testData,
          retrieved,
          matches: JSON.stringify(testData) === JSON.stringify(retrieved)
        }
      }
    });

  } catch (error) {
    logger.error('Cache test error:', error);
    res.status(500).json({
      success: false,
      error: 'Cache test failed'
    });
  }
});

export { cacheService };
export default router;