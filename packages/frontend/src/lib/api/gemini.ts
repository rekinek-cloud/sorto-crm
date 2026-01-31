/**
 * Gemini API Client
 * Frontend client for Gemini Vision, Caching, and 1M context
 */

import apiClient from './client';

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

export interface GeminiStatus {
  configured: boolean;
  isAvailable?: boolean;
  message?: string;
  models?: GeminiModel[];
}

export interface ImageTags {
  tags: string[];
  category: string;
  description: string;
  mood: string;
  colors: string[];
  objects: string[];
  people: boolean;
  facesCount: number;
}

export interface CacheInfo {
  cacheName: string;
  displayName: string;
  expireTime: string;
  model: string;
  streamId?: string;
}

// Chat
export async function chat(prompt: string, model?: string): Promise<string> {
  const response = await apiClient.post('/gemini/chat', { prompt, model });
  return response.data.data.response;
}

// Vision - analyze uploaded image
export async function analyzeImage(file: File, prompt?: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  if (prompt) formData.append('prompt', prompt);

  const response = await apiClient.post('/gemini/vision/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.analysis;
}

// Vision - analyze base64 image
export async function analyzeImageBase64(
  imageBase64: string,
  mimeType?: string,
  prompt?: string
): Promise<string> {
  const response = await apiClient.post('/gemini/vision/analyze-base64', {
    imageBase64,
    mimeType,
    prompt,
  });
  return response.data.data.analysis;
}

// Vision - auto-tag image
export async function autoTagImage(file: File): Promise<ImageTags> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post('/gemini/vision/tags', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

// Vision - OCR
export async function ocr(file: File, language?: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  if (language) formData.append('language', language);

  const response = await apiClient.post('/gemini/vision/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.text;
}

// Cache - create RAG cache
export async function createCache(
  name: string,
  documents: Array<{ name: string; content: string }>,
  ttlSeconds?: number
): Promise<CacheInfo> {
  const response = await apiClient.post('/gemini/cache/create', {
    name,
    documents,
    ttlSeconds,
  });
  return response.data.data;
}

// Cache - query with cache (90% cheaper!)
export async function queryWithCache(cacheName: string, question: string): Promise<string> {
  const response = await apiClient.post('/gemini/cache/query', {
    cacheName,
    question,
  });
  return response.data.data.answer;
}

// Cache - list active caches
export async function listCaches(): Promise<CacheInfo[]> {
  const response = await apiClient.get('/gemini/cache/list');
  return response.data.data;
}

// Cache - delete cache
export async function deleteCache(name: string): Promise<void> {
  await apiClient.delete(`/gemini/cache/${name}`);
}

// Large context analysis
export async function analyzeContext(
  files: Array<{ name: string; content: string }>,
  prompt: string
): Promise<string> {
  const response = await apiClient.post('/gemini/analyze-context', {
    files,
    prompt,
  });
  return response.data.data.analysis;
}

// Count tokens
export async function countTokens(text: string): Promise<number> {
  const response = await apiClient.post('/gemini/count-tokens', { text });
  return response.data.data.tokens;
}

// Models
export async function getModels(): Promise<GeminiModel[]> {
  const response = await apiClient.get('/gemini/models');
  return response.data.data;
}

// Status
export async function getStatus(): Promise<GeminiStatus> {
  const response = await apiClient.get('/gemini/status');
  return response.data.data;
}

export default {
  chat,
  analyzeImage,
  analyzeImageBase64,
  autoTagImage,
  ocr,
  createCache,
  queryWithCache,
  listCaches,
  deleteCache,
  analyzeContext,
  countTokens,
  getModels,
  getStatus,
};
