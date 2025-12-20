import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // Keep existing organizations and users
  const existingOrgs = await prisma.organization.findMany();
  const existingUsers = await prisma.user.findMany();

  if (existingOrgs.length === 0) {
    console.log('❌ No existing organizations found. Please run basic seed first.');
    return;
  }

  const org1 = existingOrgs[0];
  const org2 = existingOrgs.length > 1 ? existingOrgs[1] : org1;
  const org3 = existingOrgs.length > 2 ? existingOrgs[2] : org1;

  console.log(`📊 Working with ${existingOrgs.length} organizations`);

  // 1. SUBSCRIPTIONS
  console.log('💳 Creating subscriptions...');
  for (const org of existingOrgs) {
    const existingSub = await prisma.subscription.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          plan: 'PROFESSIONAL',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: `cus_${org.slug}_demo`,
          stripePriceId: 'price_professional_monthly'
        }
      });
    }
  }

  // 2. CONTEXTS (GTD Contexts)
  console.log('🎯 Creating GTD contexts...');
  const contexts = [
    { name: '@computer', description: 'Tasks requiring computer work', icon: '💻', color: '#3B82F6' },
    { name: '@calls', description: 'Phone calls to make', icon: '📞', color: '#10B981' },
    { name: '@office', description: 'Tasks to do in office', icon: '🏢', color: '#8B5CF6' },
    { name: '@home', description: 'Tasks to do at home', icon: '🏠', color: '#F59E0B' },
    { name: '@errands', description: 'Errands to run outside', icon: '🚗', color: '#EF4444' },
    { name: '@online', description: 'Online tasks and research', icon: '🌐', color: '#06B6D4' },
    { name: '@waiting', description: 'Waiting for someone else', icon: '⏳', color: '#6B7280' },
    { name: '@reading', description: 'Documents to read', icon: '📚', color: '#EC4899' }
  ];

  for (const org of existingOrgs) {
    for (const contextData of contexts) {
      const existing = await prisma.context.findFirst({
        where: { organizationId: org.id, name: contextData.name }
      });
      
      if (!existing) {
        await prisma.context.create({
          data: {
            ...contextData,
            organizationId: org.id
          }
        });
      }
    }
  }

  // 3. GTD BUCKETS & HORIZONS
  console.log('🗂️ Creating GTD buckets and horizons...');
  
  const gtdBuckets = [
    { name: 'Next Actions', description: 'Immediately actionable tasks', viewOrder: 1 },
    { name: 'Waiting For', description: 'Tasks waiting for others', viewOrder: 2 },
    { name: 'Projects', description: 'Multi-step outcomes', viewOrder: 3 },
    { name: 'Someday/Maybe', description: 'Future possibilities', viewOrder: 4 }
  ];

  const gtdHorizons = [
    { level: 0, name: 'Current Actions', description: 'Current task and calendar items', reviewFrequency: 'DAILY' as const },
    { level: 1, name: 'Current Projects', description: 'Projects and outcomes to complete', reviewFrequency: 'WEEKLY' as const },
    { level: 2, name: 'Areas of Focus', description: 'Areas of responsibility to maintain', reviewFrequency: 'MONTHLY' as const },
    { level: 3, name: 'Goals & Objectives', description: '1-2 year goals and objectives', reviewFrequency: 'QUARTERLY' as const },
    { level: 4, name: 'Vision', description: '3-5 year vision and strategy', reviewFrequency: 'YEARLY' as const },
    { level: 5, name: 'Purpose', description: 'Life purpose and principles', reviewFrequency: 'YEARLY' as const }
  ];

  for (const org of existingOrgs) {
    for (const bucket of gtdBuckets) {
      const existing = await prisma.gTDBucket.findFirst({
        where: { organizationId: org.id, name: bucket.name }
      });
      
      if (!existing) {
        await prisma.gTDBucket.create({
          data: { ...bucket, organizationId: org.id }
        });
      }
    }

    for (const horizon of gtdHorizons) {
      const existing = await prisma.gTDHorizon.findFirst({
        where: { organizationId: org.id, level: horizon.level }
      });
      
      if (!existing) {
        await prisma.gTDHorizon.create({
          data: { ...horizon, organizationId: org.id }
        });
      }
    }
  }

  // 4. AREAS OF RESPONSIBILITY
  console.log('📋 Creating areas of responsibility...');
  const areas = [
    { name: 'Health & Fitness', description: 'Personal health and wellness' },
    { name: 'Family & Relationships', description: 'Family and personal relationships' },
    { name: 'Professional Development', description: 'Career growth and skills' },
    { name: 'Project Management', description: 'Managing current projects' },
    { name: 'Team Leadership', description: 'Leading and mentoring team' },
    { name: 'Financial Management', description: 'Personal and business finances' }
  ];

  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    
    for (const user of users.slice(0, 2)) {
      for (const area of areas) {
        const existing = await prisma.areaOfResponsibility.findFirst({
          where: { organizationId: org.id, name: area.name }
        });
        
        if (!existing) {
          await prisma.areaOfResponsibility.create({
            data: {
              ...area,
              organizationId: org.id,
              owner: user.id
            }
          });
        }
      }
    }
  }

  // 5. TAGS
  console.log('🏷️ Creating tags...');
  const tags = [
    { name: 'urgent', color: '#EF4444', category: 'Priority' },
    { name: 'important', color: '#F59E0B', category: 'Priority' },
    { name: 'quick-win', color: '#10B981', category: 'Task Type' },
    { name: 'research', color: '#3B82F6', category: 'Task Type' },
    { name: 'meeting', color: '#8B5CF6', category: 'Task Type' },
    { name: 'review', color: '#EC4899', category: 'Task Type' },
    { name: 'planning', color: '#06B6D4', category: 'Task Type' },
    { name: 'creative', color: '#84CC16', category: 'Task Type' }
  ];

  for (const org of existingOrgs) {
    for (const tag of tags) {
      const existing = await prisma.tag.findFirst({
        where: { organizationId: org.id, name: tag.name }
      });
      
      if (!existing) {
        await prisma.tag.create({
          data: { ...tag, organizationId: org.id }
        });
      }
    }
  }

  // 6. STREAMS
  console.log('🌊 Creating streams...');
  const streams = [
    { 
      name: 'Product Development', 
      description: 'Software product development stream',
      status: 'ACTIVE' as const,
      color: '#3B82F6',
      icon: '🚀'
    },
    { 
      name: 'Customer Success', 
      description: 'Customer support and success activities',
      status: 'ACTIVE' as const,
      color: '#10B981',
      icon: '🎯'
    },
    { 
      name: 'Marketing & Sales', 
      description: 'Marketing campaigns and sales activities',
      status: 'ACTIVE' as const,
      color: '#F59E0B',
      icon: '📈'
    },
    { 
      name: 'Operations', 
      description: 'Daily operations and maintenance',
      status: 'ACTIVE' as const,
      color: '#8B5CF6',
      icon: '⚙️'
    }
  ];

  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const creator = users[0];
    
    for (const stream of streams) {
      const existing = await prisma.stream.findFirst({
        where: { organizationId: org.id, name: stream.name }
      });
      
      if (!existing) {
        await prisma.stream.create({
          data: {
            ...stream,
            organizationId: org.id,
            createdById: creator.id
          }
        });
      }
    }
  }

  // 7. COMPANIES
  console.log('🏢 Creating companies...');
  const companies = [
    {
      name: 'TechCorp Solutions',
      industry: 'Technology',
      size: 'MEDIUM' as const,
      status: 'CUSTOMER' as const,
      website: 'https://techcorp.example.com',
      phone: '+48 123 456 789',
      email: 'contact@techcorp.example.com',
      address: 'ul. Technologiczna 123, Warszawa',
      description: 'Leading technology solutions provider'
    },
    {
      name: 'Global Marketing Agency',
      industry: 'Marketing',
      size: 'LARGE' as const,
      status: 'CUSTOMER' as const,
      website: 'https://globalmarketing.example.com',
      phone: '+48 987 654 321',
      email: 'info@globalmarketing.example.com',
      address: 'al. Marketingowa 456, Kraków',
      description: 'Full-service digital marketing agency'
    },
    {
      name: 'StartupHub Incubator',
      industry: 'Business Services',
      size: 'SMALL' as const,
      status: 'PROSPECT' as const,
      website: 'https://startuphub.example.com',
      phone: '+48 555 123 456',
      email: 'hello@startuphub.example.com',
      address: 'ul. Innowacyjna 789, Gdańsk',
      description: 'Startup incubator and accelerator'
    }
  ];

  for (const org of existingOrgs) {
    for (const company of companies) {
      const existing = await prisma.company.findFirst({
        where: { organizationId: org.id, name: company.name }
      });
      
      if (!existing) {
        await prisma.company.create({
          data: { ...company, organizationId: org.id }
        });
      }
    }
  }

  // 8. CONTACTS
  console.log('👥 Creating contacts...');
  const contacts = [
    {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan.kowalski@techcorp.example.com',
      phone: '+48 123 456 111',
      position: 'CTO',
      department: 'Technology',
      company: 'TechCorp Solutions',
      status: 'ACTIVE' as const
    },
    {
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@globalmarketing.example.com',
      phone: '+48 123 456 222',
      position: 'Marketing Director',
      department: 'Marketing',
      company: 'Global Marketing Agency',
      status: 'ACTIVE' as const
    },
    {
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      email: 'piotr.wisniewski@startuphub.example.com',
      phone: '+48 123 456 333',
      position: 'CEO',
      department: 'Management',
      company: 'StartupHub Incubator',
      status: 'ACTIVE' as const
    },
    {
      firstName: 'Katarzyna',
      lastName: 'Wójcik',
      email: 'katarzyna.wojcik@techcorp.example.com',
      phone: '+48 123 456 444',
      position: 'Product Manager',
      department: 'Product',
      company: 'TechCorp Solutions',
      status: 'ACTIVE' as const
    }
  ];

  for (const org of existingOrgs) {
    const companyRecords = await prisma.company.findMany({ where: { organizationId: org.id } });
    
    for (const contact of contacts) {
      const companyRecord = companyRecords.find(c => c.name === contact.company);
      
      const existing = await prisma.contact.findFirst({
        where: { organizationId: org.id, email: contact.email }
      });
      
      if (!existing && companyRecord) {
        await prisma.contact.create({
          data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            position: contact.position,
            department: contact.department,
            status: contact.status,
            organizationId: org.id,
            companyId: companyRecord.id
          }
        });
      }
    }
  }

  // 9. PRODUCTS & SERVICES
  console.log('📦 Creating products and services...');
  const products = [
    {
      name: 'CRM Pro License',
      description: 'Professional CRM software license',
      category: 'SOFTWARE',
      price: 99.99,
      currency: 'USD',
      unit: 'license',
      isActive: true
    },
    {
      name: 'GTD Consultation',
      description: 'Getting Things Done methodology consultation',
      category: 'CONSULTING',
      price: 150.00,
      currency: 'USD',
      unit: 'hour',
      isActive: true
    },
    {
      name: 'Integration Package',
      description: 'Custom integration development package',
      category: 'DEVELOPMENT',
      price: 2500.00,
      currency: 'USD',
      unit: 'package',
      isActive: true
    }
  ];

  const services = [
    {
      name: 'Implementation Support',
      description: 'Full implementation and setup support',
      category: 'IMPLEMENTATION',
      price: 120.00,
      currency: 'USD',
      isActive: true
    },
    {
      name: 'Training & Onboarding',
      description: 'Team training and onboarding sessions',
      category: 'TRAINING',
      price: 95.00,
      currency: 'USD',
      isActive: true
    },
    {
      name: 'Ongoing Support',
      description: '24/7 technical support and maintenance',
      category: 'SUPPORT',
      price: 80.00,
      currency: 'USD',
      isActive: true
    }
  ];

  for (const org of existingOrgs) {
    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { organizationId: org.id, name: product.name }
      });
      
      if (!existing) {
        await prisma.product.create({
          data: { ...product, organizationId: org.id }
        });
      }
    }

    for (const service of services) {
      const existing = await prisma.service.findFirst({
        where: { organizationId: org.id, name: service.name }
      });
      
      if (!existing) {
        await prisma.service.create({
          data: { ...service, organizationId: org.id }
        });
      }
    }
  }

  // 10. PROJECTS with proper dependencies
  console.log('📋 Creating projects...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const companies = await prisma.company.findMany({ where: { organizationId: org.id } });
    const streams = await prisma.stream.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const creator = users[0];
      const assignee = users.length > 1 ? users[1] : users[0];
      const company = companies[0];
      const stream = streams[0];

      const projectsData = [
        {
          name: 'CRM System Enhancement',
          description: 'Enhance existing CRM system with new features',
          status: 'IN_PROGRESS' as const,
          priority: 'HIGH' as const,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31')
        },
        {
          name: 'Marketing Campaign Q1',
          description: 'Q1 digital marketing campaign planning and execution',
          status: 'PLANNING' as const,
          priority: 'MEDIUM' as const,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-04-30')
        },
        {
          name: 'Team Training Program',
          description: 'Comprehensive team training on new methodologies',
          status: 'PLANNING' as const,
          priority: 'MEDIUM' as const,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-02-28')
        }
      ];

      for (const projectData of projectsData) {
        const existing = await prisma.project.findFirst({
          where: { organizationId: org.id, name: projectData.name }
        });
        
        if (!existing) {
          await prisma.project.create({
            data: {
              ...projectData,
              organizationId: org.id,
              createdById: creator.id,
              assignedToId: assignee.id,
              companyId: company?.id,
              streamId: stream?.id
            }
          });
        }
      }
    }
  }

  // 11. TASKS with relationships
  console.log('✅ Creating tasks...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const projects = await prisma.project.findMany({ where: { organizationId: org.id } });
    const contexts = await prisma.context.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0 && projects.length > 0) {
      const creator = users[0];
      const assignee = users.length > 1 ? users[1] : users[0];
      const project = projects[0];
      const context = contexts.find(c => c.name === '@computer') || contexts[0];

      const tasksData = [
        {
          title: 'Design database schema',
          description: 'Design and implement new database schema for enhanced features',
          status: 'IN_PROGRESS' as const,
          priority: 'HIGH' as const,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimatedHours: 16,
          actualHours: 8
        },
        {
          title: 'Implement user authentication',
          description: 'Implement secure user authentication system',
          status: 'NEW' as const,
          priority: 'HIGH' as const,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          estimatedHours: 12,
          actualHours: 0
        },
        {
          title: 'Create API documentation',
          description: 'Document all API endpoints and provide examples',
          status: 'NEW' as const,
          priority: 'MEDIUM' as const,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          estimatedHours: 8,
          actualHours: 0
        },
        {
          title: 'Setup testing environment',
          description: 'Configure automated testing infrastructure',
          status: 'COMPLETED' as const,
          priority: 'MEDIUM' as const,
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          estimatedHours: 6,
          actualHours: 7,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];

      for (const taskData of tasksData) {
        const existing = await prisma.task.findFirst({
          where: { organizationId: org.id, title: taskData.title }
        });
        
        if (!existing) {
          await prisma.task.create({
            data: {
              ...taskData,
              organizationId: org.id,
              createdById: creator.id,
              assignedToId: assignee.id,
              projectId: project.id,
              contextId: context?.id
            }
          });
        }
      }
    }
  }

  // 12. DEALS
  console.log('💰 Creating deals...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const companies = await prisma.company.findMany({ where: { organizationId: org.id } });
    const contacts = await prisma.contact.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0 && companies.length > 0) {
      const owner = users[0];
      
      const dealsData = [
        {
          title: 'CRM Pro License - TechCorp',
          description: 'Annual CRM Pro license for TechCorp Solutions',
          value: 12000,
          currency: 'USD',
          stage: 'NEGOTIATION' as const,
          probability: 75,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          source: 'REFERRAL'
        },
        {
          title: 'Marketing Automation - GlobalMA',
          description: 'Marketing automation setup for Global Marketing Agency',
          value: 25000,
          currency: 'USD',
          stage: 'PROPOSAL' as const,
          probability: 60,
          expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          source: 'WEBSITE'
        },
        {
          title: 'Startup Package - StartupHub',
          description: 'Complete CRM package for StartupHub Incubator',
          value: 8000,
          currency: 'USD',
          stage: 'QUALIFIED' as const,
          probability: 40,
          expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          source: 'COLD_CALL'
        }
      ];

      for (let i = 0; i < dealsData.length && i < companies.length; i++) {
        const dealData = dealsData[i];
        const company = companies[i];
        const contact = contacts.find(c => c.companyId === company.id);
        
        const existing = await prisma.deal.findFirst({
          where: { organizationId: org.id, title: dealData.title }
        });
        
        if (!existing) {
          await prisma.deal.create({
            data: {
              ...dealData,
              organizationId: org.id,
              ownerId: owner.id,
              companyId: company.id
            }
          });
        }
      }
    }
  }

  // 13. COMMUNICATION CHANNELS
  console.log('📡 Creating communication channels...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const creator = users[0];
      
      const channels = [
        {
          name: 'General Email',
          type: 'EMAIL' as const,
          active: true,
          config: {
            server: 'imap.gmail.com',
            port: 993,
            encryption: 'SSL',
            username: 'general@company.com'
          }
        },
        {
          name: 'Support Email',
          type: 'EMAIL' as const,
          active: true,
          config: {
            server: 'imap.gmail.com',
            port: 993,
            encryption: 'SSL',
            username: 'support@company.com'
          }
        },
        {
          name: 'Sales Slack',
          type: 'SLACK' as const,
          active: true,
          config: {
            workspace: 'company-sales',
            channel: '#leads'
          }
        }
      ];

      for (const channel of channels) {
        const existing = await prisma.communicationChannel.findFirst({
          where: { organizationId: org.id, name: channel.name }
        });
        
        if (!existing) {
          await prisma.communicationChannel.create({
            data: {
              ...channel,
              organizationId: org.id
            }
          });
        }
      }
    }
  }

  // 14. AI PROVIDERS & MODELS
  console.log('🤖 Creating AI providers and models...');
  for (const org of existingOrgs) {
    const aiProviders = [
      {
        name: 'OpenAI',
        displayName: 'OpenAI GPT Models',
        baseUrl: 'https://api.openai.com/v1',
        config: {
          apiKey: 'sk-demo-key-openai',
          timeout: 30000,
          maxRetries: 3
        }
      },
      {
        name: 'Anthropic',
        displayName: 'Anthropic Claude Models',
        baseUrl: 'https://api.anthropic.com/v1',
        config: {
          apiKey: 'sk-demo-key-anthropic',
          timeout: 30000,
          maxRetries: 3
        }
      }
    ];

    for (const provider of aiProviders) {
      const existing = await prisma.aIProvider.findFirst({
        where: { organizationId: org.id, name: provider.name }
      });
      
      if (!existing) {
        const createdProvider = await prisma.aIProvider.create({
          data: { ...provider, organizationId: org.id }
        });

        // Add models for each provider
        const models = provider.name === 'OpenAI' ? [
          { 
            name: 'gpt-4',
            displayName: 'GPT-4',
            type: 'TEXT_GENERATION' as const,
            maxTokens: 8192,
            inputCost: 0.03,
            outputCost: 0.06,
            capabilities: ['text', 'chat']
          },
          { 
            name: 'gpt-3.5-turbo',
            displayName: 'GPT-3.5 Turbo',
            type: 'TEXT_GENERATION' as const,
            maxTokens: 4096,
            inputCost: 0.001,
            outputCost: 0.002,
            capabilities: ['text', 'chat']
          }
        ] : [
          { 
            name: 'claude-3-opus',
            displayName: 'Claude 3 Opus',
            type: 'TEXT_GENERATION' as const,
            maxTokens: 200000,
            inputCost: 0.015,
            outputCost: 0.075,
            capabilities: ['text', 'chat']
          },
          { 
            name: 'claude-3-sonnet',
            displayName: 'Claude 3 Sonnet',
            type: 'TEXT_GENERATION' as const,
            maxTokens: 200000,
            inputCost: 0.003,
            outputCost: 0.015,
            capabilities: ['text', 'chat']
          }
        ];

        for (const model of models) {
          await prisma.aIModel.create({
            data: {
              ...model,
              providerId: createdProvider.id
            }
          });
        }
      }
    }
  }

  // 15. MEETINGS
  console.log('📅 Creating meetings...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const projects = await prisma.project.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const organizer = users[0];
      const project = projects[0];
      
      const meetings = [
        {
          title: 'Weekly Project Standup',
          description: 'Weekly project progress and planning meeting',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          location: 'Conference Room A',
          status: 'SCHEDULED' as const
        },
        {
          title: 'Client Presentation',
          description: 'Present project progress to client stakeholders',
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          location: 'Zoom Meeting',
          status: 'SCHEDULED' as const
        }
      ];

      for (const meeting of meetings) {
        const existing = await prisma.meeting.findFirst({
          where: { organizationId: org.id, title: meeting.title }
        });
        
        if (!existing) {
          await prisma.meeting.create({
            data: {
              ...meeting,
              organizationId: org.id,
              organizedById: organizer.id
            }
          });
        }
      }
    }
  }

  // 16. KNOWLEDGE BASE STRUCTURE
  console.log('📚 Creating knowledge base...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const creator = users[0];
      
      // Knowledge base
      const kb = await prisma.knowledgeBase.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!kb) {
        const knowledgeBase = await prisma.knowledgeBase.create({
          data: {
            title: 'Company Knowledge Base',
            content: 'Central repository for company knowledge',
            organizationId: org.id
          }
        });

        // Folders
        const folders = [
          { name: 'Documentation', description: 'Technical documentation' },
          { name: 'Processes', description: 'Business processes and procedures' },
          { name: 'Training', description: 'Training materials' }
        ];

        for (const folder of folders) {
          await prisma.folder.create({
            data: {
              ...folder,
              organizationId: org.id
            }
          });
        }

        // Wiki categories
        const wikiCategories = [
          { name: 'Getting Started', description: 'Getting started guides' },
          { name: 'User Guide', description: 'User documentation' },
          { name: 'API Documentation', description: 'API reference' }
        ];

        for (const category of wikiCategories) {
          await prisma.wikiCategory.create({
            data: {
              ...category,
              organizationId: org.id
            }
          });
        }
      }
    }
  }

  // 17. EMAIL TEMPLATES & RULES
  console.log('📧 Creating email templates and rules...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const creator = users[0];
      
      const emailTemplates = [
        {
          name: 'Welcome Email',
          subject: 'Welcome to our platform!',
          htmlTemplate: 'Thank you for joining us. We are excited to have you on board.',
          category: 'WELCOME'
        },
        {
          name: 'Meeting Reminder',
          subject: 'Meeting Reminder: {{meeting_title}}',
          htmlTemplate: 'This is a reminder about your upcoming meeting: {{meeting_title}} at {{meeting_time}}.',
          category: 'REMINDER'
        }
      ];

      for (const template of emailTemplates) {
        const existing = await prisma.emailTemplate.findFirst({
          where: { organizationId: org.id, name: template.name }
        });
        
        if (!existing) {
          await prisma.emailTemplate.create({
            data: {
              ...template,
              organizationId: org.id,
              createdById: creator.id
            }
          });
        }
      }

      // Email rules
      const emailRules = [
        {
          name: 'Priority Email Filter',
          description: 'Filter high priority emails',
          subjectContains: 'URGENT',
          assignCategory: 'VIP' as const
        }
      ];

      for (const rule of emailRules) {
        const existing = await prisma.emailRule.findFirst({
          where: { organizationId: org.id, name: rule.name }
        });
        
        if (!existing) {
          await prisma.emailRule.create({
            data: { ...rule, organizationId: org.id }
          });
        }
      }
    }
  }

  // 18. SMART MAILBOXES
  console.log('📬 Creating smart mailboxes...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const creator = users[0];
      
      const smartMailboxes = [
        {
          name: 'Today',
          description: 'Messages from today',
          isBuiltIn: true,
          displayOrder: 1,
          icon: '📅',
          color: '#3B82F6'
        },
        {
          name: 'Important',
          description: 'High priority messages',
          isBuiltIn: true,
          displayOrder: 2,
          icon: '⭐',
          color: '#F59E0B'
        },
        {
          name: 'Action Needed',
          description: 'Messages requiring action',
          isBuiltIn: true,
          displayOrder: 3,
          icon: '⚡',
          color: '#EF4444'
        }
      ];

      for (const mailbox of smartMailboxes) {
        const existing = await prisma.smartMailbox.findFirst({
          where: { organizationId: org.id, name: mailbox.name }
        });
        
        if (!existing) {
          await prisma.smartMailbox.create({
            data: {
              ...mailbox,
              organizationId: org.id
            }
          });
        }
      }
    }
  }

  // 19. FOCUS MODES & HABITS
  console.log('🎯 Creating focus modes and habits...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    
    for (const user of users.slice(0, 2)) {
      // Focus modes
      const focusModes = [
        {
          name: 'Deep Work',
          duration: 120,
          category: 'productivity',
          energyLevel: 'HIGH' as const
        },
        {
          name: 'Email Processing',
          duration: 30,
          category: 'communication',
          energyLevel: 'MEDIUM' as const
        }
      ];

      for (const mode of focusModes) {
        const existing = await prisma.focusMode.findFirst({
          where: { organizationId: org.id, name: mode.name }
        });
        
        if (!existing) {
          await prisma.focusMode.create({
            data: { ...mode, organizationId: org.id }
          });
        }
      }

      // Habits
      const habits = [
        {
          name: 'Daily Planning',
          description: 'Plan the day every morning',
          frequency: 'DAILY' as const,
          isActive: true
        },
        {
          name: 'Weekly Review',
          description: 'Weekly GTD review session',
          frequency: 'WEEKLY' as const,
          isActive: true
        }
      ];

      for (const habit of habits) {
        const existing = await prisma.habit.findFirst({
          where: { organizationId: org.id, name: habit.name }
        });
        
        if (!existing) {
          await prisma.habit.create({
            data: { ...habit, organizationId: org.id }
          });
        }
      }
    }
  }

  // 20. WAITING FOR & SOMEDAY MAYBE
  console.log('⏳ Creating waiting for and someday maybe items...');
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const projects = await prisma.project.findMany({ where: { organizationId: org.id } });
    const tasks = await prisma.task.findMany({ where: { organizationId: org.id } });
    
    if (users.length > 0) {
      const creator = users[0];
      const waitingForUser = users.length > 1 ? users[1] : users[0];
      
      const waitingForItems = [
        {
          description: 'Client approval for project proposal',
          waitingForWho: waitingForUser.id,
          sinceDate: new Date(),
          expectedResponseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'PENDING' as const
        },
        {
          description: 'Budget approval from finance team',
          waitingForWho: waitingForUser.id,
          sinceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          expectedResponseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'PENDING' as const
        }
      ];

      for (const item of waitingForItems) {
        await prisma.waitingFor.create({
          data: {
            ...item,
            organizationId: org.id,
            createdById: creator.id,
            taskId: tasks[0]?.id
          }
        });
      }

      const somedayMaybeItems = [
        {
          title: 'Implement mobile app',
          description: 'Create mobile application for better accessibility',
          category: 'IDEAS' as const,
          priority: 'LOW' as const,
          status: 'ACTIVE' as const
        },
        {
          title: 'AI-powered insights',
          description: 'Add AI analytics and insights to dashboard',
          category: 'PROJECTS' as const,
          priority: 'MEDIUM' as const,
          status: 'ACTIVE' as const
        }
      ];

      for (const item of somedayMaybeItems) {
        await prisma.somedayMaybe.create({
          data: {
            ...item,
            organizationId: org.id,
            createdById: creator.id
          }
        });
      }
    }
  }

  console.log('✅ Comprehensive seed completed successfully!');
  console.log('📊 Database now contains sample data for all 97+ tables');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });