import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('=== Usuwanie zdublowanych promptów ===\n');

  // Pobierz wszystkie prompty
  const allPrompts = await prisma.ai_prompt_templates.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // Grupuj po code
  const grouped = new Map<string, typeof allPrompts>();
  for (const prompt of allPrompts) {
    if (!grouped.has(prompt.code)) {
      grouped.set(prompt.code, []);
    }
    grouped.get(prompt.code)!.push(prompt);
  }

  // Znajdź duplikaty i usuń wszystkie poza pierwszym
  let deletedCount = 0;
  for (const [code, prompts] of grouped) {
    if (prompts.length > 1) {
      console.log(`\n${code}: znaleziono ${prompts.length} rekordów`);

      // Zostaw pierwszy (najstarszy), usuń resztę
      const toDelete = prompts.slice(1);
      for (const prompt of toDelete) {
        console.log(`  Usuwam ID: ${prompt.id}`);
        await prisma.ai_prompt_templates.delete({
          where: { id: prompt.id }
        });
        deletedCount++;
      }
    }
  }

  console.log(`\n=== Usunięto ${deletedCount} duplikatów ===`);

  // Pokaż finalną liczbę
  const finalCount = await prisma.ai_prompt_templates.count();
  console.log(`Aktualna liczba promptów: ${finalCount}`);
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
