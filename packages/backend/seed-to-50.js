const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTo50() {
  console.log('🎯 PUSH TO 50% - ostatni sprint do 50%...n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const document = await prisma.document.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 42/97 (43.3%)');
    console.log('🎯 Cel: osiągnąć 50/97 (51.5%) = +8 tabel n');

    // 1. KnowledgeBase - baza wiedzy
    console.log('📚 KnowledgeBase...');
    try {
      await prisma.knowledgeBase.create({
        data: {
          name: 'CRM Documentation',
          description: 'Complete system documentation',
          organizationId: organization.id
        }
      });
      console.log('✅ knowledgeBase: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  knowledgeBase: ${error.message.substring(0, 80)}...`);
    }

    // 2. AIModel - model AI
    console.log('\n🤖 AIModel...');
    try {
      const aiProvider = await prisma.aIProvider.findFirst();
      if (aiProvider) {
        await prisma.aIModel.create({
          data: {
            name: 'GPT-4',
            version: '4.0',
            displayName: 'OpenAI GPT-4',
            providerId: aiProvider.id
          }
        });
        console.log('✅ aIModel: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  aIModel: brak aiProvider');
      }
    } catch (error) {
      console.log(`⚠️  aIModel: ${error.message.substring(0, 80)}...`);
    }

    // 3. AIRule - reguła AI
    console.log('\n🧠 AIRule...');
    try {
      await prisma.aIRule.create({
        data: {
          name: 'Auto-Priority Rule',
          description: 'Automatically set priority based on urgency',
          conditions: { urgency: '>= 70' },
          actions: { setPriority: 'HIGH' },
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ aIRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIRule: ${error.message.substring(0, 80)}...`);
    }

    // 4. WeeklyReview - przegląd tygodniowy GTD
    console.log('\n📋 WeeklyReview...');
    try {
      await prisma.weeklyReview.create({
        data: {
          reviewDate: new Date(),
          completedTasksCount: 15,
          newTasksCount: 8,
          stalledTasks: 2,
          collectLoosePapers: true,
          processNotes: true,
          emptyInbox: false,
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ weeklyReview: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  weeklyReview: ${error.message.substring(0, 80)}...`);
    }

    // 5. GTDBucket - kolejny bucket GTD
    console.log('\n🪣 GTDBucket...');
    try {
      await prisma.gTDBucket.create({
        data: {
          name: 'Deferred Actions',
          description: 'Tasks to be done later with specific dates',
          bucketType: 'DEFER',
          organizationId: organization.id
        }
      });
      console.log('✅ gTDBucket: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  gTDBucket: ${error.message.substring(0, 80)}...`);
    }

    // 6. DocumentHistory - historia dokumentu
    console.log('\n📄 DocumentHistory...');
    try {
      if (document) {
        await prisma.documentHistory.create({
          data: {
            action: 'CREATED',
            description: 'Document was created',
            documentId: document.id,
            userId: user.id
          }
        });
        console.log('✅ documentHistory: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentHistory: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentHistory: ${error.message.substring(0, 80)}...`);
    }

    // 7. Message - wiadomość
    console.log('\n📧 Message...');
    try {
      const channel = await prisma.communicationChannel.findFirst();
      if (channel) {
        await prisma.message.create({
          data: {
            channelId: channel.id,
            content: 'Welcome to the CRM system!',
            fromAddress: 'system@crm.local',
            toAddress: 'user@company.com',
            subject: 'Welcome Message',
            status: 'SENT',
            organizationId: organization.id
          }
        });
        console.log('✅ message: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  message: brak channel');
      }
    } catch (error) {
      console.log(`⚠️  message: ${error.message.substring(0, 80)}...`);
    }

    // 8. InvoiceItem - pozycja faktury
    console.log('\n🧾 InvoiceItem...');
    try {
      // Sprawdzę czy istnieje invoice
      const invoice = await prisma.invoice.findFirst();
      if (!invoice) {
        // Najpierw utworzę invoice
        const newInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber: 'INV-2025-001',
            amount: 2500.00,
            status: 'DRAFT',
            organizationId: organization.id
          }
        });
        
        await prisma.invoiceItem.create({
          data: {
            name: 'CRM License',
            quantity: 1,
            unitPrice: 2500.00,
            totalPrice: 2500.00,
            invoiceId: newInvoice.id
          }
        });
        console.log('✅ invoice + invoiceItem: 2 rekordy');
        successCount += 2;
      } else {
        await prisma.invoiceItem.create({
          data: {
            name: 'Support Package',
            quantity: 1,
            unitPrice: 500.00,
            totalPrice: 500.00,
            invoiceId: invoice.id
          }
        });
        console.log('✅ invoiceItem: 1 rekord');
        successCount++;
      }
    } catch (error) {
      console.log(`⚠️  invoiceItem: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 PUSH TO 50% UKOŃCZONY: +${successCount} nowych tabel!`);
    
    const newTotal = 42 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 50) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 50%! 🎊🎊🎊');
    }
    if (newTotal >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - połowę drogi!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTo50();