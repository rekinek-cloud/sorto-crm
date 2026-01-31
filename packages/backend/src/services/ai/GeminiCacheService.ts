/**
 * Gemini Context Caching Service
 * Provides 90% cost reduction for repeated queries on the same context
 * Integrated with SORTO Streams
 */

import {
  GoogleGenerativeAI,
  CachedContent,
} from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger';

interface CacheInfo {
  cacheName: string;
  displayName: string;
  expireTime: string;
  model: string;
  streamId?: string;
}

interface CreateCacheOptions {
  ttlSeconds?: number;
  model?: string;
  systemPrompt?: string;
  streamId?: string;
}

interface RAGDocument {
  name: string;
  content: string;
}

export class GeminiCacheService {
  private client: GoogleGenerativeAI;
  private prisma: PrismaClient;
  private activeCaches: Map<string, CacheInfo> = new Map();

  // Models that support caching
  static readonly CACHE_MODELS = {
    PRO: 'models/gemini-1.5-pro-001',
    FLASH: 'models/gemini-1.5-flash-001',
  };

  constructor(apiKey: string, prisma: PrismaClient) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.prisma = prisma;
  }

  /**
   * Create a cache for content
   * @param name - Unique cache identifier
   * @param content - Content to cache
   * @param options - Cache options
   */
  async createCache(
    name: string,
    content: string,
    options: CreateCacheOptions = {}
  ): Promise<CacheInfo> {
    const ttlSeconds = options.ttlSeconds || 3600; // 1h default
    const model = options.model || GeminiCacheService.CACHE_MODELS.PRO;

    // Check if cache already exists and is valid
    if (this.activeCaches.has(name)) {
      const existing = this.activeCaches.get(name)!;
      if (new Date(existing.expireTime) > new Date()) {
        logger.info(`[GeminiCache] Using existing cache: ${name}`);
        return existing;
      }
    }

    logger.info(`[GeminiCache] Creating new cache: ${name}`);

    try {
      // Note: GoogleAICacheManager is used for cache management
      // The @google/generative-ai package provides this through different import
      const cacheManager = await this.getCacheManager();

      const cache = await cacheManager.create({
        model: model,
        displayName: name,
        systemInstruction: options.systemPrompt || 'Jesteś pomocnym asystentem.',
        contents: [
          {
            role: 'user',
            parts: [{ text: content }],
          },
        ],
        ttlSeconds: ttlSeconds,
      });

      const cacheInfo: CacheInfo = {
        cacheName: cache.name,
        displayName: name,
        expireTime: cache.expireTime?.toISOString() || new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        model: model,
        streamId: options.streamId,
      };

      this.activeCaches.set(name, cacheInfo);

      // Log to database for analytics
      if (options.streamId) {
        await this.logCacheCreation(cacheInfo);
      }

      logger.info(`[GeminiCache] Created: ${cache.name}, expires: ${cacheInfo.expireTime}`);

      return cacheInfo;
    } catch (error: any) {
      logger.error(`[GeminiCache] Failed to create cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query using cached context (90% cheaper!)
   */
  async queryWithCache(cacheName: string, question: string): Promise<string> {
    const cacheInfo = this.activeCaches.get(cacheName);

    if (!cacheInfo) {
      throw new Error(`Cache not found: ${cacheName}`);
    }

    // Check expiration
    if (new Date(cacheInfo.expireTime) < new Date()) {
      this.activeCaches.delete(cacheName);
      throw new Error(`Cache expired: ${cacheName}`);
    }

    try {
      // Get model from cached content
      const cachedContent = { name: cacheInfo.cacheName } as unknown as CachedContent;
      const model = this.client.getGenerativeModelFromCachedContent(cachedContent);

      const result = await model.generateContent(question);

      return result.response.text();
    } catch (error: any) {
      logger.error(`[GeminiCache] Query failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create RAG cache - load documents once, query many times
   * 90% cheaper than regular RAG!
   */
  async createRAGCache(
    name: string,
    documents: RAGDocument[],
    options: CreateCacheOptions = {}
  ): Promise<CacheInfo> {
    // Build knowledge base content
    let content = 'BAZA WIEDZY:\n\n';

    for (const doc of documents) {
      content += `=== ${doc.name} ===\n${doc.content}\n\n`;
    }

    const systemPrompt = `Jesteś asystentem z dostępem do bazy wiedzy.
Odpowiadaj na pytania TYLKO na podstawie dostarczonej bazy wiedzy.
Jeśli nie znajdziesz odpowiedzi, powiedz że nie wiesz.
Cytuj źródła.
Odpowiadaj po polsku, zwięźle.`;

    return this.createCache(name, content, {
      ...options,
      systemPrompt,
    });
  }

  /**
   * RAG Query with cache (90% cheaper!)
   */
  async ragQueryWithCache(cacheName: string, question: string): Promise<string> {
    return this.queryWithCache(cacheName, `Na podstawie bazy wiedzy odpowiedz: ${question}`);
  }

  /**
   * Create cache from project files
   */
  async createProjectCache(
    name: string,
    projectPath: string,
    options: CreateCacheOptions = {}
  ): Promise<{ cacheInfo: CacheInfo; filesLoaded: string[] }> {
    const fs = await import('fs');
    const path = await import('path');

    const filesToCache = [
      'README.md',
      'docs/README.md',
      'docs/api.md',
      'CHANGELOG.md',
      'package.json',
      'src/index.ts',
      'src/app.ts',
    ];

    const documents: RAGDocument[] = [];

    for (const file of filesToCache) {
      const fullPath = path.join(projectPath, file);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          documents.push({ name: file, content });
        } catch (e) {
          // Skip files that can't be read
        }
      }
    }

    if (documents.length === 0) {
      throw new Error('No files found to cache');
    }

    const cacheInfo = await this.createRAGCache(name, documents, options);

    return {
      cacheInfo,
      filesLoaded: documents.map(d => d.name),
    };
  }

  /**
   * List all active caches
   */
  async listCaches(): Promise<CacheInfo[]> {
    // Clean up expired caches
    const now = new Date();
    const keysToDelete: string[] = [];
    this.activeCaches.forEach((cache, key) => {
      if (new Date(cache.expireTime) < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.activeCaches.delete(key));

    const result: CacheInfo[] = [];
    this.activeCaches.forEach(cache => result.push(cache));
    return result;
  }

  /**
   * Delete a cache
   */
  async deleteCache(cacheName: string): Promise<void> {
    try {
      const cacheManager = await this.getCacheManager();

      // Find the cache info
      const cacheInfo = this.activeCaches.get(cacheName);
      if (cacheInfo) {
        await cacheManager.delete(cacheInfo.cacheName);
        this.activeCaches.delete(cacheName);
        logger.info(`[GeminiCache] Deleted: ${cacheName}`);
      }
    } catch (error: any) {
      logger.error(`[GeminiCache] Failed to delete: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cache by stream ID
   */
  getCacheByStreamId(streamId: string): CacheInfo | undefined {
    let found: CacheInfo | undefined;
    this.activeCaches.forEach(cache => {
      if (cache.streamId === streamId) {
        found = cache;
      }
    });
    return found;
  }

  // ==================
  // Helper methods
  // ==================

  private async getCacheManager(): Promise<any> {
    // Dynamic import for cache manager
    const { GoogleAICacheManager } = await import('@google/generative-ai/server');
    return new GoogleAICacheManager(this.client.apiKey as unknown as string);
  }

  private async logCacheCreation(cacheInfo: CacheInfo): Promise<void> {
    // Log to ai_provider_logs or similar table for analytics
    try {
      // This could be extended to track cache usage and costs
      logger.info(`[GeminiCache] Logged cache creation for stream: ${cacheInfo.streamId}`);
    } catch (error) {
      // Non-critical, just log
      logger.warn('[GeminiCache] Failed to log cache creation');
    }
  }
}

export default GeminiCacheService;
