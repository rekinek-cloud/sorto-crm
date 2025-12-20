import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '../config/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  tags?: string[];
  compressionThreshold?: number; // Compress if size > threshold (bytes)
}

export interface CacheEntry {
  key: string;
  value: any;
  namespace: string;
  tags: string[];
  size: number;
  compressed: boolean;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastHit: Date;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  avgHitCount: number;
  expiredEntries: number;
  compressionRatio: number;
  namespaceStats: Array<{
    namespace: string;
    entries: number;
    size: number;
    hitRate: number;
  }>;
}

export class CacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly MAX_MEMORY_CACHE_SIZE = 1000; // Max entries in memory
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB

  constructor(private prisma: PrismaClient) {
    this.startMaintenanceTasks();
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, namespace: string = 'default'): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, namespace);
      
      // Try memory cache first
      let entry = this.memoryCache.get(fullKey);
      
      if (!entry) {
        // Try database cache
        entry = await this.getFromDatabase(fullKey);
        if (entry) {
          // Store in memory cache
          this.setMemoryCache(fullKey, entry);
        }
      }

      if (!entry) {
        logger.debug(`Cache miss: ${fullKey}`);
        return null;
      }

      // Check expiration
      if (entry.expiresAt < new Date()) {
        await this.delete(key, namespace);
        logger.debug(`Cache expired: ${fullKey}`);
        return null;
      }

      // Update hit statistics
      entry.hitCount++;
      entry.lastHit = new Date();
      
      // Update in memory cache
      this.memoryCache.set(fullKey, entry);
      
      // Async update in database
      this.updateHitStats(fullKey, entry.hitCount, entry.lastHit).catch(() => {});

      logger.debug(`Cache hit: ${fullKey}`);
      return this.deserializeValue(entry.value, entry.compressed);

    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const {
        ttl = this.DEFAULT_TTL,
        namespace = 'default',
        tags = [],
        compressionThreshold = this.COMPRESSION_THRESHOLD
      } = options;

      const fullKey = this.buildKey(key, namespace);
      const serializedValue = this.serializeValue(value);
      const shouldCompress = serializedValue.length > compressionThreshold;
      const finalValue = shouldCompress ? this.compress(serializedValue) : serializedValue;
      
      const entry: CacheEntry = {
        key: fullKey,
        value: finalValue,
        namespace,
        tags,
        size: finalValue.length,
        compressed: shouldCompress,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
        hitCount: 0,
        lastHit: new Date()
      };

      // Store in memory cache
      this.setMemoryCache(fullKey, entry);

      // Store in database cache
      await this.setInDatabase(entry);

      logger.debug(`Cache set: ${fullKey} (${entry.size} bytes, compressed: ${shouldCompress})`);

    } catch (error) {
      logger.error('Cache set error:', error);
      throw new Error('Failed to set cache value');
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string, namespace: string = 'default'): Promise<void> {
    try {
      const fullKey = this.buildKey(key, namespace);
      
      // Remove from memory cache
      this.memoryCache.delete(fullKey);
      
      // Remove from database cache
      await this.prisma.vectorCache.delete({
        where: { cacheKey: fullKey }
      }).catch(() => {}); // Ignore if not found

      logger.debug(`Cache deleted: ${fullKey}`);

    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Clear cache by namespace
   */
  async clearNamespace(namespace: string): Promise<number> {
    try {
      let deletedCount = 0;

      // Clear from memory cache
      for (const [key, entry] of this.memoryCache) {
        if (entry.namespace === namespace) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }

      // Clear from database
      const dbResult = await this.prisma.vectorCache.deleteMany({
        where: {
          cacheKey: { startsWith: `${namespace}:` }
        }
      });

      deletedCount += dbResult.count;
      logger.info(`Cleared ${deletedCount} entries from namespace: ${namespace}`);
      
      return deletedCount;

    } catch (error) {
      logger.error('Cache clear namespace error:', error);
      throw new Error('Failed to clear cache namespace');
    }
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<number> {
    try {
      let deletedCount = 0;

      // Clear from memory cache
      for (const [key, entry] of this.memoryCache) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }

      // For database, we'd need to implement a tags system
      // This is a simplified version
      logger.info(`Cleared ${deletedCount} entries by tags: ${tags.join(', ')}`);
      
      return deletedCount;

    } catch (error) {
      logger.error('Cache clear by tags error:', error);
      throw new Error('Failed to clear cache by tags');
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const memoryEntries = Array.from(this.memoryCache.values());
      const totalEntries = memoryEntries.length;
      const totalSize = memoryEntries.reduce((sum, entry) => sum + entry.size, 0);
      const totalHits = memoryEntries.reduce((sum, entry) => sum + entry.hitCount, 0);
      const avgHitCount = totalEntries > 0 ? totalHits / totalEntries : 0;
      
      // Calculate hit rate (simplified - would need more tracking in production)
      const hitRate = totalHits > 0 ? (totalHits / (totalHits + totalEntries)) * 100 : 0;
      const missRate = 100 - hitRate;

      // Compression stats
      const compressedEntries = memoryEntries.filter(e => e.compressed);
      const compressionRatio = compressedEntries.length > 0 
        ? compressedEntries.reduce((sum, e) => sum + e.size, 0) / compressedEntries.length 
        : 0;

      // Namespace stats
      const namespaceMap = new Map<string, { entries: number; size: number; hits: number }>();
      
      for (const entry of memoryEntries) {
        if (!namespaceMap.has(entry.namespace)) {
          namespaceMap.set(entry.namespace, { entries: 0, size: 0, hits: 0 });
        }
        const stats = namespaceMap.get(entry.namespace)!;
        stats.entries++;
        stats.size += entry.size;
        stats.hits += entry.hitCount;
      }

      const namespaceStats = Array.from(namespaceMap.entries()).map(([namespace, stats]) => ({
        namespace,
        entries: stats.entries,
        size: stats.size,
        hitRate: stats.entries > 0 ? (stats.hits / stats.entries) * 100 : 0
      }));

      // Expired entries
      const now = new Date();
      const expiredEntries = memoryEntries.filter(e => e.expiresAt < now).length;

      return {
        totalEntries,
        totalSize,
        hitRate,
        missRate,
        avgHitCount,
        expiredEntries,
        compressionRatio,
        namespaceStats
      };

    } catch (error) {
      logger.error('Cache stats error:', error);
      throw new Error('Failed to get cache statistics');
    }
  }

  /**
   * Cache with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options.namespace);
    
    if (cached !== null) {
      return cached;
    }

    // Execute fallback function
    const value = await fallbackFn();
    
    // Cache the result
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Warming cache strategies
   */
  async warmCache(namespace: string, warmingFunctions: Array<{
    key: string;
    fn: () => Promise<any>;
    options?: CacheOptions;
  }>): Promise<void> {
    try {
      logger.info(`Starting cache warming for namespace: ${namespace}`);
      
      const promises = warmingFunctions.map(async ({ key, fn, options = {} }) => {
        try {
          const value = await fn();
          await this.set(key, value, { ...options, namespace });
          logger.debug(`Warmed cache key: ${key}`);
        } catch (error) {
          logger.error(`Failed to warm cache key ${key}:`, error);
        }
      });

      await Promise.allSettled(promises);
      logger.info(`Cache warming completed for namespace: ${namespace}`);

    } catch (error) {
      logger.error('Cache warming error:', error);
      throw new Error('Failed to warm cache');
    }
  }

  /**
   * Invalidation patterns
   */
  async invalidatePattern(pattern: string, namespace?: string): Promise<number> {
    try {
      let deletedCount = 0;
      const regex = new RegExp(pattern);

      for (const [key, entry] of this.memoryCache) {
        const keyToCheck = namespace ? key.replace(`${namespace}:`, '') : key;
        
        if (regex.test(keyToCheck) && (!namespace || entry.namespace === namespace)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }

      logger.info(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
      return deletedCount;

    } catch (error) {
      logger.error('Cache invalidate pattern error:', error);
      throw new Error('Failed to invalidate cache pattern');
    }
  }

  /**
   * Private helper methods
   */

  private buildKey(key: string, namespace: string): string {
    return `${namespace}:${key}`;
  }

  private serializeValue(value: any): string {
    return JSON.stringify(value);
  }

  private deserializeValue(value: string, compressed: boolean): any {
    const finalValue = compressed ? this.decompress(value) : value;
    return JSON.parse(finalValue);
  }

  private compress(data: string): string {
    // Simple compression using built-in zlib (in production, use proper compression)
    return Buffer.from(data).toString('base64');
  }

  private decompress(data: string): string {
    // Simple decompression
    return Buffer.from(data, 'base64').toString();
  }

  private setMemoryCache(key: string, entry: CacheEntry): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      this.evictLRU();
    }
    
    this.memoryCache.set(key, entry);
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (entry.lastHit.getTime() < oldestTime) {
        oldestTime = entry.lastHit.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      logger.debug(`Evicted LRU cache entry: ${oldestKey}`);
    }
  }

  private async getFromDatabase(key: string): Promise<CacheEntry | null> {
    try {
      const cached = await this.prisma.vectorCache.findUnique({
        where: { cacheKey: key }
      });

      if (!cached || cached.expiresAt < new Date()) {
        return null;
      }

      return {
        key: cached.cacheKey,
        value: cached.results,
        namespace: 'vector', // Default for vector cache
        tags: [],
        size: JSON.stringify(cached.results).length,
        compressed: false,
        createdAt: cached.createdAt,
        expiresAt: cached.expiresAt,
        hitCount: cached.hitCount,
        lastHit: cached.lastHit
      };

    } catch (error) {
      logger.error('Database cache get error:', error);
      return null;
    }
  }

  private async setInDatabase(entry: CacheEntry): Promise<void> {
    try {
      // For now, only use vector cache table - in production you'd want a dedicated cache table
      await this.prisma.vectorCache.upsert({
        where: { cacheKey: entry.key },
        update: {
          queryText: 'cached_value',
          results: entry.value,
          expiresAt: entry.expiresAt,
          updatedAt: new Date()
        },
        create: {
          cacheKey: entry.key,
          queryText: 'cached_value',
          results: entry.value,
          expiresAt: entry.expiresAt,
          organizationId: 'system', // System cache
          filters: {},
          limit: 0,
          threshold: 0
        }
      });

    } catch (error) {
      logger.error('Database cache set error:', error);
      // Don't throw - memory cache still works
    }
  }

  private async updateHitStats(key: string, hitCount: number, lastHit: Date): Promise<void> {
    try {
      await this.prisma.vectorCache.update({
        where: { cacheKey: key },
        data: {
          hitCount,
          lastHit
        }
      });
    } catch (error) {
      // Ignore errors for hit stats updates
    }
  }

  private startMaintenanceTasks(): void {
    // Cleanup expired entries every 15 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 15 * 60 * 1000);

    // Memory usage monitoring every 5 minutes
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 5 * 60 * 1000);

    logger.info('Cache maintenance tasks started');
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired cache entries`);
    }

    // Cleanup database cache as well
    this.prisma.vectorCache.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    }).then(result => {
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired database cache entries`);
      }
    }).catch(error => {
      logger.error('Database cache cleanup error:', error);
    });
  }

  private monitorMemoryUsage(): void {
    const totalSize = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    const totalEntries = this.memoryCache.size;
    const avgSize = totalEntries > 0 ? totalSize / totalEntries : 0;

    logger.debug(`Cache memory usage: ${totalEntries} entries, ${(totalSize / 1024 / 1024).toFixed(2)}MB total, ${(avgSize / 1024).toFixed(2)}KB avg`);

    // Alert if cache is getting too large
    if (totalSize > 100 * 1024 * 1024) { // 100MB
      logger.warn(`Cache memory usage is high: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }
}