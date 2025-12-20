const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFinal50() {
  console.log('🎊 FINAL PUSH TO 50% - ostatnie 3 tabele...n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const document = await prisma.document.findFirst();
    const message = await prisma.message.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 47/97 (48.5%)');
    console.log('🎯 Cel: osiągnąć 50/97 (51.5%) = +3 tabele n');

    // Najpierw sprawdzę czy message istnieje, jeśli nie to utworzę
    if (!message) {
      console.log('📧 Tworzę Message...');
      try {
        const channel = await prisma.communicationChannel.findFirst();
        if (channel) {
          await prisma.message.create({
            data: {
              channelId: channel.id,
              content: 'Welcome to CRM system',
              fromAddress: 'system@crm.local',
              toAddress: 'user@company.com',
              subject: 'Welcome',
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
    }

    // 1. MessageAttachment - załącznik do wiadomości
    console.log('\n📎 MessageAttachment...');
    try {
      const messageForAttachment = await prisma.message.findFirst();
      if (messageForAttachment) {
        await prisma.messageAttachment.create({
          data: {
            fileName: 'document.pdf',
            fileType: 'application/pdf',
            fileSize: 102400,
            messageId: messageForAttachment.id
          }
        });
        console.log('✅ messageAttachment: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  messageAttachment: brak message');
      }
    } catch (error) {
      console.log(`⚠️  messageAttachment: ${error.message.substring(0, 80)}...`);
    }

    // 2. Invoice - faktura (może już istnieje, sprawdzę)
    console.log('\n🧾 Invoice...');
    try {
      const existingInvoice = await prisma.invoice.count();
      if (existingInvoice === 0) {
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
      } else {
        console.log('ℹ️  invoice: już istnieje');
      }
    } catch (error) {
      console.log(`⚠️  invoice: ${error.message.substring(0, 80)}...`);
    }

    // 3. InvoiceItem - pozycja faktury
    console.log('\n📄 InvoiceItem...');
    try {
      const invoice = await prisma.invoice.findFirst();
      if (invoice) {
        await prisma.invoiceItem.create({
          data: {
            name: 'CRM License',
            quantity: 1,
            unitPrice: 2500.00,
            totalPrice: 2500.00,
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

    // 4. Offer - oferta (może nie istnieje)
    console.log('\n💼 Offer...');
    try {
      const existingOffer = await prisma.offer.count();
      if (existingOffer === 0) {
        await prisma.offer.create({
          data: {
            title: 'CRM Implementation',
            totalValue: 15000.00,
            status: 'DRAFT',
            organizationId: organization.id
          }
        });
        console.log('✅ offer: 1 rekord');
        successCount++;
      } else {
        console.log('ℹ️  offer: już istnieje');
      }
    } catch (error) {
      console.log(`⚠️  offer: ${error.message.substring(0, 80)}...`);
    }

    // 5. OfferItem - pozycja oferty
    console.log('\n📋 OfferItem...');
    try {
      const offer = await prisma.offer.findFirst();
      if (offer) {
        await prisma.offerItem.create({
          data: {
            name: 'Implementation Service',
            quantity: 1,
            unitPrice: 15000.00,
            totalPrice: 15000.00,
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

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 FINAL 50% PUSH: +${successCount} nowych tabel!`);
    
    const newTotal = 47 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 50) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 50%! PÓŁMETEK! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 60% (58 tabel)!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinal50();