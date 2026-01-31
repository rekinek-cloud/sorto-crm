import { apiClient } from './client';

// Types
export type AiSource = 'CHATGPT' | 'CLAUDE' | 'DEEPSEEK';
export type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR' | 'COMPLETED';

export interface AiConversation {
  id: string;
  source: AiSource;
  externalId: string;
  title: string;
  appName: string | null;
  classificationScore: number | null;
  messageCount: number;
  tokenCount: number | null;
  sourceCreatedAt: string | null;
  importedAt: string;
  isIndexed: boolean;
  indexedAt: string | null;
  _count?: {
    messages: number;
    chunks: number;
  };
}

export interface AiConversationMessage {
  id: string;
  role: string;
  content: string;
  messageIndex: number;
  model: string | null;
  timestamp: string | null;
}

export interface AiConversationDetail extends AiConversation {
  messages: AiConversationMessage[];
  stream: {
    id: string;
    name: string;
  } | null;
}

export interface SyncResult {
  source: AiSource;
  success: boolean;
  conversationsImported: number;
  conversationsUpdated: number;
  conversationsSkipped: number;
  errors: string[];
}

export interface SyncStatusInfo {
  id: string;
  source: AiSource;
  status: SyncStatus;
  lastSyncAt: string | null;
  conversationsCount: number;
  lastError: string | null;
}

export interface SyncSummary {
  totalConversations: number;
  indexedConversations: number;
  bySource: Record<string, number>;
  byApp: Record<string, number>;
}

export interface AppMapping {
  id: string;
  appName: string;
  appStatus: string | null;
  keywords: string[];
  conversationsCount: number;
  messagesCount: number;
}

export interface SearchResult {
  conversationId: string;
  chunkId: string;
  content: string;
  similarity: number;
  title: string;
  appName: string | null;
  source: string;
}

// API Functions

export const aiSyncApi = {
  // Import conversations from JSON
  import: async (
    source: AiSource,
    jsonContent: string,
    options?: { indexAfterImport?: boolean; createStreams?: boolean }
  ): Promise<SyncResult> => {
    const response = await apiClient.post('/ai-sync/import', {
      source,
      jsonContent,
      indexAfterImport: options?.indexAfterImport ?? false,
      createStreams: options?.createStreams ?? true,
    });
    return response.data.data;
  },

  // Search conversations
  search: async (
    query: string,
    options?: { limit?: number; appName?: string; source?: AiSource }
  ): Promise<SearchResult[]> => {
    const response = await apiClient.post('/ai-sync/search', {
      query,
      ...options,
    });
    return response.data.data;
  },

  // List conversations
  getConversations: async (params?: {
    source?: AiSource;
    appName?: string;
    streamId?: string;
    isIndexed?: boolean;
    skip?: number;
    take?: number;
  }): Promise<AiConversation[]> => {
    const response = await apiClient.get('/ai-sync/conversations', { params });
    return response.data.data;
  },

  // Get single conversation
  getConversation: async (id: string): Promise<AiConversationDetail> => {
    const response = await apiClient.get(`/ai-sync/conversations/${id}`);
    return response.data.data;
  },

  // Delete conversation
  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai-sync/conversations/${id}`);
  },

  // Index single conversation
  indexConversation: async (id: string): Promise<{ chunksCreated: number }> => {
    const response = await apiClient.post(`/ai-sync/conversations/${id}/index`);
    return response.data.data;
  },

  // Index all unindexed
  indexAll: async (): Promise<{ indexed: number; errors: string[] }> => {
    const response = await apiClient.post('/ai-sync/index-all');
    return response.data.data;
  },

  // Get sync status
  getStatus: async (source?: AiSource): Promise<SyncStatusInfo | SyncStatusInfo[]> => {
    const response = await apiClient.get('/ai-sync/status', {
      params: source ? { source } : undefined,
    });
    return response.data.data;
  },

  // Get summary
  getSummary: async (): Promise<SyncSummary> => {
    const response = await apiClient.get('/ai-sync/summary');
    return response.data.data;
  },

  // Get app mappings
  getAppMappings: async (): Promise<AppMapping[]> => {
    const response = await apiClient.get('/ai-sync/app-mappings');
    return response.data.data;
  },

  // Reclassify all
  reclassify: async (): Promise<{ updated: number }> => {
    const response = await apiClient.post('/ai-sync/reclassify');
    return response.data.data;
  },

  // Delete by source
  deleteBySource: async (source: AiSource): Promise<{ deletedCount: number }> => {
    const response = await apiClient.delete(`/ai-sync/source/${source}`);
    return response.data.data;
  },
};

export default aiSyncApi;
