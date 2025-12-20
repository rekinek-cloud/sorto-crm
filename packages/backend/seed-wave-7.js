const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave7() {
  console.log('🌊 WAVE 7 - sprint do 60%...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 57/97 (58.8%)');
    console.log('🎯 Cel: 60% = +3 tabele \\n');

    // 1. AIModel - model AI (sprawdzę bez providerId)
    console.log('🤖 AIModel...');
    try {
      await prisma.aIModel.create({
        data: {
          name: 'gpt-3.5-turbo',
          displayName: 'OpenAI GPT-3.5 Turbo',
          type: 'CHAT',
          status: 'ACTIVE'
        }
      });
      console.log('✅ aIModel: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIModel: ${error.message.substring(0, 80)}...`);
    }

    // 2. Invoice - faktura (z wymaganymi polami)
    console.log('\\n🧾 Invoice...');
    try {
      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-001',
          title: 'CRM License Invoice',
          amount: 2500.00,
          status: 'PENDING',
          organizationId: organization.id
        }
      });
      console.log('✅ invoice: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  invoice: ${error.message.substring(0, 80)}...`);
    }

    // 3. Offer - oferta (z wymaganymi polami)
    console.log('\\n💼 Offer...');
    try {
      await prisma.offer.create({
        data: {
          offerNumber: 'OFF-2025-001',
          title: 'CRM Implementation Offer',
          status: 'DRAFT',
          organizationId: organization.id
        }
      });
      console.log('✅ offer: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  offer: ${error.message.substring(0, 80)}...`);
    }

    // 4. InvoiceItem - pozycja faktury (jeśli invoice się udało)
    console.log('\\n📄 InvoiceItem...');
    try {
      const invoice = await prisma.invoice.findFirst();
      if (invoice) {
        await prisma.invoiceItem.create({
          data: {
            itemType: 'SERVICE',
            quantity: 1,
            unitPrice: 2500.00,
            invoiceId: invoice.id
          }
        });
        console.log('✅ invoiceItem: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  invoiceItem: brak invoice');
      }
    } catch (error) {
      console.log(`⚠️  invoiceItem: ${error.message.substring(0, 80)}...`);
    }

    // 5. OfferItem - pozycja oferty
    console.log('\\n📋 OfferItem...');
    try {
      const offer = await prisma.offer.findFirst();
      if (offer) {
        await prisma.offerItem.create({
          data: {
            itemType: 'SERVICE',
            quantity: 1,
            unitPrice: 15000.00,
            offerId: offer.id
          }
        });
        console.log('✅ offerItem: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  offerItem: brak offer');
      }
    } catch (error) {
      console.log(`⚠️  offerItem: ${error.message.substring(0, 80)}...`);
    }

    // 6. ProcessingRule - reguła przetwarzania
    console.log('\\n⚙️ ProcessingRule...');
    try {
      await prisma.processingRule.create({
        data: {
          name: 'Urgent Email Priority',
          pattern: 'URGENT|ASAP|CRITICAL',
          action: 'SET_HIGH_PRIORITY',
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ processingRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  processingRule: ${error.message.substring(0, 80)}...`);
    }

    // 7. AutoReply - automatyczna odpowiedź (z minimalnymi polami)
    console.log('\\n🔄 AutoReply...');
    try {
      await prisma.autoReply.create({
        data: {
          name: 'Out of Office Auto Reply',
          subject: 'Out of Office - Auto Response',
          content: 'Thank you for your email. I am currently out of office and will respond when I return.',
          triggerConditions: {},
          status: 'INACTIVE',
          organizationId: organization.id
        }
      });
      console.log('✅ autoReply: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  autoReply: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 7 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 57 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 60) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 60%! FANTASTYCZNY KAMIEŃ MILOWY! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 70% (68 tabel)!');
    }
    if (newTotal >= 58) {
      console.log('🌟 Bardzo blisko 60%! Niesamowity postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave7();