import { Router } from 'express';
import { platformModulesController } from './modules.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';
import { userRateLimit } from '../../shared/middleware/rateLimit';

const router = Router();

// GET /api/v1/platform-modules - Get all modules (admin only)
router.get(
  '/',
  userRateLimit,
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  platformModulesController.getAllModules
);

// GET /api/v1/platform-modules/available - Get available modules for purchase
router.get(
  '/available',
  userRateLimit,
  authenticateToken,
  platformModulesController.getAvailableModules
);

// GET /api/v1/platform-modules/purchased - Get purchased modules
router.get(
  '/purchased',
  userRateLimit,
  authenticateToken,
  platformModulesController.getPurchasedModules
);

// GET /api/v1/platform-modules/:slug/status - Get module status
router.get(
  '/:slug/status',
  userRateLimit,
  authenticateToken,
  platformModulesController.getModuleStatus
);

// POST /api/v1/platform-modules/:slug/purchase - Purchase module
router.post(
  '/:slug/purchase',
  userRateLimit,
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  platformModulesController.purchaseModule
);

// POST /api/v1/platform-modules/:slug/cancel - Cancel module
router.post(
  '/:slug/cancel',
  userRateLimit,
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  platformModulesController.cancelModule
);

export default router;
