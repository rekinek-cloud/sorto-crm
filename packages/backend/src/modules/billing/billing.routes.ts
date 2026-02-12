import { Router, raw } from 'express';
import { BillingController } from './billing.controller';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';
import { userRateLimit } from '../../shared/middleware/rateLimit';

const router = Router();
const billingController = new BillingController();

// =========================================
// Public routes
// =========================================

// Stripe status (no auth needed)
router.get('/stripe/status', billingController.getStripeStatus);

// Stripe webhook (no auth, raw body for signature verification)
router.post(
  '/stripe/webhook',
  raw({ type: 'application/json' }),
  billingController.handleWebhook
);

// =========================================
// Authenticated routes
// =========================================
router.use(authenticateToken);

// Current subscription - any authenticated user
router.get('/current', userRateLimit, billingController.getCurrent);

// Available modules with pricing - any authenticated user
router.get('/modules', userRateLimit, billingController.getAvailableModules);

// Active modules for organization - any authenticated user
router.get('/modules/active', userRateLimit, billingController.getActiveModules);

// =========================================
// Admin routes - ADMIN/OWNER only
// =========================================

// Add module
router.post(
  '/add-module',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  billingController.addModule
);

// Remove module
router.delete(
  '/remove-module/:moduleId',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  billingController.removeModule
);

// =========================================
// Stripe payment routes - ADMIN/OWNER only
// =========================================

// Create checkout session for module purchase
router.post(
  '/stripe/checkout',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  billingController.createCheckoutSession
);

// Create customer portal session
router.post(
  '/stripe/portal',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  billingController.createPortalSession
);

// Cancel module subscription
router.post(
  '/stripe/cancel',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  billingController.cancelModuleSubscription
);

export default router;
