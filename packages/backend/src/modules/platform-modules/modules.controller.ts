import { Request, Response } from 'express';
import { platformModulesService } from './modules.service';
import logger from '../../config/logger';

export class PlatformModulesController {
  /**
   * GET /api/v1/platform-modules
   * Get all modules (admin only)
   */
  getAllModules = async (req: Request, res: Response) => {
    try {
      const modules = await platformModulesService.getAllModules();

      res.json({
        message: 'Modules retrieved successfully',
        data: modules,
      });
    } catch (error: any) {
      logger.error('Failed to get modules:', error);
      res.status(500).json({
        message: 'Failed to get modules',
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/platform-modules/available
   * Get modules available for purchase (based on organization's overlay)
   */
  getAvailableModules = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.organizationId) {
        return res.status(401).json({ message: 'Organization not found' });
      }

      const hostname = req.get('host') || '';
      const modules = await platformModulesService.getAvailableModules(
        user.organizationId,
        hostname
      );

      res.json({
        message: 'Available modules retrieved successfully',
        data: modules,
      });
    } catch (error: any) {
      logger.error('Failed to get available modules:', error);
      res.status(500).json({
        message: 'Failed to get available modules',
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/platform-modules/purchased
   * Get purchased modules for organization
   */
  getPurchasedModules = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.organizationId) {
        return res.status(401).json({ message: 'Organization not found' });
      }

      const modules = await platformModulesService.getPurchasedModules(
        user.organizationId
      );

      res.json({
        message: 'Purchased modules retrieved successfully',
        data: modules,
      });
    } catch (error: any) {
      logger.error('Failed to get purchased modules:', error);
      res.status(500).json({
        message: 'Failed to get purchased modules',
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/platform-modules/:slug/status
   * Get module status for organization
   */
  getModuleStatus = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.organizationId) {
        return res.status(401).json({ message: 'Organization not found' });
      }

      const { slug } = req.params;
      const hostname = req.get('host') || '';

      const status = await platformModulesService.getModuleStatus(
        user.organizationId,
        slug,
        hostname
      );

      if (!status.module) {
        return res.status(404).json({ message: `Module '${slug}' not found` });
      }

      res.json({
        message: 'Module status retrieved successfully',
        data: status,
      });
    } catch (error: any) {
      logger.error('Failed to get module status:', error);
      res.status(500).json({
        message: 'Failed to get module status',
        error: error.message,
      });
    }
  };

  /**
   * POST /api/v1/platform-modules/:slug/purchase
   * Purchase a module (activate trial or redirect to Stripe)
   */
  purchaseModule = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.organizationId) {
        return res.status(401).json({ message: 'Organization not found' });
      }

      // Check if user has admin/owner role
      if (!['ADMIN', 'OWNER'].includes(user.role)) {
        return res.status(403).json({
          message: 'Only admins and owners can purchase modules',
        });
      }

      const { slug } = req.params;
      const hostname = req.get('host') || '';

      const result = await platformModulesService.purchaseModule(
        user.organizationId,
        slug,
        hostname
      );

      if (!result.success) {
        return res.status(400).json({
          message: result.message,
        });
      }

      res.json({
        message: result.message,
        data: result.module,
        stripeCheckoutUrl: result.stripeCheckoutUrl,
      });
    } catch (error: any) {
      logger.error('Failed to purchase module:', error);
      res.status(500).json({
        message: 'Failed to purchase module',
        error: error.message,
      });
    }
  };

  /**
   * POST /api/v1/platform-modules/:slug/cancel
   * Cancel/deactivate a module
   */
  cancelModule = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.organizationId) {
        return res.status(401).json({ message: 'Organization not found' });
      }

      // Check if user has admin/owner role
      if (!['ADMIN', 'OWNER'].includes(user.role)) {
        return res.status(403).json({
          message: 'Only admins and owners can cancel modules',
        });
      }

      const { slug } = req.params;

      const result = await platformModulesService.cancelModule(
        user.organizationId,
        slug
      );

      if (!result.success) {
        return res.status(400).json({
          message: result.message,
        });
      }

      res.json({
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Failed to cancel module:', error);
      res.status(500).json({
        message: 'Failed to cancel module',
        error: error.message,
      });
    }
  };
}

export const platformModulesController = new PlatformModulesController();
