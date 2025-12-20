import { PrismaClient, UserRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      domain: 'demo.crm-gtd.com',
      settings: {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        workingHours: { start: '09:00', end: '17:00' }
      },
      limits: {
        users: 50,
        projects: 100,
        tasks: 1000,
        storage: '1GB'
      }
    }
  });

  console.log(`✅ Organization created: ${organization.name}`);

  // Create multiple users with different roles
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Demo',
        role: UserRole.OWNER,
        organizationId: organization.id,
        emailVerified: true,
        settings: {
          theme: 'light',
          notifications: true,
          defaultView: 'dashboard'
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'sarah.manager@example.com' },
      update: {},
      create: {
        email: 'sarah.manager@example.com',
        passwordHash: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Manager',
        role: UserRole.ADMIN,
        organizationId: organization.id,
        emailVerified: true,
        settings: {
          theme: 'dark',
          notifications: true,
          defaultView: 'projects'
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'mike.developer@example.com' },
      update: {},
      create: {
        email: 'mike.developer@example.com',
        passwordHash: hashedPassword,
        firstName: 'Mike',
        lastName: 'Developer',
        role: UserRole.USER,
        organizationId: organization.id,
        emailVerified: true,
        settings: {
          theme: 'light',
          notifications: false,
          defaultView: 'tasks'
        }
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create subscription
  await prisma.subscription.upsert({
    where: { id: organization.id + '-sub' },
    update: {},
    create: {
      id: organization.id + '-sub',
      organizationId: organization.id,
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.TRIAL,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  // Create comprehensive GTD Contexts
  const contexts = [
    { name: '@computer', description: 'Tasks requiring a computer', color: '#3B82F6', icon: '💻' },
    { name: '@phone', description: 'Phone calls to make', color: '#10B981', icon: '📞' },
    { name: '@errands', description: 'Tasks to do while out', color: '#F59E0B', icon: '🏃' },
    { name: '@home', description: 'Tasks to do at home', color: '#8B5CF6', icon: '🏠' },
    { name: '@office', description: 'Tasks to do at the office', color: '#EF4444', icon: '🏢' },
    { name: '@agenda', description: 'Items for meetings/discussions', color: '#6B7280', icon: '📋' },
    { name: '@waiting', description: 'Waiting for someone else', color: '#F97316', icon: '⏳' },
    { name: '@someday', description: 'Someday/maybe items', color: '#84CC16', icon: '🌅' },
    { name: '@energy-high', description: 'High energy tasks', color: '#DC2626', icon: '⚡' },
    { name: '@energy-low', description: 'Low energy tasks', color: '#059669', icon: '🔋' },
    { name: '@15min', description: 'Quick 15-minute tasks', color: '#7C3AED', icon: '⏱️' },
    { name: '@deep-work', description: 'Deep focus work', color: '#1E40AF', icon: '🧠' }
  ];

  const createdContexts = [];
  for (const contextData of contexts) {
    const context = await prisma.context.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: contextData.name
        }
      },
      update: {},
      create: {
        ...contextData,
        organizationId: organization.id
      }
    });
    createdContexts.push(context);
  }

  console.log(`✅ Created ${createdContexts.length} contexts`);

  // Create Areas of Responsibility
  const areas = await Promise.all([
    prisma.areaOfResponsibility.create({
      data: {
        name: 'Work',
        description: 'Professional responsibilities and career development',
        owner: users[0].id,
        organizationId: organization.id
      }
    }),
    prisma.areaOfResponsibility.create({
      data: {
        name: 'Personal',
        description: 'Personal life, health, and relationships',
        owner: users[0].id,
        organizationId: organization.id
      }
    }),
    prisma.areaOfResponsibility.create({
      data: {
        name: 'Learning',
        description: 'Professional development and learning',
        owner: users[0].id,
        organizationId: organization.id
      }
    }),
    prisma.areaOfResponsibility.create({
      data: {
        name: 'Health & Fitness',
        description: 'Physical and mental health activities',
        owner: users[0].id,
        organizationId: organization.id
      }
    }),
    prisma.areaOfResponsibility.create({
      data: {
        name: 'Finance',
        description: 'Financial planning and management',
        owner: users[0].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${areas.length} areas`);

  // Create Streams
  const streams = await Promise.all([
    prisma.stream.create({
      data: {
        name: 'Product Development',
        description: 'Main product development stream for CRM-GTD',
        color: '#3B82F6',
        icon: '🚀',
        organizationId: organization.id,
        createdById: users[0].id,
        settings: {
          autoArchive: false,
          defaultPriority: 'MEDIUM'
        }
      }
    }),
    prisma.stream.create({
      data: {
        name: 'Marketing & Sales',
        description: 'Marketing campaigns and sales activities',
        color: '#10B981',
        icon: '📈',
        organizationId: organization.id,
        createdById: users[1].id,
        settings: {
          autoArchive: true,
          defaultPriority: 'HIGH'
        }
      }
    }),
    prisma.stream.create({
      data: {
        name: 'Customer Support',
        description: 'Customer support and success initiatives',
        color: '#F59E0B',
        icon: '🎧',
        organizationId: organization.id,
        createdById: users[2].id,
        settings: {
          autoArchive: false,
          defaultPriority: 'HIGH'
        }
      }
    })
  ]);

  console.log(`✅ Created ${streams.length} streams`);

  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'CRM-GTD MVP Launch',
        description: 'Launch the minimum viable product for CRM-GTD platform',
        organizationId: organization.id,
        createdById: users[0].id,
        streamId: streams[0].id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-15'),
        status: 'IN_PROGRESS',
        smartScore: 85.5,
        smartAnalysis: {
          specific: { score: 90, feedback: 'Clear and specific goal with defined deliverables' },
          measurable: { score: 85, feedback: 'Success criteria defined with KPIs' },
          achievable: { score: 80, feedback: 'Realistic with current team and resources' },
          relevant: { score: 90, feedback: 'Aligned with business objectives and market needs' },
          timeBound: { score: 85, feedback: 'Clear deadline with milestones' }
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Q3 Marketing Campaign',
        description: 'Comprehensive marketing campaign for Q3 product launch',
        organizationId: organization.id,
        createdById: users[1].id,
        streamId: streams[1].id,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30'),
        status: 'IN_PROGRESS',
        smartScore: 78.2,
        smartAnalysis: {
          specific: { score: 85, feedback: 'Well-defined campaign objectives' },
          measurable: { score: 80, feedback: 'KPIs established for tracking' },
          achievable: { score: 75, feedback: 'Ambitious but achievable targets' },
          relevant: { score: 85, feedback: 'Supports business growth strategy' },
          timeBound: { score: 75, feedback: 'Clear timeline with campaign phases' }
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Customer Onboarding System',
        description: 'Develop automated customer onboarding process',
        organizationId: organization.id,
        createdById: users[2].id,
        streamId: streams[2].id,
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-08-30'),
        status: 'PLANNING',
        smartScore: 72.8,
        smartAnalysis: {
          specific: { score: 80, feedback: 'Clear onboarding process defined' },
          measurable: { score: 75, feedback: 'Success metrics identified' },
          achievable: { score: 70, feedback: 'Requires additional resources' },
          relevant: { score: 85, feedback: 'Critical for customer success' },
          timeBound: { score: 75, feedback: 'Reasonable timeline set' }
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'Native mobile applications for iOS and Android',
        organizationId: organization.id,
        createdById: users[2].id,
        streamId: streams[0].id,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-12-15'),
        status: 'PLANNING',
        smartScore: 68.5,
        smartAnalysis: {
          specific: { score: 75, feedback: 'Mobile app requirements outlined' },
          measurable: { score: 70, feedback: 'App store metrics defined' },
          achievable: { score: 65, feedback: 'Requires mobile development expertise' },
          relevant: { score: 80, feedback: 'Important for market expansion' },
          timeBound: { score: 70, feedback: 'Timeline accounts for app store approval' }
        }
      }
    })
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // Create comprehensive Tasks covering all GTD categories
  const computerContext = createdContexts.find(c => c.name === '@computer');
  const phoneContext = createdContexts.find(c => c.name === '@phone');
  const errandsContext = createdContexts.find(c => c.name === '@errands');
  const agendaContext = createdContexts.find(c => c.name === '@agenda');
  const deepWorkContext = createdContexts.find(c => c.name === '@deep-work');

  const tasks = await Promise.all([
    // Inbox items (NEW status)
    prisma.task.create({
      data: {
        title: 'Review project proposals from potential clients',
        description: 'Analyze 3 new project proposals and provide detailed feedback on scope, timeline, and budget',
        priority: 'HIGH',
        status: 'NEW',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estimatedHours: 3,
        organizationId: organization.id,
        createdById: users[0].id,
        streamId: streams[1].id,
        projectId: projects[1].id,
        contextId: computerContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Schedule team retrospective meeting',
        description: 'Organize and schedule monthly team retrospective to discuss improvements',
        priority: 'MEDIUM',
        status: 'NEW',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        estimatedHours: 1,
        organizationId: organization.id,
        createdById: users[1].id,
        streamId: streams[0].id,
        contextId: phoneContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Research competitor pricing strategies',
        description: 'Analyze competitor pricing models and prepare comparative analysis',
        priority: 'MEDIUM',
        status: 'NEW',
        estimatedHours: 4,
        organizationId: organization.id,
        createdById: users[1].id,
        streamId: streams[1].id,
        projectId: projects[1].id,
        contextId: computerContext?.id,
      }
    }),

    // Next Actions (IN_PROGRESS status)
    prisma.task.create({
      data: {
        title: 'Implement user authentication system',
        description: 'Build secure JWT-based authentication with 2FA support',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 12,
        organizationId: organization.id,
        createdById: users[2].id,
        streamId: streams[0].id,
        projectId: projects[0].id,
        contextId: deepWorkContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Update LinkedIn company page',
        description: 'Refresh company information and add recent achievements',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        estimatedHours: 2,
        organizationId: organization.id,
        createdById: users[1].id,
        streamId: streams[1].id,
        contextId: computerContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Prepare presentation for board meeting',
        description: 'Create quarterly progress presentation with metrics and forecasts',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        estimatedHours: 4,
        organizationId: organization.id,
        createdById: users[0].id,
        streamId: streams[0].id,
        contextId: computerContext?.id,
      }
    }),

    // Completed tasks
    prisma.task.create({
      data: {
        title: 'Setup development environment',
        description: 'Configure local development tools, Docker, and CI/CD pipeline',
        priority: 'HIGH',
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estimatedHours: 4,
        organizationId: organization.id,
        createdById: users[2].id,
        streamId: streams[0].id,
        projectId: projects[0].id,
        contextId: computerContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Design system architecture',
        description: 'Create comprehensive system architecture document',
        priority: 'HIGH',
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 8,
        organizationId: organization.id,
        createdById: users[0].id,
        streamId: streams[0].id,
        projectId: projects[0].id,
        contextId: computerContext?.id,
      }
    }),

    // Various priority and context tasks
    prisma.task.create({
      data: {
        title: 'Call insurance company about policy renewal',
        description: 'Discuss policy options and negotiate better rates',
        priority: 'MEDIUM',
        status: 'NEW',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        estimatedHours: 1,
        organizationId: organization.id,
        createdById: users[0].id,
        contextId: phoneContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Buy groceries for team lunch',
        description: 'Purchase ingredients for team building lunch event',
        priority: 'LOW',
        status: 'NEW',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimatedHours: 1,
        organizationId: organization.id,
        createdById: users[1].id,
        contextId: errandsContext?.id,
      }
    }),
    prisma.task.create({
      data: {
        title: 'Discuss budget allocation with CFO',
        description: 'Review Q4 budget and discuss allocation for new initiatives',
        priority: 'HIGH',
        status: 'NEW',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        estimatedHours: 2,
        organizationId: organization.id,
        createdById: users[0].id,
        contextId: agendaContext?.id,
      }
    })
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Create comprehensive Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp Solutions',
        website: 'https://techcorp.example.com',
        industry: 'Technology',
        size: 'MEDIUM',
        description: 'Leading provider of enterprise software solutions',
        phone: '+1-555-0123',
        email: 'contact@techcorp.example.com',
        address: '123 Tech Street, Silicon Valley, CA 94000',
        organizationId: organization.id
      }
    }),
    prisma.company.create({
      data: {
        name: 'Marketing Pro Agency',
        website: 'https://marketingpro.example.com',
        industry: 'Marketing',
        size: 'SMALL',
        description: 'Full-service digital marketing agency',
        phone: '+1-555-0456',
        email: 'hello@marketingpro.example.com',
        address: '456 Creative Ave, New York, NY 10001',
        organizationId: organization.id
      }
    }),
    prisma.company.create({
      data: {
        name: 'Global Enterprises Inc',
        website: 'https://globalent.example.com',
        industry: 'Consulting',
        size: 'LARGE',
        description: 'International business consulting firm',
        phone: '+1-555-0789',
        email: 'info@globalent.example.com',
        address: '789 Business Blvd, Chicago, IL 60601',
        organizationId: organization.id
      }
    }),
    prisma.company.create({
      data: {
        name: 'StartupVentures LLC',
        website: 'https://startupventures.example.com',
        industry: 'Technology',
        size: 'SMALL',
        description: 'Early-stage startup accelerator and investment fund',
        phone: '+1-555-0321',
        email: 'contact@startupventures.example.com',
        address: '321 Innovation Drive, Austin, TX 78701',
        organizationId: organization.id
      }
    }),
    prisma.company.create({
      data: {
        name: 'HealthTech Medical',
        website: 'https://healthtech.example.com',
        industry: 'Healthcare',
        size: 'MEDIUM',
        description: 'Healthcare technology and medical device manufacturer',
        phone: '+1-555-0654',
        email: 'info@healthtech.example.com',
        address: '654 Medical Center Dr, Boston, MA 02101',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // Create Contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@techcorp.example.com',
        phone: '+1-555-0124',
        company: companies[0].name,
        position: 'CTO',
        organizationId: organization.id
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike.chen@marketingpro.example.com',
        phone: '+1-555-0457',
        company: companies[1].name,
        position: 'Creative Director',
        organizationId: organization.id
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@globalent.example.com',
        phone: '+1-555-0790',
        company: companies[2].name,
        position: 'Senior Consultant',
        organizationId: organization.id
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@startupventures.example.com',
        phone: '+1-555-0322',
        company: companies[3].name,
        position: 'Managing Partner',
        organizationId: organization.id
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa.thompson@healthtech.example.com',
        phone: '+1-555-0655',
        company: companies[4].name,
        position: 'VP of Sales',
        organizationId: organization.id
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@techcorp.example.com',
        phone: '+1-555-0125',
        company: companies[0].name,
        position: 'Product Manager',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${contacts.length} contacts`);

  // Create Deals with various stages
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'TechCorp Enterprise License',
        description: 'Annual enterprise license for CRM-GTD platform with 500 users',
        value: 75000,
        stage: 'PROPOSAL',
        probability: 0.75,
        expectedCloseDate: new Date('2024-07-15'),
        companyId: companies[0].id,
        ownerId: users[0].id,
        organizationId: organization.id
      }
    }),
    prisma.deal.create({
      data: {
        title: 'Marketing Pro Digital Campaign',
        description: 'Q3 digital marketing campaign management services',
        value: 35000,
        stage: 'NEGOTIATION',
        probability: 0.60,
        expectedCloseDate: new Date('2024-06-30'),
        companyId: companies[1].id,
        ownerId: users[1].id,
        organizationId: organization.id
      }
    }),
    prisma.deal.create({
      data: {
        title: 'Global Enterprises Consulting',
        description: 'Strategic consulting for digital transformation initiative',
        value: 150000,
        stage: 'QUALIFIED',
        probability: 0.40,
        expectedCloseDate: new Date('2024-08-30'),
        companyId: companies[2].id,
        ownerId: users[0].id,
        organizationId: organization.id
      }
    }),
    prisma.deal.create({
      data: {
        title: 'StartupVentures Portfolio Tools',
        description: 'CRM solution for portfolio company management',
        value: 25000,
        stage: 'QUALIFIED',
        probability: 0.30,
        expectedCloseDate: new Date('2024-09-15'),
        companyId: companies[3].id,
        ownerId: users[1].id,
        organizationId: organization.id
      }
    }),
    prisma.deal.create({
      data: {
        title: 'HealthTech Integration Project',
        description: 'Custom integration with existing healthcare systems',
        value: 95000,
        stage: 'CLOSED_WON',
        probability: 1.0,
        expectedCloseDate: new Date('2024-05-30'),
        companyId: companies[4].id,
        ownerId: users[2].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${deals.length} deals`);

  // Create Communication Channels
  const channels = await Promise.all([
    prisma.communicationChannel.create({
      data: {
        name: 'Primary Email - Gmail',
        type: 'EMAIL',
        emailAddress: 'demo@example.com',
        active: true,
        config: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
          username: 'demo@example.com'
        },
        organizationId: organization.id,
      }
    }),
    prisma.communicationChannel.create({
      data: {
        name: 'Support Email',
        type: 'EMAIL',
        emailAddress: 'support@demo.example.com',
        active: true,
        config: {
          host: 'imap.example.com',
          port: 993,
          secure: true,
          username: 'support@demo.example.com'
        },
        organizationId: organization.id,
      }
    }),
    prisma.communicationChannel.create({
      data: {
        name: 'Team Slack Workspace',
        type: 'SLACK',
        active: true,
        config: {
          workspaceId: 'T1234567890',
          botToken: 'xoxb-demo-token',
          channelId: 'C1234567890'
        },
        organizationId: organization.id,
      }
    })
  ]);

  console.log(`✅ Created ${channels.length} communication channels`);

  // Create Messages with AI analysis
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        messageId: 'msg-001',
        fromAddress: 'sarah.johnson@techcorp.example.com',
        fromName: 'Sarah Johnson',
        toAddress: 'demo@example.com',
        subject: 'Urgent: Website project requirements clarification',
        content: 'Hi John, I need to discuss the website redesign project requirements urgently. There are some critical changes that need immediate attention. Can we schedule a call today? This is blocking our entire development team.',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
        urgencyScore: 85,
        sentiment: 'NEGATIVE',
        actionNeeded: true,
        channelId: channels[0].id,
        organizationId: organization.id
      }
    }),
    prisma.message.create({
      data: {
        messageId: 'msg-002',
        fromAddress: 'mike.chen@marketingpro.example.com',
        fromName: 'Mike Chen',
        toAddress: 'demo@example.com',
        subject: 'Excellent news! Marketing campaign proposal ready',
        content: 'Great news! We have completed the comprehensive proposal for your Q3 marketing campaign. The document includes detailed strategy, timeline, and budget breakdown. I\'m excited to present this to your team. Please let me know when we can schedule a presentation.',
        sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isRead: true,
        urgencyScore: 60,
        sentiment: 'POSITIVE',
        actionNeeded: true,
        channelId: channels[0].id,
        organizationId: organization.id
      }
    }),
    prisma.message.create({
      data: {
        messageId: 'msg-003',
        fromAddress: 'emily.rodriguez@globalent.example.com',
        fromName: 'Emily Rodriguez',
        toAddress: 'demo@example.com',
        subject: 'Follow-up on consulting engagement timeline',
        content: 'Thank you for your interest in our consulting services. I understand there may be some concerns about the proposed timeline. Let me clarify our approach and see how we can better align with your expectations. Would you be available for a brief discussion this week?',
        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isRead: true,
        urgencyScore: 45,
        sentiment: 'NEUTRAL',
        actionNeeded: false,
        channelId: channels[0].id,
        organizationId: organization.id
      }
    }),
    prisma.message.create({
      data: {
        messageId: 'msg-004',
        fromAddress: 'david.kim@startupventures.example.com',
        fromName: 'David Kim',
        toAddress: 'support@demo.example.com',
        subject: 'Demo request for portfolio management features',
        content: 'Hello, I\'m interested in seeing how your CRM system could help us manage our portfolio companies. Could we schedule a demo focusing on the project management and reporting capabilities? We manage about 25 startups and need better visibility.',
        sentAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        isRead: false,
        urgencyScore: 70,
        sentiment: 'POSITIVE',
        actionNeeded: true,
        channelId: channels[1].id,
        organizationId: organization.id
      }
    }),
    prisma.message.create({
      data: {
        messageId: 'msg-005',
        fromAddress: 'lisa.thompson@healthtech.example.com',
        fromName: 'Lisa Thompson',
        toAddress: 'demo@example.com',
        subject: 'Project milestone achieved - thank you!',
        content: 'I wanted to personally thank your team for the excellent work on our integration project. We\'ve successfully completed the first milestone ahead of schedule. The system is working perfectly and our team is very impressed with the results.',
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        receivedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        isRead: true,
        urgencyScore: 20,
        sentiment: 'POSITIVE',
        actionNeeded: false,
        channelId: channels[0].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${messages.length} messages`);

  // Create Waiting For items
  const waitingForItems = await Promise.all([
    prisma.waitingFor.create({
      data: {
        description: 'Waiting for Sarah Johnson (TechCorp) to approve the initial website design mockups and provide feedback',
        waitingForWho: 'Sarah Johnson',
        expectedResponseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        organizationId: organization.id
      }
    }),
    prisma.waitingFor.create({
      data: {
        description: 'Waiting for signed contract from Marketing Pro Agency for Q3 campaign services',
        waitingForWho: 'Mike Chen',
        expectedResponseDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        organizationId: organization.id
      }
    }),
    prisma.waitingFor.create({
      data: {
        description: 'Waiting for finance team approval for additional development resources',
        waitingForWho: 'Finance Team',
        expectedResponseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        organizationId: organization.id
      }
    }),
    prisma.waitingFor.create({
      data: {
        description: 'Waiting for production server access credentials from IT department',
        waitingForWho: 'IT Support',
        expectedResponseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${waitingForItems.length} waiting for items`);

  // Create Someday/Maybe items
  const somedayMaybeItems = await Promise.all([
    prisma.somedayMaybe.create({
      data: {
        title: 'Learn React Native for mobile development',
        description: 'Explore mobile app development with React Native for future cross-platform projects',
        effort: 'HIGH',
        expectedImpact: 'MEDIUM',
        complexity: 'HIGH',
        organizationId: organization.id
      }
    }),
    prisma.somedayMaybe.create({
      data: {
        title: 'Start a technology blog',
        description: 'Create a blog to share insights about web development, productivity, and startup experiences',
        effort: 'MEDIUM',
        expectedImpact: 'MEDIUM',
        complexity: 'LOW',
        organizationId: organization.id
      }
    }),
    prisma.somedayMaybe.create({
      data: {
        title: 'Plan family vacation to Europe',
        description: 'Research and plan a 2-week vacation to Europe for next summer, including Italy, France, and Spain',
        effort: 'MEDIUM',
        expectedImpact: 'LOW',
        complexity: 'LOW',
        organizationId: organization.id
      }
    }),
    prisma.somedayMaybe.create({
      data: {
        title: 'Explore AI integration opportunities',
        description: 'Research potential AI and machine learning integrations for the CRM platform',
        effort: 'HIGH',
        expectedImpact: 'HIGH',
        complexity: 'HIGH',
        organizationId: organization.id
      }
    }),
    prisma.somedayMaybe.create({
      data: {
        title: 'Organize team building retreat',
        description: 'Plan a 3-day team building retreat in the mountains with workshops and activities',
        effort: 'MEDIUM',
        expectedImpact: 'MEDIUM',
        complexity: 'LOW',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${somedayMaybeItems.length} someday/maybe items`);

  // Create Habits
  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        name: 'Daily email processing to inbox zero',
        description: 'Process all emails to achieve inbox zero every morning before 10 AM',
        frequency: 'DAILY',
        isActive: true,
        organizationId: organization.id
      }
    }),
    prisma.habit.create({
      data: {
        name: 'Weekly GTD review',
        description: 'Complete comprehensive weekly GTD review every Friday afternoon',
        frequency: 'WEEKLY',
        isActive: true,
        organizationId: organization.id,
      }
    }),
    prisma.habit.create({
      data: {
        name: 'Daily learning time',
        description: 'Dedicate 30 minutes daily to professional development and learning',
        frequency: 'DAILY',
        isActive: true,
        organizationId: organization.id,
      }
    }),
    prisma.habit.create({
      data: {
        name: 'Team standup meetings',
        description: 'Conduct daily 15-minute team standup meetings',
        frequency: 'DAILY',
        isActive: true,
        organizationId: organization.id,
      }
    }),
    prisma.habit.create({
      data: {
        name: 'Monthly client check-ins',
        description: 'Schedule monthly check-in calls with all active clients',
        frequency: 'MONTHLY',
        isActive: true,
        organizationId: organization.id,
      }
    })
  ]);

  console.log(`✅ Created ${habits.length} habits`);

  // Create Delegated Tasks
  const delegatedTasks = await Promise.all([
    prisma.delegatedTask.create({
      data: {
        description: 'Create website content draft - Write initial content for website homepage, about page, and service descriptions',
        delegatedTo: 'Content Writer',
        organizationId: organization.id
      }
    }),
    prisma.delegatedTask.create({
      data: {
        description: 'Design marketing graphics - Create social media graphics, banner ads, and promotional materials for Q3 campaign',
        delegatedTo: 'Jane Designer',
        organizationId: organization.id
      }
    }),
    prisma.delegatedTask.create({
      data: {
        description: 'Conduct user research interviews - Interview 10 potential users to gather feedback on new features',
        delegatedTo: 'UX Research Team',
        organizationId: organization.id
      }
    }),
    prisma.delegatedTask.create({
      data: {
        description: 'Legal review of client contracts - Review and approve new client contract templates',
        delegatedTo: 'Legal Counsel',
        organizationId: organization.id,
      }
    })
  ]);

  console.log(`✅ Created ${delegatedTasks.length} delegated tasks`);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'urgent'
        }
      },
      update: {},
      create: {
        name: 'urgent',
        color: '#EF4444',
        organizationId: organization.id,
      }
    }),
    prisma.tag.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'client-feedback'
        }
      },
      update: {},
      create: {
        name: 'client-feedback',
        color: '#3B82F6',
        organizationId: organization.id,
      }
    }),
    prisma.tag.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'technical-debt'
        }
      },
      update: {},
      create: {
        name: 'technical-debt',
        color: '#F59E0B',
        organizationId: organization.id,
      }
    }),
    prisma.tag.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'marketing'
        }
      },
      update: {},
      create: {
        name: 'marketing',
        color: '#10B981',
        organizationId: organization.id,
      }
    }),
    prisma.tag.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'research'
        }
      },
      update: {},
      create: {
        name: 'research',
        color: '#8B5CF6',
        organizationId: organization.id,
      }
    })
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create Processing Rules
  const processingRules = await Promise.all([
    prisma.processingRule.create({
      data: {
        name: 'High Priority Client Emails',
        description: 'Automatically mark emails from key clients as high priority',
        active: true,
        conditions: {
          senderContains: ['@techcorp.example.com', '@globalent.example.com'],
          subjectContains: ['urgent', 'critical', 'important']
        },
        actions: {
          setUrgencyScore: 80,
          addTags: ['client-urgent'],
          createTask: true
        },
        organizationId: organization.id,
        channelId: channels[0].id
      }
    }),
    prisma.processingRule.create({
      data: {
        name: 'Support Ticket Creation',
        description: 'Create support tickets from support email channel',
        active: true,
        conditions: {
          channel: 'support',
          subjectContains: ['support', 'help', 'issue', 'problem']
        },
        actions: {
          createTask: true,
          assignTo: users[2].id,
          setContext: '@computer'
        },
        organizationId: organization.id,
        channelId: channels[1].id
      }
    }),
    prisma.processingRule.create({
      data: {
        name: 'Newsletter Auto-Archive',
        description: 'Automatically archive newsletter and promotional emails',
        active: true,
        conditions: {
          senderContains: ['newsletter', 'noreply', 'marketing'],
          bodyContains: ['unsubscribe', 'newsletter', 'promotional']
        },
        actions: {
          markAsRead: true,
          archive: true,
          setUrgencyScore: 10
        },
        organizationId: organization.id,
      }
    })
  ]);

  console.log(`✅ Created ${processingRules.length} processing rules`);

  // Seed Knowledge Management System
  await seedKnowledgeManagement(organization, users);

  console.log('🎉 Comprehensive database seeding completed!');
  console.log('📊 Summary of created data:');
  console.log(`   • 1 Organization: ${organization.name}`);
  console.log(`   • ${users.length} Users with different roles`);
  console.log(`   • ${createdContexts.length} GTD Contexts`);
  console.log(`   • ${areas.length} Areas of Responsibility`);
  console.log(`   • ${streams.length} Streams`);
  console.log(`   • ${projects.length} Projects with SMART analysis`);
  console.log(`   • ${tasks.length} Tasks (various statuses and priorities)`);
  console.log(`   • ${companies.length} Companies`);
  console.log(`   • ${contacts.length} Contacts`);
  console.log(`   • ${deals.length} Deals (various stages)`);
  console.log(`   • ${channels.length} Communication Channels`);
  console.log(`   • ${messages.length} Messages with AI analysis`);
  console.log(`   • ${waitingForItems.length} Waiting For items`);
  console.log(`   • ${somedayMaybeItems.length} Someday/Maybe items`);
  console.log(`   • ${habits.length} Habits`);
  console.log(`   • ${delegatedTasks.length} Delegated Tasks`);
  console.log(`   • ${tags.length} Tags`);
  console.log(`   • ${processingRules.length} Processing Rules`);
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   • Owner: demo@example.com / demo123');
  console.log('   • Admin: sarah.manager@example.com / demo123');
  console.log('   • User: mike.developer@example.com / demo123');
  console.log('');
  console.log('🌐 Application available at: http://192.168.1.17:9025');
}

async function seedKnowledgeManagement(organization: any, users: any[]) {
  console.log('📚 Seeding Knowledge Management System...');

  // Create Wiki Categories
  const wikiCategories = await Promise.all([
    prisma.wikiCategory.create({
      data: {
        name: 'Getting Started',
        description: 'Guides for new users and basic setup',
        color: '#10B981',
        icon: '🚀',
        sortOrder: 1,
        organizationId: organization.id
      }
    }),
    prisma.wikiCategory.create({
      data: {
        name: 'Productivity Tips',
        description: 'Best practices and productivity methodologies',
        color: '#F59E0B',
        icon: '⚡',
        sortOrder: 2,
        organizationId: organization.id
      }
    }),
    prisma.wikiCategory.create({
      data: {
        name: 'Technical Documentation',
        description: 'API documentation and technical guides',
        color: '#3B82F6',
        icon: '🔧',
        sortOrder: 3,
        organizationId: organization.id
      }
    }),
    prisma.wikiCategory.create({
      data: {
        name: 'Team Processes',
        description: 'Internal processes and workflows',
        color: '#8B5CF6',
        icon: '👥',
        sortOrder: 4,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${wikiCategories.length} wiki categories`);

  // Create Folders
  const folders = await Promise.all([
    prisma.folder.create({
      data: {
        name: 'Project Documentation',
        description: 'Documentation for current and past projects',
        color: '#3B82F6',
        isSystem: false,
        organizationId: organization.id
      }
    }),
    prisma.folder.create({
      data: {
        name: 'Meeting Notes',
        description: 'Notes from team meetings and client calls',
        color: '#10B981',
        isSystem: false,
        organizationId: organization.id
      }
    }),
    prisma.folder.create({
      data: {
        name: 'Research',
        description: 'Market research and competitive analysis',
        color: '#F59E0B',
        isSystem: false,
        organizationId: organization.id
      }
    }),
    prisma.folder.create({
      data: {
        name: 'Templates',
        description: 'Document templates and standard forms',
        color: '#8B5CF6',
        isSystem: true,
        organizationId: organization.id
      }
    })
  ]);

  // Create subfolders
  const subfolders = await Promise.all([
    prisma.folder.create({
      data: {
        name: 'CRM Platform',
        description: 'Documentation specific to the CRM platform project',
        color: '#3B82F6',
        parentId: folders[0].id,
        organizationId: organization.id
      }
    }),
    prisma.folder.create({
      data: {
        name: 'Weekly Standup',
        description: 'Weekly team standup meeting notes',
        color: '#10B981',
        parentId: folders[1].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${folders.length} folders and ${subfolders.length} subfolders`);

  // Create Wiki Pages
  const wikiPages = await Promise.all([
    prisma.wikiPage.create({
      data: {
        title: 'Welcome to Our Knowledge Base',
        slug: 'welcome',
        content: `# Welcome to Our Knowledge Base 🎉

This knowledge base contains all the essential information you need to get started and be productive with our CRM platform.

## Quick Navigation

- [Getting Started Guide](getting-started-guide) - Start here if you're new
- [GTD Methodology](gtd-methodology) - Learn about our productivity system
- [API Documentation](api-documentation) - For developers
- [Team Processes](team-processes) - How we work together

## Recent Updates

- Added AI Goal Recommendations feature
- Enhanced productivity analytics
- New mobile responsive design
- Improved knowledge management system

## Need Help?

If you can't find what you're looking for, check out our [Frequently Asked Questions](faq) or contact the support team.

---
*Last updated: ${new Date().toISOString().split('T')[0]}*`,
        summary: 'Main welcome page introducing the knowledge base and providing navigation links',
        isPublished: true,
        version: 1,
        authorId: users[0].id,
        categoryId: wikiCategories[0].id,
        organizationId: organization.id
      }
    }),
    prisma.wikiPage.create({
      data: {
        title: 'Getting Started Guide',
        slug: 'getting-started-guide',
        content: `# Getting Started Guide 🚀

Welcome! This guide will help you get up and running quickly with our CRM platform.

## Step 1: Account Setup

1. Log in with your credentials
2. Complete your profile information
3. Set up your timezone and preferences
4. Configure notification settings

## Step 2: Understanding GTD

Our platform is built around the Getting Things Done (GTD) methodology:

### Core Concepts

- **Inbox**: Capture everything here first
- **Contexts**: Where/how you can do tasks (@computer, @phone, @errands)
- **Projects**: Multi-step outcomes you're committed to
- **Areas of Responsibility**: Ongoing areas you maintain
- **Someday/Maybe**: Things you might want to do someday

### The GTD Workflow

1. **Capture** - Get everything out of your head into the inbox
2. **Clarify** - Process inbox items into actionable tasks
3. **Organize** - Put tasks in appropriate lists and contexts
4. **Reflect** - Review your system regularly
5. **Engage** - Choose what to work on with confidence

## Step 3: Creating Your First Task

1. Go to the Inbox
2. Click "Add Item"
3. Enter what's on your mind
4. Process it: Is it actionable?
   - If yes: Create a task and assign context
   - If no: File as reference or delete

## Step 4: Setting Up Contexts

Create contexts that match your work style:
- @computer - Tasks requiring a computer
- @phone - Calls to make
- @errands - Things to do when out
- @waiting - Waiting for someone else
- @agenda - Items to discuss with specific people

## Next Steps

- [Learn about Projects](projects-guide)
- [Set up your Weekly Review](weekly-review)
- [Explore AI Features](ai-features)

Happy organizing! 📈`,
        summary: 'Comprehensive guide for new users to get started with the platform and GTD methodology',
        isPublished: true,
        version: 1,
        authorId: users[0].id,
        categoryId: wikiCategories[0].id,
        organizationId: organization.id
      }
    }),
    prisma.wikiPage.create({
      data: {
        title: 'GTD Methodology Deep Dive',
        slug: 'gtd-methodology',
        content: `# GTD Methodology Deep Dive 🧠

Getting Things Done (GTD) is a personal productivity system developed by David Allen. Our platform implements GTD principles to help you achieve stress-free productivity.

## The Five Pillars of GTD

### 1. Capture
Everything that has your attention needs to get out of your head and into a trusted system.

**Best Practices:**
- Use the inbox for quick capture
- Don't worry about organization during capture
- Capture the exact thought, don't filter
- Review and process regularly

### 2. Clarify
Transform captured items into clear, actionable tasks or reference material.

**The Decision Tree:**
- Is it actionable?
  - **No**: Trash, reference, or someday/maybe
  - **Yes**: Is it a single action or project?
    - **Single action**: Add to appropriate context list
    - **Project**: Define next action and add to projects list

### 3. Organize
Put everything in the right place in your system.

**Key Lists:**
- **Context Lists**: @computer, @phone, @errands, etc.
- **Project Lists**: Multi-step outcomes
- **Waiting For**: Items dependent on others
- **Someday/Maybe**: Things you might want to do

### 4. Reflect
Keep your system current through regular reviews.

**Weekly Review Process:**
1. Collect loose papers and materials
2. Get "In" to empty
3. Review previous week's calendar
4. Review upcoming calendar
5. Review all project lists
6. Review "Waiting For" list
7. Review "Someday/Maybe" list

### 5. Engage
Choose what to work on with confidence.

**Decision Criteria:**
1. Context - Where are you and what tools do you have?
2. Time available - How much time before your next commitment?
3. Energy available - How much mental/physical energy do you have?
4. Priority - What's most important given the above factors?

## Advanced GTD Concepts

### Natural Planning Model
1. **Purpose** - Why are we doing this?
2. **Principles** - What standards will guide behavior?
3. **Vision** - What would the outcome look like?
4. **Brainstorm** - What are all the ideas and details?
5. **Organize** - What are the components, sequences, priorities?

### Areas of Responsibility
Ongoing areas you maintain (not projects with end dates):
- Health and fitness
- Family relationships
- Financial management
- Professional development
- Home maintenance

### The Two-Minute Rule
If something takes less than two minutes to do, do it now rather than adding it to your system.

## GTD in Our Platform

Our platform implements these concepts through:
- **Smart Inbox** - Quick capture with AI-powered processing
- **Context-based Task Lists** - Organize by where/how you work
- **Project Management** - Track multi-step outcomes
- **Weekly Review Templates** - Structured review process
- **AI Insights** - Pattern recognition and recommendations

## Common Pitfalls to Avoid

1. **Over-complicating the system** - Keep it simple and trust the process
2. **Inconsistent capture** - Always use your inbox, don't rely on memory
3. **Skipping the weekly review** - This is critical for system maintenance
4. **Not defining next actions clearly** - Be specific about what the very next physical action is
5. **Confusing projects with areas** - Projects have end dates, areas are ongoing

## Resources

- [David Allen's Official GTD Website](https://gettingthingsdone.com)
- [Weekly Review Template](weekly-review-template)
- [Context Setup Guide](context-setup)

Remember: GTD is about having a mind like water - calm, responsive, and engaged. 🌊`,
        summary: 'Comprehensive explanation of GTD methodology and how it\'s implemented in the platform',
        isPublished: true,
        version: 1,
        authorId: users[1].id,
        categoryId: wikiCategories[1].id,
        organizationId: organization.id
      }
    }),
    prisma.wikiPage.create({
      data: {
        title: 'API Documentation',
        slug: 'api-documentation',
        content: `# API Documentation 🔧

Our CRM platform provides a comprehensive REST API for integration and automation.

## Authentication

All API requests require authentication using JWT tokens.

\`\`\`javascript
// Include token in Authorization header
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

## Base URL

\`\`\`
https://api.yourcrm.com/api/v1
\`\`\`

## Core Endpoints

### Tasks

#### GET /tasks
Retrieve all tasks for the authenticated user.

**Parameters:**
- \`status\` (optional): Filter by task status
- \`context\` (optional): Filter by context
- \`limit\` (optional): Number of results (default: 50)
- \`offset\` (optional): Pagination offset

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-01-15T10:00:00Z",
      "context": {
        "id": "uuid",
        "name": "@computer"
      },
      "project": {
        "id": "uuid",
        "name": "Website Redesign"
      }
    }
  ],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
\`\`\`

#### POST /tasks
Create a new task.

**Request Body:**
\`\`\`json
{
  "title": "Task title",
  "description": "Task description",
  "priority": "MEDIUM",
  "dueDate": "2024-01-15T10:00:00Z",
  "contextId": "context-uuid",
  "projectId": "project-uuid"
}
\`\`\`

### Projects

#### GET /projects
Retrieve all projects.

#### POST /projects
Create a new project.

### AI Endpoints

#### GET /ai/goal-recommendations
Get AI-powered goal recommendations.

#### POST /ai/analyze-productivity
Analyze productivity patterns.

**Request Body:**
\`\`\`json
{
  "timeframe": "30d"
}
\`\`\`

## Rate Limits

- 1000 requests per hour for authenticated users
- 100 requests per hour for unauthenticated requests

## Error Handling

The API uses conventional HTTP response codes:

- \`200\` - Success
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`500\` - Internal Server Error

**Error Response Format:**
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "value": null
    }
  }
}
\`\`\`

## SDKs and Examples

### JavaScript/Node.js
\`\`\`javascript
const CRMClient = require('@yourcrm/client');

const client = new CRMClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.yourcrm.com/api/v1'
});

// Create a task
const task = await client.tasks.create({
  title: 'Review API documentation',
  priority: 'HIGH',
  contextId: 'computer-context-id'
});
\`\`\`

### Python
\`\`\`python
import yourcrm

client = yourcrm.Client(api_key='your-api-key')

# Get all tasks
tasks = client.tasks.list(status='IN_PROGRESS')

# Create a task
task = client.tasks.create(
    title='Review API documentation',
    priority='HIGH',
    context_id='computer-context-id'
)
\`\`\`

## Webhooks

Subscribe to real-time events using webhooks.

**Supported Events:**
- \`task.created\`
- \`task.updated\`
- \`task.completed\`
- \`project.created\`
- \`project.completed\`

**Webhook Payload:**
\`\`\`json
{
  "event": "task.created",
  "data": {
    "id": "task-uuid",
    "title": "New task",
    "status": "NEW"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
\`\`\`

## Need Help?

- [API Playground](api-playground) - Test endpoints interactively
- [Code Examples](api-examples) - More implementation examples
- [Support](mailto:api-support@yourcrm.com) - Technical support

---
*API Version: v1.0.0 | Last updated: ${new Date().toISOString().split('T')[0]}*`,
        summary: 'Complete API documentation with examples and integration guides',
        isPublished: true,
        version: 1,
        authorId: users[2].id,
        categoryId: wikiCategories[2].id,
        organizationId: organization.id
      }
    }),
    prisma.wikiPage.create({
      data: {
        title: 'Team Processes and Workflows',
        slug: 'team-processes',
        content: `# Team Processes and Workflows 👥

This document outlines our team processes, workflows, and best practices for collaboration.

## Daily Workflows

### Morning Standup (9:00 AM)
Daily 15-minute sync meeting covering:
1. What did you accomplish yesterday?
2. What will you work on today?
3. Any blockers or issues?

**Format:** Round-robin, time-boxed to 3 minutes per person

### Task Management
- All work items start in the shared inbox
- Tasks are processed during daily planning sessions
- Use contexts to organize work by location/tools needed
- Update task status in real-time

### Communication Guidelines
- **Urgent matters**: Slack or phone call
- **Project updates**: Post in relevant project channel
- **Documentation**: Update wiki pages as you go
- **Decisions**: Document in meeting notes and update relevant wiki pages

## Weekly Processes

### Weekly Review (Fridays 3:00 PM)
Team-wide review session:
1. Review completed work and achievements
2. Identify blockers and challenges
3. Plan upcoming week priorities
4. Update project statuses
5. Knowledge sharing (tips, learnings, resources)

### Sprint Planning (Every 2 weeks)
- Review previous sprint performance
- Plan next sprint goals and tasks
- Estimate effort and assign responsibilities
- Identify dependencies and risks

## Project Workflows

### Project Initiation
1. **Define purpose and vision** - Why are we doing this?
2. **Set SMART goals** - Specific, measurable outcomes
3. **Create project in CRM** - Set up tracking and milestones
4. **Define next actions** - Identify first concrete steps
5. **Assign ownership** - Clear responsibility for each deliverable

### Project Execution
- Use project boards for visual progress tracking
- Regular check-ins with stakeholders
- Update documentation as you build
- Test early and often
- Communicate blockers immediately

### Project Completion
- Final testing and quality review
- Update documentation
- Post-mortem meeting (what went well, what could improve)
- Archive project materials
- Celebrate success! 🎉

## Code and Development

### Git Workflow
1. Create feature branch from main
2. Work in small, focused commits
3. Write descriptive commit messages
4. Submit pull request when ready
5. Code review by at least one team member
6. Merge after approval and tests pass

### Code Review Process
- Review within 24 hours
- Focus on logic, security, and maintainability
- Be constructive and specific in feedback
- Approve if no blocking issues

### Documentation Standards
- Update README files for significant changes
- Document API changes immediately
- Include examples in documentation
- Keep wiki pages current

## Client Communication

### Client Meetings
- Prepare agenda in advance
- Share relevant materials beforehand
- Take detailed notes
- Send follow-up summary within 24 hours
- Update CRM with meeting outcomes

### Status Reports
- Weekly status emails to key stakeholders
- Include progress, next steps, and any concerns
- Use visual progress indicators when possible
- Be transparent about challenges

### Issue Resolution
1. **Acknowledge** - Respond within 2 hours
2. **Investigate** - Gather details and reproduce if needed
3. **Communicate** - Provide timeline and updates
4. **Resolve** - Fix issue and test thoroughly
5. **Follow-up** - Ensure client satisfaction

## Knowledge Management

### Documentation Standards
- Write for your future self and team members
- Use clear, simple language
- Include examples and screenshots
- Update as processes evolve
- Tag content appropriately

### Knowledge Sharing
- Weekly "Lunch and Learn" sessions
- Share interesting articles in #learning channel
- Document lessons learned from projects
- Create templates for common tasks

## Tools and Integrations

### Primary Tools
- **CRM Platform** - Project and task management
- **Slack** - Daily communication
- **GitHub** - Code repository and issues
- **Figma** - Design and prototyping
- **Google Workspace** - Documents and calendars

### Integrations
- GitHub commits auto-update related tasks
- Calendar events sync with CRM projects
- Slack notifications for critical CRM updates

## Performance and Growth

### Individual Development
- Monthly 1:1 meetings with manager
- Quarterly goal setting and review
- Continuous learning budget ($500/quarter)
- Conference attendance (1 per year)

### Team Metrics
- Sprint velocity and completion rates
- Client satisfaction scores
- Bug resolution time
- Knowledge base contribution

## Emergency Procedures

### System Outages
1. Immediately notify #alerts channel
2. Update status page
3. Investigate and implement fix
4. Post-incident review within 48 hours

### Client Escalations
1. Escalate to team lead immediately
2. Bring in subject matter experts
3. Provide hourly updates to client
4. Document resolution for future reference

---

## Questions or Suggestions?

This document is living and should evolve with our team. If you have suggestions for improvements, please:
1. Create a task in the "Process Improvement" project
2. Discuss in the next weekly review
3. Update this document with approved changes

*Last updated: ${new Date().toISOString().split('T')[0]} | Next review: Monthly*`,
        summary: 'Comprehensive guide to team processes, workflows, and collaboration best practices',
        isPublished: true,
        version: 1,
        authorId: users[1].id,
        categoryId: wikiCategories[3].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${wikiPages.length} wiki pages`);

  // Create Documents
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        title: 'CRM Platform Requirements Document',
        content: `# CRM Platform Requirements Document

## Project Overview
This document outlines the functional and non-functional requirements for our new CRM platform built around GTD methodology.

## Functional Requirements

### User Management
- Multi-tenant architecture with organization isolation
- Role-based access control (Owner, Admin, Manager, Member, Guest)
- User authentication with JWT tokens
- Password reset and email verification

### GTD Core Features
- Inbox for capturing all inputs
- Context-based task organization
- Project tracking with SMART goal analysis
- Areas of responsibility management
- Someday/maybe lists
- Weekly review workflows

### Advanced Features
- AI-powered goal recommendations
- Productivity analytics with ML insights
- Knowledge management system
- Real-time collaboration
- Mobile-responsive design

## Non-Functional Requirements
- Support 1000+ concurrent users
- 99.9% uptime SLA
- < 200ms response time for core operations
- GDPR compliance
- End-to-end encryption for sensitive data

## Technical Architecture
- Next.js frontend with TypeScript
- Node.js/Express backend
- PostgreSQL database with Prisma ORM
- Redis for caching and sessions
- Docker containerization
- AWS deployment

## Success Metrics
- User engagement (daily active users)
- Task completion rates
- Goal achievement rates
- System performance metrics
- Customer satisfaction scores

## Timeline
- Phase 1: Core GTD features (8 weeks)
- Phase 2: Communication integration (4 weeks)
- Phase 3: AI and analytics (6 weeks)
- Phase 4: Mobile apps (8 weeks)

## Stakeholders
- Product Owner: John Smith
- Technical Lead: Sarah Johnson
- UX Designer: Mike Brown
- QA Lead: Lisa Davis

---
Document Status: Final
Last Updated: ${new Date().toISOString().split('T')[0]}
Version: 2.1`,
        summary: 'Comprehensive requirements document for the CRM platform project',
        type: 'SPECIFICATION',
        status: 'PUBLISHED',
        tags: ['requirements', 'crm', 'gtd', 'project-planning'],
        version: 2,
        authorId: users[0].id,
        folderId: subfolders[0].id,
        organizationId: organization.id
      }
    }),
    prisma.document.create({
      data: {
        title: 'Weekly Standup - January 15, 2024',
        content: `# Weekly Standup - January 15, 2024

## Attendees
- John Smith (Product Owner)
- Sarah Johnson (Tech Lead)
- Mike Brown (Designer)
- Lisa Davis (QA)

## Last Week Accomplishments

### Sarah
- Completed AI goal recommendation engine
- Fixed performance issues in task loading
- Code review for mobile navigation PR

### Mike
- Finalized mobile UI designs
- Created component library documentation
- User testing session with 5 participants

### Lisa
- Tested AI features thoroughly
- Created automated test suite for API endpoints
- Bug triage and priority assignment

## This Week Plans

### Sarah
- Implement knowledge management backend
- Work on predictive analytics features
- Performance optimization for large datasets

### Mike
- Implement mobile-responsive dashboard
- Create onboarding flow designs
- Accessibility audit and improvements

### Lisa
- Test knowledge management features
- Performance testing with large datasets
- Documentation for QA processes

## Blockers and Issues

### Sarah
- Need design mockups for knowledge base UI
- Waiting for third-party API documentation

### Mike
- Need final copy for onboarding flow
- Clarification on accessibility requirements

### Lisa
- Test environment needs more realistic data
- Need access to staging environment

## Action Items
1. [Mike] Provide knowledge base UI mockups by Wednesday
2. [John] Follow up with API vendor for documentation
3. [Sarah] Set up staging environment access for Lisa
4. [John] Provide final onboarding copy by Thursday

## Next Meeting
Friday, January 22, 2024 at 9:00 AM

---
Meeting Duration: 25 minutes
Notes taken by: Sarah Johnson`,
        summary: 'Weekly team standup meeting notes covering accomplishments, plans, and blockers',
        type: 'MEETING_NOTES',
        status: 'PUBLISHED',
        tags: ['standup', 'team-meeting', 'weekly', 'january-2024'],
        version: 1,
        authorId: users[1].id,
        folderId: subfolders[1].id,
        organizationId: organization.id
      }
    }),
    prisma.document.create({
      data: {
        title: 'Competitive Analysis: CRM Market Research',
        content: `# Competitive Analysis: CRM Market Research

## Executive Summary
This analysis examines the current CRM market landscape, identifying key competitors, market trends, and opportunities for differentiation.

## Market Overview
The global CRM market is valued at $63.9 billion in 2024 and is expected to grow at 12.1% CAGR through 2029.

## Key Competitors

### Salesforce
**Strengths:**
- Market leader with 20% market share
- Extensive ecosystem and integrations
- Strong enterprise features
- Excellent mobile apps

**Weaknesses:**
- Complex pricing structure
- Steep learning curve
- Over-engineered for small businesses
- Limited GTD methodology support

**Our Advantage:**
- Simpler, more intuitive interface
- Built-in GTD methodology
- Transparent pricing
- Better mobile experience

### HubSpot
**Strengths:**
- Free tier attracts small businesses
- Strong marketing automation
- Good user experience
- Comprehensive documentation

**Weaknesses:**
- Limited customization options
- Expensive premium features
- No productivity methodology focus
- Basic project management

**Our Advantage:**
- Integrated productivity system
- Better project management
- AI-powered insights
- More affordable scaling

### Pipedrive
**Strengths:**
- Simple, visual pipeline
- Good for sales teams
- Affordable pricing
- Easy to set up

**Weaknesses:**
- Limited beyond sales use cases
- No productivity methodology
- Basic reporting capabilities
- Limited automation

**Our Advantage:**
- Holistic productivity platform
- Advanced analytics
- GTD methodology integration
- Comprehensive workflow management

## Market Trends

### 1. AI Integration
- 68% of CRM users want AI-powered insights
- Predictive analytics becoming standard
- Automation of routine tasks increasing

### 2. Mobile-First Approach
- 65% of sales reps use mobile CRM
- Voice-enabled interfaces growing
- Offline functionality critical

### 3. Productivity Integration
- Users want unified productivity platforms
- Integration with task management tools
- Focus on work-life balance features

### 4. Customization Demands
- 73% want industry-specific features
- Custom workflow requirements
- Integration with existing tools

## Positioning Strategy

### Our Unique Value Proposition
"The only CRM that makes you more productive, not just more organized."

### Key Differentiators
1. **GTD Integration**: Built-in productivity methodology
2. **AI-Powered Insights**: Predictive analytics and recommendations
3. **Unified Platform**: CRM + Task Management + Knowledge Base
4. **Transparent Pricing**: Simple, scalable pricing model
5. **Modern UX**: Mobile-first, intuitive design

### Target Segments

#### Primary: Knowledge Workers (25-45)
- Entrepreneurs and small business owners
- Consultants and freelancers
- Team leads and managers
- Productivity enthusiasts

#### Secondary: Small to Medium Businesses (10-100 employees)
- Growing companies needing better organization
- Teams wanting integrated productivity tools
- Businesses frustrated with complex CRMs

## Go-to-Market Strategy

### Phase 1: Early Adopters (0-6 months)
- Focus on productivity community
- Content marketing around GTD methodology
- Free tier with generous limits
- Community building and feedback

### Phase 2: Growth (6-18 months)
- Paid advertising to SMB segment
- Partnership with productivity influencers
- Case studies and success stories
- Feature expansion based on feedback

### Phase 3: Scale (18+ months)
- Enterprise features and pricing
- API and integration ecosystem
- International expansion
- Advanced AI features

## Pricing Strategy

### Freemium Model
- **Free**: Up to 3 users, basic features
- **Professional ($15/user/month)**: Advanced features, integrations
- **Business ($30/user/month)**: AI features, analytics
- **Enterprise (Custom)**: Custom features, dedicated support

### Competitive Pricing Analysis
- 20-30% below Salesforce equivalent tiers
- Premium pricing vs. basic CRMs (justified by productivity features)
- Value-based pricing for AI and analytics features

## Risk Assessment

### High Risk
- Large competitor response (Salesforce, HubSpot copying features)
- Economic downturn affecting SMB segment
- Technical execution challenges

### Medium Risk
- Customer education on GTD methodology
- Integration complexity with existing tools
- Talent acquisition and retention

### Mitigation Strategies
- Focus on superior user experience
- Build strong community and network effects
- Continuous innovation in AI and productivity
- Strategic partnerships and integrations

## Success Metrics

### Customer Acquisition
- Monthly active users
- Conversion rate from free to paid
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

### Product-Market Fit
- Net Promoter Score (NPS)
- Feature usage analytics
- Customer success metrics
- Churn rate and retention

### Business Performance
- Monthly recurring revenue (MRR)
- Gross margin
- Market share in target segments
- Brand awareness and perception

## Recommendations

1. **Focus on User Experience**: Prioritize simplicity and intuitiveness
2. **Invest in AI**: Develop proprietary AI capabilities for differentiation
3. **Build Community**: Create strong user community around productivity
4. **Content Strategy**: Educate market on GTD and productivity benefits
5. **Strategic Partnerships**: Integrate with popular productivity tools

---
**Research Methodology:** Online surveys (500 CRM users), expert interviews (15), competitive analysis, market reports

**Next Review:** Quarterly update scheduled for April 2024

**Prepared by:** Strategic Planning Team
**Date:** ${new Date().toISOString().split('T')[0]}
**Confidentiality:** Internal Use Only`,
        summary: 'In-depth competitive analysis of the CRM market with positioning strategy and recommendations',
        type: 'RESEARCH',
        status: 'PUBLISHED',
        tags: ['competitive-analysis', 'market-research', 'crm', 'strategy', 'positioning'],
        version: 1,
        authorId: users[0].id,
        folderId: folders[2].id,
        organizationId: organization.id
      }
    }),
    prisma.document.create({
      data: {
        title: 'Project Proposal Template',
        content: `# Project Proposal Template

Use this template to create comprehensive project proposals that align with our GTD methodology and business objectives.

## Project Overview

### Project Name
[Insert descriptive project name]

### Project Purpose
**Why are we doing this project?**
[Clearly state the business need or opportunity this project addresses]

### Success Vision
**What does success look like?**
[Describe the desired outcome in specific, measurable terms]

## Project Details

### Scope
**What's included:**
- [List what will be delivered]
- [Include specific features/components]
- [Define boundaries clearly]

**What's excluded:**
- [List what won't be included]
- [Clarify any assumptions]
- [Note future phase possibilities]

### Stakeholders
| Role | Name | Responsibilities |
|------|------|------------------|
| Project Sponsor | [Name] | [Approval authority, budget owner] |
| Project Manager | [Name] | [Day-to-day management, coordination] |
| Technical Lead | [Name] | [Technical decisions, architecture] |
| Key Users | [Names] | [Requirements, testing, adoption] |

### Timeline
| Phase | Duration | Key Deliverables | Dependencies |
|-------|----------|------------------|--------------|
| Discovery | [X weeks] | [Requirements, designs] | [Stakeholder availability] |
| Development | [X weeks] | [Core features, testing] | [Approved designs] |
| Deployment | [X weeks] | [Live system, training] | [Testing completion] |

## Business Case

### Problem Statement
[Describe the current pain points or opportunities in detail]

### Proposed Solution
[Explain how this project will address the problem]

### Expected Benefits
**Quantitative Benefits:**
- [Cost savings: $X per year]
- [Revenue increase: $X per year]
- [Efficiency gains: X% reduction in time]
- [Quality improvements: X% fewer errors]

**Qualitative Benefits:**
- [Improved user experience]
- [Better data insights]
- [Enhanced collaboration]
- [Reduced manual work]

### Return on Investment (ROI)
- **Total Investment:** $[Amount]
- **Annual Benefits:** $[Amount]
- **Payback Period:** [X months]
- **3-Year ROI:** [X%]

## Technical Approach

### High-Level Architecture
[Describe the technical approach and architecture]

### Technology Stack
- **Frontend:** [Technologies]
- **Backend:** [Technologies]
- **Database:** [Technologies]
- **Infrastructure:** [Technologies]

### Integration Requirements
- [List required integrations with existing systems]
- [Note any API dependencies]
- [Identify data migration needs]

### Security Considerations
- [Authentication and authorization]
- [Data protection measures]
- [Compliance requirements]

## Resource Requirements

### Team Structure
| Role | Time Commitment | Duration |
|------|----------------|----------|
| Project Manager | 50% | [X weeks] |
| Developer | 100% | [X weeks] |
| Designer | 25% | [X weeks] |
| QA Analyst | 50% | [X weeks] |

### Budget Breakdown
| Category | Cost |
|----------|------|
| Personnel | $[Amount] |
| Software/Licenses | $[Amount] |
| Infrastructure | $[Amount] |
| Training | $[Amount] |
| Contingency (10%) | $[Amount] |
| **Total** | **$[Amount]** |

## Risk Management

### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| [Risk description] | [High/Med/Low] | [High/Med/Low] | [How to prevent/address] |
| [Technical complexity] | Medium | High | [Proof of concept, expert consultation] |
| [Resource availability] | Low | Medium | [Cross-training, backup resources] |

### Assumptions and Dependencies
**Assumptions:**
- [List key assumptions about resources, technology, etc.]

**Dependencies:**
- [External dependencies that could impact timeline]
- [Other projects that must complete first]
- [Third-party deliverables]

## Success Metrics

### Key Performance Indicators (KPIs)
| Metric | Current State | Target | Measurement Method |
|--------|---------------|--------|--------------------|
| [User adoption] | [X%] | [Y%] | [Analytics tracking] |
| [Performance] | [X seconds] | [Y seconds] | [Automated monitoring] |
| [Accuracy] | [X%] | [Y%] | [Quality metrics] |

### Acceptance Criteria
- [ ] [Specific acceptance criterion]
- [ ] [Performance benchmark met]
- [ ] [User training completed]
- [ ] [Documentation delivered]
- [ ] [Security review passed]

## Next Steps

### Immediate Actions (Next 2 weeks)
1. [ ] [Get stakeholder approval]
2. [ ] [Finalize team assignments]
3. [ ] [Set up project infrastructure]
4. [ ] [Schedule kickoff meeting]

### Project Kickoff
- **Date:** [TBD based on approval]
- **Duration:** [2 hours]
- **Attendees:** [All team members and key stakeholders]
- **Agenda:** [Project overview, roles, communication plan]

## Approval

### Sign-off Required From:
- [ ] Project Sponsor: _________________ Date: _______
- [ ] Technical Lead: _________________ Date: _______
- [ ] Budget Owner: _________________ Date: _______

### Questions or Concerns?
Contact the project manager [Name] at [email] or schedule a meeting to discuss any aspects of this proposal.

---

**Template Version:** 2.0
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Created By:** Strategic Planning Team

*This template aligns with our GTD methodology by ensuring clear purpose, vision, and next actions are defined before project initiation.*`,
        summary: 'Comprehensive template for creating project proposals aligned with GTD methodology',
        type: 'TEMPLATE',
        status: 'PUBLISHED',
        tags: ['template', 'project-management', 'proposal', 'gtd', 'planning'],
        isTemplate: true,
        version: 2,
        authorId: users[1].id,
        folderId: folders[3].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${documents.length} documents`);

  // Create Document Links (knowledge graph connections)
  const documentLinks = await Promise.all([
    prisma.documentLink.create({
      data: {
        type: 'REFERENCE',
        strength: 0.8,
        sourceDocumentId: documents[0].id, // Requirements Doc
        targetDocumentId: documents[2].id  // Competitive Analysis
      }
    }),
    prisma.documentLink.create({
      data: {
        type: 'RELATED',
        strength: 0.6,
        sourceDocumentId: documents[1].id, // Meeting Notes
        targetDocumentId: documents[0].id  // Requirements Doc
      }
    }),
    prisma.documentLink.create({
      data: {
        type: 'PREREQUISITE',
        strength: 0.9,
        sourceDocumentId: documents[3].id, // Template
        targetDocumentId: documents[0].id  // Requirements Doc
      }
    })
  ]);

  console.log(`✅ Created ${documentLinks.length} document links`);

  // Create Wiki Page Links
  const wikiPageLinks = await Promise.all([
    prisma.wikiPageLink.create({
      data: {
        linkText: 'getting started guide',
        sourcePageId: wikiPages[0].id, // Welcome page
        targetPageId: wikiPages[1].id  // Getting Started
      }
    }),
    prisma.wikiPageLink.create({
      data: {
        linkText: 'GTD methodology',
        sourcePageId: wikiPages[0].id, // Welcome page
        targetPageId: wikiPages[2].id  // GTD Deep Dive
      }
    }),
    prisma.wikiPageLink.create({
      data: {
        linkText: 'API documentation',
        sourcePageId: wikiPages[0].id, // Welcome page
        targetPageId: wikiPages[3].id  // API Docs
      }
    })
  ]);

  console.log(`✅ Created ${wikiPageLinks.length} wiki page links`);

  // Create Document Comments
  const documentComments = await Promise.all([
    prisma.documentComment.create({
      data: {
        content: 'Great comprehensive analysis! The positioning strategy looks solid. Should we also consider integration with existing productivity tools as a differentiator?',
        documentId: documents[2].id,
        authorId: users[1].id
      }
    }),
    prisma.documentComment.create({
      data: {
        content: 'The timeline seems aggressive for Phase 1. Have we considered the complexity of implementing the AI features alongside the core GTD functionality?',
        documentId: documents[0].id,
        authorId: users[2].id
      }
    }),
    prisma.documentComment.create({
      data: {
        content: 'This template is very thorough. One suggestion: add a section for post-project evaluation metrics to ensure we\'re learning from each project.',
        documentId: documents[3].id,
        authorId: users[0].id
      }
    })
  ]);

  // Create replies to comments
  const commentReplies = await Promise.all([
    prisma.documentComment.create({
      data: {
        content: 'Excellent point! I\'ll add a section on integration strategy. We should definitely highlight our ability to work with tools like Todoist, Notion, and Slack.',
        documentId: documents[2].id,
        authorId: users[0].id,
        parentId: documentComments[0].id
      }
    }),
    prisma.documentComment.create({
      data: {
        content: 'You\'re right about the complexity. Let\'s break down Phase 1 into 1a (Core GTD) and 1b (Basic AI). The AI recommendations could be a Phase 2 feature.',
        documentId: documents[0].id,
        authorId: users[0].id,
        parentId: documentComments[1].id
      }
    })
  ]);

  console.log(`✅ Created ${documentComments.length} comments and ${commentReplies.length} replies`);

  // Create Document Shares
  const documentShares = await Promise.all([
    prisma.documentShare.create({
      data: {
        permission: 'READ',
        documentId: documents[0].id,
        sharedWithId: users[2].id,
        sharedById: users[0].id
      }
    }),
    prisma.documentShare.create({
      data: {
        permission: 'COMMENT',
        documentId: documents[2].id,
        sharedWithId: users[1].id,
        sharedById: users[0].id
      }
    }),
    prisma.documentShare.create({
      data: {
        permission: 'EDIT',
        documentId: documents[3].id,
        sharedWithId: users[2].id,
        sharedById: users[1].id
      }
    })
  ]);

  console.log(`✅ Created ${documentShares.length} document shares`);

  // Create Search Index entries
  const searchEntries = await Promise.all([
    ...documents.map(doc => 
      prisma.searchIndex.create({
        data: {
          entityType: 'document',
          entityId: doc.id,
          title: doc.title,
          content: doc.content + ' ' + (doc.summary || ''),
          organizationId: organization.id
        }
      })
    ),
    ...wikiPages.map(page => 
      prisma.searchIndex.create({
        data: {
          entityType: 'wiki_page',
          entityId: page.id,
          title: page.title,
          content: page.content + ' ' + (page.summary || ''),
          organizationId: organization.id
        }
      })
    )
  ]);

  console.log(`✅ Created ${searchEntries.length} search index entries`);

  console.log('📚 Knowledge Management System seeded successfully!');
  console.log(`   • ${wikiCategories.length} wiki categories`);
  console.log(`   • ${folders.length + subfolders.length} folders (with hierarchy)`);
  console.log(`   • ${wikiPages.length} wiki pages with cross-links`);
  console.log(`   • ${documents.length} documents with rich content`);
  console.log(`   • ${documentLinks.length} document knowledge graph links`);
  console.log(`   • ${wikiPageLinks.length} wiki page cross-references`);
  console.log(`   • ${documentComments.length + commentReplies.length} comments and discussions`);
  console.log(`   • ${documentShares.length} document sharing permissions`);
  console.log(`   • ${searchEntries.length} full-text search index entries`);
}

main()
  .catch((e) => {
    console.error('❌ Comprehensive seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });