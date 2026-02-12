import { Request, Response } from 'express';
import { overlaysService } from './overlays.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import logger from '../../config/logger';

export class OverlaysController {
  /**
   * GET /api/v1/overlays
   * List all available overlays
   */
  list = async (req: Request, res: Response) => {
    try {
      const overlays = await overlaysService.getAllOverlays();
      res.json({
        message: 'Overlays retrieved',
        data: overlays,
      });
    } catch (error: any) {
      logger.error('Error listing overlays:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/overlays/current
   * Get current overlay for authenticated user's organization
   * Respects domain-specific overlay mapping
   */
  getCurrent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const hostname = req.get('host') || '';
      const overlay = await overlaysService.getOrganizationOverlay(
        req.user!.organizationId,
        hostname
      );
      res.json({
        message: 'Current overlay retrieved',
        data: overlay,
      });
    } catch (error: any) {
      logger.error('Error getting current overlay:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/overlays/navigation
   * Get navigation for authenticated user's organization
   * Respects domain-specific overlay mapping
   */
  getNavigation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const hostname = req.get('host') || '';
      const overlay = await overlaysService.getOrganizationOverlay(
        req.user!.organizationId,
        hostname
      );

      res.json({
        message: 'Navigation retrieved',
        data: {
          navigation: overlay.navigation,
          branding: {
            primaryColor: overlay.primaryColor,
            logo: overlay.logo,
            name: overlay.name,
          },
        },
      });
    } catch (error: any) {
      logger.error('Error getting navigation:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/overlays/branding
   * Get branding for current domain (PUBLIC - no auth required)
   * Used by login page to show domain-specific branding
   */
  getBranding = async (req: Request, res: Response) => {
    try {
      const hostname = req.get('host') || '';
      const overlay = await overlaysService.getOverlayByDomain(hostname);

      if (overlay) {
        res.json({
          message: 'Branding retrieved',
          data: {
            name: overlay.name,
            primaryColor: overlay.primaryColor,
            logo: overlay.logo,
            slug: overlay.slug,
          },
        });
      } else {
        // Return default branding if no domain mapping
        res.json({
          message: 'Default branding',
          data: {
            name: 'STREAMS',
            primaryColor: '#6366f1',
            logo: null,
            slug: null,
          },
        });
      }
    } catch (error: any) {
      logger.error('Error getting branding:', error);
      // Return default on error
      res.json({
        message: 'Default branding',
        data: {
          name: 'STREAMS',
          primaryColor: '#6366f1',
          logo: null,
          slug: null,
        },
      });
    }
  };

  /**
   * GET /api/v1/overlays/:slug
   * Get specific overlay by slug
   */
  getBySlug = async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const overlay = await overlaysService.getOverlayBySlug(slug);

      if (!overlay) {
        res.status(404).json({ error: 'Overlay not found' });
        return;
      }

      res.json({
        message: 'Overlay retrieved',
        data: overlay,
      });
    } catch (error: any) {
      logger.error('Error getting overlay:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /api/v1/overlays/current
   * Set overlay for current organization (ADMIN/OWNER only)
   */
  setCurrent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { overlaySlug } = req.body;

      if (!overlaySlug) {
        res.status(400).json({ error: 'overlaySlug is required' });
        return;
      }

      await overlaysService.setOrganizationOverlay(
        req.user!.organizationId,
        overlaySlug
      );

      const overlay = await overlaysService.getOrganizationOverlay(
        req.user!.organizationId
      );

      res.json({
        message: 'Overlay updated',
        data: overlay,
      });
    } catch (error: any) {
      logger.error('Error setting overlay:', error);
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /api/v1/overlays/module/:moduleSlug/visible
   * Check if module is visible for current organization
   */
  isModuleVisible = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { moduleSlug } = req.params;

      const visible = await overlaysService.isModuleVisible(
        req.user!.organizationId,
        moduleSlug
      );

      res.json({
        message: 'Module visibility checked',
        data: { moduleSlug, visible },
      });
    } catch (error: any) {
      logger.error('Error checking module visibility:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/v1/overlays/seed
   * Seed default overlays (admin only)
   */
  seedDefaults = async (req: AuthenticatedRequest, res: Response) => {
    try {
      await overlaysService.seedDefaultOverlays();
      res.json({
        message: 'Default overlays seeded',
      });
    } catch (error: any) {
      logger.error('Error seeding overlays:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
