const { PrismaClient } = require('@prisma/client');

async function checkTaskDistribution() {
  const prisma = new PrismaClient();
  
  try {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: twoWeeksLater
        }
      },
      include: {
        context: true
      },
      orderBy: { dueDate: 'asc' }
    });
    
    console.log(`📅 Zadania na najbliższe 2 tygodnie: ${tasks.length}`);
    
    // Grupuj według dni
    const tasksByDay = new Map();
    tasks.forEach(task => {
      const day = task.dueDate.toISOString().split('T')[0];
      if (!tasksByDay.has(day)) {
        tasksByDay.set(day, []);
      }
      tasksByDay.get(day).push(task);
    });
    
    console.log('\n📊 Rozkład zadań po dniach:');
    Array.from(tasksByDay.keys()).sort().forEach(day => {
      const dayTasks = tasksByDay.get(day);
      console.log(`  ${day}: ${dayTasks.length} zadań`);
      dayTasks.forEach(task => {
        console.log(`    - ${task.title} (@${task.context?.name || 'brak'}, ${task.priority})`);
      });
    });
    
    // Statystyki kontekstów
    const contextStats = new Map();
    tasks.forEach(task => {
      const ctx = task.context?.name || 'brak';
      contextStats.set(ctx, (contextStats.get(ctx) || 0) + 1);
    });
    
    console.log('\n🎯 Statystyki kontekstów w planowanych zadaniach:');
    Array.from(contextStats.entries()).forEach(([ctx, count]) => {
      console.log(`  ${ctx}: ${count} zadań`);
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTaskDistribution();