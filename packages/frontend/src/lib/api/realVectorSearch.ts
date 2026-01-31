import { apiClient } from './client';

export interface VectorSearchFilters {
  type?: string;
  entityType?: string;
  source?: string;
  minRelevance?: number;
}

export interface VectorSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    author?: string;
    createdAt: string;
    tags: string[];
    entityType?: string;
    entityId?: string;
    urgencyScore?: number;
    priority?: string;
    importance?: number;
  };
  relevanceScore: number;
  vectorSimilarity: number;
  semanticMatch: boolean;
}

export interface VectorSearchResponse {
  query: string;
  results: VectorSearchResult[];
  totalResults: number;
  searchTime: number;
  searchMethod: 'semantic' | 'keyword';
  suggestions: string[];
  filters: VectorSearchFilters;
  organizationId: string;
}

export interface VectorStats {
  overview: {
    total_vectors: number;
    entity_types: number;
    sources: number;
    avg_urgency: number;
    high_priority_count: number;
    action_needed_count: number;
  };
  typeBreakdown: Array<{
    type: string;
    count: number;
    avg_urgency: number;
  }>;
  organizationId: string;
}

export const realVectorSearchApi = {
  // Perform semantic search
  async search(query: string, options?: {
    limit?: number;
    filters?: VectorSearchFilters;
  }): Promise<{ success: boolean; data: VectorSearchResponse }> {
    const response = await apiClient.post('/real-vector-search/search', {
      query,
      limit: options?.limit || 10,
      filters: options?.filters || {}
    });
    return response.data;
  },

  // Get vector database statistics
  async getStats(): Promise<{ success: boolean; data: VectorStats }> {
    const response = await apiClient.get('/real-vector-search/stats');
    return response.data;
  },

  // Get search suggestions
  async getSuggestions(query: string): Promise<{ success: boolean; data: { suggestions: string[] } }> {
    const response = await apiClient.get(`/real-vector-search/suggestions/${encodeURIComponent(query)}`);
    return response.data;
  }
};
