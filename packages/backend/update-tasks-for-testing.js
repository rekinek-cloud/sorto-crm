const { PrismaClient } = require('@prisma/client');

async function updateTasksForTesting() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 Modyfikacja zadań dla testowania Smart Day Planner...');
    
    // Znajdź wszystkie konteksty
    const contexts = await prisma.context.findMany();
    const projects = await prisma.project.findMany();
    
    console.log(`Znaleziono ${contexts.length} kontekstów i ${projects.length} projektów`);
    
    // Usuń stare powtarzalne zadania (Daily Inbox Processing)
    const deleteResult = await prisma.task.deleteMany({
      where: {
        title: {
          contains: 'Daily Inbox Processing'
        }
      }
    });
    
    console.log(`🗑️  Usunięto ${deleteResult.count} powtarzalnych zadań Daily Inbox Processing`);
    
    // Przygotuj daty na 2 tygodnie (od dzisiaj)
    const today = new Date();
    const tasks = [];
    
    // Konteksty dostępne
    const contextMap = {
      '@computer': contexts.find(c => c.name === '@computer')?.id,
      '@calls': contexts.find(c => c.name === '@calls')?.id,
      '@office': contexts.find(c => c.name === '@office')?.id,
      '@home': contexts.find(c => c.name === '@home')?.id,
      '@errands': contexts.find(c => c.name === '@errands')?.id,
      '@online': contexts.find(c => c.name === '@online')?.id,
      '@waiting': contexts.find(c => c.name === '@waiting')?.id,
      '@reading': contexts.find(c => c.name === '@reading')?.id
    };
    
    // Projekty dostępne
    const projectIds = projects.map(p => p.id);
    
    // Generator zadań na 2 tygodnie
    const taskTemplates = [
      // Poniedziałek - Start tygodnia
      { title: 'Weekly Planning & Goal Setting', context: '@computer', priority: 'HIGH', estimatedTime: 60, dayOffset: 0 },
      { title: 'Email Inbox Zero', context: '@computer', priority: 'MEDIUM', estimatedTime: 30, dayOffset: 0 },
      { title: 'Team Standup Meeting', context: '@calls', priority: 'HIGH', estimatedTime: 30, dayOffset: 0 },
      
      // Wtorek - Praca produktywna
      { title: 'Code Review Sessions', context: '@computer', priority: 'HIGH', estimatedTime: 90, dayOffset: 1 },
      { title: 'Client Presentation Prep', context: '@office', priority: 'MEDIUM', estimatedTime: 120, dayOffset: 1 },
      { title: 'Documentation Writing', context: '@computer', priority: 'LOW', estimatedTime: 45, dayOffset: 1 },
      
      // Środa - Komunikacja
      { title: 'Quarterly Strategy Call', context: '@calls', priority: 'HIGH', estimatedTime: 60, dayOffset: 2 },
      { title: 'Project Status Updates', context: '@computer', priority: 'MEDIUM', estimatedTime: 45, dayOffset: 2 },
      { title: 'Vendor Negotiations', context: '@calls', priority: 'MEDIUM', estimatedTime: 90, dayOffset: 2 },
      
      // Czwartek - Deep Work
      { title: 'Feature Development Sprint', context: '@computer', priority: 'HIGH', estimatedTime: 180, dayOffset: 3 },
      { title: 'Technical Architecture Review', context: '@computer', priority: 'HIGH', estimatedTime: 120, dayOffset: 3 },
      { title: 'Database Optimization', context: '@computer', priority: 'MEDIUM', estimatedTime: 90, dayOffset: 3 },
      
      // Piątek - Zamknięcie tygodnia
      { title: 'Weekly Review & Retrospective', context: '@office', priority: 'MEDIUM', estimatedTime: 60, dayOffset: 4 },
      { title: 'End-of-week Team Sync', context: '@calls', priority: 'LOW', estimatedTime: 45, dayOffset: 4 },
      { title: 'Knowledge Base Updates', context: '@computer', priority: 'LOW', estimatedTime: 30, dayOffset: 4 },
      
      // Weekend - Osobiste
      { title: 'Home Office Setup', context: '@home', priority: 'LOW', estimatedTime: 60, dayOffset: 5 },
      { title: 'Professional Reading', context: '@reading', priority: 'LOW', estimatedTime: 90, dayOffset: 6 },
      
      // Drugi tydzień - Similar pattern
      { title: 'Monthly Business Review', context: '@office', priority: 'HIGH', estimatedTime: 120, dayOffset: 7 },
      { title: 'Quarterly Budget Planning', context: '@computer', priority: 'HIGH', estimatedTime: 90, dayOffset: 8 },
      { title: 'Client Onboarding Call', context: '@calls', priority: 'MEDIUM', estimatedTime: 60, dayOffset: 9 },
      { title: 'Security Audit Review', context: '@computer', priority: 'HIGH', estimatedTime: 120, dayOffset: 10 },
      { title: 'Team Building Planning', context: '@office', priority: 'LOW', estimatedTime: 45, dayOffset: 11 },
      { title: 'Weekend Project Work', context: '@home', priority: 'LOW', estimatedTime: 180, dayOffset: 12 },
      { title: 'Industry Research', context: '@reading', priority: 'MEDIUM', estimatedTime: 120, dayOffset: 13 },
      
      // Dodatkowe różnorodne zadania
      { title: 'Bank Meeting', context: '@errands', priority: 'MEDIUM', estimatedTime: 60, dayOffset: 2 },
      { title: 'Equipment Shopping', context: '@errands', priority: 'LOW', estimatedTime: 90, dayOffset: 5 },
      { title: 'Partner Response Waiting', context: '@waiting', priority: 'MEDIUM', estimatedTime: 15, dayOffset: 3 },
      { title: 'Contract Review Pending', context: '@waiting', priority: 'HIGH', estimatedTime: 30, dayOffset: 8 },
      { title: 'Online Course Module', context: '@online', priority: 'LOW', estimatedTime: 120, dayOffset: 6 },
      { title: 'Social Media Strategy', context: '@online', priority: 'MEDIUM', estimatedTime: 60, dayOffset: 9 },
    ];
    
    // Utwórz zadania
    for (let i = 0; i < taskTemplates.length; i++) {
      const template = taskTemplates[i];
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + template.dayOffset);
      
      const taskData = {
        title: template.title,
        description: `Auto-generated task for testing Smart Day Planner on ${dueDate.toDateString()}`,
        status: 'NEW',
        priority: template.priority,
        dueDate: dueDate,
        contextId: contextMap[template.context] || null,
        projectId: projectIds.length > 0 ? projectIds[i % projectIds.length] : null,
        estimatedHours: template.estimatedTime / 60, // Konwersja minut na godziny
        createdById: 'user_owner_001', // Michał Kowalski
        organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd' // Tech Solutions
      };
      
      tasks.push(taskData);
    }
    
    // Wstaw nowe zadania
    const createResult = await prisma.task.createMany({
      data: tasks
    });
    
    console.log(`✅ Utworzono ${createResult.count} nowych zróżnicowanych zadań`);
    
    // Sprawdź końcowy wynik
    const finalTaskCount = await prisma.task.count();
    console.log(`📊 Końcowa liczba zadań: ${finalTaskCount}`);
    
    // Pokaż rozkład kontekstów
    console.log('\n📋 Rozkład kontekstów w nowych zadaniach:');
    for (const [contextName, contextId] of Object.entries(contextMap)) {
      if (contextId) {
        const count = tasks.filter(t => t.contextId === contextId).length;
        console.log(`  ${contextName}: ${count} zadań`);
      }
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTasksForTesting();