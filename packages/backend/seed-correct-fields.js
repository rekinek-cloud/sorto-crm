const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCorrectFields() {
  console.log('✅ POPRAWNE POLA - finalny push do 90%...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Obecny stan: 20/27 tabel (74.1%)');
    console.log('🎯 Cel: 25/27 tabel (90.0%)\n');

    // 1. AI Models - z displayName
    console.log('🧠 AI Models...');
    try {
      const provider = await prisma.aIProvider.findFirst();
      if (provider) {
        const aiModel = await prisma.aIModel.create({
          data: {
            name: 'GPT-4',
            displayName: 'OpenAI GPT-4',          // WYMAGANE!
            providerId: provider.id,
            organizationId: organization.id
          }
        });
        console.log(`✅ ai_models: 1 rekord`);
      }
    } catch (error) {
      console.log(`⚠️  ai_models błąd: ${error.message.substring(0, 80)}...`);
    }

    // 2. Orders - bez createdById
    console.log('\n📦 Orders...');
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-2025-001',
          title: 'Enterprise CRM Order',
          customer: 'BigCorp Inc',
          status: 'PENDING',
          organizationId: organization.id
          // NIE MA createdById!
        }
      });
      console.log(`✅ orders: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  orders błąd: ${error.message.substring(0, 80)}...`);
    }

    // 3. Invoices - z title, bez createdById
    console.log('\n🧾 Invoices...');
    try {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-001',
          title: 'CRM Implementation Invoice',  // WYMAGANE!
          status: 'SENT',
          organizationId: organization.id
          // NIE MA createdById!
        }
      });
      console.log(`✅ invoices: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  invoices błąd: ${error.message.substring(0, 80)}...`);
    }

    // 4. Offers - z customerName, bez createdById
    console.log('\n💰 Offers...');
    try {
      const offer = await prisma.offer.create({
        data: {
          offerNumber: 'OFF-2025-001',
          title: 'Enterprise CRM Package',
          customerName: 'BigCorp Inc',           // WYMAGANE!
          status: 'DRAFT',
          organizationId: organization.id
          // NIE MA createdById!
        }
      });
      console.log(`✅ offers: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  offers błąd: ${error.message.substring(0, 80)}...`);
    }

    // 5. Messages - z toAddress
    console.log('\n📧 Messages...');
    try {
      const message = await prisma.message.create({
        data: {
          content: 'Project status update message',
          fromAddress: 'manager@company.com',
          toAddress: 'team@company.com',         // WYMAGANE!
          status: 'PROCESSED',
          organizationId: organization.id
        }
      });
      console.log(`✅ messages: 1 rekord`);
    } catch (error) {
      console.log(`⚠️  messages błąd: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n🎯 SPRAWDZANIE CZY OSIĄGNĘLIŚMY 90%...');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCorrectFields();