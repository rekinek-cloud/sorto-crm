/**
 * RAG (Retrieval Augmented Generation) Service
 * Manages vector embeddings and semantic search for CRM data
 * Updated: Now uses pgvector with text-embedding-3-large (3072 dimensions)
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Configuration for text-embedding-3-small (faster, cheaper, 1536 dimensions)
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1536;

interface EmbeddingResult {
  id: string;
  sourceType: string;
  sourceId: string;
  content: string;
  metadata: any;
  similarity: number;
}

interface IndexableDocument {
  sourceType: 'project' | 'task' | 'contact' | 'email' | 'note' | 'deal' | 'stream' | 'wiki' | 'knowledge';
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface RAGSourceInput {
  name: string;
  type?: string;
  content: string;
  contentType?: 'text' | 'markdown' | 'code';
  description?: string;
  streamId?: string;
}

export interface RAGSourceRecord {
  id: string;
  name: string;
  type: string;
  description: string | null;
  chunks_count: number;
  total_tokens: number;
  is_active: boolean;
  stream_id: string | null;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface SearchOptions {
  organizationId?: string;
  sourceType?: string;
  limit?: number;
  threshold?: number;
}

interface RAGConfig {
  embeddingModel: string;
  embeddingDimension: number;
  similarityThreshold: number;
  maxResults: number;
}

export class RAGService {
  private prisma: PrismaClient;
  private organizationId: string;
  private apiKey: string | null = null;
  private static tableInitialized = false;
  private config: RAGConfig = {
    embeddingModel: EMBEDDING_MODEL,
    embeddingDimension: EMBEDDING_DIMENSION,
    similarityThreshold: 0.7,
    maxResults: 10
  };

  constructor(prisma: PrismaClient, organizationId: string) {
    this.prisma = prisma;
    this.organizationId = organizationId;
  }

  /**
   * Ensure rag_sources table exists (created via raw SQL, no Prisma migration needed)
   */
  private async ensureRagSourcesTable(): Promise<void> {
    if (RAGService.tableInitialized) return;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS rag_sources (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'document',
          description TEXT,
          chunks_count INT DEFAULT 0,
          total_tokens INT DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          stream_id TEXT,
          organization_id TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_rag_sources_org ON rag_sources(organization_id)
      `);
      RAGService.tableInitialized = true;
    } catch (error) {
      console.warn('rag_sources table setup warning:', error);
      RAGService.tableInitialized = true;
    }
  }

  // ==================
  // SOURCE MANAGEMENT
  // ==================

  /**
   * List all sources for the organization
   */
  async listSources(): Promise<any[]> {
    await this.ensureRagSourcesTable();
    const sources = await this.prisma.$queryRawUnsafe<RAGSourceRecord[]>(`
      SELECT id, name, type, description, chunks_count as "chunksCount",
             total_tokens as "totalTokens", is_active as "isActive",
             stream_id as "streamId", organization_id as "organizationId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM rag_sources
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, this.organizationId);
    return sources;
  }

  /**
   * Get a single source by ID
   */
  async getSource(id: string): Promise<any | null> {
    await this.ensureRagSourcesTable();
    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, type, description, chunks_count as "chunksCount",
             total_tokens as "totalTokens", is_active as "isActive",
             stream_id as "streamId", organization_id as "organizationId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM rag_sources
      WHERE id = $1 AND organization_id = $2
    `, id, this.organizationId);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Add a new source (from route - index text content)
   */
  async addSource(input: RAGSourceInput): Promise<{ sourceId: string; chunksCount: number }> {
    await this.ensureRagSourcesTable();

    const chunks = this.chunkContent(input.content, 1000);
    const totalTokens = Math.ceil(input.content.length / 4);
    const sourceId = crypto.randomUUID();

    // Create source record
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO rag_sources (id, name, type, description, chunks_count, total_tokens, is_active, stream_id, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
    `, sourceId, input.name, input.type || 'document', input.description || null,
       chunks.length, totalTokens, input.streamId || null, this.organizationId);

    // Index each chunk into vector_documents
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = crypto.randomUUID();
      const contentHash = this.hashContent(chunks[i] + sourceId + i);

      try {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO vector_documents (id, title, content, "contentHash", embedding, "entityType", "entityId", source, language, "chunkIndex", "totalChunks", "chunkSize", "lastUpdated", "organizationId")
          VALUES ($1, $2, $3, $4, '{}', 'rag_source', $5, $6, 'pl', $7, $8, $9, NOW(), $10)
          ON CONFLICT ("contentHash") DO UPDATE SET
            content = EXCLUDED.content,
            "lastUpdated" = NOW()
        `, chunkId, input.name, chunks[i], contentHash, sourceId, input.name, i, chunks.length, chunks[i].length, this.organizationId);
      } catch (error) {
        console.error(`Failed to index chunk ${i} of source ${sourceId}:`, error);
      }
    }

    console.log(`Indexed source "${input.name}" with ${chunks.length} chunks`);
    return { sourceId, chunksCount: chunks.length };
  }

  /**
   * Delete a source and its vector_documents chunks
   */
  async deleteSource(id: string): Promise<void> {
    await this.ensureRagSourcesTable();
    await this.prisma.$executeRawUnsafe(`
      DELETE FROM vector_documents WHERE "entityType" = 'rag_source' AND "entityId" = $1 AND "organizationId" = $2
    `, id, this.organizationId);
    await this.prisma.$executeRawUnsafe(`
      DELETE FROM rag_sources WHERE id = $1 AND organization_id = $2
    `, id, this.organizationId);
  }

  /**
   * Update source active status
   */
  async updateSourceStatus(id: string, isActive: boolean): Promise<void> {
    await this.ensureRagSourcesTable();
    await this.prisma.$executeRawUnsafe(`
      UPDATE rag_sources SET is_active = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3
    `, isActive, id, this.organizationId);
  }

  /**
   * Query with AI-generated answer
   */
  async query(question: string, options: SearchOptions = {}): Promise<{ answer: string; sources: any[] }> {
    const searchResults = await this.search(question, options.limit || 5);

    const sources = searchResults.map(r => ({
      name: r.sourceType === 'rag_source' ? (r.metadata?.name || r.sourceType) : r.sourceType,
      type: r.sourceType,
      similarity: typeof r.similarity === 'number' ? r.similarity : 0.5,
      preview: r.content.substring(0, 200),
    }));

    if (searchResults.length === 0) {
      return {
        answer: 'Nie znaleziono pasujących dokumentów w bazie wiedzy. Dodaj dokumenty w zakładce "Źródła".',
        sources: [],
      };
    }

    let answer = `Na podstawie ${searchResults.length} dokumentów z bazy wiedzy:\n\n`;
    for (const result of searchResults.slice(0, 3)) {
      const preview = result.content.substring(0, 500);
      answer += `${preview}\n\n---\n\n`;
    }

    return { answer: answer.trim(), sources };
  }

  // ==================
  // HELPERS
  // ==================

  private chunkContent(content: string, maxChunkSize: number): string[] {
    if (content.length <= maxChunkSize) return [content];

    const chunks: string[] = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Split oversized chunks by sentences
    return chunks.flatMap(chunk => {
      if (chunk.length <= maxChunkSize) return [chunk];
      const sentences = chunk.match(/[^.!?\n]+[.!?\n]+/g) || [chunk];
      const subChunks: string[] = [];
      let current = '';
      for (const sentence of sentences) {
        if (current.length + sentence.length > maxChunkSize && current.length > 0) {
          subChunks.push(current.trim());
          current = sentence;
        } else {
          current += sentence;
        }
      }
      if (current.trim()) subChunks.push(current.trim());
      return subChunks.length > 0 ? subChunks : [chunk];
    });
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Initialize the RAG service with API key from database
   */
  async initialize(): Promise<void> {
    const provider = await this.prisma.ai_providers.findFirst({
      where: {
        organizationId: this.organizationId,
        name: 'OpenAI',
        status: 'ACTIVE'
      }
    });

    if (provider?.apiKey) {
      this.apiKey = provider.apiKey;
      console.log('✅ RAG Service initialized with OpenAI API key');
    } else {
      console.warn('⚠️ RAG Service: No OpenAI API key found');
    }
  }

  /**
   * Generate embedding for text using OpenAI API
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.apiKey) {
      console.error('RAG Service: API key not configured');
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input: text.substring(0, 8000) // Limit text length
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI Embedding API error:', error);
        return null;
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return null;
    }
  }

  /**
   * Index a single document into the vector store with pgvector
   */
  async indexDocument(doc: IndexableDocument): Promise<boolean> {
    const embedding = await this.generateEmbedding(doc.content);

    if (!embedding) {
      console.error(`Failed to generate embedding for ${doc.sourceType}:${doc.sourceId}`);
      return false;
    }

    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;

      // Try rag_embeddings table first, fallback to vectors table
      try {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO rag_embeddings (organization_id, source_type, source_id, content, metadata, embedding, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6::vector(${EMBEDDING_DIMENSION}), NOW())
          ON CONFLICT (organization_id, source_type, source_id)
          DO UPDATE SET
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        `, this.organizationId, doc.sourceType, doc.sourceId, doc.content,
           JSON.stringify(doc.metadata || {}), vectorString);
      } catch {
        // Fallback to vectors table
        const docId = `${doc.sourceType}-${doc.sourceId}`;
        const metadata = {
          type: doc.sourceType,
          entityId: doc.sourceId,
          organizationId: this.organizationId,
          ...doc.metadata
        };

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO vectors (id, content, metadata, embedding, created_at, updated_at)
          VALUES ($1, $2, $3::jsonb, $4::vector(${EMBEDDING_DIMENSION}), NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        `, docId, doc.content, JSON.stringify(metadata), vectorString);
      }

      console.log(`✅ Indexed ${doc.sourceType}:${doc.sourceId}`);
      return true;
    } catch (error) {
      console.error(`Failed to index document ${doc.sourceType}:${doc.sourceId}:`, error);
      return false;
    }
  }

  /**
   * Semantic search - find similar documents using pgvector or text search
   */
  async search(query: string, limitOrOptions: number | SearchOptions = 10): Promise<EmbeddingResult[]> {
    const limit = typeof limitOrOptions === 'number' ? limitOrOptions : (limitOrOptions.limit || 10);
    try {
      // First try text-based search in vector_documents (our main indexed data)
      let results: EmbeddingResult[] = [];

      // Extract meaningful search terms - filter out common Polish words
      const stopWords = ['pokaż', 'pokaz', 'maile', 'maili', 'mail', 'email', 'wszystkie', 'jakie', 'które', 'ktore', 'znajdź', 'znajdz', 'wyszukaj', 'lista', 'from', 'temat', 'subject', 'jest', 'dużo', 'duzo', 'wiele', 'czy', 'ile'];

      // Normalize Polish word endings (remove common suffixes) - improved version
      const normalizePolish = (word: string): string => {
        const lowerWord = word.toLowerCase();
        // Remove common Polish suffixes to get stem - order matters (longer first)
        const suffixes = ['ami', 'ach', 'ów', 'emu', 'ego', 'ej', 'om', 'ie', 'ym', 'im', 'ą', 'ę', 'y', 'i', 'e'];
        let result = lowerWord;
        for (const suffix of suffixes) {
          // Minimum word length after removing suffix should be 3
          if (lowerWord.length > suffix.length + 2 && lowerWord.endsWith(suffix)) {
            result = lowerWord.slice(0, -suffix.length);
            break;
          }
        }
        return result;
      };

      const searchTerms = query.split(/\s+/)
        .filter(t => t.length > 2) // Allow shorter words (tub, etc)
        .filter(t => !stopWords.includes(t.toLowerCase()))
        .map(t => normalizePolish(t))
        .filter(t => t.length > 2); // Filter after normalization too

      // If we have terms, use ranking query
      if (searchTerms.length > 0) {
        // Build scoring query - count how many terms match
        const matchCases = searchTerms.map((_, i) =>
          `CASE WHEN content ILIKE $${i + 2} OR title ILIKE $${i + 2} THEN 1 ELSE 0 END`
        );
        const scoreExpr = matchCases.join(' + ');
        const whereConditions = searchTerms.map((_, i) =>
          `(content ILIKE $${i + 2} OR title ILIKE $${i + 2})`
        );

        const searchPatterns = searchTerms.map(t => `%${t}%`);

        try {
          const sqlQuery = `
            SELECT
              id,
              "entityType" as "sourceType",
              "entityId" as "sourceId",
              content,
              '{}'::jsonb as metadata,
              (${scoreExpr})::float / ${searchTerms.length} as similarity
            FROM vector_documents
            WHERE "organizationId" = $1
              AND (${whereConditions.join(' OR ')})
            ORDER BY (${scoreExpr}) DESC, "lastUpdated" DESC
            LIMIT $${searchPatterns.length + 2}
          `;

          results = await this.prisma.$queryRawUnsafe<any[]>(
            sqlQuery,
            this.organizationId,
            ...searchPatterns,
            limit
          );

          if (results.length > 0) {
            console.log(`🔍 [RAG] Text search found ${results.length} results for: "${query.substring(0, 50)}..."`);
            return results;
          }
        } catch (textSearchError) {
          console.warn('Text search failed, trying fallback:', textSearchError);
        }
      }

      // Fallback - simple pattern search
      const fallbackPattern = `%${query.replace(/\s+/g, '%')}%`;
      try {
        results = await this.prisma.$queryRawUnsafe<any[]>(`
          SELECT
            id,
            "entityType" as "sourceType",
            "entityId" as "sourceId",
            content,
            '{}'::jsonb as metadata,
            0.7 as similarity
          FROM vector_documents
          WHERE "organizationId" = $1
            AND (content ILIKE $2 OR title ILIKE $2)
          ORDER BY "lastUpdated" DESC
          LIMIT $3
        `, this.organizationId, fallbackPattern, limit);

        if (results.length > 0) {
          console.log(`🔍 [RAG] Fallback search found ${results.length} results`);
          return results;
        }
      } catch (fallbackError) {
        console.warn('Fallback search failed:', fallbackError);
      }

      // Fallback to vector-based search if we have embeddings
      const queryEmbedding = await this.generateEmbedding(query);

      if (queryEmbedding) {
        const vectorString = `[${queryEmbedding.join(',')}]`;

        try {
          results = await this.prisma.$queryRawUnsafe<any[]>(`
            SELECT
              id,
              source_type as "sourceType",
              source_id as "sourceId",
              content,
              metadata,
              1 - (embedding <=> $1::vector(${EMBEDDING_DIMENSION})) as similarity
            FROM rag_embeddings
            WHERE organization_id = $2
              AND embedding IS NOT NULL
              AND 1 - (embedding <=> $1::vector(${EMBEDDING_DIMENSION})) > $4
            ORDER BY embedding <=> $1::vector(${EMBEDDING_DIMENSION})
            LIMIT $3
          `, vectorString, this.organizationId, limit, this.config.similarityThreshold);
        } catch {
          // Try vectors table
          try {
            results = await this.prisma.$queryRawUnsafe<any[]>(`
              SELECT
                id,
                metadata->>'type' as "sourceType",
                metadata->>'entityId' as "sourceId",
                content,
                metadata,
                1 - (embedding <=> $1::vector(${EMBEDDING_DIMENSION})) as similarity
              FROM vectors
              WHERE metadata->>'organizationId' = $2
                AND embedding IS NOT NULL
                AND 1 - (embedding <=> $1::vector(${EMBEDDING_DIMENSION})) > $4
              ORDER BY embedding <=> $1::vector(${EMBEDDING_DIMENSION})
              LIMIT $3
            `, vectorString, this.organizationId, limit, this.config.similarityThreshold);
          } catch {
            // Vector search not available
          }
        }
      }

      console.log(`🔍 [RAG] Search found ${results.length} results for: "${query.substring(0, 50)}..."`);
      return results;
    } catch (error) {
      console.error('RAG search failed:', error);
      return [];
    }
  }

  /**
   * Index all CRM data for the organization
   */
  async indexAllData(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log('🔄 Starting full data indexing...');

    // Index Projects
    const projects = await this.prisma.project.findMany({
      where: { organizationId: this.organizationId },
      include: { tasks: { take: 10 } }
    });

    for (const project of projects) {
      const content = this.buildProjectContent(project);
      const indexed = await this.indexDocument({
        sourceType: 'project',
        sourceId: project.id,
        content,
        metadata: {
          name: project.name,
          status: project.status,
          priority: project.priority
        }
      });
      indexed ? success++ : failed++;
    }

    // Index Tasks
    const tasks = await this.prisma.task.findMany({
      where: { organizationId: this.organizationId },
      include: { project: true, contact: true }
    });

    for (const task of tasks) {
      const content = this.buildTaskContent(task);
      const indexed = await this.indexDocument({
        sourceType: 'task',
        sourceId: task.id,
        content,
        metadata: {
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate
        }
      });
      indexed ? success++ : failed++;
    }

    // Index Contacts
    const contacts = await this.prisma.contact.findMany({
      where: { organizationId: this.organizationId },
      include: { company: true }
    });

    for (const contact of contacts) {
      const content = this.buildContactContent(contact);
      const indexed = await this.indexDocument({
        sourceType: 'contact',
        sourceId: contact.id,
        content,
        metadata: {
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          company: contact.company?.name
        }
      });
      indexed ? success++ : failed++;
    }

    // Index Deals
    const deals = await this.prisma.deal.findMany({
      where: { organizationId: this.organizationId },
      include: { contact: true, company: true }
    });

    for (const deal of deals) {
      const content = this.buildDealContent(deal);
      const indexed = await this.indexDocument({
        sourceType: 'deal',
        sourceId: deal.id,
        content,
        metadata: {
          name: deal.name,
          value: deal.value,
          stage: deal.stage,
          probability: deal.probability
        }
      });
      indexed ? success++ : failed++;
    }

    // Index Streams
    const streams = await this.prisma.stream.findMany({
      where: { organizationId: this.organizationId }
    });

    for (const stream of streams) {
      const content = this.buildStreamContent(stream);
      const indexed = await this.indexDocument({
        sourceType: 'stream',
        sourceId: stream.id,
        content,
        metadata: {
          name: stream.name,
          streamType: stream.streamType,
          gtdRole: stream.gtdRole
        }
      });
      indexed ? success++ : failed++;
    }

    console.log(`✅ Indexing complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Get RAG context for a query
   */
  async getContext(query: string, maxTokens: number = 3000): Promise<string> {
    // Get more results to find relevant ones
    const results = await this.search(query, 15);

    if (results.length === 0) {
      return '';
    }

    let context = '=== Kontekst z bazy wiedzy ===\n\n';
    let currentTokens = 0;

    for (const result of results) {
      const contentTokens = Math.ceil(result.content.length / 4);

      if (currentTokens + contentTokens > maxTokens) {
        break;
      }

      context += `[${result.sourceType.toUpperCase()}] (trafność: ${Math.round(result.similarity * 100)}%)\n`;
      context += result.content + '\n\n---\n\n';
      currentTokens += contentTokens;
    }

    return context;
  }

  /**
   * Delete embedding for a document
   */
  async deleteDocument(sourceType: string, sourceId: string): Promise<boolean> {
    try {
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM rag_embeddings
        WHERE organization_id = $1 AND source_type = $2 AND source_id = $3
      `, this.organizationId, sourceType, sourceId);
      return true;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Get indexing statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    byType: Record<string, number>;
    lastIndexed: Date | null;
  }> {
    // Try vector_documents first (our main table)
    try {
      const stats = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT
          "entityType" as source_type,
          COUNT(*) as count,
          MAX("lastUpdated") as last_updated
        FROM vector_documents
        WHERE "organizationId" = $1
        GROUP BY "entityType"
      `, this.organizationId);

      const byType: Record<string, number> = {};
      let totalDocuments = 0;
      let lastIndexed: Date | null = null;

      for (const stat of stats) {
        byType[stat.source_type] = parseInt(stat.count);
        totalDocuments += parseInt(stat.count);
        if (!lastIndexed || new Date(stat.last_updated) > lastIndexed) {
          lastIndexed = new Date(stat.last_updated);
        }
      }

      if (totalDocuments > 0) {
        return { totalDocuments, byType, lastIndexed };
      }
    } catch {
      // Fallback to rag_embeddings
    }

    // Fallback to rag_embeddings table
    const stats = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        source_type,
        COUNT(*) as count,
        MAX(updated_at) as last_updated
      FROM rag_embeddings
      WHERE organization_id = $1
      GROUP BY source_type
    `, this.organizationId);

    const byType: Record<string, number> = {};
    let totalDocuments = 0;
    let lastIndexed: Date | null = null;

    for (const stat of stats) {
      byType[stat.source_type] = parseInt(stat.count);
      totalDocuments += parseInt(stat.count);
      if (!lastIndexed || new Date(stat.last_updated) > lastIndexed) {
        lastIndexed = new Date(stat.last_updated);
      }
    }

    return { totalDocuments, byType, lastIndexed };
  }

  // ===== Content Builders =====

  private buildProjectContent(project: any): string {
    let content = `Projekt: ${project.name}\n`;
    content += `Status: ${project.status}\n`;
    content += `Priorytet: ${project.priority || 'Brak'}\n`;

    if (project.description) {
      content += `Opis: ${project.description}\n`;
    }

    if (project.tasks && project.tasks.length > 0) {
      content += `\nZadania projektu:\n`;
      for (const task of project.tasks) {
        content += `- ${task.title} (${task.status})\n`;
      }
    }

    return content;
  }

  private buildTaskContent(task: any): string {
    let content = `Zadanie: ${task.title}\n`;
    content += `Status: ${task.status}\n`;
    content += `Priorytet: ${task.priority || 'Brak'}\n`;

    if (task.description) {
      content += `Opis: ${task.description}\n`;
    }

    if (task.dueDate) {
      content += `Termin: ${new Date(task.dueDate).toLocaleDateString('pl-PL')}\n`;
    }

    if (task.project) {
      content += `Projekt: ${task.project.name}\n`;
    }

    if (task.contact) {
      content += `Kontakt: ${task.contact.firstName} ${task.contact.lastName}\n`;
    }

    return content;
  }

  private buildContactContent(contact: any): string {
    let content = `Kontakt: ${contact.firstName} ${contact.lastName}\n`;

    if (contact.email) {
      content += `Email: ${contact.email}\n`;
    }

    if (contact.phone) {
      content += `Telefon: ${contact.phone}\n`;
    }

    if (contact.position) {
      content += `Stanowisko: ${contact.position}\n`;
    }

    if (contact.company) {
      content += `Firma: ${contact.company.name}\n`;
    }

    if (contact.notes) {
      content += `Notatki: ${contact.notes}\n`;
    }

    return content;
  }

  private buildDealContent(deal: any): string {
    let content = `Deal: ${deal.name}\n`;
    content += `Wartość: ${deal.value} ${deal.currency || 'PLN'}\n`;
    content += `Etap: ${deal.stage}\n`;
    content += `Prawdopodobieństwo: ${deal.probability || 0}%\n`;

    if (deal.description) {
      content += `Opis: ${deal.description}\n`;
    }

    if (deal.contact) {
      content += `Kontakt: ${deal.contact.firstName} ${deal.contact.lastName}\n`;
    }

    if (deal.company) {
      content += `Firma: ${deal.company.name}\n`;
    }

    return content;
  }

  private buildStreamContent(stream: any): string {
    let content = `Strumień: ${stream.name}\n`;
    content += `Typ: ${stream.streamType}\n`;

    if (stream.gtdRole) {
      content += `Rola: ${stream.gtdRole}\n`;
    }

    if (stream.description) {
      content += `Opis: ${stream.description}\n`;
    }

    return content;
  }
}
