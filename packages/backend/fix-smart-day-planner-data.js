const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSmartDayPlannerData() {
  console.log('🔧 Fixing Smart Day Planner data...');
  
  try {
    const demoUserId = '306923ca-88ed-4417-a41d-c9b4ebfdef08'; // owner@demo.com
    
    // 1. Usuń wszystkie bloki dla demo użytkownika
    console.log('🗑️ Removing all existing blocks...');
    await prisma.energyTimeBlock.deleteMany({
      where: {
        userId: demoUserId
      }
    });
    
    // 2. Utwórz nowe bloki dla każdego dnia tygodnia
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    for (const dayOfWeek of daysOfWeek) {
      console.log(`📅 Creating blocks for ${dayOfWeek}...`);
      
      // Przykładowy harmonogram dnia
      const dailyBlocks = [
        {
          name: `Morning Focus - ${dayOfWeek}`,
          startTime: '08:00',
          endTime: '09:30',
          energyLevel: 'HIGH',
          primaryContext: '@computer',
          isBreak: false
        },
        {
          name: `Coffee Break - ${dayOfWeek}`,
          startTime: '09:30',
          endTime: '09:45',
          energyLevel: 'MEDIUM',
          primaryContext: '@break',
          isBreak: true,
          breakType: 'COFFEE'
        },
        {
          name: `Deep Work - ${dayOfWeek}`,
          startTime: '09:45',
          endTime: '11:30',
          energyLevel: 'HIGH',
          primaryContext: '@computer',
          isBreak: false
        },
        {
          name: `Lunch Break - ${dayOfWeek}`,
          startTime: '11:30',
          endTime: '12:30',
          energyLevel: 'MEDIUM',
          primaryContext: '@break',
          isBreak: true,
          breakType: 'MEAL'
        },
        {
          name: `Afternoon Work - ${dayOfWeek}`,
          startTime: '12:30',
          endTime: '14:00',
          energyLevel: 'MEDIUM',
          primaryContext: '@computer',
          isBreak: false
        },
        {
          name: `Short Break - ${dayOfWeek}`,
          startTime: '14:00',
          endTime: '14:15',
          energyLevel: 'LOW',
          primaryContext: '@break',
          isBreak: true,
          breakType: 'STRETCH'
        },
        {
          name: `Late Afternoon - ${dayOfWeek}`,
          startTime: '14:15',
          endTime: '16:00',
          energyLevel: 'MEDIUM',
          primaryContext: '@computer',
          isBreak: false
        }
      ];
      
      // Utwórz bloki dla tego dnia
      for (let i = 0; i < dailyBlocks.length; i++) {
        const block = dailyBlocks[i];
        
        await prisma.energyTimeBlock.create({
          data: {
            name: block.name,
            startTime: block.startTime,
            endTime: block.endTime,
            energyLevel: block.energyLevel,
            primaryContext: block.primaryContext,
            alternativeContexts: [],
            isBreak: block.isBreak,
            breakType: block.breakType || null,
            dayOfWeek: dayOfWeek,
            isActive: true,
            order: i,
            organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449',
            userId: demoUserId,
            holidays: false,
            specificDays: [],
            weekends: ['SATURDAY', 'SUNDAY'].includes(dayOfWeek),
            workdays: !['SATURDAY', 'SUNDAY'].includes(dayOfWeek)
          }
        });
      }
    }
    
    // 3. Utwórz przykładowe zadania zaplanowane
    console.log('📋 Creating scheduled tasks...');
    
    const blocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: demoUserId,
        dayOfWeek: 'MONDAY',
        isBreak: false
      }
    });
    
    if (blocks.length > 0) {
      await prisma.scheduledTask.create({
        data: {
          title: 'Przegląd emaili i planowanie dnia',
          description: 'Sprawdzenie najważniejszych wiadomości i ustalenie priorytetów na dzień',
          scheduledDate: new Date(),
          estimatedMinutes: 30,
          status: 'PLANNED',
          priority: 'MEDIUM',
          context: '@computer',
          energyRequired: 'MEDIUM',
          organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449',
          userId: demoUserId,
          energyTimeBlockId: blocks[0].id
        }
      });
      
      await prisma.scheduledTask.create({
        data: {
          title: 'Praca nad projektem CRM-GTD',
          description: 'Implementacja nowych funkcjonalności Smart Day Planner',
          scheduledDate: new Date(),
          estimatedMinutes: 90,
          status: 'PLANNED',
          priority: 'HIGH',
          context: '@computer',
          energyRequired: 'HIGH',
          organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449',
          userId: demoUserId,
          energyTimeBlockId: blocks[1].id
        }
      });
    }
    
    console.log('✅ Smart Day Planner data fixed successfully!');
    
    // Sprawdź wyniki
    const totalBlocks = await prisma.energyTimeBlock.count({
      where: { userId: demoUserId }
    });
    
    const totalTasks = await prisma.scheduledTask.count({
      where: { 
        userId: demoUserId,
        NOT: { energyTimeBlockId: null }
      }
    });
    
    console.log(`📊 Results:`);
    console.log(`   - Energy Time Blocks: ${totalBlocks}`);
    console.log(`   - Scheduled Tasks: ${totalTasks}`);
    
  } catch (error) {
    console.error('❌ Error fixing Smart Day Planner data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
fixSmartDayPlannerData()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });