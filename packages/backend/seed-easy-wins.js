const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEasyWins() {
  console.log('🚀 ŁATWE WYGRANE - najprostsze tabele do wypełnienia...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const provider = await prisma.aIProvider.findFirst();
    const contact = await prisma.contact.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    console.log('📊 Cel: +10 tabel w pierwszej rundzie');
    console.log('🎯 Stan: 32/97 → 42/97 (43%)\n');

    let successCount = 0;

    // 1. AI Models - mamy już AI Provider
    console.log('🧠 AI Model...');
    try {
      if (provider) {
        await prisma.aIModel.create({
          data: {
            name: 'GPT-4',
            displayName: 'OpenAI GPT-4',
            config: { model: 'gpt-4' },
            providerId: provider.id,
            organizationId: organization.id
          }
        });
        console.log('✅ aIModel: 1 rekord');
        successCount++;
      }
    } catch (error) {
      console.log(`⚠️  aIModel: ${error.message.substring(0, 60)}...`);
    }

    // 2. Focus Mode - prosty model
    console.log('\n🎯 Focus Mode...');
    try {
      await prisma.focusMode.create({
        data: {
          name: 'Deep Work',
          description: 'Deep focus mode for important tasks',
          duration: 120, // 2 hours
          isActive: true,
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ focusMode: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  focusMode: ${error.message.substring(0, 60)}...`);
    }

    // 3. Weekly Review - już wcześniej testowany
    console.log('\n📊 Weekly Review...');
    try {
      await prisma.weeklyReview.create({
        data: {
          reviewDate: new Date('2025-01-06'),
          completedTasksCount: 15,
          newTasksCount: 8,
          stalledTasks: 2,
          notes: 'Good productive week',
          collectLoosePapers: true,
          processNotes: true,
          emptyInbox: true,
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ weeklyReview: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  weeklyReview: ${error.message.substring(0, 60)}...`);
    }

    // 4. Recurring Task
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
      console.log(`⚠️  recurringTask: ${error.message.substring(0, 60)}...`);
    }

    // 5. Delegated Task
    console.log('\n👥 Delegated Task...');
    try {
      await prisma.delegatedTask.create({
        data: {
          title: 'Prepare quarterly report',
          description: 'Q4 financial report preparation',
          dueDate: new Date('2025-02-01'),
          status: 'PENDING',
          delegatedById: user.id,
          delegatedToId: user.id, // Same user for demo
          organizationId: organization.id
        }
      });
      console.log('✅ delegatedTask: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  delegatedTask: ${error.message.substring(0, 60)}...`);
    }

    // 6. Wiki Page
    console.log('\n📖 Wiki Page...');
    try {
      await prisma.wikiPage.create({
        data: {
          title: 'Getting Started Guide',
          slug: 'getting-started',
          content: 'Welcome to CRM-GTD Smart system...',
          isPublic: true,
          authorId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ wikiPage: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  wikiPage: ${error.message.substring(0, 60)}...`);
    }

    // 7. Wiki Category
    console.log('\n📚 Wiki Category...');
    try {
      await prisma.wikiCategory.create({
        data: {
          name: 'User Guides',
          description: 'User documentation and guides',
          organizationId: organization.id
        }
      });
      console.log('✅ wikiCategory: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  wikiCategory: ${error.message.substring(0, 60)}...`);
    }

    // 8. Bug Report
    console.log('\n🐛 Bug Report...');
    try {
      await prisma.bugReport.create({
        data: {
          title: 'Login page loading issue',
          description: 'Login page takes too long to load',
          severity: 'MEDIUM',
          status: 'OPEN',
          reportedById: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ bugReport: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  bugReport: ${error.message.substring(0, 60)}...`);
    }

    // 9. Activity
    console.log('\n📋 Activity...');
    try {
      await prisma.activity.create({
        data: {
          type: 'TASK_CREATED',
          description: 'Created new task: Setup CRM',
          entityType: 'TASK',
          entityId: task?.id || '',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ activity: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  activity: ${error.message.substring(0, 60)}...`);
    }

    // 10. Error Log
    console.log('\n⚠️ Error Log...');
    try {
      await prisma.errorLog.create({
        data: {
          level: 'WARNING',
          message: 'Database connection timeout',
          stack: 'Connection timeout at db.connect()',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ errorLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  errorLog: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 RUNDA 1 UKOŃCZONA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${32 + successCount}/97 (${((32 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 32 - successCount} tabel`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEasyWins();