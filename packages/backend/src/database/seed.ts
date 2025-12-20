import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import logger from '../config/logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info('🌱 Starting database seed...');

    // Create demo organization
    const demoOrg = await prisma.organization.create({
      data: {
        id: uuidv4(),
        name: 'Demo Organization',
        slug: 'demo-org',
        settings: {
          theme: 'light',
          timezone: 'UTC',
          language: 'en',
        },
        limits: config.TIER_LIMITS.PROFESSIONAL, // Give demo org professional limits
      },
    });

    logger.info(`✅ Created demo organization: ${demoOrg.name}`);

    // Create demo subscription
    await prisma.subscription.create({
      data: {
        organizationId: demoOrg.id,
        plan: 'PROFESSIONAL',
        status: 'TRIAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
    });

    logger.info('✅ Created demo subscription');

    // Create demo users
    const passwordHash = await bcrypt.hash('Password123!', config.BCRYPT_ROUNDS);

    // Owner user
    const ownerUser = await prisma.user.create({
      data: {
        email: 'owner@demo.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Owner',
        role: 'OWNER',
        organizationId: demoOrg.id,
        emailVerified: true,
        isActive: true,
      },
    });

    // Admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Admin',
        role: 'ADMIN',
        organizationId: demoOrg.id,
        emailVerified: true,
        isActive: true,
      },
    });

    // Manager user
    const managerUser = await prisma.user.create({
      data: {
        email: 'manager@demo.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Manager',
        role: 'MANAGER',
        organizationId: demoOrg.id,
        emailVerified: true,
        isActive: true,
      },
    });

    // Member user
    const memberUser = await prisma.user.create({
      data: {
        email: 'member@demo.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Member',
        role: 'MEMBER',
        organizationId: demoOrg.id,
        emailVerified: true,
        isActive: true,
      },
    });

    logger.info('✅ Created demo users');

    // Create demo streams
    const productivityStream = await prisma.stream.create({
      data: {
        name: 'Personal Productivity',
        description: 'Tasks and projects related to personal productivity and efficiency',
        color: '#3B82F6',
        icon: '⚡',
        organizationId: demoOrg.id,
        createdById: ownerUser.id,
        status: 'ACTIVE',
      },
    });

    const workStream = await prisma.stream.create({
      data: {
        name: 'Work Projects',
        description: 'Professional projects and work-related tasks',
        color: '#10B981',
        icon: '💼',
        organizationId: demoOrg.id,
        createdById: adminUser.id,
        status: 'ACTIVE',
      },
    });

    const learningStream = await prisma.stream.create({
      data: {
        name: 'Learning & Development',
        description: 'Educational goals and skill development activities',
        color: '#8B5CF6',
        icon: '📚',
        organizationId: demoOrg.id,
        createdById: managerUser.id,
        status: 'ACTIVE',
      },
    });

    logger.info('✅ Created demo streams');

    // Create demo projects
    const projectAlpha = await prisma.project.create({
      data: {
        name: 'Project Alpha',
        description: 'Strategic initiative to improve customer onboarding',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        organizationId: demoOrg.id,
        createdById: adminUser.id,
        assignedToId: managerUser.id,
        streamId: workStream.id,
        smartScore: 85.5,
        smartAnalysis: {
          specific: { score: 90, notes: 'Clear objective defined' },
          measurable: { score: 85, notes: 'KPIs established' },
          achievable: { score: 80, notes: 'Resources allocated' },
          relevant: { score: 90, notes: 'Aligns with company goals' },
          timeBound: { score: 85, notes: 'Clear deadline set' },
        },
      },
    });

    const projectBeta = await prisma.project.create({
      data: {
        name: 'Project Beta',
        description: 'Implementation of new analytics dashboard',
        status: 'PLANNING',
        priority: 'MEDIUM',
        organizationId: demoOrg.id,
        createdById: ownerUser.id,
        assignedToId: adminUser.id,
        streamId: workStream.id,
        smartScore: 72.0,
      },
    });

    logger.info('✅ Created demo projects');

    // Create demo tasks
    const tasks = [
      {
        title: 'Define project requirements',
        description: 'Gather and document all functional and non-functional requirements',
        priority: 'HIGH',
        status: 'COMPLETED',
        projectId: projectAlpha.id,
        assignedToId: managerUser.id,
        context: '@computer',
        energy: 'HIGH',
        smartScore: 88.0,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Create wireframes for onboarding flow',
        description: 'Design user interface wireframes for the new onboarding process',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        projectId: projectAlpha.id,
        assignedToId: memberUser.id,
        context: '@design',
        energy: 'HIGH',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        smartScore: 82.5,
      },
      {
        title: 'Research analytics tools',
        description: 'Evaluate different analytics platforms for dashboard implementation',
        priority: 'MEDIUM',
        status: 'NEW',
        projectId: projectBeta.id,
        assignedToId: adminUser.id,
        context: '@research',
        energy: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        smartScore: 75.0,
      },
      {
        title: 'Review TypeScript best practices',
        description: 'Study advanced TypeScript patterns for better code quality',
        priority: 'LOW',
        status: 'NEW',
        streamId: learningStream.id,
        assignedToId: memberUser.id,
        context: '@learning',
        energy: 'MEDIUM',
        smartScore: 70.0,
      },
      {
        title: 'Schedule team standup meetings',
        description: 'Organize weekly standup meetings for better team coordination',
        priority: 'MEDIUM',
        status: 'WAITING',
        streamId: productivityStream.id,
        assignedToId: managerUser.id,
        context: '@phone',
        energy: 'LOW',
        isWaitingFor: true,
        waitingForNote: 'Waiting for team availability confirmation',
        smartScore: 65.5,
      },
    ];

    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          ...taskData,
          organizationId: demoOrg.id,
          createdById: ownerUser.id,
        },
      });
    }

    logger.info('✅ Created demo tasks');

    // Create demo contacts
    const contacts = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@client.com',
        phone: '+1-555-0101',
        company: 'Tech Solutions Inc',
        position: 'CTO',
        status: 'ACTIVE',
        source: 'referral',
        notes: 'Interested in our enterprise solutions',
        tags: ['enterprise', 'tech', 'decision-maker'],
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@startup.io',
        phone: '+1-555-0102',
        company: 'Innovation Startup',
        position: 'Founder',
        status: 'LEAD',
        source: 'website',
        notes: 'Looking for productivity tools for small team',
        tags: ['startup', 'founder', 'small-team'],
      },
      {
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@enterprise.com',
        phone: '+1-555-0103',
        company: 'Global Enterprise Corp',
        position: 'VP of Operations',
        status: 'CUSTOMER',
        source: 'conference',
        notes: 'Current customer, potential for expansion',
        tags: ['enterprise', 'customer', 'expansion'],
      },
    ];

    for (const contactData of contacts) {
      await prisma.contact.create({
        data: {
          ...contactData,
          organizationId: demoOrg.id,
        },
      });
    }

    logger.info('✅ Created demo contacts');

    // Create demo meetings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    await prisma.meeting.create({
      data: {
        title: 'Project Alpha Kickoff',
        description: 'Initial meeting to discuss project requirements and timeline',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour
        location: 'Conference Room A',
        agenda: 'Review requirements, assign roles, set timeline',
        status: 'SCHEDULED',
        organizationId: demoOrg.id,
        organizedById: adminUser.id,
      },
    });

    await prisma.meeting.create({
      data: {
        title: 'Client Demo Session',
        description: 'Demonstrate new features to potential enterprise client',
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 90 * 60 * 1000), // 1.5 hours
        meetingUrl: 'https://zoom.us/j/demo-session',
        agenda: 'Product demo, Q&A, discuss pricing',
        status: 'SCHEDULED',
        organizationId: demoOrg.id,
        organizedById: ownerUser.id,
      },
    });

    logger.info('✅ Created demo meetings');

    logger.info('🎉 Database seed completed successfully!');
    logger.info('');
    logger.info('Demo credentials:');
    logger.info('Owner: owner@demo.com / Password123!');
    logger.info('Admin: admin@demo.com / Password123!');
    logger.info('Manager: manager@demo.com / Password123!');
    logger.info('Member: member@demo.com / Password123!');
    logger.info('');

  } catch (error) {
    logger.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seed;