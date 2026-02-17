import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/events - List events for organization
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      status,
      eventType,
      upcoming,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (status) where.status = status;
    if (eventType) where.eventType = eventType;
    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: {
            select: {
              companies: true,
              contacts: true,
              team: true,
              expenses: true,
              tasks: true
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.event.count({ where })
    ]);

    return res.json({
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/v1/events/:id - Get single event with counts
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        companies: {
          include: {
            company: { select: { id: true, name: true } }
          }
        },
        contacts: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        },
        team: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        _count: {
          select: {
            companies: true,
            contacts: true,
            team: true,
            expenses: true,
            tasks: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/v1/events - Create event
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      name,
      description,
      eventType,
      venue,
      city,
      country,
      address,
      startDate,
      endDate,
      setupDate,
      teardownDate,
      status,
      budgetPlanned,
      currency,
      goals
    } = req.body;

    if (!name || !eventType || !startDate || !endDate) {
      return res.status(400).json({ error: 'name, eventType, startDate and endDate are required' });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        eventType,
        venue,
        city,
        country,
        address,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        setupDate: setupDate ? new Date(setupDate) : undefined,
        teardownDate: teardownDate ? new Date(teardownDate) : undefined,
        status: status || 'PLANNING',
        budgetPlanned,
        currency: currency || 'EUR',
        goals,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

// PATCH /api/v1/events/:id - Update event
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updates = { ...req.body };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.setupDate) updates.setupDate = new Date(updates.setupDate);
    if (updates.teardownDate) updates.teardownDate = new Date(updates.teardownDate);

    // Remove fields that should not be directly updated
    delete updates.organizationId;
    delete updates.createdById;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: {
            companies: true,
            contacts: true,
            team: true,
            expenses: true,
            tasks: true
          }
        }
      }
    });

    return res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/v1/events/:id - Delete event
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id: req.params.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
});

// === Event Companies Sub-routes ===

// GET /api/v1/events/:id/companies - List companies for event
router.get('/:id/companies', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const companies = await prisma.eventCompany.findMany({
      where: { eventId: req.params.id },
      include: {
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, value: true } }
      },
      orderBy: { company: { name: 'asc' } }
    });

    return res.json(companies);
  } catch (error) {
    console.error('Error fetching event companies:', error);
    return res.status(500).json({ error: 'Failed to fetch event companies' });
  }
});

// POST /api/v1/events/:id/companies - Add company to event
router.post('/:id/companies', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { companyId, role, boothNumber, boothSize, status, dealValue, dealId, notes, specialRequests } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const eventCompany = await prisma.eventCompany.create({
      data: {
        eventId: req.params.id,
        companyId,
        role: role || 'CLIENT',
        boothNumber,
        boothSize,
        status: status || 'CONFIRMED',
        dealValue,
        dealId,
        notes,
        specialRequests
      },
      include: {
        company: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json(eventCompany);
  } catch (error) {
    console.error('Error adding company to event:', error);
    return res.status(500).json({ error: 'Failed to add company to event' });
  }
});

// DELETE /api/v1/events/:id/companies/:companyId - Remove company from event
router.delete('/:id/companies/:companyId', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existing = await prisma.eventCompany.findUnique({
      where: {
        eventId_companyId: {
          eventId: req.params.id,
          companyId: req.params.companyId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company not found in this event' });
    }

    await prisma.eventCompany.delete({
      where: { id: existing.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error removing company from event:', error);
    return res.status(500).json({ error: 'Failed to remove company from event' });
  }
});

// === Event Team Sub-routes ===

// GET /api/v1/events/:id/team - List team members
router.get('/:id/team', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const team = await prisma.eventTeamMember.findMany({
      where: { eventId: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    return res.json(team);
  } catch (error) {
    console.error('Error fetching event team:', error);
    return res.status(500).json({ error: 'Failed to fetch event team' });
  }
});

// POST /api/v1/events/:id/team - Add team member
router.post('/:id/team', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      userId,
      role,
      responsibilities,
      arrivalDate,
      departureDate,
      hotelName,
      hotelConfirmation,
      transportType,
      transportDetails,
      phoneNumber,
      assignedCompanyIds
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const member = await prisma.eventTeamMember.create({
      data: {
        eventId: req.params.id,
        userId,
        role,
        responsibilities,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : undefined,
        departureDate: departureDate ? new Date(departureDate) : undefined,
        hotelName,
        hotelConfirmation,
        transportType,
        transportDetails,
        phoneNumber,
        assignedCompanyIds: assignedCompanyIds || []
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    return res.status(201).json(member);
  } catch (error) {
    console.error('Error adding team member:', error);
    return res.status(500).json({ error: 'Failed to add team member' });
  }
});

// DELETE /api/v1/events/:id/team/:userId - Remove team member
router.delete('/:id/team/:userId', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existing = await prisma.eventTeamMember.findUnique({
      where: {
        eventId_userId: {
          eventId: req.params.id,
          userId: req.params.userId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Team member not found in this event' });
    }

    await prisma.eventTeamMember.delete({
      where: { id: existing.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error removing team member:', error);
    return res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// === Event Expenses Sub-routes ===

// GET /api/v1/events/:id/expenses - List expenses
router.get('/:id/expenses', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const expenses = await prisma.eventExpense.findMany({
      where: { eventId: req.params.id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.json({ expenses, totalAmount });
  } catch (error) {
    console.error('Error fetching event expenses:', error);
    return res.status(500).json({ error: 'Failed to fetch event expenses' });
  }
});

// POST /api/v1/events/:id/expenses - Add expense
router.post('/:id/expenses', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { category, description, amount, currency, status, paidAt, invoiceNumber, receiptUrl } = req.body;

    if (!category || !description || amount === undefined) {
      return res.status(400).json({ error: 'category, description and amount are required' });
    }

    const expense = await prisma.eventExpense.create({
      data: {
        eventId: req.params.id,
        category,
        description,
        amount,
        currency: currency || 'EUR',
        status: status || 'PLANNED',
        paidAt: paidAt ? new Date(paidAt) : undefined,
        invoiceNumber,
        receiptUrl,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    return res.status(500).json({ error: 'Failed to add expense' });
  }
});

// DELETE /api/v1/events/:id/expenses/:expenseId - Delete expense
router.delete('/:id/expenses/:expenseId', authenticateToken, async (req: any, res: any) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existing = await prisma.eventExpense.findFirst({
      where: {
        id: req.params.expenseId,
        eventId: req.params.id
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.eventExpense.delete({
      where: { id: req.params.expenseId }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
