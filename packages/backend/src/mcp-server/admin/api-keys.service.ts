/**
 * API Keys Admin Service
 * Zarządzanie kluczami API dla MCP (tylko admin)
 */

import crypto from 'crypto';
import { prisma } from '../../config/database';
import { ApiKeyCreateResult, ApiKeyInfo } from '../types/mcp.types';
import logger from '../../config/logger';

export class ApiKeysService {
  /**
   * Generuje nowy klucz API dla organizacji
   */
  async createKey(
    organizationId: string,
    createdById: string,
    name?: string
  ): Promise<ApiKeyCreateResult> {
    // Generuj losowy klucz: sk_live_<32 znaki base64url>
    const randomBytes = crypto.randomBytes(24);
    const key = `sk_live_${randomBytes.toString('base64url')}`;

    // Hash klucza do przechowywania
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    // Prefix do wyświetlania (pierwsze 12 znaków)
    const keyPrefix = key.substring(0, 12);

    const record = await prisma.mcp_api_keys.create({
      data: {
        keyHash,
        keyPrefix,
        organizationId,
        createdById,
        name: name || `Klucz MCP - ${new Date().toISOString().split('T')[0]}`,
      },
    });

    logger.info(`[ApiKeysService] Created API key ${keyPrefix}... for org: ${organizationId}`);

    return {
      key,        // Zwracamy RAZ - potem nie da się odzyskać!
      keyPrefix,
      id: record.id,
    };
  }

  /**
   * Lista kluczy organizacji
   */
  async listKeys(organizationId: string): Promise<ApiKeyInfo[]> {
    const keys = await prisma.mcp_api_keys.findMany({
      where: { organizationId },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  /**
   * Pobierz pojedynczy klucz
   */
  async getKey(keyId: string): Promise<ApiKeyInfo | null> {
    const key = await prisma.mcp_api_keys.findUnique({
      where: { id: keyId },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return key;
  }

  /**
   * Dezaktywuj klucz
   */
  async revokeKey(keyId: string): Promise<void> {
    await prisma.mcp_api_keys.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    logger.info(`[ApiKeysService] Revoked API key: ${keyId}`);
  }

  /**
   * Usuń klucz
   */
  async deleteKey(keyId: string): Promise<void> {
    await prisma.mcp_api_keys.delete({
      where: { id: keyId },
    });

    logger.info(`[ApiKeysService] Deleted API key: ${keyId}`);
  }

  /**
   * Aktualizuj nazwę klucza
   */
  async updateKeyName(keyId: string, name: string): Promise<void> {
    await prisma.mcp_api_keys.update({
      where: { id: keyId },
      data: { name },
    });
  }

  /**
   * Pobierz statystyki użycia klucza
   */
  async getKeyUsageStats(keyId: string): Promise<{
    totalCalls: number;
    successfulCalls: number;
    lastWeekCalls: number;
    avgResponseTime: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalStats, lastWeekStats] = await Promise.all([
      prisma.mcp_usage_logs.aggregate({
        where: { apiKeyId: keyId },
        _count: true,
        _avg: { responseTimeMs: true },
      }),
      prisma.mcp_usage_logs.aggregate({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: oneWeekAgo },
        },
        _count: true,
      }),
    ]);

    const successfulCalls = await prisma.mcp_usage_logs.count({
      where: { apiKeyId: keyId, success: true },
    });

    return {
      totalCalls: totalStats._count,
      successfulCalls,
      lastWeekCalls: lastWeekStats._count,
      avgResponseTime: Math.round(totalStats._avg.responseTimeMs || 0),
    };
  }

  /**
   * Pobierz historię użycia klucza
   */
  async getKeyUsageHistory(
    keyId: string,
    limit: number = 50
  ): Promise<Array<{
    toolName: string;
    query: string | null;
    success: boolean;
    responseTimeMs: number | null;
    createdAt: Date;
  }>> {
    return prisma.mcp_usage_logs.findMany({
      where: { apiKeyId: keyId },
      select: {
        toolName: true,
        query: true,
        success: true,
        responseTimeMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const apiKeysService = new ApiKeysService();
