import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET / - Unified team list (employees + AI agents)
router.get('/', async (req, res) => {
  try {
    const organizationId = (req as AuthenticatedRequest).user!.organizationId;
    const { includeAI = 'true', search, department, role } = req.query;

    // Build employee where clause
    const employeeWhere: any = {
      organizationId,
      isActive: true,
    };

    if (department) {
      employeeWhere.department = department;
    }

    if (role) {
      employeeWhere.role = role;
    }

    if (search) {
      employeeWhere.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    // Fetch employees
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format employee team members
    const teamMembers: any[] = employees.map((emp) => ({
      id: emp.id,
      type: 'human' as const,
      userId: emp.user.id,
      name: `${emp.user.firstName} ${emp.user.lastName}`,
      email: emp.user.email,
      avatar: emp.user.avatar,
      role: emp.role,
      position: emp.position,
      department: emp.department,
      lastActiveAt: emp.user.lastLoginAt,
      isActive: emp.isActive,
    }));

    // Optionally include AI agents
    if (includeAI === 'true') {
      const aiAssignments = await prisma.aIAgentAssignment.findMany({
        where: { organizationId },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
              status: true,
              autonomyLevel: true,
              tasksCompleted: true,
              successRate: true,
              lastActivityAt: true,
              capabilities: true,
            },
          },
        },
      });

      // Filter by search if applicable
      let filteredAgents = aiAssignments;
      if (search) {
        const searchStr = (search as string).toLowerCase();
        filteredAgents = aiAssignments.filter(
          (a) =>
            a.agent.name.toLowerCase().includes(searchStr) ||
            a.agent.role.toLowerCase().includes(searchStr)
        );
      }

      const aiMembers = filteredAgents.map((assignment) => ({
        id: assignment.id,
        type: 'ai' as const,
        agentId: assignment.agent.id,
        name: assignment.agent.name,
        role: assignment.agent.role,
        avatar: assignment.agent.avatar,
        status: assignment.agent.status,
        autonomyLevel: assignment.agent.autonomyLevel,
        tasksCompleted: assignment.agent.tasksCompleted,
        successRate: assignment.agent.successRate,
        lastActiveAt: assignment.agent.lastActivityAt,
        capabilities: assignment.agent.capabilities,
        isActive: assignment.agent.status === 'ACTIVE',
      }));

      teamMembers.push(...aiMembers);
    }

    return res.json({
      team: teamMembers,
      counts: {
        total: teamMembers.length,
        humans: teamMembers.filter((m) => m.type === 'human').length,
        aiAgents: teamMembers.filter((m) => m.type === 'ai').length,
      },
    });
  } catch (error) {
    console.error('Error listing team:', error);
    return res.status(500).json({ error: 'Failed to list team' });
  }
});

export default router;
