const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed90Success() {
  console.log('🎯 OSTATECZNE 5 TABEL DO 90% - POPRAWNE POLA...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 20/27 tabel (74.1%)');
    console.log('🎯 Cel: 25/27 tabel (90.0%)\n');

    // 1. Orders - wszystkie wymagane pola
    console.log('📦 Orders...');
    try {
      await prisma.order.createMany({
        data: [
          {
            orderNumber: 'ORD-2025-001',
            title: 'Enterprise CRM Order',         // wymagane
            customer: 'BigCorp Inc',              // wymagane
            status: 'PENDING',
            totalAmount: 9999.99,
            currency: 'USD',
            customerEmail: 'orders@bigcorp.com',
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ orders: 1 rekord');
    } catch (error) {
      console.log(`⚠️  orders: ${error.message.substring(0, 100)}...`);
    }

    // 2. Invoices - wszystkie wymagane pola
    console.log('\n🧾 Invoices...');
    try {
      await prisma.invoice.createMany({
        data: [
          {
            invoiceNumber: 'INV-2025-001',
            title: 'CRM Implementation Invoice',   // sprawdź czy wymagane
            customer: 'BigCorp Inc',              // sprawdź czy wymagane
            status: 'SENT',
            totalAmount: 9999.99,
            currency: 'USD',
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ invoices: 1 rekord');
    } catch (error) {
      console.log(`⚠️  invoices: ${error.message.substring(0, 100)}...`);
    }

    // 3. Offers - bez niepotrzebnych pól
    console.log('\n💰 Offers...');
    try {
      await prisma.offer.createMany({
        data: [
          {
            offerNumber: 'OFF-2025-001',
            title: 'Enterprise CRM Package',
            status: 'DRAFT',
            totalAmount: 9999.99,
            currency: 'USD',
            organizationId: organization.id,
            createdById: user.id
          }
        ]
      });
      console.log('✅ offers: 1 rekord');
    } catch (error) {
      console.log(`⚠️  offers: ${error.message.substring(0, 100)}...`);
    }

    // 4. AI Models - minimalne pola
    console.log('\n🧠 AI Models...');
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        await prisma.aIModel.createMany({
          data: [
            {
              name: 'GPT-4',
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
      console.log(`⚠️  ai_models: ${error.message.substring(0, 100)}...`);
    }

    // 5. Messages - sprawdź czy można bez channelId
    console.log('\n📧 Messages...');
    try {
      // Spróbuj bez channelId (może nie jest wymagane)
      await prisma.message.createMany({
        data: [
          {
            subject: 'Project Update',
            content: 'Status update message',
            fromAddress: 'manager@company.com',
            toAddresses: ['team@company.com'],
            status: 'PROCESSED',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ messages: 1 rekord');
    } catch (error) {
      console.log(`⚠️  messages: ${error.message.substring(0, 100)}...`);
      
      // Jeśli nie, spróbuj z channelId
      try {
        console.log('   🔄 Próbuję z Communication Channel...');
        
        const channel = await prisma.communicationChannel.create({
          data: {
            name: 'default-email',
            type: 'EMAIL',
            config: {},
            organizationId: organization.id
          }
        });

        await prisma.message.create({
          data: {
            channelId: channel.id,
            subject: 'Project Update',
            content: 'Status update message',
            fromAddress: 'manager@company.com',
            toAddresses: ['team@company.com'],
            status: 'PROCESSED',
            organizationId: organization.id
          }
        });
        console.log('✅ messages: 1 rekord (z channel)');
      } catch (secondError) {
        console.log(`⚠️  messages drugi błąd: ${secondError.message.substring(0, 80)}...`);
      }
    }

    console.log('\n🎯 SPRAWDZANIE FINALNEGO WYNIKU...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed90Success();