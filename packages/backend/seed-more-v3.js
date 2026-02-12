/**
 * Seed More Tables - Part 3
 * For models without @default(uuid()) and proper field names
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables (Part 3)...\n');
  let created = 0;

  // 1. agent_conversations
  try {
    const cnt = await prisma.agent_conversations.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_conversations.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, title: 'Planowanie zadań', status: 'COMPLETED', metadata: {}, updatedAt: new Date() },
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, title: 'Analiza sprzedaży', status: 'ACTIVE', metadata: {}, updatedAt: new Date() },
        ]
      });
      console.log('✅ agent_conversations: 2');
      created += 2;
    } else console.log('⏭️ agent_conversations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_conversations:', e.message.slice(0, 100)); }

  // 2. agent_suggestions
  try {
    const cnt = await prisma.agent_suggestions.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_suggestions.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, suggestionType: 'DEADLINE_WARNING', title: 'Zbliżający się deadline', description: 'Zadanie wymaga uwagi', priority: 'HIGH', status: 'PENDING' },
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, suggestionType: 'FOLLOW_UP_REMINDER', title: 'Follow-up z klientem', description: 'Nie kontaktowano od 14 dni', priority: 'MEDIUM', status: 'PENDING' },
        ]
      });
      console.log('✅ agent_suggestions: 2');
      created += 2;
    } else console.log('⏭️ agent_suggestions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_suggestions:', e.message.slice(0, 100)); }

  // 3. bug_reports
  try {
    const cnt = await prisma.bug_reports.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.bug_reports.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Błąd przy zapisie formularza', description: 'Formularz kontaktu nie zapisuje danych', priority: 'HIGH', status: 'OPEN', reporterId: USER_ID, organizationId: ORG_ID },
          { id: crypto.randomUUID(), title: 'Błąd wyświetlania', description: 'Tabela nie ładuje się poprawnie', priority: 'MEDIUM', status: 'IN_PROGRESS', reporterId: USER_ID, organizationId: ORG_ID },
        ]
      });
      console.log('✅ bug_reports: 2');
      created += 2;
    } else console.log('⏭️ bug_reports: ' + cnt + ' exist');
  } catch (e) { console.log('❌ bug_reports:', e.message.slice(0, 100)); }

  // 4. agent_messages
  try {
    const cnt = await prisma.agent_messages.count();
    if (cnt === 0) {
      const convs = await prisma.agent_conversations.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const conv of convs) {
        await prisma.agent_messages.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: conv.id,
            role: 'USER',
            content: 'Pomóż mi zaplanować zadania na dziś',
            createdAt: new Date()
          }
        });
        await prisma.agent_messages.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: conv.id,
            role: 'ASSISTANT',
            content: 'Oto Twoje priorytety na dziś...',
            createdAt: new Date()
          }
        });
        c += 2;
      }
      console.log('✅ agent_messages: ' + c);
      created += c;
    } else console.log('⏭️ agent_messages: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_messages:', e.message.slice(0, 100)); }

  // 5. agent_actions
  try {
    const cnt = await prisma.agent_actions.count();
    if (cnt === 0) {
      const convs = await prisma.agent_conversations.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const conv of convs) {
        await prisma.agent_actions.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: conv.id,
            actionType: 'CREATE_TASK',
            status: 'COMPLETED',
            input: { title: 'Nowe zadanie' },
            output: { success: true },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        c++;
      }
      console.log('✅ agent_actions: ' + c);
      created += c;
    } else console.log('⏭️ agent_actions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_actions:', e.message.slice(0, 100)); }

  // 6. agent_feedback
  try {
    const cnt = await prisma.agent_feedback.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_feedback.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, feedbackType: 'SUGGESTION', rating: 5, content: 'Świetna sugestia!', createdAt: new Date() },
        ]
      });
      console.log('✅ agent_feedback: 1');
      created += 1;
    } else console.log('⏭️ agent_feedback: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_feedback:', e.message.slice(0, 100)); }

  // 7. agent_analytics
  try {
    const cnt = await prisma.agent_analytics.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, eventType: 'SUGGESTION_VIEWED', metadata: {}, createdAt: new Date() },
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, eventType: 'TASK_CREATED', metadata: { source: 'agent' }, createdAt: new Date() },
        ]
      });
      console.log('✅ agent_analytics: 2');
      created += 2;
    } else console.log('⏭️ agent_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_analytics:', e.message.slice(0, 100)); }

  // 8. agent_learning
  try {
    const cnt = await prisma.agent_learning.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_learning.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, learningType: 'PREFERENCE', data: { preferMorning: true }, confidence: 0.85, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ agent_learning: 1');
      created += 1;
    } else console.log('⏭️ agent_learning: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_learning:', e.message.slice(0, 100)); }

  // 9. ai_suggestions
  try {
    const cnt = await prisma.ai_suggestions.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.ai_suggestions.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, type: 'TASK', content: 'Rozważ podzielenie tego zadania', confidence: 0.8, status: 'PENDING', createdAt: new Date() },
        ]
      });
      console.log('✅ ai_suggestions: 1');
      created += 1;
    } else console.log('⏭️ ai_suggestions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_suggestions:', e.message.slice(0, 100)); }

  // 10. ai_predictions
  try {
    const cnt = await prisma.ai_predictions.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.ai_predictions.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, predictionType: 'TASK_COMPLETION', entityType: 'TASK', confidence: 0.75, data: { estimatedDays: 3 }, createdAt: new Date() },
        ]
      });
      console.log('✅ ai_predictions: 1');
      created += 1;
    } else console.log('⏭️ ai_predictions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_predictions:', e.message.slice(0, 100)); }

  // 11. ai_usage_stats
  try {
    const cnt = await prisma.ai_usage_stats.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.ai_usage_stats.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, feature: 'TASK_SUGGESTIONS', usageCount: 15, date: new Date() },
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, feature: 'EMAIL_ANALYSIS', usageCount: 8, date: new Date() },
        ]
      });
      console.log('✅ ai_usage_stats: 2');
      created += 2;
    } else console.log('⏭️ ai_usage_stats: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_usage_stats:', e.message.slice(0, 100)); }

  // 12. email_analysis
  try {
    const cnt = await prisma.emailAnalysis.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.emailAnalysis.createMany({
        data: [
          { id: crypto.randomUUID(), subject: 'Oferta współpracy', summary: 'Propozycja partnerstwa biznesowego', sentiment: 'POSITIVE', priority: 'HIGH', suggestedAction: 'RESPOND', organizationId: ORG_ID },
        ]
      });
      console.log('✅ EmailAnalysis: 1');
      created += 1;
    } else console.log('⏭️ EmailAnalysis: ' + cnt + ' exist');
  } catch (e) { console.log('❌ EmailAnalysis:', e.message.slice(0, 100)); }

  // 13. processing_rules
  try {
    const cnt = await prisma.processingRule.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.processingRule.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Auto-tag urgent', description: 'Automatycznie oznacz pilne', conditions: { keyword: 'pilne' }, actions: { addTag: 'urgent' }, isActive: true, organizationId: ORG_ID },
        ]
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
