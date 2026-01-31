import { createHash } from 'crypto';
import { AiSourceType, ParsedConversation } from '../types';

export class DeduplicatorService {
  /**
   * Generate unique hash for a conversation
   * Hash is based on: source + externalId + title
   */
  generateHash(conversation: ParsedConversation): string {
    const hashInput = `${conversation.source}:${conversation.externalId}:${conversation.title}`;
    return createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Generate content hash (for detecting content changes)
   */
  generateContentHash(conversation: ParsedConversation): string {
    const contentParts = conversation.messages.map(
      (m) => `${m.role}:${m.content.substring(0, 1000)}`
    );
    const hashInput = contentParts.join('|');
    return createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Generate file hash for detecting file changes (Dropbox sync)
   */
  generateFileHash(fileContent: string): string {
    return createHash('sha256').update(fileContent).digest('hex');
  }

  /**
   * Check if conversation already exists by hash
   */
  async checkExists(
    prisma: any,
    organizationId: string,
    hash: string
  ): Promise<{ exists: boolean; conversationId?: string }> {
    const existing = await prisma.aiConversation.findFirst({
      where: {
        organizationId,
        hash,
      },
      select: {
        id: true,
      },
    });

    return {
      exists: !!existing,
      conversationId: existing?.id,
    };
  }

  /**
   * Find existing conversations by external ID
   */
  async findByExternalId(
    prisma: any,
    organizationId: string,
    source: AiSourceType,
    externalId: string
  ): Promise<{ id: string; hash: string } | null> {
    return prisma.aiConversation.findFirst({
      where: {
        organizationId,
        source,
        externalId,
      },
      select: {
        id: true,
        hash: true,
      },
    });
  }
}
