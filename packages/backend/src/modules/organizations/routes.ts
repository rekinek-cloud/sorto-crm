import { Router } from 'express';
import { OrganizationController } from './controller';
import { validateRequest } from '../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../shared/middleware/auth';
import { userRateLimit, organizationRateLimit } from '../../shared/middleware/rateLimit';
import {
  updateOrganizationSchema,
  updateUserSchema,
  userIdParamSchema,
  paginationSchema,
  updateSubscriptionSchema,
  statsQuerySchema,
  bulkUserOperationSchema,
  exportInvitationSchema,
} from './schemas';

const router = Router();
const organizationController = new OrganizationController();

/**
 * All routes require authentication
 */
router.use(authenticateToken);

/**
 * Organization management routes
 */

// Get current organization
router.get(
  '/',
  userRateLimit,
  organizationController.getOrganization
);

// Update organization (requires ADMIN or OWNER)
router.put(
  '/',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  validateRequest({ body: updateOrganizationSchema }),
  organizationController.updateOrganization
);

// Get organization statistics (requires MANAGER+)
router.get(
  '/statistics',
  userRateLimit,
  requireRole(['MANAGER', 'ADMIN', 'OWNER']),
  validateRequest({ query: statsQuerySchema }),
  organizationController.getStatistics
);

/**
 * User management routes
 */

// Get organization users
router.get(
  '/users',
  userRateLimit,
  requireRole(['MANAGER', 'ADMIN', 'OWNER']),
  validateRequest({ query: paginationSchema }),
  organizationController.getUsers
);

// Get specific user
router.get(
  '/users/:userId',
  userRateLimit,
  requireRole(['MANAGER', 'ADMIN', 'OWNER']),
  validateRequest({ params: userIdParamSchema }),
  organizationController.getUser
);

// Update user (requires ADMIN or OWNER)
router.put(
  '/users/:userId',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  validateRequest({ 
    params: userIdParamSchema,
    body: updateUserSchema 
  }),
  organizationController.updateUser
);

// Deactivate user (requires ADMIN or OWNER)
router.delete(
  '/users/:userId',
  userRateLimit,
  requireRole(['ADMIN', 'OWNER']),
  validateRequest({ params: userIdParamSchema }),
  organizationController.deactivateUser
);

// Bulk user operations (requires ADMIN or OWNER)
router.post(
  '/users/bulk',
  organizationRateLimit(100), // Lower rate limit for bulk operations
  requireRole(['ADMIN', 'OWNER']),
  validateRequest({ body: bulkUserOperationSchema }),
  organizationController.bulkUserOperation
);

/**
 * Subscription management routes (OWNER only)
 */

// Update subscription plan
router.put(
  '/subscription',
  userRateLimit,
  requireRole(['OWNER']),
  validateRequest({ body: updateSubscriptionSchema }),
  organizationController.updateSubscription
);

/**
 * Data export and activity routes
 */

// Export organization data (requires ADMIN or OWNER)
router.get(
  '/export',
  organizationRateLimit(10), // Very limited for exports
  requireRole(['ADMIN', 'OWNER']),
  validateRequest({ query: exportInvitationSchema }),
  organizationController.exportData
);

// Get organization activity log (requires MANAGER+)
router.get(
  '/activity',
  userRateLimit,
  requireRole(['MANAGER', 'ADMIN', 'OWNER']),
  validateRequest({ query: paginationSchema }),
  organizationController.getActivityLog
);

export default router;
