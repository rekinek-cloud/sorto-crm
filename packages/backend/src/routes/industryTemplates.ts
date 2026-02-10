import { Router } from 'express';
import { authenticateUser } from '../shared/middleware/auth';
import { industryTemplateService } from '../services/IndustryTemplateService';
import { z } from 'zod';

const router = Router();

// === PUBLIC endpoints (no auth) ===

// GET /api/v1/industry-templates - List all templates
router.get('/', async (_req, res) => {
  try {
    const templates = await industryTemplateService.listTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// GET /api/v1/industry-templates/:slug - Get template details
router.get('/:slug', async (req, res) => {
  try {
    const template = await industryTemplateService.getTemplate(req.params.slug);
    res.json(template);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// === AUTHENTICATED endpoints ===

const applyTemplateSchema = z.object({
  templateSlug: z.string().min(1, 'Template slug is required'),
});

// POST /api/v1/industry-templates/apply - Apply template to current organization
router.post('/apply', authenticateUser, async (req, res) => {
  try {
    const { templateSlug } = applyTemplateSchema.parse(req.body);

    const result = await industryTemplateService.applyTemplate(
      req.user.organizationId,
      templateSlug,
      req.user.id
    );

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    if (error.message?.includes('not found') || error.message?.includes('Cannot replace')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error applying template:', error);
    res.status(500).json({ error: 'Failed to apply template' });
  }
});

// GET /api/v1/industry-templates/current/skin - Get applied template for current org
router.get('/current/skin', authenticateUser, async (req, res) => {
  try {
    const skin = await industryTemplateService.getAppliedTemplate(req.user.organizationId);
    res.json({ industrySkin: skin });
  } catch (error) {
    console.error('Error getting applied template:', error);
    res.status(500).json({ error: 'Failed to get applied template' });
  }
});

export default router;
