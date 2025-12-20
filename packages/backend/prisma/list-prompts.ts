import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const prompts = await prisma.ai_prompt_templates.findMany({
    select: { code: true, name: true }
  });
  console.log('Liczba promptów:', prompts.length);
  console.log('');
  prompts.sort((a: any, b: any) => a.code.localeCompare(b.code)).forEach((p: any) => {
    console.log(p.code + '\t' + p.name);
  });
}

main().finally(() => prisma.$disconnect());
