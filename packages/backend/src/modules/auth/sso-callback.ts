import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { generateTokenPair, TokenPayload } from '../../shared/utils/jwt';
import { config } from '../../config';
import logger from '../../config/logger';

/**
 * SSO Callback - receives a platform SSO token, verifies it with the platform,
 * finds or creates a local user, and returns CRM JWT tokens.
 *
 * POST /api/v1/auth/sso/callback
 * Body: { token: string }
 */
export async function ssoCallbackHandler(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!config.SSO.CLIENT_ID || !config.SSO.CLIENT_SECRET) {
      logger.error('SSO not configured: missing CLIENT_ID or CLIENT_SECRET');
      return res.status(500).json({ error: 'SSO not configured' });
    }

    // 1. Call platform's SSO verify endpoint
    const verifyUrl = `${config.SSO.PLATFORM_URL}/api/v1/auth/sso/verify`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        clientId: config.SSO.CLIENT_ID,
        clientSecret: config.SSO.CLIENT_SECRET,
      }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.data?.valid) {
      const errorCode = verifyData.error || verifyData.data?.error || 'VERIFICATION_FAILED';
      logger.warn(`SSO verification failed: ${errorCode}`);
      return res.status(401).json({ error: `SSO verification failed: ${errorCode}` });
    }

    const { user: platformUser, organization: platformOrg, role } = verifyData.data;

    // 2. Find or create organization in CRM
    let organization = await prisma.organization.findFirst({
      where: { slug: platformOrg.slug },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: platformOrg.name,
          slug: platformOrg.slug,
          settings: {},
          limits: config.DEFAULT_ORG_LIMITS,
        },
      });
      logger.info(`SSO: Created new organization "${organization.name}" (${organization.slug})`);
    }

    // 3. Find or create user in CRM
    let user = await prisma.user.findUnique({
      where: { email: platformUser.email },
    });

    const crmRole = role === 'admin' ? 'OWNER' : 'MEMBER';

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: platformUser.email,
          firstName: platformUser.firstName || '',
          lastName: platformUser.lastName || '',
          passwordHash: `sso_${Date.now()}`, // SSO users don't use password
          role: crmRole,
          organizationId: organization.id,
          emailVerified: true, // Verified via platform SSO
          isActive: true,
        },
      });
      logger.info(`SSO: Created new user "${user.email}" in org "${organization.slug}"`);
    } else {
      // Update user info from platform if needed
      if (user.firstName !== platformUser.firstName || user.lastName !== platformUser.lastName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: platformUser.firstName || user.firstName,
            lastName: platformUser.lastName || user.lastName,
          },
        });
      }
    }

    // 4. Generate CRM JWT tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      organizationId: organization.id,
      email: user.email,
      role: user.role,
    };

    const tokens = await generateTokenPair(tokenPayload);

    logger.info(`SSO: Login successful for ${user.email} via platform SSO`);

    // 5. Return same format as login endpoint
    res.json({
      message: 'SSO login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        tokens,
      },
    });
  } catch (error: any) {
    logger.error('SSO callback error:', error);
    res.status(500).json({ error: 'SSO login failed' });
  }
}
