const { PrismaClient } = require('@prisma/client');

async function checkModels() {
  const prisma = new PrismaClient();

  console.log('🔍 Dostępne modele w Prisma Client:');

  const properties = Object.getOwnPropertyNames(prisma).filter(p => 
    typeof prisma[p] === 'object' && 
    prisma[p] !== null && 
    'findMany' in prisma[p]
  );

  console.log('Liczba modeli:', properties.length);
  properties.sort().forEach((prop, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${prop}`);
  });

  console.log('\n🧪 Testowanie niektórych modeli:');

  // Test podstawowych modeli
  const testModels = ['user', 'organization', 'AIProvider', 'aIProvider', 'aiProvider'];

  for (const model of testModels) {
    try {
      if (prisma[model] && typeof prisma[model].count === 'function') {
        const count = await prisma[model].count();
        console.log(`✅ ${model}: ${count} rekordów`);
      } else {
        console.log(`❌ ${model}: NIE ISTNIEJE`);
      }
    } catch (e) {
      console.log(`❌ ${model}: BŁĄD - ${e.message.substring(0, 50)}`);
    }
  }
  
  await prisma.$disconnect();
}

checkModels();