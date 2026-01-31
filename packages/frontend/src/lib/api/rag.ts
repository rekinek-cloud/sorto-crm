/**
 * RAG API Client
 * Frontend client for RAG (Retrieval-Augmented Generation) endpoints
 */

import apiClient from './client';

export interface RagSource {
  id: string;
  name: string;
  type: string;
  description: string | null;
  chunksCount: number;
  totalTokens: number;
  isActive: boolean;
  streamId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  content: string;
  similarity: number;
  sourceName: string;
  sourceType: string;
  metadata: any;
}

export interface QueryResult {
  answer: string;
  sources: {
    name: string;
    type: string;
    similarity: number;
    preview: string;
  }[];
}

export interface IndexDocumentRequest {
  name: string;
  type?: string;
  content: string;
  contentType?: 'text' | 'markdown' | 'code';
  description?: string;
  streamId?: string;
}

export interface RagStatus {
  configured: boolean;
  pgvectorEnabled: boolean;
  message: string;
}

// Sources
export async function listSources(): Promise<RagSource[]> {
  const response = await apiClient.get('/rag/sources');
  return response.data.data;
}

export async function getSource(id: string): Promise<RagSource> {
  const response = await apiClient.get(`/rag/sources/${id}`);
  return response.data.data;
}

export async function indexDocument(data: IndexDocumentRequest): Promise<{ sourceId: string; chunksCount: number }> {
  const response = await apiClient.post('/rag/sources', data);
  return response.data.data;
}

export async function uploadFile(
  file: File,
  options?: {
    type?: string;
    description?: string;
    streamId?: string;
  }
): Promise<{ sourceId: string; chunksCount: number }> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.type) formData.append('type', options.type);
  if (options?.description) formData.append('description', options.description);
  if (options?.streamId) formData.append('streamId', options.streamId);

  const response = await apiClient.post('/rag/sources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function deleteSource(id: string): Promise<void> {
  await apiClient.delete(`/rag/sources/${id}`);
}

export async function updateSourceStatus(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/rag/sources/${id}`, { isActive });
}

// Query & Search
export async function ragQuery(
  question: string,
  options?: { sourceType?: string; limit?: number; threshold?: number }
): Promise<QueryResult> {
  const response = await apiClient.post('/rag/query', { question, ...options });
  return response.data.data;
}

export async function ragSearch(
  query: string,
  options?: { sourceType?: string; limit?: number; threshold?: number }
): Promise<SearchResult[]> {
  const response = await apiClient.post('/rag/search', { query, ...options });
  return response.data.data;
}

// Status
export async function getStatus(): Promise<RagStatus> {
  const response = await apiClient.get('/rag/status');
  return response.data.data;
}

export default {
  listSources,
  getSource,
  indexDocument,
  uploadFile,
  deleteSource,
  updateSourceStatus,
  query: ragQuery,
  search: ragSearch,
  getStatus,
};
