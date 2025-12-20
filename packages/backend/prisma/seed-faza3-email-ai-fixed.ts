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

  const aiModels = await prisma.aIModel.findMany();

  const messages = await prisma.message.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const leads = await prisma.lead.findMany({
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
        senderDomain: 'techcorp.com',
        subjectContains: 'enterprise',
        assignCategory: EmailCategory.VIP,
        createTask: true,
        priority: 1,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Invoice Processing',
        description: 'Automatically process and categorize incoming invoices',
        subjectPattern: '(invoice|bill|payment)',
        assignCategory: EmailCategory.INVOICES,
        skipAIAnalysis: false,
        createTask: true,
        priority: 2,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Spam Filter',
        description: 'Filter out spam and unwanted marketing emails',
        bodyContains: 'unsubscribe',
        assignCategory: EmailCategory.SPAM,
        autoArchive: true,
        priority: 10,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.emailRule.create({
      data: {
        name: 'Newsletter Archive',
        description: 'Archive newsletters and non-critical communications',
        subjectContains: 'newsletter',
        senderDomain: 'noreply.com',
        assignCategory: EmailCategory.ARCHIVE,
        autoArchive: true,
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
        description: 'Welcome email for new customers',
        subject: 'Welcome to CRM-GTD Smart, {{firstName}}!',
        htmlTemplate: `
<h2>Welcome aboard, {{firstName}}!</h2>
<p>Thank you for choosing CRM-GTD Smart as your productivity solution.</p>
<h3>Getting Started:</h3>
<ul>
  <li><a href="{{loginUrl}}">Login to your account</a></li>
  <li><a href="{{docsUrl}}">Read our Getting Started Guide</a></li>
</ul>
<p>Your {{planName}} plan is now active.</p>
<p>Best regards,<br>The CRM-GTD Team</p>
        `,
        textTemplate: `Welcome aboard, {{firstName}}! Thank you for choosing CRM-GTD Smart. Your {{planName}} plan is now active.`,
        variables: ['firstName', 'loginUrl', 'docsUrl', 'planName'],
        category: 'onboarding',
        tags: ['welcome', 'customer'],
        isActive: true,
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.emailTemplate.create({
      data: {
        name: 'Support Ticket Auto-Response',
        description: 'Automatic response for support tickets',
        subject: 'Re: {{originalSubject}} [Ticket #{{ticketNumber}}]',
        htmlTemplate: `
<p>Hello {{customerName}},</p>
<p>Thank you for contacting CRM-GTD Support. We've received your request and created ticket #{{ticketNumber}}.</p>
<p><strong>Priority Level:</strong> {{priority}}<br>
<strong>Expected Response Time:</strong> {{responseTime}}</p>
<p>Best regards,<br>CRM-GTD Support Team</p>
        `,
        textTemplate: `Hello {{customerName}}, we've received your request (ticket #{{ticketNumber}}). Expected response: {{responseTime}}.`,
        variables: ['customerName', 'originalSubject', 'ticketNumber', 'priority', 'responseTime'],
        category: 'support',
        tags: ['auto-response', 'ticket'],
        isActive: true,
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.emailTemplate.create({
      data: {
        name: 'Weekly GTD Review Reminder',
        description: 'Reminder for weekly GTD review',
        subject: '📅 Time for your Weekly GTD Review, {{firstName}}',
        htmlTemplate: `
<p>Hi {{firstName}},</p>
<p>It's time for your weekly GTD review!</p>
<h3>Your GTD Stats This Week:</h3>
<ul>
  <li>✅ Tasks Completed: {{tasksCompleted}}</li>
  <li>📥 New Items in Inbox: {{inboxItems}}</li>
</ul>
<p><a href="{{reviewUrl}}">Start Weekly Review</a></p>
        `,
        variables: ['firstName', 'tasksCompleted', 'inboxItems', 'reviewUrl'],
        category: 'productivity',
        tags: ['gtd', 'weekly-review', 'reminder'],
        isActive: true,
        organizationId: organization.id,
        createdById: primaryUser.id
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
        toAddresses: ['john.demo@example.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Welcome to CRM-GTD Smart!',
        success: true,
        templateId: emailTemplates[0].id,
        templateData: {
          firstName: 'John',
          loginUrl: 'https://crm-gtd.com/login',
          docsUrl: 'https://docs.crm-gtd.com',
          planName: 'Professional'
        },
        delivered: true,
        opened: true,
        clicked: true,
        sentAt: new Date('2024-07-10T10:30:00Z'),
        deliveredAt: new Date('2024-07-10T10:30:15Z'),
        openedAt: new Date('2024-07-10T14:22:00Z'),
        clickedAt: new Date('2024-07-10T14:23:30Z'),
        organizationId: organization.id,
        sentByUserId: primaryUser.id
      }
    }),

    prisma.emailLog.create({
      data: {
        messageId: 'msg_' + Date.now() + '_2',
        provider: EmailProvider.SMTP,
        toAddresses: ['support@techcorp.com'],
        ccAddresses: ['manager@techcorp.com'],
        bccAddresses: [],
        subject: 'Re: Login issues [Ticket #12345]',
        success: true,
        templateId: emailTemplates[1].id,
        templateData: {
          customerName: 'Michael Chen',
          originalSubject: 'Login issues',
          ticketNumber: '12345',
          priority: 'High',
          responseTime: '2 hours'
        },
        delivered: true,
        sentAt: new Date('2024-07-18T09:15:00Z'),
        deliveredAt: new Date('2024-07-18T09:15:08Z'),
        organizationId: organization.id,
        sentByUserId: primaryUser.id
      }
    }),

    prisma.emailLog.create({
      data: {
        messageId: 'msg_' + Date.now() + '_3',
        provider: EmailProvider.AWS_SES,
        toAddresses: ['customer@example.com'],
        ccAddresses: [],
        bccAddresses: [],
        subject: 'Failed delivery attempt',
        success: false,
        error: 'Invalid email address format',
        delivered: false,
        bounced: true,
        sentAt: new Date('2024-07-18T09:15:00Z'),
        bouncedAt: new Date('2024-07-18T09:15:05Z'),
        organizationId: organization.id,
        sentByUserId: primaryUser.id
      }
    })
  ]);

  console.log(`✅ Created ${emailLogs.length} email logs`);

  console.log('📊 Creating Email Analysis...');
  
  const emailAnalysis = await Promise.all([
    prisma.emailAnalysis.create({
      data: {
        emailFrom: 'customer@techcorp.com',
        emailSubject: 'Urgent: Enterprise implementation needed',
        emailReceived: new Date('2024-07-20T10:00:00Z'),
        categories: ['urgent', 'enterprise'],
        confidenceScore: 0.95,
        summary: 'Customer requesting enterprise demo and pricing information',
        fullAnalysis: 'High urgency email from enterprise customer requiring immediate attention',
        processingTime: 1200,
        tokenCount: 245,
        organizationId: organization.id
      }
    }),

    prisma.emailAnalysis.create({
      data: {
        emailFrom: 'newsletter@company.com',
        emailSubject: 'Weekly Newsletter - Product Updates',
        emailReceived: new Date('2024-07-21T08:00:00Z'),
        categories: ['newsletter', 'marketing'],
        confidenceScore: 0.78,
        summary: 'Marketing newsletter with product updates',
        processingTime: 800,
        tokenCount: 156,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${emailAnalysis.length} email analyses`);

  console.log('🔄 Creating Auto Replies...');
  
  const autoReplies = await Promise.all([
    prisma.autoReply.create({
      data: {
        name: 'Out of Office - Vacation',
        subject: 'Out of Office: {{originalSubject}}',
        content: `Thank you for your email. I am currently out of the office on vacation with limited access to email.

For urgent matters, please contact support@crm-gtd.com

I will respond to your email upon my return.

Best regards`,
        triggerConditions: {
          dateRange: {
            start: '2024-08-01',
            end: '2024-08-15'
          },
          excludeDomains: ['crm-gtd.com']
        },
        status: AutoReplyStatus.SCHEDULED,
        sendOnce: true,
        activeFrom: new Date('2024-08-01'),
        activeTo: new Date('2024-08-15'),
        organizationId: organization.id
      }
    }),

    prisma.autoReply.create({
      data: {
        name: 'Support Hours Auto-Reply',
        subject: 'Re: {{originalSubject}} - Support Hours Information',
        content: `Hello,

Thank you for contacting CRM-GTD Support. We've received your message outside of our regular support hours.

Our support hours are:
- Monday to Friday: 9:00 AM - 6:00 PM EST
- Saturday: 10:00 AM - 2:00 PM EST

Your request has been logged and will be addressed during our next business hours.

CRM-GTD Support Team`,
        triggerConditions: {
          timeRange: {
            outsideHours: true,
            timezone: 'America/New_York'
          },
          triggerEmails: ['support@crm-gtd.com']
        },
        status: AutoReplyStatus.ACTIVE,
        sendOnce: false,
        organizationId: organization.id
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
        category: 'MESSAGE_PROCESSING',
        status: AIRuleStatus.ACTIVE,
        priority: 1,
        triggerType: AITriggerType.MESSAGE_RECEIVED,
        triggerConditions: {
          messageTypes: ['email'],
          excludeInternal: false,
          minLength: 50
        },
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        actions: {
          updateMessage: true,
          createTask: 'ifUrgent',
          notify: 'ifHighPriority',
          categorize: true
        },
        maxExecutionsPerHour: 100,
        maxExecutionsPerDay: 1000,
        organizationId: organization.id
      }
    }),

    prisma.aIRule.create({
      data: {
        name: 'Project Risk Assessment',
        description: 'Automatically assess project risks based on task delays and dependencies',
        category: 'TASK_ANALYSIS',
        status: AIRuleStatus.ACTIVE,
        priority: 2,
        triggerType: AITriggerType.SCHEDULED,
        triggerConditions: {
          schedule: '0 9 * * 1', // Every Monday at 9 AM
          projectStatuses: ['IN_PROGRESS', 'AT_RISK']
        },
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        actions: {
          createReport: true,
          updateProject: true,
          notifyStakeholders: 'ifHighRisk'
        },
        maxExecutionsPerHour: 24,
        maxExecutionsPerDay: 50,
        organizationId: organization.id
      }
    }),

    prisma.aIRule.create({
      data: {
        name: 'Smart Task Suggestions',
        description: 'Generate next action suggestions based on completed tasks and patterns',
        category: 'CONTENT_GENERATION',
        status: AIRuleStatus.ACTIVE,
        priority: 3,
        triggerType: AITriggerType.TASK_UPDATED,
        triggerConditions: {
          taskTypes: ['all'],
          statusChanges: ['completed']
        },
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        actions: {
          displaySuggestions: true,
          createDraftTasks: true,
          trackAcceptance: true
        },
        maxExecutionsPerHour: 50,
        maxExecutionsPerDay: 200,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiRules.length} AI rules`);

  console.log('⚡ Creating AI Executions...');
  
  const aiExecutions = await Promise.all([
    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[0].id,
        providerId: aiProviders.length > 0 ? aiProviders[0].id : null,
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        inputData: {
          email_content: 'Urgent: We need the enterprise implementation completed by end of month. This is critical for our Q3 launch.'
        },
        promptSent: 'Analyze the following email and provide sentiment analysis...',
        responseReceived: '{"sentiment": "negative", "urgency": "high", "priority": "HIGH"}',
        parsedOutput: {
          sentiment: 'negative',
          sentimentScore: 0.25,
          urgency: 'high',
          urgencyScore: 0.95,
          priority: 'HIGH'
        },
        status: AIExecutionStatus.SUCCESS,
        executionTime: 1250,
        tokensUsed: 245,
        cost: 0.0049,
        actionsExecuted: {
          messageUpdated: true,
          taskCreated: true
        },
        organizationId: organization.id
      }
    }),

    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[1].id,
        providerId: aiProviders.length > 0 ? aiProviders[0].id : null,
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        inputData: {
          project_name: 'CRM Integration Project',
          delayed_tasks_count: 3
        },
        promptSent: 'Analyze project risk based on the following data...',
        responseReceived: '{"riskLevel": "high", "riskScore": 0.75}',
        parsedOutput: {
          riskLevel: 'high',
          riskScore: 0.75,
          recommendations: ['Allocate additional resources']
        },
        status: AIExecutionStatus.SUCCESS,
        executionTime: 1890,
        tokensUsed: 412,
        cost: 0.0082,
        organizationId: organization.id
      }
    }),

    prisma.aIExecution.create({
      data: {
        ruleId: aiRules[0].id,
        providerId: aiProviders.length > 0 ? aiProviders[0].id : null,
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        inputData: {
          email_content: ''
        },
        promptSent: 'Analyze the following email...',
        status: AIExecutionStatus.FAILED,
        executionTime: 45,
        tokensUsed: 0,
        cost: 0,
        errorMessage: 'Input validation failed: email_content cannot be empty',
        errorCode: 'VALIDATION_ERROR',
        retryCount: 0,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiExecutions.length} AI executions`);

  console.log('🔮 Creating AI Predictions...');
  
  const aiPredictions = await Promise.all([
    prisma.aIPrediction.create({
      data: {
        itemId: leads.length > 0 ? leads[0].id : 'mock-lead-id',
        itemType: 'deal',
        predictionType: 'close_probability',
        predictedValue: {
          probability: 0.75,
          confidence: 0.85,
          factors: {
            positive: ['Strong engagement', 'Budget confirmed'],
            negative: ['Competing priorities']
          }
        },
        confidenceScore: 0.85,
        factors: {
          engagement: 'high',
          budget: 'confirmed',
          timeline: 'Q3'
        },
        recommendations: {
          actions: ['Schedule technical demo', 'Prepare ROI analysis']
        },
        expiresAt: new Date('2024-08-15')
      }
    }),

    prisma.aIPrediction.create({
      data: {
        itemId: tasks.length > 0 ? tasks[0].id : 'mock-task-id',
        itemType: 'task',
        predictionType: 'completion_time',
        predictedValue: {
          estimatedHours: 8.5,
          confidence: 0.72,
          range: { min: 6, max: 12 }
        },
        confidenceScore: 0.72,
        factors: {
          complexity: 'medium',
          experience: 'high'
        },
        expiresAt: new Date('2024-07-25')
      }
    }),

    prisma.aIPrediction.create({
      data: {
        itemId: 'project-123',
        itemType: 'project',
        predictionType: 'deadline_risk',
        predictedValue: {
          riskLevel: 'medium',
          delayProbability: 0.35,
          estimatedDelayDays: 3
        },
        confidenceScore: 0.68,
        factors: {
          resourceConstraints: true,
          scopeChanges: false
        },
        recommendations: {
          mitigation: ['Add buffer time', 'Clarify requirements']
        },
        expiresAt: new Date('2024-08-01')
      }
    })
  ]);

  console.log(`✅ Created ${aiPredictions.length} AI predictions`);

  console.log('📊 Creating AI Usage Stats...');
  
  const aiUsageStats = await Promise.all([
    prisma.aIUsageStats.create({
      data: {
        date: new Date('2024-07-15'),
        totalExecutions: 45,
        successfulExecutions: 43,
        failedExecutions: 2,
        totalTokensUsed: 12500,
        totalCost: 0.25,
        providerStats: {
          'openai': { 
            executions: 40, 
            tokens: 11000, 
            cost: 0.22 
          },
          'anthropic': { 
            executions: 5, 
            tokens: 1500, 
            cost: 0.03 
          }
        },
        modelStats: {
          'gpt-4': { 
            executions: 30, 
            tokens: 8000, 
            cost: 0.16 
          },
          'gpt-3.5-turbo': { 
            executions: 10, 
            tokens: 3000, 
            cost: 0.06 
          }
        },
        organizationId: organization.id
      }
    }),

    prisma.aIUsageStats.create({
      data: {
        date: new Date('2024-07-16'),
        totalExecutions: 32,
        successfulExecutions: 32,
        failedExecutions: 0,
        totalTokensUsed: 8900,
        totalCost: 0.18,
        providerStats: {
          'openai': { 
            executions: 32, 
            tokens: 8900, 
            cost: 0.18 
          }
        },
        modelStats: {
          'gpt-4': { 
            executions: 20, 
            tokens: 5500, 
            cost: 0.11 
          },
          'gpt-3.5-turbo': { 
            executions: 12, 
            tokens: 3400, 
            cost: 0.07 
          }
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
        description: 'Classify email priority based on content, sender, and context',
        category: 'CLASSIFICATION',
        version: 1,
        status: AITemplateStatus.ACTIVE,
        systemPrompt: 'You are an email priority classification system.',
        userPromptTemplate: `Analyze the following email and classify its priority:

From: {{sender_email}}
Subject: {{subject}}
Content: {{content}}

Classify as: LOW, MEDIUM, HIGH, URGENT`,
        variables: {
          sender_email: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          content: { type: 'string', required: true }
        },
        outputSchema: {
          type: 'object',
          properties: {
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            reasoning: { type: 'string' },
            confidence: { type: 'number' }
          }
        },
        modelId: aiModels.length > 0 ? aiModels[0].id : null,
        organizationId: organization.id
      }
    }),

    prisma.aIPromptTemplate.create({
      data: {
        name: 'GTD Task Processor',
        description: 'Process items according to GTD methodology',
        category: 'ANALYSIS',
        version: 1,
        status: AITemplateStatus.ACTIVE,
        systemPrompt: 'You are a GTD (Getting Things Done) task processing assistant.',
        userPromptTemplate: `Analyze the following item and determine the appropriate GTD action:

Item: {{item_description}}
Source: {{item_source}}

Determine the GTD decision: DO, DEFER, DELEGATE, PROJECT, REFERENCE, SOMEDAY/MAYBE, or TRASH`,
        variables: {
          item_description: { type: 'string', required: true },
          item_source: { type: 'string', required: true }
        },
        outputSchema: {
          type: 'object',
          properties: {
            decision: { type: 'string' },
            reasoning: { type: 'string' },
            priority: { type: 'string' },
            estimated_time: { type: 'string' }
          }
        },
        organizationId: organization.id
      }
    }),

    prisma.aIPromptTemplate.create({
      data: {
        name: 'Sales Opportunity Scorer',
        description: 'Score sales opportunities based on multiple factors',
        category: 'ANALYSIS',
        version: 1,
        status: AITemplateStatus.ACTIVE,
        userPromptTemplate: `Analyze the following sales opportunity and provide a score (0-100):

Company: {{company_name}}
Industry: {{industry}}
Budget: {{budget_range}}
Timeline: {{timeline}}

Provide detailed scoring based on budget fit, authority access, need severity, and timeline alignment.`,
        variables: {
          company_name: { type: 'string', required: true },
          industry: { type: 'string', required: true },
          budget_range: { type: 'string', required: true },
          timeline: { type: 'string', required: true }
        },
        outputSchema: {
          type: 'object',
          properties: {
            total_score: { type: 'number' },
            budget_score: { type: 'number' },
            need_score: { type: 'number' },
            timeline_score: { type: 'number' }
          }
        },
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
        description: 'Complete product documentation including features, API references, and user guides',
        status: AIKnowledgeStatus.ACTIVE,
        embeddingModel: 'text-embedding-ada-002',
        chunkSize: 1000,
        chunkOverlap: 200,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeBase.create({
      data: {
        name: 'Customer Support Knowledge Base',
        description: 'Common issues, solutions, and support procedures for customer service team',
        status: AIKnowledgeStatus.ACTIVE,
        embeddingModel: 'text-embedding-ada-002',
        chunkSize: 500,
        chunkOverlap: 100,
        organizationId: organization.id
      }
    }),

    prisma.aIKnowledgeBase.create({
      data: {
        name: 'Sales Playbook',
        description: 'Sales strategies, objection handling, competitor analysis, and pricing guides',
        status: AIKnowledgeStatus.ACTIVE,
        embeddingModel: 'text-embedding-ada-002',
        chunkSize: 800,
        chunkOverlap: 150,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${aiKnowledgeBases.length} AI knowledge bases`);

  console.log('📄 Creating AI Knowledge Documents...');
  
  const aiKnowledgeDocuments = await Promise.all([
    prisma.aIKnowledgeDocument.create({
      data: {
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
          readTime: '5 minutes'
        },
        embedding: '[]', // Empty array as string
        embeddingModel: 'text-embedding-ada-002',
        status: AIDocumentStatus.ACTIVE,
        knowledgeBaseId: aiKnowledgeBases[0].id
      }
    }),

    prisma.aIKnowledgeDocument.create({
      data: {
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
        embedding: '[]',
        embeddingModel: 'text-embedding-ada-002',
        status: AIDocumentStatus.ACTIVE,
        knowledgeBaseId: aiKnowledgeBases[1].id
      }
    }),

    prisma.aIKnowledgeDocument.create({
      data: {
        title: 'Enterprise Sales Discovery Questions',
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

## Success Metrics
1. How do you measure success today?
2. What KPIs matter most to your team?
3. What ROI would justify this investment?
        `,
        metadata: {
          category: 'sales-playbook',
          dealStage: 'discovery',
          effectiveness: 0.85
        },
        embedding: '[]',
        embeddingModel: 'text-embedding-ada-002',
        status: AIDocumentStatus.ACTIVE,
        knowledgeBaseId: aiKnowledgeBases[2].id
      }
    }),

    prisma.aIKnowledgeDocument.create({
      data: {
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
        embedding: '[]',
        embeddingModel: 'text-embedding-ada-002',
        status: AIDocumentStatus.ACTIVE,
        knowledgeBaseId: aiKnowledgeBases[0].id
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