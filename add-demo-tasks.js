const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDemoTasks() {
  try {
    console.log('🎯 Dodawanie przykładowych zadań dla Dashboard Integration...');
    
    // Pobierz user ID
    const user = await prisma.user.findFirst({
      where: { email: 'owner@demo.com' }
    });
    
    if (!user) {
      console.error('❌ Nie znaleziono użytkownika owner@demo.com');
      return;
    }
    
    console.log(`✅ Znaleziono użytkownika: ${user.firstName} ${user.lastName} (${user.id})`);
    
    // Pobierz bloki czasowe
    const timeBlocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`✅ Znaleziono ${timeBlocks.length} bloków czasowych`);
    
    if (timeBlocks.length === 0) {
      console.error('❌ Brak bloków czasowych - nie można dodać zadań');
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Zadania do dodania z różnymi statusami
    const tasksToAdd = [
      {
        title: "Code review dla PR #247",
        estimatedMinutes: 25,
        context: "@computer",
        energyRequired: "MEDIUM",
        priority: "HIGH",
        status: "PLANNED",
        energyTimeBlockId: timeBlocks[1].id // Morning Focus
      },
      {
        title: "Zaktualizować dokumentację systemu",
        estimatedMinutes: 45,
        context: "@computer", 
        energyRequired: "LOW",
        priority: "MEDIUM",
        status: "PLANNED",
        energyTimeBlockId: timeBlocks[2].id // Pre-Lunch Tasks
      },
      {
        title: "Analiza wydajności bazy danych",
        estimatedMinutes: 75,
        context: "@computer",
        energyRequired: "HIGH", 
        priority: "HIGH",
        status: "IN_PROGRESS",
        startedAt: new Date(Date.now() - 20 * 60 * 1000), // Rozpoczęte 20 min temu
        energyTimeBlockId: timeBlocks[3].id 
      },
      {
        title: "Spotkanie z HR - quarterly review",
        estimatedMinutes: 30,
        context: "@office",
        energyRequired: "MEDIUM",
        priority: "MEDIUM", 
        status: "PLANNED",
        energyTimeBlockId: timeBlocks[4].id
      },
      {
        title: "Backup systemu produkcyjnego",
        estimatedMinutes: 15,
        context: "@computer",
        energyRequired: "LOW",
        priority: "LOW",
        status: "COMPLETED",
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
        completedAt: new Date(Date.now() - 30 * 60 * 1000),
        actualMinutes: 12,
        energyTimeBlockId: timeBlocks[0].id
      },
      {
        title: "Przygotowanie danych do raportu miesięcznego",
        estimatedMinutes: 60,
        context: "@computer",
        energyRequired: "CREATIVE",
        priority: "MEDIUM",
        status: "PLANNED", 
        energyTimeBlockId: timeBlocks[5].id
      },
      {
        title: "Rozmowa z zespołem QA",
        estimatedMinutes: 20,
        context: "@calls",
        energyRequired: "MEDIUM",
        priority: "HIGH",
        status: "COMPLETED",
        startedAt: new Date(Date.now() - 90 * 60 * 1000),
        completedAt: new Date(Date.now() - 70 * 60 * 1000), 
        actualMinutes: 18,
        energyTimeBlockId: timeBlocks[1].id
      },
      {
        title: "Optymalizacja algorytmu wyszukiwania",
        estimatedMinutes: 90,
        context: "@computer",
        energyRequired: "HIGH",
        priority: "HIGH",
        status: "OVERDUE",
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Wczoraj
        energyTimeBlockId: timeBlocks[0].id
      }
    ];
    
    console.log(`📝 Tworzenie ${tasksToAdd.length} przykładowych zadań...`);
    
    for (const taskData of tasksToAdd) {
      const task = await prisma.scheduledTask.create({
        data: {
          ...taskData,
          scheduledDate: taskData.scheduledDate || today,
          userId: user.id,
          organizationId: user.organizationId,
          wasRescheduled: false
        }
      });
      
      console.log(`✅ Utworzono zadanie: "${task.title}" (${task.status})`);
    }
    
    // Dodaj też kilka analytics records dla lepszej prognozy
    console.log('📊 Dodawanie danych analitycznych...');
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }
    
    for (const date of last7Days) {
      for (const block of timeBlocks.slice(0, 3)) { // Tylko pierwsze 3 bloki
        const analytics = await prisma.energyAnalytics.create({
          data: {
            date: date,
            energyTimeBlockId: block.id,
            plannedEnergy: block.energyLevel,
            actualEnergy: block.energyLevel,
            energyScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
            tasksPlanned: Math.floor(Math.random() * 3) + 1,
            tasksCompleted: Math.floor(Math.random() * 3) + 1,
            productivityScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
            userId: user.id,
            organizationId: user.organizationId
          }
        });
      }
    }
    
    console.log('✅ Dodano dane analityczne dla ostatnich 7 dni');
    
    console.log('\n🎉 Demo data utworzone pomyślnie!');
    console.log('\n📋 Podsumowanie dodanych zadań:');
    console.log('• Zadania PLANNED: 4');
    console.log('• Zadania IN_PROGRESS: 1'); 
    console.log('• Zadania COMPLETED: 2');
    console.log('• Zadania OVERDUE: 1');
    console.log('• Różne konteksty: @computer, @office, @calls');
    console.log('• Różne priorytety: LOW, MEDIUM, HIGH');
    console.log('• Różne poziomy energii: LOW, MEDIUM, HIGH, CREATIVE');
    
  } catch (error) {
    console.error('❌ Błąd podczas dodawania danych:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoTasks();