import { Router } from 'express';
import { AuthController } from './controller';
import { validateRequest } from '../../shared/middleware/validation';
import { authenticateToken, requireRole, checkOrganizationLimits } from '../../shared/middleware/auth';
import { strictRateLimit, userRateLimit } from '../../shared/middleware/rateLimit';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  inviteUserSchema,
  acceptInvitationSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from './schemas';

const router = Router();
const authController = new AuthController();

/**
 * Public routes (no authentication required)
 */

// User registration
router.post(
  '/register',
  strictRateLimit, // Strict rate limiting for registration
  validateRequest({ body: registerSchema }),
  authController.register
);

// User login
router.post(
  '/login',
  strictRateLimit, // Strict rate limiting for login
  validateRequest({ body: loginSchema }),
  authController.login
);

// Refresh token
router.post(
  '/refresh',
  userRateLimit,
  validateRequest({ body: refreshTokenSchema }),
  authController.refreshToken
);

// Accept invitation
router.post(
  '/accept-invitation',
  strictRateLimit,
  validateRequest({ body: acceptInvitationSchema }),
  authController.acceptInvitation
);

// Email verification
router.post(
  '/verify-email',
  userRateLimit,
  validateRequest({ body: emailVerificationSchema }),
  authController.verifyEmail
);

// Resend verification email (requires authentication)
router.post(
  '/resend-verification',
  userRateLimit,
  authenticateToken,
  authController.resendVerification
);

// Password reset request
router.post(
  '/password-reset/request',
  strictRateLimit,
  validateRequest({ body: passwordResetRequestSchema }),
  authController.requestPasswordReset
);

// Password reset confirmation
router.post(
  '/password-reset/confirm',
  strictRateLimit,
  validateRequest({ body: passwordResetConfirmSchema }),
  authController.confirmPasswordReset
);

/**
 * Authenticated routes
 */

// Get current user profile
router.get(
  '/me',
  userRateLimit,
  authenticateToken,
  authController.me
);

// Logout
router.post(
  '/logout',
  userRateLimit,
  authenticateToken,
  validateRequest({ body: refreshTokenSchema }),
  authController.logout
);

// Change password
router.post(
  '/change-password',
  userRateLimit,
  authenticateToken,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword
);

/**
 * Admin routes (require elevated permissions)
 */

// Invite user (requires ADMIN or OWNER role)
router.post(
  '/invite',
  userRateLimit,
  authenticateToken,
  requireRole(['ADMIN', 'OWNER']),
  checkOrganizationLimits('users'),
  validateRequest({ body: inviteUserSchema }),
  authController.inviteUser
);

export default router;