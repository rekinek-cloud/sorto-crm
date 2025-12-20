const { PrismaClient } = require('@prisma/client');

async function checkDailyWidgetData() {
  const prisma = new PrismaClient();
  
  try {
    const targetDate = '2025-07-09'; // jutro
    const targetDateObj = new Date(targetDate);
    
    console.log(`🎯 Sprawdzanie danych dla DailyWidget - data: ${targetDate}`);
    
    // Sprawdź zadania na wybraną datę
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: new Date(targetDate),
          lt: new Date(targetDate + 'T23:59:59.999Z')
        }
      },
      include: {
        context: true,
        project: true,
        createdBy: true
      }
    });
    
    console.log(`📋 Zadania na ${targetDate}: ${tasks.length}`);
    tasks.forEach(task => {
      console.log(`  - ${task.title}`);
      console.log(`    Context: ${task.context?.name || 'brak'}`);
      console.log(`    Project: ${task.project?.title || 'brak'}`);
      console.log(`    Priority: ${task.priority}`);
      console.log(`    User: ${task.createdBy?.firstName || 'brak'} ${task.createdBy?.lastName || ''}`);
      console.log(`    Org: ${task.organizationId}`);
    });
    
    // Sprawdź bloki czasowe na wybraną datę
    const blocks = await prisma.energyTimeBlock.findMany({
      where: {
        OR: [
          { dayOfWeek: targetDateObj.getDay() },
          { workdays: true }
        ],
        isActive: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`\n⏰ Bloki czasowe na ${targetDate} (dzień tygodnia: ${targetDateObj.getDay()}): ${blocks.length}`);
    blocks.forEach(block => {
      console.log(`  - ${block.startTime}-${block.endTime}: ${block.name || 'Bez nazwy'}`);
      console.log(`    Energy: ${block.energyLevel || 'brak'}`);
      console.log(`    User: ${block.userId}`);
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDailyWidgetData();