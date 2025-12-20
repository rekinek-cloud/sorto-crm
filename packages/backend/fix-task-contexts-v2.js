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
    
    // Aktualizuj zadania z mapowaniem na istniejące konteksty
    const tasksToUpdate = [
      { title: 'Quarterly Strategy Call', context: '@phone' }, // rozmowy -> phone
      { title: 'Vendor Negotiations', context: '@phone' },
      { title: 'End-of-week Team Sync', context: '@phone' },
      { title: 'Professional Reading', context: '@home' }, // czytanie -> home
      { title: 'Online Course Module', context: '@computer' }, // online -> computer
      { title: 'Client Onboarding Call', context: '@phone' },
      { title: 'Social Media Strategy', context: '@computer' }, // online -> computer
      { title: 'Industry Research', context: '@home' } // czytanie -> home
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