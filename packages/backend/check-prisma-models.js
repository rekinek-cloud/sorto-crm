const { PrismaClient } = require('@prisma/client');

async function checkModels() {
  const prisma = new PrismaClient();
  
  console.log('Dostępne modele Prisma:');
  const models = Object.keys(prisma).filter(k => !k.startsWith('$'));
  
  const vectorModels = models.filter(m => 
    m.toLowerCase().includes('vector') || 
    m.toLowerCase().includes('document') ||
    m.toLowerCase().includes('embedding')
  );
  
  console.log('\nModele związane z wektorami:');
  vectorModels.forEach(m => console.log(`- ${m}`));
  
  console.log('\nWszystkie modele (pierwsze 30):');
  models.slice(0, 30).forEach(m => console.log(`- ${m}`));
  
  await prisma.$disconnect();
}

checkModels().catch(console.error);