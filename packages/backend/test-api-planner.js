const { PrismaClient } = require('@prisma/client');

async function testPlannerAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test API Smart Day Planner...');
    
    // Test 1: Sprawdź bloki czasowe
    const timeBlocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: 'user_owner_001',
        isActive: true
      },
      include: {
        scheduledTasks: {
          where: {
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(24, 0, 0, 0))
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`✅ Bloki czasowe: ${timeBlocks.length}`);
    
    timeBlocks.forEach(block => {
      console.log(`  - ${block.startTime}-${block.endTime}: ${block.name}`);
      console.log(`    Zadania: ${block.scheduledTasks.length}`);
      block.scheduledTasks.forEach(task => {
        console.log(`      • ${task.title} (${task.priority}, ${task.estimatedMinutes}min)`);
      });
    });
    
    // Test 2: Sprawdź dzisiejszy harmonogram
    const today = new Date().toISOString().split('T')[0];
    const dailySchedule = await prisma.energyTimeBlock.findMany({
      where: {
        userId: 'user_owner_001',
        isActive: true
      },
      include: {
        scheduledTasks: {
          where: {
            scheduledDate: {
              gte: new Date(today),
              lt: new Date(today + 'T23:59:59.999Z')
            }
          }
        }
      }
    });
    
    console.log(`\n📅 Harmonogram na ${today}:`);
    console.log(`Bloki z zadaniami: ${dailySchedule.filter(b => b.scheduledTasks.length > 0).length}`);
    
    const totalTasks = dailySchedule.reduce((sum, block) => sum + block.scheduledTasks.length, 0);
    console.log(`Łączna liczba zadań na dziś: ${totalTasks}`);
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlannerAPI();