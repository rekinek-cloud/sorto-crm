const { PrismaClient } = require('@prisma/client');

async function checkScheduledTasks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📅 Sprawdzanie zaplanowanych zadań...');
    
    const scheduledTasks = await prisma.scheduledTask.findMany({
      where: {
        userId: 'user_owner_001'
      },
      include: {
        energyTimeBlock: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        },
        task: {
          select: {
            title: true,
            priority: true,
            dueDate: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });
    
    console.log(`📊 Znaleziono ${scheduledTasks.length} zaplanowanych zadań`);
    
    if (scheduledTasks.length > 0) {
      console.log('\n📋 Zaplanowane zadania:');
      scheduledTasks.forEach((scheduled, index) => {
        const date = new Date(scheduled.scheduledDate).toISOString().split('T')[0];
        console.log(`${index + 1}. ${scheduled.title}`);
        console.log(`   📅 Data: ${date}`);
        console.log(`   ⏰ Blok: ${scheduled.energyTimeBlock?.name} (${scheduled.energyTimeBlock?.startTime}-${scheduled.energyTimeBlock?.endTime})`);
        console.log(`   🎯 Kontekst: ${scheduled.context}`);
        console.log(`   📊 Priorytet: ${scheduled.priority}`);
        console.log(`   ⚡ Status: ${scheduled.status}`);
        console.log(`   🕐 Czas: ${scheduled.estimatedMinutes} min`);
        console.log('');
      });
      
      // Grupuj według dat
      const tasksByDate = {};
      scheduledTasks.forEach(task => {
        const date = new Date(task.scheduledDate).toISOString().split('T')[0];
        if (!tasksByDate[date]) tasksByDate[date] = [];
        tasksByDate[date].push(task);
      });
      
      console.log('📊 Rozkład według dat:');
      Object.keys(tasksByDate).sort().forEach(date => {
        console.log(`  ${date}: ${tasksByDate[date].length} zadań`);
      });
    }
    
    // Sprawdź też ile zadań mamy w systemie ogółem
    const totalTasks = await prisma.task.count({
      where: {
        createdById: 'user_owner_001',
        status: { in: ['NEW', 'IN_PROGRESS'] }
      }
    });
    
    console.log(`\n📈 Zadania w systemie: ${totalTasks} (aktywne)`);
    console.log(`📈 Zadania zaplanowane: ${scheduledTasks.length}`);
    console.log(`📈 % zaplanowane: ${totalTasks > 0 ? Math.round((scheduledTasks.length / totalTasks) * 100) : 0}%`);
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkScheduledTasks();