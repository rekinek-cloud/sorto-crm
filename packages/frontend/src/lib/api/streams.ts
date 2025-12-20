import apiClient from './client';
import { Stream } from '@/types/gtd';

export interface StreamsResponse {
  streams: Stream[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StreamFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE' | 'FROZEN';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateStreamRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE' | 'FROZEN' | 'FLOWING';
}

export interface UpdateStreamRequest extends Partial<CreateStreamRequest> {}

export interface StreamStats {
  totalStreams: number;
  activeStreams: number;
  archivedStreams: number;
  totalTasks: number;
  totalProjects: number;
  streamUsage: Array<{
    id: string;
    name: string;
    color: string;
    _count: {
      tasks: number;
      projects: number;
    };
  }>;
}

export const streamsApi = {
  // Get all streams with filtering and pagination
  async getStreams(filters: StreamFilters = {}): Promise<StreamsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<StreamsResponse>(`/streams?${params.toString()}`);
    return response.data;
  },

  // Get stream by ID
  async getStream(id: string): Promise<Stream> {
    const response = await apiClient.get<Stream>(`/streams/${id}`);
    return response.data;
  },

  // Create new stream
  async createStream(data: CreateStreamRequest): Promise<Stream> {
    const response = await apiClient.post<Stream>('/streams', data);
    return response.data;
  },

  // Update stream
  async updateStream(id: string, data: UpdateStreamRequest): Promise<Stream> {
    const response = await apiClient.put<Stream>(`/streams/${id}`, data);
    return response.data;
  },

  // Delete stream
  async deleteStream(id: string): Promise<void> {
    await apiClient.delete(`/streams/${id}`);
  },

  // Archive/unarchive stream
  async archiveStream(id: string, archive: boolean = true): Promise<Stream> {
    const response = await apiClient.post<Stream>(`/streams/${id}/archive`, { archive });
    return response.data;
  },

  // Duplicate stream
  async duplicateStream(id: string, name: string): Promise<Stream> {
    const response = await apiClient.post<Stream>(`/streams/${id}/duplicate`, { name });
    return response.data;
  },

  // Get stream statistics
  async getStreamStats(): Promise<StreamStats> {
    const response = await apiClient.get<StreamStats>('/streams/stats');
    return response.data;
  },

  // Get active streams
  async getActiveStreams(): Promise<Stream[]> {
    const response = await this.getStreams({ status: 'ACTIVE', limit: 100 });
    return response.streams;
  },

  // Search streams
  async searchStreams(query: string): Promise<Stream[]> {
    const response = await this.getStreams({ search: query, limit: 20 });
    return response.streams;
  }
};

export default streamsApi;