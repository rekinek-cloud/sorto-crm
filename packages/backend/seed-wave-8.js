const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave8() {
  console.log('🌊 WAVE 8 - w kierunku 65%...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 59/97 (60.8%)');
    console.log('🎯 Cel: 65% (63 tabele) = +4-6 tabel \\n');

    // 1. EmailRule - reguła email
    console.log('📧 EmailRule...');
    try {
      await prisma.emailRule.create({
        data: {
          name: 'Newsletter Filter',
          description: 'Automatically categorize newsletters',
          senderDomain: 'newsletter.com',
          assignCategory: 'NEWSLETTER',
          organizationId: organization.id
        }
      });
      console.log('✅ emailRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailRule: ${error.message.substring(0, 80)}...`);
    }

    // 2. EmailTemplate - szablon email
    console.log('\\n✉️ EmailTemplate...');
    try {
      await prisma.emailTemplate.create({
        data: {
          name: 'Welcome New User',
          subject: 'Welcome to CRM-GTD Smart!',
          htmlTemplate: '<h1>Welcome {{firstName}}!</h1><p>Thank you for joining {{companyName}}.</p>',
          organizationId: organization.id
        }
      });
      console.log('✅ emailTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailTemplate: ${error.message.substring(0, 80)}...`);
    }

    // 3. Message - wiadomość (sprawdzę z istniejącym channel)
    console.log('\\n💬 Message...');
    try {
      const channel = await prisma.communicationChannel.findFirst();
      if (channel) {
        await prisma.message.create({
          data: {
            channelId: channel.id,
            content: 'Welcome to the CRM system! Here are your first steps...',
            fromAddress: 'system@crm-gtd.com',
            toAddress: 'user@company.com',
            subject: 'Getting Started Guide',
            status: 'SENT',
            organizationId: organization.id
          }
        });
        console.log('✅ message: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  message: brak communicationChannel');
      }
    } catch (error) {
      console.log(`⚠️  message: ${error.message.substring(0, 80)}...`);
    }

    // 4. MessageAttachment - załącznik wiadomości
    console.log('\\n📎 MessageAttachment...');
    try {
      const message = await prisma.message.findFirst();
      if (message) {
        await prisma.messageAttachment.create({
          data: {
            fileName: 'getting-started.pdf',
            fileType: 'application/pdf',
            fileSize: 512000,
            messageId: message.id
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

    // 5. EmailLog - log emaili (sprawdzę z prostszymi polami)
    console.log('\\n📨 EmailLog...');
    try {
      await prisma.emailLog.create({
        data: {
          provider: 'SMTP',
          messageId: 'msg-456-xyz',
          toAddresses: ['client@company.com'],
          subject: 'System Notification',
          status: 'SENT',
          organizationId: organization.id
        }
      });
      console.log('✅ emailLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailLog: ${error.message.substring(0, 80)}...`);
    }

    // 6. ErrorLog - log błędów (sprawdzę z wymaganymi polami)
    console.log('\\n⚠️ ErrorLog...');
    try {
      await prisma.errorLog.create({
        data: {
          message: 'Database connection timeout occurred',
          url: '/api/v1/tasks',
          userAgent: 'Mozilla/5.0 (Chrome)',
          severity: 'MEDIUM',
          sessionId: 'session-123-abc',
          timestamp: new Date(),
          organizationId: organization.id
        }
      });
      console.log('✅ errorLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  errorLog: ${error.message.substring(0, 80)}...`);
    }

    // 7. BugReport - raport błędu
    console.log('\\n🐛 BugReport...');
    try {
      await prisma.bugReport.create({
        data: {
          title: 'Dashboard Loading Issue',
          description: 'Dashboard takes too long to load on mobile devices',
          priority: 'MEDIUM',
          status: 'OPEN',
          reportedById: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ bugReport: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  bugReport: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 8 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 59 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 65) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 65%! KOLEJNY KAMIEŃ MILOWY! 🎊🎊🎊');
    }
    if (newTotal >= 63) {
      console.log('🌟 Blisko 65%! Niesamowity postęp w kierunku 70%!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave8();