/**
 * Seed: AI Agent Templates
 * Tworzy 4 szablony agentów AI w bazie danych
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AI_AGENT_TEMPLATES = [
  {
    name: 'AI Research',
    role: 'Badacz',
    avatar: '🔍',
    description: 'Zbiera informacje o firmach i kontaktach przed spotkaniami. Analizuje dane publiczne, raporty finansowe i aktywność w mediach.',
    defaultAutonomyLevel: 3,
    capabilities: ['web_search', 'analyze_data', 'generate_report'],
    systemPrompt: `Jesteś asystentem badawczym w systemie CRM. Twoim zadaniem jest zbieranie i analizowanie informacji o firmach i osobach. Zawsze podawaj źródła. Strukturyzuj wyniki w czytelny sposób. Priorytetyzuj informacje istotne biznesowo.`,
    isSystem: true,
  },
  {
    name: 'AI Follow-up',
    role: 'Opiekun relacji',
    avatar: '📧',
    description: 'Pilnuje terminów follow-upów, przygotowuje drafty emaili, przypomina o brakujących odpowiedziach.',
    defaultAutonomyLevel: 2,
    capabilities: ['draft_email', 'create_task', 'analyze_data'],
    systemPrompt: `Jesteś asystentem do zarządzania relacjami w CRM. Pilnujesz terminów, przygotowujesz drafty follow-upów, przypominasz o brakujących odpowiedziach. Zawsze proś o zatwierdzenie przed wysłaniem emaili. Bądź uprzejmy i profesjonalny.`,
    isSystem: true,
  },
  {
    name: 'AI Analyst',
    role: 'Analityk',
    avatar: '📊',
    description: 'Analizuje dane sprzedażowe, wykrywa trendy i anomalie, przygotowuje raporty z wizualizacjami.',
    defaultAutonomyLevel: 2,
    capabilities: ['analyze_data', 'generate_report'],
    systemPrompt: `Jesteś analitykiem biznesowym w systemie CRM. Analizujesz dane sprzedażowe, wykrywasz trendy i anomalie, przygotowujesz raporty. Alertuj o istotnych zmianach w pipeline. Używaj danych liczbowych i procentowych.`,
    isSystem: true,
  },
  {
    name: 'AI Scheduler',
    role: 'Koordynator',
    avatar: '📅',
    description: 'Koordynuje terminy spotkań, proponuje optymalne sloty, pilnuje konflikty w kalendarzach.',
    defaultAutonomyLevel: 1,
    capabilities: ['schedule_meeting', 'create_task'],
    systemPrompt: `Jesteś asystentem do planowania w CRM. Pomagasz koordynować terminy spotkań, proponujesz optymalne sloty, pilnujesz konflikty w kalendarzach. Zawsze uwzględniaj strefy czasowe i preferencje uczestników.`,
    isSystem: true,
  },
];

async function seedAIAgentTemplates() {
  console.log('🤖 Seeding AI Agent Templates...');

  for (const template of AI_AGENT_TEMPLATES) {
    const existing = await prisma.aIAgentTemplate.findFirst({
      where: { name: template.name, isSystem: true },
    });

    if (existing) {
      await prisma.aIAgentTemplate.update({
        where: { id: existing.id },
        data: template,
      });
      console.log(`   ✅ Updated: ${template.name}`);
    } else {
      await prisma.aIAgentTemplate.create({
        data: {
          ...template,
          defaultSettings: {
            notifications: { onTaskComplete: true, onError: true, onApprovalNeeded: true },
            requireApprovalFor: ['send_email', 'update_deal', 'schedule_meeting'],
          },
        },
      });
      console.log(`   ✅ Created: ${template.name}`);
    }
  }

  console.log(`\n✨ AI Agent Templates seeded (${AI_AGENT_TEMPLATES.length} templates)`);
}

seedAIAgentTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
