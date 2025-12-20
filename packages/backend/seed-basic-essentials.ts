import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Wypełnianie podstawowych tabel danymi...');

  try {
    // 1. Organizations 
    console.log('📊 1. Organizations...');
    await prisma.organization.createMany({
      data: [
        {
          id: 'org-2',
          name: 'Marketing Pro Sp. z o.o.',
          slug: 'marketing-pro',
          domain: 'marketingpro.pl',
          settings: { max_users: 25, features: ['ai_rules', 'smart_mailboxes'] },
          limits: { max_users: 25, max_streams: 15 }
        },
        {
          id: 'org-3', 
          name: 'Enterprise Solutions Ltd',
          slug: 'enterprise-solutions',
          domain: 'enterprise.com',
          settings: { max_users: -1, features: ['all_features'] },
          limits: { max_users: -1, max_streams: -1 }
        },
        {
          id: 'org-4',
          name: 'Startup Innovations',
          slug: 'startup-innovations', 
          domain: 'startup.io',
          settings: { max_users: 5 },
          limits: { max_users: 5, max_streams: 3 }
        }
      ],
      skipDuplicates: true
    });

    // 2. Users
    console.log('👥 2. Users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    await prisma.user.createMany({
      data: [
        {
          id: 'user-5',
          email: 'admin@marketingpro.pl',
          firstName: 'Magdalena',
          lastName: 'Zielińska',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          organizationId: 'org-2'
        },
        {
          id: 'user-6',
          email: 'manager@enterprise.com',
          firstName: 'Robert',
          lastName: 'Johnson',
          passwordHash: hashedPassword,
          role: 'MANAGER',
          organizationId: 'org-3'
        },
        {
          id: 'user-7',
          email: 'user@startup.io',
          firstName: 'Sofia',
          lastName: 'Rodriguez',
          passwordHash: hashedPassword,
          role: 'MEMBER',
          organizationId: 'org-4',
          isActive: false
        },
        {
          id: 'user-8',
          email: 'analyst@marketingpro.pl',
          firstName: 'Paweł',
          lastName: 'Górski',
          passwordHash: hashedPassword,
          role: 'MEMBER',
          organizationId: 'org-2'
        }
      ],
      skipDuplicates: true
    });

    // 3. Contacts
    console.log('📞 3. Contacts...');
    await prisma.contact.createMany({
      data: [
        {
          id: 'contact-2',
          firstName: 'Jan',
          lastName: 'Kowalczyk',
          email: 'jan.kowalczyk@example.com',
          phone: '+48 555 123 456',
          company: 'ABC Marketing',
          position: 'Marketing Director',
          organizationId: 'org-2',
          status: 'ACTIVE',
          source: 'LINKEDIN',
          tags: ['marketing', 'director']
        },
        {
          id: 'contact-3',
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria@globaltech.com',
          phone: '+1 555 987 654',
          company: 'GlobalTech Inc',
          position: 'CEO',
          organizationId: 'org-2',
          status: 'ACTIVE',
          source: 'REFERRAL'
        },
        {
          id: 'contact-4',
          firstName: 'Ahmed',
          lastName: 'Hassan',
          email: 'ahmed@techstartup.ae',
          phone: '+971 50 123 4567',
          company: 'TechStartup Dubai',
          position: 'CTO',
          organizationId: 'org-3',
          status: 'LEAD',
          source: 'CONFERENCE',
          tags: ['fintech', 'cto']
        },
        {
          id: 'contact-5',
          firstName: 'Linda',
          lastName: 'Nielsen',
          email: 'linda@nordic.no',
          phone: '+47 900 12345',
          company: 'Nordic Solutions',
          position: 'Project Manager',
          organizationId: 'org-2',
          status: 'INACTIVE',
          source: 'WEBSITE',
          tags: ['consulting']
        }
      ],
      skipDuplicates: true
    });

    // 4. Companies
    console.log('🏢 4. Companies...');
    await prisma.company.createMany({
      data: [
        {
          id: 'comp-2',
          name: 'GlobalTech Inc',
          website: 'https://globaltech.com',
          industry: 'Software Development',
          organizationId: 'org-2',
          status: 'ACTIVE',
          description: 'Leading global technology solutions provider'
        },
        {
          id: 'comp-3',
          name: 'TechStartup Dubai',
          website: 'https://techstartup.ae',
          industry: 'FinTech',
          organizationId: 'org-3',
          status: 'LEAD',
          description: 'Innovative financial technology startup'
        },
        {
          id: 'comp-4',
          name: 'Nordic Solutions AS',
          website: 'https://nordic.no',
          industry: 'Consulting',
          organizationId: 'org-2',
          status: 'CUSTOMER',
          description: 'Nordic consulting and advisory services'
        },
        {
          id: 'comp-5',
          name: 'Local Services Ltd',
          industry: 'Services',
          organizationId: 'org-4',
          status: 'INACTIVE',
          description: 'Local business services provider'
        }
      ],
      skipDuplicates: true
    });

    // 5. Projects
    console.log('📂 5. Projects...');
    await prisma.project.createMany({
      data: [
        {
          id: 'proj-2',
          name: 'GlobalTech CRM Integration',
          description: 'Integration of CRM system with GlobalTech infrastructure',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          organizationId: 'org-2',
          managerId: 'user-5',
          companyId: 'comp-2',
          progress: 45,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-30')
        },
        {
          id: 'proj-3',
          name: 'FinTech Mobile App',
          description: 'Development of mobile application for financial services',
          status: 'PLANNING',
          priority: 'URGENT',
          organizationId: 'org-3',
          managerId: 'user-6',
          companyId: 'comp-3',
          progress: 10,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-12-31')
        },
        {
          id: 'proj-4',
          name: 'Nordic Consulting Platform',
          description: 'Custom consulting platform for Nordic clients',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          organizationId: 'org-2',
          managerId: 'user-5',
          companyId: 'comp-4',
          progress: 100,
          startDate: new Date('2023-10-01'),
          endDate: new Date('2024-02-28')
        },
        {
          id: 'proj-5',
          name: 'Startup MVP Development',
          description: 'Minimum viable product for startup launch',
          status: 'ON_HOLD',
          priority: 'LOW',
          organizationId: 'org-4',
          managerId: 'user-7',
          progress: 25,
          startDate: new Date('2024-02-01')
        }
      ],
      skipDuplicates: true
    });

    // 6. Tasks
    console.log('✅ 6. Tasks...');
    await prisma.task.createMany({
      data: [
        {
          id: 'task-4',
          title: 'API Documentation Review',
          description: 'Review and update API documentation for GlobalTech integration',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          organizationId: 'org-2',
          assignedToId: 'user-5',
          projectId: 'proj-2',
          dueDate: new Date('2024-07-15'),
          context: '@computer',
          energy: 'MEDIUM'
        },
        {
          id: 'task-5',
          title: 'Client Meeting Preparation',
          description: 'Prepare materials for upcoming client presentation',
          status: 'NEW',
          priority: 'URGENT',
          organizationId: 'org-3',
          assignedToId: 'user-6',
          projectId: 'proj-3',
          dueDate: new Date('2024-07-02'),
          context: '@office',
          energy: 'HIGH'
        },
        {
          id: 'task-6',
          title: 'Code Review',
          description: 'Review pull requests for mobile app features',
          status: 'WAITING',
          priority: 'MEDIUM',
          organizationId: 'org-3',
          assignedToId: 'user-6',
          projectId: 'proj-3',
          context: '@computer',
          energy: 'HIGH'
        },
        {
          id: 'task-7',
          title: 'Database Migration',
          description: 'Migrate legacy data to new system',
          status: 'COMPLETED',
          priority: 'HIGH',
          organizationId: 'org-2',
          assignedToId: 'user-5',
          projectId: 'proj-4',
          completedAt: new Date('2024-06-25'),
          context: '@computer',
          energy: 'LOW'
        }
      ],
      skipDuplicates: true
    });

    // 7. Deals
    console.log('💼 7. Deals...');
    await prisma.deal.createMany({
      data: [
        {
          id: 'deal-2',
          title: 'GlobalTech Enterprise License',
          value: 150000.00,
          stage: 'NEGOTIATION',
          probability: 75,
          organizationId: 'org-2',
          assignedToId: 'user-5',
          companyId: 'comp-2',
          contactId: 'contact-3',
          expectedCloseDate: new Date('2024-08-15'),
          description: 'Enterprise software license deal with GlobalTech',
          source: 'INBOUND'
        },
        {
          id: 'deal-3',
          title: 'FinTech Development Contract',
          value: 250000.00,
          stage: 'PROPOSAL',
          probability: 60,
          organizationId: 'org-3',
          assignedToId: 'user-6',
          companyId: 'comp-3',
          contactId: 'contact-4',
          expectedCloseDate: new Date('2024-09-30'),
          description: 'Custom development contract for FinTech platform',
          source: 'REFERRAL'
        },
        {
          id: 'deal-4',
          title: 'Nordic Consulting Services',
          value: 80000.00,
          stage: 'CLOSED_WON',
          probability: 100,
          organizationId: 'org-2',
          assignedToId: 'user-5',
          companyId: 'comp-4',
          contactId: 'contact-5',
          closedDate: new Date('2024-02-28'),
          description: 'Consulting services contract successfully closed',
          source: 'OUTBOUND'
        },
        {
          id: 'deal-5',
          title: 'Startup MVP Package',
          value: 35000.00,
          stage: 'CLOSED_LOST',
          probability: 0,
          organizationId: 'org-4',
          assignedToId: 'user-7',
          closedDate: new Date('2024-06-15'),
          description: 'MVP development package - lost to competitor',
          source: 'WEBSITE',
          lostReason: 'Price too high'
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Podstawowe tabele wypełnione pomyślnie!');
    console.log('📊 Stan tabel:');
    
    const counts = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.deal.count()
    ]);

    console.log(`- Organizations: ${counts[0]}`);
    console.log(`- Users: ${counts[1]}`);
    console.log(`- Contacts: ${counts[2]}`);
    console.log(`- Companies: ${counts[3]}`);
    console.log(`- Projects: ${counts[4]}`);
    console.log(`- Tasks: ${counts[5]}`);
    console.log(`- Deals: ${counts[6]}`);

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania tabel:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });