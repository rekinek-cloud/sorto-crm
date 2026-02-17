import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import { RuleProcessingPipeline } from '../services/ai/RuleProcessingPipeline';

const router = Router();

/**
 * GET /api/v1/data-processing/stats
 * Get processing statistics
 */
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const orgId = req.user!.organizationId;
      const { period = 'day' } = req.query;

      const now = new Date();
      let since: Date;
      switch (period) {
        case 'week':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const where = {
        organizationId: orgId,
        createdAt: { gte: since },
      };

      const [total, completed, failed, byClass] = await Promise.all([
        prisma.data_processing.count({ where }),
        prisma.data_processing.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.data_processing.count({ where: { ...where, status: 'FAILED' } }),
        prisma.data_processing.groupBy({
          by: ['finalClass'],
          where: { ...where, finalClass: { not: null } },
          _count: true,
        }),
      ]);

      const classification: Record<string, number> = {};
      byClass.forEach((g: any) => {
        if (g.finalClass) classification[g.finalClass] = g._count;
      });

      const addedToRag = await prisma.data_processing.count({
        where: { ...where, addedToRag: true },
      });
      const addedToFlow = await prisma.data_processing.count({
        where: { ...where, addedToFlow: true },
      });

      return res.json({
        success: true,
        data: {
          period,
          total,
          completed,
          failed,
          pending: total - completed - failed,
          classification,
          addedToRag,
          addedToFlow,
        },
      });
    } catch (error) {
      logger.error('Failed to get processing stats:', error);
      throw new AppError('Nie udalo sie pobrac statystyk', 500);
    }
  }
);

/**
 * GET /api/v1/data-processing/:entityType/:entityId
 * Get processing status for specific entity
 */
router.get('/:entityType/:entityId',
  authenticateToken,
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;

      const record = await prisma.data_processing.findFirst({
        where: {
          organizationId: req.user!.organizationId,
          entityType: entityType.toUpperCase(),
          entityId,
        },
      });

      if (!record) throw new AppError('Rekord przetwarzania nie znaleziony', 404);

      return res.json({ success: true, data: record });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get processing record:', error);
      throw new AppError('Nie udalo sie pobrac rekordu', 500);
    }
  }
);

/**
 * POST /api/v1/data-processing/process
 * Process a single entity through the rule pipeline
 */
router.post('/process',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { entityType, entityId, entityData } = req.body;

      if (!entityType || !entityId) {
        throw new AppError('entityType i entityId sa wymagane', 400);
      }

      const pipeline = new RuleProcessingPipeline(prisma);
      const result = await pipeline.processEntity(
        req.user!.organizationId,
        entityType,
        entityId,
        entityData || {}
      );

      return res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to process entity:', error);
      throw new AppError('Nie udalo sie przetworzyc encji', 500);
    }
  }
);

/**
 * POST /api/v1/data-processing/batch
 * Batch process multiple entities
 */
router.post('/batch',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { entityType, limit = 50 } = req.body;

      if (!entityType) {
        throw new AppError('entityType jest wymagany', 400);
      }

      const orgId = req.user!.organizationId;
      const batchLimit = Math.min(Number(limit), 100);

      const pipeline = new RuleProcessingPipeline(prisma);
      let processedCount = 0;
      const errors: string[] = [];

      const unprocessed = await prisma.data_processing.findMany({
        where: {
          organizationId: orgId,
          entityType: entityType.toUpperCase(),
          status: 'PENDING',
        },
        take: batchLimit,
      });

      for (const record of unprocessed) {
        try {
          await pipeline.processEntity(orgId, entityType, record.entityId, {});
          processedCount++;
        } catch (err: any) {
          errors.push(`${record.entityId}: ${err.message}`);
        }
      }

      return res.json({
        success: true,
        data: {
          requested: batchLimit,
          processed: processedCount,
          errors: errors.length,
          errorDetails: errors.slice(0, 10),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed batch processing:', error);
      throw new AppError('Nie udalo sie przetworzyc batch', 500);
    }
  }
);

/**
 * POST /api/v1/data-processing/correct
 * Correct a classification and learn from it
 */
router.post('/correct',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { entityType, entityId, correctClass } = req.body;

      if (!entityType || !entityId || !correctClass) {
        throw new AppError('entityType, entityId i correctClass sa wymagane', 400);
      }

      const validClasses = ['BUSINESS', 'NEWSLETTER', 'SPAM', 'TRANSACTIONAL', 'PERSONAL', 'UNKNOWN'];
      if (!validClasses.includes(correctClass)) {
        throw new AppError(`correctClass musi byc jednym z: ${validClasses.join(', ')}`, 400);
      }

      const pipeline = new RuleProcessingPipeline(prisma);
      const result = await pipeline.applyCorrection(
        req.user!.organizationId,
        entityType,
        entityId,
        correctClass,
        req.user!.id
      );

      if (!result.updated) {
        throw new AppError('Rekord przetwarzania nie znaleziony', 404);
      }

      logger.info(`Classification corrected: ${entityType}/${entityId} -> ${correctClass} by ${req.user!.email}`);
      return res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to correct classification:', error);
      throw new AppError('Nie udalo sie skorygowac klasyfikacji', 500);
    }
  }
);

/**
 * POST /api/v1/data-processing/reprocess
 * Reprocess completed entities (e.g., after rules change)
 */
router.post('/reprocess',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const { entityType, limit = 50, status = 'COMPLETED' } = req.body;

      if (!entityType) {
        throw new AppError('entityType jest wymagany', 400);
      }

      const orgId = req.user!.organizationId;
      const batchLimit = Math.min(Number(limit), 100);

      // Reset status to PENDING for reprocessing
      const updated = await prisma.data_processing.updateMany({
        where: {
          organizationId: orgId,
          entityType: entityType.toUpperCase(),
          status,
        },
        data: { status: 'PENDING' },
      });

      // Then process them
      const pipeline = new RuleProcessingPipeline(prisma);
      let processedCount = 0;
      const errors: string[] = [];

      const toReprocess = await prisma.data_processing.findMany({
        where: {
          organizationId: orgId,
          entityType: entityType.toUpperCase(),
          status: 'PENDING',
        },
        take: batchLimit,
      });

      for (const record of toReprocess) {
        try {
          await pipeline.processEntity(orgId, entityType, record.entityId, {});
          processedCount++;
        } catch (err: any) {
          errors.push(`${record.entityId}: ${err.message}`);
        }
      }

      return res.json({
        success: true,
        data: {
          reset: updated.count,
          processed: processedCount,
          errors: errors.length,
          errorDetails: errors.slice(0, 10),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed reprocessing:', error);
      throw new AppError('Nie udalo sie ponownie przetworzyc', 500);
    }
  }
);

export default router;
