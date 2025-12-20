/**
 * 🧠 Vector Store Service
 * Manages embeddings and semantic search for Voice AI
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { z } from 'zod';
import { getAIConfigService } from './AIConfigService';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    type: 'task' | 'project' | 'contact' | 'company' | 'deal' | 'communication' | 'knowledge' | 'external';
    entityId: string;
    userId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    source?: string; // 'internal' | 'email' | 'slack' | 'docs' | 'web'
    tags?: string[];
    importance?: number; // 1-10 scale
  };
  embedding: number[];
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
  relevanceScore: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number; // minimum similarity score
  types?: VectorDocument['metadata']['type'][];
  userId?: string;
  organizationId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sources?: string[];
  includeExternal?: boolean;
}

/**
 * Vector Store for semantic search and RAG
 */
export class VectorStore {
  private prisma: PrismaClient;
  private aiConfigService: any;
  private embeddingDimension = 1536;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.aiConfigService = getAIConfigService(prisma);

    console.log('🧠 VectorStore initialized with AI config service');
  }

  /**
   * Create embedding for text content
   */
  async createEmbedding(text: string, organizationId: string): Promise<number[]> {
    try {
      console.log(`🔢 Creating embedding for: "${text.substring(0, 100)}..."`);
      
      // Get OpenAI client from config service
      const openaiClient = await this.aiConfigService.getOpenAIClient(organizationId);
      const config = await this.aiConfigService.getOpenAIConfig(organizationId);
      
      const response = await openaiClient.embeddings.create({
        model: config.embeddingModel,
        input: text.trim(),
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;
      console.log(`✅ Embedding created: ${embedding.length} dimensions`);
      
      // Update usage statistics
      await this.aiConfigService.updateUsageStats(
        organizationId,
        'openai',
        config.embeddingModel,
        {
          promptTokens: Math.ceil(text.length / 4), // Rough estimate
          completionTokens: 0,
          totalTokens: Math.ceil(text.length / 4)
        }
      );
      
      return embedding;
    } catch (error) {
      console.error('Embedding creation failed:', error);
      throw new Error(`Failed to create embedding: ${error}`);
    }
  }

  /**
   * Store document with embedding
   */
  async storeDocument(document: Omit<VectorDocument, 'embedding'>): Promise<VectorDocument> {
    try {
      console.log(`📥 Storing document: ${document.metadata.type}/${document.id}`);
      
      // Create embedding for content
      const embedding = await this.createEmbedding(document.content, document.metadata.organizationId);
      
      const fullDocument: VectorDocument = {
        ...document,
        embedding
      };

      // Store in database (using JSON for embeddings since pgvector not available)
      await this.prisma.$executeRaw`
        INSERT INTO vectors (
          id, content, metadata, embedding_data, created_at, updated_at
        ) VALUES (
          ${document.id},
          ${document.content},
          ${JSON.stringify(document.metadata)},
          ${JSON.stringify(embedding)},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          embedding_data = EXCLUDED.embedding_data,
          updated_at = NOW()
      `;

      console.log(`✅ Document stored: ${document.id}`);
      return fullDocument;
    } catch (error) {
      console.error('Document storage failed:', error);
      throw new Error(`Failed to store document: ${error}`);
    }
  }

  /**
   * Batch store multiple documents
   */
  async storeDocuments(documents: Omit<VectorDocument, 'embedding'>[]): Promise<VectorDocument[]> {
    console.log(`📦 Batch storing ${documents.length} documents`);
    
    const results: VectorDocument[] = [];
    const batchSize = 10; // Process in batches to avoid rate limits
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const batchPromises = batch.map(doc => this.storeDocument(doc));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Batch storage completed: ${results.length} documents`);
    return results;
  }

  /**
   * Search documents by semantic similarity
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Searching for: "${query}"`);
      
      // Create embedding for search query
      if (!options.organizationId) {
        throw new Error('organizationId is required for search');
      }
      const queryEmbedding = await this.createEmbedding(query, options.organizationId);
      
      // Build WHERE clause based on options
      let whereClause = 'WHERE 1=1';
      const params: any[] = [JSON.stringify(queryEmbedding)];
      let paramIndex = 1;

      if (options.userId) {
        whereClause += ` AND (metadata->>'userId' = $${++paramIndex} OR metadata->>'type' = 'knowledge')`;
        params.push(options.userId);
      }

      if (options.organizationId) {
        whereClause += ` AND metadata->>'organizationId' = $${++paramIndex}`;
        params.push(options.organizationId);
      }

      if (options.types && options.types.length > 0) {
        whereClause += ` AND metadata->>'type' = ANY($${++paramIndex})`;
        params.push(options.types);
      }

      if (options.sources && options.sources.length > 0) {
        whereClause += ` AND metadata->>'source' = ANY($${++paramIndex})`;
        params.push(options.sources);
      }

      if (!options.includeExternal) {
        whereClause += ` AND metadata->>'type' != 'external'`;
      }

      if (options.dateRange) {
        whereClause += ` AND (metadata->>'createdAt')::timestamp BETWEEN $${++paramIndex} AND $${++paramIndex}`;
        params.push(options.dateRange.from.toISOString(), options.dateRange.to.toISOString());
      }

      // Execute semantic search query (using JavaScript cosine similarity since no pgvector)
      const rawResults = await this.prisma.$queryRaw<Array<{
        id: string;
        content: string;
        metadata: string;
        embedding_data: string;
      }>>`
        SELECT 
          id,
          content,
          metadata,
          embedding_data
        FROM vectors
        ${whereClause}
      `;

      // Calculate cosine similarity in JavaScript
      const results = rawResults.map(row => {
        const docEmbedding = JSON.parse(row.embedding_data);
        const similarity = this.calculateCosineSimilarity(queryEmbedding, docEmbedding);
        
        return {
          id: row.id,
          content: row.content,
          metadata: row.metadata,
          similarity
        };
      }).sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.limit || 10);

      // Filter by threshold and transform results
      const threshold = options.threshold || 0.5;
      const searchResults: SearchResult[] = results
        .filter(row => row.similarity >= threshold)
        .map(row => ({
          document: {
            id: row.id,
            content: row.content,
            metadata: JSON.parse(row.metadata),
            embedding: [] // Don't return embeddings in search results
          },
          similarity: row.similarity,
          relevanceScore: this.calculateRelevanceScore(row.similarity, JSON.parse(row.metadata))
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log(`✅ Search completed: ${searchResults.length} results (threshold: ${threshold})`);
      return searchResults;
    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(`Search failed: ${error}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate relevance score based on similarity and metadata
   */
  private calculateRelevanceScore(similarity: number, metadata: any): number {
    let score = similarity;
    
    // Boost recent items
    const daysSinceCreated = (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) score += 0.1;
    if (daysSinceCreated < 1) score += 0.1;
    
    // Boost important items
    if (metadata.importance) {
      score += (metadata.importance / 10) * 0.2;
    }
    
    // Boost by type priority
    const typePriority = {
      task: 0.2,
      project: 0.15,
      deal: 0.15,
      communication: 0.1,
      contact: 0.05,
      company: 0.05,
      knowledge: 0.1,
      external: -0.05
    };
    
    score += typePriority[metadata.type as keyof typeof typePriority] || 0;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Delete document from vector store
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting document: ${id}`);
      
      await this.prisma.$executeRaw`DELETE FROM vectors WHERE id = ${id}`;
      
      console.log(`✅ Document deleted: ${id}`);
      return true;
    } catch (error) {
      console.error('Document deletion failed:', error);
      return false;
    }
  }

  /**
   * Get similar documents to a given document
   */
  async findSimilar(documentId: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      // Get the document's embedding
      const document = await this.prisma.$queryRaw<Array<{
        embedding: string;
        content: string;
      }>>`
        SELECT embedding, content FROM vectors WHERE id = ${documentId}
      `;
      
      if (document.length === 0) {
        throw new Error('Document not found');
      }
      
      // Search using the document's content
      return this.search(document[0].content, {
        ...options,
        limit: (options.limit || 10) + 1 // +1 to exclude self
      }).then(results => 
        results.filter(result => result.document.id !== documentId) // Exclude self
      );
    } catch (error) {
      console.error('Similar documents search failed:', error);
      throw new Error(`Failed to find similar documents: ${error}`);
    }
  }

  /**
   * Get vector store statistics
   */
  async getStats(organizationId?: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    avgSimilarity: number;
    lastUpdated: Date;
  }> {
    try {
      // Simple count query first
      const totalQuery = organizationId 
        ? `SELECT COUNT(*) as total FROM vectors WHERE metadata->>'organizationId' = '${organizationId}'`
        : `SELECT COUNT(*) as total FROM vectors`;
        
      const totalResult = await this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(totalQuery);
      const totalCount = Number(totalResult[0]?.total || 0);
      
      // Simple type stats
      const typeQuery = organizationId
        ? `SELECT metadata->>'type' as type, COUNT(*) as count FROM vectors WHERE metadata->>'organizationId' = '${organizationId}' GROUP BY metadata->>'type'`
        : `SELECT metadata->>'type' as type, COUNT(*) as count FROM vectors GROUP BY metadata->>'type'`;
        
      const typeResult = await this.prisma.$queryRawUnsafe<Array<{ type: string; count: bigint }>>(typeQuery);
      
      const documentsByType: Record<string, number> = {};
      typeResult.forEach(row => {
        if (row.type) {
          documentsByType[row.type] = Number(row.count);
        }
      });
      
      return {
        totalDocuments: totalCount,
        documentsByType,
        avgSimilarity: 0.8, // Placeholder
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Stats retrieval failed:', error);
      return {
        totalDocuments: 0,
        documentsByType: {},
        avgSimilarity: 0,
        lastUpdated: new Date()
      };
    }
  }
}

// Export singleton instance
let vectorStore: VectorStore | null = null;

export function getVectorStore(prisma: PrismaClient): VectorStore {
  if (!vectorStore) {
    vectorStore = new VectorStore(prisma);
  }
  return vectorStore;
}