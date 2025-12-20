import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeEnergyTimeBlocks() {
  try {
    // 1. Sprawdź liczbę rekordów
    const totalCount = await prisma.energyTimeBlock.count();
    console.log('1. Całkowita liczba rekordów:', totalCount);
    
    // 2. Pobierz wszystkie rekordy
    const blocks = await prisma.energyTimeBlock.findMany({
      orderBy: [
        { startTime: 'asc' },
        { endTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    console.log('\n2. Analiza duplikatów według startTime/endTime:');
    const timeGroups: { [key: string]: any[] } = {};
    
    blocks.forEach(block => {
      const key = block.startTime + '-' + block.endTime;
      if (!timeGroups[key]) {
        timeGroups[key] = [];
      }
      timeGroups[key].push(block);
    });
    
    let duplicateCount = 0;
    Object.entries(timeGroups).forEach(([timeKey, group]) => {
      if (group.length > 1) {
        duplicateCount++;
        console.log(`\nCzas ${timeKey}: ${group.length} duplikatów`);
        group.forEach(block => {
          console.log(`  - ID: ${block.id}, workdays: ${block.workdays}, dayOfWeek: ${block.dayOfWeek}, createdAt: ${block.createdAt.toISOString()}`);
        });
      }
    });
    
    console.log(`\nZnaleziono ${duplicateCount} grup duplikatów`);
    
    // 3. Sprawdź różne createdAt
    console.log('\n3. Analiza według createdAt:');
    const createdAtGroups: { [key: string]: number } = {};
    
    blocks.forEach(block => {
      const dateKey = block.createdAt.toISOString().split('T')[0];
      createdAtGroups[dateKey] = (createdAtGroups[dateKey] || 0) + 1;
    });
    
    console.log('Grupy według daty utworzenia:', createdAtGroups);
    
    // 4. Analiza workdays i dayOfWeek
    console.log('\n4. Analiza workdays i dayOfWeek:');
    const workdaysStats = await prisma.energyTimeBlock.groupBy({
      by: ['workdays'],
      _count: true
    });
    console.log('Rozkład workdays:', workdaysStats);
    
    const dayOfWeekStats = await prisma.energyTimeBlock.groupBy({
      by: ['dayOfWeek'],
      _count: true
    });
    console.log('Rozkład dayOfWeek:', dayOfWeekStats);
    
    // 5. Sprawdź czy są identyczne zestawy
    console.log('\n5. Sprawdzenie identycznych zestawów:');
    const uniqueSets = new Map();
    
    blocks.forEach(block => {
      const setKey = `${block.startTime}-${block.endTime}-${block.energyLevel}-${block.name}`;
      if (!uniqueSets.has(setKey)) {
        uniqueSets.set(setKey, []);
      }
      uniqueSets.get(setKey).push({
        id: block.id,
        workdays: block.workdays,
        dayOfWeek: block.dayOfWeek,
        createdAt: block.createdAt
      });
    });
    
    console.log(`Znaleziono ${uniqueSets.size} unikalnych bloków czasowych`);
    
    // Pokaż pierwsze kilka duplikatów
    let shown = 0;
    uniqueSets.forEach((duplicates, key) => {
      if (duplicates.length > 1 && shown < 3) {
        console.log(`\nBlok: ${key}`);
        console.log(`Liczba duplikatów: ${duplicates.length}`);
        duplicates.forEach((d: any) => {
          console.log(`  - ID: ${d.id}, workdays: ${d.workdays}, dayOfWeek: ${d.dayOfWeek}, created: ${d.createdAt.toISOString()}`);
        });
        shown++;
      }
    });
    
    // 6. Dodatkowa analiza - sprawdź kombinacje workdays/dayOfWeek
    console.log('\n6. Analiza kombinacji workdays/dayOfWeek:');
    const combinations = new Map();
    
    blocks.forEach(block => {
      const comboKey = `${block.workdays}-${block.dayOfWeek}`;
      if (!combinations.has(comboKey)) {
        combinations.set(comboKey, 0);
      }
      combinations.set(comboKey, combinations.get(comboKey) + 1);
    });
    
    console.log('Kombinacje workdays-dayOfWeek:');
    combinations.forEach((count, combo) => {
      console.log(`  ${combo}: ${count} rekordów`);
    });
    
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeEnergyTimeBlocks();