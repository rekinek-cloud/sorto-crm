import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Rozpoczynanie wypełniania WSZYSTKICH 97 tabel...');

  try {
    // 1. Organizations (rozszerzone)
    console.log('📊 1. Organizations...');
    await prisma.organization.createMany({
      data: [
        {
          id: 'org-2',
          name: 'Marketing Pro Sp. z o.o.',
          slug: 'marketing-pro',
          domain: 'marketingpro.pl',
          settings: {
            max_users: 25,
            max_streams: 15,
            features: ['ai_rules', 'smart_mailboxes', 'voice_tts']
          },
          limits: {
            max_users: 25,
            max_streams: 15
          }
        },
        {
          id: 'org-3', 
          name: 'Enterprise Solutions Ltd',
          slug: 'enterprise-solutions',
          domain: 'enterprise.com',
          settings: {
            max_users: -1,
            max_streams: -1,
            features: ['all_features']
          },
          limits: {
            max_users: -1,
            max_streams: -1
          }
        },
        {
          id: 'org-4',
          name: 'Startup Innovations',
          slug: 'startup-innovations', 
          domain: 'startup.io',
          settings: {
            max_users: 5,
            max_streams: 3
          },
          limits: {
            max_users: 5,
            max_streams: 3
          }
        }
      ],
      skipDuplicates: true
    });

    // 2. Users (rozszerzone)
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
          organizationId: 'org-2',
          isActive: true,
          settings: { language: 'pl', timezone: 'Europe/Warsaw' }
        },
        {
          id: 'user-6',
          email: 'manager@enterprise.com',
          firstName: 'Robert',
          lastName: 'Johnson',
          passwordHash: hashedPassword,
          role: 'MANAGER',
          organizationId: 'org-3',
          isActive: true,
          settings: { language: 'en', timezone: 'America/New_York' }
        },
        {
          id: 'user-7',
          email: 'user@startup.io',
          firstName: 'Sofia',
          lastName: 'Rodriguez',
          passwordHash: hashedPassword,
          role: 'MEMBER',
          organizationId: 'org-4',
          isActive: false,
          settings: { language: 'es', timezone: 'Europe/Madrid' }
        },
        {
          id: 'user-8',
          email: 'analyst@marketingpro.pl',
          firstName: 'Paweł',
          lastName: 'Górski',
          passwordHash: hashedPassword,
          role: 'MEMBER',
          organizationId: 'org-2',
          isActive: true,
          settings: { language: 'pl', timezone: 'Europe/Warsaw' }
        }
      ],
      skipDuplicates: true
    });

    // 3. Contacts (rozszerzone)
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
          organizationId: 'org-1',
          status: 'ACTIVE',
          source: 'LINKEDIN',
          tags: JSON.stringify(['marketing', 'director']),
          address: JSON.stringify({
            street: 'ul. Główna 10',
            city: 'Warszawa',
            country: 'Poland'
          })
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
          status: 'PROSPECT',
          source: 'CONFERENCE'
        },
        {
          id: 'contact-5',
          firstName: 'Linda',
          lastName: 'Nielsen',
          email: 'linda@nordic.no',
          phone: '+47 900 12345',
          company: 'Nordic Solutions',
          position: 'Project Manager',
          organizationId: 'org-1',
          status: 'INACTIVE',
          source: 'WEBSITE'
        }
      ],
      skipDuplicates: true
    });

    // 4. Companies (rozszerzone)
    console.log('🏢 4. Companies...');
    await prisma.company.createMany({
      data: [
        {
          id: 'comp-2',
          name: 'GlobalTech Inc',
          website: 'https://globaltech.com',
          industry: 'Software Development',
          size: 'LARGE',
          type: 'CORPORATION',
          organizationId: 'org-2',
          status: 'ACTIVE',
          address: JSON.stringify({
            street: '123 Tech Street',
            city: 'San Francisco',
            country: 'USA',
            postalCode: '94102'
          }),
          description: 'Leading global technology solutions provider'
        },
        {
          id: 'comp-3',
          name: 'TechStartup Dubai',
          website: 'https://techstartup.ae',
          industry: 'FinTech',
          size: 'STARTUP',
          type: 'LLC',
          organizationId: 'org-3',
          status: 'PROSPECT',
          description: 'Innovative financial technology startup'
        },
        {
          id: 'comp-4',
          name: 'Nordic Solutions AS',
          website: 'https://nordic.no',
          industry: 'Consulting',
          size: 'MEDIUM',
          type: 'PARTNERSHIP',
          organizationId: 'org-1',
          status: 'CUSTOMER',
          description: 'Nordic consulting and advisory services'
        },
        {
          id: 'comp-5',
          name: 'Local Services Ltd',
          industry: 'Services',
          size: 'SMALL',
          type: 'LTD',
          organizationId: 'org-4',
          status: 'INACTIVE',
          description: 'Local business services provider'
        }
      ],
      skipDuplicates: true
    });

    // 5. Projects (rozszerzone)
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
          budget: 75000.00,
          progress: 45,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-30'),
          estimatedHours: 800
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
          budget: 120000.00,
          progress: 10,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-12-31'),
          estimatedHours: 1200
        },
        {
          id: 'proj-4',
          name: 'Nordic Consulting Platform',
          description: 'Custom consulting platform for Nordic clients',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          organizationId: 'org-1',
          managerId: 'user-1',
          companyId: 'comp-4',
          budget: 45000.00,
          progress: 100,
          startDate: new Date('2023-10-01'),
          endDate: new Date('2024-02-28'),
          estimatedHours: 600
        },
        {
          id: 'proj-5',
          name: 'Startup MVP Development',
          description: 'Minimum viable product for startup launch',
          status: 'ON_HOLD',
          priority: 'LOW',
          organizationId: 'org-4',
          managerId: 'user-7',
          budget: 25000.00,
          progress: 25,
          startDate: new Date('2024-02-01'),
          estimatedHours: 400
        }
      ],
      skipDuplicates: true
    });

    // 6. Tasks (rozszerzone)
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
          estimatedTime: '4 hours',
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
          estimatedTime: '2 hours',
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
          estimatedTime: '3 hours',
          context: '@computer',
          energy: 'HIGH'
        },
        {
          id: 'task-7',
          title: 'Database Migration',
          description: 'Migrate legacy data to new system',
          status: 'COMPLETED',
          priority: 'HIGH',
          organizationId: 'org-1',
          assignedToId: 'user-1',
          projectId: 'proj-4',
          completedAt: new Date('2024-06-25'),
          estimatedTime: '6 hours',
          context: '@computer',
          energy: 'LOW'
        }
      ],
      skipDuplicates: true
    });

    // 7. Deals (rozszerzone) 
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
          source: 'INBOUND',
          lostReason: null
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
          source: 'REFERRAL',
          lostReason: null
        },
        {
          id: 'deal-4',
          title: 'Nordic Consulting Services',
          value: 80000.00,
          stage: 'CLOSED_WON',
          probability: 100,
          organizationId: 'org-1',
          assignedToId: 'user-1',
          companyId: 'comp-4',
          contactId: 'contact-5',
          closedDate: new Date('2024-02-28'),
          description: 'Consulting services contract successfully closed',
          source: 'OUTBOUND',
          lostReason: null
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

    // 8. Streams (rozszerzone)
    console.log('🌊 8. Streams...');
    await prisma.stream.createMany({
      data: [
        {
          id: 'stream-2',
          name: 'Marketing Campaigns',
          description: 'Marketing and advertising campaign management',
          color: '#FF6B6B',
          icon: 'megaphone',
          organizationId: 'org-2',
          status: 'ACTIVE',
          priority: 'HIGH',
          settings: JSON.stringify({
            notifications: true,
            auto_assignment: false
          })
        },
        {
          id: 'stream-3', 
          name: 'Customer Support',
          description: 'Customer service and support tickets',
          color: '#4ECDC4',
          icon: 'headset',
          organizationId: 'org-3',
          status: 'ACTIVE',
          priority: 'URGENT',
          settings: JSON.stringify({
            sla_hours: 24,
            escalation: true
          })
        },
        {
          id: 'stream-4',
          name: 'Product Development',
          description: 'Product features and development tasks',
          color: '#45B7D1',
          icon: 'code',
          organizationId: 'org-1',
          status: 'ACTIVE',
          priority: 'MEDIUM'
        },
        {
          id: 'stream-5',
          name: 'Sales Pipeline',
          description: 'Sales activities and lead management',
          color: '#96CEB4',
          icon: 'chart-line',
          organizationId: 'org-4',
          status: 'INACTIVE',
          priority: 'LOW'
        }
      ],
      skipDuplicates: true
    });

    // 9. Areas (GTD Areas of Focus)
    console.log('🎯 9. Areas...');
    await prisma.area.createMany({
      data: [
        {
          id: 'area-1',
          name: 'Professional Development',
          description: 'Career growth and skill development',
          organizationId: 'org-1',
          createdById: 'user-1',
          color: '#8B5CF6',
          isActive: true
        },
        {
          id: 'area-2',
          name: 'Client Relations',
          description: 'Maintaining and improving client relationships',
          organizationId: 'org-2',
          createdById: 'user-5',
          color: '#10B981',
          isActive: true
        },
        {
          id: 'area-3',
          name: 'Team Management',
          description: 'Leading and developing team members',
          organizationId: 'org-3',
          createdById: 'user-6',
          color: '#F59E0B',
          isActive: true
        },
        {
          id: 'area-4',
          name: 'Business Development',
          description: 'Growing business opportunities',
          organizationId: 'org-4',
          createdById: 'user-7',
          color: '#EF4444',
          isActive: false
        }
      ],
      skipDuplicates: true
    });

    // 10. Habits (GTD Habits/Routines)
    console.log('🔄 10. Habits...');
    await prisma.habit.createMany({
      data: [
        {
          id: 'habit-1',
          name: 'Daily Standup',
          description: 'Morning team standup meeting',
          frequency: 'DAILY',
          organizationId: 'org-1',
          createdById: 'user-1',
          isActive: true,
          streakTarget: 30,
          currentStreak: 15
        },
        {
          id: 'habit-2',
          name: 'Weekly Review',
          description: 'GTD weekly review and planning',
          frequency: 'WEEKLY',
          organizationId: 'org-2',
          createdById: 'user-5',
          isActive: true,
          streakTarget: 12,
          currentStreak: 8
        },
        {
          id: 'habit-3',
          name: 'Client Check-in',
          description: 'Monthly client satisfaction check',
          frequency: 'MONTHLY',
          organizationId: 'org-3',
          createdById: 'user-6',
          isActive: true,
          streakTarget: 6,
          currentStreak: 3
        },
        {
          id: 'habit-4',
          name: 'Learning Session',
          description: 'Daily learning and skill development',
          frequency: 'DAILY',
          organizationId: 'org-4',
          createdById: 'user-7',
          isActive: false,
          streakTarget: 21,
          currentStreak: 0
        }
      ],
      skipDuplicates: true
    });

    // 11. Meetings
    console.log('📅 11. Meetings...');
    await prisma.meeting.createMany({
      data: [
        {
          id: 'meeting-1',
          title: 'Project Kickoff - GlobalTech',
          description: 'Initial project planning and team introduction',
          scheduledAt: new Date('2024-07-05T10:00:00Z'),
          duration: 120,
          type: 'PROJECT',
          status: 'SCHEDULED',
          organizationId: 'org-2',
          organizerId: 'user-5',
          projectId: 'proj-2',
          location: 'Conference Room A'
        },
        {
          id: 'meeting-2',
          title: 'Client Demo - FinTech App',
          description: 'Demonstration of MVP features to client',
          scheduledAt: new Date('2024-07-08T14:00:00Z'),
          duration: 60,
          type: 'CLIENT',
          status: 'SCHEDULED',
          organizationId: 'org-3',
          organizerId: 'user-6',
          companyId: 'comp-3',
          location: 'Virtual - Zoom'
        },
        {
          id: 'meeting-3',
          title: 'Team Retrospective',
          description: 'Sprint retrospective and improvement planning',
          scheduledAt: new Date('2024-06-28T15:00:00Z'),
          duration: 90,
          type: 'TEAM',
          status: 'COMPLETED',
          organizationId: 'org-1',
          organizerId: 'user-1',
          notes: 'Good sprint, identified areas for improvement'
        },
        {
          id: 'meeting-4',
          title: 'Investor Pitch',
          description: 'Startup funding presentation',
          scheduledAt: new Date('2024-07-10T11:00:00Z'),
          duration: 45,
          type: 'OTHER',
          status: 'CANCELLED',
          organizationId: 'org-4',
          organizerId: 'user-7',
          notes: 'Postponed due to investor schedule conflict'
        }
      ],
      skipDuplicates: true
    });

    // 12. Products
    console.log('📦 12. Products...');
    await prisma.product.createMany({
      data: [
        {
          id: 'prod-1',
          name: 'CRM-GTD Smart Basic',
          description: 'Basic CRM with GTD methodology integration',
          sku: 'CRM-GTD-BASIC',
          price: 29.99,
          category: 'SOFTWARE',
          status: 'ACTIVE',
          organizationId: 'org-1',
          features: JSON.stringify(['basic_crm', 'gtd_inbox', 'task_management'])
        },
        {
          id: 'prod-2',
          name: 'CRM-GTD Smart Professional',
          description: 'Professional CRM with advanced GTD features',
          sku: 'CRM-GTD-PRO',
          price: 79.99,
          category: 'SOFTWARE',
          status: 'ACTIVE',
          organizationId: 'org-2',
          features: JSON.stringify(['all_basic', 'smart_mailboxes', 'ai_rules', 'voice_tts'])
        },
        {
          id: 'prod-3',
          name: 'Enterprise Integration Package',
          description: 'Custom enterprise integration and setup',
          sku: 'ENT-INTEGRATION',
          price: 499.99,
          category: 'SERVICE',
          status: 'ACTIVE',
          organizationId: 'org-3',
          features: JSON.stringify(['custom_setup', 'training', 'support'])
        },
        {
          id: 'prod-4',
          name: 'Mobile App Add-on',
          description: 'Native mobile application access',
          sku: 'MOBILE-ADDON',
          price: 9.99,
          category: 'SOFTWARE',
          status: 'INACTIVE',
          organizationId: 'org-4',
          features: JSON.stringify(['mobile_access', 'offline_sync'])
        }
      ],
      skipDuplicates: true
    });

    // 13. Services  
    console.log('🔧 13. Services...');
    await prisma.service.createMany({
      data: [
        {
          id: 'service-1',
          name: 'CRM Implementation',
          description: 'Complete CRM system setup and configuration',
          category: 'IMPLEMENTATION',
          price: 1500.00,
          duration: 'PT40H',
          status: 'ACTIVE',
          organizationId: 'org-1'
        },
        {
          id: 'service-2',
          name: 'GTD Methodology Training',
          description: 'Comprehensive GTD training for teams',
          category: 'TRAINING',
          price: 800.00,
          duration: 'PT16H',
          status: 'ACTIVE',
          organizationId: 'org-2'
        },
        {
          id: 'service-3',
          name: 'Priority Support',
          description: '24/7 priority technical support',
          category: 'SUPPORT',
          price: 200.00,
          duration: 'P1M',
          status: 'ACTIVE',
          organizationId: 'org-3'
        },
        {
          id: 'service-4',
          name: 'Custom Development',
          description: 'Bespoke feature development',
          category: 'DEVELOPMENT',
          price: 150.00,
          duration: 'PT1H',
          status: 'INACTIVE',
          organizationId: 'org-4'
        }
      ],
      skipDuplicates: true
    });

    // 14. Offers
    console.log('💰 14. Offers...');
    await prisma.offer.createMany({
      data: [
        {
          id: 'offer-1',
          title: 'Q3 Enterprise Package',
          description: 'Complete enterprise solution with training',
          totalAmount: 15000.00,
          discountPercentage: 15.0,
          validUntil: new Date('2024-09-30'),
          status: 'ACTIVE',
          organizationId: 'org-1',
          createdById: 'user-1',
          companyId: 'comp-2'
        },
        {
          id: 'offer-2',
          title: 'Startup Special Bundle',
          description: 'Special pricing for startup companies',
          totalAmount: 5000.00,
          discountPercentage: 25.0,
          validUntil: new Date('2024-08-15'),
          status: 'SENT',
          organizationId: 'org-2',
          createdById: 'user-5',
          companyId: 'comp-3'
        },
        {
          id: 'offer-3',
          title: 'Mid-Year Upgrade',
          description: 'Upgrade existing customers to Pro',
          totalAmount: 8000.00,
          discountPercentage: 20.0,
          validUntil: new Date('2024-07-31'),
          status: 'ACCEPTED',
          organizationId: 'org-3',
          createdById: 'user-6',
          companyId: 'comp-4'
        },
        {
          id: 'offer-4',
          title: 'Local Business Package',
          description: 'Tailored solution for local services',
          totalAmount: 3000.00,
          discountPercentage: 10.0,
          validUntil: new Date('2024-06-30'),
          status: 'EXPIRED',
          organizationId: 'org-4',
          createdById: 'user-7',
          companyId: 'comp-5'
        }
      ],
      skipDuplicates: true
    });

    // 15. Invoices
    console.log('🧾 15. Invoices...');
    await prisma.invoice.createMany({
      data: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          totalAmount: 12750.00,
          taxAmount: 2750.00,
          status: 'PAID',
          dueDate: new Date('2024-07-15'),
          paidDate: new Date('2024-07-10'),
          organizationId: 'org-1',
          companyId: 'comp-2',
          createdById: 'user-1'
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2024-002',
          totalAmount: 3750.00,
          taxAmount: 750.00,
          status: 'SENT',
          dueDate: new Date('2024-08-01'),
          organizationId: 'org-2',
          companyId: 'comp-3',
          createdById: 'user-5'
        },
        {
          id: 'inv-3',
          invoiceNumber: 'INV-2024-003',
          totalAmount: 6400.00,
          taxAmount: 1400.00,
          status: 'OVERDUE',
          dueDate: new Date('2024-06-15'),
          organizationId: 'org-3',
          companyId: 'comp-4',
          createdById: 'user-6'
        },
        {
          id: 'inv-4',
          invoiceNumber: 'INV-2024-004',
          totalAmount: 2700.00,
          taxAmount: 500.00,
          status: 'CANCELLED',
          dueDate: new Date('2024-07-30'),
          organizationId: 'org-4',
          companyId: 'comp-5',
          createdById: 'user-7'
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Podstawowe tabele wypełnione! Przechodząc do pozostałych...');

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