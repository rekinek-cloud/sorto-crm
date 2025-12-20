const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFinal4Tables() {
  console.log('🏁 OSTATNIE 4 TABELE DO 90%...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 21/27 tabel (77.8%)');
    console.log('🎯 Cel: 25/27 tabel (90.0%)');
    console.log('🏁 Zostało: 4 tabele (messages, weekly_reviews, ai_models, ai_rules, offers, invoices)\n');

    // 1. Invoices - sprawdź czy customer jest wymagane
    console.log('🧾 Invoices...');
    try {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-001',
          title: 'CRM Implementation Invoice',
          customer: 'BigCorp Inc',              // dodaj customer
          status: 'SENT',
          totalAmount: 9999.99,
          organizationId: organization.id
        }
      });
      console.log(`✅ invoices: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  invoices błąd: ${error.message.substring(0, 80)}...`);
    }

    // 2. Offers - sprawdź czy contact jest wymagane
    console.log('\n💰 Offers...');
    try {
      const contact = await prisma.contact.findFirst();
      const offer = await prisma.offer.create({
        data: {
          offerNumber: 'OFF-2025-001',
          title: 'Enterprise CRM Package',
          customerName: 'BigCorp Inc',
          customerEmail: 'procurement@bigcorp.com',
          status: 'DRAFT',
          totalAmount: 9999.99,
          contactId: contact?.id,               // dodaj contactId
          organizationId: organization.id
        }
      });
      console.log(`✅ offers: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  offers błąd: ${error.message.substring(0, 80)}...`);
    }

    // 3. Messages - sprawdź czy channelId jest absolutnie wymagane
    console.log('\n📧 Messages...');
    try {
      // Spróbuj najpierw bez channelId
      const message = await prisma.message.create({
        data: {
          subject: 'Project Update',            // dodaj subject
          content: 'Project status update',
          fromAddress: 'manager@company.com',
          toAddress: 'team@company.com',
          status: 'PROCESSED',
          organizationId: organization.id
        }
      });
      console.log(`✅ messages: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  messages błąd bez channelId: ${error.message.substring(0, 60)}...`);
      
      // Jeśli nie działa, utwórz channel
      try {
        console.log('   🔄 Tworzę Communication Channel...');
        const channel = await prisma.communicationChannel.create({
          data: {
            name: 'default-email',
            type: 'EMAIL',
            config: { server: 'smtp.company.com' },
            isActive: true,
            organizationId: organization.id
          }
        });

        const message = await prisma.message.create({
          data: {
            channelId: channel.id,
            subject: 'Project Update',
            content: 'Project status update',
            fromAddress: 'manager@company.com',
            toAddress: 'team@company.com',
            status: 'PROCESSED',
            organizationId: organization.id
          }
        });
        console.log(`✅ messages: 1 rekord (z channel)`);
      } catch (channelError) {
        console.log(`⚠️  messages z channel błąd: ${channelError.message.substring(0, 60)}...`);
      }
    }

    // 4. AI Models - sprawdź wszystkie wymagane pola
    console.log('\n🧠 AI Models...');
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        const aiModel = await prisma.aIModel.create({
          data: {
            name: 'GPT-4',
            displayName: 'OpenAI GPT-4 Model',
            description: 'GPT-4 language model',  // może wymagane
            config: { 
              model: 'gpt-4',
              maxTokens: 4000,
              temperature: 0.7
            },
            providerId: provider.id,
            organizationId: organization.id
          }
        });
        console.log(`✅ ai_models: 1 rekord`);
      } else {
        console.log('⚠️  ai_models: brak AI Provider');
      }
    } catch (error) {
      console.log(`⚠️  ai_models błąd: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n🎯 SPRAWDZANIE CZY OSIĄGNĘLIŚMY 90%...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinal4Tables();