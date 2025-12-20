const { PrismaClient } = require('@prisma/client');

async function checkUniqueBlocks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Sprawdzanie unikalnych bloków czasowych...');
    
    const allBlocks = await prisma.energyTimeBlock.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        name: true,
        dayOfWeek: true,
        workdays: true,
        isActive: true,
        userId: true,
        createdAt: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`📊 Całkowita liczba rekordów: ${allBlocks.length}`);
    
    // Grupuj według startTime-endTime
    const timeGroups = new Map();
    
    allBlocks.forEach(block => {
      const key = `${block.startTime}-${block.endTime}`;
      if (!timeGroups.has(key)) {
        timeGroups.set(key, []);
      }
      timeGroups.get(key).push(block);
    });
    
    console.log(`⏰ Unikalne przedziały czasowe: ${timeGroups.size}`);
    
    // Sprawdź czy są jeszcze duplikaty czasowe
    let duplicateCount = 0;
    timeGroups.forEach((blocks, timeRange) => {
      if (blocks.length > 1) {
        console.log(`⚠️  Duplikat czasu ${timeRange}: ${blocks.length} rekordów`);
        duplicateCount += blocks.length - 1;
      }
    });
    
    if (duplicateCount === 0) {
      console.log('✅ Brak duplikatów czasowych!');
    } else {
      console.log(`❌ Znaleziono ${duplicateCount} duplikatów czasowych`);
    }
    
    // Pokaż wszystkie unikalne przedziały
    console.log('\n📅 Unikalne bloki czasowe:');
    Array.from(timeGroups.keys()).sort().forEach(timeRange => {
      const blocks = timeGroups.get(timeRange);
      console.log(`  ${timeRange} - ${blocks[0].name || 'Bez nazwy'}`);
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUniqueBlocks();