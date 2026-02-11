import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';

const router = Router();

// GET /api/v1/notes - List notes with filters
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      companyId,
      contactId,
      dealId,
      taskId,
      meetingId,
      streamId,
      projectId,
      eventId,
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user.organizationId
    };

    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;
    if (taskId) where.taskId = taskId;
    if (meetingId) where.meetingId = meetingId;
    if (streamId) where.streamId = streamId;
    if (projectId) where.projectId = projectId;
    if (eventId) where.eventId = eventId;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.note.count({ where })
    ]);

    res.json({
      notes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/v1/notes/:id - Get single note
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/v1/notes - Create note
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      content,
      companyId,
      contactId,
      dealId,
      taskId,
      meetingId,
      streamId,
      projectId,
      eventId,
      isPinned
    } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const note = await prisma.note.create({
      data: {
        content,
        companyId: companyId || undefined,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        taskId: taskId || undefined,
        meetingId: meetingId || undefined,
        streamId: streamId || undefined,
        projectId: projectId || undefined,
        eventId: eventId || undefined,
        isPinned: isPinned || false,
        organizationId: req.user.organizationId,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PATCH /api/v1/notes/:id - Update note
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.note.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { content, isPinned } = req.body;

    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        ...(content !== undefined && { content }),
        ...(isPinned !== undefined && { isPinned }),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/v1/notes/:id - Delete note
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await prisma.note.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.note.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
