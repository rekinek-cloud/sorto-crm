/**
 * API Key Guard
 * Middleware do autoryzacji requestów MCP przez API Key
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { McpRequest, McpRequestContext } from '../types/mcp.types';
import logger from '../../config/logger';

/**
 * Hashuje klucz API
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Middleware sprawdzający API Key i dodający kontekst MCP do requestu
 */
export async function apiKeyGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    // Pobierz klucz z headera Authorization
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        error: 'Brak klucza API',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Nieprawidłowy format autoryzacji. Użyj: Bearer <klucz>',
        code: 'INVALID_AUTH_FORMAT',
      });
      return;
    }

    const apiKey = authHeader.replace('Bearer ', '');

    if (!apiKey || apiKey.length < 10) {
      return res.status(401).json({
        error: 'Nieprawidłowy klucz API',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    // Znajdź klucz w bazie (po hashu)
    const keyHash = hashApiKey(apiKey);

    const keyRecord = await prisma.mcp_api_keys.findUnique({
      where: { keyHash },
      include: {
        organization: true,
      },
    });

    if (!keyRecord) {
      logger.warn(`[ApiKeyGuard] Invalid API key attempt: ${apiKey.substring(0, 12)}...`);
      return res.status(401).json({
        error: 'Nieprawidłowy klucz API',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    // Sprawdź czy klucz jest aktywny
    if (!keyRecord.isActive) {
      logger.warn(`[ApiKeyGuard] Inactive API key used: ${keyRecord.keyPrefix}`);
      return res.status(401).json({
        error: 'Klucz API jest nieaktywny',
        code: 'INACTIVE_API_KEY',
      });
      return;
    }

    // Sprawdź wygaśnięcie
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      logger.warn(`[ApiKeyGuard] Expired API key used: ${keyRecord.keyPrefix}`);
      return res.status(401).json({
        error: 'Klucz API wygasł',
        code: 'EXPIRED_API_KEY',
      });
      return;
    }

    // Dodaj kontekst MCP do requestu
    const mcpRequest = req as McpRequest;
    mcpRequest.mcpContext = {
      organization: keyRecord.organization,
      apiKeyId: keyRecord.id,
    };

    // Aktualizuj last_used_at (async, nie blokujemy requestu)
    prisma.mcp_api_keys.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(err => {
      logger.error('[ApiKeyGuard] Failed to update lastUsedAt:', err);
    });

    logger.info(`[ApiKeyGuard] Authorized: ${keyRecord.keyPrefix} for org: ${keyRecord.organization.name}`);

    next();
  } catch (error) {
    logger.error('[ApiKeyGuard] Error:', error);
    return res.status(500).json({
      error: 'Błąd autoryzacji',
      code: 'AUTH_ERROR',
    });
  }
}
