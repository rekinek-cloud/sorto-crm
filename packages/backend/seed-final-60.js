const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFinal60() {
  console.log('🎯 FINAL PUSH TO 60% - ostatnie 2-3 tabele...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 57/97 (58.8%)');
    console.log('🎯 Cel: 60% (58 tabel) = +1-3 tabele \\n');

    // 1. AIExecution - wykonanie AI (bardzo proste)
    console.log('🤖 AIExecution...');
    try {
      await prisma.aIExecution.create({
        data: {
          status: 'SUCCESS',
          duration: 125,
          organizationId: organization.id
        }
      });
      console.log('✅ aIExecution: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIExecution: ${error.message.substring(0, 80)}...`);
    }

    // 2. Spróbuję CriticalPath z minimalnymi polami
    console.log('\\n🛤️ CriticalPath...');
    try {
      if (task) {
        await prisma.criticalPath.create({
          data: {
            taskId: task.id
          }
        });
        console.log('✅ criticalPath: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  criticalPath: brak task');
      }
    } catch (error) {
      console.log(`⚠️  criticalPath: ${error.message.substring(0, 80)}...`);
    }

    // 3. Notification - powiadomienie (może nie ma userId?)
    console.log('\\n🔔 Notification...');
    try {
      await prisma.notification.create({
        data: {
          title: 'System Maintenance',
          content: 'Scheduled maintenance tonight at 2 AM',
          type: 'SYSTEM',
          isRead: false,
          organizationId: organization.id
        }
      });
      console.log('✅ notification: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  notification: ${error.message.substring(0, 80)}...`);
    }

    // 4. AutoReply - automatyczna odpowiedź
    console.log('\\n🔄 AutoReply...');
    try {
      await prisma.autoReply.create({
        data: {
          name: 'Out of Office',
          subject: 'Auto-Reply: Out of Office',
          content: 'Thank you for your email. I am currently out of office...',
          status: 'INACTIVE',
          organizationId: organization.id
        }
      });
      console.log('✅ autoReply: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  autoReply: ${error.message.substring(0, 80)}...`);
    }

    // 5. Spróbuję jeszcze AIModel (może bez providerId?)
    console.log('\\n🧠 AIModel...');
    try {
      await prisma.aIModel.create({
        data: {
          name: 'GPT-3.5-turbo',
          version: '1.0',
          displayName: 'OpenAI GPT-3.5 Turbo'
        }
      });
      console.log('✅ aIModel: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIModel: ${error.message.substring(0, 80)}...`);
    }

    // 6. DocumentVersion - wersja dokumentu
    console.log('\\n📄 DocumentVersion...');
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentVersion.create({
          data: {
            version: '1.0',
            content: 'Initial version of the document',
            documentId: document.id,
            createdById: user.id
          }
        });
        console.log('✅ documentVersion: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentVersion: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentVersion: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 FINAL 60% PUSH: +${successCount} nowych tabel!`);
    
    const newTotal = 57 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 60) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 60%! FANTASTYCZNY POSTĘP! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 70% (68 tabel)!');
    }
    if (newTotal >= 58) {
      console.log('🌟 Blisko 60%! Niesamowity sukces!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinal60();