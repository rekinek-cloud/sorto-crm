/**
 * Flow Conversation API Client
 * Dialogowe przetwarzanie AI
 */

import { apiClient } from './client';

export interface FlowConversation {
  id: string;
  itemId: string;
  itemType: 'task' | 'project' | 'idea' | 'email' | 'note';
  status: 'active' | 'completed' | 'cancelled';
  messages: ConversationMessage[];
  context?: Record<string, any>;
  result?: ConversationResult;
  startedAt: string;
  completedAt?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ConversationResult {
  action: string;
  changes: Record<string, any>;
  appliedAt?: string;
}

export interface ConversationAction {
  type: 'categorize' | 'schedule' | 'delegate' | 'break_down' | 'modify' | 'archive' | 'custom';
  params: Record<string, any>;
}

// Conversations
export const getConversations = (params?: { status?: string; limit?: number }) =>
  apiClient.get<{ conversations: FlowConversation[] }>('/flow/conversation', { params });

export const getConversation = (conversationId: string) =>
  apiClient.get<{ conversation: FlowConversation }>(`/flow/conversation/${conversationId}`);

export const startConversation = (itemId: string, initialMessage?: string) =>
  apiClient.post<{ conversation: FlowConversation }>(`/flow/conversation/start/${itemId}`, { initialMessage });

export const sendMessage = (conversationId: string, message: string) =>
  apiClient.post<{ message: ConversationMessage; suggestions?: string[] }>(`/flow/conversation/${conversationId}/message`, { message });

export const modifyConversation = (conversationId: string, modifications: Record<string, any>) =>
  apiClient.put<{ conversation: FlowConversation }>(`/flow/conversation/${conversationId}/modify`, modifications);

export const executeAction = (conversationId: string, action: ConversationAction) =>
  apiClient.post<{ success: boolean; result: ConversationResult }>(`/flow/conversation/${conversationId}/execute`, action);

export const cancelConversation = (conversationId: string) =>
  apiClient.post<{ success: boolean }>(`/flow/conversation/${conversationId}/cancel`);
