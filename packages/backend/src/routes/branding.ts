/**
 * Organization Branding Routes (White Label)
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken as authMiddleware } from '../shared/middleware/auth';
import { subscriptionService } from '../services/SubscriptionService';
import { logger } from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  companyName: z.string().max(100).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  customDomain: z.string().max(100).optional().nullable(),
  emailFromName: z.string().max(100).optional().nullable(),
  emailSignature: z.string().max(2000).optional().nullable(),
  customCss: z.string().max(50000).optional().nullable(),
});

/**
 * GET /api/v1/branding
 * Get organization branding
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    let branding = await prisma.organizationBranding.findUnique({
      where: { organizationId },
    });

    // Return default branding if none exists
    if (!branding) {
      branding = {
        id: '',
        organizationId,
        logoUrl: null,
        faviconUrl: null,
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        accentColor: '#10B981',
        companyName: null,
        tagline: null,
        footerText: null,
        customDomain: null,
        emailFromName: null,
        emailSignature: null,
        customCss: null,
        customJs: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    res.json({ branding });
  } catch (error) {
    logger.error('Error fetching branding:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

/**
 * PUT /api/v1/branding
 * Update organization branding
 */
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    // Check feature access (White Label is premium feature)
    const featureCheck = await subscriptionService.checkFeature(organizationId, 'whiteLabel');

    // Allow basic color customization for all plans
    const isWhiteLabelRequest = req.body.customDomain || req.body.customCss || req.body.customJs;

    if (isWhiteLabelRequest && !featureCheck.allowed) {
      return res.status(403).json({ error: 'White label features require Enterprise plan' });
    }

    const validation = brandingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const branding = await prisma.organizationBranding.upsert({
      where: { organizationId },
      update: validation.data,
      create: {
        organizationId,
        ...validation.data,
      },
    });

    logger.info(`Updated branding for organization ${organizationId}`);
    res.json({ branding });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('customDomain')) {
      return res.status(409).json({ error: 'This domain is already in use' });
    }
    logger.error('Error updating branding:', error);
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

/**
 * DELETE /api/v1/branding
 * Reset branding to defaults
 */
router.delete('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    await prisma.organizationBranding.deleteMany({
      where: { organizationId },
    });

    logger.info(`Reset branding for organization ${organizationId}`);
    res.json({ success: true, message: 'Branding reset to defaults' });
  } catch (error) {
    logger.error('Error resetting branding:', error);
    res.status(500).json({ error: 'Failed to reset branding' });
  }
});

/**
 * GET /api/v1/branding/domain/:domain
 * Get branding by custom domain (public endpoint for white label)
 */
router.get('/domain/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;

    const branding = await prisma.organizationBranding.findUnique({
      where: { customDomain: domain },
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!branding || !branding.isActive) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({
      branding: {
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        companyName: branding.companyName || branding.organization.name,
        tagline: branding.tagline,
        footerText: branding.footerText,
        customCss: branding.customCss,
      },
    });
  } catch (error) {
    logger.error('Error fetching branding by domain:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

/**
 * POST /api/v1/branding/verify-domain
 * Verify custom domain ownership
 */
router.post('/verify-domain', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // In production, this would verify DNS records
    // For now, we'll just check if domain format is valid
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    // Check if domain is already taken
    const existing = await prisma.organizationBranding.findUnique({
      where: { customDomain: domain },
    });

    if (existing && existing.organizationId !== organizationId) {
      return res.status(409).json({ error: 'Domain is already in use' });
    }

    res.json({
      verified: true,
      message: 'Domain is available',
      instructions: [
        'Add a CNAME record pointing to streams-crm.com',
        'Wait for DNS propagation (up to 48 hours)',
        'Save your branding settings with the custom domain',
      ],
    });
  } catch (error) {
    logger.error('Error verifying domain:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

export default router;
