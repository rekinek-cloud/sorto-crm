import {
  AiSourceType,
  DeepSeekConversation,
  DeepSeekExport,
  ParsedConversation,
  ParsedMessage,
} from '../types';

export class DeepSeekParser {
  /**
   * Parse DeepSeek export JSON file
   */
  parse(data: DeepSeekExport): ParsedConversation[] {
    const conversations: ParsedConversation[] = [];

    if (!data.data || !Array.isArray(data.data)) {
      return conversations;
    }

    for (const conv of data.data) {
      try {
        const parsed = this.parseConversation(conv);
        if (parsed.messages.length > 0) {
          conversations.push(parsed);
        }
      } catch (error) {
        console.error(`Error parsing DeepSeek conversation ${conv.chat_id}:`, error);
      }
    }

    return conversations;
  }

  /**
   * Parse single DeepSeek conversation
   */
  private parseConversation(conv: DeepSeekConversation): ParsedConversation {
    const messages: ParsedMessage[] = [];

    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      if (!msg.content || msg.content.trim() === '') continue;

      messages.push({
        role: msg.role,
        content: msg.content,
        messageIndex: i,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
      });
    }

    return {
      source: AiSourceType.DEEPSEEK,
      externalId: conv.chat_id,
      title: conv.title || 'Untitled',
      messages,
      createdAt: conv.created_at ? new Date(conv.created_at) : undefined,
      model: 'deepseek-chat',
    };
  }
}
