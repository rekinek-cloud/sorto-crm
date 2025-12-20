import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { createActivity } from './activities';

const router = Router();

router.use(authenticateUser);

// POST /api/test-communications/seed - Create sample communication data
router.post('/seed', async (req, res) => {
  try {
    const { companyId } = req.body;
    
    // Get specific company or first company for testing
    const company = await prisma.company.findFirst({
      where: {
        organizationId: req.user.organizationId,
        ...(companyId && { id: companyId })
      },
      include: {
        assignedContacts: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'No company found for testing' });
    }

    const activities = [];

    // Create email activity
    const emailActivity = await createActivity({
      type: 'EMAIL_SENT',
      title: 'Email sent to company',
      description: 'Follow-up email regarding project proposal',
      organizationId: req.user.organizationId,
      userId: req.user.id,
      companyId: company.id,
      contactId: company.assignedContacts[0]?.id,
      communicationType: 'email',
      communicationDirection: 'outbound',
      communicationSubject: 'Project Proposal Follow-up',
      communicationBody: 'Hi, I wanted to follow up on our recent discussion about the project proposal...',
      communicationStatus: 'sent',
      metadata: {
        recipient: company.email || 'contact@company.com',
        emailSubject: 'Project Proposal Follow-up'
      }
    });
    activities.push(emailActivity);

    // Create phone call activity
    if (company.assignedContacts[0]) {
      const callActivity = await createActivity({
        type: 'PHONE_CALL',
        title: `Outgoing call to ${company.assignedContacts[0].firstName} ${company.assignedContacts[0].lastName}`,
        description: 'Discussed project timeline and requirements',
        organizationId: req.user.organizationId,
        userId: req.user.id,
        companyId: company.id,
        contactId: company.assignedContacts[0].id,
        communicationType: 'phone',
        communicationDirection: 'outbound',
        communicationDuration: 25,
        communicationStatus: 'completed',
        metadata: {
          callDuration: 25,
          callOutcome: 'Positive discussion, follow-up scheduled',
          followUpRequired: true,
          contactName: `${company.assignedContacts[0].firstName} ${company.assignedContacts[0].lastName}`,
          contactPhone: company.assignedContacts[0].phone
        }
      });
      activities.push(callActivity);

      // Create incoming email
      const incomingEmailActivity = await createActivity({
        type: 'EMAIL_RECEIVED',
        title: 'Email received from contact',
        description: 'Response to our project proposal',
        organizationId: req.user.organizationId,
        userId: req.user.id,
        companyId: company.id,
        contactId: company.assignedContacts[0].id,
        communicationType: 'email',
        communicationDirection: 'inbound',
        communicationSubject: 'Re: Project Proposal Follow-up',
        communicationBody: 'Thanks for your email. We are very interested in moving forward...',
        communicationStatus: 'received',
        metadata: {
          emailSubject: 'Re: Project Proposal Follow-up',
          sender: company.assignedContacts[0].email || 'contact@company.com'
        }
      });
      activities.push(incomingEmailActivity);

      // Create SMS activity
      const smsActivity = await createActivity({
        type: 'SMS_SENT',
        title: 'SMS sent to contact',
        description: 'Quick reminder about tomorrow meeting',
        organizationId: req.user.organizationId,
        userId: req.user.id,
        companyId: company.id,
        contactId: company.assignedContacts[0].id,
        communicationType: 'sms',
        communicationDirection: 'outbound',
        communicationBody: 'Hi! Just a quick reminder about our meeting tomorrow at 2 PM. Looking forward to it!',
        communicationStatus: 'sent',
        metadata: {
          recipient: company.assignedContacts[0].phone || '+1234567890'
        }
      });
      activities.push(smsActivity);
    }

    res.json({
      success: true,
      message: `Created ${activities.length} sample communication activities`,
      activities: activities.map(a => ({ id: a.id, type: a.type, title: a.title }))
    });

  } catch (error) {
    console.error('Error creating sample communications:', error);
    res.status(500).json({ error: 'Failed to create sample communications' });
  }
});

export default router;