import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';

const router = express.Router();

// Validation schemas
const AutoReplyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().min(1).max(100).default(50),
  
  // Trigger conditions
  conditions: z.object({
    fromEmail: z.string().optional(),
    fromDomain: z.string().optional(),
    subject: z.string().optional(),
    subjectContains: z.array(z.string()).optional(),
    bodyContains: z.array(z.string()).optional(),
    hasAttachment: z.boolean().optional(),
    timeRange: z.object({
      start: z.string().optional(), // HH:MM format
      end: z.string().optional(),   // HH:MM format
      timezone: z.string().optional()
    }).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  }),
  
  // Reply configuration
  replyConfig: z.object({
    template: z.string().min(1, 'Reply template is required'),
    subject: z.string().optional(),
    delay: z.number().min(0).max(86400).default(0), // seconds
    onlyBusinessHours: z.boolean().default(false),
    maxRepliesPerSender: z.number().min(0).default(0), // 0 = unlimited
    cooldownPeriod: z.number().min(0).default(3600), // seconds between replies to same sender
  }),
  
  // Actions after reply
  actions: z.object({
    markAsRead: z.boolean().default(false),
    addLabel: z.string().optional(),
    createTask: z.boolean().default(false),
    taskTitle: z.string().optional(),
    taskContext: z.string().optional(),
    notifyUsers: z.array(z.string()).optional(), // user IDs
  }).optional(),
});

const AutoReplyUpdateSchema = AutoReplyCreateSchema.partial();

// GET /api/auto-replies - List auto-reply rules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const organizationId = (req as any).user.organizationId;

    const where: any = { organizationId };
    if (status !== undefined) {
      where.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [autoReplies, total] = await Promise.all([
      prisma.autoReply.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          channel: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.autoReply.count({ where })
    ]);

    res.json({
      autoReplies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching auto-replies:', error);
    res.status(500).json({ error: 'Failed to fetch auto-replies' });
  }
});

// GET /api/auto-replies/:id - Get single auto-reply
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;
    
    const autoReply = await prisma.autoReply.findFirst({
      where: { id, organizationId },
      include: {
        channel: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!autoReply) {
      return res.status(404).json({ error: 'Auto-reply not found' });
    }
    
    res.json(autoReply);
  } catch (error) {
    console.error('Error fetching auto-reply:', error);
    res.status(500).json({ error: 'Failed to fetch auto-reply' });
  }
});

// POST /api/auto-replies - Create new auto-reply
router.post('/', authenticateToken, validateRequest(AutoReplyCreateSchema), async (req, res) => {
  try {
    const data = req.body;
    const organizationId = (req as any).user.organizationId;
    const createdById = (req as any).user.id;
    
    const autoReply = await prisma.autoReply.create({
      data: {
        name: data.name,
        subject: data.replyConfig?.subject || data.name,
        content: data.replyConfig?.template || '',
        triggerConditions: JSON.stringify(data.conditions),
        organizationId,
      }
    });
    
    res.status(201).json(autoReply);
  } catch (error) {
    console.error('Error creating auto-reply:', error);
    res.status(500).json({ error: 'Failed to create auto-reply' });
  }
});

// PUT /api/auto-replies/:id - Update auto-reply
router.put('/:id', authenticateToken, validateRequest(AutoReplyUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const organizationId = (req as any).user.organizationId;
    
    // Check if auto-reply exists and belongs to organization
    const existingAutoReply = await prisma.autoReply.findFirst({
      where: { id, organizationId }
    });
    
    if (!existingAutoReply) {
      return res.status(404).json({ error: 'Auto-reply not found' });
    }
    
    const updateData: any = { ...data };
    if (data.conditions) {
      updateData.conditions = JSON.stringify(data.conditions);
    }
    if (data.replyConfig) {
      updateData.replyConfig = JSON.stringify(data.replyConfig);
    }
    if (data.actions) {
      updateData.actions = JSON.stringify(data.actions);
    }
    
    const autoReply = await prisma.autoReply.update({
      where: { id },
      data: updateData
    });
    
    res.json(autoReply);
  } catch (error) {
    console.error('Error updating auto-reply:', error);
    res.status(500).json({ error: 'Failed to update auto-reply' });
  }
});

// DELETE /api/auto-replies/:id - Delete auto-reply
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;
    
    // Check if auto-reply exists and belongs to organization
    const existingAutoReply = await prisma.autoReply.findFirst({
      where: { id, organizationId }
    });
    
    if (!existingAutoReply) {
      return res.status(404).json({ error: 'Auto-reply not found' });
    }
    
    await prisma.autoReply.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting auto-reply:', error);
    res.status(500).json({ error: 'Failed to delete auto-reply' });
  }
});

// POST /api/auto-replies/:id/toggle - Toggle auto-reply enabled status
router.post('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;
    
    const autoReply = await prisma.autoReply.findFirst({
      where: { id, organizationId }
    });
    
    if (!autoReply) {
      return res.status(404).json({ error: 'Auto-reply not found' });
    }
    
    const newStatus = autoReply.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updatedAutoReply = await prisma.autoReply.update({
      where: { id },
      data: { status: newStatus }
    });
    
    res.json(updatedAutoReply);
  } catch (error) {
    console.error('Error toggling auto-reply:', error);
    res.status(500).json({ error: 'Failed to toggle auto-reply' });
  }
});

// POST /api/auto-replies/:id/test - Test auto-reply with sample message
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sampleMessage } = req.body;
    const organizationId = (req as any).user.organizationId;
    
    const autoReply = await prisma.autoReply.findFirst({
      where: { id, organizationId }
    });
    
    if (!autoReply) {
      return res.status(404).json({ error: 'Auto-reply not found' });
    }
    
    // Parse trigger conditions and test against sample message
    const conditions = typeof autoReply.triggerConditions === 'string'
      ? JSON.parse(autoReply.triggerConditions)
      : autoReply.triggerConditions;

    // Simple condition checking
    let matches = true;
    const matchResults: any = {};

    if (conditions.fromEmail && sampleMessage.fromEmail !== conditions.fromEmail) {
      matches = false;
      matchResults.fromEmail = false;
    }

    if (conditions.subject && !sampleMessage.subject?.includes(conditions.subject)) {
      matches = false;
      matchResults.subject = false;
    }

    if (conditions.subjectContains) {
      const subjectMatches = conditions.subjectContains.some((keyword: string) =>
        sampleMessage.subject?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!subjectMatches) {
        matches = false;
        matchResults.subjectContains = false;
      }
    }

    res.json({
      matches,
      matchResults,
      wouldReply: matches && autoReply.status === 'ACTIVE',
      replyContent: matches ? autoReply.content : null,
      replySubject: matches ? autoReply.subject : null
    });
  } catch (error) {
    console.error('Error testing auto-reply:', error);
    res.status(500).json({ error: 'Failed to test auto-reply' });
  }
});

// GET /api/auto-replies/stats - Get auto-reply statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;

    const [totalRules, activeRules] = await Promise.all([
      prisma.autoReply.count({ where: { organizationId } }),
      prisma.autoReply.count({ where: { organizationId, status: 'ACTIVE' } }),
    ]);

    res.json({
      totalRules,
      activeRules,
      totalSent: 0,
      recentExecutions: [],
    });
  } catch (error) {
    console.error('Error fetching auto-reply stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;