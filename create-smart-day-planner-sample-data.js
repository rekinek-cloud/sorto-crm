const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// =============================================================================
// SAMPLE DATA FOR SMART DAY PLANNER - Dashboard Population
// =============================================================================
// Skrypt do utworzenia przykładowych danych Smart Day Planner
// Autor: Claude Code 2025-07-08

async function createSampleData() {
  try {
    console.log('🚀 Tworzenie przykładowych danych Smart Day Planner...');

    // 1. Znajdź pierwszego użytkownika i organizację
    const user = await prisma.user.findFirst();
    const organization = await prisma.organization.findFirst();
    
    if (!user || !organization) {
      throw new Error('Brak użytkownika lub organizacji w bazie danych');
    }

    console.log(`📋 Użytkownik: ${user.firstName} ${user.lastName} (${user.id})`);
    console.log(`🏢 Organizacja: ${organization.name} (${organization.id})`);

    // 2. Usuń stare dane (jeśli istnieją)
    await prisma.scheduledTask.deleteMany({ where: { userId: user.id } });
    await prisma.energyTimeBlock.deleteMany({ where: { userId: user.id } });
    await prisma.focusMode.deleteMany({ where: { organizationId: organization.id } });

    console.log('🧹 Usunięto stare dane Smart Day Planner');

    // 3. Utwórz tryby focus
    const focusModes = await Promise.all([
      prisma.focusMode.create({
        data: {
          name: 'Deep Work',
          duration: 120,
          energyLevel: 'HIGH',
          contextName: '@computer',
          estimatedTimeMax: 180,
          category: 'WORK',
          priority: 'HIGH',
          tags: ['coding', 'analysis', 'planning'],
          organizationId: organization.id
        }
      }),
      prisma.focusMode.create({
        data: {
          name: 'Administrative Tasks',
          duration: 60,
          energyLevel: 'ADMINISTRATIVE',
          contextName: '@office',
          estimatedTimeMax: 90,
          category: 'ADMIN',
          priority: 'MEDIUM',
          tags: ['email', 'reports', 'meetings'],
          organizationId: organization.id
        }
      }),
      prisma.focusMode.create({
        data: {
          name: 'Creative Brainstorming',
          duration: 90,
          energyLevel: 'CREATIVE',
          contextName: '@thinking',
          estimatedTimeMax: 120,
          category: 'CREATIVE',
          priority: 'MEDIUM',
          tags: ['brainstorm', 'design', 'innovation'],
          organizationId: organization.id
        }
      }),
      prisma.focusMode.create({
        data: {
          name: 'Quick Calls',
          duration: 30,
          energyLevel: 'MEDIUM',
          contextName: '@calls',
          estimatedTimeMax: 45,
          category: 'COMMUNICATION',
          priority: 'MEDIUM',
          tags: ['phone', 'client', 'team'],
          organizationId: organization.id
        }
      })
    ]);

    console.log(`✅ Utworzono ${focusModes.length} trybów focus`);

    // 4. Utwórz bloki czasowe na dzisiaj
    const today = new Date();
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][today.getDay()];
    
    const timeBlocks = await Promise.all([
      // Rano - Deep Work (9:00-11:00)
      prisma.energyTimeBlock.create({
        data: {
          name: 'Morning Deep Work',
          startTime: '09:00',
          endTime: '11:00',
          energyLevel: 'HIGH',
          primaryContext: '@computer',
          alternativeContexts: ['@thinking', '@planning'],
          isBreak: false,
          dayOfWeek: dayOfWeek,
          workdays: true,
          weekends: false,
          holidays: false,
          specificDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          focusModeId: focusModes[0].id, // Deep Work
          isActive: true,
          order: 1,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Przerwa kawowa (11:00-11:15)
      prisma.energyTimeBlock.create({
        data: {
          name: 'Coffee Break',
          startTime: '11:00',
          endTime: '11:15',
          energyLevel: 'LOW',
          primaryContext: '@social',
          alternativeContexts: ['@break'],
          isBreak: true,
          breakType: 'COFFEE',
          dayOfWeek: dayOfWeek,
          workdays: true,
          weekends: false,
          holidays: false,
          specificDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          isActive: true,
          order: 2,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Administrative Tasks (11:15-12:15)
      prisma.energyTimeBlock.create({
        data: {
          name: 'Administrative Hour',
          startTime: '11:15',
          endTime: '12:15',
          energyLevel: 'ADMINISTRATIVE',
          primaryContext: '@office',
          alternativeContexts: ['@computer', '@calls'],
          isBreak: false,
          dayOfWeek: dayOfWeek,
          workdays: true,
          weekends: false,
          holidays: false,
          specificDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          focusModeId: focusModes[1].id, // Administrative Tasks
          isActive: true,
          order: 3,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Lunch Break (12:15-13:00)
      prisma.energyTimeBlock.create({
        data: {
          name: 'Lunch Break',
          startTime: '12:15',
          endTime: '13:00',
          energyLevel: 'LOW',
          primaryContext: '@meal',
          alternativeContexts: ['@social', '@walk'],
          isBreak: true,
          breakType: 'MEAL',
          dayOfWeek: dayOfWeek,
          workdays: true,
          weekends: false,
          holidays: false,
          specificDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          isActive: true,
          order: 4,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Afternoon Creative Work (13:00-14:30)
      prisma.energyTimeBlock.create({
        data: {
          name: 'Creative Session',
          startTime: '13:00',
          endTime: '14:30',
          energyLevel: 'CREATIVE',
          primaryContext: '@thinking',
          alternativeContexts: ['@computer', '@whiteboard'],
          isBreak: false,
          dayOfWeek: dayOfWeek,
          workdays: true,
          weekends: false,
          holidays: false,
          specificDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          focusModeId: focusModes[2].id, // Creative Brainstorming
          isActive: true,
          order: 5,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Quick Calls & Wrap-up (14:30-15:30)
      prisma.energyTimeBlock.create({
        data: {
          name: 'Calls & Wrap-up',
          startTime: '14:30',
          endTime: '15:30',
          energyLevel: 'MEDIUM',
          primaryContext: '@calls',
          alternativeContexts: ['@computer', '@office'],
          isBreak: false,
          dayOfWeek: dayOfWeek,
          workdays: true,
          weekends: false,
          holidays: false,
          specificDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          focusModeId: focusModes[3].id, // Quick Calls
          isActive: true,
          order: 6,
          userId: user.id,
          organizationId: organization.id
        }
      })
    ]);

    console.log(`✅ Utworzono ${timeBlocks.length} bloków czasowych`);

    // 5. Utwórz zaplanowane zadania na dzisiaj
    const todayDate = today.toISOString().split('T')[0];
    
    const scheduledTasks = await Promise.all([
      // Zadania w Morning Deep Work
      prisma.scheduledTask.create({
        data: {
          title: 'Analiza wymagań projektu CRM',
          description: 'Przegląd dokumentacji i przygotowanie planu implementacji',
          estimatedMinutes: 60,
          energyTimeBlockId: timeBlocks[0].id, // Morning Deep Work
          context: '@computer',
          energyRequired: 'HIGH',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          scheduledDate: new Date(todayDate),
          startedAt: new Date(today.getTime() - 30 * 60 * 1000), // Rozpoczęte 30 min temu
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      prisma.scheduledTask.create({
        data: {
          title: 'Kodowanie modułu autoryzacji',
          description: 'Implementacja JWT authentication dla API',
          estimatedMinutes: 90,
          energyTimeBlockId: timeBlocks[0].id, // Morning Deep Work
          context: '@computer',
          energyRequired: 'HIGH',
          priority: 'HIGH',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Zadania w Administrative Hour
      prisma.scheduledTask.create({
        data: {
          title: 'Odpowiedź na emaile klientów',
          description: 'Przegląd skrzynki i odpowiedzi na pilne wiadomości',
          estimatedMinutes: 30,
          energyTimeBlockId: timeBlocks[2].id, // Administrative Hour
          context: '@computer',
          energyRequired: 'ADMINISTRATIVE',
          priority: 'MEDIUM',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      prisma.scheduledTask.create({
        data: {
          title: 'Przygotowanie raportu tygodniowego',
          description: 'Zestawienie postępów projektów i KPI',
          estimatedMinutes: 45,
          energyTimeBlockId: timeBlocks[2].id, // Administrative Hour
          context: '@office',
          energyRequired: 'ADMINISTRATIVE',
          priority: 'MEDIUM',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Zadania w Creative Session
      prisma.scheduledTask.create({
        data: {
          title: 'Brainstorming nowych funkcjonalności',
          description: 'Sesja kreatywna nad ulepszeniami UI/UX',
          estimatedMinutes: 60,
          energyTimeBlockId: timeBlocks[4].id, // Creative Session
          context: '@thinking',
          energyRequired: 'CREATIVE',
          priority: 'MEDIUM',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      prisma.scheduledTask.create({
        data: {
          title: 'Projektowanie architektury systemu',
          description: 'Diagramy i dokumentacja nowej funkcjonalności',
          estimatedMinutes: 45,
          energyTimeBlockId: timeBlocks[4].id, // Creative Session
          context: '@computer',
          energyRequired: 'CREATIVE',
          priority: 'HIGH',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      // Zadania w Calls & Wrap-up
      prisma.scheduledTask.create({
        data: {
          title: 'Rozmowa z klientem ABC Corp',
          description: 'Omówienie postępów projektu i następnych kroków',
          estimatedMinutes: 30,
          energyTimeBlockId: timeBlocks[5].id, // Calls & Wrap-up
          context: '@calls',
          energyRequired: 'MEDIUM',
          priority: 'HIGH',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      }),
      prisma.scheduledTask.create({
        data: {
          title: 'Team standup meeting',
          description: 'Codzienny przegląd postępów zespołu',
          estimatedMinutes: 15,
          energyTimeBlockId: timeBlocks[5].id, // Calls & Wrap-up
          context: '@calls',
          energyRequired: 'MEDIUM',
          priority: 'MEDIUM',
          status: 'PLANNED',
          scheduledDate: new Date(todayDate),
          wasRescheduled: false,
          userId: user.id,
          organizationId: organization.id
        }
      })
    ]);

    console.log(`✅ Utworzono ${scheduledTasks.length} zaplanowanych zadań`);

    // 6. Utwórz dane analityczne energii
    const energyAnalytics = await Promise.all(
      timeBlocks.filter(b => !b.isBreak).map(async (block) => {
        return prisma.energyAnalytics.create({
          data: {
            date: new Date(todayDate),
            energyTimeBlockId: block.id,
            plannedEnergy: block.energyLevel,
            actualEnergy: block.energyLevel,
            energyScore: Math.floor(Math.random() * 30) + 70, // 70-100
            tasksPlanned: 2,
            tasksCompleted: Math.random() > 0.5 ? 1 : 2,
            minutesPlanned: 120,
            minutesActual: Math.floor(Math.random() * 40) + 100, // 100-140
            productivityScore: Math.floor(Math.random() * 20) + 80, // 80-100
            satisfactionScore: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            notes: `Produktywny blok ${block.name}. Dobra koncentracja.`,
            contextsPlanned: [block.primaryContext],
            contextsActual: [block.primaryContext],
            contextSwitches: Math.floor(Math.random() * 3), // 0-2 switch
            distractions: Math.random() > 0.7 ? ['email', 'phone'] : [],
            userId: user.id,
            organizationId: organization.id
          }
        });
      })
    );

    console.log(`✅ Utworzono ${energyAnalytics.length} rekordów analityki energii`);

    // 7. Podsumowanie utworzonych danych
    console.log('\n🎉 SUKCES! Utworzono kompletne dane Smart Day Planner:');
    console.log(`📅 Data: ${todayDate} (${dayOfWeek})`);
    console.log(`🎯 Focus Modes: ${focusModes.length}`);
    console.log(`⏰ Bloki czasowe: ${timeBlocks.length}`);
    console.log(`📋 Zaplanowane zadania: ${scheduledTasks.length}`);
    console.log(`📊 Analityka energii: ${energyAnalytics.length}`);
    
    console.log('\n🚀 Dashboard Smart Day Planner powinien teraz wyświetlać dane!');
    console.log('🌐 Sprawdź: https://crm.dev.sorto.ai/crm/dashboard/');

    // 8. Sprawdź które zadanie jest aktualnie aktywne
    const activeTask = scheduledTasks.find(t => t.status === 'IN_PROGRESS');
    if (activeTask) {
      console.log(`\n⚡ Aktywne zadanie: "${activeTask.title}"`);
      console.log(`📊 Status: ${activeTask.status}, Priorytet: ${activeTask.priority}`);
    }

    // 9. Sprawdź aktualny blok czasowy
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentBlock = timeBlocks.find(block => {
      return currentTime >= block.startTime && currentTime <= block.endTime;
    });
    
    if (currentBlock) {
      console.log(`\n🎯 Aktualny blok: "${currentBlock.name}"`);
      console.log(`⏰ Czas: ${currentBlock.startTime} - ${currentBlock.endTime}`);
      console.log(`⚡ Energia: ${currentBlock.energyLevel}`);
    } else {
      console.log(`\n⏰ Aktualny czas ${currentTime} - poza blokami czasowymi`);
    }

  } catch (error) {
    console.error('❌ Błąd podczas tworzenia danych:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
if (require.main === module) {
  createSampleData()
    .then(() => {
      console.log('\n✅ Skrypt zakończony pomyślnie');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Skrypt zakończony błędem:', error);
      process.exit(1);
    });
}

module.exports = { createSampleData };