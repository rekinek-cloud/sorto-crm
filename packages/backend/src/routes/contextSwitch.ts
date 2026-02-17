import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import config from '../config';

const router = Router();

// Validation schemas
const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid('Valid organization ID is required'),
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// POST /switch - Switch active organization context
router.post('/switch', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const email = (req as AuthenticatedRequest).user!.email;
    const currentRole = (req as AuthenticatedRequest).user!.role;

    const parsed = switchOrganizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const targetOrgId = parsed.data.organizationId;

    // Verify the target organization exists
    const targetOrg = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      select: {
        id: true,
        name: true,
        slug: true,
        holdingId: true,
        limits: true,
      },
    });

    if (!targetOrg) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check access via Employee model
    const employeeAccess = await prisma.employee.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: targetOrgId,
        },
      },
    });

    let hasAccess = false;
    let role = currentRole;

    if (employeeAccess && employeeAccess.isActive) {
      hasAccess = true;
      role = employeeAccess.role;
    }

    // Check access via Holding ownership
    if (!hasAccess && targetOrg.holdingId) {
      const holding = await prisma.holding.findFirst({
        where: {
          id: targetOrg.holdingId,
          ownerId: userId,
        },
      });

      if (holding) {
        hasAccess = true;
        role = 'ADMIN'; // Holding owner gets admin access
      }
    }

    // Check if user's primary org matches
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (user && user.organizationId === targetOrgId) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this organization' });
    }

    // Generate new JWT tokens with updated organizationId
    const accessToken = jwt.sign(
      {
        userId,
        organizationId: targetOrgId,
        email,
        role,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        organizationId: targetOrgId,
        email,
        role,
      },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return res.json({
      accessToken,
      refreshToken,
      organization: {
        id: targetOrg.id,
        name: targetOrg.name,
        slug: targetOrg.slug,
      },
      role,
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    return res.status(500).json({ error: 'Failed to switch organization' });
  }
});

// GET /current - Return current organization context
router.get('/current', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const userId = (req as AuthenticatedRequest).user!.id;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        shortName: true,
        companyType: true,
        color: true,
        icon: true,
        holdingId: true,
        limits: true,
        settings: true,
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get employee record if exists
    const employee = await prisma.employee.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: {
        id: true,
        role: true,
        position: true,
        department: true,
      },
    });

    // Get holding info if org belongs to one
    let holding = null;
    if (organization.holdingId) {
      holding = await prisma.holding.findUnique({
        where: { id: organization.holdingId },
        select: {
          id: true,
          name: true,
          ownerId: true,
          organizations: {
            select: { id: true, name: true, shortName: true, companyType: true, color: true },
          },
        },
      });
    }

    return res.json({
      organization,
      employee,
      holding,
      isHoldingOwner: holding?.ownerId === userId,
    });
  } catch (error) {
    console.error('Error getting current context:', error);
    return res.status(500).json({ error: 'Failed to get current context' });
  }
});

export default router;
