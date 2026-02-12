/**
 * Seed ALL remaining tables to 100%
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Seeding ALL remaining tables...\n');
  let created = 0;

  // 1. AiConversation (maps to ai_conversations)
  try {
    const cnt = await prisma.aiConversation.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.aiConversation.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          streamId: streams[0]?.id,
          source: 'CLAUDE',
          externalId: crypto.randomUUID(),
          hash: crypto.randomUUID(),
          title: 'Rozmowa o planowaniu',
          appName: 'Claude',
          messageCount: 5
        }
      });
      console.log('✅ AiConversation: 1');
      created += 1;
    } else console.log('⏭️ AiConversation: ' + cnt + ' exist');
  } catch (e) { console.log('❌ AiConversation:', e.message.slice(0, 120)); }

  // 2. AiConversationMessage (maps to ai_conversation_messages)
  try {
    const cnt = await prisma.aiConversationMessage.count();
    if (cnt === 0) {
      const convs = await prisma.aiConversation.findMany({ take: 1 });
      if (convs.length > 0) {
        await prisma.aiConversationMessage.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: convs[0].id,
            role: 'user',
            content: 'Pomóż mi zaplanować projekt',
            messageIndex: 0
          }
        });
        console.log('✅ AiConversationMessage: 1');
        created += 1;
      }
    } else console.log('⏭️ AiConversationMessage: ' + cnt + ' exist');
  } catch (e) { console.log('❌ AiConversationMessage:', e.message.slice(0, 120)); }

  // 3. ai_executions
  try {
    const cnt = await prisma.ai_executions.count();
    if (cnt === 0) {
      await prisma.ai_executions.create({
        data: {
          id: crypto.randomUUID(),
          inputData: { query: 'analyze task' },
          promptSent: 'Analyze the following task...',
          responseReceived: 'Task analysis complete',
          status: 'SUCCESS',
          executionTime: 1500,
          tokensUsed: 200,
          cost: 0.02,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ai_executions: 1');
      created += 1;
    } else console.log('⏭️ ai_executions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_executions:', e.message.slice(0, 120)); }

  // 4. ai_rules
  try {
    const cnt = await prisma.ai_rules.count();
    if (cnt === 0) {
      await prisma.ai_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-priority rule',
          description: 'Set priority based on deadline',
          ruleType: 'PRIORITY',
          conditions: { deadline: 'soon' },
          actions: { setPriority: 'HIGH' },
          isActive: true,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ ai_rules: 1');
      created += 1;
    } else console.log('⏭️ ai_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_rules:', e.message.slice(0, 120)); }

  // 5. email_logs
  try {
    const cnt = await prisma.email_logs.count();
    if (cnt === 0) {
      await prisma.email_logs.create({
        data: {
          id: crypto.randomUUID(),
          provider: 'SMTP',
          messageId: crypto.randomUUID(),
          toAddresses: ['client@example.com'],
          subject: 'Potwierdzenie zamówienia',
          success: true,
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ email_logs: 1');
      created += 1;
    } else console.log('⏭️ email_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_logs:', e.message.slice(0, 120)); }

  // 6. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Categorize newsletters',
          subjectContains: 'newsletter',
          assignCategory: 'NEWSLETTER',
          isActive: true,
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ email_rules: 1');
      created += 1;
    } else console.log('⏭️ email_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 120)); }

  // 7. processing_rules
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-categorize',
          conditions: { from: '@newsletter' },
          actions: { category: 'newsletter' },
          isActive: true,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 120)); }

  // 8. message_processing_results
  try {
    const cnt = await prisma.messageProcessingResult.count();
    if (cnt === 0) {
      const msgs = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const rules = await prisma.processingRule.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (msgs.length > 0 && rules.length > 0) {
        await prisma.messageProcessingResult.create({
          data: {
            id: crypto.randomUUID(),
            messageId: msgs[0].id,
            ruleId: rules[0].id,
            action: 'CATEGORIZED',
            result: { success: true }
          }
        });
        console.log('✅ MessageProcessingResult: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageProcessingResult: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 120)); }

  // 9. energy_analytics
  try {
    const cnt = await prisma.energy_analytics.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ take: 1 });
      if (blocks.length > 0) {
        await prisma.energy_analytics.create({
          data: {
            id: crypto.randomUUID(),
            date: NOW,
            energyTimeBlockId: blocks[0].id,
            actualEnergy: 0.85,
            plannedEnergy: 0.9,
            tasksCompleted: 5,
            tasksPlanned: 6,
            organizationId: ORG_ID,
            userId: USER_ID
          }
        });
        console.log('✅ energy_analytics: 1');
        created += 1;
      }
    } else console.log('⏭️ energy_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 120)); }

  // 10. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.create({
        data: {
          id: crypto.randomUUID(),
          date: NOW,
          metricType: 'PRODUCTIVITY',
          value: 85,
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ performance_metrics: 1');
      created += 1;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 120)); }

  // 11. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          action: 'LOGIN',
          resource: '/dashboard',
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_access_logs: 1');
      created += 1;
    } else console.log('⏭️ user_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 120)); }

  // 12. user_patterns
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          patternType: 'WORK_SCHEDULE',
          patternData: { startTime: '08:00', endTime: '17:00' },
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 120)); }

  // 13. user_ai_patterns
  try {
    const cnt = await prisma.user_ai_patterns.count();
    if (cnt === 0) {
      await prisma.user_ai_patterns.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          patternType: 'PREFERENCE',
          data: { preferMorning: true },
          confidence: 0.9,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_ai_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_ai_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_ai_patterns:', e.message.slice(0, 120)); }

  // 14. user_permissions
  try {
    const cnt = await prisma.user_permissions.count();
    if (cnt === 0) {
      await prisma.user_permissions.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          permission: 'ADMIN',
          resource: '*',
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_permissions: 1');
      created += 1;
    } else console.log('⏭️ user_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_permissions:', e.message.slice(0, 120)); }

  // 15. user_relations
  try {
    const cnt = await prisma.user_relations.count();
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (users.length >= 2) {
        await prisma.user_relations.create({
          data: {
            id: crypto.randomUUID(),
            sourceUserId: users[0].id,
            targetUserId: users[1].id,
            relationType: 'MANAGER',
            organizationId: ORG_ID
          }
        });
        console.log('✅ user_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ user_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_relations:', e.message.slice(0, 120)); }

  // 16. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'LIST',
          preferences: { sortBy: 'date' },
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_view_preferences: 1');
      created += 1;
    } else console.log('⏭️ user_view_preferences: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 120)); }

  // 17. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          viewName: 'Tasks',
          accessCount: 100,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 120)); }

  // 18. stream_permissions
  try {
    const cnt = await prisma.stream_permissions.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_permissions.create({
          data: {
            id: crypto.randomUUID(),
            streamId: streams[0].id,
            userId: USER_ID,
            permission: 'ADMIN',
            updatedAt: NOW
          }
        });
        console.log('✅ stream_permissions: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_permissions:', e.message.slice(0, 120)); }

  // 19. stream_access_logs
  try {
    const cnt = await prisma.stream_access_logs.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_access_logs.create({
          data: {
            id: crypto.randomUUID(),
            streamId: streams[0].id,
            userId: USER_ID,
            action: 'VIEW'
          }
        });
        console.log('✅ stream_access_logs: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_access_logs:', e.message.slice(0, 120)); }

  // 20. stream_relations
  try {
    const cnt = await prisma.stream_relations.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (streams.length >= 2) {
        await prisma.stream_relations.create({
          data: {
            id: crypto.randomUUID(),
            sourceStreamId: streams[0].id,
            targetStreamId: streams[1].id,
            relationType: 'RELATED'
          }
        });
        console.log('✅ stream_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_relations:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
