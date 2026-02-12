import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createEmployeeSchema = z.object({
  userId: z.string().uuid('Valid user ID is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']).default('EMPLOYEE'),
  position: z.string().optional(),
  department: z.string().optional(),
});

const updateEmployeeSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']).optional(),
  position: z.string().optional(),
  department: z.string().optional(),
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET / - List employees for current organization
router.get('/', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { search, role, isActive, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { organizationId };

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      // By default show only active employees
      where.isActive = true;
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing employees:', error);
    res.status(500).json({ error: 'Failed to list employees' });
  }
});

// POST / - Create employee
router.post('/', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const parsed = createEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if employee already exists for this org
    const existing = await prisma.employee.findUnique({
      where: {
        userId_organizationId: {
          userId: parsed.data.userId,
          organizationId,
        },
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Employee already exists in this organization' });
      return;
    }

    const employee = await prisma.employee.create({
      data: {
        userId: parsed.data.userId,
        organizationId,
        role: parsed.data.role,
        position: parsed.data.position,
        department: parsed.data.department,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({ employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PATCH /:id - Update employee
router.patch('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // Verify employee belongs to current org
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId },
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found in this organization' });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: parsed.data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.json({ employee: updated });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /:id - Soft deactivate employee
router.delete('/:id', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { id } = req.params;

    // Verify employee belongs to current org
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId },
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found in this organization' });
      return;
    }

    if (!employee.isActive) {
      res.status(400).json({ error: 'Employee is already deactivated' });
      return;
    }

    const deactivated = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ employee: deactivated, message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

export default router;
