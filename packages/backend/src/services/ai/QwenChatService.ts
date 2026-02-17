/**
 * Qwen Chat Service
 * Unlimited chat with Qwen API (~40-80 PLN/month)
 * Integrated with SORTO Streams
 */

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '../../config/database';
import logger from '../../config/logger';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface ConversationWithMessages {
  id: string;
  title: string;
  model: string;
  systemPrompt: string | null;
  messageCount: number;
  totalTokens: number;
  isArchived: boolean;
  isPinned: boolean;
  streamId: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    role: string;
    content: string;
    promptTokens: number | null;
    completionTokens: number | null;
    model: string | null;
    latencyMs: number | null;
    createdAt: Date;
  }[];
}

// Available Qwen models
export const QWEN_MODELS = {
  MAX: 'qwen-max-2025-01-25',
  PLUS: 'qwen-plus',
  TURBO: 'qwen-turbo',
  LONG: 'qwen-long', // 10M context
} as const;

export class QwenChatService {
  private client: OpenAI;
  private prisma: PrismaClient;
  private defaultModel: string;

  constructor(apiKey?: string, prisma?: PrismaClient) {
    const key = apiKey || process.env.QWEN_API_KEY;
    if (!key) {
      throw new Error('QWEN_API_KEY not configured');
    }

    this.client = new OpenAI({
      apiKey: key,
      // International endpoint (Singapore)
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });

    this.prisma = prisma || prismaClient;
    this.defaultModel = QWEN_MODELS.MAX;
  }

  /**
   * Simple chat completion (no history)
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      stream: false,
    });

    const latencyMs = Date.now() - startTime;

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      latencyMs,
    };
  }

  /**
   * Streaming chat completion
   */
  async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  // ===================
  // Conversation Management
  // ===================

  /**
   * Create a new conversation
   */
  async createConversation(
    organizationId: string,
    userId: string,
    options: {
      title?: string;
      model?: string;
      systemPrompt?: string;
      streamId?: string;
    } = {}
  ) {
    const conversation = await (this.prisma.aiConversation as any).create({
      data: {
        organizationId,
        userId,
        title: options.title || 'Nowa rozmowa',
        model: options.model || this.defaultModel,
        systemPrompt: options.systemPrompt,
        streamId: options.streamId,
      },
    });

    // Log to stream timeline if provided
    if (options.streamId) {
      await this.logToStream(options.streamId, 'ai_chat_created', {
        conversationId: conversation.id,
        title: conversation.title,
      });
    }

    return conversation;
  }

  /**
   * Get conversation with messages
   */
  async getConversation(
    conversationId: string,
    organizationId: string
  ): Promise<ConversationWithMessages | null> {
    const conversation = await (this.prisma.aiConversation as any).findFirst({
      where: {
        id: conversationId,
        organizationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return conversation as ConversationWithMessages | null;
  }

  /**
   * List conversations for user
   */
  async listConversations(
    organizationId: string,
    userId: string,
    options: {
      limit?: number;
      includeArchived?: boolean;
      streamId?: string;
    } = {}
  ) {
    const conversations = await (this.prisma.aiConversation as any).findMany({
      where: {
        organizationId,
        userId,
        isArchived: options.includeArchived ? undefined : false,
        streamId: options.streamId,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: options.limit || 50,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { content: true },
        },
      },
    });

    return conversations.map((conv: any) => {
      const { messages, ...rest } = conv;
      return {
        ...rest,
        preview: messages[0]?.content?.substring(0, 100) || null,
      };
    });
  }

  /**
   * Send message to conversation with streaming
   */
  async *sendMessage(
    conversationId: string,
    organizationId: string,
    content: string,
    options: ChatOptions = {}
  ): AsyncGenerator<string, ChatResponse, unknown> {
    const startTime = Date.now();

    // Get conversation with history
    const conversation: any = await (this.prisma.aiConversation as any).findFirst({
      where: {
        id: conversationId,
        organizationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Save user message
    await (this.prisma as any).aiChatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content,
      },
    });

    // Build messages array
    const messages: ChatMessage[] = [];

    // Add system prompt if exists
    if (conversation.systemPrompt || options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt || conversation.systemPrompt!,
      });
    }

    // Add history
    for (const msg of conversation.messages) {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content });

    // Stream response
    let fullResponse = '';
    const stream = await this.client.chat.completions.create({
      model: options.model || conversation.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        yield text;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Estimate tokens (rough approximation: ~4 chars per token)
    const promptTokens = Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4);
    const completionTokens = Math.ceil(fullResponse.length / 4);

    // Save assistant message
    await (this.prisma as any).aiChatMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: fullResponse,
        promptTokens,
        completionTokens,
        model: options.model || conversation.model,
        latencyMs,
      },
    });

    // Update conversation stats
    await (this.prisma.aiConversation as any).update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 2 },
        totalTokens: { increment: promptTokens + completionTokens },
        updatedAt: new Date(),
      },
    });

    // Log to stream if linked
    if (conversation.streamId) {
      await this.logToStream(conversation.streamId, 'ai_chat_message', {
        conversationId,
        userMessage: content.substring(0, 100),
        tokensUsed: promptTokens + completionTokens,
      });
    }

    return {
      content: fullResponse,
      model: options.model || conversation.model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      latencyMs,
    };
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    organizationId: string,
    data: {
      title?: string;
      isArchived?: boolean;
      isPinned?: boolean;
      systemPrompt?: string;
      streamId?: string;
    }
  ) {
    return (this.prisma.aiConversation as any).updateMany({
      where: {
        id: conversationId,
        organizationId,
      },
      data,
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, organizationId: string) {
    return (this.prisma.aiConversation as any).deleteMany({
      where: {
        id: conversationId,
        organizationId,
      },
    });
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [
      { id: QWEN_MODELS.MAX, name: 'Qwen Max', description: 'Best quality, most capable' },
      { id: QWEN_MODELS.PLUS, name: 'Qwen Plus', description: 'Balanced performance' },
      { id: QWEN_MODELS.TURBO, name: 'Qwen Turbo', description: 'Fast, cost-effective' },
      { id: QWEN_MODELS.LONG, name: 'Qwen Long', description: '10M context window' },
    ];
  }

  /**
   * Check service status
   */
  async checkStatus(): Promise<{
    isAvailable: boolean;
    latency?: number;
    errorMessage?: string;
  }> {
    const startTime = Date.now();
    try {
      await this.client.chat.completions.create({
        model: QWEN_MODELS.TURBO,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });

      return {
        isAvailable: true,
        latency: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        isAvailable: false,
        errorMessage: error.message,
      };
    }
  }

  // ===================
  // Private Helpers
  // ===================

  private async logToStream(streamId: string, action: string, data: any): Promise<void> {
    try {
      // Log AI Chat action - using activities table for stream logging
      logger.info(`AI Chat action: ${action}`, { streamId, data });
      // Note: Full activity logging can be added later when activities integration is needed
    } catch (error) {
      logger.warn(`Failed to log to stream ${streamId}:`, error);
    }
  }
}

export default QwenChatService;
