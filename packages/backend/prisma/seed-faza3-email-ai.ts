import { PrismaClient, EmailCategory, EmailProvider, AutoReplyStatus, 
         AITemplateStatus, AIRuleStatus, AITriggerType, AIExecutionStatus,
         AIKnowledgeStatus, AIDocumentStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Faza 3: Email & AI Systems seeding...');

  // Get existing organization
  const organization = await prisma.organization.findFirst({
    where: { slug: 'demo-org' }
  });

  if (!organization) {
    throw new Error('Organization not found. Run basic seed first.');
  }

  // Get existing data
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id }
  });

  const aiProviders = await prisma.aIProvider.findMany({
    where: { organizationId: organization.id }
  });

  const aiModels = await prisma.aIModel.findMany({
    where: { organizationId: organization.id }
  });

  const messages = await prisma.message.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  if (users.length === 0) {
    throw new Error('No users found. Run basic seed first.');
  }

  const primaryUser = users[0];

  // ================================
  // EMAIL SYSTEM (5 tabel)
  // ================================

  console.log('📧 Creating Email Rules...');
  
  const emailRules = await Promise.all([
    prisma.emailRule.create({
      data: {
        name: 'VIP Customer Filter',
        description: 'Automatically categorize emails from VIP customers and priority clients',
        conditions: {
          any: [
            { field: 'from', operator: 'contains', value: '@techcorp.com' },
            { field: 'from', operator: 'contains', value: '@megacorp.com' },
            { field: 'subject', operator: 'contains', value: 'enterprise' },
            { field: 'body', operator: 'contains', value: 'premium support' }
          ]
        },
        actions: {
          categorize: 'VIP',
          priority: 'HIGH',
          assignTo: primaryUser.id,
          addTags: ['vip-customer', 'priority-response'],
          createTask: true
        },
        priority: 1,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Invoice Processing',
        description: 'Automatically process and categorize incoming invoices',
        conditions: {
          all: [
            { field: 'subject', operator: 'matches', value: '(invoice|bill|payment)' },
            { field: 'hasAttachment', operator: 'equals', value: true }
          ]
        },
        actions: {
          categorize: 'INVOICES',
          priority: 'MEDIUM',
          forwardTo: 'accounting@example.com',
          addTags: ['invoice', 'accounting', 'needs-processing'],
          createReminder: '3d'
        },
        priority: 2,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Spam Filter',
        description: 'Filter out spam and unwanted marketing emails',
        conditions: {
          any: [
            { field: 'subject', operator: 'contains', value: 'unsubscribe' },
            { field: 'body', operator: 'matches', value: '(viagra|casino|lottery)' },
            { field: 'from', operator: 'endsWith', value: '.spam' },
            { field: 'spamScore', operator: 'greaterThan', value: 8 }
          ]
        },
        actions: {
          categorize: 'SPAM',
          markAsRead: true,
          moveToFolder: 'spam',
          priority: 'LOW'
        },
        priority: 10,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Support Ticket Auto-Assignment',
        description: 'Automatically assign support emails to appropriate team members',
        conditions: {
          all: [
            { field: 'to', operator: 'equals', value: 'support@crm-gtd.com' },
            { field: 'subject', operator: 'notContains', value: 'Re:' }
          ]
        },
        actions: {
          createTicket: true,
          assignByRoundRobin: ['support-team'],
          priority: 'MEDIUM',
          addTags: ['support', 'new-ticket'],
          sendAutoReply: true
        },
        priority: 3,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Newsletter Archive',
        description: 'Archive newsletters and non-critical communications',
        conditions: {
          any: [
            { field: 'subject', operator: 'contains', value: 'newsletter' },
            { field: 'from', operator: 'contains', value: 'noreply' },
            { field: 'listUnsubscribe', operator: 'exists', value: true }
          ]
        },
        actions: {
          categorize: 'ARCHIVE',
          markAsRead: true,
          moveToFolder: 'newsletters',
          priority: 'LOW'
        },
        priority: 5,
        isActive: true,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${emailRules.length} email rules`);

  console.log('📝 Creating Email Templates...');
  
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.create({
      data: {
        name: 'Welcome to CRM-GTD Smart',
        slug: 'welcome-new-customer',
        subject: 'Welcome to CRM-GTD Smart, {{firstName}}!',
        body: `
<h2>Welcome aboard, {{firstName}}!</h2>

<p>Thank you for choosing CRM-GTD Smart as your productivity and customer relationship management solution.</p>

<h3>Getting Started:</h3>
<ul>
  <li><a href="{{loginUrl}}">Login to your account</a></li>
  <li><a href="{{docsUrl}}">Read our Getting Started Guide</a></li>
  <li><a href="{{videoUrl}}">Watch our 5-minute overview video</a></li>
</ul>

<p>Your {{planName}} plan includes:</p>
<ul>
  {{#features}}
  <li>{{.}}</li>
  {{/features}}
</ul>

<p>If you have any questions, our support team is here to help at support@crm-gtd.com</p>

<p>Best regards,<br>
The CRM-GTD Team</p>
        `,
        variables: {
          firstName: 'string',
          loginUrl: 'string',
          docsUrl: 'string',
          videoUrl: 'string',
          planName: 'string',
          features: 'array'
        },
        tags: ['onboarding', 'welcome', 'customer'],
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailTemplate.create({
      data: {
        name: 'Support Ticket Auto-Response',
        slug: 'support-ticket-received',
        subject: 'Re: {{originalSubject}} [Ticket #{{ticketNumber}}]',
        body: `
<p>Hello {{customerName}},</p>

<p>Thank you for contacting CRM-GTD Support. We've received your request and created ticket #{{ticketNumber}}.</p>

<p><strong>Your request:</strong><br>
{{requestSummary}}</p>

<p><strong>What happens next:</strong></p>
<ul>
  <li>A support specialist will review your request within {{responseTime}}</li>
  <li>You'll receive an email update when we begin working on your ticket</li>
  <li>Track your ticket status at: {{ticketUrl}}</li>
</ul>

<p><strong>Priority Level:</strong> {{priority}}<br>
<strong>Expected Response Time:</strong> {{responseTime}}</p>

<p>In the meantime, you might find these resources helpful:</p>
<ul>
  <li><a href="{{kbUrl}}">Knowledge Base</a></li>
  <li><a href="{{faqUrl}}">Frequently Asked Questions</a></li>
  <li><a href="{{statusUrl}}">System Status Page</a></li>
</ul>

<p>Best regards,<br>
CRM-GTD Support Team</p>
        `,
        variables: {
          customerName: 'string',
          originalSubject: 'string',
          ticketNumber: 'string',
          requestSummary: 'string',
          ticketUrl: 'string',
          priority: 'string',
          responseTime: 'string',
          kbUrl: 'string',
          faqUrl: 'string',
          statusUrl: 'string'
        },
        tags: ['support', 'auto-response', 'ticket'],
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailTemplate.create({
      data: {
        name: 'Deal Won Notification',
        slug: 'deal-won-internal',
        subject: '🎉 Deal Won: {{dealName}} - {{dealValue}}',
        body: `
<h2>🎉 Congratulations Team!</h2>

<p>Great news! We've successfully closed the deal with <strong>{{companyName}}</strong>!</p>

<h3>Deal Details:</h3>
<table style="border-collapse: collapse; width: 100%;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deal Name:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{dealName}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Company:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{companyName}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deal Value:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{dealValue}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sales Rep:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{salesRep}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Close Date:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{closeDate}}</td>
  </tr>
</table>

<h3>Key Success Factors:</h3>
<p>{{successFactors}}</p>

<h3>Next Steps:</h3>
<ol>
  {{#nextSteps}}
  <li>{{.}}</li>
  {{/nextSteps}}
</ol>

<p>Special thanks to {{salesRep}} and everyone involved in making this happen!</p>

<p>Let's keep the momentum going! 🚀</p>
        `,
        variables: {
          dealName: 'string',
          companyName: 'string',
          dealValue: 'string',
          salesRep: 'string',
          closeDate: 'string',
          successFactors: 'string',
          nextSteps: 'array'
        },
        tags: ['sales', 'deal-won', 'internal', 'celebration'],
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailTemplate.create({
      data: {
        name: 'Weekly GTD Review Reminder',
        slug: 'gtd-weekly-review',
        subject: '📅 Time for your Weekly GTD Review, {{firstName}}',
        body: `
<p>Hi {{firstName}},</p>

<p>It's time for your weekly GTD review! Taking 30-60 minutes now will help you stay on top of everything for the coming week.</p>

<h3>Your GTD Stats This Week:</h3>
<ul>
  <li>✅ Tasks Completed: {{tasksCompleted}}</li>
  <li>📥 New Items in Inbox: {{inboxItems}}</li>
  <li>⏳ Items Waiting For: {{waitingForItems}}</li>
  <li>💡 Someday/Maybe Items: {{somedayItems}}</li>
</ul>

<h3>Weekly Review Checklist:</h3>
<ol>
  <li>☐ Collect loose papers and materials</li>
  <li>☐ Get "IN" to zero</li>
  <li>☐ Empty your head (capture new ideas)</li>
  <li>☐ Review Next Actions lists</li>
  <li>☐ Review previous calendar</li>
  <li>☐ Review upcoming calendar</li>
  <li>☐ Review Waiting For list</li>
  <li>☐ Review Projects list</li>
  <li>☐ Review Someday/Maybe list</li>
</ol>

<p><a href="{{reviewUrl}}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Weekly Review</a></p>

<p>Remember: The weekly review is your chance to get clear, get current, and get creative!</p>

<p>Happy reviewing!<br>
Your CRM-GTD Assistant</p>
        `,
        variables: {
          firstName: 'string',
          tasksCompleted: 'number',
          inboxItems: 'number',
          waitingForItems: 'number',
          somedayItems: 'number',
          reviewUrl: 'string'
        },
        tags: ['gtd', 'weekly-review', 'reminder', 'productivity'],
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailTemplate.create({
      data: {
        name: 'AI Analysis Report',
        slug: 'ai-analysis-complete',
        subject: '🤖 AI Analysis Complete: {{analysisType}}',
        body: `
<h2>AI Analysis Report</h2>

<p>The AI analysis you requested has been completed successfully.</p>

<h3>Analysis Details:</h3>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{analysisType}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Subject:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{analysisSubject}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Model Used:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{aiModel}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Processing Time:</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">{{processingTime}}</td>
  </tr>
</table>

<h3>Key Findings:</h3>
{{#findings}}
<p>• {{.}}</p>
{{/findings}}

<h3>Recommendations:</h3>
{{#recommendations}}
<p>{{@index}}. {{.}}</p>
{{/recommendations}}

<h3>Confidence Score: {{confidenceScore}}%</h3>

<p><a href="{{fullReportUrl}}" style="background: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Report</a></p>

<p>Questions about this analysis? Reply to this email or contact our AI support team.</p>
        `,
        variables: {
          analysisType: 'string',
          analysisSubject: 'string',
          aiModel: 'string',
          processingTime: 'string',
          findings: 'array',
          recommendations: 'array',
          confidenceScore: 'number',
          fullReportUrl: 'string'
        },
        tags: ['ai', 'analysis', 'report', 'automated'],
        isActive: true,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${emailTemplates.length} email templates`);

  console.log('📮 Creating Email Logs...');
  
  const emailLogs = await Promise.all([
    prisma.emailLog.create({
      data: {
        messageId: 'msg_' + Date.now() + '_1',
        provider: EmailProvider.SENDGRID,
        to: ['john.demo@example.com'],
        cc: [],
        bcc: [],
        from: 'noreply@crm-gtd.com',
        subject: 'Welcome to CRM-GTD Smart!',
        templateId: emailTemplates[0].id,
        templateData: {
          firstName: 'John',
          loginUrl: 'https://crm-gtd.com/login',
          docsUrl: 'https://docs.crm-gtd.com',
          videoUrl: 'https://crm-gtd.com/intro-video',
          planName: 'Professional',
          features: ['Unlimited users', 'AI Assistant', 'Priority support']
        },
        status: 'delivered',
        sentAt: new Date('2024-07-10T10:30:00Z'),
        deliveredAt: new Date('2024-07-10T10:30:15Z'),
        openedAt: new Date('2024-07-10T14:22:00Z'),
        clickedAt: new Date('2024-07-10T14:23:30Z'),
        organizationId: organization.id
      }
    }),

    prisma.emailLog.create({
      data: {
        messageId: 'msg_' + Date.now() + '_2',
        provider: EmailProvider.SMTP,
        to: ['support@techcorp.com'],
        cc: ['manager@techcorp.com'],
        bcc: [],
        from: 'sales@crm-gtd.com',
        subject: '🎉 Deal Won: TechCorp Enterprise Implementation - $15,000',
        templateId: emailTemplates[2].id,
        templateData: {
          dealName: 'TechCorp Enterprise Implementation',
          companyName: 'TechCorp Inc.',
          dealValue: '$15,000',
          salesRep: 'Sarah Johnson',
          closeDate: '2024-07-15',
          successFactors: 'Strong ROI demonstration and excellent technical fit',
          nextSteps: ['Schedule kickoff meeting', 'Prepare implementation plan', 'Set up project team']
        },
        status: 'delivered',
        sentAt: new Date('2024-07-15T16:45:00Z'),
        deliveredAt: new Date('2024-07-15T16:45:08Z'),
        organizationId: organization.id
      }
    }),

    prisma.emailLog.create({
      data: {
        messageId: 'msg_' + Date.now() + '_3',
        provider: EmailProvider.AWS_SES,
        to: ['customer@example.com'],
        cc: [],
        bcc: [],
        from: 'support@crm-gtd.com',
        subject: 'Re: Login issues [Ticket #12345]',
        templateId: emailTemplates[1].id,
        templateData: {
          customerName: 'Michael Chen',
          originalSubject: 'Login issues',
          ticketNumber: '12345',
          requestSummary: 'Unable to login after password reset',
          ticketUrl: 'https://support.crm-gtd.com/ticket/12345',
          priority: 'High',
          responseTime: '2 hours',
          kbUrl: 'https://kb.crm-gtd.com',
          faqUrl: 'https://crm-gtd.com/faq',
          statusUrl: 'https://status.crm-gtd.com'
        },
        status: 'failed',
        sentAt: new Date('2024-07-18T09:15:00Z'),
        error: 'Invalid email address format',
        organizationId: organization.id
      }
    }),

    prisma.emailLog.create({
      data: {
        messageId: 'msg_' + Date.now() + '_4',
        provider: EmailProvider.SENDGRID,
        to: ['demo@example.com'],
        cc: [],
        bcc: [],
        from: 'gtd@crm-gtd.com',
        subject: '📅 Time for your Weekly GTD Review, John',
        templateId: emailTemplates[3].id,
        templateData: {
          firstName: 'John',
          tasksCompleted: 23,
          inboxItems: 15,
          waitingForItems: 4,
          somedayItems: 8,
          reviewUrl: 'https://crm-gtd.com/workflow/weekly-review'
        },
        status: 'delivered',
        sentAt: new Date('2024-07-22T08:00:00Z'),
        deliveredAt: new Date('2024-07-22T08:00:12Z'),
        openedAt: new Date('2024-07-22T09:30:00Z'),
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${emailLogs.length} email logs`);

  console.log('📊 Creating Email Analysis...');
  
  let emailAnalysis: any[] = [];
  if (messages.length > 0) {
    emailAnalysis = await Promise.all(
      messages.slice(0, 3).map((message, index) =>
        prisma.emailAnalysis.create({
          data: {
            messageId: message.id,
            category: [EmailCategory.VIP, EmailCategory.UNKNOWN, EmailCategory.ARCHIVE][index],
            sentiment: ['positive', 'neutral', 'negative'][index % 3],
            sentimentScore: [0.85, 0.50, 0.25][index % 3],
            urgency: ['high', 'medium', 'low'][index % 3],
            urgencyScore: [0.9, 0.5, 0.2][index % 3],
            summary: [
              'Customer requesting enterprise demo and pricing information',
              'General inquiry about product features and capabilities',
              'Newsletter subscription confirmation'
            ][index],
            keyPhrases: [
              ['enterprise demo', 'pricing', 'urgent request'],
              ['product features', 'integration options'],
              ['newsletter', 'subscription', 'marketing']
            ][index],
            entities: {
              companies: index === 0 ? ['TechCorp Inc.'] : [],
              people: index === 0 ? ['Sarah Johnson'] : [],
              dates: ['2024-07-20', '2024-07-25'],
              amounts: index === 0 ? ['$15,000'] : []
            },
            suggestedActions: [
              ['Schedule demo', 'Send pricing', 'Assign to sales team'],
              ['Send product documentation', 'Schedule follow-up'],
              ['Archive message']
            ][index],
            language: 'en',
            organizationId: organization.id
          }
        })
      )
    );
  }

  console.log(`✅ Created ${emailAnalysis.length} email analyses`);

  console.log('🔄 Creating Auto Replies...');
  
  const autoReplies = await Promise.all([
    prisma.autoReply.create({
      data: {
        name: 'Out of Office - Vacation',
        subject: 'Out of Office: {{originalSubject}}',
        body: `
Thank you for your email. I am currently out of the office on vacation from {{startDate}} to {{endDate}} with limited access to email.

For urgent matters, please contact:
- Technical Support: support@crm-gtd.com
- Sales Inquiries: {{alternateContact}}

I will respond to your email upon my return.

Best regards,
{{senderName}}
        `,
        conditions: {
          dateRange: {
            start: '2024-08-01',
            end: '2024-08-15'
          },
          excludeDomains: ['crm-gtd.com'],
          onlyExternal: true
        },
        status: AutoReplyStatus.SCHEDULED,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-15'),
        isActive: false,
        organizationId: organization.id,
        userId: primaryUser.id
      }
    }),

    prisma.autoReply.create({
      data: {
        name: 'Support Hours Auto-Reply',
        subject: 'Re: {{originalSubject}} - Support Hours Information',
        body: `
Hello,

Thank you for contacting CRM-GTD Support. We've received your message outside of our regular support hours.

Our support hours are:
- Monday to Friday: 9:00 AM - 6:00 PM EST
- Saturday: 10:00 AM - 2:00 PM EST
- Sunday: Closed

Your request has been logged and will be addressed during our next business hours.

For urgent issues, please visit our self-service portal at: https://support.crm-gtd.com

Thank you for your patience.

CRM-GTD Support Team
        `,
        conditions: {
          timeRange: {
            outsideHours: true,
            timezone: 'America/New_York',
            businessHours: {
              monday: { start: '09:00', end: '18:00' },
              tuesday: { start: '09:00', end: '18:00' },
              wednesday: { start: '09:00', end: '18:00' },
              thursday: { start: '09:00', end: '18:00' },
              friday: { start: '09:00', end: '18:00' },
              saturday: { start: '10:00', end: '14:00' },
              sunday: null
            }
          },
          triggerEmails: ['support@crm-gtd.com', 'help@crm-gtd.com']
        },
        status: AutoReplyStatus.ACTIVE,
        isActive: true,
        organizationId: organization.id,
        userId: primaryUser.id
      }
    }),

    prisma.autoReply.create({
      data: {
        name: 'Demo Request Confirmation',
        subject: 'Demo Scheduled: {{productName}} - {{demoDate}}',
        body: `
Dear {{contactName}},

Thank you for your interest in CRM-GTD Smart! Your demo has been scheduled.

Demo Details:
- Product: {{productName}}
- Date: {{demoDate}}
- Time: {{demoTime}} {{timezone}}
- Duration: 45 minutes
- Meeting Link: {{meetingUrl}}

What to expect:
1. Overview of key features (15 min)
2. Live demonstration (20 min)
3. Q&A session (10 min)

Please prepare any specific questions or use cases you'd like us to address.

Looking forward to showing you how CRM-GTD Smart can transform your productivity!

Best regards,
{{salesRepName}}
Sales Team, CRM-GTD
        `,
        conditions: {
          triggerWords: ['demo request', 'schedule demo', 'product demo'],
          emailPatterns: ['*@*']
        },
        status: AutoReplyStatus.ACTIVE,
        isActive: true,
        organizationId: organization.id,
        userId: users.length > 1 ? users[1].id : primaryUser.id
      }
    })
  ]);

  console.log(`✅ Created ${autoReplies.length} auto replies`);

  // ================================
  // AI ADVANCED SYSTEM (7 tabel)
  // ================================

  console.log('🤖 Creating AI Rules...');
  
  const aiRules = await Promise.all([
    prisma.aIRule.create({
      data: {
        name: 'Email Sentiment Analysis',
        description: 'Analyze sentiment and urgency of incoming emails for prioritization',
        modelId: aiModels[0].id, // Assuming first model is suitable
        triggerType: AITriggerType.MESSAGE_RECEIVED,
        triggerConditions: {
          messageTypes: ['email'],
          excludeInternal: false,
          minLength: 50
        },
        prompt: `Analyze the following email and provide:
1. Sentiment (positive/neutral/negative) with score 0-1
2. Urgency level (high/medium/low) with score 0-1
3. Brief summary (max 100 words)
4. Suggested priority level
5. Key action items if any

Email content:
{{email_content}}`,
        parameters: {
          temperature: 0.3,
          maxTokens: 500,
          topP: 0.9
        },
        outputFormat: {
          sentiment: 'string',
          sentimentScore: 'number',
          urgency: 'string',
          urgencyScore: 'number',
          summary: 'string',
          priority: 'string',
          actionItems: 'array'
        },
        actions: {
          updateMessage: true,
          createTask: 'ifUrgent',
          notify: 'ifHighPriority',
          categorize: true
        },
        priority: 1,
        status: AIRuleStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIRule.create({
      data: {
        name: 'Project Risk Assessment',
        description: 'Automatically assess project risks based on task delays and dependencies',
        modelId: aiModels[0].id,
        triggerType: AITriggerType.SCHEDULED,
        triggerConditions: {
          schedule: '0 9 * * 1', // Every Monday at 9 AM
          projectStatuses: ['IN_PROGRESS', 'AT_RISK']
        },
        prompt: `Analyze the following project data and provide risk assessment:

Project: {{project_name}}
Status: {{project_status}}
Delayed Tasks: {{delayed_tasks_count}}
Critical Path Status: {{critical_path_status}}
Team Capacity: {{team_capacity}}

Provide:
1. Overall risk level (low/medium/high/critical)
2. Top 3 risk factors
3. Mitigation recommendations
4. Suggested priority adjustments`,
        parameters: {
          temperature: 0.4,
          maxTokens: 800
        },
        outputFormat: {
          riskLevel: 'string',
          riskScore: 'number',
          riskFactors: 'array',
          recommendations: 'array',
          priorityAdjustments: 'object'
        },
        actions: {
          createReport: true,
          updateProject: true,
          notifyStakeholders: 'ifHighRisk',
          adjustPriorities: true
        },
        priority: 2,
        status: AIRuleStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIRule.create({
      data: {
        name: 'Smart Task Suggestions',
        description: 'Generate next action suggestions based on completed tasks and patterns',
        modelId: aiModels[0].id,
        triggerType: AITriggerType.TASK_COMPLETED,
        triggerConditions: {
          taskTypes: ['all'],
          minCompletionTime: 300 // 5 minutes
        },
        prompt: `Based on the completed task and user's work patterns, suggest next actions:

Completed Task: {{task_title}}
Task Context: {{task_context}}
Recent Tasks: {{recent_tasks}}
Current Time: {{current_time}}
User Energy Level: {{energy_level}}

Suggest 3-5 relevant next actions with:
1. Task title
2. Estimated time
3. Context (@computer, @calls, etc.)
4. Priority reasoning`,
        parameters: {
          temperature: 0.7,
          maxTokens: 600
        },
        outputFormat: {
          suggestions: 'array<{title: string, estimatedTime: string, context: string, priority: string, reasoning: string}>'
        },
        actions: {
          displaySuggestions: true,
          createDraftTasks: true,
          trackAcceptance: true
        },
        priority: 3,
        status: AIRuleStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIRule.create({
      data: {
        name: 'Meeting Summary Generator',
        description: 'Generate meeting summaries and action items from meeting notes',
        modelId: aiModels[0].id,
        triggerType: AITriggerType.MANUAL_TRIGGER,
        triggerConditions: {
          entityType: 'meeting',
          requiredFields: ['notes']
        },
        prompt: `Generate a professional meeting summary from the following notes:

Meeting: {{meeting_title}}
Date: {{meeting_date}}
Attendees: {{attendees}}
Notes: {{meeting_notes}}

Provide:
1. Executive summary (2-3 sentences)
2. Key decisions made
3. Action items with owners
4. Follow-up requirements
5. Next meeting suggestions`,
        parameters: {
          temperature: 0.5,
          maxTokens: 1000
        },
        outputFormat: {
          summary: 'string',
          decisions: 'array',
          actionItems: 'array<{task: string, owner: string, dueDate: string}>',
          followUps: 'array',
          nextMeeting: 'object'
        },
        actions: {
          updateMeeting: true,
          createTasks: true,
          sendEmail: true,
          scheduleFollowUp: true
        },
        priority: 4,
        status: AIRuleStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIRule.create({
      data: {
        name: 'Customer Churn Prediction',
        description: 'Predict customer churn risk based on engagement patterns',
        modelId: aiModels[0].id,
        triggerType: AITriggerType.SCHEDULED,
        triggerConditions: {
          schedule: '0 0 * * 0', // Weekly on Sunday midnight
          customerSegments: ['enterprise', 'professional']
        },
        prompt: `Analyze customer engagement data and predict churn risk:

Customer: {{customer_name}}
Last Login: {{last_login}}
Feature Usage: {{feature_usage_stats}}
Support Tickets: {{recent_tickets}}
Payment History: {{payment_status}}
Engagement Score: {{engagement_score}}

Provide:
1. Churn risk level (0-100%)
2. Key risk indicators
3. Retention recommendations
4. Personalized outreach suggestions`,
        parameters: {
          temperature: 0.3,
          maxTokens: 700
        },
        outputFormat: {
          churnRisk: 'number',
          riskLevel: 'string',
          indicators: 'array',
          recommendations: 'array',
          outreachSuggestions: 'array'
        },
        actions: {
          updateCustomerRecord: true,
          createAlert: 'ifHighRisk',
          assignToCSM: 'ifMediumRisk',
          generateEmail: true
        },
        priority: 5,
        status: AIRuleStatus.TESTING,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiRules.length} AI rules`);

  console.log('⚡ Creating AI Executions...');
  
  const aiExecutions = await Promise.all([
    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[0].id, // Email Sentiment Analysis
        modelId: aiModels[0].id,
        status: AIExecutionStatus.SUCCESS,
        input: {
          email_content: 'Urgent: We need the enterprise implementation completed by end of month. This is critical for our Q3 launch. Please confirm ASAP.'
        },
        output: {
          sentiment: 'negative',
          sentimentScore: 0.25,
          urgency: 'high',
          urgencyScore: 0.95,
          summary: 'Client expressing urgency about enterprise implementation deadline for Q3 launch. Requires immediate confirmation.',
          priority: 'HIGH',
          actionItems: ['Confirm implementation timeline', 'Check resource availability', 'Send immediate response']
        },
        tokensUsed: 245,
        processingTime: 1250, // milliseconds
        cost: 0.0049,
        organizationId: organization.id
      }
    }),

    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[1].id, // Project Risk Assessment
        modelId: aiModels[0].id,
        status: AIExecutionStatus.SUCCESS,
        input: {
          project_name: 'CRM Integration Project',
          project_status: 'IN_PROGRESS',
          delayed_tasks_count: 3,
          critical_path_status: 'at_risk',
          team_capacity: '85%'
        },
        output: {
          riskLevel: 'high',
          riskScore: 0.75,
          riskFactors: [
            'Critical path tasks are delayed by 5 days',
            'Team capacity is near maximum with no buffer',
            'Dependencies on external vendor deliverables'
          ],
          recommendations: [
            'Allocate additional resources to critical path tasks',
            'Negotiate timeline adjustment with stakeholders',
            'Implement daily standups for blocked items'
          ],
          priorityAdjustments: {
            'task_123': 'HIGH',
            'task_456': 'CRITICAL'
          }
        },
        tokensUsed: 412,
        processingTime: 1890,
        cost: 0.0082,
        organizationId: organization.id
      }
    }),

    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[2].id, // Smart Task Suggestions
        modelId: aiModels[0].id,
        status: AIExecutionStatus.SUCCESS,
        input: {
          task_title: 'Review and approve marketing proposal',
          task_context: '@computer',
          recent_tasks: ['Email client about proposal', 'Update project timeline'],
          current_time: '14:30',
          energy_level: 'medium'
        },
        output: {
          suggestions: [
            {
              title: 'Send proposal approval to design team',
              estimatedTime: '15min',
              context: '@email',
              priority: 'HIGH',
              reasoning: 'Natural next step after proposal approval'
            },
            {
              title: 'Schedule kickoff meeting with marketing team',
              estimatedTime: '20min',
              context: '@computer',
              priority: 'MEDIUM',
              reasoning: 'Important to align team after approval'
            },
            {
              title: 'Update project budget with approved amounts',
              estimatedTime: '30min',
              context: '@computer',
              priority: 'MEDIUM',
              reasoning: 'Financial tracking should be updated promptly'
            }
          ]
        },
        tokensUsed: 356,
        processingTime: 1420,
        cost: 0.0071,
        organizationId: organization.id
      }
    }),

    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[0].id,
        modelId: aiModels[0].id,
        status: AIExecutionStatus.FAILED,
        input: {
          email_content: ''
        },
        output: null,
        error: 'Input validation failed: email_content cannot be empty',
        tokensUsed: 0,
        processingTime: 45,
        cost: 0,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiExecutions.length} AI executions`);

  console.log('🔮 Creating AI Predictions...');
  
  const aiPredictions = await Promise.all([
    prisma.aIPrediction.create({
      data: {
        entityType: 'deal',
        entityId: leads[0].id, // Using a lead as deal proxy
        predictionType: 'close_probability',
        prediction: {
          probability: 0.75,
          confidence: 0.85,
          factors: {
            positive: ['Strong engagement', 'Budget confirmed', 'Decision maker involved'],
            negative: ['Competing priorities', 'Long sales cycle']
          },
          suggestedActions: ['Schedule technical deep dive', 'Prepare ROI analysis']
        },
        confidence: 0.85,
        modelId: aiModels[0].id,
        validUntil: new Date('2024-08-15'),
        organizationId: organization.id
      }
    }),

    prisma.aIPrediction.create({
      data: {
        entityType: 'task',
        entityId: tasks[0].id,
        predictionType: 'completion_time',
        prediction: {
          estimatedHours: 8.5,
          confidence: 0.72,
          range: { min: 6, max: 12 },
          factors: ['Task complexity', 'Developer experience', 'Similar task history']
        },
        confidence: 0.72,
        modelId: aiModels[0].id,
        validUntil: new Date('2024-07-25'),
        organizationId: organization.id
      }
    }),

    prisma.aIPrediction.create({
      data: {
        entityType: 'project',
        entityId: tasks[0].projectId || 'mock-project-id',
        predictionType: 'deadline_risk',
        prediction: {
          riskLevel: 'medium',
          delayProbability: 0.35,
          estimatedDelayDays: 3,
          criticalFactors: ['Resource constraints', 'Scope changes'],
          mitigation: ['Add buffer time', 'Clarify requirements']
        },
        confidence: 0.68,
        modelId: aiModels[0].id,
        validUntil: new Date('2024-08-01'),
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiPredictions.length} AI predictions`);

  console.log('📊 Creating AI Usage Stats...');
  
  const aiUsageStats = await Promise.all([
    prisma.aIUsageStats.create({
      data: {
        userId: primaryUser.id,
        modelId: aiModels[0].id,
        date: new Date('2024-07-15'),
        requestCount: 45,
        tokensUsed: 12500,
        totalCost: 0.25,
        averageLatency: 1320,
        errorCount: 2,
        usageByHour: {
          '09': 5, '10': 8, '11': 12, '12': 3, '13': 4,
          '14': 7, '15': 9, '16': 6, '17': 1
        },
        usageByType: {
          'email_analysis': 20,
          'task_suggestions': 15,
          'risk_assessment': 8,
          'meeting_summary': 2
        },
        organizationId: organization.id
      }
    }),

    prisma.aIUsageStats.create({
      data: {
        userId: users.length > 1 ? users[1].id : primaryUser.id,
        modelId: aiModels[0].id,
        date: new Date('2024-07-16'),
        requestCount: 32,
        tokensUsed: 8900,
        totalCost: 0.18,
        averageLatency: 1450,
        errorCount: 0,
        usageByHour: {
          '08': 3, '09': 6, '10': 5, '11': 8, '12': 2,
          '13': 3, '14': 4, '15': 5, '16': 4
        },
        usageByType: {
          'email_analysis': 15,
          'task_suggestions': 10,
          'project_analysis': 7
        },
        organizationId: organization.id
      }
    }),

    prisma.aIUsageStats.create({
      data: {
        userId: primaryUser.id,
        modelId: aiModels.length > 1 ? aiModels[1].id : aiModels[0].id,
        date: new Date('2024-07-17'),
        requestCount: 28,
        tokensUsed: 6200,
        totalCost: 0.062,
        averageLatency: 980,
        errorCount: 1,
        usageByHour: {
          '09': 4, '10': 5, '11': 6, '12': 2, '13': 3,
          '14': 4, '15': 3, '16': 2
        },
        usageByType: {
          'quick_analysis': 20,
          'classification': 8
        },
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiUsageStats.length} AI usage stats`);

  console.log('📝 Creating AI Prompt Templates...');
  
  const aiPromptTemplates = await Promise.all([
    prisma.aIPromptTemplate.create({
      data: {
        name: 'Email Priority Classifier',
        slug: 'email-priority-classifier',
        description: 'Classify email priority based on content, sender, and context',
        prompt: `You are an email priority classification system. Analyze the following email and classify its priority.

From: {{sender_email}}
Subject: {{subject}}
Content: {{content}}
Sender Company: {{sender_company}}
Previous Interactions: {{interaction_count}}

Classify the priority as one of: LOW, MEDIUM, HIGH, URGENT

Consider:
1. Keywords indicating urgency
2. Sender importance (VIP, customer, internal)
3. Business impact
4. Time sensitivity
5. Required actions

Output format:
{
  "priority": "HIGH",
  "reasoning": "Brief explanation",
  "confidence": 0.85,
  "factors": ["factor1", "factor2"],
  "suggested_response_time": "2 hours"
}`,
        variables: {
          sender_email: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          content: { type: 'string', required: true },
          sender_company: { type: 'string', required: false },
          interaction_count: { type: 'number', required: false, default: 0 }
        },
        outputSchema: {
          type: 'object',
          properties: {
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            reasoning: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            factors: { type: 'array', items: { type: 'string' } },
            suggested_response_time: { type: 'string' }
          },
          required: ['priority', 'reasoning', 'confidence']
        },
        tags: ['email', 'classification', 'priority'],
        category: 'email_processing',
        status: AITemplateStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIPromptTemplate.create({
      data: {
        name: 'GTD Task Processor',
        slug: 'gtd-task-processor',
        description: 'Process items according to GTD methodology',
        prompt: `You are a GTD (Getting Things Done) task processing assistant. Analyze the following item and determine the appropriate GTD action.

Item: {{item_description}}
Source: {{item_source}}
Context: {{current_context}}
User's Current Projects: {{active_projects}}

Determine the GTD decision:
1. DO - If actionable and takes less than 2 minutes
2. DEFER - If actionable but takes more than 2 minutes
3. DELEGATE - If actionable but better done by someone else
4. PROJECT - If it requires multiple steps
5. REFERENCE - If it's useful information to store
6. SOMEDAY/MAYBE - If interesting but not committed
7. TRASH - If not needed

Provide:
- Decision with reasoning
- If DEFER: suggested date and context (@computer, @calls, etc.)
- If DELEGATE: suggested person/role
- If PROJECT: initial next actions
- Priority level
- Estimated time`,
        variables: {
          item_description: { type: 'string', required: true },
          item_source: { type: 'string', required: true },
          current_context: { type: 'string', required: false },
          active_projects: { type: 'array', required: false }
        },
        outputSchema: {
          type: 'object',
          properties: {
            decision: { type: 'string' },
            reasoning: { type: 'string' },
            priority: { type: 'string' },
            estimated_time: { type: 'string' },
            context: { type: 'string' },
            suggested_date: { type: 'string' },
            delegate_to: { type: 'string' },
            next_actions: { type: 'array' }
          }
        },
        tags: ['gtd', 'productivity', 'task-management'],
        category: 'productivity',
        status: AITemplateStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIPromptTemplate.create({
      data: {
        name: 'Sales Opportunity Scorer',
        slug: 'sales-opportunity-scorer',
        description: 'Score sales opportunities based on multiple factors',
        prompt: `Analyze the following sales opportunity and provide a comprehensive scoring:

Company: {{company_name}}
Industry: {{industry}}
Company Size: {{company_size}}
Contact Role: {{contact_role}}
Budget: {{budget_range}}
Timeline: {{timeline}}
Current Solution: {{current_solution}}
Pain Points: {{pain_points}}
Engagement Level: {{engagement_metrics}}

Provide a detailed opportunity score (0-100) based on:
1. Budget fit (0-25 points)
2. Authority/Decision maker access (0-25 points)
3. Need/Pain point severity (0-25 points)
4. Timeline alignment (0-25 points)

Also identify:
- Key strengths of this opportunity
- Main risks or obstacles
- Recommended next actions
- Optimal pricing strategy`,
        variables: {
          company_name: { type: 'string', required: true },
          industry: { type: 'string', required: true },
          company_size: { type: 'string', required: true },
          contact_role: { type: 'string', required: true },
          budget_range: { type: 'string', required: true },
          timeline: { type: 'string', required: true },
          current_solution: { type: 'string', required: false },
          pain_points: { type: 'array', required: true },
          engagement_metrics: { type: 'object', required: false }
        },
        outputSchema: {
          type: 'object',
          properties: {
            total_score: { type: 'number' },
            budget_score: { type: 'number' },
            authority_score: { type: 'number' },
            need_score: { type: 'number' },
            timeline_score: { type: 'number' },
            strengths: { type: 'array' },
            risks: { type: 'array' },
            next_actions: { type: 'array' },
            pricing_strategy: { type: 'string' }
          }
        },
        tags: ['sales', 'scoring', 'opportunity'],
        category: 'sales',
        status: AITemplateStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIPromptTemplate.create({
      data: {
        name: 'Code Review Assistant',
        slug: 'code-review-assistant',
        description: 'Provide code review feedback and suggestions',
        prompt: `Review the following code changes and provide constructive feedback:

File: {{file_path}}
Language: {{language}}
Change Type: {{change_type}}
Code Before:
{{code_before}}

Code After:
{{code_after}}

Context: {{pr_description}}

Provide feedback on:
1. Code quality and readability
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Best practices adherence
6. Suggestions for improvement

Be constructive and specific with examples where applicable.`,
        variables: {
          file_path: { type: 'string', required: true },
          language: { type: 'string', required: true },
          change_type: { type: 'string', required: true },
          code_before: { type: 'string', required: true },
          code_after: { type: 'string', required: true },
          pr_description: { type: 'string', required: false }
        },
        outputSchema: {
          type: 'object',
          properties: {
            overall_quality: { type: 'string' },
            issues: { type: 'array' },
            suggestions: { type: 'array' },
            security_concerns: { type: 'array' },
            performance_notes: { type: 'array' },
            approval_recommendation: { type: 'string' }
          }
        },
        tags: ['development', 'code-review', 'quality'],
        category: 'development',
        status: AITemplateStatus.DRAFT,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiPromptTemplates.length} AI prompt templates`);

  console.log('📚 Creating AI Knowledge Bases...');
  
  const aiKnowledgeBases = await Promise.all([
    prisma.aIKnowledgeBase.create({
      data: {
        name: 'CRM-GTD Product Documentation',
        slug: 'crm-gtd-docs',
        description: 'Complete product documentation including features, API references, and user guides',
        config: {
          chunkSize: 1000,
          chunkOverlap: 200,
          embeddingModel: 'text-embedding-ada-002',
          indexingStrategy: 'hierarchical',
          updateFrequency: 'daily'
        },
        metadata: {
          version: '2.1.0',
          lastUpdated: '2024-07-15',
          languages: ['en', 'es', 'fr'],
          categories: ['features', 'api', 'tutorials', 'troubleshooting']
        },
        status: AIKnowledgeStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeBase.create({
      data: {
        name: 'Customer Support Knowledge Base',
        slug: 'customer-support-kb',
        description: 'Common issues, solutions, and support procedures for customer service team',
        config: {
          chunkSize: 500,
          chunkOverlap: 100,
          embeddingModel: 'text-embedding-ada-002',
          indexingStrategy: 'semantic',
          updateFrequency: 'realtime'
        },
        metadata: {
          totalArticles: 234,
          categories: ['technical', 'billing', 'features', 'integrations'],
          popularTopics: ['login-issues', 'api-limits', 'data-export']
        },
        status: AIKnowledgeStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeBase.create({
      data: {
        name: 'Sales Playbook',
        slug: 'sales-playbook',
        description: 'Sales strategies, objection handling, competitor analysis, and pricing guides',
        config: {
          chunkSize: 800,
          chunkOverlap: 150,
          embeddingModel: 'text-embedding-ada-002',
          indexingStrategy: 'keyword-enhanced',
          accessControl: {
            teams: ['sales', 'management'],
            minRole: 'sales_rep'
          }
        },
        metadata: {
          playbooks: ['enterprise', 'smb', 'startup'],
          competitors: ['Salesforce', 'HubSpot', 'Pipedrive'],
          lastTrainingDate: '2024-07-01'
        },
        status: AIKnowledgeStatus.ACTIVE,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiKnowledgeBases.length} AI knowledge bases`);

  console.log('📄 Creating AI Knowledge Documents...');
  
  const aiKnowledgeDocuments = await Promise.all([
    prisma.aIKnowledgeDocument.create({
      data: {
        knowledgeBaseId: aiKnowledgeBases[0].id,
        title: 'Getting Started with CRM-GTD Smart',
        content: `
# Getting Started with CRM-GTD Smart

## Overview
CRM-GTD Smart combines powerful CRM capabilities with the proven Getting Things Done (GTD) methodology to help you manage customer relationships and personal productivity in one integrated system.

## Key Features
1. **Smart Mailboxes** - AI-powered email management with automatic categorization
2. **GTD Integration** - Full implementation of David Allen's GTD methodology
3. **Voice TTS** - Text-to-speech for hands-free operation
4. **AI Assistant** - Intelligent suggestions and automation

## Quick Start Guide
1. Set up your organization and invite team members
2. Configure email integration and rules
3. Import your contacts and companies
4. Create your first project and tasks
5. Set up your GTD contexts and review schedule

## Best Practices
- Process your inbox to zero daily
- Use contexts (@computer, @calls) for efficient task batching
- Schedule weekly reviews every Friday afternoon
- Leverage AI suggestions for task prioritization
        `,
        metadata: {
          category: 'getting-started',
          difficulty: 'beginner',
          readTime: '5 minutes',
          relatedDocs: ['gtd-basics', 'email-setup', 'ai-configuration']
        },
        chunks: [
          {
            text: 'CRM-GTD Smart combines powerful CRM capabilities with the proven Getting Things Done (GTD) methodology',
            embedding: new Array(1536).fill(0).map(() => Math.random()),
            metadata: { section: 'overview' }
          }
        ],
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        status: AIDocumentStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeDocument.create({
      data: {
        knowledgeBaseId: aiKnowledgeBases[1].id,
        title: 'Troubleshooting Login Issues',
        content: `
# Troubleshooting Login Issues

## Common Login Problems

### 1. Forgotten Password
- Click "Forgot Password" on the login page
- Enter your registered email address
- Check your email for reset instructions
- Create a new password (min 8 characters, 1 number, 1 special character)

### 2. Account Locked
- After 5 failed attempts, accounts are locked for 30 minutes
- Contact support for immediate unlock
- Check CAPS LOCK key

### 3. Two-Factor Authentication Issues
- Ensure your device time is synchronized
- Try using backup codes
- Contact admin to reset 2FA

### 4. Browser Issues
- Clear browser cache and cookies
- Try incognito/private mode
- Disable browser extensions
- Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Still Having Issues?
Contact support@crm-gtd.com with:
- Your email address
- Error message (screenshot helpful)
- Browser and OS version
        `,
        metadata: {
          category: 'troubleshooting',
          keywords: ['login', 'password', 'authentication', '2fa'],
          lastUpdated: '2024-07-10',
          views: 1234
        },
        chunks: [
          {
            text: 'After 5 failed attempts, accounts are locked for 30 minutes',
            embedding: new Array(1536).fill(0).map(() => Math.random()),
            metadata: { section: 'account-locked' }
          }
        ],
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        status: AIDocumentStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeDocument.create({
      data: {
        knowledgeBaseId: aiKnowledgeBases[2].id,
        title: 'Enterprise Sales Playbook - Discovery Questions',
        content: `
# Enterprise Sales Discovery Questions

## Business Understanding
1. What are your top 3 business priorities this year?
2. How do you currently manage customer relationships?
3. What's working well? What's not?
4. What would success look like 12 months from now?

## Pain Point Identification
1. Where are you losing the most time/money?
2. What keeps you up at night regarding customer management?
3. How much time do teams spend on administrative tasks?
4. What's the impact of missing customer communications?

## Decision Process
1. Who else needs to be involved in this decision?
2. What's your typical evaluation process?
3. What's your timeline for making a change?
4. What's your budget range for this initiative?

## Competition
1. Have you evaluated other solutions?
2. What did you like/dislike about them?
3. What would make you choose us over alternatives?

## Success Metrics
1. How do you measure success today?
2. What KPIs matter most to your team?
3. What ROI would justify this investment?
        `,
        metadata: {
          category: 'sales-playbook',
          dealStage: 'discovery',
          effectiveness: 0.85,
          usage: 'high'
        },
        chunks: [],
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        status: AIDocumentStatus.ACTIVE,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeDocument.create({
      data: {
        knowledgeBaseId: aiKnowledgeBases[0].id,
        title: 'API Rate Limits and Best Practices',
        content: `
# API Rate Limits and Best Practices

## Rate Limits
- **Standard Plan**: 1,000 requests/hour
- **Professional Plan**: 5,000 requests/hour  
- **Enterprise Plan**: Unlimited (fair use)

## Best Practices
1. **Use Bulk Endpoints**: Instead of multiple single requests, use bulk operations
2. **Implement Caching**: Cache frequently accessed data
3. **Respect 429 Status**: Back off when rate limited
4. **Use Webhooks**: Instead of polling for changes

## Rate Limit Headers
- X-RateLimit-Limit: Your limit
- X-RateLimit-Remaining: Requests remaining
- X-RateLimit-Reset: When limit resets

## Example: Efficient Contact Sync
\`\`\`javascript
// Bad: Individual requests
for (const contact of contacts) {
  await api.createContact(contact); // 1000 requests
}

// Good: Bulk operation
await api.createContacts(contacts); // 1 request
\`\`\`
        `,
        metadata: {
          category: 'api-documentation',
          technical: true,
          codeExamples: true
        },
        chunks: [],
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        status: AIDocumentStatus.ACTIVE,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiKnowledgeDocuments.length} AI knowledge documents`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    emailRules.length + 
    emailTemplates.length + 
    emailLogs.length + 
    emailAnalysis.length + 
    autoReplies.length +
    aiRules.length +
    aiExecutions.length +
    aiPredictions.length +
    aiUsageStats.length +
    aiPromptTemplates.length +
    aiKnowledgeBases.length +
    aiKnowledgeDocuments.length;

  console.log(`\n🎉 Faza 3 completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   Email System: ${emailRules.length + emailTemplates.length + emailLogs.length + emailAnalysis.length + autoReplies.length} records`);
  console.log(`   AI Advanced: ${aiRules.length + aiExecutions.length + aiPredictions.length + aiUsageStats.length + aiPromptTemplates.length + aiKnowledgeBases.length + aiKnowledgeDocuments.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n✅ Ready for Faza 4: Workflow & Analytics`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Faza 3 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });