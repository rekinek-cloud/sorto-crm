import { PrismaClient } from '@prisma/client';
import { ChatGPTParser, ClaudeParser, DeepSeekParser } from '../parsers';
import {
  AiSourceType,
  ChatGPTExport,
  ClaudeExport,
  DeepSeekExport,
  ParsedConversation,
  SyncResult,
} from '../types';
import { AiConversationsService } from './AiConversationsService';

export class SyncOrchestratorService {
  private conversationsService: AiConversationsService;

  // Parsers
  private chatgptParser: ChatGPTParser;
  private claudeParser: ClaudeParser;
  private deepseekParser: DeepSeekParser;

  constructor(prisma: PrismaClient) {
    this.conversationsService = new AiConversationsService(prisma);

    this.chatgptParser = new ChatGPTParser();
    this.claudeParser = new ClaudeParser();
    this.deepseekParser = new DeepSeekParser();
  }

  /**
   * Sync from JSON file content
   * Uses VectorService (via AiConversationsService) for storage
   * No separate indexing needed - embeddings are created automatically
   */
  async syncFromJson(
    organizationId: string,
    source: AiSourceType,
    jsonContent: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      source,
      success: false,
      conversationsImported: 0,
      conversationsUpdated: 0,
      conversationsSkipped: 0,
      errors: [],
    };

    try {
      // Parse JSON
      const data = JSON.parse(jsonContent);
      const conversations = this.parseBySource(source, data);

      if (conversations.length === 0) {
        result.success = true;
        return result;
      }

      // Process conversations
      for (const conv of conversations) {
        try {
          // Import conversation using VectorService
          // This automatically creates chunks and embeddings
          const { isNew } = await this.conversationsService.importConversation(
            organizationId,
            conv
          );

          if (isNew) {
            result.conversationsImported++;
          } else {
            result.conversationsSkipped++;
          }
        } catch (convError) {
          result.errors.push(`Failed to import conversation ${conv.externalId}: ${convError}`);
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
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
   * Get sync summary for organization
   * Uses AiConversationsService which queries vector_documents
   */
  async getSyncSummary(organizationId: string): Promise<{
    totalConversations: number;
    indexedConversations: number;
    bySource: Record<string, number>;
    byApp: Record<string, number>;
  }> {
    return this.conversationsService.getSummary(organizationId);
  }

  /**
   * Delete all conversations for a source
   */
  async deleteBySource(organizationId: string, source: AiSourceType): Promise<number> {
    return this.conversationsService.deleteBySource(organizationId, source);
  }
}
