const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTo90Percent() {
  console.log('🎯 Wypełnianie bazy do 90% - systematyczne podejście...\n');

  try {
    // Pobierz podstawowe dane
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    const project = await prisma.project.findFirst();
    const contact = await prisma.contact.findFirst();
    const company = await prisma.company.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    // 1. BUSINESS SYSTEM - Products, Services, Orders, Invoices
    console.log('💼 Grupa 1: Business System...');
    
    // Products
    console.log('📦 Wypełnianie products...');
    const products = [
      {
        name: 'CRM-GTD Smart Basic',
        description: 'Basic CRM with GTD methodology integration',
        price: 99.99,
        category: 'SOFTWARE',
        isActive: true,
        organizationId: organization.id
      },
      {
        name: 'CRM-GTD Smart Pro',
        description: 'Professional CRM with AI features and advanced GTD',
        price: 299.99,
        category: 'SOFTWARE',
        isActive: true,
        organizationId: organization.id
      },
      {
        name: 'Voice TTS Add-on',
        description: 'Text-to-speech voice synthesis module',
        price: 49.99,
        category: 'SOFTWARE',
        isActive: true,
        organizationId: organization.id
      }
    ];

    for (const product of products) {
      await prisma.product.create({ data: product });
    }
    console.log(`✅ Utworzono ${products.length} produktów`);

    // Services
    console.log('🔧 Wypełnianie services...');
    const services = [
      {
        name: 'CRM Implementation',
        description: 'Complete CRM system implementation and setup',
        price: 2999.99,
        category: 'IMPLEMENTATION',
        isActive: true,
        organizationId: organization.id
      },
      {
        name: 'GTD Training',
        description: 'Getting Things Done methodology training for teams',
        price: 799.99,
        category: 'TRAINING',
        isActive: true,
        organizationId: organization.id
      },
      {
        name: 'Support & Maintenance',
        description: 'Monthly support and system maintenance',
        price: 199.99,
        category: 'SUPPORT',
        isActive: true,
        organizationId: organization.id
      }
    ];

    for (const service of services) {
      await prisma.service.create({ data: service });
    }
    console.log(`✅ Utworzono ${services.length} usług`);

    // Offers
    console.log('💰 Wypełnianie offers...');
    const offers = [
      {
        title: 'Enterprise Package',
        description: 'Complete CRM + GTD solution for enterprise',
        offerNumber: 'OFF-2025-001',
        customerName: 'ABC Corporation',
        customerEmail: 'procurement@abccorp.com',
        totalAmount: 9999.99,
        validUntil: new Date('2025-12-31'),
        status: 'SENT',
        organizationId: organization.id,
        contactId: contact?.id,
        companyId: company?.id
      },
      {
        title: 'Startup Special',
        description: 'Discounted package for startups',
        offerNumber: 'OFF-2025-002',
        customerName: 'Startup Inc',
        customerEmail: 'founder@startup.inc',
        totalAmount: 1999.99,
        validUntil: new Date('2025-06-30'),
        status: 'DRAFT',
        organizationId: organization.id,
        contactId: contact?.id,
        companyId: company?.id
      }
    ];

    for (const offer of offers) {
      await prisma.offer.create({ data: offer });
    }
    console.log(`✅ Utworzono ${offers.length} ofert`);

    // 2. GTD SYSTEM - Meetings, Habits, WeeklyReview, DelegatedTask
    console.log('\n📅 Grupa 2: GTD System...');

    // Meetings
    console.log('🤝 Wypełnianie meetings...');
    const meetings = [
      {
        title: 'Weekly Team Sync',
        description: 'Regular team synchronization meeting',
        startTime: new Date('2025-01-08T10:00:00Z'),
        endTime: new Date('2025-01-08T11:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        createdById: user.id
      },
      {
        title: 'Client Presentation',
        description: 'Presenting CRM solution to potential client',
        startTime: new Date('2025-01-10T14:00:00Z'),
        endTime: new Date('2025-01-10T15:30:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        createdById: user.id
      },
      {
        title: 'GTD Review Session',
        description: 'Monthly GTD methodology review and optimization',
        startTime: new Date('2025-01-15T09:00:00Z'),
        endTime: new Date('2025-01-15T10:00:00Z'),
        status: 'COMPLETED',
        organizationId: organization.id,
        createdById: user.id
      }
    ];

    for (const meeting of meetings) {
      await prisma.meeting.create({ data: meeting });
    }
    console.log(`✅ Utworzono ${meetings.length} spotkań`);

    // Habits
    console.log('🔄 Wypełnianie habits...');
    const habits = [
      {
        name: 'Daily Inbox Processing',
        description: 'Process GTD inbox every morning at 9 AM',
        frequency: 'DAILY',
        isActive: true,
        userId: user.id,
        organizationId: organization.id
      },
      {
        name: 'Weekly Review',
        description: 'Comprehensive weekly review every Friday',
        frequency: 'WEEKLY',
        isActive: true,
        userId: user.id,
        organizationId: organization.id
      },
      {
        name: 'Exercise Break',
        description: 'Take a 15-minute exercise break every 2 hours',
        frequency: 'CUSTOM',
        isActive: true,
        userId: user.id,
        organizationId: organization.id
      }
    ];

    for (const habit of habits) {
      await prisma.habit.create({ data: habit });
    }
    console.log(`✅ Utworzono ${habits.length} nawyków`);

    // WeeklyReview
    console.log('📊 Wypełnianie weeklyReview...');
    const weeklyReviews = [
      {
        weekStartDate: new Date('2025-01-06'),
        completedTasks: 15,
        newTasks: 8,
        completionRate: 75.5,
        notes: 'Good week overall. Focus on better time estimation.',
        userId: user.id,
        organizationId: organization.id
      },
      {
        weekStartDate: new Date('2024-12-30'),
        completedTasks: 12,
        newTasks: 10,
        completionRate: 68.2,
        notes: 'Holiday week, slower pace but steady progress.',
        userId: user.id,
        organizationId: organization.id
      }
    ];

    for (const review of weeklyReviews) {
      await prisma.weeklyReview.create({ data: review });
    }
    console.log(`✅ Utworzono ${weeklyReviews.length} przeglądów tygodniowych`);

    // 3. COMMUNICATION SYSTEM - Messages, Processing, Email Analysis
    console.log('\n📧 Grupa 3: Communication System...');

    // Messages
    console.log('💬 Wypełnianie messages...');
    const messages = [
      {
        channelId: 'email-main',
        subject: 'Project Status Update',
        content: 'The CRM integration project is progressing well. We completed the first milestone.',
        from: 'project-manager@company.com',
        to: 'team@company.com',
        status: 'PROCESSED',
        organizationId: organization.id
      },
      {
        channelId: 'email-main',
        subject: 'Client Meeting Tomorrow',
        content: 'Reminder: We have a client presentation tomorrow at 2 PM.',
        from: 'sales@company.com',
        to: 'team@company.com',
        status: 'NEW',
        organizationId: organization.id
      },
      {
        channelId: 'slack-general',
        content: 'Great work everyone! The demo went very well.',
        from: 'ceo@company.com',
        to: 'general',
        status: 'PROCESSED',
        organizationId: organization.id
      }
    ];

    for (const message of messages) {
      await prisma.message.create({ data: message });
    }
    console.log(`✅ Utworzono ${messages.length} wiadomości`);

    // 4. KNOWLEDGE SYSTEM - Documents, Folders, WikiPages
    console.log('\n📚 Grupa 4: Knowledge System...');

    // Folders
    console.log('📁 Wypełnianie folders...');
    const folders = [
      {
        name: 'Product Documentation',
        description: 'All product-related documentation',
        color: '#4F46E5',
        organizationId: organization.id
      },
      {
        name: 'Meeting Notes',
        description: 'Notes from team meetings and client calls',
        color: '#059669',
        organizationId: organization.id
      },
      {
        name: 'Project Files',
        description: 'Project-specific documents and files',
        color: '#DC2626',
        organizationId: organization.id
      }
    ];

    for (const folder of folders) {
      await prisma.folder.create({ data: folder });
    }
    console.log(`✅ Utworzono ${folders.length} folderów`);

    // Documents
    console.log('📄 Wypełnianie documents...');
    const folder = await prisma.folder.findFirst();
    const documents = [
      {
        title: 'CRM-GTD Smart User Guide',
        content: 'Comprehensive user guide for CRM-GTD Smart application...',
        type: 'GUIDE',
        status: 'PUBLISHED',
        authorId: user.id,
        folderId: folder?.id,
        organizationId: organization.id
      },
      {
        title: 'API Documentation',
        content: 'Technical documentation for CRM API endpoints...',
        type: 'REFERENCE',
        status: 'PUBLISHED',
        authorId: user.id,
        folderId: folder?.id,
        organizationId: organization.id
      },
      {
        title: 'Meeting Notes - Client Call',
        content: 'Notes from client call on January 5th regarding requirements...',
        type: 'NOTE',
        status: 'DRAFT',
        authorId: user.id,
        folderId: folder?.id,
        organizationId: organization.id
      }
    ];

    for (const document of documents) {
      await prisma.document.create({ data: document });
    }
    console.log(`✅ Utworzono ${documents.length} dokumentów`);

    // 5. TAGS & ORGANIZATION
    console.log('\n🏷️ Grupa 5: Tags & Organization...');

    // Tags
    console.log('🏷️ Wypełnianie tags...');
    const tags = [
      {
        name: 'urgent',
        description: 'Items requiring immediate attention',
        color: '#EF4444',
        organizationId: organization.id
      },
      {
        name: 'project',
        description: 'Project-related items',
        color: '#3B82F6',
        organizationId: organization.id
      },
      {
        name: 'client',
        description: 'Client-related communications',
        color: '#10B981',
        organizationId: organization.id
      },
      {
        name: 'internal',
        description: 'Internal team communications',
        color: '#F59E0B',
        organizationId: organization.id
      }
    ];

    for (const tag of tags) {
      await prisma.tag.create({ data: tag });
    }
    console.log(`✅ Utworzono ${tags.length} tagów`);

    // 6. WAITING FOR & SOMEDAY MAYBE
    console.log('\n⏳ Grupa 6: GTD Lists...');

    // WaitingFor
    console.log('⏳ Wypełnianie waitingFor...');
    const waitingForItems = [
      {
        item: 'Client approval for project scope',
        waitingFor: 'ABC Corp decision maker',
        dateAdded: new Date('2025-01-05'),
        followUpDate: new Date('2025-01-12'),
        userId: user.id,
        organizationId: organization.id
      },
      {
        item: 'Hardware delivery from supplier',
        waitingFor: 'TechSupply logistics team',
        dateAdded: new Date('2025-01-03'),
        followUpDate: new Date('2025-01-10'),
        userId: user.id,
        organizationId: organization.id
      }
    ];

    for (const item of waitingForItems) {
      await prisma.waitingFor.create({ data: item });
    }
    console.log(`✅ Utworzono ${waitingForItems.length} elementów "waiting for"`);

    // SomedayMaybe
    console.log('🌟 Wypełnianie somedayMaybe...');
    const somedayMaybeItems = [
      {
        item: 'Develop mobile app for CRM',
        description: 'Native mobile application for iOS and Android',
        category: 'PRODUCT',
        userId: user.id,
        organizationId: organization.id
      },
      {
        item: 'AI-powered email responses',
        description: 'Automatic email response generation using AI',
        category: 'FEATURE',
        userId: user.id,
        organizationId: organization.id
      },
      {
        item: 'Team building retreat',
        description: 'Organize a team retreat for better collaboration',
        category: 'TEAM',
        userId: user.id,
        organizationId: organization.id
      }
    ];

    for (const item of somedayMaybeItems) {
      await prisma.somedayMaybe.create({ data: item });
    }
    console.log(`✅ Utworzono ${somedayMaybeItems.length} elementów "someday maybe"`);

    console.log('\n🎉 Faza 1 wypełniania zakończona! Sprawdzamy postęp...');

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTo90Percent()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });