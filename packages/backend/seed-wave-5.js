const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave5() {
  console.log('🌊 WAVE 5 - dążenie do 60%...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 52/97 (53.6%)');
    console.log('🎯 Cel: 60% wypełnienia = +6-8 tabel \\n');

    // 1. AIUsageStats - statystyki AI
    console.log('📊 AIUsageStats...');
    try {
      await prisma.aIUsageStats.create({
        data: {
          date: new Date(),
          totalExecutions: 45,
          successfulExecutions: 42,
          failedExecutions: 3,
          totalTokensUsed: 15000,
          totalCost: 7.50,
          organizationId: organization.id
        }
      });
      console.log('✅ aIUsageStats: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIUsageStats: ${error.message.substring(0, 80)}...`);
    }

    // 2. Activity - aktywność użytkownika
    console.log('\\n📋 Activity...');
    try {
      await prisma.activity.create({
        data: {
          type: 'TASK_CREATED',
          title: 'New Task Created',
          description: 'User created a new task in project',
          organizationId: organization.id,
          userId: user.id
        }
      });
      console.log('✅ activity: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  activity: ${error.message.substring(0, 80)}...`);
    }

    // 3. UserAccessLog - log dostępu użytkownika
    console.log('\\n🔑 UserAccessLog...');
    try {
      await prisma.userAccessLog.create({
        data: {
          userId: user.id,
          action: 'view_profile',
          accessType: 'DIRECT',
          success: true,
          organizationId: organization.id
        }
      });
      console.log('✅ userAccessLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userAccessLog: ${error.message.substring(0, 80)}...`);
    }

    // 4. UserRelation - relacja użytkowników
    console.log('\\n👥 UserRelation...');
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

    // 5. ErrorLog - log błędów
    console.log('\\n⚠️ ErrorLog...');
    try {
      await prisma.errorLog.create({
        data: {
          level: 'WARNING',
          message: 'Database connection timeout',
          source: 'DatabaseService',
          organizationId: organization.id
        }
      });
      console.log('✅ errorLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  errorLog: ${error.message.substring(0, 80)}...`);
    }

    // 6. BugReport - raport błędu
    console.log('\\n🐛 BugReport...');
    try {
      await prisma.bugReport.create({
        data: {
          title: 'Slow loading dashboard',
          description: 'Dashboard page takes more than 10 seconds to load',
          severity: 'MEDIUM',
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

    // 7. AIKnowledgeBase - baza wiedzy AI
    console.log('\\n🧠 AIKnowledgeBase...');
    try {
      await prisma.aIKnowledgeBase.create({
        data: {
          name: 'Customer Support KB',
          description: 'Knowledge base for customer support AI',
          organizationId: organization.id
        }
      });
      console.log('✅ aIKnowledgeBase: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIKnowledgeBase: ${error.message.substring(0, 80)}...`);
    }

    // 8. EmailTemplate - szablon email
    console.log('\\n✉️ EmailTemplate...');
    try {
      await prisma.emailTemplate.create({
        data: {
          name: 'Welcome New User',
          subject: 'Welcome to CRM-GTD Smart',
          content: 'Welcome to our system! We are glad to have you...',
          organizationId: organization.id
        }
      });
      console.log('✅ emailTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailTemplate: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 5 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 52 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 60) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 60%! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 70% (68 tabel)!');
    }
    if (newTotal >= 58) {
      console.log('🌟 Blisko 60%! Niesamowity postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave5();