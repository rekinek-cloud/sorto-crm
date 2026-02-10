import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/v1/email-domain-rules
 * List domain rules with filters
 */
router.get('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']),
  async (req, res) => {
    try {
      const { listType, status, search } = req.query;

      const where: any = {
        organizationId: req.user!.organizationId,
      };

      if (listType) where.listType = listType;
      if (status) where.status = status;
      if (search) {
        where.pattern = { contains: search as string, mode: 'insensitive' };
      }

      const rules = await prisma.email_domain_rules.findMany({
        where,
        orderBy: [{ matchCount: 'desc' }, { createdAt: 'desc' }],
      });

      res.json({ success: true, data: rules });
    } catch (error) {
      logger.error('Failed to list email domain rules:', error);
      throw new AppError('Nie udało się pobrać reguł domen', 500);
    }
  }
);

/**
 * GET /api/v1/email-domain-rules/stats
 * Count by list type
 */
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const orgId = req.user!.organizationId;

      const [blacklist, whitelist, vip] = await Promise.all([
        prisma.email_domain_rules.count({ where: { organizationId: orgId, listType: 'BLACKLIST', status: 'ACTIVE' } }),
        prisma.email_domain_rules.count({ where: { organizationId: orgId, listType: 'WHITELIST', status: 'ACTIVE' } }),
        prisma.email_domain_rules.count({ where: { organizationId: orgId, listType: 'VIP', status: 'ACTIVE' } }),
      ]);

      res.json({
        success: true,
        data: { blacklist, whitelist, vip, total: blacklist + whitelist + vip },
      });
    } catch (error) {
      logger.error('Failed to get domain rules stats:', error);
      throw new AppError('Nie udało się pobrać statystyk', 500);
    }
  }
);

/**
 * POST /api/v1/email-domain-rules
 * Add a domain/email/wildcard to a list
 */
router.post('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { pattern, patternType, listType, classification, reason } = req.body;

      if (!pattern || !listType) {
        throw new AppError('pattern i listType są wymagane', 400);
      }

      const validListTypes = ['BLACKLIST', 'WHITELIST', 'VIP'];
      if (!validListTypes.includes(listType)) {
        throw new AppError('listType musi być: BLACKLIST, WHITELIST lub VIP', 400);
      }

      // Auto-detect patternType if not provided
      const detectedType = patternType || (
        pattern.includes('*') ? 'WILDCARD' :
        pattern.includes('@') ? 'EMAIL' : 'DOMAIN'
      );

      const rule = await prisma.email_domain_rules.create({
        data: {
          pattern: pattern.toLowerCase().trim(),
          patternType: detectedType,
          listType,
          classification: classification || null,
          source: 'MANUAL',
          reason: reason || null,
          createdBy: req.user!.userId,
          organizationId: req.user!.organizationId,
        },
      });

      logger.info(`Domain rule created: ${pattern} -> ${listType} by ${req.user!.email}`);
      res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError('Ten wzorzec jest już na liście', 409);
      }
      logger.error('Failed to create domain rule:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udało się dodać reguły domeny', 500);
    }
  }
);

/**
 * DELETE /api/v1/email-domain-rules/:id
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      await prisma.email_domain_rules.delete({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
        },
      });

      res.json({ success: true, message: 'Reguła usunięta' });
    } catch (error) {
      logger.error('Failed to delete domain rule:', error);
      throw new AppError('Nie udało się usunąć reguły', 500);
    }
  }
);

/**
 * POST /api/v1/email-domain-rules/bulk
 * Bulk add/remove patterns
 */
router.post('/bulk',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { action, patterns, listType, classification } = req.body;

      if (!action || !patterns || !Array.isArray(patterns) || !listType) {
        throw new AppError('action, patterns[] i listType są wymagane', 400);
      }

      const orgId = req.user!.organizationId;

      if (action === 'ADD') {
        const data = patterns.map((p: string) => ({
          pattern: p.toLowerCase().trim(),
          patternType: p.includes('*') ? 'WILDCARD' : p.includes('@') ? 'EMAIL' : 'DOMAIN',
          listType,
          classification: classification || null,
          source: 'MANUAL',
          createdBy: req.user!.userId,
          organizationId: orgId,
        }));

        // Use createMany with skipDuplicates
        const result = await prisma.email_domain_rules.createMany({
          data,
          skipDuplicates: true,
        });

        res.json({ success: true, data: { created: result.count } });
      } else if (action === 'REMOVE') {
        const result = await prisma.email_domain_rules.deleteMany({
          where: {
            organizationId: orgId,
            pattern: { in: patterns.map((p: string) => p.toLowerCase().trim()) },
            listType,
          },
        });

        res.json({ success: true, data: { deleted: result.count } });
      } else {
        throw new AppError('action musi być ADD lub REMOVE', 400);
      }
    } catch (error) {
      logger.error('Failed bulk domain rules operation:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udało się wykonać operacji bulk', 500);
    }
  }
);

export default router;
