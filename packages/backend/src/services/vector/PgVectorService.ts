/**
 * PgVector Service - Prawdziwy similarity search z pgvector
 * Model: text-embedding-3-large (3072 dimensions)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

export interface EmbeddingConfig {
  model: 'text-embedding-3-small' | 'text-embedding-ada-002' | 'text-embedding-3-large';
  dimensions: number;
}

export type DocumentType =
  | 'task'
  | 'project'
  | 'contact'
  | 'company'
  | 'deal'
  | 'email'
  | 'note'
  | 'wiki'
  | 'knowledge'
  | 'stream'
  | 'communication'
  | 'external';

export interface VectorDocument {
  id?: string;
  content: string;
  metadata: {
    type: DocumentType;
    entityId: string;
    userId?: string;
    organizationId: string;
    source?: string;
    title?: string;
    tags?: string[];
    importance?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  types?: DocumentType[];
  userId?: string;
  dateRange?: { from: Date; to: Date };
  includeExternal?: boolean;
}

export interface RAGContext {
  documents: SearchResult[];
  formattedContext: string;
  tokensUsed: number;
}

export interface VectorStats {
  totalDocuments: number;
  withEmbeddings: number;
  byType: Record<string, number>;
}

// ============================================
// PGVECTOR SERVICE
// ============================================

export class PgVectorService {
  private prisma: PrismaClient;
  private openai: OpenAI | null = null;
  private initialized = false;

  private config: EmbeddingConfig = {
    model: 'text-embedding-3-large',
    dimensions: 3072
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    console.log('🧠 PgVectorService initialized');
  }

  /**
   * Inicjalizacja klienta OpenAI
   */
  async initialize(organizationId: string): Promise<boolean> {
    if (this.initialized && this.openai) {
      return true;
    }

    try {
      // Pobierz klucz API z bazy danych
      const provider = await this.prisma.ai_providers.findFirst({
        where: {
          organizationId,
          name: { contains: 'openai', mode: 'insensitive' },
          status: 'ACTIVE'
        }
      });

      const apiKey = (provider?.config as any)?.apiKey;
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        this.initialized = true;
        console.log('✅ PgVectorService: OpenAI client initialized from database');
        return true;
      }

      // Fallback do zmiennej środowiskowej
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.initialized = true;
        console.log('✅ PgVectorService: Using OPENAI_API_KEY from environment');
        return true;
      }

      console.warn('⚠️ PgVectorService: No OpenAI API key configured');
      return false;
    } catch (error) {
      console.error('❌ PgVectorService initialization failed:', error);
      return false;
    }
  }

  /**
   * Sprawdź czy pgvector jest zainstalowany
   */
  async checkPgVectorInstalled(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<{ extversion: string }[]>`
        SELECT extversion FROM pg_extension WHERE extname = 'vector'
      `;
      if (result.length > 0) {
        console.log(`✅ pgvector version: ${result[0].extversion}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ pgvector not installed:', error);
      return false;
    }
  }

  /**
   * Generowanie embeddings przez OpenAI
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Call initialize() first.');
    }

    // Limit tekstu do 8000 znaków dla bezpieczeństwa
    const cleanedText = text.trim().substring(0, 8000);

    if (!cleanedText) {
      throw new Error('Empty text provided for embedding');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: cleanedText,
        encoding_format: 'float'
      });

      const embedding = response.data[0].embedding;

      if (embedding.length !== this.config.dimensions) {
        console.warn(`⚠️ Embedding dimension mismatch: expected ${this.config.dimensions}, got ${embedding.length}`);
      }

      return embedding;
    } catch (error: any) {
      console.error('❌ Embedding creation failed:', error.message);
      throw new Error(`Failed to create embedding: ${error.message}`);
    }
  }

  /**
   * Zapisanie dokumentu z embeddingiem
   */
  async storeDocument(
    organizationId: string,
    document: VectorDocument
  ): Promise<string> {
    const id = document.id || uuidv4();

    // Generuj embedding
    const embedding = await this.createEmbedding(document.content);
    const embeddingStr = `[${embedding.join(',')}]`;

    // Przygotuj metadata
    const metadata = {
      ...document.metadata,
      organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Użyj funkcji upsert z SQL
      await this.prisma.$executeRaw`
        SELECT upsert_vector(
          ${id}::varchar,
          ${document.content}::text,
          ${JSON.stringify(metadata)}::jsonb,
          ${embeddingStr}::vector(3072)
        )
      `;

      console.log(`✅ Stored vector document: ${id} (type: ${document.metadata.type})`);
      return id;
    } catch (error: any) {
      // Fallback jeśli funkcja nie istnieje
      if (error.message.includes('upsert_vector')) {
        await this.prisma.$executeRaw`
          INSERT INTO vectors (id, content, metadata, embedding, created_at, updated_at)
          VALUES (
            ${id},
            ${document.content},
            ${JSON.stringify(metadata)}::jsonb,
            ${embeddingStr}::vector(3072),
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        `;
        console.log(`✅ Stored vector document (fallback): ${id}`);
        return id;
      }
      throw error;
    }
  }

  /**
   * Batch store - zapisywanie wielu dokumentów
   */
  async storeDocuments(
    organizationId: string,
    documents: VectorDocument[]
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const doc of documents) {
      try {
        const id = await this.storeDocument(organizationId, doc);
        ids.push(id);
      } catch (error) {
        console.error(`Failed to store document: ${doc.metadata.entityId}`, error);
      }
    }

    console.log(`✅ Stored ${ids.length}/${documents.length} documents`);
    return ids;
  }

  /**
   * Semantyczne wyszukiwanie z pgvector
   */
  async search(
    organizationId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      types,
      includeExternal = false
    } = options;

    // Generuj embedding dla zapytania
    const queryEmbedding = await this.createEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    try {
      let results: SearchResult[];

      if (types && types.length > 0) {
        // Wyszukiwanie z filtrem typu
        results = await this.prisma.$queryRaw<SearchResult[]>`
          SELECT
            id,
            content,
            metadata,
            1 - (embedding <=> ${embeddingStr}::vector(3072)) as similarity
          FROM vectors
          WHERE metadata->>'organizationId' = ${organizationId}
            AND embedding IS NOT NULL
            AND metadata->>'type' = ANY(${types}::text[])
            AND 1 - (embedding <=> ${embeddingStr}::vector(3072)) > ${threshold}
          ORDER BY embedding <=> ${embeddingStr}::vector(3072)
          LIMIT ${limit}
        `;
      } else {
        // Wyszukiwanie bez filtra typu
        let typeFilter = '';
        if (!includeExternal) {
          typeFilter = "AND metadata->>'type' != 'external'";
        }

        results = await this.prisma.$queryRawUnsafe<SearchResult[]>(`
          SELECT
            id,
            content,
            metadata,
            1 - (embedding <=> $1::vector(3072)) as similarity
          FROM vectors
          WHERE metadata->>'organizationId' = $2
            AND embedding IS NOT NULL
            ${typeFilter}
            AND 1 - (embedding <=> $1::vector(3072)) > $3
          ORDER BY embedding <=> $1::vector(3072)
          LIMIT $4
        `, embeddingStr, organizationId, threshold, limit);
      }

      console.log(`🔍 Search found ${results.length} results for: "${query.substring(0, 50)}..."`);
      return results;
    } catch (error: any) {
      console.error('❌ Search failed:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Pobranie kontekstu RAG dla zapytania
   */
  async getRAGContext(
    organizationId: string,
    query: string,
    maxTokens: number = 4000
  ): Promise<RAGContext> {
    const results = await this.search(organizationId, query, {
      limit: 10,
      threshold: 0.6
    });

    if (results.length === 0) {
      return {
        documents: [],
        formattedContext: '',
        tokensUsed: 0
      };
    }

    let context = '=== Kontekst z bazy wiedzy ===\n\n';
    let currentTokens = 0;
    const includedDocs: SearchResult[] = [];

    for (const result of results) {
      // Szacuj tokeny (1 token ≈ 4 znaki)
      const contentTokens = Math.ceil(result.content.length / 4);

      if (currentTokens + contentTokens > maxTokens) {
        break;
      }

      const metadata = typeof result.metadata === 'string'
        ? JSON.parse(result.metadata)
        : result.metadata;

      const type = metadata.type?.toUpperCase() || 'DOC';
      const title = metadata.title || '';
      const similarity = Math.round(result.similarity * 100);

      context += `[${type}] (trafność: ${similarity}%)\n`;
      if (title) context += `Tytuł: ${title}\n`;
      context += result.content + '\n\n---\n\n';

      currentTokens += contentTokens;
      includedDocs.push(result);
    }

    return {
      documents: includedDocs,
      formattedContext: context,
      tokensUsed: currentTokens
    };
  }

  /**
   * Usunięcie dokumentu
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await this.prisma.$executeRaw`DELETE FROM vectors WHERE id = ${id}`;
      console.log(`🗑️ Deleted vector: ${id}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete vector:', error);
      return false;
    }
  }

  /**
   * Usunięcie dokumentów po entityId
   */
  async deleteByEntityId(organizationId: string, entityId: string): Promise<number> {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM vectors
        WHERE metadata->>'organizationId' = ${organizationId}
          AND metadata->>'entityId' = ${entityId}
      `;
      console.log(`🗑️ Deleted ${result} vectors for entity: ${entityId}`);
      return Number(result);
    } catch (error) {
      console.error('❌ Failed to delete vectors by entityId:', error);
      return 0;
    }
  }

  /**
   * Statystyki
   */
  async getStats(organizationId: string): Promise<VectorStats> {
    try {
      const [total, withEmbed, byType] = await Promise.all([
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM vectors
          WHERE metadata->>'organizationId' = ${organizationId}
        `,
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM vectors
          WHERE metadata->>'organizationId' = ${organizationId}
            AND embedding IS NOT NULL
        `,
        this.prisma.$queryRaw<{ type: string; count: bigint }[]>`
          SELECT metadata->>'type' as type, COUNT(*) as count
          FROM vectors
          WHERE metadata->>'organizationId' = ${organizationId}
          GROUP BY metadata->>'type'
        `
      ]);

      return {
        totalDocuments: Number(total[0]?.count || 0),
        withEmbeddings: Number(withEmbed[0]?.count || 0),
        byType: byType.reduce((acc, row) => {
          if (row.type) acc[row.type] = Number(row.count);
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      return {
        totalDocuments: 0,
        withEmbeddings: 0,
        byType: {}
      };
    }
  }

  /**
   * Podobieństwo między dwoma tekstami
   */
  async getSimilarity(text1: string, text2: string): Promise<number> {
    const [emb1, emb2] = await Promise.all([
      this.createEmbedding(text1),
      this.createEmbedding(text2)
    ]);

    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < emb1.length; i++) {
      dotProduct += emb1[i] * emb2[i];
      norm1 += emb1[i] * emb1[i];
      norm2 += emb2[i] * emb2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Znajdź duplikaty
   */
  async findDuplicates(
    organizationId: string,
    content: string,
    threshold: number = 0.95
  ): Promise<SearchResult[]> {
    return this.search(organizationId, content, {
      limit: 5,
      threshold
    });
  }
}

// ============================================
// SINGLETON
// ============================================

let pgVectorService: PgVectorService | null = null;

export function getPgVectorService(prisma: PrismaClient): PgVectorService {
  if (!pgVectorService) {
    pgVectorService = new PgVectorService(prisma);
  }
  return pgVectorService;
}

export default PgVectorService;
