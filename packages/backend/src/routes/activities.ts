import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const activityQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('50'),
  entityType: z.enum(['company', 'contact', 'deal', 'task', 'project', 'meeting']).optional(),
  entityId: z.string().uuid().optional(),
  type: z.enum([
    'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_STAGE_CHANGED',
    'CONTACT_ADDED', 'CONTACT_UPDATED',
    'TASK_CREATED', 'TASK_COMPLETED',
    'MEETING_SCHEDULED', 'MEETING_COMPLETED',
    'EMAIL_SENT', 'EMAIL_RECEIVED',
    'PHONE_CALL', 'NOTE_ADDED',
    'COMPANY_UPDATED', 'PROJECT_CREATED', 'PROJECT_UPDATED'
  ]).optional(),
  userId: z.string().uuid().optional()
});

const companyActivitiesSchema = z.object({
  id: z.string().uuid('Invalid company ID format')
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /api/activities - List activities with filtering
router.get('/', validateRequest({ query: activityQuerySchema }), async (req, res) => {
  try {
    const {
      page,
      limit,
      entityType,
      entityId,
      type,
      userId
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId
    };

    if (entityType && entityId) {
      switch (entityType) {
        case 'company':
          where.companyId = entityId;
          break;
        case 'contact':
          where.contactId = entityId;
          break;
        case 'deal':
          where.dealId = entityId;
          break;
        case 'task':
          where.taskId = entityId;
          break;
        case 'project':
          where.projectId = entityId;
          break;
        case 'meeting':
          where.meetingId = entityId;
          break;
      }
    }

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get activities
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true }
          },
          company: {
            select: { id: true, name: true }
          },
          contact: {
            select: { id: true, firstName: true, lastName: true }
          },
          deal: {
            select: { id: true, title: true, value: true, stage: true }
          },
          task: {
            select: { id: true, title: true, status: true }
          },
          project: {
            select: { id: true, name: true, status: true }
          },
          meeting: {
            select: { id: true, title: true, startTime: true }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/activities/company/:id - Get activities for a specific company
router.get('/company/:id', validateRequest({ params: companyActivitiesSchema }), async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify company exists and belongs to organization
    const company = await prisma.company.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get contact IDs for this company
    const contactIds = await prisma.contact.findMany({
      where: { companyId: id },
      select: { id: true }
    }).then(contacts => contacts.map(c => c.id));

    // Get deal IDs for this company  
    const dealIds = await prisma.deal.findMany({
      where: { companyId: id },
      select: { id: true }
    }).then(deals => deals.map(d => d.id));

    // Get activities related to this company
    const activities = await prisma.activity.findMany({
      where: {
        organizationId: req.user.organizationId,
        OR: [
          { companyId: id },
          { contactId: { in: contactIds } },
          { dealId: { in: dealIds } }
        ]
      },
      take: Math.floor(limit * 0.7), // Reserve 30% for messages
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        company: {
          select: { id: true, name: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true }
        },
        deal: {
          select: { id: true, title: true, value: true, stage: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        project: {
          select: { id: true, name: true, status: true }
        },
        meeting: {
          select: { id: true, title: true, startTime: true }
        }
      }
    });

    // Get messages from company and its contacts
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { companyId: id }, // Direct company messages
          { contactId: { in: contactIds } } // Messages from company contacts
        ]
      },
      take: Math.ceil(limit * 0.3), // 30% of limit for messages
      orderBy: { receivedAt: 'desc' },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        channel: {
          select: { name: true, type: true }
        }
      }
    });

    // Convert messages to activity-like format
    const messageActivities = messages.map(message => ({
      id: `msg_${message.id}`,
      type: message.channel.type === 'EMAIL' 
        ? (message.messageType === 'SENT' ? 'EMAIL_SENT' : 'EMAIL_RECEIVED')
        : 'CHAT_MESSAGE',
      title: message.channel.type === 'EMAIL' 
        ? (message.messageType === 'SENT' ? 'Email sent' : 'Email received')
        : `Message via ${message.channel.name}`,
      description: message.content,
      createdAt: message.receivedAt,
      updatedAt: message.receivedAt,
      organizationId: req.user.organizationId,
      userId: null,
      companyId: message.companyId || id,
      contactId: message.contactId,
      dealId: message.dealId,
      taskId: message.taskId,
      projectId: null,
      meetingId: null,
      communicationType: message.channel.type.toLowerCase(),
      communicationDirection: message.messageType === 'SENT' ? 'outbound' : 'inbound',
      communicationSubject: message.subject,
      communicationBody: message.content,
      communicationDuration: null,
      communicationStatus: message.messageType === 'SENT' ? 'sent' : 'received',
      metadata: {
        messageId: message.id,
        fromAddress: message.fromAddress,
        fromName: message.fromName,
        toAddress: message.toAddress,
        subject: message.subject,
        isRead: message.isRead,
        channelName: message.channel.name,
        channelType: message.channel.type,
        communicationType: message.channel.type.toLowerCase(),
        communicationDirection: message.messageType === 'SENT' ? 'outbound' : 'inbound',
        emailSubject: message.subject,
        recipient: message.messageType === 'SENT' ? message.toAddress : null,
        sender: message.messageType === 'SENT' ? null : message.fromAddress
      },
      // Include relations for consistency
      contact: message.contact,
      user: null,
      deal: null,
      task: null,
      project: null,
      meeting: null
    }));

    // Combine activities and messages, sort by date
    const allActivities = [...activities, ...messageActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json(allActivities);
  } catch (error) {
    console.error('Error fetching company activities:', error);
    res.status(500).json({ error: 'Failed to fetch company activities' });
  }
});

// Helper function to create activity (to be used by other services)
export const createActivity = async (data: {
  type: string;
  title: string;
  description?: string;
  metadata?: any;
  organizationId: string;
  userId?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  taskId?: string;
  projectId?: string;
  meetingId?: string;
  // Communication fields
  communicationType?: string;
  communicationDirection?: string;
  communicationSubject?: string;
  communicationBody?: string;
  communicationDuration?: number;
  communicationStatus?: string;
}) => {
  try {
    return await prisma.activity.create({
      data: {
        ...data,
        metadata: data.metadata || {}
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export default router;