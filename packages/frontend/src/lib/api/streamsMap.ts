/**
 * Streams Map API Client - Mapa Strumieni
 * Metodologia SORTO STREAMS (ex gtdMapViews)
 */

import { apiClient } from './client';
import { Stream, StreamPattern, StreamStatus } from '@/types/streams';

export interface StreamNode {
  id: string;
  name: string;
  color: string;
  icon?: string;
  status: StreamStatus;
  pattern?: StreamPattern;
  level: number;
  children: StreamNode[];
  taskCount: number;
  activeTaskCount: number;
}

export interface StreamsMapResponse {
  roots: StreamNode[];
  totalStreams: number;
  totalTasks: number;
}

export const streamsMapApi = {
  /**
   * Pobierz mapę strumieni (hierarchia)
   */
  async getStreamsMap(params?: {
    includeArchived?: boolean;
    maxDepth?: number;
  }): Promise<StreamsMapResponse> {
    const queryParams = new URLSearchParams();
    if (params?.includeArchived) queryParams.append('includeArchived', 'true');
    if (params?.maxDepth) queryParams.append('maxDepth', String(params.maxDepth));

    const response = await apiClient.get(`/streams-map?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Pobierz dopływy strumienia
   */
  async getStreamTributaries(streamId: string): Promise<Stream[]> {
    const response = await apiClient.get(`/streams-map/${streamId}/tributaries`);
    return response.data;
  },

  /**
   * Przenieś strumień do innego rodzica
   */
  async moveStream(streamId: string, newParentId: string | null): Promise<Stream> {
    const response = await apiClient.patch(`/streams-map/${streamId}/move`, {
      parentId: newParentId,
    });
    return response.data;
  },

  /**
   * Pobierz ścieżkę do strumienia (breadcrumbs)
   */
  async getStreamPath(streamId: string): Promise<Array<Pick<Stream, 'id' | 'name' | 'color'>>> {
    const response = await apiClient.get(`/streams-map/${streamId}/path`);
    return response.data;
  },

  /**
   * Wyszukaj strumienie
   */
  async searchStreams(query: string): Promise<Stream[]> {
    const response = await apiClient.get(`/streams-map/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default streamsMapApi;
