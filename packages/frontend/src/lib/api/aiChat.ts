/**
 * AI Chat API Client
 * Frontend client for AI Chat with Qwen API
 */

import apiClient from './client';
import Cookies from 'js-cookie';

export interface Conversation {
  id: string;
  title: string;
  model: string;
  systemPrompt: string | null;
  messageCount: number;
  totalTokens: number;
  isArchived: boolean;
  isPinned: boolean;
  streamId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

export interface AIModel {
  id: string;
  name: string;
  contextLength: number;
  description: string;
}

export interface CreateConversationRequest {
  title?: string;
  model?: string;
  systemPrompt?: string;
  streamId?: string;
}

export interface SendMessageRequest {
  content: string;
  model?: string;
}

// Conversations
export async function listConversations(options?: {
  limit?: number;
  includeArchived?: boolean;
  streamId?: string;
}): Promise<Conversation[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.includeArchived) params.append('includeArchived', 'true');
  if (options?.streamId) params.append('streamId', options.streamId);

  const response = await apiClient.get(`/ai-chat/conversations?${params}`);
  return response.data.data;
}

export async function getConversation(id: string): Promise<ConversationWithMessages> {
  const response = await apiClient.get(`/ai-chat/conversations/${id}`);
  return response.data.data;
}

export async function createConversation(data: CreateConversationRequest): Promise<Conversation> {
  const response = await apiClient.post('/ai-chat/conversations', data);
  return response.data.data;
}

export async function updateConversation(id: string, data: {
  title?: string;
  systemPrompt?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}): Promise<void> {
  await apiClient.patch(`/ai-chat/conversations/${id}`, data);
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/ai-chat/conversations/${id}`);
}

// Messages
export async function sendMessage(
  conversationId: string,
  data: SendMessageRequest
): Promise<ConversationMessage> {
  const response = await apiClient.post(`/ai-chat/conversations/${conversationId}/messages`, data);
  return response.data.data;
}

export function streamMessage(
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): () => void {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // Endpoint uses SSE on /messages (not /messages/stream)
  const url = `${baseUrl}/v1/ai-chat/conversations/${conversationId}/messages`;

  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Cookies.get('access_token')}`,
    },
    body: JSON.stringify({ content }),
    signal: controller.signal,
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Stream failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      onDone();
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError(error);
      }
    });

  return () => controller.abort();
}

// Models
export async function getModels(): Promise<AIModel[]> {
  const response = await apiClient.get('/ai-chat/models');
  return response.data.data;
}

export default {
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
  streamMessage,
  getModels,
};
