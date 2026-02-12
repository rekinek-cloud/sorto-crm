/**
 * Seed AI and remaining tables
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Seeding AI and remaining tables...\n');
  let created = 0;

  // 1. ai_suggestions (snake_case fields)
  try {
    const cnt = await prisma.ai_suggestions.count();
    if (cnt === 0) {
      await prisma.ai_suggestions.createMany({
        data: [
          { id: crypto.randomUUID(), user_id: USER_ID, organization_id: ORG_ID, context: 'TASK', input_data: { taskId: '123' }, suggestion: { action: 'add_deadline' }, confidence: 85, status: 'PENDING' },
        ]
      });
      console.log('✅ ai_suggestions: 1');
      created += 1;
    } else console.log('⏭️ ai_suggestions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_suggestions:', e.message.slice(0, 120)); }

  // 2. ai_predictions
  try {
    const cnt = await prisma.ai_predictions.count();
    if (cnt === 0) {
      await prisma.ai_predictions.createMany({
        data: [
          { id: crypto.randomUUID(), user_id: USER_ID, organization_id: ORG_ID, prediction_type: 'TASK_COMPLETION', entity_type: 'TASK', confidence: 75, prediction_data: { days: 3 } },
        ]
      });
      console.log('✅ ai_predictions: 1');
      created += 1;
    } else console.log('⏭️ ai_predictions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_predictions:', e.message.slice(0, 120)); }

  // 3. ai_usage_stats
  try {
    const cnt = await prisma.ai_usage_stats.count();
    if (cnt === 0) {
      await prisma.ai_usage_stats.createMany({
        data: [
          { id: crypto.randomUUID(), user_id: USER_ID, organization_id: ORG_ID, feature: 'SUGGESTIONS', usage_count: 15, date: NOW },
        ]
      });
      console.log('✅ ai_usage_stats: 1');
      created += 1;
    } else console.log('⏭️ ai_usage_stats: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_usage_stats:', e.message.slice(0, 120)); }

  // 4. email_logs
  try {
    const cnt = await prisma.email_logs.count();
    if (cnt === 0) {
      await prisma.email_logs.createMany({
        data: [
          { id: crypto.randomUUID(), provider: 'SMTP', messageId: crypto.randomUUID(), toAddresses: ['test@example.com'], subject: 'Test email', success: true, organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ email_logs: 1');
      created += 1;
    } else console.log('⏭️ email_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_logs:', e.message.slice(0, 120)); }

  // 5. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Auto-tag urgent', subjectContains: 'pilne', assignCategory: 'URGENT', isActive: true, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ email_rules: 1');
      created += 1;
    } else console.log('⏭️ email_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 120)); }

  // 6. email_analysis
  try {
    const cnt = await prisma.emailAnalysis.count();
    if (cnt === 0) {
      await prisma.emailAnalysis.createMany({
        data: [
          { id: crypto.randomUUID(), subject: 'Oferta współpracy', summary: 'Propozycja partnerstwa', sentiment: 'POSITIVE', priority: 'HIGH', suggestedAction: 'RESPOND', organizationId: ORG_ID },
        ]
      });
      console.log('✅ EmailAnalysis: 1');
      created += 1;
    } else console.log('⏭️ EmailAnalysis: ' + cnt + ' exist');
  } catch (e) { console.log('❌ EmailAnalysis:', e.message.slice(0, 120)); }

  // 7. agent_analytics
  try {
    const cnt = await prisma.agent_analytics.count();
    if (cnt === 0) {
      await prisma.agent_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, eventType: 'SUGGESTION_VIEWED', metadata: {}, createdAt: NOW },
        ]
      });
      console.log('✅ agent_analytics: 1');
      created += 1;
    } else console.log('⏭️ agent_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_analytics:', e.message.slice(0, 120)); }

  // 8. agent_feedback
  try {
    const cnt = await prisma.agent_feedback.count();
    if (cnt === 0) {
      await prisma.agent_feedback.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, feedbackType: 'SUGGESTION', rating: 5, content: 'Pomocna sugestia', createdAt: NOW },
        ]
      });
      console.log('✅ agent_feedback: 1');
      created += 1;
    } else console.log('⏭️ agent_feedback: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_feedback:', e.message.slice(0, 120)); }

  // 9. agent_learning
  try {
    const cnt = await prisma.agent_learning.count();
    if (cnt === 0) {
      await prisma.agent_learning.createMany({
        data: [
          { id: crypto.randomUUID(), organizationId: ORG_ID, userId: USER_ID, learningType: 'PREFERENCE', data: { preferMorning: true }, confidence: 0.85, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ agent_learning: 1');
      created += 1;
    } else console.log('⏭️ agent_learning: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_learning:', e.message.slice(0, 120)); }

  // 10. document_links
  try {
    const cnt = await prisma.documentLink.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (docs.length >= 2) {
        await prisma.documentLink.create({
          data: { id: crypto.randomUUID(), sourceDocumentId: docs[0].id, targetDocumentId: docs[1].id, linkType: 'REFERENCE' }
        });
        console.log('✅ DocumentLink: 1');
        created += 1;
      }
    } else console.log('⏭️ DocumentLink: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentLink:', e.message.slice(0, 120)); }

  // 11. document_shares
  try {
    const cnt = await prisma.documentShare.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (docs.length > 0) {
        await prisma.documentShare.create({
          data: { id: crypto.randomUUID(), documentId: docs[0].id, sharedWithId: USER_ID, permission: 'VIEW' }
        });
        console.log('✅ DocumentShare: 1');
        created += 1;
      }
    } else console.log('⏭️ DocumentShare: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentShare:', e.message.slice(0, 120)); }

  // 12. message_attachments
  try {
    const cnt = await prisma.messageAttachment.count();
    if (cnt === 0) {
      const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (messages.length > 0) {
        await prisma.messageAttachment.create({
          data: { id: crypto.randomUUID(), messageId: messages[0].id, fileName: 'attachment.pdf', fileType: 'application/pdf', fileSize: 102400, filePath: '/attachments/attachment.pdf' }
        });
        console.log('✅ MessageAttachment: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageAttachment: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageAttachment:', e.message.slice(0, 120)); }

  // 13. processing_rules
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      await prisma.processingRule.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Auto-categorize', description: 'Auto categorize emails', conditions: { from: '@newsletter' }, actions: { category: 'newsletter' }, isActive: true, organizationId: ORG_ID },
        ]
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 120)); }

  // 14. message_processing_results
  try {
    const cnt = await prisma.messageProcessingResult.count();
    if (cnt === 0) {
      const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const rules = await prisma.processingRule.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (messages.length > 0 && rules.length > 0) {
        await prisma.messageProcessingResult.create({
          data: { id: crypto.randomUUID(), messageId: messages[0].id, ruleId: rules[0].id, action: 'CATEGORIZED', result: { category: 'important' } }
        });
        console.log('✅ MessageProcessingResult: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageProcessingResult: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 120)); }

  // 15. custom_field_definitions
  try {
    const cnt = await prisma.custom_field_definitions.count();
    if (cnt === 0) {
      await prisma.custom_field_definitions.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Źródło leada', fieldType: 'SELECT', entityType: 'CONTACT', options: ['Web', 'Referral', 'Ad'], organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ custom_field_definitions: 1');
      created += 1;
    } else console.log('⏭️ custom_field_definitions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ custom_field_definitions:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
