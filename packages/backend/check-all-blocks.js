const { PrismaClient } = require('@prisma/client');

async function checkExistingBlocks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Sprawdzanie wszystkich bloków czasowych...');
    
    const allBlocks = await prisma.energyTimeBlock.findMany({
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        userId: true,
        isActive: true,
        isBreak: true,
        organizationId: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`📊 Łączna liczba bloków: ${allBlocks.length}`);
    
    allBlocks.forEach(block => {
      console.log(`  - ${block.name || 'Bez nazwy'} (${block.startTime}-${block.endTime})`);
      console.log(`    User: ${block.userId}`);
      console.log(`    Active: ${block.isActive}, Break: ${block.isBreak}`);
      console.log(`    Org: ${block.organizationId}`);
      console.log('');
    });
    
    // Sprawdź konkretnie dla user_owner_001
    const userBlocks = await prisma.energyTimeBlock.findMany({
      where: {
        userId: 'user_owner_001'
      }
    });
    
    console.log(`🎯 Bloki dla user_owner_001: ${userBlocks.length}`);
    
    // Sprawdź dla wszystkich userów
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\n👥 Dostępni użytkownicy:');
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.id})`);
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingBlocks();