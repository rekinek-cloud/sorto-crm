/**
 * Industry Templates Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { industryService } from '../services/IndustryService';
import { authenticateToken, optionalAuth } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/v1/industries
 * Get all available industry templates (public)
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const templates = await industryService.getAllTemplates();
    res.json({ templates });
  } catch (error) {
    logger.error('Error fetching industry templates:', error);
    res.status(500).json({ error: 'Failed to fetch industry templates' });
  }
});

/**
 * GET /api/v1/industries/categories
 * Get industry categories with counts
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await industryService.getCategories();
    res.json({ categories });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/v1/industries/category/:category
 * Get templates by category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const templates = await industryService.getTemplatesByCategory(category);
    res.json({ templates });
  } catch (error) {
    logger.error('Error fetching templates by category:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/v1/industries/:slug
 * Get template by slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const template = await industryService.getTemplateBySlug(slug);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/v1/industries/apply
 * Apply industry template to organization
 */
router.post('/apply', authenticateToken, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      templateSlug: z.string().min(1),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request', details: validation.error.errors });
    }

    const { templateSlug } = validation.data;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const result = await industryService.applyTemplate(organizationId, templateSlug, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    logger.error('Error applying template:', error);
    res.status(500).json({ error: 'Failed to apply template' });
  }
});

export default router;
