import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/auth';
import { ssoService } from './sso.service';
import logger from '../../../config/logger';

export class SsoController {
  /**
   * Generate SSO token for authenticated user to access a module
   * POST /api/v1/auth/sso/token
   * Body: { moduleSlug: string }
   */
  generateToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { moduleSlug } = req.body;

      if (!moduleSlug) {
        return res.status(400).json({ error: 'moduleSlug is required' });
      }

      const result = await ssoService.generateToken(
        req.user!.id,
        req.user!.organizationId,
        moduleSlug
      );

      logger.info(`SSO token generated for user ${req.user!.id} to module ${moduleSlug}`);
      return res.json({ message: 'SSO token generated', data: result });
    } catch (error: any) {
      logger.warn(`SSO token generation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * Verify SSO token (called by target module with client credentials)
   * POST /api/v1/auth/sso/verify
   * Body: { token: string, clientId: string, clientSecret: string }
   * Note: This endpoint is NOT authenticated - module authenticates via clientId/clientSecret
   */
  verifyToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { token, clientId, clientSecret } = req.body;

      if (!token || !clientId || !clientSecret) {
        return res.status(400).json({
          error: 'token, clientId, and clientSecret are required',
          valid: false
        });
      }

      const result = await ssoService.verifyToken(token, clientId, clientSecret);

      if (result.valid) {
        logger.info(`SSO token verified for module clientId ${clientId}`);
        return res.json({ message: 'SSO token verified', data: result });
      } else {
        logger.warn(`SSO token verification failed: ${result.error}`);
        return res.status(401).json({ error: result.error, valid: false });
      }
    } catch (error: any) {
      logger.error('SSO verify error:', error);
      return res.status(500).json({ error: error.message, valid: false });
    }
  };

  /**
   * Invalidate all SSO sessions for current user
   * POST /api/v1/auth/sso/logout
   */
  logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await ssoService.invalidateUserTokens(req.user!.id);
      logger.info(`SSO sessions invalidated for user ${req.user!.id}`);
      return res.json({ message: 'SSO sessions invalidated', data: result });
    } catch (error: any) {
      logger.error('SSO logout error:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}
