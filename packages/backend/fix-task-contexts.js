const { PrismaClient } = require('@prisma/client');

async function fixMissingContexts() {
  const prisma = new PrismaClient();
  
  try {
    // Znajdź wszystkie konteksty
    const contexts = await prisma.context.findMany();
    console.log('📋 Dostępne konteksty:', contexts.map(c => `${c.name} (${c.id})`));
    
    const contextMap = {};
    contexts.forEach(c => {
      contextMap[c.name] = c.id;
    });
    
    // Aktualizuj zadania bez kontekstu lub z błędnymi kontekstami
    const tasksToUpdate = [
      { title: 'Quarterly Strategy Call', context: '@calls' },
      { title: 'Vendor Negotiations', context: '@calls' },
      { title: 'End-of-week Team Sync', context: '@calls' },
      { title: 'Professional Reading', context: '@reading' },
      { title: 'Online Course Module', context: '@online' },
      { title: 'Client Onboarding Call', context: '@calls' },
      { title: 'Social Media Strategy', context: '@online' },
      { title: 'Industry Research', context: '@reading' }
    ];
    
    console.log('\n🔧 Naprawianie kontekstów...');
    for (const taskInfo of tasksToUpdate) {
      const contextId = contextMap[taskInfo.context];
      if (contextId) {
        const updateResult = await prisma.task.updateMany({
          where: { title: taskInfo.title },
          data: { contextId: contextId }
        });
        console.log(`✅ Zaktualizowano ${updateResult.count} zadania: ${taskInfo.title} -> ${taskInfo.context}`);
      } else {
        console.log(`❌ Nie znaleziono kontekstu: ${taskInfo.context}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingContexts();