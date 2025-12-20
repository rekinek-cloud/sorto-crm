import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '../config/logger';

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  filters?: {
    entityType?: string;
    entityId?: string;
    language?: string;
    source?: string;
  };
  useCache?: boolean;
  cacheExpiry?: number; // TTL in minutes
}

export interface VectorSearchResult {
  id: string;
  title: string;
  content: string;
  entityType: string;
  entityId: string;
  similarity: number;
  metadata: {
    source: string;
    language: string;
    chunkIndex: number;
    totalChunks: number;
    processingDate: string;
  };
}

export interface VectorSearchResponse {
  query: string;
  results: VectorSearchResult[];
  totalResults: number;
  searchTime: number;
  fromCache: boolean;
  threshold: number;
}

export class VectorService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create embeddings for a document and store in vector database
   */
  async createVectorDocument(
    organizationId: string,
    title: string,
    content: string,
    entityType: string,
    entityId: string,
    options: {
      source?: string;
      language?: string;
      chunkSize?: number;
      processingModel?: string;
    } = {}
  ): Promise<string[]> {
    try {
      const {
        source = 'manual',
        language = 'pl',
        chunkSize = 500,
        processingModel = 'text-embedding-ada-002'
      } = options;

      // Split content into chunks if necessary
      const chunks = this.splitIntoChunks(content, chunkSize);
      const documentIds: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const contentHash = this.generateContentHash(chunk);
        
        // Check if this exact content already exists
        const existing = await this.prisma.vector_documents.findUnique({
          where: { contentHash }
        });

        if (existing) {
          logger.info(`Vector document already exists for hash: ${contentHash}`);
          documentIds.push(existing.id);
          continue;
        }

        // Generate embedding (mock for now - replace with actual embedding API)
        const embedding = await this.generateEmbedding(chunk);

        // Create vector document
        const vectorDoc = await this.prisma.vector_documents.create({
          data: {
            id: crypto.randomUUID(),
            title: chunks.length > 1 ? `${title} (Part ${i + 1})` : title,
            content: chunk,
            contentHash,
            embedding,
            entityType,
            entityId,
            source,
            language,
            chunkIndex: i,
            totalChunks: chunks.length,
            chunkSize: chunk.length,
            processingModel,
            organizationId,
            lastUpdated: new Date()
          }
        });

        documentIds.push(vectorDoc.id);
        logger.info(`Created vector document: ${vectorDoc.id} for entity ${entityType}:${entityId}`);
      }

      return documentIds;
    } catch (error) {
      logger.error('Failed to create vector document:', error);
      throw new Error('Failed to create vector document');
    }
  }

  /**
   * Semantic search in vector database
   */
  async searchSimilar(
    organizationId: string,
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResponse> {
    const startTime = Date.now();
    const {
      limit = 10,
      threshold = 0.7,
      filters = {},
      useCache = true,
      cacheExpiry = 30
    } = options;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(query, filters, limit, threshold);
      
      // Check cache first
      if (useCache) {
        const cached = await this.getFromCache(organizationId, cacheKey);
        if (cached) {
          return {
            ...cached,
            searchTime: Date.now() - startTime,
            fromCache: true
          };
        }
      }

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Build where clause for filters
      const whereClause: any = {
        organizationId
      };

      if (filters.entityType) whereClause.entityType = filters.entityType;
      if (filters.entityId) whereClause.entityId = filters.entityId;
      if (filters.language) whereClause.language = filters.language;
      if (filters.source) whereClause.source = filters.source;

      // Mock vector similarity search (replace with actual pgvector queries)
      const documents = await this.prisma.vector_documents.findMany({
        where: whereClause,
        take: limit * 2, // Get more to allow for filtering by threshold
      });

      // Calculate similarities and filter
      const results: VectorSearchResult[] = [];
      
      for (const doc of documents) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding);
        
        if (similarity >= threshold) {
          results.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            entityType: doc.entityType,
            entityId: doc.entityId,
            similarity,
            metadata: {
              source: doc.source,
              language: doc.language,
              chunkIndex: doc.chunkIndex,
              totalChunks: doc.totalChunks,
              processingDate: doc.processingDate.toISOString()
            }
          });
        }
      }

      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const finalResults = results.slice(0, limit);

      // Log search results for analytics (skip if table doesn't exist in Prisma schema)
      try {
        for (let i = 0; i < finalResults.length; i++) {
          const result = finalResults[i];
          await this.prisma.vector_search_results.create({
            data: {
              id: crypto.randomUUID(),
              queryText: query,
              queryEmbedding,
              documentId: result.id,
              similarity: result.similarity,
              rank: i + 1,
              searchContext: 'api',
              executionTime: Date.now() - startTime,
              organizationId
            }
          });
        }
      } catch (analyticsError) {
        // Silently ignore analytics logging errors
        logger.warn('Failed to log search analytics:', analyticsError);
      }

      const response: VectorSearchResponse = {
        query,
        results: finalResults,
        totalResults: finalResults.length,
        searchTime: Date.now() - startTime,
        fromCache: false,
        threshold
      };

      // Cache the results
      if (useCache && finalResults.length > 0) {
        await this.saveToCache(organizationId, cacheKey, query, response, cacheExpiry);
      }

      return response;
    } catch (error) {
      logger.error('Vector search failed:', error);
      throw new Error('Vector search failed');
    }
  }

  /**
   * Update existing vector document
   */
  async updateVectorDocument(
    documentId: string,
    title?: string,
    content?: string
  ): Promise<void> {
    try {
      const existingDoc = await this.prisma.vector_documents.findUnique({
        where: { id: documentId }
      });

      if (!existingDoc) {
        throw new Error('Vector document not found');
      }

      const updates: any = {};
      
      if (title) updates.title = title;
      
      if (content) {
        updates.content = content;
        updates.contentHash = this.generateContentHash(content);
        updates.embedding = await this.generateEmbedding(content);
        updates.chunkSize = content.length;
      }

      await this.prisma.vector_documents.update({
        where: { id: documentId },
        data: updates
      });

      logger.info(`Updated vector document: ${documentId}`);
    } catch (error) {
      logger.error('Failed to update vector document:', error);
      throw new Error('Failed to update vector document');
    }
  }

  /**
   * Delete vector documents for an entity
   */
  async deleteVectorDocuments(entityType: string, entityId: string): Promise<void> {
    try {
      const result = await this.prisma.vector_documents.deleteMany({
        where: {
          entityType,
          entityId
        }
      });

      logger.info(`Deleted ${result.count} vector documents for ${entityType}:${entityId}`);
    } catch (error) {
      logger.error('Failed to delete vector documents:', error);
      throw new Error('Failed to delete vector documents');
    }
  }

  /**
   * Get analytics for vector database usage
   */
  async getVectorAnalytics(organizationId: string): Promise<any> {
    try {
      const [documentCount, searchCount, cacheStats] = await Promise.all([
        // Document statistics
        this.prisma.vector_documents.groupBy({
          by: ['entityType'],
          where: { organizationId },
          _count: { id: true }
        }),
        
        // Search statistics
        this.prisma.vectorSearchResult.groupBy({
          by: ['searchContext'],
          where: { organizationId },
          _count: { id: true },
          _avg: { similarity: true, executionTime: true }
        }),
        
        // Cache statistics
        this.prisma.vector_cache.aggregate({
          where: { organizationId },
          _count: { id: true },
          _sum: { hitCount: true },
          _avg: { hitCount: true }
        })
      ]);

      return {
        documents: {
          total: documentCount.reduce((sum, item) => sum + item._count.id, 0),
          byType: documentCount
        },
        searches: {
          total: searchCount.reduce((sum, item) => sum + item._count.id, 0),
          byContext: searchCount,
          avgSimilarity: searchCount.reduce((sum, item) => sum + (item._avg.similarity || 0), 0) / searchCount.length || 0,
          avgExecutionTime: searchCount.reduce((sum, item) => sum + (item._avg.executionTime || 0), 0) / searchCount.length || 0
        },
        cache: {
          entries: cacheStats._count.id,
          totalHits: cacheStats._sum.hitCount || 0,
          avgHitsPerEntry: cacheStats._avg.hitCount || 0
        }
      };
    } catch (error) {
      logger.error('Failed to get vector analytics:', error);
      throw new Error('Failed to get vector analytics');
    }
  }

  /**
   * Index all streams for an organization into vector database
   * This enables semantic search for content routing
   */
  async indexStreams(organizationId: string): Promise<{ indexed: number; errors: number }> {
    let indexed = 0;
    let errors = 0;

    try {
      // Get all active streams for the organization
      const streams = await this.prisma.stream.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          streamType: true,
          gtdRole: true
        }
      });

      logger.info(`Indexing ${streams.length} streams for organization ${organizationId}`);

      for (const stream of streams) {
        try {
          // Build searchable content from stream metadata
          const contentParts = [
            stream.name,
            stream.description || '',
            stream.streamType ? `Type: ${stream.streamType}` : '',
            stream.gtdRole ? `Role: ${stream.gtdRole}` : ''
          ].filter(Boolean);

          const content = contentParts.join('. ');

          // Check if already indexed
          const existing = await this.prisma.vector_documents.findFirst({
            where: {
              entityType: 'STREAM',
              entityId: stream.id,
              organizationId
            }
          });

          if (existing) {
            // Update existing vector document
            await this.updateVectorDocument(existing.id, stream.name, content);
            logger.info(`Updated vector document for stream: ${stream.name}`);
          } else {
            // Create new vector document
            await this.createVectorDocument(
              organizationId,
              stream.name,
              content,
              'STREAM',
              stream.id,
              {
                source: 'stream-index',
                language: 'pl'
              }
            );
            logger.info(`Created vector document for stream: ${stream.name}`);
          }

          indexed++;
        } catch (streamError) {
          logger.error(`Failed to index stream ${stream.name}:`, streamError);
          errors++;
        }
      }

      logger.info(`Stream indexing complete: ${indexed} indexed, ${errors} errors`);
      return { indexed, errors };
    } catch (error) {
      logger.error('Failed to index streams:', error);
      throw new Error('Failed to index streams');
    }
  }

  /**
   * Index a single stream (call when stream is created or updated)
   */
  async indexStream(
    organizationId: string,
    streamId: string,
    name: string,
    description?: string,
    streamType?: string
  ): Promise<string> {
    try {
      const contentParts = [
        name,
        description || '',
        streamType ? `Type: ${streamType}` : ''
      ].filter(Boolean);

      const content = contentParts.join('. ');

      // Check if already exists
      const existing = await this.prisma.vector_documents.findFirst({
        where: {
          entityType: 'STREAM',
          entityId: streamId,
          organizationId
        }
      });

      if (existing) {
        await this.updateVectorDocument(existing.id, name, content);
        return existing.id;
      }

      const docIds = await this.createVectorDocument(
        organizationId,
        name,
        content,
        'STREAM',
        streamId,
        { source: 'stream-index', language: 'pl' }
      );

      return docIds[0];
    } catch (error) {
      logger.error(`Failed to index stream ${streamId}:`, error);
      throw new Error('Failed to index stream');
    }
  }

  /**
   * Remove stream from vector index (call when stream is deleted)
   */
  async removeStreamFromIndex(streamId: string): Promise<void> {
    await this.deleteVectorDocuments('STREAM', streamId);
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const result = await this.prisma.vector_cache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info(`Cleaned up ${result.count} expired cache entries`);
    } catch (error) {
      logger.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Private helper methods
   */
  
  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content.trim().toLowerCase()).digest('hex');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Try to get an active AI provider for embeddings
      const provider = await this.prisma.ai_providers.findFirst({
        where: {
          status: 'ACTIVE',
          name: 'openai'
        }
      });

      if (provider && provider.config && (provider.config as any).apiKey) {
        return await this.generateOpenAIEmbedding(text, (provider.config as any).apiKey);
      }

      // Fallback to mock embedding generation
      logger.warn('No active AI provider found, using mock embeddings');
      return this.generateMockEmbedding(text);
    } catch (error) {
      logger.error('Embedding generation failed, falling back to mock:', error);
      return this.generateMockEmbedding(text);
    }
  }

  private async generateOpenAIEmbedding(text: string, apiKey: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      logger.error('OpenAI embedding generation failed:', error);
      throw error;
    }
  }

  private generateMockEmbedding(text: string): number[] {
    // Mock embedding generation for development/fallback
    const dimension = 1536;
    const embedding: number[] = [];
    
    // Simple hash-based mock embedding for consistent results
    const hash = crypto.createHash('sha256').update(text).digest();
    for (let i = 0; i < dimension; i++) {
      embedding.push((hash[i % hash.length] - 128) / 128);
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private generateCacheKey(query: string, filters: any, limit: number, threshold: number): string {
    const data = JSON.stringify({ query, filters, limit, threshold });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private async getFromCache(organizationId: string, cacheKey: string): Promise<VectorSearchResponse | null> {
    try {
      const cached = await this.prisma.vector_cache.findFirst({
        where: {
          organizationId,
          cacheKey,
          expiresAt: { gt: new Date() }
        }
      });

      if (cached) {
        // Update hit count and last hit time
        await this.prisma.vector_cache.update({
          where: { id: cached.id },
          data: {
            hitCount: { increment: 1 },
            lastHit: new Date()
          }
        });

        return cached.results as VectorSearchResponse;
      }

      return null;
    } catch (error) {
      logger.error('Cache lookup failed:', error);
      return null;
    }
  }

  private async saveToCache(
    organizationId: string,
    cacheKey: string,
    queryText: string,
    results: VectorSearchResponse,
    expiryMinutes: number
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await this.prisma.vector_cache.upsert({
        where: { cacheKey },
        update: {
          queryText,
          results: results as any,
          expiresAt,
          updatedAt: new Date()
        },
        create: {
          cacheKey,
          queryText,
          results: results as any,
          expiresAt,
          organizationId,
          filters: {},
          limit: results.results.length,
          threshold: results.threshold
        }
      });
    } catch (error) {
      logger.error('Failed to save to cache:', error);
    }
  }
}