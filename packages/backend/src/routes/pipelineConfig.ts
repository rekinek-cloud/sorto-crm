import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import { PipelineConfigLoader } from '../services/ai/PipelineConfigLoader';
import { DEFAULT_PIPELINE_CONFIG } from '../services/ai/PipelineConfigDefaults';

const router = Router();

const VALID_SECTIONS = [
  'classifications',
  'aiParams',
  'thresholds',
  'keywords',
  'domains',
  'scheduling',
  'contentLimits',
  'postActions',
  'systemRules',
  'taskExtraction',
] as const;

type SectionName = typeof VALID_SECTIONS[number];

function isValidSection(section: string): section is SectionName {
  return VALID_SECTIONS.includes(section as SectionName);
}

/**
 * GET /api/v1/admin/pipeline-config
 * Get pipeline config for the user's organization (merged with defaults)
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;

      const config = await PipelineConfigLoader.loadConfig(prisma as any, organizationId);

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      logger.error('Failed to get pipeline config:', error);
      throw new AppError('Failed to retrieve pipeline configuration', 500);
    }
  }
);

/**
 * PUT /api/v1/admin/pipeline-config
 * Update pipeline config section (admin/owner only)
 * Body: { section: string, data: any }
 */
router.put('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      const { section, data } = req.body;

      if (!section || !data) {
        throw new AppError('Missing required fields: section and data', 400);
      }

      if (!isValidSection(section)) {
        throw new AppError(`Invalid section: ${section}. Valid sections: ${VALID_SECTIONS.join(', ')}`, 400);
      }

      // Check if config exists
      const existing = await prisma.pipeline_config.findUnique({
        where: { organizationId },
      });

      let updatedRecord;

      if (existing) {
        // Update just the specified section
        updatedRecord = await prisma.pipeline_config.update({
          where: { organizationId },
          data: {
            [section]: data,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create with defaults + override for the specified section
        const defaults = PipelineConfigLoader.getDefaults();
        const createData: Record<string, any> = {
          organizationId,
          updatedAt: new Date(),
        };

        // Set all sections to empty (so defaults will apply via merge)
        for (const s of VALID_SECTIONS) {
          createData[s] = s === section ? data : {};
        }

        updatedRecord = await prisma.pipeline_config.create({
          data: createData,
        });
      }

      // Invalidate cache so next load picks up changes
      PipelineConfigLoader.invalidateCache(organizationId);

      // Return the merged config (DB + defaults)
      const mergedConfig = await PipelineConfigLoader.loadConfig(prisma as any, organizationId);

      logger.info(`Pipeline config section '${section}' updated by ${req.user!.email} for org ${organizationId}`);

      res.json({
        success: true,
        data: mergedConfig,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update pipeline config:', error);
      throw new AppError('Failed to update pipeline configuration', 500);
    }
  }
);

/**
 * POST /api/v1/admin/pipeline-config/reset-section
 * Reset a section to defaults (admin/owner only)
 * Body: { section: string }
 */
router.post('/reset-section',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      const { section } = req.body;

      if (!section) {
        throw new AppError('Missing required field: section', 400);
      }

      if (!isValidSection(section)) {
        throw new AppError(`Invalid section: ${section}. Valid sections: ${VALID_SECTIONS.join(', ')}`, 400);
      }

      // Check if config exists
      const existing = await prisma.pipeline_config.findUnique({
        where: { organizationId },
      });

      if (existing) {
        // Set the section to empty object so defaults will be used on merge
        await prisma.pipeline_config.update({
          where: { organizationId },
          data: {
            [section]: {},
            updatedAt: new Date(),
          },
        });
      }
      // If no config exists, defaults are already in use - nothing to reset

      // Invalidate cache
      PipelineConfigLoader.invalidateCache(organizationId);

      // Return the merged config (will now use defaults for the reset section)
      const mergedConfig = await PipelineConfigLoader.loadConfig(prisma as any, organizationId);

      logger.info(`Pipeline config section '${section}' reset to defaults by ${req.user!.email} for org ${organizationId}`);

      res.json({
        success: true,
        data: mergedConfig,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to reset pipeline config section:', error);
      throw new AppError('Failed to reset pipeline configuration section', 500);
    }
  }
);

/**
 * GET /api/v1/admin/pipeline-config/defaults
 * Get default values (for UI comparison)
 */
router.get('/defaults',
  authenticateToken,
  async (req, res) => {
    try {
      const defaults = PipelineConfigLoader.getDefaults();

      res.json({
        success: true,
        data: defaults,
      });
    } catch (error) {
      logger.error('Failed to get pipeline config defaults:', error);
      throw new AppError('Failed to retrieve pipeline configuration defaults', 500);
    }
  }
);

export default router;
