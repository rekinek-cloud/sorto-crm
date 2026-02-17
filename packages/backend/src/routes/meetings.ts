import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();

// Get all meetings with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const {
      page = '1',
      limit = '20',
      status,
      startDate,
      endDate,
      sortBy = 'startTime',
      sortOrder = 'asc',
      search,
      contactId
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate) {
      where.startTime = {
        gte: new Date(startDate as string)
      };
    }

    if (endDate) {
      where.endTime = {
        lte: new Date(endDate as string)
      };
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get meetings with related data
    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          organizedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              assignedCompany: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true, value: true } },
          stream: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          attendees: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.meeting.count({ where })
    ]);

    const pages = Math.ceil(total / limitNum);

    return res.json({
      meetings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching meetings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get meetings statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMeetings,
      todayMeetings,
      weekMeetings,
      monthMeetings,
      upcomingMeetings,
      completedMeetings,
      canceledMeetings
    ] = await Promise.all([
      prisma.meeting.count({
        where: { organizationId }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          startTime: {
            gte: todayStart,
            lt: todayEnd
          }
        }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          startTime: {
            gte: weekStart,
            lt: now
          }
        }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          startTime: {
            gte: monthStart,
            lt: now
          }
        }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          status: 'SCHEDULED',
          startTime: {
            gte: now
          }
        }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          status: 'COMPLETED'
        }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          status: 'CANCELED'
        }
      })
    ]);

    return res.json({
      totalMeetings,
      todayMeetings,
      weekMeetings,
      monthMeetings,
      upcomingMeetings,
      completedMeetings,
      canceledMeetings,
      scheduledMeetings: totalMeetings - completedMeetings - canceledMeetings
    });
  } catch (error) {
    logger.error('Error fetching meetings stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single meeting by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        organizedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedCompany: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, value: true } },
        stream: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
        attendees: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } }
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    return res.json(meeting);
  } catch (error) {
    logger.error('Error fetching meeting:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new meeting
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingUrl,
      agenda,
      contactId,
      companyId,
      dealId,
      streamId,
      projectId,
      eventId
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Meeting title is required' });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check for overlapping meetings
    const overlappingMeetings = await prisma.meeting.findMany({
      where: {
        organizationId,
        organizedById: userId,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        },
        OR: [
          {
            startTime: {
              lte: start
            },
            endTime: {
              gt: start
            }
          },
          {
            startTime: {
              lt: end
            },
            endTime: {
              gte: end
            }
          },
          {
            startTime: {
              gte: start
            },
            endTime: {
              lte: end
            }
          }
        ]
      }
    });

    if (overlappingMeetings.length > 0) {
      return res.status(400).json({ 
        message: 'Meeting conflicts with existing meetings',
        conflicts: overlappingMeetings.map(m => ({
          id: m.id,
          title: m.title,
          startTime: m.startTime,
          endTime: m.endTime
        }))
      });
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startTime: start,
        endTime: end,
        location: location?.trim() || null,
        meetingUrl: meetingUrl?.trim() || null,
        agenda: agenda?.trim() || null,
        organization: { connect: { id: organizationId } },
        organizedBy: { connect: { id: userId } },
        ...(contactId && { contact: { connect: { id: contactId } } }),
        ...(companyId && { company: { connect: { id: companyId } } }),
        ...(dealId && { deal: { connect: { id: dealId } } }),
        ...(streamId && { stream: { connect: { id: streamId } } }),
        ...(projectId && { project: { connect: { id: projectId } } }),
        ...(eventId && { event: { connect: { id: eventId } } })
      },
      include: {
        organizedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedCompany: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, value: true } },
        stream: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
        attendees: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } }
      }
    });

    logger.info(`Created meeting: ${meeting.id} for organization: ${organizationId}`);
    return res.status(201).json(meeting);
  } catch (error) {
    logger.error('Error creating meeting:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update meeting
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const { id } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingUrl,
      agenda,
      notes,
      status,
      contactId,
      companyId,
      dealId,
      streamId,
      projectId,
      eventId
    } = req.body;

    const existingMeeting = await prisma.meeting.findFirst({
      where: { id, organizationId }
    });

    if (!existingMeeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl?.trim() || null;
    if (agenda !== undefined) updateData.agenda = agenda?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (contactId !== undefined) updateData.contactId = contactId || null;
    if (companyId !== undefined) updateData.companyId = companyId || null;
    if (dealId !== undefined) updateData.dealId = dealId || null;
    if (streamId !== undefined) updateData.streamId = streamId || null;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (eventId !== undefined) updateData.eventId = eventId || null;

    // Handle time updates with conflict checking
    if (startTime !== undefined || endTime !== undefined) {
      const start = startTime ? new Date(startTime) : existingMeeting.startTime;
      const end = endTime ? new Date(endTime) : existingMeeting.endTime;

      if (start >= end) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      // Check for overlapping meetings (excluding current meeting)
      const overlappingMeetings = await prisma.meeting.findMany({
        where: {
          organizationId,
          organizedById: userId,
          id: { not: id },
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS']
          },
          OR: [
            {
              startTime: { lte: start },
              endTime: { gt: start }
            },
            {
              startTime: { lt: end },
              endTime: { gte: end }
            },
            {
              startTime: { gte: start },
              endTime: { lte: end }
            }
          ]
        }
      });

      if (overlappingMeetings.length > 0) {
        return res.status(400).json({ 
          message: 'Meeting conflicts with existing meetings',
          conflicts: overlappingMeetings.map(m => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime,
            endTime: m.endTime
          }))
        });
      }

      updateData.startTime = start;
      updateData.endTime = end;
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        organizedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            assignedCompany: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, value: true } },
        stream: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
        attendees: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } }
      }
    });

    logger.info(`Updated meeting: ${id} for organization: ${organizationId}`);
    return res.json(meeting);
  } catch (error) {
    logger.error('Error updating meeting:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete meeting
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, organizationId }
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    await prisma.meeting.delete({
      where: { id }
    });

    logger.info(`Deleted meeting: ${id} for organization: ${organizationId}`);
    return res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    logger.error('Error deleting meeting:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get calendar view (meetings grouped by date)
router.get('/calendar/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const meetings = await prisma.meeting.findMany({
      where: {
        organizationId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            assignedCompany: {
              select: {
                name: true
              }
            }
          }
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, value: true } },
        stream: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Group meetings by date
    const groupedMeetings: Record<string, any[]> = {};
    meetings.forEach(meeting => {
      const dateKey = meeting.startTime.toISOString().split('T')[0];
      if (!groupedMeetings[dateKey]) {
        groupedMeetings[dateKey] = [];
      }
      groupedMeetings[dateKey].push(meeting);
    });

    return res.json({
      year: parseInt(year),
      month: parseInt(month),
      meetings: groupedMeetings,
      totalMeetings: meetings.length
    });
  } catch (error) {
    logger.error('Error fetching calendar meetings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
