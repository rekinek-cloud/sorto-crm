import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validation';
import { z } from 'zod';
import { createActivity } from './activities';

const router = Router();

// Validation schemas
const createCommunicationSchema = z.object({
  type: z.enum(['email', 'phone', 'meeting', 'sms', 'chat']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  body: z.string().optional(),
  duration: z.number().min(0).optional(),
  status: z.enum(['sent', 'delivered', 'opened', 'replied', 'failed', 'scheduled', 'completed']).optional(),
  
  // Related entities
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  meetingId: z.string().uuid().optional()
});

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional()
});

const logCallSchema = z.object({
  contactId: z.string().uuid(),
  direction: z.enum(['inbound', 'outbound']),
  duration: z.number().min(0),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  followUpRequired: z.boolean().default(false)
});

// Apply authentication middleware to all routes
router.use(authenticateUser);

// POST /api/communications/log - Log a communication activity
router.post('/log', validateRequest({ body: createCommunicationSchema }), async (req, res) => {
  try {
    const {
      type,
      direction,
      subject,
      body,
      duration,
      status,
      companyId,
      contactId,
      dealId,
      taskId,
      projectId,
      meetingId
    } = req.body;

    // Determine activity type based on communication type
    let activityType = 'EMAIL_SENT';
    switch (type) {
      case 'email':
        activityType = direction === 'inbound' ? 'EMAIL_RECEIVED' : 'EMAIL_SENT';
        break;
      case 'phone':
        activityType = 'PHONE_CALL';
        break;
      case 'meeting':
        activityType = 'MEETING_COMPLETED';
        break;
      case 'sms':
        activityType = 'SMS_SENT';
        break;
      case 'chat':
        activityType = 'CHAT_MESSAGE';
        break;
    }

    // Create activity title based on type
    let title = '';
    switch (type) {
      case 'email':
        title = direction === 'inbound' ? 'Email received' : 'Email sent';
        break;
      case 'phone':
        title = direction === 'inbound' ? 'Incoming call' : 'Outgoing call';
        break;
      case 'meeting':
        title = 'Meeting completed';
        break;
      case 'sms':
        title = 'SMS sent';
        break;
      case 'chat':
        title = 'Chat message';
        break;
    }

    // Create the activity
    const activity = await createActivity({
      type: activityType,
      title,
      description: body,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      companyId,
      contactId,
      dealId,
      taskId,
      projectId,
      meetingId,
      communicationType: type,
      communicationDirection: direction,
      communicationSubject: subject,
      communicationBody: body,
      communicationDuration: duration,
      communicationStatus: status,
      metadata: {
        communicationType: type,
        communicationDirection: direction,
        duration,
        status
      }
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('Error logging communication:', error);
    res.status(500).json({ error: 'Failed to log communication' });
  }
});

// POST /api/communications/email - Send email and log activity
router.post('/email', authenticateUser, validateRequest({ body: sendEmailSchema }), async (req, res) => {
  try {
    const { to, subject, body, companyId, contactId, dealId } = req.body;

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log the email as sent
    console.log('Email would be sent:', { to, subject, body });

    // Log the email activity
    const activity = await createActivity({
      type: 'EMAIL_SENT',
      title: 'Email sent',
      description: `Email sent to ${to}`,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      companyId,
      contactId,
      dealId,
      communicationType: 'email',
      communicationDirection: 'outbound',
      communicationSubject: subject,
      communicationBody: body,
      communicationStatus: 'sent',
      metadata: {
        recipient: to,
        emailSubject: subject,
        emailProvider: 'system' // TODO: Add actual provider
      }
    });

    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      activity
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// POST /api/communications/call - Log a phone call
router.post('/call', validateRequest({ body: logCallSchema }), async (req, res) => {
  try {
    const { contactId, direction, duration, notes, outcome, followUpRequired } = req.body;

    // Get contact details for activity
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: req.user.organizationId
      },
      include: {
        assignedCompany: {
          select: { id: true, name: true }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const title = direction === 'inbound' 
      ? `Incoming call from ${contact.firstName} ${contact.lastName}`
      : `Outgoing call to ${contact.firstName} ${contact.lastName}`;

    // Log the call activity
    const activity = await createActivity({
      type: 'PHONE_CALL',
      title,
      description: notes || `${direction} call lasting ${duration} minutes`,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      companyId: contact.assignedCompany?.id,
      contactId: contact.id,
      communicationType: 'phone',
      communicationDirection: direction,
      communicationBody: notes,
      communicationDuration: duration,
      communicationStatus: 'completed',
      metadata: {
        callDuration: duration,
        callOutcome: outcome,
        followUpRequired,
        contactName: `${contact.firstName} ${contact.lastName}`,
        contactPhone: contact.phone
      }
    });

    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      activity
    });
  } catch (error) {
    console.error('Error logging call:', error);
    res.status(500).json({ error: 'Failed to log call' });
  }
});

// GET /api/communications/company/:id - Get communications for a company
router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify company belongs to organization
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

    // Get communication activities for this company from Activity table
    const activities = await prisma.activities.findMany({
      where: {
        organizationId: req.user.organizationId,
        companyId: id,
        communicationType: {
          not: null
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 25, // Limit to make room for messages
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true }
        },
        contacts: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Get messages from Message table for this company and its contacts
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { companyId: id },
          { contactId: { in: contactIds } }
        ]
      },
      orderBy: { receivedAt: 'desc' },
      take: 25, // Limit messages
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true }
        },
        channel: {
          select: { name: true, type: true }
        }
      }
    });

    // Convert messages to communication format
    const messagesCommunications = messages.map(message => ({
      id: `msg_${message.id}`,
      type: message.channel.type.toLowerCase(),
      direction: message.messageType === 'SENT' ? 'outbound' : 'inbound',
      subject: message.subject,
      content: message.content,
      fromAddress: message.fromAddress,
      fromName: message.fromName,
      toAddress: message.toAddress,
      createdAt: message.receivedAt,
      contact: message.contact,
      channel: message.channel,
      // Activity fields for compatibility
      title: message.channel.type === 'EMAIL' 
        ? (message.messageType === 'SENT' ? 'Email sent' : 'Email received')
        : 'Message',
      description: message.content,
      user: null,
      organizationId: req.user.organizationId,
      companyId: message.companyId || id,
      contactId: message.contactId,
      communicationType: message.channel.type.toLowerCase(),
      communicationDirection: message.messageType === 'SENT' ? 'outbound' : 'inbound',
      communicationSubject: message.subject,
      communicationBody: message.content,
      metadata: {
        messageId: message.id,
        fromAddress: message.fromAddress,
        fromName: message.fromName,
        toAddress: message.toAddress,
        subject: message.subject,
        channelName: message.channel.name,
        channelType: message.channel.type
      }
    }));

    // Convert activities to communication format
    const activitiesCommunications = activities.map(activity => ({
      id: activity.id,
      type: activity.communicationType || 'unknown',
      direction: activity.communicationDirection || 'outbound',
      subject: activity.communicationSubject,
      content: activity.communicationBody || activity.description || '',
      fromAddress: (activity.metadata as any)?.fromAddress,
      fromName: (activity.metadata as any)?.fromName,
      toAddress: (activity.metadata as any)?.toAddress,
      createdAt: activity.createdAt,
      contact: activity.contacts,
      channel: (activity.metadata as any)?.channelName ? {
        name: (activity.metadata as any).channelName,
        type: (activity.metadata as any).channelType || activity.communicationType
      } : null,
      // Keep original activity fields
      title: activity.title,
      description: activity.description,
      user: activity.users
    }));

    // Combine and sort all communications
    const allCommunications = [...messagesCommunications, ...activitiesCommunications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    res.json(allCommunications);
  } catch (error) {
    console.error('Error fetching company communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// GET /api/communications/contact/:id - Get communications for a contact (even without company)
router.get('/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify contact belongs to organization
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        assignedCompany: { select: { id: true } }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get communication activities for this contact
    const activities = await prisma.activities.findMany({
      where: {
        organizationId: req.user.organizationId,
        contactId: id,
        communicationType: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        users: { select: { id: true, firstName: true, lastName: true } },
        contacts: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Get messages linked to this contact
    const messages = await prisma.message.findMany({
      where: { contactId: id },
      orderBy: { receivedAt: 'desc' },
      take: 25,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        channel: { select: { name: true, type: true } }
      }
    });

    // Convert messages to communication format
    const messagesCommunications = messages.map(message => ({
      id: `msg_${message.id}`,
      type: message.channel.type.toLowerCase(),
      direction: message.messageType === 'SENT' ? 'outbound' : 'inbound',
      subject: message.subject,
      content: message.content,
      fromAddress: message.fromAddress,
      fromName: message.fromName,
      toAddress: message.toAddress,
      createdAt: message.receivedAt,
      contact: message.contact,
      channel: message.channel,
      title: message.channel.type === 'EMAIL'
        ? (message.messageType === 'SENT' ? 'Email sent' : 'Email received')
        : 'Message',
      description: message.content,
      user: null,
      organizationId: req.user.organizationId,
      companyId: message.companyId,
      contactId: message.contactId,
      communicationType: message.channel.type.toLowerCase(),
      communicationDirection: message.messageType === 'SENT' ? 'outbound' : 'inbound',
      communicationSubject: message.subject,
      communicationBody: message.content,
      metadata: {
        messageId: message.id,
        fromAddress: message.fromAddress,
        fromName: message.fromName,
        toAddress: message.toAddress,
        subject: message.subject,
        channelName: message.channel.name,
        channelType: message.channel.type
      }
    }));

    // Convert activities to communication format
    const activitiesCommunications = activities.map(activity => ({
      id: activity.id,
      type: activity.communicationType || 'unknown',
      direction: activity.communicationDirection || 'outbound',
      subject: activity.communicationSubject,
      content: activity.communicationBody || activity.description || '',
      fromAddress: (activity.metadata as any)?.fromAddress,
      fromName: (activity.metadata as any)?.fromName,
      toAddress: (activity.metadata as any)?.toAddress,
      createdAt: activity.createdAt,
      contact: activity.contacts,
      channel: (activity.metadata as any)?.channelName ? {
        name: (activity.metadata as any).channelName,
        type: (activity.metadata as any).channelType || activity.communicationType
      } : null,
      title: activity.title,
      description: activity.description,
      user: activity.users
    }));

    // Combine and sort
    const allCommunications = [...messagesCommunications, ...activitiesCommunications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    res.json(allCommunications);
  } catch (error) {
    console.error('Error fetching contact communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// POST /api/communications/seed-messages - Create sample messages for testing
router.post('/seed-messages', async (req, res) => {
  try {
    const { companyId } = req.body;

    // Get company and its contacts
    const company = await prisma.company.findFirst({
      where: {
        id: companyId || req.user.organizationId,
        organizationId: req.user.organizationId
      },
      include: {
        assignedContacts: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get or create a communication channel
    let channel = await prisma.communicationChannel.findFirst({
      where: {
        organizationId: req.user.organizationId,
        type: 'EMAIL'
      }
    });

    if (!channel) {
      channel = await prisma.communicationChannel.create({
        data: {
          name: 'Test Email Channel',
          type: 'EMAIL',
          active: true,
          config: {},
          organizationId: req.user.organizationId
        }
      });
    }

    const messages = [];

    // Create sample messages if there are contacts
    if (company.assignedContacts.length > 0) {
      const contact = company.assignedContacts[0];

      // Incoming email
      const incomingEmail = await prisma.message.create({
        data: {
          channelId: channel.id,
          messageId: `test-${Date.now()}-1`,
          subject: 'Pytanie o wasz produkt',
          content: 'Dzień dobry,\n\nChciałbym uzyskać więcej informacji o waszym produkcie. Czy możemy umówić się na spotkanie?\n\nPozdrawiam,\n' + contact.firstName,
          fromAddress: contact.email || 'contact@example.com',
          fromName: `${contact.firstName} ${contact.lastName}`,
          toAddress: company.email || 'info@company.com',
          messageType: 'INBOX',
          isRead: false,
          receivedAt: new Date(Date.now() - 3600000), // 1 hour ago
          contactId: contact.id,
          companyId: company.id
        }
      });
      messages.push(incomingEmail);

      // Outgoing reply
      const outgoingReply = await prisma.message.create({
        data: {
          channelId: channel.id,
          messageId: `test-${Date.now()}-2`,
          subject: 'RE: Pytanie o wasz produkt',
          content: 'Dzień dobry,\n\nDziękujemy za zainteresowanie naszym produktem. Z przyjemnością umówimy się na spotkanie.\n\nCzy odpowiada Panu jutro o 14:00?\n\nPozdrawiam,\nTeam',
          fromAddress: company.email || 'info@company.com',
          fromName: 'Sales Team',
          toAddress: contact.email || 'contact@example.com',
          messageType: 'SENT',
          isRead: true,
          receivedAt: new Date(Date.now() - 1800000), // 30 min ago
          contactId: contact.id,
          companyId: company.id
        }
      });
      messages.push(outgoingReply);

      // Recent incoming confirmation
      const recentIncoming = await prisma.message.create({
        data: {
          channelId: channel.id,
          messageId: `test-${Date.now()}-3`,
          subject: 'RE: Pytanie o wasz produkt',
          content: 'Tak, jutro o 14:00 mi odpowiada. Dziękuję!\n\nDo zobaczenia,\n' + contact.firstName,
          fromAddress: contact.email || 'contact@example.com',
          fromName: `${contact.firstName} ${contact.lastName}`,
          toAddress: company.email || 'info@company.com',
          messageType: 'INBOX',
          isRead: false,
          receivedAt: new Date(Date.now() - 600000), // 10 min ago
          contactId: contact.id,
          companyId: company.id
        }
      });
      messages.push(recentIncoming);
    }

    res.json({
      success: true,
      message: `Created ${messages.length} sample messages`,
      messages: messages.map(m => ({ id: m.id, subject: m.subject, type: m.messageType }))
    });

  } catch (error) {
    console.error('Error creating sample messages:', error);
    res.status(500).json({ error: 'Failed to create sample messages' });
  }
});

export default router;