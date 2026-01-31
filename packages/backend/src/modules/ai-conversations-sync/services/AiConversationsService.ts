import { PrismaClient } from '@prisma/client';
import {
  AiSourceType,
  ChunkData,
  ClassificationResult,
  ParsedConversation,
  SyncStatusType,
} from '../types';
import { ChunkerService } from './ChunkerService';
import { ClassifierService } from './ClassifierService';
import { DeduplicatorService } from './DeduplicatorService';
import { EmbedderService } from './EmbedderService';

export class AiConversationsService {
  private prisma: PrismaClient;
  private chunker: ChunkerService;
  private classifier: ClassifierService;
  private deduplicator: DeduplicatorService;
  private embedder: EmbedderService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.chunker = new ChunkerService();
    this.classifier = new ClassifierService();
    this.deduplicator = new DeduplicatorService();
    this.embedder = new EmbedderService();
  }

  /**
   * Import a parsed conversation
   */
  async importConversation(
    organizationId: string,
    conversation: ParsedConversation,
    streamId?: string
  ): Promise<{ id: string; isNew: boolean }> {
    const hash = this.deduplicator.generateHash(conversation);

    // Check if already exists
    const existing = await this.deduplicator.checkExists(this.prisma, organizationId, hash);
    if (existing.exists && existing.conversationId) {
      return { id: existing.conversationId, isNew: false };
    }

    // Classify conversation
    const classification = this.classifier.classify(conversation);

    // Create conversation with messages
    const created = await this.prisma.aiConversation.create({
      data: {
        organizationId,
        streamId,
        source: conversation.source,
        externalId: conversation.externalId,
        hash,
        title: conversation.title,
        appName: classification.appName,
        classificationScore: classification.score,
        messageCount: conversation.messages.length,
        sourceCreatedAt: conversation.createdAt,
        sourceUpdatedAt: conversation.updatedAt,
        messages: {
          create: conversation.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            messageIndex: msg.messageIndex,
            model: msg.model,
            timestamp: msg.timestamp,
          })),
        },
      },
    });

    return { id: created.id, isNew: true };
  }

  /**
   * Index conversation for RAG (create chunks with embeddings)
   */
  async indexConversation(conversationId: string): Promise<number> {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Prepare parsed conversation for chunking
    const parsedConversation: ParsedConversation = {
      source: conversation.source as AiSourceType,
      externalId: conversation.externalId,
      title: conversation.title,
      messages: conversation.messages.map((m: {
        role: string;
        content: string;
        messageIndex: number;
        model: string | null;
        timestamp: Date | null;
      }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        messageIndex: m.messageIndex,
        model: m.model || undefined,
        timestamp: m.timestamp || undefined,
      })),
    };

    // Create chunks
    const chunks = await this.chunker.chunkConversation(parsedConversation);

    // Generate embeddings
    const chunksWithEmbeddings = await this.embedder.embedChunksWithRateLimit(chunks);

    // Store chunks with embeddings using raw SQL (pgvector)
    for (const chunk of chunksWithEmbeddings) {
      const embeddingStr = `[${chunk.embedding?.join(',')}]`;
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO ai_conversation_chunks (id, conversation_id, content, chunk_index, token_count, embedding)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector)
      `, conversationId, chunk.content, chunk.chunkIndex, chunk.tokenCount, embeddingStr);
    }

    // Update conversation as indexed
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: {
        isIndexed: true,
        indexedAt: new Date(),
        tokenCount: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
      },
    });

    return chunks.length;
  }

  /**
   * Search conversations using vector similarity
   */
  async searchConversations(
    organizationId: string,
    query: string,
    options: {
      limit?: number;
      appName?: string;
      source?: AiSourceType;
    } = {}
  ): Promise<
    {
      conversationId: string;
      chunkId: string;
      content: string;
      similarity: number;
      title: string;
      appName: string | null;
      source: string;
    }[]
  > {
    const { limit = 10, appName, source } = options;

    // Generate query embedding
    const queryEmbedding = await this.embedder.embedQuery(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Execute vector search
    const results = await this.prisma.$queryRawUnsafe<
      {
        conversation_id: string;
        chunk_id: string;
        chunk_content: string;
        similarity: number;
        conversation_title: string;
        app_name: string | null;
        source: string;
      }[]
    >(
      `SELECT * FROM search_ai_conversations($1, $2::vector, $3, $4, $5)`,
      organizationId,
      embeddingStr,
      limit,
      appName || null,
      source || null
    );

    return results.map((r) => ({
      conversationId: r.conversation_id,
      chunkId: r.chunk_id,
      content: r.chunk_content,
      similarity: r.similarity,
      title: r.conversation_title,
      appName: r.app_name,
      source: r.source,
    }));
  }

  /**
   * Get conversations by organization
   */
  async getConversations(
    organizationId: string,
    options: {
      source?: AiSourceType;
      appName?: string;
      streamId?: string;
      isIndexed?: boolean;
      skip?: number;
      take?: number;
    } = {}
  ) {
    const { source, appName, streamId, isIndexed, skip = 0, take = 50 } = options;

    return this.prisma.aiConversation.findMany({
      where: {
        organizationId,
        ...(source && { source }),
        ...(appName && { appName }),
        ...(streamId && { streamId }),
        ...(isIndexed !== undefined && { isIndexed }),
      },
      include: {
        _count: {
          select: { messages: true, chunks: true },
        },
      },
      orderBy: { importedAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Get conversation with messages
   */
  async getConversation(conversationId: string) {
    return this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { messageIndex: 'asc' },
        },
        stream: true,
      },
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.prisma.aiConversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Get or create REFERENCE stream for app
   */
  async getOrCreateReferenceStream(
    organizationId: string,
    appName: string,
    createdById: string
  ): Promise<string> {
    // Check if stream exists for this app
    const existing = await this.prisma.stream.findFirst({
      where: {
        organizationId,
        streamType: 'REFERENCE',
        name: `AI: ${appName}`,
      },
    });

    if (existing) return existing.id;

    // Create new REFERENCE stream
    const stream = await this.prisma.stream.create({
      data: {
        organizationId,
        createdById,
        name: `AI: ${appName}`,
        description: `AI Knowledge Base dla ${appName}`,
        streamType: 'REFERENCE',
        color: '#8B5CF6', // Purple for AI
        icon: 'brain',
        aiKeywords: [appName],
      },
    });

    return stream.id;
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    organizationId: string,
    source: AiSourceType,
    status: SyncStatusType,
    data: {
      conversationsCount?: number;
      lastFileHash?: string;
      lastError?: string;
      dropboxPath?: string;
      dropboxCursor?: string;
    } = {}
  ): Promise<void> {
    await this.prisma.aiSyncStatus.upsert({
      where: {
        organizationId_source: {
          organizationId,
          source,
        },
      },
      create: {
        organizationId,
        source,
        status,
        lastSyncAt: status === 'COMPLETED' ? new Date() : undefined,
        ...data,
      },
      update: {
        status,
        lastSyncAt: status === 'COMPLETED' ? new Date() : undefined,
        ...data,
      },
    });
  }

  /**
   * Get sync status
   */
  async getSyncStatus(organizationId: string, source?: AiSourceType) {
    if (source) {
      return this.prisma.aiSyncStatus.findUnique({
        where: {
          organizationId_source: {
            organizationId,
            source,
          },
        },
      });
    }

    return this.prisma.aiSyncStatus.findMany({
      where: { organizationId },
    });
  }

  /**
   * Get app mappings
   */
  async getAppMappings(organizationId: string) {
    return this.prisma.aiAppMapping.findMany({
      where: { organizationId },
      orderBy: { conversationsCount: 'desc' },
    });
  }

  /**
   * Update app mapping statistics
   */
  async updateAppMappingStats(organizationId: string, appName: string): Promise<void> {
    const stats = await this.prisma.aiConversation.aggregate({
      where: {
        organizationId,
        appName,
      },
      _count: true,
      _sum: { messageCount: true },
    });

    await this.prisma.aiAppMapping.upsert({
      where: {
        organizationId_appName: {
          organizationId,
          appName,
        },
      },
      create: {
        organizationId,
        appName,
        keywords: [],
        conversationsCount: stats._count || 0,
        messagesCount: stats._sum.messageCount || 0,
      },
      update: {
        conversationsCount: stats._count || 0,
        messagesCount: stats._sum.messageCount || 0,
      },
    });
  }
}
