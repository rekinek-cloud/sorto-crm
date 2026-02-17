import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/v1/ai-suggestions
 * List AI suggestions with filters
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const { status, type, limit = '50' } = req.query;

      const where: any = {
        organization_id: req.user!.organizationId,
      };

      if (status) where.status = status;
      if (type) {
        where.context = type; // Use context field for suggestion type
      }

      const suggestions = await prisma.ai_suggestions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Math.min(parseInt(limit as string), 100),
      });

      // Map to consistent format
      const mapped = suggestions.map(s => ({
        id: s.id,
        organizationId: s.organization_id,
        userId: s.user_id,
        suggestionType: s.context,
        title: (s.suggestion as any)?.title || 'Sugestia AI',
        description: (s.suggestion as any)?.description || s.reasoning,
        data: s.suggestion,
        confidence: s.confidence || 0,
        status: s.status,
        createdAt: s.created_at.toISOString(),
        resolvedAt: s.resolved_at?.toISOString() || null,
      }));

      return res.json({ success: true, data: mapped });
    } catch (error) {
      logger.error('Failed to list AI suggestions:', error);
      throw new AppError('Nie udało się pobrać sugestii', 500);
    }
  }
);

/**
 * POST /api/v1/ai-suggestions/:id/accept
 * Accept an AI suggestion
 */
router.post('/:id/accept',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const suggestion = await prisma.ai_suggestions.findFirst({
        where: { id, organization_id: req.user!.organizationId },
      });

      if (!suggestion) throw new AppError('Sugestia nie znaleziona', 404);
      if (suggestion.status !== 'PENDING') throw new AppError('Sugestia już rozpatrzona', 400);

      // Apply the suggestion based on type
      const data = suggestion.suggestion as any;

      if (suggestion.context === 'BLACKLIST_DOMAIN' && data?.domain) {
        // Add domain to blacklist
        await prisma.email_domain_rules.create({
          data: {
            pattern: data.domain,
            patternType: 'DOMAIN',
            listType: 'BLACKLIST',
            classification: data.classification || 'NEWSLETTER',
            source: 'AI_SUGGESTED',
            reason: data.reason || 'Zaakceptowana sugestia AI',
            confidence: (suggestion.confidence || 0) / 100,
            createdBy: req.user!.id,
            organizationId: req.user!.organizationId,
          },
        }).catch(() => {
          // Ignore if already exists
        });
      }

      // Mark as accepted
      await prisma.ai_suggestions.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          resolved_at: new Date(),
          user_modifications: { acceptedBy: req.user!.id },
        },
      });

      logger.info(`AI suggestion accepted: ${id} by ${req.user!.email}`);
      return res.json({ success: true, message: 'Sugestia zaakceptowana' });
    } catch (error) {
      logger.error('Failed to accept suggestion:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udało się zaakceptować sugestii', 500);
    }
  }
);

/**
 * POST /api/v1/ai-suggestions/:id/reject
 * Reject an AI suggestion
 */
router.post('/:id/reject',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      const suggestion = await prisma.ai_suggestions.findFirst({
        where: { id, organization_id: req.user!.organizationId },
      });

      if (!suggestion) throw new AppError('Sugestia nie znaleziona', 404);
      if (suggestion.status !== 'PENDING') throw new AppError('Sugestia już rozpatrzona', 400);

      await prisma.ai_suggestions.update({
        where: { id },
        data: {
          status: 'REJECTED',
          resolved_at: new Date(),
          user_modifications: { rejectedBy: req.user!.id, note: note || null },
        },
      });

      logger.info(`AI suggestion rejected: ${id} by ${req.user!.email}`);
      return res.json({ success: true, message: 'Sugestia odrzucona' });
    } catch (error) {
      logger.error('Failed to reject suggestion:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udało się odrzucić sugestii', 500);
    }
  }
);

export default router;
