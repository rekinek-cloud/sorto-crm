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
    timeRange?: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year';
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

      // Apply time range filter
      if (filters.timeRange && filters.timeRange !== 'all') {
        const now = new Date();
        let fromDate: Date;

        switch (filters.timeRange) {
          case 'today':
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarter':
            fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            fromDate = new Date(0); // epoch
        }

        whereClause.processingDate = {
          gte: fromDate
        };

        logger.info(`Applying time filter: ${filters.timeRange} (from: ${fromDate.toISOString()})`);
      }

      // Mock vector similarity search (replace with actual pgvector queries)
      const documents = await this.prisma.vector_documents.findMany({
        where: whereClause,
        take: limit * 2, // Get more to allow for filtering by threshold
      });

      // Calculate similarities and filter
      let results: VectorSearchResult[] = [];

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

      // If no results from vector search, fallback to text search
      if (results.length === 0) {
        logger.info(`Vector search returned 0 results, falling back to text search for: "${query}" (org: ${organizationId})`);
        results = await this.textSearchFallback(organizationId, query, whereClause, limit);
        logger.info(`Text search fallback returned ${results.length} results: ${results.slice(0,3).map(r => r.title).join(', ')}`);
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
          streamRole: true
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
            stream.streamRole ? `Role: ${stream.streamRole}` : ''
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
      // Try to get an active AI provider for embeddings (case-insensitive search)
      const provider = await this.prisma.ai_providers.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: 'openai' },
            { name: 'OpenAI' }
          ]
        }
      });

      const apiKey = provider?.config && (provider.config as any).apiKey;

      if (apiKey && apiKey.length > 10) {
        return await this.generateOpenAIEmbedding(text, apiKey);
      }

      // Try environment variable as fallback
      const envApiKey = process.env.OPENAI_API_KEY;
      if (envApiKey && envApiKey.length > 10) {
        logger.info('Using OpenAI API key from environment');
        return await this.generateOpenAIEmbedding(text, envApiKey);
      }

      // Fallback to mock embedding generation
      logger.warn('No OpenAI API key found, using mock embeddings (limited functionality)');
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

  /**
   * Text search fallback when vector similarity returns no results
   * Uses ILIKE for text matching with Polish word normalization
   */
  private async textSearchFallback(
    organizationId: string,
    query: string,
    baseWhere: any,
    limit: number
  ): Promise<VectorSearchResult[]> {
    try {
      logger.info(`Performing text search fallback for: "${query}" (org: ${organizationId})`);

      // Normalize query for Polish language
      const normalizedQuery = this.normalizePolishQuery(query);

      // Polish stop words to filter out (common short words that match too much)
      const polishStopWords = new Set([
        'od', 'do', 'w', 'z', 'na', 'po', 'za', 'ze', 'we', 'ku', 'o', 'u', 'i', 'a',
        'ze', 'to', 'co', 'czy', 'jak', 'nie', 'tak', 'dla', 'bez', 'ale', 'lub',
        'czy', 'juz', 'sie', 'jest', 'sa', 'byl', 'byla', 'byly', 'ktory', 'ktora',
        'pokaz', 'wyswietl', 'znajdz', 'szukaj', 'daj', 'maile', 'mail', 'email', 'emaile'
      ]);

      const rawTerms = normalizedQuery
        .split(/\s+/)
        .filter(term => term.length >= 3 && !polishStopWords.has(term));

      // Apply simple Polish stemming (remove common suffixes for names)
      const searchTerms = rawTerms.map(term => this.simplePolishStem(term));
      logger.info(`Search terms after normalization, stop words, and stemming: [${searchTerms.join(', ')}]`);

      if (searchTerms.length === 0) {
        logger.warn(`No search terms after normalization for query: "${query}"`);
        return [];
      }

      // Build OR conditions for each search term
      const orConditions = searchTerms.flatMap(term => [
        { title: { contains: term, mode: 'insensitive' as const } },
        { content: { contains: term, mode: 'insensitive' as const } }
      ]);

      const whereClause = {
        ...baseWhere,
        organizationId,
        OR: orConditions
      };
      logger.info(`Text search WHERE clause: ${JSON.stringify(whereClause, null, 2)}`);

      const documents = await this.prisma.vector_documents.findMany({
        where: whereClause,
        take: limit * 2,
        orderBy: { processingDate: 'desc' }
      });

      logger.info(`Text search fallback found ${documents.length} documents: ${documents.slice(0,3).map(d => d.title).join(', ')}`);

      // Calculate text-based relevance score and filter out zero-relevance results
      const results = documents
        .map(doc => {
          const relevance = this.calculateTextRelevance(doc.title, doc.content, searchTerms);
          return {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            entityType: doc.entityType,
            entityId: doc.entityId,
            similarity: relevance,
            metadata: {
              source: doc.source,
              language: doc.language,
              chunkIndex: doc.chunkIndex,
              totalChunks: doc.totalChunks,
              processingDate: doc.processingDate.toISOString()
            }
          };
        })
        .filter(doc => doc.similarity > 0); // Only return documents with actual matches

      logger.info(`After relevance filtering: ${results.length} documents with matches`);
      return results;
    } catch (error) {
      logger.error('Text search fallback failed:', error);
      return [];
    }
  }

  /**
   * Normalize Polish query - remove diacritics and common suffixes
   */
  private normalizePolishQuery(query: string): string {
    // Polish diacritics mapping
    const polishMap: Record<string, string> = {
      'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
      'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
      'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
      'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };

    let normalized = query;

    // Replace Polish characters
    for (const [polish, ascii] of Object.entries(polishMap)) {
      normalized = normalized.replace(new RegExp(polish, 'g'), ascii);
    }

    return normalized.toLowerCase().trim();
  }

  /**
   * Simple Polish stemmer - removes common suffixes from names
   * This helps match "Aleksandry" to "Aleksandra", "Wojciechowskiej" to "Wojciechowsk", etc.
   */
  private simplePolishStem(word: string): string {
    // Common Polish name/noun suffixes (ordered by length, longest first)
    const suffixes = [
      'owskiej', 'owski', 'owska', 'owej', 'owym', 'owego',
      'skiej', 'skich', 'skiego', 'ska', 'ski', 'skie',
      'owej', 'owym', 'owych', 'owa', 'owy', 'owe',
      'ami', 'ach', 'om', 'ow',
      'ej', 'em', 'ie', 'ego', 'emu',
      'ą', 'ę', 'y', 'i', 'a', 'u', 'e'
    ];

    let stemmed = word.toLowerCase();

    // Only stem words longer than 4 characters to avoid over-stemming
    if (stemmed.length <= 4) {
      return stemmed;
    }

    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix) && stemmed.length - suffix.length >= 3) {
        stemmed = stemmed.slice(0, -suffix.length);
        break; // Only remove one suffix
      }
    }

    return stemmed;
  }

  /**
   * Calculate text-based relevance score
   */
  private calculateTextRelevance(title: string, content: string, searchTerms: string[]): number {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    let score = 0;
    let matchedTerms = 0;

    for (const term of searchTerms) {
      const termLower = term.toLowerCase();

      // Title matches are worth more
      if (titleLower.includes(termLower)) {
        score += 0.4;
        matchedTerms++;
      }

      // Content matches
      if (contentLower.includes(termLower)) {
        score += 0.2;
        matchedTerms++;
      }

      // Exact word match bonus
      const titleWords = titleLower.split(/\s+/);
      const contentWords = contentLower.split(/\s+/);

      if (titleWords.includes(termLower)) {
        score += 0.2;
      }
      if (contentWords.includes(termLower)) {
        score += 0.1;
      }
    }

    // Normalize by number of search terms
    const maxPossibleScore = searchTerms.length * 0.9;
    const normalizedScore = Math.min(score / maxPossibleScore, 1.0);

    // Ensure minimum score if any term matched
    return matchedTerms > 0 ? Math.max(normalizedScore, 0.5) : 0;
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
          id: `cache-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          cacheKey,
          queryText,
          results: results as any,
          expiresAt,
          organizationId,
          filters: {},
          limit: results.results.length,
          threshold: results.threshold,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to save to cache:', error);
    }
  }
}