const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addWeekDemoTasks() {
  try {
    console.log('📅 Dodawanie zadań na cały tydzień dla Week Overview...');
    
    const user = await prisma.user.findFirst({
      where: { email: 'owner@demo.com' }
    });
    
    if (!user) {
      console.error('❌ Nie znaleziono użytkownika');
      return;
    }
    
    const timeBlocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    // Pobierz początki i koniec bieżącego tygodnia
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1); // Poniedziałek
    monday.setHours(0, 0, 0, 0);
    
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    console.log('📅 Tydzień od:', monday.toISOString().split('T')[0]);
    
    // Zadania dla każdego dnia tygodnia
    const weeklyTasks = [
      // PONIEDZIAŁEK
      {
        title: "Daily standup meeting",
        estimatedMinutes: 15,
        context: "@office",
        energyRequired: "MEDIUM",
        priority: "HIGH",
        status: "COMPLETED",
        day: 0, // Monday
        actualMinutes: 12
      },
      {
        title: "Sprint planning session",
        estimatedMinutes: 60,
        context: "@office", 
        energyRequired: "HIGH",
        priority: "HIGH",
        status: "COMPLETED",
        day: 0,
        actualMinutes: 55
      },
      {
        title: "Code refactoring - user module",
        estimatedMinutes: 90,
        context: "@computer",
        energyRequired: "HIGH",
        priority: "MEDIUM",
        status: "COMPLETED",
        day: 0,
        actualMinutes: 85
      },
      
      // WTOREK
      {
        title: "Client demo preparation",
        estimatedMinutes: 45,
        context: "@computer",
        energyRequired: "CREATIVE",
        priority: "HIGH",
        status: "COMPLETED",
        day: 1,
        actualMinutes: 50
      },
      {
        title: "Database optimization analysis",
        estimatedMinutes: 75,
        context: "@computer",
        energyRequired: "HIGH",
        priority: "MEDIUM",
        status: "COMPLETED",
        day: 1,
        actualMinutes: 70
      },
      
      // ŚRODA
      {
        title: "Client demo presentation",
        estimatedMinutes: 30,
        context: "@office",
        energyRequired: "MEDIUM",
        priority: "HIGH",
        status: "COMPLETED",
        day: 2,
        actualMinutes: 35
      },
      {
        title: "Bug fixes - payment module",
        estimatedMinutes: 60,
        context: "@computer",
        energyRequired: "MEDIUM",
        priority: "HIGH",
        status: "COMPLETED", 
        day: 2,
        actualMinutes: 45
      },
      {
        title: "Team retrospective",
        estimatedMinutes: 45,
        context: "@office",
        energyRequired: "MEDIUM",
        priority: "MEDIUM",
        status: "COMPLETED",
        day: 2,
        actualMinutes: 40
      },
      
      // CZWARTEK
      {
        title: "API documentation update",
        estimatedMinutes: 90,
        context: "@computer",
        energyRequired: "LOW",
        priority: "MEDIUM",
        status: "COMPLETED",
        day: 3,
        actualMinutes: 95
      },
      {
        title: "Security audit review",
        estimatedMinutes: 60,
        context: "@computer",
        energyRequired: "HIGH",
        priority: "HIGH",
        status: "COMPLETED",
        day: 3,
        actualMinutes: 65
      },
      
      // PIĄTEK
      {
        title: "Weekly report preparation",
        estimatedMinutes: 30,
        context: "@computer",
        energyRequired: "LOW",
        priority: "MEDIUM",
        status: "COMPLETED",
        day: 4,
        actualMinutes: 25
      },
      {
        title: "Team sync meeting",
        estimatedMinutes: 30,
        context: "@office",
        energyRequired: "MEDIUM",
        priority: "MEDIUM",
        status: "COMPLETED",
        day: 4,
        actualMinutes: 28
      },
      
      // SOBOTA
      {
        title: "Personal project - learning React Native",
        estimatedMinutes: 120,
        context: "@home",
        energyRequired: "CREATIVE",
        priority: "LOW",
        status: "COMPLETED",
        day: 5,
        actualMinutes: 130
      },
      
      // NIEDZIELA  
      {
        title: "Planning next week",
        estimatedMinutes: 30,
        context: "@home",
        energyRequired: "MEDIUM",
        priority: "LOW",
        status: "COMPLETED",
        day: 6,
        actualMinutes: 35
      }
    ];
    
    console.log(`📝 Tworzenie ${weeklyTasks.length} zadań dla całego tygodnia...`);
    
    for (const taskData of weeklyTasks) {
      const taskDate = new Date(monday);
      taskDate.setDate(monday.getDate() + taskData.day);
      
      // Symuluj czasy rozpoczęcia i zakończenia w ciągu dnia
      const startTime = new Date(taskDate);
      startTime.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60));
      
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + (taskData.actualMinutes || taskData.estimatedMinutes));
      
      const task = await prisma.scheduledTask.create({
        data: {
          title: taskData.title,
          estimatedMinutes: taskData.estimatedMinutes,
          actualMinutes: taskData.actualMinutes,
          context: taskData.context,
          energyRequired: taskData.energyRequired,
          priority: taskData.priority,
          status: taskData.status,
          scheduledDate: taskDate,
          startedAt: taskData.status === 'COMPLETED' ? startTime : null,
          completedAt: taskData.status === 'COMPLETED' ? endTime : null,
          energyTimeBlockId: timeBlocks[Math.floor(Math.random() * timeBlocks.length)].id,
          userId: user.id,
          organizationId: user.organizationId,
          wasRescheduled: false
        }
      });
      
      console.log(`✅ ${daysOfWeek[taskData.day]}: "${task.title}" (${task.status})`);
    }
    
    console.log('\n📊 Aktualizowanie danych analitycznych tygodnia...');
    
    // Aktualizuj dane analityczne dla każdego dnia tygodnia
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayOffset);
      
      for (const block of timeBlocks.slice(0, 3)) {
        const existingAnalytics = await prisma.energyAnalytics.findFirst({
          where: {
            userId: user.id,
            energyTimeBlockId: block.id,
            date: date
          }
        });
        
        if (!existingAnalytics) {
          await prisma.energyAnalytics.create({
            data: {
              date: date,
              energyTimeBlockId: block.id,
              plannedEnergy: block.energyLevel,
              actualEnergy: block.energyLevel,
              energyScore: 0.75 + Math.random() * 0.25, // 0.75-1.0
              tasksPlanned: 2 + Math.floor(Math.random() * 2),
              tasksCompleted: 1 + Math.floor(Math.random() * 2),
              productivityScore: 0.7 + Math.random() * 0.3, // 0.7-1.0
              userId: user.id,
              organizationId: user.organizationId
            }
          });
        }
      }
    }
    
    console.log('\n🎉 Dane tygodniowe utworzone pomyślnie!');
    console.log('\n📋 Podsumowanie:');
    console.log('• Zadania na każdy dzień tygodnia');
    console.log('• Różnorodne konteksty i priorytety');
    console.log('• Realistyczne czasy wykonania');
    console.log('• Dane analityczne dla całego tygodnia');
    console.log('• Zadania ukończone z actual minutes');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWeekDemoTasks();