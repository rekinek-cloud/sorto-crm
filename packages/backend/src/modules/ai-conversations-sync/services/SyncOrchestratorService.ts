import { PrismaClient } from '@prisma/client';
import { ChatGPTParser, ClaudeParser, DeepSeekParser } from '../parsers';
import {
  AiSourceType,
  ChatGPTExport,
  ClaudeExport,
  DeepSeekExport,
  ParsedConversation,
  SyncResult,
  SyncStatusType,
} from '../types';
import { AiConversationsService } from './AiConversationsService';
import { DeduplicatorService } from './DeduplicatorService';

export class SyncOrchestratorService {
  private prisma: PrismaClient;
  private conversationsService: AiConversationsService;
  private deduplicator: DeduplicatorService;

  // Parsers
  private chatgptParser: ChatGPTParser;
  private claudeParser: ClaudeParser;
  private deepseekParser: DeepSeekParser;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.conversationsService = new AiConversationsService(prisma);
    this.deduplicator = new DeduplicatorService();

    this.chatgptParser = new ChatGPTParser();
    this.claudeParser = new ClaudeParser();
    this.deepseekParser = new DeepSeekParser();
  }

  /**
   * Sync from JSON file content
   */
  async syncFromJson(
    organizationId: string,
    createdById: string,
    source: AiSourceType,
    jsonContent: string,
    options: {
      indexAfterImport?: boolean;
      createStreams?: boolean;
    } = {}
  ): Promise<SyncResult> {
    const { indexAfterImport = false, createStreams = true } = options;

    const result: SyncResult = {
      source,
      success: false,
      conversationsImported: 0,
      conversationsUpdated: 0,
      conversationsSkipped: 0,
      errors: [],
    };

    try {
      // Update sync status to SYNCING
      await this.conversationsService.updateSyncStatus(
        organizationId,
        source,
        SyncStatusType.SYNCING
      );

      // Check file hash for deduplication
      const fileHash = this.deduplicator.generateFileHash(jsonContent);

      // Parse JSON
      const data = JSON.parse(jsonContent);
      const conversations = this.parseBySource(source, data);

      if (conversations.length === 0) {
        result.success = true;
        await this.conversationsService.updateSyncStatus(
          organizationId,
          source,
          SyncStatusType.COMPLETED,
          { conversationsCount: 0, lastFileHash: fileHash }
        );
        return result;
      }

      // Process conversations
      for (const conv of conversations) {
        try {
          // Get or create stream if enabled
          let streamId: string | undefined;
          if (createStreams) {
            const classification =
              new (await import('./ClassifierService')).ClassifierService().classify(conv);
            streamId = await this.conversationsService.getOrCreateReferenceStream(
              organizationId,
              classification.appName,
              createdById
            );
          }

          // Import conversation
          const { id, isNew } = await this.conversationsService.importConversation(
            organizationId,
            conv,
            streamId
          );

          if (isNew) {
            result.conversationsImported++;

            // Index if requested
            if (indexAfterImport) {
              try {
                await this.conversationsService.indexConversation(id);
              } catch (indexError) {
                result.errors.push(
                  `Failed to index conversation ${conv.externalId}: ${indexError}`
                );
              }
            }
          } else {
            result.conversationsSkipped++;
          }
        } catch (convError) {
          result.errors.push(`Failed to import conversation ${conv.externalId}: ${convError}`);
        }
      }

      // Update app mapping statistics
      const uniqueApps = new Set<string>();
      const classifierService = new (await import('./ClassifierService')).ClassifierService();
      for (const c of conversations) {
        const classification = classifierService.classify(c);
        uniqueApps.add(classification.appName);
      }

      for (const appName of uniqueApps) {
        await this.conversationsService.updateAppMappingStats(organizationId, appName);
      }

      // Update sync status
      result.success = true;
      await this.conversationsService.updateSyncStatus(
        organizationId,
        source,
        SyncStatusType.COMPLETED,
        {
          conversationsCount: result.conversationsImported,
          lastFileHash: fileHash,
        }
      );
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      await this.conversationsService.updateSyncStatus(
        organizationId,
        source,
        SyncStatusType.ERROR,
        { lastError: String(error) }
      );
    }

    return result;
  }

  /**
   * Parse data based on source type
   */
  private parseBySource(source: AiSourceType, data: unknown): ParsedConversation[] {
    switch (source) {
      case AiSourceType.CHATGPT:
        return this.chatgptParser.parse(data as ChatGPTExport);
      case AiSourceType.CLAUDE:
        return this.claudeParser.parse(data as ClaudeExport);
      case AiSourceType.DEEPSEEK:
        return this.deepseekParser.parse(data as DeepSeekExport);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  /**
   * Index all unindexed conversations
   */
  async indexAllUnindexed(organizationId: string): Promise<{ indexed: number; errors: string[] }> {
    const unindexed = await this.prisma.aiConversation.findMany({
      where: {
        organizationId,
        isIndexed: false,
      },
      select: { id: true },
    });

    const errors: string[] = [];
    let indexed = 0;

    for (const conv of unindexed) {
      try {
        await this.conversationsService.indexConversation(conv.id);
        indexed++;
      } catch (error) {
        errors.push(`Failed to index ${conv.id}: ${error}`);
      }
    }

    return { indexed, errors };
  }

  /**
   * Get sync summary for organization
   */
  async getSyncSummary(organizationId: string): Promise<{
    totalConversations: number;
    indexedConversations: number;
    bySource: Record<string, number>;
    byApp: Record<string, number>;
  }> {
    const [total, indexed, bySource, byApp] = await Promise.all([
      this.prisma.aiConversation.count({ where: { organizationId } }),
      this.prisma.aiConversation.count({ where: { organizationId, isIndexed: true } }),
      this.prisma.aiConversation.groupBy({
        by: ['source'],
        where: { organizationId },
        _count: true,
      }),
      this.prisma.aiConversation.groupBy({
        by: ['appName'],
        where: { organizationId },
        _count: true,
      }),
    ]);

    return {
      totalConversations: total,
      indexedConversations: indexed,
      bySource: Object.fromEntries(bySource.map((s) => [s.source, s._count])),
      byApp: Object.fromEntries(byApp.map((a) => [a.appName || 'unknown', a._count])),
    };
  }

  /**
   * Delete all conversations for a source
   */
  async deleteBySource(organizationId: string, source: AiSourceType): Promise<number> {
    const result = await this.prisma.aiConversation.deleteMany({
      where: {
        organizationId,
        source,
      },
    });

    return result.count;
  }

  /**
   * Re-classify all conversations (useful after updating app mappings)
   */
  async reclassifyAll(organizationId: string): Promise<{ updated: number }> {
    const conversations = await this.prisma.aiConversation.findMany({
      where: { organizationId },
      include: { messages: { take: 5 } },
    });

    const classifier = new (await import('./ClassifierService')).ClassifierService();
    let updated = 0;

    for (const conv of conversations) {
      const parsedConv: ParsedConversation = {
        source: conv.source as AiSourceType,
        externalId: conv.externalId,
        title: conv.title,
        messages: conv.messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          messageIndex: m.messageIndex,
        })),
      };

      const classification = classifier.classify(parsedConv);

      if (classification.appName !== conv.appName) {
        await this.prisma.aiConversation.update({
          where: { id: conv.id },
          data: {
            appName: classification.appName,
            classificationScore: classification.score,
          },
        });
        updated++;
      }
    }

    return { updated };
  }
}
