/**
 * MCP API Client
 * Zarządzanie kluczami API dla MCP Server
 */

import { apiClient } from './client';

export interface McpApiKey {
  id: string;
  keyPrefix: string;
  name: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface McpApiKeyWithSecret extends McpApiKey {
  key: string; // Tylko przy tworzeniu - potem nie da się odzyskać!
}

export interface McpKeyUsageStats {
  totalCalls: number;
  successfulCalls: number;
  lastWeekCalls: number;
  avgResponseTime: number;
}

export interface McpUsageLogEntry {
  toolName: string;
  query: string | null;
  success: boolean;
  responseTimeMs: number | null;
  createdAt: string;
}

export interface CreateMcpKeyRequest {
  organizationId?: string;
  name?: string;
}

// === API Functions ===

/**
 * Pobierz listę kluczy API
 */
export async function getMcpApiKeys(organizationId?: string): Promise<McpApiKey[]> {
  const params = organizationId ? { organizationId } : {};
  const response = await apiClient.get('/admin/mcp-keys', { params });
  return response.data.keys;
}

/**
 * Pobierz szczegóły klucza z statystykami
 */
export async function getMcpApiKey(keyId: string): Promise<{
  key: McpApiKey;
  stats: McpKeyUsageStats;
}> {
  const response = await apiClient.get(`/admin/mcp-keys/${keyId}`);
  return response.data;
}

/**
 * Utwórz nowy klucz API
 * UWAGA: Klucz jest zwracany tylko raz - zapisz go!
 */
export async function createMcpApiKey(data: CreateMcpKeyRequest): Promise<McpApiKeyWithSecret> {
  const response = await apiClient.post('/admin/mcp-keys', data);
  return {
    id: response.data.id,
    key: response.data.key,
    keyPrefix: response.data.keyPrefix,
    name: data.name || null,
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    expiresAt: null,
  };
}

/**
 * Aktualizuj nazwę klucza
 */
export async function updateMcpApiKey(keyId: string, name: string): Promise<McpApiKey> {
  const response = await apiClient.patch(`/admin/mcp-keys/${keyId}`, { name });
  return response.data.key;
}

/**
 * Dezaktywuj klucz (revoke)
 */
export async function revokeMcpApiKey(keyId: string): Promise<void> {
  await apiClient.post(`/admin/mcp-keys/${keyId}/revoke`);
}

/**
 * Usuń klucz
 */
export async function deleteMcpApiKey(keyId: string): Promise<void> {
  await apiClient.delete(`/admin/mcp-keys/${keyId}`);
}

/**
 * Pobierz historię użycia klucza
 */
export async function getMcpKeyUsage(keyId: string, limit = 50): Promise<{
  stats: McpKeyUsageStats;
  history: McpUsageLogEntry[];
}> {
  const response = await apiClient.get(`/admin/mcp-keys/${keyId}/usage`, {
    params: { limit },
  });
  return response.data;
}
