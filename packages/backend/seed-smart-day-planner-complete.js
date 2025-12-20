const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// =============================================================================
// SMART DAY PLANNER - KOMPLETNY SEED SCRIPT
// =============================================================================
// Uzupełnienie brakujących danych dla pełnej funkcjonalności
// Autor: Claude Code 2025-07-08

async function main() {
  console.log('🚀 Smart Day Planner - Uzupełnianie danych...\n');

  try {
    // Pobierz istniejących użytkowników i organizacje
    const users = await prisma.user.findMany();
    const organizations = await prisma.organization.findMany();
    
    if (users.length === 0 || organizations.length === 0) {
      throw new Error('Brak użytkowników lub organizacji w bazie!');
    }

    const mainOrg = organizations[0];
    const ownerUser = users.find(u => u.email.includes('owner')) || users[0];
    const managerUser = users.find(u => u.email.includes('manager')) || users[1];
    const memberUser = users.find(u => u.email.includes('member')) || users[2];

    console.log(`👤 Użytkownicy: ${users.length}`);
    console.log(`🏢 Organizacje: ${organizations.length}\n`);

    // =============================================================================
    // 1. ENERGY PATTERNS - Wzorce energii użytkownika (Machine Learning)
    // =============================================================================
    
    console.log('📊 1. Tworzenie Energy Patterns...');
    
    const energyPatterns = [
      // PONIEDZIAŁEK - Owner (wysoka energia rano)
      { timeSlot: '07:00-09:00', dayOfWeek: 'MONDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'HIGH', averageEnergy: 4.2, productivityScore: 0.85, confidence: 0.9,
        sampleSize: 15, preferredContexts: ['@computer', '@deep_work'], avoidedContexts: ['@calls'],
        tasksCompleted: 12, totalMinutes: 120, successRate: 0.8 },
      { timeSlot: '09:00-11:00', dayOfWeek: 'MONDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'HIGH', averageEnergy: 4.0, productivityScore: 0.82, confidence: 0.8,
        sampleSize: 12, preferredContexts: ['@computer', '@creative'], avoidedContexts: ['@admin'],
        tasksCompleted: 10, totalMinutes: 120, successRate: 0.82 },
      { timeSlot: '11:00-13:00', dayOfWeek: 'MONDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.5, productivityScore: 0.70, confidence: 0.7,
        sampleSize: 10, preferredContexts: ['@calls', '@meetings'], avoidedContexts: ['@deep_work'],
        tasksCompleted: 8, totalMinutes: 120, successRate: 0.7 },
      { timeSlot: '14:00-16:00', dayOfWeek: 'MONDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.2, productivityScore: 0.65, confidence: 0.8,
        sampleSize: 14, preferredContexts: ['@admin', '@planning'], avoidedContexts: ['@creative'],
        tasksCompleted: 9, totalMinutes: 120, successRate: 0.65 },
      { timeSlot: '16:00-18:00', dayOfWeek: 'MONDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'LOW', averageEnergy: 2.8, productivityScore: 0.55, confidence: 0.9,
        sampleSize: 18, preferredContexts: ['@reading', '@review'], avoidedContexts: ['@calls', '@meetings'],
        tasksCompleted: 6, totalMinutes: 120, successRate: 0.55 },

      // WTOREK - Manager (energia w południe)
      { timeSlot: '08:00-10:00', dayOfWeek: 'TUESDAY', userId: managerUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.3, productivityScore: 0.68, confidence: 0.7,
        sampleSize: 8, preferredContexts: ['@planning', '@review'], avoidedContexts: ['@deep_work'],
        tasksCompleted: 7, totalMinutes: 120, successRate: 0.68 },
      { timeSlot: '10:00-12:00', dayOfWeek: 'TUESDAY', userId: managerUser.id, organizationId: mainOrg.id,
        energyLevel: 'HIGH', averageEnergy: 4.1, productivityScore: 0.78, confidence: 0.8,
        sampleSize: 11, preferredContexts: ['@meetings', '@calls'], avoidedContexts: ['@admin'],
        tasksCompleted: 11, totalMinutes: 120, successRate: 0.78 },
      { timeSlot: '13:00-15:00', dayOfWeek: 'TUESDAY', userId: managerUser.id, organizationId: mainOrg.id,
        energyLevel: 'HIGH', averageEnergy: 4.3, productivityScore: 0.83, confidence: 0.9,
        sampleSize: 16, preferredContexts: ['@computer', '@strategic'], avoidedContexts: ['@routine'],
        tasksCompleted: 13, totalMinutes: 120, successRate: 0.83 },
      { timeSlot: '15:00-17:00', dayOfWeek: 'TUESDAY', userId: managerUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.4, productivityScore: 0.72, confidence: 0.6,
        sampleSize: 9, preferredContexts: ['@review', '@feedback'], avoidedContexts: ['@creative'],
        tasksCompleted: 8, totalMinutes: 120, successRate: 0.72 },

      // ŚRODA - Member (konsystentna energia)
      { timeSlot: '09:00-11:00', dayOfWeek: 'WEDNESDAY', userId: memberUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.6, productivityScore: 0.74, confidence: 0.8,
        sampleSize: 13, preferredContexts: ['@computer', '@coding'], avoidedContexts: ['@meetings'],
        tasksCompleted: 9, totalMinutes: 120, successRate: 0.74 },
      { timeSlot: '11:00-13:00', dayOfWeek: 'WEDNESDAY', userId: memberUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.7, productivityScore: 0.76, confidence: 0.7,
        sampleSize: 12, preferredContexts: ['@computer', '@testing'], avoidedContexts: ['@calls'],
        tasksCompleted: 9, totalMinutes: 120, successRate: 0.76 },
      { timeSlot: '14:00-16:00', dayOfWeek: 'WEDNESDAY', userId: memberUser.id, organizationId: mainOrg.id,
        energyLevel: 'CREATIVE', averageEnergy: 3.9, productivityScore: 0.81, confidence: 0.9,
        sampleSize: 17, preferredContexts: ['@creative', '@problem_solving'], avoidedContexts: ['@admin'],
        tasksCompleted: 11, totalMinutes: 120, successRate: 0.81 },
      { timeSlot: '16:00-18:00', dayOfWeek: 'WEDNESDAY', userId: memberUser.id, organizationId: mainOrg.id,
        energyLevel: 'LOW', averageEnergy: 2.9, productivityScore: 0.58, confidence: 0.8,
        sampleSize: 11, preferredContexts: ['@documentation', '@cleanup'], avoidedContexts: ['@deep_work'],
        tasksCompleted: 6, totalMinutes: 120, successRate: 0.58 },

      // CZWARTEK - Wszystkich (dzień spotkań)
      { timeSlot: '10:00-12:00', dayOfWeek: 'THURSDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'HIGH', averageEnergy: 4.0, productivityScore: 0.79, confidence: 0.8,
        sampleSize: 10, preferredContexts: ['@meetings', '@presentation'], avoidedContexts: ['@admin'],
        tasksCompleted: 10, totalMinutes: 120, successRate: 0.79 },
      { timeSlot: '10:00-12:00', dayOfWeek: 'THURSDAY', userId: managerUser.id, organizationId: mainOrg.id,
        energyLevel: 'HIGH', averageEnergy: 4.2, productivityScore: 0.84, confidence: 0.9,
        sampleSize: 14, preferredContexts: ['@meetings', '@strategic'], avoidedContexts: ['@routine'],
        tasksCompleted: 12, totalMinutes: 120, successRate: 0.84 },
      { timeSlot: '10:00-12:00', dayOfWeek: 'THURSDAY', userId: memberUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.5, productivityScore: 0.71, confidence: 0.7,
        sampleSize: 8, preferredContexts: ['@meetings', '@collaboration'], avoidedContexts: ['@deep_work'],
        tasksCompleted: 8, totalMinutes: 120, successRate: 0.71 },

      // PIĄTEK - Dzień podsumowań
      { timeSlot: '09:00-11:00', dayOfWeek: 'FRIDAY', userId: ownerUser.id, organizationId: mainOrg.id,
        energyLevel: 'MEDIUM', averageEnergy: 3.4, productivityScore: 0.69, confidence: 0.7,
        sampleSize: 9, preferredContexts: ['@review', '@planning'], avoidedContexts: ['@creative'],
        tasksCompleted: 7, totalMinutes: 120, successRate: 0.69 },
      { timeSlot: '11:00-13:00', dayOfWeek: 'FRIDAY', userId: managerUser.id, organizationId: mainOrg.id,
        energyLevel: 'ADMINISTRATIVE', averageEnergy: 3.1, productivityScore: 0.63, confidence: 0.8,
        sampleSize: 12, preferredContexts: ['@admin', '@reports'], avoidedContexts: ['@deep_work'],
        tasksCompleted: 7, totalMinutes: 120, successRate: 0.63 },
      { timeSlot: '14:00-16:00', dayOfWeek: 'FRIDAY', userId: memberUser.id, organizationId: mainOrg.id,
        energyLevel: 'LOW', averageEnergy: 2.7, productivityScore: 0.52, confidence: 0.9,
        sampleSize: 15, preferredContexts: ['@cleanup', '@documentation'], avoidedContexts: ['@meetings'],
        tasksCompleted: 5, totalMinutes: 120, successRate: 0.52 }
    ];

    for (const pattern of energyPatterns) {
      await prisma.energyPattern.upsert({
        where: {
          userId_timeSlot_dayOfWeek: {
            userId: pattern.userId,
            timeSlot: pattern.timeSlot,
            dayOfWeek: pattern.dayOfWeek
          }
        },
        update: pattern,
        create: {
          ...pattern,
          lastAnalyzed: new Date()
        }
      });
    }

    console.log(`✅ Energy Patterns: ${energyPatterns.length} wzorców dodanych`);

    // =============================================================================
    // 2. BLOKI CZASOWE - Rozszerzenie na wszystkie dni tygodnia
    // =============================================================================
    
    console.log('📅 2. Dodawanie bloków czasowych na wszystkie dni...');
    
    const weeklyBlocks = [
      // WTOREK
      { name: 'Morning Planning', startTime: '08:00', endTime: '09:30', dayOfWeek: 'TUESDAY',
        energyLevel: 'MEDIUM', primaryContext: '@planning', isBreak: false },
      { name: 'Team Meetings', startTime: '10:00', endTime: '12:00', dayOfWeek: 'TUESDAY',
        energyLevel: 'HIGH', primaryContext: '@meetings', isBreak: false },
      { name: 'Strategic Work', startTime: '13:00', endTime: '15:30', dayOfWeek: 'TUESDAY',
        energyLevel: 'HIGH', primaryContext: '@computer', isBreak: false },
      { name: 'Review & Feedback', startTime: '15:45', endTime: '17:00', dayOfWeek: 'TUESDAY',
        energyLevel: 'MEDIUM', primaryContext: '@review', isBreak: false },

      // ŚRODA
      { name: 'Deep Coding', startTime: '09:00', endTime: '11:30', dayOfWeek: 'WEDNESDAY',
        energyLevel: 'MEDIUM', primaryContext: '@computer', isBreak: false },
      { name: 'Testing & QA', startTime: '11:45', endTime: '13:00', dayOfWeek: 'WEDNESDAY',
        energyLevel: 'MEDIUM', primaryContext: '@computer', isBreak: false },
      { name: 'Creative Problem Solving', startTime: '14:00', endTime: '16:00', dayOfWeek: 'WEDNESDAY',
        energyLevel: 'CREATIVE', primaryContext: '@creative', isBreak: false },
      { name: 'Documentation', startTime: '16:15', endTime: '17:30', dayOfWeek: 'WEDNESDAY',
        energyLevel: 'LOW', primaryContext: '@documentation', isBreak: false },

      // CZWARTEK
      { name: 'Morning Standup', startTime: '09:00', endTime: '09:30', dayOfWeek: 'THURSDAY',
        energyLevel: 'MEDIUM', primaryContext: '@meetings', isBreak: false },
      { name: 'Client Presentations', startTime: '10:00', endTime: '12:00', dayOfWeek: 'THURSDAY',
        energyLevel: 'HIGH', primaryContext: '@presentation', isBreak: false },
      { name: 'Lunch & Network', startTime: '12:00', endTime: '13:30', dayOfWeek: 'THURSDAY',
        energyLevel: 'LOW', primaryContext: '@social', isBreak: true, breakType: 'MEAL' },
      { name: 'Collaboration Time', startTime: '13:30', endTime: '15:30', dayOfWeek: 'THURSDAY',
        energyLevel: 'MEDIUM', primaryContext: '@collaboration', isBreak: false },
      { name: 'Weekly Review', startTime: '15:45', endTime: '17:00', dayOfWeek: 'THURSDAY',
        energyLevel: 'MEDIUM', primaryContext: '@review', isBreak: false },

      // PIĄTEK
      { name: 'Week Summary', startTime: '09:00', endTime: '10:30', dayOfWeek: 'FRIDAY',
        energyLevel: 'MEDIUM', primaryContext: '@review', isBreak: false },
      { name: 'Administrative Tasks', startTime: '10:45', endTime: '12:30', dayOfWeek: 'FRIDAY',
        energyLevel: 'ADMINISTRATIVE', primaryContext: '@admin', isBreak: false },
      { name: 'Next Week Planning', startTime: '13:30', endTime: '15:00', dayOfWeek: 'FRIDAY',
        energyLevel: 'MEDIUM', primaryContext: '@planning', isBreak: false },
      { name: 'Project Cleanup', startTime: '15:15', endTime: '16:30', dayOfWeek: 'FRIDAY',
        energyLevel: 'LOW', primaryContext: '@cleanup', isBreak: false },

      // WEEKEND (opcjonalne bloki)
      { name: 'Personal Development', startTime: '10:00', endTime: '12:00', dayOfWeek: 'SATURDAY',
        energyLevel: 'CREATIVE', primaryContext: '@learning', isBreak: false },
      { name: 'Side Project Work', startTime: '14:00', endTime: '16:00', dayOfWeek: 'SATURDAY',
        energyLevel: 'CREATIVE', primaryContext: '@personal', isBreak: false },
      
      { name: 'Weekly Planning', startTime: '18:00', endTime: '19:30', dayOfWeek: 'SUNDAY',
        energyLevel: 'MEDIUM', primaryContext: '@planning', isBreak: false }
    ];

    let addedBlocks = 0;
    for (const block of weeklyBlocks) {
      const existing = await prisma.energyTimeBlock.findFirst({
        where: {
          name: block.name,
          dayOfWeek: block.dayOfWeek,
          userId: ownerUser.id
        }
      });

      if (!existing) {
        await prisma.energyTimeBlock.create({
          data: {
            ...block,
            userId: ownerUser.id,
            organizationId: mainOrg.id,
            alternativeContexts: [],
            isActive: true,
            order: addedBlocks
          }
        });
        addedBlocks++;
      }
    }

    console.log(`✅ Bloki czasowe: ${addedBlocks} nowych bloków dodanych`);

    // =============================================================================
    // 3. DODATKOWE FOCUS MODES
    // =============================================================================
    
    console.log('🎯 3. Dodawanie dodatkowych Focus Modes...');
    
    const additionalFocusModes = [
      { name: 'Reading & Research', duration: 45, energyLevel: 'LOW', 
        contextName: '@reading', category: 'Knowledge', priority: 'MEDIUM',
        tags: ['research', 'learning', 'documentation'] },
      { name: 'Planning & Strategy', duration: 75, energyLevel: 'MEDIUM',
        contextName: '@planning', category: 'Strategic', priority: 'HIGH',
        tags: ['planning', 'strategy', 'roadmap'] },
      { name: 'Review & Feedback', duration: 30, energyLevel: 'MEDIUM',
        contextName: '@review', category: 'Quality', priority: 'MEDIUM',
        tags: ['review', 'feedback', 'quality'] },
      { name: 'Social & Networking', duration: 60, energyLevel: 'MEDIUM',
        contextName: '@social', category: 'Communication', priority: 'LOW',
        tags: ['networking', 'social', 'relationships'] }
    ];

    let addedFocusModes = 0;
    for (const focusMode of additionalFocusModes) {
      const existing = await prisma.focusMode.findFirst({
        where: { name: focusMode.name, organizationId: mainOrg.id }
      });

      if (!existing) {
        await prisma.focusMode.create({
          data: {
            ...focusMode,
            organizationId: mainOrg.id
          }
        });
        addedFocusModes++;
      }
    }

    console.log(`✅ Focus Modes: ${addedFocusModes} nowych trybów dodanych`);

    // =============================================================================
    // 4. SCHEDULED TASKS - Więcej zadań dla różnych użytkowników
    // =============================================================================
    
    console.log('📋 4. Dodawanie Scheduled Tasks...');
    
    // Pobierz istniejące zadania i bloki
    const tasks = await prisma.task.findMany({ take: 20 });
    const timeBlocks = await prisma.energyTimeBlock.findMany({
      where: { dayOfWeek: { in: ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] } }
    });

    const scheduledTasksToAdd = [
      // Manager - Wtorek
      { taskTitle: 'Przeprowadzić code review PR #123', estimatedMinutes: 45, priority: 'HIGH',
        context: '@computer', energyRequired: 'HIGH', userId: managerUser.id, dayOfWeek: 'TUESDAY' },
      { taskTitle: 'Spotkanie z klientem ABC Corp', estimatedMinutes: 60, priority: 'HIGH',
        context: '@meetings', energyRequired: 'HIGH', userId: managerUser.id, dayOfWeek: 'TUESDAY' },
      { taskTitle: 'Przygotować raport statusu projektu', estimatedMinutes: 90, priority: 'MEDIUM',
        context: '@computer', energyRequired: 'MEDIUM', userId: managerUser.id, dayOfWeek: 'TUESDAY' },

      // Member - Środa
      { taskTitle: 'Implementować funkcję autoryzacji', estimatedMinutes: 120, priority: 'HIGH',
        context: '@computer', energyRequired: 'MEDIUM', userId: memberUser.id, dayOfWeek: 'WEDNESDAY' },
      { taskTitle: 'Napisać testy jednostkowe', estimatedMinutes: 75, priority: 'MEDIUM',
        context: '@computer', energyRequired: 'MEDIUM', userId: memberUser.id, dayOfWeek: 'WEDNESDAY' },
      { taskTitle: 'Debugować problem z API', estimatedMinutes: 90, priority: 'HIGH',
        context: '@creative', energyRequired: 'CREATIVE', userId: memberUser.id, dayOfWeek: 'WEDNESDAY' },
      { taskTitle: 'Aktualizować dokumentację API', estimatedMinutes: 45, priority: 'LOW',
        context: '@documentation', energyRequired: 'LOW', userId: memberUser.id, dayOfWeek: 'WEDNESDAY' },

      // Owner - Czwartek
      { taskTitle: 'Prezentacja dla inwestorów', estimatedMinutes: 90, priority: 'HIGH',
        context: '@presentation', energyRequired: 'HIGH', userId: ownerUser.id, dayOfWeek: 'THURSDAY' },
      { taskTitle: 'Strategiczne planowanie Q1', estimatedMinutes: 120, priority: 'HIGH',
        context: '@planning', energyRequired: 'HIGH', userId: ownerUser.id, dayOfWeek: 'THURSDAY' },

      // Wszystkich - Piątek
      { taskTitle: 'Przegląd tygodniowy zespołu', estimatedMinutes: 30, priority: 'MEDIUM',
        context: '@review', energyRequired: 'MEDIUM', userId: ownerUser.id, dayOfWeek: 'FRIDAY' },
      { taskTitle: 'Czyszczenie kodu i refactoring', estimatedMinutes: 60, priority: 'LOW',
        context: '@cleanup', energyRequired: 'LOW', userId: memberUser.id, dayOfWeek: 'FRIDAY' },
      { taskTitle: 'Miesięczne zestawienie finansowe', estimatedMinutes: 90, priority: 'MEDIUM',
        context: '@admin', energyRequired: 'ADMINISTRATIVE', userId: managerUser.id, dayOfWeek: 'FRIDAY' }
    ];

    let addedScheduledTasks = 0;
    for (const scheduledTask of scheduledTasksToAdd) {
      // Znajdź odpowiedni blok czasowy
      const matchingBlock = timeBlocks.find(block => 
        block.dayOfWeek === scheduledTask.dayOfWeek && 
        block.energyLevel === scheduledTask.energyRequired &&
        block.userId === scheduledTask.userId
      );

      if (matchingBlock) {
        // Znajdź lub utwórz zadanie
        let task = tasks.find(t => t.title.includes(scheduledTask.taskTitle.split(' ')[0]));
        if (!task && tasks.length > addedScheduledTasks) {
          task = tasks[addedScheduledTasks % tasks.length];
        }

        if (task) {
          const scheduledDate = new Date();
          // Ustaw na odpowiedni dzień tygodnia
          const dayMap = { 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6, 'SUNDAY': 0 };
          scheduledDate.setDate(scheduledDate.getDate() + (dayMap[scheduledTask.dayOfWeek] - scheduledDate.getDay() + 7) % 7);

          await prisma.scheduledTask.create({
            data: {
              title: scheduledTask.taskTitle,
              description: `Automatycznie zaplanowane zadanie na ${scheduledTask.dayOfWeek}`,
              estimatedMinutes: scheduledTask.estimatedMinutes,
              taskId: task.id,
              energyTimeBlockId: matchingBlock.id,
              context: scheduledTask.context,
              energyRequired: scheduledTask.energyRequired,
              priority: scheduledTask.priority,
              status: 'PLANNED',
              scheduledDate: scheduledDate,
              wasRescheduled: false,
              userId: scheduledTask.userId,
              organizationId: mainOrg.id
            }
          });
          addedScheduledTasks++;
        }
      }
    }

    console.log(`✅ Scheduled Tasks: ${addedScheduledTasks} zadań zaplanowanych`);

    // =============================================================================
    // 5. DODATKOWE ENERGY ANALYTICS
    // =============================================================================
    
    console.log('📈 5. Generowanie historycznych Energy Analytics...');
    
    let addedAnalytics = 0;
    const allUsers = [ownerUser, managerUser, memberUser];
    
    // Pobierz istniejące bloki czasowe aby używać ich ID
    const existingTimeBlocks = await prisma.energyTimeBlock.findMany({
      where: { isActive: true },
      take: 10
    });
    
    if (existingTimeBlocks.length === 0) {
      console.log('⚠️  Brak bloków czasowych - pomijam Energy Analytics');
    } else {
      // Wygeneruj analytics dla ostatnich 14 dni
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        for (const user of allUsers) {
          // Losowe wartości realistyczne dla każdego użytkownika
          const baseProductivity = user.email.includes('owner') ? 0.75 : 
                                  user.email.includes('manager') ? 0.70 : 0.65;
          
          const productivity = baseProductivity + (Math.random() * 0.2 - 0.1); // ±10%
          const energyLevels = ['HIGH', 'MEDIUM', 'LOW'];
          const plannedEnergy = energyLevels[Math.floor(Math.random() * energyLevels.length)];
          const actualEnergy = energyLevels[Math.floor(Math.random() * energyLevels.length)];
          
          // Wybierz losowy blok czasowy
          const randomBlock = existingTimeBlocks[Math.floor(Math.random() * existingTimeBlocks.length)];
          
          const existing = await prisma.energyAnalytics.findFirst({
            where: {
              userId: user.id,
              date: date,
              energyTimeBlockId: randomBlock.id
            }
          });

          if (!existing) {
            await prisma.energyAnalytics.create({
              data: {
                userId: user.id,
                organizationId: mainOrg.id,
                date: date,
                energyTimeBlockId: randomBlock.id,
                plannedEnergy: plannedEnergy,
                actualEnergy: actualEnergy,
                energyScore: Math.floor(Math.random() * 4) + 6, // 6-10
                tasksPlanned: Math.floor(Math.random() * 5) + 3, // 3-8
                tasksCompleted: Math.floor(Math.random() * 4) + 2, // 2-6
                minutesPlanned: Math.floor(Math.random() * 120) + 240, // 4-6h
                minutesActual: Math.floor(Math.random() * 100) + 200, // 3.3-5h
                productivityScore: Math.round(productivity * 100) / 100,
                contextSwitches: Math.floor(Math.random() * 8) + 2, // 2-10
                satisfactionScore: Math.floor(Math.random() * 3) + 3 // 3-5 stars
              }
            });
            addedAnalytics++;
          }
        }
      }
    }

    console.log(`✅ Energy Analytics: ${addedAnalytics} nowych pomiarów dodanych`);

    // =============================================================================
    // 6. PRÓBKA WEEKLY TEMPLATES
    // =============================================================================
    
    console.log('📋 6. Tworzenie Weekly Templates...');
    
    const weeklyTemplates = [
      {
        name: 'Produktywny Tydzień',
        description: 'Szablon tygodnia dla maksymalnej produktywności',
        templateData: {
          'MONDAY': { focus: 'Deep Work', energy: 'HIGH', priority: 'Implementation' },
          'TUESDAY': { focus: 'Meetings', energy: 'HIGH', priority: 'Collaboration' },
          'WEDNESDAY': { focus: 'Creative', energy: 'CREATIVE', priority: 'Innovation' },
          'THURSDAY': { focus: 'Presentations', energy: 'HIGH', priority: 'Communication' },
          'FRIDAY': { focus: 'Review & Planning', energy: 'MEDIUM', priority: 'Organization' }
        },
        isActive: true,
        userId: ownerUser.id,
        organizationId: mainOrg.id
      },
      {
        name: 'Balanced Work Week',
        description: 'Równoważony tydzień z czasem na wszystko',
        templateData: {
          'MONDAY': { focus: 'Planning', energy: 'MEDIUM', priority: 'Strategy' },
          'TUESDAY': { focus: 'Implementation', energy: 'HIGH', priority: 'Execution' },
          'WEDNESDAY': { focus: 'Collaboration', energy: 'MEDIUM', priority: 'Teamwork' },
          'THURSDAY': { focus: 'Review', energy: 'MEDIUM', priority: 'Quality' },
          'FRIDAY': { focus: 'Learning', energy: 'LOW', priority: 'Development' }
        },
        isActive: true,
        userId: managerUser.id,
        organizationId: mainOrg.id
      }
    ];

    // Sprawdź czy tabela day_template istnieje, jeśli nie - pomiń
    try {
      for (const template of weeklyTemplates) {
        await prisma.dayTemplate.upsert({
          where: {
            name_organizationId: {
              name: template.name,
              organizationId: template.organizationId
            }
          },
          update: template,
          create: template
        });
      }
      console.log(`✅ Weekly Templates: ${weeklyTemplates.length} szablonów dodanych`);
    } catch (error) {
      console.log(`⚠️  Weekly Templates: Tabela day_template nie istnieje - pomijam`);
    }

    // =============================================================================
    // PODSUMOWANIE
    // =============================================================================
    
    console.log('\n🎉 Smart Day Planner - Dane uzupełnione!\n');
    console.log('📊 Podsumowanie dodanych danych:');
    console.log(`   📈 Energy Patterns: ${energyPatterns.length} wzorców ML`);
    console.log(`   📅 Time Blocks: ${addedBlocks} bloków czasowych`);
    console.log(`   🎯 Focus Modes: ${addedFocusModes} nowych trybów`);
    console.log(`   📋 Scheduled Tasks: ${addedScheduledTasks} zaplanowanych zadań`);
    console.log(`   📊 Energy Analytics: ${addedAnalytics} pomiarów wydajności`);
    console.log('\n✅ Smart Day Planner jest gotowy do użycia!\n');
    
    console.log('🚀 Następne kroki:');
    console.log('   1. Otwórz Smart Day Planner w aplikacji');
    console.log('   2. Sprawdź bloki czasowe na różne dni tygodnia');
    console.log('   3. Użyj "Auto-Planuj" aby przypisać zadania do bloków');
    console.log('   4. Kliknij na zadanie w dashboard aby zobaczyć szczegóły');
    console.log('   5. Eksperymentuj z różnymi focus modes\n');

  } catch (error) {
    console.error('❌ Błąd podczas uzupełniania danych:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();