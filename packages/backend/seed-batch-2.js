const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBatch2() {
  console.log('🚀 BATCH 2 - kolejne proste modele...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan początkowy: 37/97 (38.1%)');
    console.log('🎯 Cel: +10 tabel w tej rundzie\n');

    // 1. Auto Reply - prosty model komunikacji
    console.log('🔄 Auto Reply...');
    try {
      await prisma.autoReply.create({
        data: {
          name: 'Out of Office Reply',
          subject: 'Out of Office - Auto Reply',
          content: 'Thank you for your email. I am currently out of office...',
          triggerConditions: { keywords: ['urgent', 'important'] },
          isActive: false,
          organizationId: organization.id
        }
      });
      console.log('✅ autoReply: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  autoReply: ${error.message.substring(0, 80)}...`);
    }

    // 2. Email Log - komunikacja
    console.log('\n📧 Email Log...');
    try {
      await prisma.emailLog.create({
        data: {
          provider: 'SMTP',
          messageId: 'msg_123abc',
          toAddresses: ['user@company.com'],
          subject: 'Test Email Log',
          status: 'SENT',
          organizationId: organization.id
        }
      });
      console.log('✅ emailLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailLog: ${error.message.substring(0, 80)}...`);
    }

    // 3. Focus Mode - GTD
    console.log('\n🎯 Focus Mode...');
    try {
      await prisma.focusMode.create({
        data: {
          name: 'Deep Work Session',
          description: 'Focused work session without distractions',
          duration: 90,
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ focusMode: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  focusMode: ${error.message.substring(0, 80)}...`);
    }

    // 4. Area of Responsibility - GTD
    console.log('\n🎯 Area of Responsibility...');
    try {
      await prisma.areaOfResponsibility.create({
        data: {
          name: 'Customer Relations',
          description: 'Manage customer relationships and support',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ areaOfResponsibility: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  areaOfResponsibility: ${error.message.substring(0, 80)}...`);
    }

    // 5. User Relation - relacje użytkowników
    console.log('\n👥 User Relation...');
    try {
      await prisma.userRelation.create({
        data: {
          type: 'MANAGES',
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

    // 6. Error Log - monitoring
    console.log('\n⚠️ Error Log...');
    try {
      await prisma.errorLog.create({
        data: {
          level: 'WARNING',
          message: 'Database connection timeout',
          stack: 'at Connection.connect() timeout',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ errorLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  errorLog: ${error.message.substring(0, 80)}...`);
    }

    // 7. Activity - monitoring aktywności
    console.log('\n📋 Activity...');
    try {
      const task = await prisma.task.findFirst();
      await prisma.activity.create({
        data: {
          type: 'TASK_CREATED',
          description: 'User created a new task',
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

    // 8. Bug Report - quality assurance
    console.log('\n🐛 Bug Report...');
    try {
      await prisma.bugReport.create({
        data: {
          title: 'Slow page loading',
          description: 'Dashboard page takes too long to load',
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

    // 9. Recurring Task - GTD
    console.log('\n🔄 Recurring Task...');
    try {
      await prisma.recurringTask.create({
        data: {
          title: 'Weekly Team Sync',
          description: 'Regular team synchronization meeting',
          frequency: 'WEEKLY',
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ recurringTask: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  recurringTask: ${error.message.substring(0, 80)}...`);
    }

    // 10. Delegated Task - GTD
    console.log('\n👥 Delegated Task...');
    try {
      await prisma.delegatedTask.create({
        data: {
          title: 'Prepare Q4 Report',
          description: 'Quarterly financial report preparation',
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
    console.log(`🎉 BATCH 2 UKOŃCZONY: +${successCount} nowych tabel!`);
    
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

seedBatch2();