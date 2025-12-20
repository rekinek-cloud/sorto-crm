const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave3() {
  console.log('🌊 WAVE 3 - kolejne proste modele...n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 39/97 (40.2%)');
    console.log('🎯 Focus: modele z minimalnymi wymaganiami n');

    // 1. TaskRelationship - relacja między zadaniami
    console.log('🔗 TaskRelationship...');
    try {
      if (task) {
        await prisma.taskRelationship.create({
          data: {
            type: 'FINISH_TO_START',
            fromTaskId: task.id,
            toTaskId: task.id
          }
        });
        console.log('✅ taskRelationship: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  taskRelationship: brak task');
      }
    } catch (error) {
      console.log(`⚠️  taskRelationship: ${error.message.substring(0, 80)}...`);
    }

    // 2. WikiPageLink - link między wiki pages
    console.log('\n🔗 WikiPageLink...');
    try {
      const wikiPage = await prisma.wikiPage.findFirst();
      if (wikiPage) {
        await prisma.wikiPageLink.create({
          data: {
            sourcePageId: wikiPage.id,
            targetPageId: wikiPage.id,
            linkText: 'See also'
          }
        });
        console.log('✅ wikiPageLink: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  wikiPageLink: brak wikiPage');
      }
    } catch (error) {
      console.log(`⚠️  wikiPageLink: ${error.message.substring(0, 80)}...`);
    }

    // 3. AreaOfResponsibility - obszar odpowiedzialności GTD
    console.log('\n🎯 AreaOfResponsibility...');
    try {
      await prisma.areaOfResponsibility.create({
        data: {
          name: 'Customer Support',
          description: 'Handle customer inquiries and support',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ areaOfResponsibility: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  areaOfResponsibility: ${error.message.substring(0, 80)}...`);
    }

    // 4. FocusMode - tryb koncentracji
    console.log('\n🎯 FocusMode...');
    try {
      await prisma.focusMode.create({
        data: {
          name: 'Deep Work',
          description: 'Distraction-free work mode',
          duration: 90,
          isActive: false,
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ focusMode: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  focusMode: ${error.message.substring(0, 80)}...`);
    }

    // 5. UserRelation - relacje między użytkownikami
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

    // 6. BugReport - raport błędu
    console.log('\n🐛 BugReport...');
    try {
      await prisma.bugReport.create({
        data: {
          title: 'Slow page loading',
          description: 'Dashboard takes too long to load',
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

    // 7. Activity - aktywność użytkownika
    console.log('\n📋 Activity...');
    try {
      await prisma.activity.create({
        data: {
          type: 'TASK_CREATED',
          description: 'User created new task',
          entityType: 'TASK',
          entityId: task?.id || '',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ activity: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  activity: ${error.message.substring(0, 80)}...`);
    }

    // 8. ErrorLog - log błędów
    console.log('\n⚠️ ErrorLog...');
    try {
      await prisma.errorLog.create({
        data: {
          level: 'WARNING',
          message: 'Database connection timeout',
          stack: 'at Connection.connect()',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ errorLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  errorLog: ${error.message.substring(0, 80)}...`);
    }

    // 9. RecurringTask - zadanie cykliczne
    console.log('\n🔄 RecurringTask...');
    try {
      await prisma.recurringTask.create({
        data: {
          title: 'Weekly Team Sync',
          description: 'Regular team meeting',
          frequency: 'WEEKLY',
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ recurringTask: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  recurringTask: ${error.message.substring(0, 80)}...`);
    }

    // 10. DelegatedTask - zadanie delegowane
    console.log('\n👥 DelegatedTask...');
    try {
      await prisma.delegatedTask.create({
        data: {
          title: 'Prepare Q4 Report',
          description: 'Quarterly financial report',
          dueDate: new Date('2025-02-01'),
          status: 'PENDING',
          delegatedById: user.id,
          delegatedToId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ delegatedTask: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  delegatedTask: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 WAVE 3 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 39 + successCount;
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

seedWave3();