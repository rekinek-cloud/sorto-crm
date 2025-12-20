const { PrismaClient } = require('@prisma/client');

async function cleanDuplicates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Sprawdzanie duplikatów w energy_time_blocks...');
    
    // Znajdź wszystkie rekordy
    const allBlocks = await prisma.energyTimeBlock.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Całkowita liczba rekordów: ${allBlocks.length}`);
    
    // Grupuj według kluczy unikalności
    const uniqueMap = new Map();
    const toDelete = [];
    
    allBlocks.forEach(block => {
      const key = `${block.userId}-${block.startTime}-${block.endTime}-${block.dayOfWeek}`;
      
      if (uniqueMap.has(key)) {
        // To jest duplikat - oznacz do usunięcia (starszy)
        toDelete.push(block.id);
      } else {
        // To jest pierwsza wersja - zachowaj (najnowsza bo są sortowane desc)
        uniqueMap.set(key, block);
      }
    });
    
    console.log(`🎯 Unikalne bloki: ${uniqueMap.size}`);
    console.log(`🗑️ Duplikaty do usunięcia: ${toDelete.length}`);
    
    if (toDelete.length > 0) {
      // Usuń duplikaty
      const deleteResult = await prisma.energyTimeBlock.deleteMany({
        where: {
          id: {
            in: toDelete
          }
        }
      });
      
      console.log(`✅ Usunięto ${deleteResult.count} duplikatów`);
    }
    
    // Sprawdź końcowy wynik
    const finalCount = await prisma.energyTimeBlock.count();
    console.log(`📈 Końcowa liczba rekordów: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates();