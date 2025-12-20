const { PrismaClient } = require('@prisma/client');

async function checkTasks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Sprawdzanie istniejących zadań...');
    
    const tasks = await prisma.task.findMany({
      include: {
        context: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Liczba zadań: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('\n📋 Istniejące zadania:');
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   - Status: ${task.status}`);
        console.log(`   - Priorytet: ${task.priority}`);
        console.log(`   - Due Date: ${task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'Brak'}`);
        console.log(`   - Kontekst: ${task.context?.name || 'Brak'}`);
        console.log(`   - Projekt: ${task.project?.title || 'Brak'}`);
        console.log(`   - Estimated Time: ${task.estimatedTime || 0} min`);
        console.log(`   - ID: ${task.id}`);
        console.log('');
      });
    }
    
    // Sprawdź konteksty
    const contexts = await prisma.context.findMany();
    console.log(`\n🎯 Dostępne konteksty (${contexts.length}):`);
    contexts.forEach(ctx => {
      console.log(`  - ${ctx.name} (${ctx.id})`);
    });
    
    // Sprawdź projekty
    const projects = await prisma.project.findMany();
    console.log(`\n📁 Dostępne projekty (${projects.length}):`);
    projects.forEach(proj => {
      console.log(`  - ${proj.title} (${proj.id})`);
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks();