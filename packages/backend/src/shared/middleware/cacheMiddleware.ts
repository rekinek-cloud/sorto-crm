import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../../services/CacheService';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '../../config/logger';

const prisma = new PrismaClient();
const cacheService = new CacheService(prisma);

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  skipCache?: (req: Request) => boolean;
}

/**
 * Redis cache middleware for API responses
 */
export function apiCache(config: CacheConfig = {}) {
  const {
    ttl = 300, // 5 minutes default
    namespace = 'api',
    keyGenerator,
    condition,
    skipCache
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if condition is not met
    if (condition && !condition(req)) {
      return next();
    }

    // Skip cache if explicitly requested
    if (skipCache && skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : generateDefaultCacheKey(req);

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey, namespace);
      
      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, {
            ttl,
            namespace,
            tags: [req.route?.path || req.path]
          }).catch(error => {
            logger.error('Cache set error:', error);
          });
        }

        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(config: {
  namespace?: string;
  pattern?: string;
  tags?: string[];
  condition?: (req: Request) => boolean;
}) {
  const { namespace = 'api', pattern, tags, condition } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if condition is not met
    if (condition && !condition(req)) {
      return next();
    }

    // Override res.json to invalidate cache after response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Invalidate cache for successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (pattern) {
          cacheService.invalidatePattern(pattern, namespace).catch(error => {
            logger.error('Cache invalidation error:', error);
          });
        }

        if (tags && tags.length > 0) {
          cacheService.clearByTags(tags).catch(error => {
            logger.error('Cache tag invalidation error:', error);
          });
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Specific cache configurations for different endpoints
 */
export const cacheConfigs = {
  // Fast cache for static data
  static: {
    ttl: 3600, // 1 hour
    namespace: 'static'
  },

  // Medium cache for semi-dynamic data
  semiDynamic: {
    ttl: 300, // 5 minutes
    namespace: 'semi-dynamic'
  },

  // Short cache for dynamic data
  dynamic: {
    ttl: 60, // 1 minute
    namespace: 'dynamic'
  },

  // User-specific cache
  userSpecific: {
    ttl: 300, // 5 minutes
    namespace: 'user',
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `${req.path}_${userId}_${generateQueryHash(req)}`;
    }
  },

  // Organization-specific cache
  orgSpecific: {
    ttl: 600, // 10 minutes
    namespace: 'organization',
    keyGenerator: (req: Request) => {
      const orgId = req.user?.organizationId || 'no-org';
      return `${req.path}_${orgId}_${generateQueryHash(req)}`;
    }
  }
};

/**
 * Helper functions
 */
function generateDefaultCacheKey(req: Request): string {
  const baseKey = req.path;
  const queryHash = generateQueryHash(req);
  const userContext = req.user?.id || 'anonymous';
  
  return `${baseKey}_${userContext}_${queryHash}`;
}

function generateQueryHash(req: Request): string {
  const queryString = JSON.stringify(req.query, Object.keys(req.query).sort());
  return crypto.createHash('md5').update(queryString).digest('hex').substring(0, 8);
}

/**
 * Cache warming functions for frequently accessed data
 */
export async function warmFrequentlyUsedCaches(organizationId: string) {
  try {
    logger.info(`Starting cache warming for organization: ${organizationId}`);

    const warmingFunctions = [
      {
        key: `dashboard_stats_${organizationId}`,
        fn: async () => {
          // Simulate dashboard stats fetch
          return { totalTasks: 100, completedTasks: 75, activeProjects: 5 };
        },
        options: { ttl: 300 }
      },
      {
        key: `user_permissions_${organizationId}`,
        fn: async () => {
          // Simulate permissions fetch
          return { canCreate: true, canEdit: true, canDelete: false };
        },
        options: { ttl: 600 }
      }
    ];

    await cacheService.warmCache('organization', warmingFunctions);
    logger.info(`Cache warming completed for organization: ${organizationId}`);

  } catch (error) {
    logger.error('Cache warming failed:', error);
  }
}

/**
 * Cache statistics endpoint data
 */
export async function getCacheStatistics() {
  try {
    return await cacheService.getStats();
  } catch (error) {
    logger.error('Failed to get cache statistics:', error);
    throw error;
  }
}

export { cacheService };