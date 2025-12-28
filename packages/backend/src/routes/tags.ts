import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../shared/middleware/auth';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all tags
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;

    const tags = await prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });

    res.json({ data: tags, total: tags.length });
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { name, color } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        organizationId
      }
    });

    res.status(201).json(tag);
  } catch (error) {
    logger.error('Error creating tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update tag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    const tag = await prisma.tag.findFirst({
      where: { id, organizationId }
    });

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { id } = req.params;

    await prisma.tag.delete({ where: { id } });
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    logger.error('Error deleting tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;