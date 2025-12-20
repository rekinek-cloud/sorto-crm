const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSingleRecords() {
  console.log('🔧 POJEDYNCZE REKORDY - debugowanie błędów Prisma...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 20/27 tabel (74.1%)');
    console.log('🔧 Dodawanie pojedynczych rekordów z debug info...\n');

    // 1. AI Models - single create
    console.log('🧠 AI Models (single)...');
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        console.log(`   Provider ID: ${provider.id}`);
        
        const aiModel = await prisma.aIModel.create({
          data: {
            name: 'GPT-4',
            providerId: provider.id,
            organizationId: organization.id
          }
        });
        console.log(`✅ ai_models: 1 rekord (${aiModel.id})`);
      }
    } catch (error) {
      console.log(`⚠️  ai_models błąd: ${error.message}`);
    }

    // 2. Orders - najprostszy możliwy
    console.log('\n📦 Orders (minimal)...');
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-2025-001',
          title: 'Test Order',
          customer: 'Test Customer',
          organizationId: organization.id,
          createdById: user.id
        }
      });
      console.log(`✅ orders: 1 rekord (${order.id})`);
    } catch (error) {
      console.log(`⚠️  orders błąd: ${error.message}`);
    }

    // 3. Invoices - najprostszy możliwy
    console.log('\n🧾 Invoices (minimal)...');
    try {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-001',
          organizationId: organization.id,
          createdById: user.id
        }
      });
      console.log(`✅ invoices: 1 rekord (${invoice.id})`);
    } catch (error) {
      console.log(`⚠️  invoices błąd: ${error.message}`);
    }

    // 4. Offers - najprostszy możliwy
    console.log('\n💰 Offers (minimal)...');
    try {
      const offer = await prisma.offer.create({
        data: {
          offerNumber: 'OFF-2025-001',
          title: 'Test Offer',
          organizationId: organization.id,
          createdById: user.id
        }
      });
      console.log(`✅ offers: 1 rekord (${offer.id})`);
    } catch (error) {
      console.log(`⚠️  offers błąd: ${error.message}`);
    }

    // 5. Messages - bez channelId
    console.log('\n📧 Messages (bez channel)...');
    try {
      const message = await prisma.message.create({
        data: {
          content: 'Test message content',
          fromAddress: 'test@company.com',
          organizationId: organization.id
        }
      });
      console.log(`✅ messages: 1 rekord (${message.id})`);
    } catch (error) {
      console.log(`⚠️  messages błąd: ${error.message}`);
    }

    console.log('\n🎯 SPRAWDZANIE FINALNEGO WYNIKU...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSingleRecords();