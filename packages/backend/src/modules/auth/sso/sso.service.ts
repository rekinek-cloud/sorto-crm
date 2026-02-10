import jwt from 'jsonwebtoken';
import { config } from '../../../config';
import { prisma } from '../../../config/database';
import logger from '../../../config/logger';

interface SsoTokenPayload {
  userId: string;
  organizationId: string;
  moduleId: string;
  type: 'sso';
}

export class SsoService {
  /**
   * Generate an SSO token for a user to access a specific module
   */
  async generateToken(userId: string, organizationId: string, moduleSlug: string) {
    // 1. Verify module exists and is active
    const module = await prisma.platformModule.findUnique({
      where: { slug: moduleSlug },
    });
    if (!module || !module.isActive) {
      throw new Error('Module not found or inactive');
    }

    // 2. Verify module is purchased by this organization (or is builtin)
    if (module.type === 'external') {
      const orgModule = await prisma.organizationModule.findUnique({
        where: { organizationId_moduleId: { organizationId, moduleId: module.id } },
      });
      if (!orgModule || !orgModule.isActive) {
        throw new Error('Module is not purchased for this organization');
      }
    }

    // 3. Generate JWT token
    const expiresInSeconds = 300; // 5 minutes
    const payload: SsoTokenPayload = {
      userId,
      organizationId,
      moduleId: module.id,
      type: 'sso',
    };

    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: expiresInSeconds,
      issuer: 'sorto-platform',
      audience: module.slug,
    });

    // 4. Store in DB for one-time-use tracking
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    await prisma.ssoToken.create({
      data: {
        token,
        userId,
        organizationId,
        moduleId: module.id,
        expiresAt,
      },
    });

    // 5. Build redirect URL
    if (!module.url) {
      throw new Error('Module does not have a URL configured');
    }
    const separator = module.url.includes('?') ? '&' : '?';
    const redirectUrl = `${module.url}/auth/sso${separator}token=${token}`;

    return {
      token,
      redirectUrl,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Verify an SSO token (called by target module)
   */
  async verifyToken(token: string, clientId: string, clientSecret: string) {
    // 1. Verify the requesting module via clientId/clientSecret
    const module = await prisma.platformModule.findUnique({
      where: { clientId },
    });
    if (!module) {
      return { valid: false, error: 'INVALID_CLIENT' };
    }
    if (module.clientSecret !== clientSecret) {
      return { valid: false, error: 'INVALID_CLIENT_SECRET' };
    }

    // 2. Find token in DB
    const ssoToken = await prisma.ssoToken.findUnique({
      where: { token },
    });
    if (!ssoToken) {
      return { valid: false, error: 'TOKEN_INVALID' };
    }
    if (ssoToken.isUsed) {
      return { valid: false, error: 'TOKEN_USED' };
    }
    if (ssoToken.expiresAt < new Date()) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    if (ssoToken.moduleId !== module.id) {
      return { valid: false, error: 'TOKEN_MODULE_MISMATCH' };
    }

    // 3. Verify JWT signature
    try {
      jwt.verify(token, config.JWT_SECRET);
    } catch {
      return { valid: false, error: 'TOKEN_INVALID' };
    }

    // 4. Mark token as used
    await prisma.ssoToken.update({
      where: { id: ssoToken.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // 5. Get user and organization data
    const user = await prisma.user.findUnique({
      where: { id: ssoToken.userId },
    });
    if (!user) {
      return { valid: false, error: 'USER_NOT_FOUND' };
    }

    const organization = await prisma.organization.findUnique({
      where: { id: ssoToken.organizationId },
    });
    if (!organization) {
      return { valid: false, error: 'ORGANIZATION_NOT_FOUND' };
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      modulePermissions: {
        canRead: true,
        canWrite: user.role === 'ADMIN' || user.role === 'OWNER',
        canAdmin: user.role === 'OWNER',
      },
    };
  }

  /**
   * Invalidate all unused SSO tokens for a user
   */
  async invalidateUserTokens(userId: string) {
    const result = await prisma.ssoToken.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true, usedAt: new Date() },
    });
    return { invalidated: result.count };
  }

  /**
   * Cleanup expired tokens (older than 1 hour)
   */
  async cleanupExpiredTokens() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await prisma.ssoToken.deleteMany({
      where: { expiresAt: { lt: oneHourAgo } },
    });
    if (result.count > 0) {
      logger.debug(`Cleaned up ${result.count} expired SSO tokens`);
    }
    return result;
  }
}

export const ssoService = new SsoService();
