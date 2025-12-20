const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave11() {
  console.log('🌊 WAVE 11 - przeciągnięcie do 70%...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    const message = await prisma.message?.findFirst?.() || null;
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 63/97 (64.9%)');
    console.log('🎯 Cel: 70% (68 tabel) = +5 tabel \n');

    // 1. AIRule - reguła AI (bardzo proste pola)
    console.log('🤖 AIRule...');
    try {
      await prisma.aIRule.create({
        data: {
          name: 'Auto Priority Assignment',
          description: 'Automatically assign priority based on keywords',
          organizationId: organization.id
        }
      });
      console.log('✅ aIRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIRule: ${error.message.substring(0, 80)}...`);
    }

    // 2. AIExecution - wykonanie AI (bez skomplikowanych pól)
    console.log('\n⚡ AIExecution...');
    try {
      await prisma.aIExecution.create({
        data: {
          status: 'SUCCESS',
          duration: 250,
          organizationId: organization.id
        }
      });
      console.log('✅ aIExecution: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIExecution: ${error.message.substring(0, 80)}...`);
    }

    // 3. VectorDocument - dokument wektorowy (proste embeddingi)
    console.log('\n🔍 VectorDocument...');
    try {
      await prisma.vectorDocument.create({
        data: {
          title: 'User Manual',
          content: 'Complete user manual for CRM-GTD system',
          contentHash: 'hash456def',
          embedding: [0.2, 0.4, 0.6, 0.8, 1.0],
          entityType: 'document',
          organizationId: organization.id
        }
      });
      console.log('✅ vectorDocument: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorDocument: ${error.message.substring(0, 80)}...`);
    }

    // 4. AIModel - model AI
    console.log('\n🧠 AIModel...');
    try {
      const aiProvider = await prisma.aIProvider.findFirst();
      if (aiProvider) {
        await prisma.aIModel.create({
          data: {
            name: 'GPT-4',
            modelType: 'CHAT',
            providerId: aiProvider.id
          }
        });
        console.log('✅ aIModel: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  aIModel: brak aIProvider');
      }
    } catch (error) {
      console.log(`⚠️  aIModel: ${error.message.substring(0, 80)}...`);
    }

    // 5. UnifiedRule - zunifikowana reguła
    console.log('\n⚙️ UnifiedRule...');
    try {
      await prisma.unifiedRule.create({
        data: {
          name: 'Email Priority Filter',
          ruleType: 'EMAIL_FILTER',
          organizationId: organization.id
        }
      });
      console.log('✅ unifiedRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  unifiedRule: ${error.message.substring(0, 80)}...`);
    }

    // 6. UnifiedRuleExecution - wykonanie reguły
    console.log('\n🔄 UnifiedRuleExecution...');
    try {
      const unifiedRule = await prisma.unifiedRule.findFirst();
      if (unifiedRule) {
        await prisma.unifiedRuleExecution.create({
          data: {
            triggeredBy: 'email_received',
            executionTime: 45.2,
            result: 'SUCCESS',
            ruleId: unifiedRule.id
          }
        });
        console.log('✅ unifiedRuleExecution: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  unifiedRuleExecution: brak unifiedRule');
      }
    } catch (error) {
      console.log(`⚠️  unifiedRuleExecution: ${error.message.substring(0, 80)}...`);
    }

    // 7. UserRelation - relacja użytkowników (jeszcze raz)
    console.log('\n👥 UserRelation...');
    try {
      await prisma.userRelation.create({
        data: {
          type: 'COLLABORATES',
          fromUserId: user.id,
          toUserId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ userRelation: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userRelation: ${error.message.substring(0, 80)}...`);
    }

    // 8. ProcessingRule - reguła przetwarzania
    console.log('\n⚙️ ProcessingRule...');
    try {
      await prisma.processingRule.create({
        data: {
          name: 'Urgent Task Creator',
          ruleType: 'AUTO_TASK',
          organizationId: organization.id
        }
      });
      console.log('✅ processingRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  processingRule: ${error.message.substring(0, 80)}...`);
    }

    // 9. EmailRule - reguła emaili
    console.log('\n📧 EmailRule...');
    try {
      await prisma.emailRule.create({
        data: {
          name: 'Spam Filter',
          condition: 'subject contains "SPAM"',
          action: 'DELETE',
          organizationId: organization.id
        }
      });
      console.log('✅ emailRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailRule: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 WAVE 11 FINALNA: +${successCount} nowych tabel!`);
    
    const newTotal = 63 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 70) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 70%! PRZEŁOMOWY WYNIK! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 75% (73 tabele)!');
    }
    if (newTotal >= 68) {
      console.log('🌟 Bardzo blisko 70%! Fenomenalny postęp!');
    }
    if (newTotal >= 65) {
      console.log('✅ Przekroczyliśmy 65%! Doskonały wynik!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave11();