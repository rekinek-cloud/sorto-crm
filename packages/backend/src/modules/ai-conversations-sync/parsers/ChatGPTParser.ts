import {
  AiSourceType,
  ChatGPTConversation,
  ChatGPTExport,
  ChatGPTNode,
  ParsedConversation,
  ParsedMessage,
} from '../types';

export class ChatGPTParser {
  /**
   * Parse ChatGPT export JSON file
   */
  parse(data: ChatGPTExport): ParsedConversation[] {
    const conversations: ParsedConversation[] = [];

    for (const conv of data.conversations || []) {
      try {
        const parsed = this.parseConversation(conv);
        if (parsed.messages.length > 0) {
          conversations.push(parsed);
        }
      } catch (error) {
        console.error(`Error parsing ChatGPT conversation ${conv.id}:`, error);
      }
    }

    return conversations;
  }

  /**
   * Parse single ChatGPT conversation
   */
  private parseConversation(conv: ChatGPTConversation): ParsedConversation {
    const messages = this.extractMessages(conv.mapping);
    const model = this.extractModel(conv.mapping);

    return {
      source: AiSourceType.CHATGPT,
      externalId: conv.id,
      title: conv.title || 'Untitled',
      messages,
      createdAt: conv.create_time ? new Date(conv.create_time * 1000) : undefined,
      updatedAt: conv.update_time ? new Date(conv.update_time * 1000) : undefined,
      model,
    };
  }

  /**
   * Extract messages from ChatGPT mapping structure
   * ChatGPT uses a tree structure, we need to traverse it
   */
  private extractMessages(mapping: Record<string, ChatGPTNode>): ParsedMessage[] {
    const messages: ParsedMessage[] = [];
    const visited = new Set<string>();

    // Find root node (no parent)
    let rootId: string | null = null;
    for (const [id, node] of Object.entries(mapping)) {
      if (!node.parent) {
        rootId = id;
        break;
      }
    }

    if (!rootId) return messages;

    // Traverse the tree (DFS through main branch)
    this.traverseMessages(mapping, rootId, messages, visited);

    // Sort by message index
    messages.sort((a, b) => a.messageIndex - b.messageIndex);

    // Reindex
    messages.forEach((msg, idx) => {
      msg.messageIndex = idx;
    });

    return messages;
  }

  /**
   * Traverse message tree recursively
   */
  private traverseMessages(
    mapping: Record<string, ChatGPTNode>,
    nodeId: string,
    messages: ParsedMessage[],
    visited: Set<string>
  ): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = mapping[nodeId];
    if (!node) return;

    // Extract message if present
    if (node.message?.content) {
      const role = this.mapRole(node.message.author?.role);
      const content = this.extractContent(node.message.content);

      if (content && role !== 'system') {
        messages.push({
          role,
          content,
          messageIndex: messages.length,
          model: node.message.metadata?.model_slug,
          timestamp: node.message.create_time
            ? new Date(node.message.create_time * 1000)
            : undefined,
        });
      }
    }

    // Traverse children (take first child for main conversation branch)
    if (node.children && node.children.length > 0) {
      // Usually the last child is the continued conversation
      const nextChild = node.children[node.children.length - 1];
      this.traverseMessages(mapping, nextChild, messages, visited);
    }
  }

  /**
   * Map ChatGPT role to standard role
   */
  private mapRole(role?: string): 'user' | 'assistant' | 'system' {
    switch (role) {
      case 'user':
        return 'user';
      case 'assistant':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'assistant';
    }
  }

  /**
   * Extract text content from ChatGPT content structure
   */
  private extractContent(content: { content_type: string; parts?: string[]; text?: string }): string {
    if (content.parts && content.parts.length > 0) {
      return content.parts.filter((p) => typeof p === 'string').join('\n');
    }
    if (content.text) {
      return content.text;
    }
    return '';
  }

  /**
   * Extract model name from mapping
   */
  private extractModel(mapping: Record<string, ChatGPTNode>): string | undefined {
    for (const node of Object.values(mapping)) {
      if (node.message?.metadata?.model_slug) {
        return node.message.metadata.model_slug;
      }
    }
    return undefined;
  }
}
