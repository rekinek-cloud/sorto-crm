/**
 * Seed Remaining Tables with correct structures
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Seeding remaining tables...\n');
  let created = 0;

  // 1. ai_predictions
  try {
    const cnt = await prisma.ai_predictions.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const task of tasks) {
        await prisma.ai_predictions.create({
          data: {
            id: crypto.randomUUID(),
            itemId: task.id,
            itemType: 'TASK',
            predictionType: 'COMPLETION_TIME',
            predictedValue: { days: 3 },
            confidenceScore: 0.85,
            factors: { complexity: 'medium' },
            recommendations: { action: 'prioritize' }
          }
        });
      }
      console.log('✅ ai_predictions: ' + tasks.length);
      created += tasks.length;
    } else console.log('⏭️ ai_predictions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_predictions:', e.message.slice(0, 120)); }

  // 2. agent_analytics
  try {
    const cnt = await prisma.agent_analytics.count();
    if (cnt === 0) {
      await prisma.agent_analytics.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          date: NOW,
          metrics: { suggestionsViewed: 10, suggestionsAccepted: 5, tasksCreated: 3 }
        }
      });
      console.log('✅ agent_analytics: 1');
      created += 1;
    } else console.log('⏭️ agent_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_analytics:', e.message.slice(0, 120)); }

  // 3. agent_feedback (needs messageId)
  try {
    const cnt = await prisma.agent_feedback.count();
    if (cnt === 0) {
      const messages = await prisma.agent_messages.findMany({ take: 2 });
      for (const msg of messages) {
        try {
          await prisma.agent_feedback.create({
            data: {
              id: crypto.randomUUID(),
              messageId: msg.id,
              userId: USER_ID,
              feedbackType: 'HELPFUL',
              rating: 5,
              comment: 'Bardzo pomocna odpowiedź'
            }
          });
          created++;
        } catch (e2) { /* unique constraint */ }
      }
      console.log('✅ agent_feedback: created');
    } else console.log('⏭️ agent_feedback: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_feedback:', e.message.slice(0, 120)); }

  // 4. agent_learning
  try {
    const cnt = await prisma.agent_learning.count();
    if (cnt === 0) {
      await prisma.agent_learning.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          learningType: 'USER_PREFERENCE',
          pattern: { preferMorningTasks: true, avoidMeetingsAfter16: true },
          confidence: 0.85,
          updatedAt: NOW
        }
      });
      console.log('✅ agent_learning: 1');
      created += 1;
    } else console.log('⏭️ agent_learning: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_learning:', e.message.slice(0, 120)); }

  // 5. DocumentLink (type field is LinkType enum)
  try {
    const cnt = await prisma.documentLink.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (docs.length >= 2) {
        await prisma.documentLink.create({
          data: {
            id: crypto.randomUUID(),
            sourceDocumentId: docs[0].id,
            targetDocumentId: docs[1].id,
            type: 'REFERENCE',
            strength: 1.0
          }
        });
        console.log('✅ DocumentLink: 1');
        created += 1;
      }
    } else console.log('⏭️ DocumentLink: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentLink:', e.message.slice(0, 120)); }

  // 6. DocumentShare (needs sharedById)
  try {
    const cnt = await prisma.documentShare.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (docs.length > 0 && users.length >= 2) {
        await prisma.documentShare.create({
          data: {
            id: crypto.randomUUID(),
            documentId: docs[0].id,
            sharedWithId: users[1].id,
            sharedById: users[0].id,
            permission: 'READ'
          }
        });
        console.log('✅ DocumentShare: 1');
        created += 1;
      }
    } else console.log('⏭️ DocumentShare: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentShare:', e.message.slice(0, 120)); }

  // 7. MessageAttachment
  try {
    const cnt = await prisma.messageAttachment.count();
    if (cnt === 0) {
      const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const msg of messages) {
        await prisma.messageAttachment.create({
          data: {
            id: crypto.randomUUID(),
            messageId: msg.id,
            fileName: 'attachment.pdf',
            fileType: 'application/pdf',
            fileSize: 102400
          }
        });
      }
      console.log('✅ MessageAttachment: ' + messages.length);
      created += messages.length;
    } else console.log('⏭️ MessageAttachment: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageAttachment:', e.message.slice(0, 120)); }

  // 8. agent_context_cache
  try {
    const cnt = await prisma.agent_context_cache.count();
    if (cnt === 0) {
      await prisma.agent_context_cache.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          cacheKey: 'user_preferences',
          cacheData: { theme: 'light', language: 'pl' },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ agent_context_cache: 1');
      created += 1;
    } else console.log('⏭️ agent_context_cache: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_context_cache:', e.message.slice(0, 120)); }

  // 9. agent_proactive_tasks
  try {
    const cnt = await prisma.agent_proactive_tasks.count();
    if (cnt === 0) {
      await prisma.agent_proactive_tasks.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          taskType: 'REMINDER',
          title: 'Follow-up z klientem ABC',
          description: 'Minęło 14 dni od ostatniego kontaktu',
          status: 'PENDING',
          priority: 'MEDIUM',
          suggestedAction: { action: 'send_email', recipient: 'abc@example.com' },
          triggerCondition: { daysSinceContact: 14 },
          updatedAt: NOW
        }
      });
      console.log('✅ agent_proactive_tasks: 1');
      created += 1;
    } else console.log('⏭️ agent_proactive_tasks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_proactive_tasks:', e.message.slice(0, 120)); }

  // 10. ai_usage_stats
  try {
    const cnt = await prisma.ai_usage_stats.count();
    if (cnt === 0) {
      await prisma.ai_usage_stats.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          feature: 'SUGGESTIONS',
          usageCount: 25,
          date: NOW,
          metadata: { avgResponseTime: 150 }
        }
      });
      console.log('✅ ai_usage_stats: 1');
      created += 1;
    } else console.log('⏭️ ai_usage_stats: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_usage_stats:', e.message.slice(0, 120)); }

  // 11. email_analysis
  try {
    const cnt = await prisma.emailAnalysis.count();
    if (cnt === 0) {
      await prisma.emailAnalysis.create({
        data: {
          id: crypto.randomUUID(),
          subject: 'Oferta współpracy',
          summary: 'Propozycja partnerstwa biznesowego',
          sentiment: 'POSITIVE',
          priority: 'HIGH',
          suggestedAction: 'RESPOND',
          categories: ['BUSINESS', 'PARTNERSHIP'],
          organizationId: ORG_ID
        }
      });
      console.log('✅ EmailAnalysis: 1');
      created += 1;
    } else console.log('⏭️ EmailAnalysis: ' + cnt + ' exist');
  } catch (e) { console.log('❌ EmailAnalysis:', e.message.slice(0, 120)); }

  // 12. processing_rules
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      const channels = await prisma.communicationChannel.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-kategoryzacja',
          description: 'Automatycznie kategoryzuj wiadomości',
          conditions: { from: '@newsletter' },
          actions: { category: 'newsletter', priority: 'low' },
          isActive: true,
          channelId: channels[0]?.id,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 120)); }

  // 13. message_processing_results
  try {
    const cnt = await prisma.messageProcessingResult.count();
    if (cnt === 0) {
      const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const rules = await prisma.processingRule.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (messages.length > 0 && rules.length > 0) {
        await prisma.messageProcessingResult.create({
          data: {
            id: crypto.randomUUID(),
            messageId: messages[0].id,
            ruleId: rules[0].id,
            action: 'CATEGORIZED',
            result: { category: 'important', matched: true }
          }
        });
        console.log('✅ MessageProcessingResult: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageProcessingResult: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 120)); }

  // 14. context_priorities
  try {
    const cnt = await prisma.context_priorities.count();
    if (cnt === 0) {
      const contexts = await prisma.context.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      for (let i = 0; i < contexts.length; i++) {
        await prisma.context_priorities.create({
          data: {
            id: crypto.randomUUID(),
            contextId: contexts[i].id,
            priority: i + 1,
            timeOfDay: 'MORNING',
            organizationId: ORG_ID,
            userId: USER_ID,
            updatedAt: NOW
          }
        });
      }
      console.log('✅ context_priorities: ' + contexts.length);
      created += contexts.length;
    } else console.log('⏭️ context_priorities: ' + cnt + ' exist');
  } catch (e) { console.log('❌ context_priorities:', e.message.slice(0, 120)); }

  // 15. energy_patterns
  try {
    const cnt = await prisma.energy_patterns.count();
    if (cnt === 0) {
      await prisma.energy_patterns.create({
        data: {
          id: crypto.randomUUID(),
          date: NOW,
          dayOfWeek: 'MONDAY',
          hourlyData: { '09': 0.9, '10': 0.95, '11': 0.85, '14': 0.7 },
          avgEnergy: 0.85,
          peakHour: 10,
          lowHour: 14,
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ energy_patterns: 1');
      created += 1;
    } else console.log('⏭️ energy_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_patterns:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
