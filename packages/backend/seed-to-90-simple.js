const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTo90Simple() {
  console.log('🎯 Wypełnianie bazy do 90% - 12 tabel do dodania...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const project = await prisma.project.findFirst();
    const task = await prisma.task.findFirst();
    const contact = await prisma.contact.findFirst();
    const company = await prisma.company.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 13/27 tabel wypełnionych (48.1%)');
    console.log('🎯 Cel: 25/27 tabel wypełnionych (90.0%)\n');

    // 1. AI SYSTEM - najprostsze tabele
    console.log('🤖 Grupa 1: AI System...');
    
    // AI Providers - uproszczony
    try {
      await prisma.aIProvider.createMany({
        data: [
          {
            name: 'OpenAI',
            type: 'OPENAI',
            isActive: true,
            organizationId: organization.id
          },
          {
            name: 'Local LLM', 
            type: 'CUSTOM',
            isActive: false,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ ai_providers: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  ai_providers: ${error.message.substring(0, 60)}...`);
    }

    // AI Models - uproszczony
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        await prisma.aIModel.createMany({
          data: [
            {
              name: 'GPT-4',
              version: '4.0',
              type: 'CHAT',
              isActive: true,
              providerId: provider.id,
              organizationId: organization.id
            },
            {
              name: 'GPT-3.5-turbo',
              version: '3.5',
              type: 'CHAT', 
              isActive: true,
              providerId: provider.id,
              organizationId: organization.id
            }
          ]
        });
        console.log('✅ ai_models: 2 rekordy');
      }
    } catch (error) {
      console.log(`⚠️  ai_models: ${error.message.substring(0, 60)}...`);
    }

    // 2. BUSINESS - minimum required fields
    console.log('\n💼 Grupa 2: Business...');

    // Offers - minimalne pola
    try {
      await prisma.offer.createMany({
        data: [
          {
            title: 'Enterprise Package',
            totalAmount: 9999.99,
            status: 'DRAFT',
            organizationId: organization.id
          },
          {
            title: 'Startup Special',
            totalAmount: 1999.99,
            status: 'SENT',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ offers: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  offers: ${error.message.substring(0, 60)}...`);
    }

    // Leads - minimalne pola
    try {
      await prisma.lead.createMany({
        data: [
          {
            name: 'Enterprise Client',
            email: 'contact@bigcorp.com',
            source: 'WEBSITE',
            status: 'NEW',
            organizationId: organization.id
          },
          {
            name: 'Startup Founder',
            email: 'founder@startup.co',
            source: 'REFERRAL', 
            status: 'CONTACTED',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ leads: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  leads: ${error.message.substring(0, 60)}...`);
    }

    // 3. GTD SYSTEM - minimalne pola
    console.log('\n📅 Grupa 3: GTD System...');

    // Tags - minimalne pola
    try {
      await prisma.tag.createMany({
        data: [
          {
            name: 'urgent',
            color: '#EF4444',
            organizationId: organization.id
          },
          {
            name: 'project',
            color: '#3B82F6',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ tags: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  tags: ${error.message.substring(0, 60)}...`);
    }

    // Habits - minimalne pola
    try {
      await prisma.habit.createMany({
        data: [
          {
            name: 'Daily Inbox',
            frequency: 'DAILY',
            isActive: true,
            userId: user.id,
            organizationId: organization.id
          },
          {
            name: 'Weekly Review',
            frequency: 'WEEKLY',
            isActive: true,
            userId: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ habits: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  habits: ${error.message.substring(0, 60)}...`);
    }

    // Waiting For - minimalne pola
    try {
      await prisma.waitingFor.createMany({
        data: [
          {
            item: 'Client approval',
            waitingFor: 'ABC Corp',
            userId: user.id,
            organizationId: organization.id
          },
          {
            item: 'Hardware delivery',
            waitingFor: 'TechSupply',
            userId: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ waiting_for: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  waiting_for: ${error.message.substring(0, 60)}...`);
    }

    // Someday Maybe - minimalne pola
    try {
      await prisma.somedayMaybe.createMany({
        data: [
          {
            item: 'Mobile app development',
            category: 'PRODUCT',
            userId: user.id,
            organizationId: organization.id
          },
          {
            item: 'Team building retreat',
            category: 'TEAM',
            userId: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ someday_maybe: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  someday_maybe: ${error.message.substring(0, 60)}...`);
    }

    // Weekly Reviews - minimalne pola
    try {
      await prisma.weeklyReview.createMany({
        data: [
          {
            weekStartDate: new Date('2025-01-06'),
            completedTasks: 15,
            newTasks: 8,
            completionRate: 75.5,
            userId: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ weekly_reviews: 1 rekord');
    } catch (error) {
      console.log(`⚠️  weekly_reviews: ${error.message.substring(0, 60)}...`);
    }

    // Meetings - minimalne pola
    try {
      await prisma.meeting.createMany({
        data: [
          {
            title: 'Team Sync',
            startTime: new Date('2025-01-08T10:00:00Z'),
            endTime: new Date('2025-01-08T11:00:00Z'),
            status: 'SCHEDULED',
            organizationId: organization.id,
            createdById: user.id
          },
          {
            title: 'Client Call',
            startTime: new Date('2025-01-10T14:00:00Z'),
            endTime: new Date('2025-01-10T15:00:00Z'),
            status: 'COMPLETED',
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ meetings: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  meetings: ${error.message.substring(0, 60)}...`);
    }

    // Messages - minimalne pola
    try {
      await prisma.message.createMany({
        data: [
          {
            subject: 'Project Update',
            content: 'Status update message',
            from: 'manager@company.com',
            to: 'team@company.com',
            status: 'PROCESSED',
            organizationId: organization.id
          },
          {
            subject: 'Meeting Reminder',
            content: 'Tomorrow meeting at 2 PM',
            from: 'assistant@company.com',
            to: 'team@company.com',
            status: 'NEW',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ messages: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  messages: ${error.message.substring(0, 60)}...`);
    }

    // 4. BUSINESS ADVANCED
    console.log('\n💰 Grupa 4: Business Advanced...');

    // Orders - minimalne pola
    try {
      await prisma.order.createMany({
        data: [
          {
            orderNumber: 'ORD-2025-001',
            totalAmount: 999.99,
            status: 'PENDING',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ orders: 1 rekord');
    } catch (error) {
      console.log(`⚠️  orders: ${error.message.substring(0, 60)}...`);
    }

    // Invoices - minimalne pola
    try {
      await prisma.invoice.createMany({
        data: [
          {
            invoiceNumber: 'INV-2025-001',
            totalAmount: 999.99,
            status: 'SENT',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ invoices: 1 rekord');
    } catch (error) {
      console.log(`⚠️  invoices: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n🎉 Wypełnianie zakończone! Sprawdzanie nowego stanu...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTo90Simple();