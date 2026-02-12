import { Router } from 'express';
import { OverlaysController } from './overlays.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';
import { userRateLimit } from '../../shared/middleware/rateLimit';

const router = Router();
const overlaysController = new OverlaysController();

/**
 * Public routes
 */

// List all available overlays (public for landing page)
router.get('/', userRateLimit, overlaysController.list);

// Get branding for current domain (public - for login page)
router.get('/branding', userRateLimit, overlaysController.getBranding);

/**
 * Authenticated routes - MUST be before /:slug to avoid route conflicts
 */

// Get current overlay for organization
router.get('/current', userRateLimit, authenticateToken, overlaysController.getCurrent);

// Get navigation for organization
router.get('/navigation', userRateLimit, authenticateToken, overlaysController.getNavigation);

// Check if module is visible
router.get('/module/:moduleSlug/visible', userRateLimit, authenticateToken, overlaysController.isModuleVisible);

// Set overlay for organization (ADMIN/OWNER only)
router.put(
  '/current',
  userRateLimit,
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  overlaysController.setCurrent
);

// Seed default overlays (admin only)
router.post(
  '/seed',
  userRateLimit,
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  overlaysController.seedDefaults
);

/**
 * Public route with param - MUST be last to avoid catching /current, /navigation etc.
 */

// Get specific overlay by slug (public)
router.get('/:slug', userRateLimit, overlaysController.getBySlug);

export default router;
