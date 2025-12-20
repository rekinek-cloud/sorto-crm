const { PrismaClient } = require('@prisma/client');

async function assignTasksToPlanner() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 Przypisywanie zadań do Smart Day Planner...');
    
    // 1. Sprawdź czy istnieją bloki czasowe
    const timeBlocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: 'user_owner_001', // Michał Kowalski
        isActive: true,
        isBreak: false
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`📅 Znaleziono ${timeBlocks.length} bloków czasowych`);
    
    if (timeBlocks.length === 0) {
      console.log('❌ Brak bloków czasowych. Tworzę przykładowe...');
      
      // Utwórz podstawowe bloki czasowe dla testów
      const basicBlocks = [
        {
          name: 'Morning Deep Work',
          startTime: '09:00',
          endTime: '11:00',
          energyLevel: 'HIGH',
          primaryContext: '@computer',
          alternativeContexts: ['@office'],
          isBreak: false,
          workdays: true,
          weekends: false,
          holidays: false,
          isActive: true,
          order: 1,
          userId: 'user_owner_001',
          organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd'
        },
        {
          name: 'Communication Block',
          startTime: '11:30',
          endTime: '12:30',
          energyLevel: 'MEDIUM',
          primaryContext: '@phone',
          alternativeContexts: ['@office'],
          isBreak: false,
          workdays: true,
          weekends: false,
          holidays: false,
          isActive: true,
          order: 2,
          userId: 'user_owner_001',
          organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd'
        },
        {
          name: 'Afternoon Focus',
          startTime: '14:00',
          endTime: '16:00',
          energyLevel: 'MEDIUM',
          primaryContext: '@computer',
          alternativeContexts: ['@office'],
          isBreak: false,
          workdays: true,
          weekends: false,
          holidays: false,
          isActive: true,
          order: 3,
          userId: 'user_owner_001',
          organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd'
        },
        {
          name: 'Admin Tasks',
          startTime: '16:30',
          endTime: '17:30',
          energyLevel: 'LOW',
          primaryContext: '@office',
          alternativeContexts: ['@computer'],
          isBreak: false,
          workdays: true,
          weekends: false,
          holidays: false,
          isActive: true,
          order: 4,
          userId: 'user_owner_001',
          organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd'
        }
      ];
      
      for (const block of basicBlocks) {
        await prisma.energyTimeBlock.create({
          data: block
        });
      }
      
      console.log('✅ Utworzono 4 podstawowe bloki czasowe');
    }
    
    // 2. Sprawdź zadania do zaplanowania (następne 3 dni)
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    
    const tasksToSchedule = await prisma.task.findMany({
      where: {
        organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd',
        createdById: 'user_owner_001',
        status: { in: ['NEW', 'IN_PROGRESS'] },
        dueDate: {
          gte: today,
          lte: threeDaysLater
        }
      },
      include: {
        context: true
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });
    
    console.log(`📋 Zadania do zaplanowania: ${tasksToSchedule.length}`);
    
    // 3. Pobierz zaktualizowane bloki czasowe
    const updatedTimeBlocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: 'user_owner_001',
        isActive: true,
        isBreak: false
      },
      orderBy: { startTime: 'asc' }
    });
    
    // 4. Automatyczne przypisywanie zadań do bloków
    const assignments = [];
    
    for (let i = 0; i < Math.min(tasksToSchedule.length, updatedTimeBlocks.length * 2); i++) {
      const task = tasksToSchedule[i];
      const blockIndex = i % updatedTimeBlocks.length;
      const block = updatedTimeBlocks[blockIndex];
      
      // Oblicz datę dla zadania
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + Math.floor(i / updatedTimeBlocks.length));
      
      // Mapowanie kontekstów
      const contextMap = {
        '@computer': ['@computer'],
        '@phone': ['@phone', '@calls'],
        '@office': ['@office'],
        '@home': ['@home'],
        '@errands': ['@errands'],
        '@waiting': ['@waiting']
      };
      
      const taskContext = task.context?.name || '@computer';
      const blockContext = block.primaryContext;
      
      // Sprawdź kompatybilność kontekstów
      const isCompatible = 
        taskContext === blockContext ||
        contextMap[taskContext]?.includes(blockContext) ||
        contextMap[blockContext]?.includes(taskContext);
      
      const scheduledTask = {
        title: task.title,
        description: task.description || `Scheduled from task: ${task.title}`,
        estimatedMinutes: Math.ceil((task.estimatedHours || 1) * 60),
        taskId: task.id,
        energyTimeBlockId: block.id,
        context: taskContext,
        energyRequired: block.energyLevel,
        priority: task.priority,
        status: 'PLANNED',
        scheduledDate: taskDate,
        userId: 'user_owner_001',
        organizationId: '5c4927f0-e5c0-46f2-9204-a317d58382bd',
        wasRescheduled: false
      };
      
      assignments.push({
        ...scheduledTask,
        isCompatible,
        blockName: block.name,
        taskTitle: task.title
      });
    }
    
    // 5. Zapisz przypisania
    let createdCount = 0;
    for (const assignment of assignments) {
      try {
        const { isCompatible, blockName, taskTitle, ...taskData } = assignment;
        
        await prisma.scheduledTask.create({
          data: taskData
        });
        
        createdCount++;
        console.log(`✅ Przypisano: "${taskTitle}" → "${blockName}" (${isCompatible ? 'kompatybilny' : 'fallback'})`);
      } catch (error) {
        console.log(`❌ Błąd przy "${assignment.taskTitle}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Przypisano ${createdCount} zadań do Smart Day Planner`);
    
    // 6. Podsumowanie
    const totalScheduled = await prisma.scheduledTask.count({
      where: {
        userId: 'user_owner_001',
        scheduledDate: {
          gte: today,
          lte: threeDaysLater
        }
      }
    });
    
    console.log(`📊 Łączna liczba zaplanowanych zadań na najbliższe 3 dni: ${totalScheduled}`);
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTasksToPlanner();