/**
 * AI Prompts API Routes
 * CRUD operations for AI prompt templates
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import { z } from 'zod';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { PromptManager } from '../services/ai/PromptManager';

const router = Router();

// Helper: Map Prisma model names
const db = {
  promptTemplates: prisma.ai_prompt_templates,
  promptVersions: prisma.ai_prompt_versions,
  promptOverrides: prisma.ai_prompt_overrides
};

// Validation Schemas
const promptCreateSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be uppercase with underscores'),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().min(1),
  variables: z.record(z.any()).optional(),
  defaultModel: z.string().optional(),
  defaultTemperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  outputSchema: z.record(z.any()).optional()
});

const promptUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().optional(),
  variables: z.record(z.any()).optional(),
  defaultModel: z.string().optional(),
  defaultTemperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  outputSchema: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
});

const testPromptSchema = z.object({
  testData: z.record(z.any()),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional()
});

const overrideSchema = z.object({
  modelOverride: z.string().optional().nullable(),
  temperatureOverride: z.number().min(0).max(2).optional().nullable(),
  languageOverride: z.string().optional().nullable(),
  customInstructions: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

// ===========================================
// GET /api/v1/ai/prompts - List all prompts
// ===========================================
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).user;
    const { category, isSystem, status } = req.query;

    const prompts = await db.promptTemplates.findMany({
      where: {
        organizationId,
        ...(category ? { category: category as string } : {}),
        ...(isSystem !== undefined ? { isSystem: isSystem === 'true' } : {}),
        ...(status ? { status: status as any } : { status: 'ACTIVE' })
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        version: true,
        status: true,
        isSystem: true,
        defaultModel: true,
        defaultTemperature: true,
        maxTokens: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: prompts,
      count: prompts.length
    });
  } catch (error) {
    return next(error);
  }
});

// ===========================================
// GET /api/v1/ai/prompts/:code - Get prompt by code
// ===========================================
router.get('/:code', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).user;
    const { code } = req.params;

    const prompt = await db.promptTemplates.findFirst({
      where: {
        code,
        organizationId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    return res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    return next(error);
  }
});

// ===========================================
// POST /api/v1/ai/prompts - Create new prompt
// ===========================================
router.post('/',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: promptCreateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = (req as any).user;
      const data = req.body;

      // Check if code already exists
      const existing = await db.promptTemplates.findFirst({
        where: {
          code: data.code,
          organizationId
        }
      });

      if (existing) {
        throw new AppError('Prompt with this code already exists', 409);
      }

      const prompt = await db.promptTemplates.create({
        data: {
          id: uuidv4(),
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
          systemPrompt: data.systemPrompt,
          userPromptTemplate: data.userPromptTemplate,
          variables: data.variables || {},
          defaultModel: data.defaultModel || 'gpt-4o-mini',
          defaultTemperature: data.defaultTemperature || 0.3,
          maxTokens: data.maxTokens || 1000,
          outputSchema: data.outputSchema,
          organizationId,
          createdById: userId,
          isSystem: false,
          status: 'ACTIVE',
          version: 1,
          updatedAt: new Date()
        }
      });

      logger.info(`Created new AI prompt: ${prompt.code}`, { userId, organizationId });

      return res.status(201).json({
        success: true,
        data: prompt
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ===========================================
// PUT /api/v1/ai/prompts/:code - Update prompt
// ===========================================
router.put('/:code',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: promptUpdateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = (req as any).user;
      const { code } = req.params;
      const data = req.body;

      const prompt = await db.promptTemplates.findFirst({
        where: {
          code,
          organizationId
        }
      });

      if (!prompt) {
        throw new AppError('Prompt not found', 404);
      }

      // Allow OWNER to edit system prompts, but block other roles
      const userRole = (req as any).user.role;
      if (prompt.isSystem && userRole !== 'OWNER') {
        throw new AppError('Only organization owner can edit system prompts', 403);
      }

      // Save current version before updating
      await PromptManager.savePromptVersion(prompt.id, userId, 'Aktualizacja przez użytkownika');

      const updatedPrompt = await db.promptTemplates.update({
        where: { id: prompt.id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      // Clear template cache
      PromptManager.clearCache();

      logger.info(`Updated AI prompt: ${code}`, { userId, organizationId });

      return res.json({
        success: true,
        data: updatedPrompt
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ===========================================
// DELETE /api/v1/ai/prompts/:code - Delete prompt
// ===========================================
router.delete('/:code',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = (req as any).user;
      const { code } = req.params;

      const prompt = await db.promptTemplates.findFirst({
        where: {
          code,
          organizationId
        }
      });

      if (!prompt) {
        throw new AppError('Prompt not found', 404);
      }

      // Don't allow deleting system prompts
      if (prompt.isSystem) {
        throw new AppError('System prompts cannot be deleted', 403);
      }

      // Soft delete - change status to ARCHIVED
      await db.promptTemplates.update({
        where: { id: prompt.id },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date()
        }
      });

      logger.info(`Archived AI prompt: ${code}`, { userId, organizationId });

      return res.json({
        success: true,
        message: 'Prompt archived successfully'
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ===========================================
// GET /api/v1/ai/prompts/:code/versions - Get version history
// ===========================================
router.get('/:code/versions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).user;
    const { code } = req.params;

    const prompt = await db.promptTemplates.findFirst({
      where: {
        code,
        organizationId
      }
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    const versions = await PromptManager.getVersionHistory(prompt.id);

    return res.json({
      success: true,
      data: versions,
      currentVersion: prompt.version
    });
  } catch (error) {
    return next(error);
  }
});

// ===========================================
// POST /api/v1/ai/prompts/:code/restore/:version - Restore version
// ===========================================
router.post('/:code/restore/:version',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = (req as any).user;
      const { code, version } = req.params;

      const prompt = await db.promptTemplates.findFirst({
        where: {
          code,
          organizationId
        }
      });

      if (!prompt) {
        throw new AppError('Prompt not found', 404);
      }

      if (prompt.isSystem) {
        throw new AppError('System prompts cannot be modified', 403);
      }

      await PromptManager.restoreVersion(prompt.id, parseInt(version), userId);

      // Clear template cache
      PromptManager.clearCache();

      logger.info(`Restored AI prompt ${code} to version ${version}`, { userId, organizationId });

      return res.json({
        success: true,
        message: `Prompt restored to version ${version}`
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ===========================================
// POST /api/v1/ai/prompts/:code/test - Test prompt
// ===========================================
router.post('/:code/test',
  authenticateToken,
  validateRequest({ body: testPromptSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as any).user;
      const { code } = req.params;
      const { testData, model, temperature } = req.body;

      const startTime = Date.now();

      // Compile the prompt with test data
      const compiledPrompt = await PromptManager.compilePrompt(code, {
        variables: testData,
        organizationId,
        modelOverride: model,
        temperatureOverride: temperature
      });

      if (!compiledPrompt) {
        throw new AppError('Prompt not found', 404);
      }

      const processingTime = Date.now() - startTime;

      // Return compiled prompt without executing
      return res.json({
        success: true,
        data: {
          systemPrompt: compiledPrompt.systemPrompt,
          userPrompt: compiledPrompt.userPrompt,
          model: compiledPrompt.model,
          temperature: compiledPrompt.temperature,
          maxTokens: compiledPrompt.maxTokens
        },
        processingTime,
        note: 'Prompt compiled but not executed. Use AI Chat to test execution.'
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ===========================================
// GET /api/v1/ai/prompts/:code/overrides - Get overrides
// ===========================================
router.get('/:code/overrides', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).user;
    const { code } = req.params;

    const prompt = await db.promptTemplates.findFirst({
      where: {
        code,
        organizationId
      }
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    const override = await db.promptOverrides.findUnique({
      where: {
        promptId_organizationId: {
          promptId: prompt.id,
          organizationId
        }
      }
    });

    return res.json({
      success: true,
      data: override || null
    });
  } catch (error) {
    return next(error);
  }
});

// ===========================================
// PUT /api/v1/ai/prompts/:code/overrides - Set overrides
// ===========================================
router.put('/:code/overrides',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN']),
  validateRequest({ body: overrideSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as any).user;
      const { code } = req.params;
      const data = req.body;

      const prompt = await db.promptTemplates.findFirst({
        where: {
          code,
          organizationId
        }
      });

      if (!prompt) {
        throw new AppError('Prompt not found', 404);
      }

      const override = await db.promptOverrides.upsert({
        where: {
          promptId_organizationId: {
            promptId: prompt.id,
            organizationId
          }
        },
        update: {
          modelOverride: data.modelOverride,
          temperatureOverride: data.temperatureOverride,
          languageOverride: data.languageOverride,
          customInstructions: data.customInstructions,
          isActive: data.isActive ?? true,
          updatedAt: new Date()
        },
        create: {
          promptId: prompt.id,
          organizationId,
          modelOverride: data.modelOverride,
          temperatureOverride: data.temperatureOverride,
          languageOverride: data.languageOverride,
          customInstructions: data.customInstructions,
          isActive: data.isActive ?? true
        }
      });

      // Clear template cache
      PromptManager.clearCache();

      return res.json({
        success: true,
        data: override
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ===========================================
// GET /api/v1/ai/prompts/categories - Get available categories
// ===========================================
router.get('/meta/categories', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).user;

    const categories = await db.promptTemplates.findMany({
      where: { organizationId },
      distinct: ['category'],
      select: { category: true }
    });

    return res.json({
      success: true,
      data: categories
        .map((c: { category: string | null }) => c.category)
        .filter((cat): cat is string => Boolean(cat))
        .sort()
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
