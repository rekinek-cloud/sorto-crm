import { Router } from 'express';
import { SsoController } from './sso.controller';
import { authenticateToken } from '../../../shared/middleware/auth';
import { userRateLimit, strictRateLimit } from '../../../shared/middleware/rateLimit';

const router = Router();
const ssoController = new SsoController();

// Generate SSO token - requires authentication
router.post('/token', authenticateToken, userRateLimit, ssoController.generateToken);

// Verify SSO token - NO auth required (called by target modules with clientId/secret)
router.post('/verify', strictRateLimit, ssoController.verifyToken);

// Logout SSO sessions - requires authentication
router.post('/logout', authenticateToken, userRateLimit, ssoController.logout);

export default router;
