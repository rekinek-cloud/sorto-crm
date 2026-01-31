import {
  AiSourceType,
  ClaudeConversation,
  ClaudeExport,
  ParsedConversation,
  ParsedMessage,
} from '../types';

export class ClaudeParser {
  /**
   * Parse Claude export JSON file
   * Supports both multi-conversation and single conversation formats
   */
  parse(data: ClaudeExport): ParsedConversation[] {
    const conversations: ParsedConversation[] = [];

    // Multi-conversation format
    if (data.conversations && Array.isArray(data.conversations)) {
      for (const conv of data.conversations) {
        try {
          const parsed = this.parseConversation(conv);
          if (parsed.messages.length > 0) {
            conversations.push(parsed);
          }
        } catch (error) {
          console.error(`Error parsing Claude conversation ${conv.uuid}:`, error);
        }
      }
    }
    // Single conversation format
    else if (data.uuid && data.chat_messages) {
      try {
        const parsed = this.parseConversation({
          uuid: data.uuid,
          name: data.name || 'Untitled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          chat_messages: data.chat_messages,
        });
        if (parsed.messages.length > 0) {
          conversations.push(parsed);
        }
      } catch (error) {
        console.error(`Error parsing Claude conversation ${data.uuid}:`, error);
      }
    }

    return conversations;
  }

  /**
   * Parse single Claude conversation
   */
  private parseConversation(conv: ClaudeConversation): ParsedConversation {
    const messages: ParsedMessage[] = [];

    for (let i = 0; i < conv.chat_messages.length; i++) {
      const msg = conv.chat_messages[i];
      if (!msg.text || msg.text.trim() === '') continue;

      messages.push({
        role: msg.sender === 'human' ? 'user' : 'assistant',
        content: msg.text,
        messageIndex: i,
        timestamp: msg.created_at ? new Date(msg.created_at) : undefined,
      });
    }

    return {
      source: AiSourceType.CLAUDE,
      externalId: conv.uuid,
      title: conv.name || 'Untitled',
      messages,
      createdAt: conv.created_at ? new Date(conv.created_at) : undefined,
      updatedAt: conv.updated_at ? new Date(conv.updated_at) : undefined,
      model: 'claude', // Claude exports don't include model version
    };
  }
}
