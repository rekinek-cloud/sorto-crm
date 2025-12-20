import express from 'express';
import { authenticateToken as requireAuth, requireRole, AuthenticatedRequest } from '../shared/middleware/auth';
import { prisma } from '../config/database';
import { z } from 'zod';

const router = express.Router();

// Validation schema for user update
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(['MEMBER', 'MANAGER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/v1/users
 * Get all users in the organization
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: req.user!.organizationId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/v1/users/:id
 * Get a specific user
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/v1/users/:id
 * Update a user (requires ADMIN or OWNER role)
 */
router.put('/:id', requireAuth, requireRole(['ADMIN', 'OWNER']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const updateData = validationResult.data;

    // Check if user exists and belongs to same organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing OWNER role
    if (existingUser.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot modify owner user' });
    }

    // Prevent non-owners from setting ADMIN role
    if (updateData.role === 'ADMIN' && req.user!.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can assign admin role' });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/v1/users/:id
 * Deactivate a user (requires ADMIN or OWNER role)
 */
router.delete('/:id', requireAuth, requireRole(['ADMIN', 'OWNER']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and belongs to same organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting OWNER
    if (existingUser.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot delete owner user' });
    }

    // Prevent deleting self
    if (id === req.user!.id) {
      return res.status(403).json({ error: 'Cannot delete yourself' });
    }

    // Deactivate user instead of hard delete
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

export default router;