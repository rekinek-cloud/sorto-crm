import { Router } from 'express';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/v1/admin/mcp-keys
 * Lista kluczy MCP API dla organizacji
 */
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

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

    return res.json({ success: true, keys });
  } catch (error: any) {
    logger.error('Error listing MCP keys:', error);
    return res.status(500).json({ success: false, error: 'Failed to list MCP keys' });
  }
});

/**
 * POST /api/v1/admin/mcp-keys
 * Utwórz nowy klucz MCP API
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const { name } = req.body;

    // Generate a random API key
    const rawKey = `mcp_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await prisma.mcp_api_keys.create({
      data: {
        keyHash,
        keyPrefix,
        name: name || null,
        organizationId,
        createdById: userId,
      },
    });

    return res.status(201).json({
      success: true,
      id: apiKey.id,
      key: rawKey, // Only returned once!
      keyPrefix,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
    });
  } catch (error: any) {
    logger.error('Error creating MCP key:', error);
    return res.status(500).json({ success: false, error: 'Failed to create MCP key' });
  }
});

/**
 * GET /api/v1/admin/mcp-keys/:keyId
 * Szczegóły klucza z statystykami
 */
router.get('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const organizationId = req.user!.organizationId;

    const apiKey = await prisma.mcp_api_keys.findFirst({
      where: { id: keyId, organizationId },
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

    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    // Get usage stats
    const [totalCalls, successfulCalls, lastWeekCalls, avgResponse] = await Promise.all([
      prisma.mcp_usage_logs.count({ where: { apiKeyId: keyId } }),
      prisma.mcp_usage_logs.count({ where: { apiKeyId: keyId, success: true } }),
      prisma.mcp_usage_logs.count({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.mcp_usage_logs.aggregate({
        where: { apiKeyId: keyId, responseTimeMs: { not: null } },
        _avg: { responseTimeMs: true },
      }),
    ]);

    return res.json({
      success: true,
      key: apiKey,
      stats: {
        totalCalls,
        successfulCalls,
        lastWeekCalls,
        avgResponseTime: Math.round(avgResponse._avg.responseTimeMs || 0),
      },
    });
  } catch (error: any) {
    logger.error('Error getting MCP key:', error);
    return res.status(500).json({ success: false, error: 'Failed to get MCP key' });
  }
});

/**
 * PATCH /api/v1/admin/mcp-keys/:keyId
 * Aktualizuj nazwę klucza
 */
router.patch('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const organizationId = req.user!.organizationId;
    const { name } = req.body;

    const existing = await prisma.mcp_api_keys.findFirst({
      where: { id: keyId, organizationId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    const updated = await prisma.mcp_api_keys.update({
      where: { id: keyId },
      data: { name },
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

    return res.json({ success: true, key: updated });
  } catch (error: any) {
    logger.error('Error updating MCP key:', error);
    return res.status(500).json({ success: false, error: 'Failed to update MCP key' });
  }
});

/**
 * POST /api/v1/admin/mcp-keys/:keyId/revoke
 * Dezaktywuj klucz
 */
router.post('/:keyId/revoke', async (req, res) => {
  try {
    const { keyId } = req.params;
    const organizationId = req.user!.organizationId;

    const existing = await prisma.mcp_api_keys.findFirst({
      where: { id: keyId, organizationId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    await prisma.mcp_api_keys.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return res.json({ success: true, message: 'Key revoked' });
  } catch (error: any) {
    logger.error('Error revoking MCP key:', error);
    return res.status(500).json({ success: false, error: 'Failed to revoke MCP key' });
  }
});

/**
 * DELETE /api/v1/admin/mcp-keys/:keyId
 * Usuń klucz
 */
router.delete('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const organizationId = req.user!.organizationId;

    const existing = await prisma.mcp_api_keys.findFirst({
      where: { id: keyId, organizationId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    await prisma.mcp_api_keys.delete({ where: { id: keyId } });

    return res.json({ success: true, message: 'Key deleted' });
  } catch (error: any) {
    logger.error('Error deleting MCP key:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete MCP key' });
  }
});

/**
 * GET /api/v1/admin/mcp-keys/:keyId/usage
 * Historia użycia klucza
 */
router.get('/:keyId/usage', async (req, res) => {
  try {
    const { keyId } = req.params;
    const organizationId = req.user!.organizationId;
    const limit = parseInt(req.query.limit as string) || 50;

    const existing = await prisma.mcp_api_keys.findFirst({
      where: { id: keyId, organizationId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    const [history, totalCalls, successfulCalls, lastWeekCalls, avgResponse] = await Promise.all([
      prisma.mcp_usage_logs.findMany({
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
      }),
      prisma.mcp_usage_logs.count({ where: { apiKeyId: keyId } }),
      prisma.mcp_usage_logs.count({ where: { apiKeyId: keyId, success: true } }),
      prisma.mcp_usage_logs.count({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.mcp_usage_logs.aggregate({
        where: { apiKeyId: keyId, responseTimeMs: { not: null } },
        _avg: { responseTimeMs: true },
      }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalCalls,
        successfulCalls,
        lastWeekCalls,
        avgResponseTime: Math.round(avgResponse._avg.responseTimeMs || 0),
      },
      history,
    });
  } catch (error: any) {
    logger.error('Error getting MCP key usage:', error);
    return res.status(500).json({ success: false, error: 'Failed to get MCP key usage' });
  }
});

export default router;
