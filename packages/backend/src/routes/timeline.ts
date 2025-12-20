import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Get timeline events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { startDate, endDate } = req.query;

    const where: any = { organizationId };
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const events = await prisma.timeline.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });

    res.json({ events });
  } catch (error) {
    logger.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create timeline event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { eventId, eventType, title, startDate, endDate } = req.body;

    const event = await prisma.timeline.create({
      data: {
        eventId,
        eventType,
        title,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        organizationId
      }
    });

    res.status(201).json(event);
  } catch (error) {
    logger.error('Error creating timeline event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;