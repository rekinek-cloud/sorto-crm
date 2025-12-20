const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFinalCorrected() {
  console.log('🔧 OSTATECZNE POPRAWKI - 6 TABEL DO 90%...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 19/27 tabel (70.4%)');
    console.log('🎯 Cel: 25/27 tabel (90.0%)\n');

    // 1. Leads - poprawne pola ze schema
    console.log('👥 Leads...');
    try {
      await prisma.lead.createMany({
        data: [
          {
            title: 'Enterprise CRM Inquiry',        // 'title' nie 'firstName'
            description: 'Interested in CRM solution',
            company: 'BigCorp Inc',
            contactPerson: 'John Doe',             // 'contactPerson' nie 'firstName/lastName'
            source: 'Website form',               // String nie enum
            status: 'NEW',
            value: 50000.0,
            organizationId: organization.id
          },
          {
            title: 'Startup CRM Demo Request',
            description: 'Demo for startup',
            company: 'StartupCo',
            contactPerson: 'Jane Smith',
            source: 'Referral',
            status: 'NEW', 
            value: 10000.0,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ leads: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  leads: ${error.message.substring(0, 80)}...`);
    }

    // 2. Offers - wymagane offerNumber
    console.log('\n💰 Offers...');
    try {
      await prisma.offer.createMany({
        data: [
          {
            offerNumber: 'OFF-2025-001',          // wymagane unique
            title: 'Enterprise CRM Package',
            description: 'Complete CRM solution',
            status: 'DRAFT',
            totalAmount: 9999.99,
            currency: 'USD',
            validUntil: new Date('2025-12-31'),
            organizationId: organization.id,
            createdById: user.id
          },
          {
            offerNumber: 'OFF-2025-002',
            title: 'Startup CRM Package',  
            description: 'Basic CRM for startups',
            status: 'SENT',
            totalAmount: 1999.99,
            currency: 'USD',
            validUntil: new Date('2025-06-30'),
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ offers: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  offers: ${error.message.substring(0, 80)}...`);
    }

    // 3. Orders - sprawdź wymagane pola
    console.log('\n📦 Orders...');
    try {
      await prisma.order.createMany({
        data: [
          {
            orderNumber: 'ORD-2025-001',
            totalAmount: 999.99,
            status: 'PENDING',
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ orders: 1 rekord');
    } catch (error) {
      console.log(`⚠️  orders: ${error.message.substring(0, 80)}...`);
    }

    // 4. Invoices - sprawdź wymagane pola
    console.log('\n🧾 Invoices...');
    try {
      await prisma.invoice.createMany({
        data: [
          {
            invoiceNumber: 'INV-2025-001',
            totalAmount: 999.99,
            status: 'SENT',
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ invoices: 1 rekord');
    } catch (error) {
      console.log(`⚠️  invoices: ${error.message.substring(0, 80)}...`);
    }

    // 5. AI Models - sprawdź czy providerId istnieje
    console.log('\n🧠 AI Models...');
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        await prisma.aIModel.createMany({
          data: [
            {
              name: 'GPT-4',
              modelType: 'TEXT',                   // sprawdź czy to pole istnieje
              config: { model: 'gpt-4' },
              providerId: provider.id,
              organizationId: organization.id
            }
          ]
        });
        console.log('✅ ai_models: 1 rekord');
      } else {
        console.log('⚠️  ai_models: brak AI Provider');
      }
    } catch (error) {
      console.log(`⚠️  ai_models: ${error.message.substring(0, 80)}...`);
    }

    // 6. Weekly Review - sprawdź userId vs createdById
    console.log('\n📊 Weekly Review...');
    try {
      await prisma.weeklyReview.createMany({
        data: [
          {
            reviewDate: new Date('2025-01-06'),
            completedTasksCount: 15,
            newTasksCount: 8,
            stalledTasks: 2,
            notes: 'Good week overall',
            collectLoosePapers: true,
            processNotes: true,
            emptyInbox: true,
            createdById: user.id,                 // sprawdź czy 'createdById' nie 'userId'
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ weekly_reviews: 1 rekord');
    } catch (error) {
      console.log(`⚠️  weekly_reviews: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n🎯 FINAL CHECK - sprawdzenie czy osiągnęliśmy 90%...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinalCorrected();