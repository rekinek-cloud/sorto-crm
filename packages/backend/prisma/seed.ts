import { PrismaClient, UserRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

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

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.OWNER,
      organizationId: organization.id,
      emailVerified: true,
      settings: {
        theme: 'light',
        notifications: true,
        defaultView: 'dashboard'
      }
    }
  });

  console.log(`✅ Demo user created: ${user.email}`);

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
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    }
  });

  console.log('✅ Subscription created');

  // Create default GTD Contexts
  const contexts = [
    { name: '@computer', description: 'Tasks requiring a computer', color: '#3B82F6', icon: '💻' },
    { name: '@phone', description: 'Phone calls to make', color: '#10B981', icon: '📞' },
    { name: '@errands', description: 'Tasks to do while out', color: '#F59E0B', icon: '🏃' },
    { name: '@home', description: 'Tasks to do at home', color: '#8B5CF6', icon: '🏠' },
    { name: '@office', description: 'Tasks to do at the office', color: '#EF4444', icon: '🏢' },
    { name: '@agenda', description: 'Items for meetings/discussions', color: '#6B7280', icon: '📋' },
    { name: '@waiting', description: 'Waiting for someone else', color: '#F97316', icon: '⏳' },
    { name: '@someday', description: 'Someday/maybe items', color: '#84CC16', icon: '🌅' }
  ];

  for (const contextData of contexts) {
    await prisma.context.upsert({
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
  }

  console.log('✅ GTD Contexts created');

  // Create sample Stream
  const stream = await prisma.stream.upsert({
    where: { id: 'demo-stream-1' },
    update: {},
    create: {
      id: 'demo-stream-1',
      name: 'Product Development',
      description: 'Main product development stream',
      color: '#3B82F6',
      icon: '🚀',
      organizationId: organization.id,
      createdById: user.id,
      settings: {
        autoArchive: false,
        defaultPriority: 'MEDIUM'
      }
    }
  });

  console.log('✅ Sample stream created');

  // Create sample Project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'MVP Launch',
      description: 'Launch the minimum viable product',
      organizationId: organization.id,
      createdById: user.id,
      streamId: stream.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      smartScore: 85.5,
      smartAnalysis: {
        specific: { score: 90, feedback: 'Clear and specific goal' },
        measurable: { score: 85, feedback: 'Success criteria defined' },
        achievable: { score: 80, feedback: 'Realistic with current resources' },
        relevant: { score: 90, feedback: 'Aligned with business objectives' },
        timeBound: { score: 85, feedback: 'Clear deadline set' }
      }
    }
  });

  console.log('✅ Sample project created');

  // Create sample Tasks
  const computerContext = await prisma.context.findFirst({
    where: { name: '@computer', organizationId: organization.id }
  });

  const tasks = [
    {
      title: 'Set up development environment',
      description: 'Configure local development tools and dependencies',
      priority: 'HIGH' as const,
      contextId: computerContext?.id,
      projectId: project.id,
      estimatedHours: 4
    },
    {
      title: 'Design user interface mockups',
      description: 'Create wireframes and UI designs for main features',
      priority: 'MEDIUM' as const,
      contextId: computerContext?.id,
      projectId: project.id,
      estimatedHours: 8
    },
    {
      title: 'Implement authentication system',
      description: 'Build login, registration, and JWT handling',
      priority: 'HIGH' as const,
      contextId: computerContext?.id,
      projectId: project.id,
      estimatedHours: 12
    }
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        organizationId: organization.id,
        createdById: user.id,
        streamId: stream.id
      }
    });
  }

  console.log('✅ Sample tasks created');

  // Create sample CRM data
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      website: 'https://acme.com',
      industry: 'Technology',
      size: 'MEDIUM',
      description: 'Leading technology solutions provider',
      organizationId: organization.id
    }
  });

  const contact = await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@acme.com',
      phone: '+1-555-0123',
      company: company.name,
      position: 'CTO',
      organizationId: organization.id
    }
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { primaryContactId: contact.id }
  });

  await prisma.deal.create({
    data: {
      title: 'Enterprise License Deal',
      description: 'Annual enterprise license for CRM-GTD platform',
      value: 50000,
      stage: 'QUALIFIED',
      probability: 0.7,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      companyId: company.id,
      ownerId: user.id,
      organizationId: organization.id
    }
  });

  console.log('✅ Sample CRM data created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });