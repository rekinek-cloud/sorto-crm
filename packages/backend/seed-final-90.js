const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFinal90() {
  console.log('🎯 OSTATNIE 7 TABEL DO 90%...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 18/27 tabel (66.7%)');
    console.log('🎯 Cel: 25/27 tabel (90.0%)\n');

    // 1. WeeklyReview - poprawne pola z schema
    console.log('📊 Weekly Review...');
    try {
      await prisma.weeklyReview.createMany({
        data: [
          {
            reviewDate: new Date('2025-01-06'),
            completedTasksCount: 15,  // nie 'completedTasks'
            newTasksCount: 8,         // nie 'newTasks'
            stalledTasks: 2,
            notes: 'Good week overall',
            collectLoosePapers: true,
            processNotes: true,
            emptyInbox: true,
            organizationId: organization.id,
            userId: user.id
          }
        ]
      });
      console.log('✅ weekly_reviews: 1 rekord');
    } catch (error) {
      console.log(`⚠️  weekly_reviews: ${error.message.substring(0, 80)}...`);
    }

    // 2. AI Provider - najprostszy
    console.log('\n🤖 AI Provider...');
    try {
      await prisma.aIProvider.createMany({
        data: [
          {
            name: 'OpenAI',
            displayName: 'OpenAI GPT Models',
            baseUrl: 'https://api.openai.com/v1',
            config: { apiKey: 'sk-demo-key', timeout: 30000 },
            organizationId: organization.id
          },
          {
            name: 'Local',
            displayName: 'Local LLM Provider', 
            baseUrl: 'http://localhost:11434',
            config: { timeout: 60000 },
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ ai_providers: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  ai_providers: ${error.message.substring(0, 80)}...`);
    }

    // 3. AI Models - potrzebuje AI Provider
    console.log('\n🧠 AI Models...');
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        await prisma.aIModel.createMany({
          data: [
            {
              name: 'GPT-4',
              description: 'GPT-4 model',
              config: { model: 'gpt-4', maxTokens: 4000 },
              providerId: provider.id,
              organizationId: organization.id
            },
            {
              name: 'GPT-3.5-turbo',
              description: 'GPT-3.5 turbo model',
              config: { model: 'gpt-3.5-turbo', maxTokens: 2000 },
              providerId: provider.id,
              organizationId: organization.id
            }
          ]
        });
        console.log('✅ ai_models: 2 rekordy');
      }
    } catch (error) {
      console.log(`⚠️  ai_models: ${error.message.substring(0, 80)}...`);
    }

    // 4. AI Rules - potrzebuje AI Models
    console.log('\n⚙️ AI Rules...');
    try {
      const model = await prisma.aIModel.findFirst();
      if (model) {
        await prisma.aIRule.createMany({
          data: [
            {
              name: 'Auto Email Priority',
              description: 'Automatically classify email priority',
              trigger: 'NEW_MESSAGE',
              conditions: { subject_contains: ['urgent', 'asap'] },
              actions: { set_priority: 'HIGH', add_tag: 'urgent' },
              modelId: model.id,
              organizationId: organization.id,
              createdById: user.id
            }
          ]
        });
        console.log('✅ ai_rules: 1 rekord');
      }
    } catch (error) {
      console.log(`⚠️  ai_rules: ${error.message.substring(0, 80)}...`);
    }

    // 5. Messages - potrzebuje Channel
    console.log('\n📧 Messages...');
    try {
      // Najpierw utwórz channel
      const channel = await prisma.communicationChannel.create({
        data: {
          name: 'email-main',
          type: 'EMAIL',
          config: { server: 'imap.gmail.com' },
          organizationId: organization.id
        }
      });

      await prisma.message.createMany({
        data: [
          {
            channelId: channel.id,
            subject: 'Project Status Update',
            content: 'The project is progressing well',
            fromAddress: 'manager@company.com',
            toAddresses: ['team@company.com'],
            status: 'PROCESSED',
            organizationId: organization.id
          },
          {
            channelId: channel.id,
            subject: 'Meeting Reminder',
            content: 'Tomorrow meeting at 2 PM',
            fromAddress: 'assistant@company.com',
            toAddresses: ['team@company.com'],
            status: 'NEW',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ messages: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  messages: ${error.message.substring(0, 80)}...`);
    }

    // 6. Leads - uproszczony
    console.log('\n👥 Leads...');
    try {
      await prisma.lead.createMany({
        data: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@bigcorp.com',
            company: 'BigCorp Inc',
            source: 'WEBSITE',
            status: 'NEW',
            organizationId: organization.id,
            assignedToId: user.id
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@startup.co',
            company: 'StartupCo',
            source: 'REFERRAL',
            status: 'CONTACTED',
            organizationId: organization.id,
            assignedToId: user.id
          }
        ]
      });
      console.log('✅ leads: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  leads: ${error.message.substring(0, 80)}...`);
    }

    // 7. Offers - uproszczony
    console.log('\n💰 Offers...');
    try {
      await prisma.offer.createMany({
        data: [
          {
            title: 'Enterprise CRM Package',
            description: 'Complete CRM solution',
            totalAmount: 9999.99,
            currency: 'USD',
            status: 'DRAFT',
            validUntil: new Date('2025-12-31'),
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ offers: 1 rekord');
    } catch (error) {
      console.log(`⚠️  offers: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n🎉 WYPEŁNIANIE UKOŃCZONE! Sprawdzanie czy osiągnęliśmy 90%...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinal90();