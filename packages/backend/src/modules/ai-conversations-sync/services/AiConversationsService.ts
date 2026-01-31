import { PrismaClient } from '@prisma/client';
import { VectorService } from '../../../services/VectorService';
import {
  AiSourceType,
  ParsedConversation,
} from '../types';
import { ClassifierService } from './ClassifierService';
import { DeduplicatorService } from './DeduplicatorService';

export interface AiConversation {
  id: string;
  title: string;
  source: AiSourceType;
  appName: string | null;
  chunkCount: number;
  importedAt: string;
  isIndexed: boolean;
}

export interface AiConversationDetail extends AiConversation {
  content: string;
}

export interface SearchResult {
  conversationId: string;
  content: string;
  similarity: number;
  title: string;
  source: string;
}

export class AiConversationsService {
  private prisma: PrismaClient;
  private vectorService: VectorService;
  private classifier: ClassifierService;
  private deduplicator: DeduplicatorService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.vectorService = new VectorService(prisma);
    this.classifier = new ClassifierService();
    this.deduplicator = new DeduplicatorService();
  }

  /**
   * Import a parsed conversation using VectorService
   * Stores in vector_documents with entityType = 'ai_conversation'
   */
  async importConversation(
    organizationId: string,
    conversation: ParsedConversation
  ): Promise<{ id: string; isNew: boolean; chunkCount: number }> {
    const hash = this.deduplicator.generateHash(conversation);

    // Check if already exists in vector_documents
    const existing = await this.prisma.vector_documents.findFirst({
      where: {
        organizationId,
        entityType: 'ai_conversation',
        entityId: hash,
      },
    });

    if (existing) {
      const chunkCount = await this.prisma.vector_documents.count({
        where: {
          organizationId,
          entityType: 'ai_conversation',
          entityId: hash,
        },
      });
      return { id: hash, isNew: false, chunkCount };
    }

    // Classify conversation to determine appName
    const classification = this.classifier.classify(conversation);

    // Build full content from messages
    const fullContent = conversation.messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    // Source format: CHATGPT:appName or CLAUDE:appName
    const sourceWithApp = classification.appName
      ? `${conversation.source}:${classification.appName}`
      : conversation.source;

    // Use VectorService to create vector documents with embeddings
    const documentIds = await this.vectorService.createVectorDocument(
      organizationId,
      conversation.title,
      fullContent,
      'ai_conversation',
      hash,
      {
        source: sourceWithApp,
        language: 'auto',
        chunkSize: 1000,
      }
    );

    return { id: hash, isNew: true, chunkCount: documentIds.length };
  }

  /**
   * Search conversations using VectorService
   */
  async searchConversations(
    organizationId: string,
    query: string,
    options: {
      limit?: number;
      appName?: string;
      source?: AiSourceType;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, appName, source } = options;

    let sourceFilter: string | undefined;
    if (source && appName) {
      sourceFilter = `${source}:${appName}`;
    } else if (source) {
      sourceFilter = source;
    } else if (appName) {
      sourceFilter = appName;
    }

    const response = await this.vectorService.searchSimilar(organizationId, query, {
      limit,
      threshold: 0.5,
      filters: {
        entityType: 'ai_conversation',
        ...(sourceFilter && { source: sourceFilter }),
      },
    });

    return response.results.map((r) => ({
      conversationId: r.entityId,
      content: r.content,
      similarity: r.similarity,
      title: r.title,
      source: r.metadata.source,
    }));
  }

  /**
   * Get conversations from vector_documents
   */
  async getConversations(
    organizationId: string,
    options: {
      source?: AiSourceType;
      appName?: string;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<AiConversation[]> {
    const { source, appName, skip = 0, take = 50 } = options;

    const conversations = await this.prisma.vector_documents.findMany({
      where: {
        organizationId,
        entityType: 'ai_conversation',
        chunkIndex: 0,
        ...(source && { source: { startsWith: source } }),
        ...(appName && { source: { contains: `:${appName}` } }),
      },
      orderBy: { processingDate: 'desc' },
      skip,
      take,
    });

    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const chunkCount = await this.prisma.vector_documents.count({
          where: {
            organizationId,
            entityType: 'ai_conversation',
            entityId: conv.entityId,
          },
        });

        const sourceParts = conv.source.split(':');
        const aiSource = sourceParts[0] as AiSourceType;
        const extractedAppName = sourceParts[1] || null;

        return {
          id: conv.entityId,
          title: conv.title,
          source: aiSource,
          appName: extractedAppName,
          chunkCount,
          importedAt: conv.processingDate.toISOString(),
          isIndexed: true,
        };
      })
    );

    return conversationsWithCounts;
  }

  /**
   * Get single conversation with full content
   */
  async getConversation(
    organizationId: string,
    conversationId: string
  ): Promise<AiConversationDetail | null> {
    const chunks = await this.prisma.vector_documents.findMany({
      where: {
        organizationId,
        entityType: 'ai_conversation',
        entityId: conversationId,
      },
      orderBy: { chunkIndex: 'asc' },
    });

    if (chunks.length === 0) return null;

    const fullContent = chunks.map((c) => c.content).join('\n\n');
    const firstChunk = chunks[0];
    const sourceParts = firstChunk.source.split(':');

    return {
      id: conversationId,
      title: firstChunk.title.replace(/ \(Part \d+\)$/, ''),
      source: sourceParts[0] as AiSourceType,
      appName: sourceParts[1] || null,
      chunkCount: chunks.length,
      importedAt: firstChunk.processingDate.toISOString(),
      isIndexed: true,
      content: fullContent,
    };
  }

  /**
   * Delete conversation
   */
  async deleteConversation(organizationId: string, conversationId: string): Promise<void> {
    await this.prisma.vector_documents.deleteMany({
      where: {
        organizationId,
        entityType: 'ai_conversation',
        entityId: conversationId,
      },
    });
  }

  /**
   * Delete all conversations by source
   */
  async deleteBySource(organizationId: string, source: AiSourceType): Promise<number> {
    const result = await this.prisma.vector_documents.deleteMany({
      where: {
        organizationId,
        entityType: 'ai_conversation',
        source: { startsWith: source },
      },
    });
    return result.count;
  }

  /**
   * Get summary statistics
   */
  async getSummary(organizationId: string): Promise<{
    totalConversations: number;
    indexedConversations: number;
    bySource: Record<string, number>;
    byApp: Record<string, number>;
  }> {
    const conversations = await this.prisma.vector_documents.findMany({
      where: {
        organizationId,
        entityType: 'ai_conversation',
        chunkIndex: 0,
      },
      select: { source: true },
    });

    const bySource: Record<string, number> = {};
    const byApp: Record<string, number> = {};

    for (const conv of conversations) {
      const sourceParts = conv.source.split(':');
      const aiSource = sourceParts[0];
      const appName = sourceParts[1] || 'Unclassified';

      bySource[aiSource] = (bySource[aiSource] || 0) + 1;
      byApp[appName] = (byApp[appName] || 0) + 1;
    }

    return {
      totalConversations: conversations.length,
      indexedConversations: conversations.length,
      bySource,
      byApp,
    };
  }
}
