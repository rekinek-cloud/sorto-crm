/**
 * Pipeline Configuration Loader
 *
 * Loads pipeline config from DB with 5-minute in-memory cache.
 * Falls back to defaults when no DB config exists.
 */

import { PrismaClient } from '@prisma/client';
import { DEFAULT_PIPELINE_CONFIG, PipelineConfig } from './PipelineConfigDefaults';
import logger from '../../config/logger';

interface CacheEntry {
  config: PipelineConfig;
  expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Deep merge two objects. dbConfig values override defaults.
 */
function deepMerge<T>(defaults: T, override: Partial<T>): T {
  if (!override || typeof override !== 'object') return defaults;

  const result = { ...defaults } as any;
  for (const key of Object.keys(override)) {
    const val = (override as any)[key];
    if (val === null || val === undefined) continue;

    if (Array.isArray(val)) {
      // Arrays: use override directly (don't merge arrays)
      result[key] = val;
    } else if (typeof val === 'object' && !Array.isArray(val) && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      // Nested objects: recurse
      result[key] = deepMerge(result[key], val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export class PipelineConfigLoader {
  /**
   * Load config for an organization.
   * Returns merged config (DB values override defaults).
   */
  static async loadConfig(prisma: PrismaClient, organizationId: string): Promise<PipelineConfig> {
    // Check cache
    const cached = cache.get(organizationId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.config;
    }

    try {
      const dbConfig = await prisma.pipeline_config.findUnique({
        where: { organizationId },
      });

      let config: PipelineConfig;

      if (dbConfig) {
        // Merge each section separately
        config = {
          classifications: deepMerge(DEFAULT_PIPELINE_CONFIG.classifications, dbConfig.classifications as any),
          aiParams: deepMerge(DEFAULT_PIPELINE_CONFIG.aiParams, dbConfig.aiParams as any),
          thresholds: deepMerge(DEFAULT_PIPELINE_CONFIG.thresholds, dbConfig.thresholds as any),
          keywords: deepMerge(DEFAULT_PIPELINE_CONFIG.keywords, dbConfig.keywords as any),
          domains: deepMerge(DEFAULT_PIPELINE_CONFIG.domains, dbConfig.domains as any),
          scheduling: deepMerge(DEFAULT_PIPELINE_CONFIG.scheduling, dbConfig.scheduling as any),
          contentLimits: deepMerge(DEFAULT_PIPELINE_CONFIG.contentLimits, dbConfig.contentLimits as any),
          postActions: deepMerge(DEFAULT_PIPELINE_CONFIG.postActions, dbConfig.postActions as any),
          systemRules: deepMerge(DEFAULT_PIPELINE_CONFIG.systemRules, dbConfig.systemRules as any),
          taskExtraction: deepMerge(DEFAULT_PIPELINE_CONFIG.taskExtraction, dbConfig.taskExtraction as any),
        };
      } else {
        config = { ...DEFAULT_PIPELINE_CONFIG };
      }

      // Store in cache
      cache.set(organizationId, {
        config,
        expiresAt: Date.now() + CACHE_TTL,
      });

      return config;
    } catch (error) {
      logger.warn(`[PipelineConfig] Failed to load config for org ${organizationId}, using defaults:`, error);
      return { ...DEFAULT_PIPELINE_CONFIG };
    }
  }

  /**
   * Invalidate cache for an organization (called after config update).
   */
  static invalidateCache(organizationId: string): void {
    cache.delete(organizationId);
    logger.info(`[PipelineConfig] Cache invalidated for org ${organizationId}`);
  }

  /**
   * Invalidate all caches.
   */
  static invalidateAll(): void {
    cache.clear();
    logger.info('[PipelineConfig] All caches invalidated');
  }

  /**
   * Get default config (for API comparison / reset).
   */
  static getDefaults(): PipelineConfig {
    return { ...DEFAULT_PIPELINE_CONFIG };
  }

  /**
   * Build the classification prompt by substituting categories from config.
   */
  static buildClassificationPrompt(config: PipelineConfig): string {
    const categories = config.classifications.validClasses
      .map(cls => `- ${cls}: ${config.classifications.descriptions[cls] || cls}`)
      .join('\n');
    return config.aiParams.classificationPrompt.replace('{{categories}}', categories);
  }
}
