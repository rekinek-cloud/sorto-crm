const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSimpleBatch() {
  console.log('🎯 SIMPLE BATCH - bardzo proste modele...n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 37/97 (38.1%)');
    console.log('🎯 Focus: bardzo proste modele bez skomplikowanych relacji\n');

    // 1. WikiPage - prosty model
    console.log('📄 WikiPage...');
    try {
      await prisma.wikiPage.create({
        data: {
          title: 'Quick Start Guide',
          slug: 'quick-start-guide',
          content: 'Welcome to the CRM-GTD Smart system...',
          isPublished: true,
          authorId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ wikiPage: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  wikiPage: ${error.message.substring(0, 80)}...`);
    }

    // 2. WeeklyReview - tylko wymagane pola
    console.log('\n📋 WeeklyReview...');
    try {
      await prisma.weeklyReview.create({
        data: {
          reviewDate: new Date(),
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ weeklyReview: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  weeklyReview: ${error.message.substring(0, 80)}...`);
    }

    // 3. EmailRule - prosty model
    console.log('\n📧 EmailRule...');
    try {
      await prisma.emailRule.create({
        data: {
          name: 'Newsletter Filter',
          assignCategory: 'NEWSLETTER',
          organizationId: organization.id
        }
      });
      console.log('✅ emailRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailRule: ${error.message.substring(0, 80)}...`);
    }

    // 4. SmartMailbox - prosty model
    console.log('\n📬 SmartMailbox...');
    try {
      await prisma.smartMailbox.create({
        data: {
          name: 'Important Today',
          description: 'High priority emails for today',
          filters: { priority: 'HIGH', date: 'today' },
          organizationId: organization.id
        }
      });
      console.log('✅ smartMailbox: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smartMailbox: ${error.message.substring(0, 80)}...`);
    }

    // 5. EmailTemplate - prosty
    console.log('\n✉️ EmailTemplate...');
    try {
      await prisma.emailTemplate.create({
        data: {
          name: 'Welcome Email',
          subject: 'Welcome to CRM-GTD Smart',
          content: 'Thank you for joining us...',
          organizationId: organization.id
        }
      });
      console.log('✅ emailTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailTemplate: ${error.message.substring(0, 80)}...`);
    }

    // 6. GTDBucket - prosty enum model
    console.log('\n🪣 GTDBucket...');
    try {
      await prisma.gTDBucket.create({
        data: {
          name: 'Immediate Actions',
          description: 'Tasks to be done immediately (less than 2 minutes)',
          bucketType: 'DO',
          organizationId: organization.id
        }
      });
      console.log('✅ gTDBucket: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  gTDBucket: ${error.message.substring(0, 80)}...`);
    }

    // 7. GTDHorizon - prosty model z poziomami
    console.log('\n🌅 GTDHorizon...');
    try {
      await prisma.gTDHorizon.create({
        data: {
          level: 0,
          name: 'Actions & Projects',
          description: 'Ground level - current tasks and projects',
          organizationId: organization.id
        }
      });
      console.log('✅ gTDHorizon: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  gTDHorizon: ${error.message.substring(0, 80)}...`);
    }

    // 8. ProcessingRule - prosty model regul
    console.log('\n⚙️ ProcessingRule...');
    try {
      await prisma.processingRule.create({
        data: {
          name: 'Auto Priority High',
          pattern: 'URGENT',
          action: 'SET_PRIORITY_HIGH',
          organizationId: organization.id
        }
      });
      console.log('✅ processingRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  processingRule: ${error.message.substring(0, 80)}...`);
    }

    // 9. Invoice - business model
    console.log('\n🧾 Invoice...');
    try {
      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-001',
          amount: 2500.00,
          status: 'DRAFT',
          organizationId: organization.id
        }
      });
      console.log('✅ invoice: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  invoice: ${error.message.substring(0, 80)}...`);
    }

    // 10. Offer - business model  
    console.log('\n💼 Offer...');
    try {
      await prisma.offer.create({
        data: {
          title: 'CRM Implementation Package',
          totalValue: 15000.00,
          status: 'DRAFT',
          organizationId: organization.id
        }
      });
      console.log('✅ offer: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  offer: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 SIMPLE BATCH: +${successCount} nowych tabel!`);
    
    const newTotal = 37 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - połowę drogi!');
    }
    if (newTotal >= 50) {
      console.log('🎊 Ponad 50% wypełnienia!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSimpleBatch();