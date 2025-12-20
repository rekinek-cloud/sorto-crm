const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSimpleFast() {
  console.log('⚡ Szybkie wypełnianie bazy - skupiam się na działających tabelach...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych!');
    }

    // 1. GTD CORE - najprostsze tabele
    console.log('🎯 Grupa 1: GTD Core...');

    // Habits
    try {
      const habits = [
        {
          name: 'Daily Inbox Processing',
          description: 'Process GTD inbox every morning',
          frequency: 'DAILY',
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        },
        {
          name: 'Weekly Review',
          description: 'Weekly GTD review every Friday',
          frequency: 'WEEKLY',
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        }
      ];

      for (const habit of habits) {
        await prisma.habit.create({ data: habit });
      }
      console.log(`✅ habits: ${habits.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  habits: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // Tags
    try {
      const tags = [
        {
          name: 'urgent',
          description: 'Urgent items',
          color: '#EF4444',
          organizationId: organization.id
        },
        {
          name: 'project',
          description: 'Project items',
          color: '#3B82F6',
          organizationId: organization.id
        },
        {
          name: 'client',
          description: 'Client items',
          color: '#10B981',
          organizationId: organization.id
        }
      ];

      for (const tag of tags) {
        await prisma.tag.create({ data: tag });
      }
      console.log(`✅ tags: ${tags.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  tags: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // WaitingFor
    try {
      const waitingFor = [
        {
          item: 'Client approval for project scope',
          waitingFor: 'ABC Corp decision maker',
          dateAdded: new Date(),
          userId: user.id,
          organizationId: organization.id
        },
        {
          item: 'Hardware delivery from supplier',
          waitingFor: 'TechSupply logistics',
          dateAdded: new Date(),
          userId: user.id,
          organizationId: organization.id
        }
      ];

      for (const item of waitingFor) {
        await prisma.waitingFor.create({ data: item });
      }
      console.log(`✅ waitingFor: ${waitingFor.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  waitingFor: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // SomedayMaybe
    try {
      const somedayMaybe = [
        {
          item: 'Develop mobile app for CRM',
          description: 'Native mobile application',
          category: 'PRODUCT',
          userId: user.id,
          organizationId: organization.id
        },
        {
          item: 'AI-powered email responses',
          description: 'Automatic email generation',
          category: 'FEATURE',
          userId: user.id,
          organizationId: organization.id
        }
      ];

      for (const item of somedayMaybe) {
        await prisma.somedayMaybe.create({ data: item });
      }
      console.log(`✅ somedayMaybe: ${somedayMaybe.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  somedayMaybe: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // 2. COMMUNICATION
    console.log('\n📧 Grupa 2: Communication...');

    // Messages
    try {
      const messages = [
        {
          channelId: 'email-main',
          subject: 'Project Status Update',
          content: 'Project progressing well',
          from: 'manager@company.com',
          to: 'team@company.com',
          status: 'PROCESSED',
          organizationId: organization.id
        },
        {
          channelId: 'email-main',
          subject: 'Client Meeting Tomorrow',
          content: 'Reminder about client meeting',
          from: 'sales@company.com',
          to: 'team@company.com',
          status: 'NEW',
          organizationId: organization.id
        }
      ];

      for (const message of messages) {
        await prisma.message.create({ data: message });
      }
      console.log(`✅ messages: ${messages.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  messages: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // 3. BUSINESS DATA
    console.log('\n💼 Grupa 3: Business...');

    // Products
    try {
      const products = [
        {
          name: 'CRM-GTD Smart Basic',
          description: 'Basic CRM solution',
          price: 99.99,
          category: 'SOFTWARE',
          isActive: true,
          organizationId: organization.id
        },
        {
          name: 'CRM-GTD Smart Pro',
          description: 'Professional CRM with AI',
          price: 299.99,
          category: 'SOFTWARE',
          isActive: true,
          organizationId: organization.id
        }
      ];

      for (const product of products) {
        await prisma.product.create({ data: product });
      }
      console.log(`✅ products: ${products.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  products: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // Services
    try {
      const services = [
        {
          name: 'CRM Implementation',
          description: 'Complete setup service',
          price: 2999.99,
          category: 'IMPLEMENTATION',
          isActive: true,
          organizationId: organization.id
        },
        {
          name: 'Support & Maintenance',
          description: 'Monthly support',
          price: 199.99,
          category: 'SUPPORT',
          isActive: true,
          organizationId: organization.id
        }
      ];

      for (const service of services) {
        await prisma.service.create({ data: service });
      }
      console.log(`✅ services: ${services.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  services: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // 4. KNOWLEDGE
    console.log('\n📚 Grupa 4: Knowledge...');

    // Folders
    try {
      const folders = [
        {
          name: 'Product Documentation',
          description: 'Product docs',
          color: '#4F46E5',
          organizationId: organization.id
        },
        {
          name: 'Meeting Notes',
          description: 'Meeting documentation',
          color: '#059669',
          organizationId: organization.id
        }
      ];

      for (const folder of folders) {
        await prisma.folder.create({ data: folder });
      }
      console.log(`✅ folders: ${folders.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  folders: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // Documents
    try {
      const folder = await prisma.folder.findFirst();
      const documents = [
        {
          title: 'User Guide',
          content: 'Comprehensive user guide...',
          type: 'GUIDE',
          status: 'PUBLISHED',
          authorId: user.id,
          folderId: folder?.id,
          organizationId: organization.id
        },
        {
          title: 'API Documentation',
          content: 'Technical API docs...',
          type: 'REFERENCE',
          status: 'PUBLISHED',
          authorId: user.id,
          folderId: folder?.id,
          organizationId: organization.id
        }
      ];

      for (const document of documents) {
        await prisma.document.create({ data: document });
      }
      console.log(`✅ documents: ${documents.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  documents: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // 5. GTD ADDITIONAL
    console.log('\n📅 Grupa 5: GTD Additional...');

    // RecurringTasks
    try {
      const recurringTasks = [
        {
          title: 'Weekly Team Sync',
          description: 'Regular team meeting',
          frequency: 'WEEKLY',
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        },
        {
          title: 'Monthly Reports',
          description: 'Generate monthly reports',
          frequency: 'MONTHLY',
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        }
      ];

      for (const task of recurringTasks) {
        await prisma.recurringTask.create({ data: task });
      }
      console.log(`✅ recurringTasks: ${recurringTasks.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  recurringTasks: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // WeeklyReviews
    try {
      const weeklyReviews = [
        {
          weekStartDate: new Date('2025-01-06'),
          completedTasks: 15,
          newTasks: 8,
          completionRate: 75.5,
          notes: 'Good week overall',
          userId: user.id,
          organizationId: organization.id
        }
      ];

      for (const review of weeklyReviews) {
        await prisma.weeklyReview.create({ data: review });
      }
      console.log(`✅ weeklyReviews: ${weeklyReviews.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  weeklyReviews: pomijam (${error.message.substring(0, 50)}...)`);
    }

    // 6. MANAGEMENT & LEADS
    console.log('\n👥 Grupa 6: Management...');

    // Leads
    try {
      const leads = [
        {
          name: 'Potential Enterprise Client',
          email: 'contact@bigcorp.com',
          phone: '+1-555-0123',
          source: 'WEBSITE',
          status: 'NEW',
          organizationId: organization.id,
          assignedToId: user.id
        },
        {
          name: 'Startup Inquiry',
          email: 'founder@startup.co',
          source: 'REFERRAL',
          status: 'CONTACTED',
          organizationId: organization.id,
          assignedToId: user.id
        }
      ];

      for (const lead of leads) {
        await prisma.lead.create({ data: lead });
      }
      console.log(`✅ leads: ${leads.length} rekordów`);
    } catch (error) {
      console.log(`⚠️  leads: pomijam (${error.message.substring(0, 50)}...)`);
    }

    console.log('\n🎉 Szybkie wypełnianie zakończone!');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSimpleFast();