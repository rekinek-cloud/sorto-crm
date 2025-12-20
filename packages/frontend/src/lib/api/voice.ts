/**
 * 🎤 Voice API Client
 * API calls for voice recognition and synthesis
 */

import { apiClient } from './client';

export interface VoiceCommandResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  suggestedResponse: string;
  response?: string;
  requiresConfirmation: boolean;
  error?: string;
  timestamp?: string;
}

export interface ConversationData {
  conversationId: string;
  message?: string;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  startedAt?: string;
  lastActivity?: string;
}

export interface TTSRequest {
  text: string;
  language?: 'pl' | 'en';
  personalityLevel?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
  speed?: number;
}

/**
 * Voice API endpoints
 */
export interface KnowledgeSearchResult {
  id: string;
  content: string;
  type: string;
  similarity: number;
  relevanceScore: number;
  source: string;
}

export interface VectorStoreStats {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  avgSimilarity: number;
  lastUpdated: string;
}

export interface IngestionJobStatus {
  isRunning: boolean;
  currentJob?: {
    id: string;
    type: string;
    status: string;
    stats: {
      totalProcessed: number;
      successful: number;
      failed: number;
      skipped: number;
    };
  };
}

export const voiceApi = {
  /**
   * Process voice command with AI
   */
  async processCommand(
    transcript: string, 
    conversationId?: string
  ): Promise<VoiceCommandResult> {
    const response = await apiClient.post('/voice/process-command', {
      transcript,
      conversationId
    });
    return response.data;
  },

  /**
   * Start a new voice conversation
   */
  async startConversation(): Promise<ConversationData> {
    const response = await apiClient.post('/voice/start-conversation');
    return response.data;
  },

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<ConversationData> {
    const response = await apiClient.get(`/voice/conversation/${conversationId}`);
    return response.data;
  },

  /**
   * Text-to-speech synthesis
   */
  async synthesize(request: TTSRequest): Promise<Blob> {
    const response = await apiClient.post('/voice/synthesize', request, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Speech-to-text (if not using client-side)
   */
  async speechToText(audioBlob: Blob): Promise<{
    transcript: string;
    confidence: number;
    language: string;
  }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    const response = await apiClient.post('/voice/speech-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get available TTS models
   */
  async getModels(): Promise<Array<{
    name: string;
    language: string;
    description: string;
  }>> {
    const response = await apiClient.get('/voice/models');
    return response.data.models;
  },

  /**
   * Check voice service health
   */
  async healthCheck(): Promise<{
    ttsService: string;
    timestamp: string;
  }> {
    const response = await apiClient.get('/voice/health');
    return response.data;
  },

  /**
   * Process voice command with enhanced RAG capabilities
   */
  async processCommandEnhanced(
    transcript: string, 
    conversationId?: string
  ): Promise<VoiceCommandResult & { enhanced: true }> {
    const response = await apiClient.post('/voice/process-command-enhanced', {
      transcript,
      conversationId
    });
    return response.data;
  },

  /**
   * Initialize knowledge base with user's data
   */
  async initializeKnowledge(): Promise<{
    message: string;
    organizationId: string;
    timestamp: string;
  }> {
    const response = await apiClient.post('/voice/initialize-knowledge');
    return response.data;
  },

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeStats(): Promise<VectorStoreStats> {
    const response = await apiClient.get('/voice/knowledge-stats');
    return response.data;
  },

  /**
   * Search knowledge base manually
   */
  async searchKnowledge(
    query: string,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<{
    query: string;
    results: KnowledgeSearchResult[];
    totalFound: number;
  }> {
    const response = await apiClient.post('/voice/search-knowledge', {
      query,
      ...options
    });
    return response.data;
  },

  /**
   * Get data ingestion job status
   */
  async getIngestionStatus(): Promise<IngestionJobStatus> {
    const response = await apiClient.get('/voice/ingestion-status');
    return response.data;
  }
};