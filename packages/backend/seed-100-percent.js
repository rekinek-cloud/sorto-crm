/**
 * Seed to 100% - All remaining tables with correct structures
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Seeding to 100%...\n');
  let created = 0;

  // 1. email_logs (sentByUserId not userId)
  try {
    const cnt = await prisma.email_logs.count();
    if (cnt === 0) {
      await prisma.email_logs.create({
        data: {
          id: crypto.randomUUID(),
          provider: 'SMTP',
          messageId: crypto.randomUUID(),
          toAddresses: ['client@example.com'],
          subject: 'Potwierdzenie',
          success: true,
          organizationId: ORG_ID,
          sentByUserId: USER_ID
        }
      });
      console.log('✅ email_logs: 1');
      created += 1;
    } else console.log('⏭️ email_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_logs:', e.message.slice(0, 120)); }

  // 2. user_access_logs (success required)
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          action: 'LOGIN',
          accessType: 'DIRECT',
          success: true,
          dataScope: ['BASIC_INFO'],
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_access_logs: 1');
      created += 1;
    } else console.log('⏭️ user_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 120)); }

  // 3. user_ai_patterns (snake_case fields)
  try {
    const cnt = await prisma.user_ai_patterns.count();
    if (cnt === 0) {
      await prisma.user_ai_patterns.create({
        data: {
          id: crypto.randomUUID(),
          user_id: USER_ID,
          organization_id: ORG_ID,
          preferred_streams: [],
          energy_patterns: { morning: 0.9 }
        }
      });
      console.log('✅ user_ai_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_ai_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_ai_patterns:', e.message.slice(0, 120)); }

  // 4. user_patterns (specific fields)
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.create({
        data: {
          id: crypto.randomUUID(),
          patternType: 'WORK_SCHEDULE',
          patternKey: 'daily_routine',
          confidence: 0.85,
          strength: 0.9,
          successRate: 0.8,
          patternData: { startTime: '08:00' },
          learningSource: 'USER_INPUT',
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 120)); }

  // 5. stream_permissions (accessLevel, grantedById required)
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
            accessLevel: 'MANAGER',
            dataScope: ['BASIC_INFO', 'TASKS'],
            grantedById: USER_ID,
            organizationId: ORG_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ stream_permissions: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_permissions:', e.message.slice(0, 120)); }

  // 6. stream_access_logs
  try {
    const cnt = await prisma.stream_access_logs.count();
    if (cnt === 0) {
      const perms = await prisma.stream_permissions.findMany({ take: 1 });
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_access_logs.create({
          data: {
            id: crypto.randomUUID(),
            streamId: streams[0].id,
            userId: USER_ID,
            permissionId: perms[0]?.id,
            action: 'VIEW',
            success: true,
            organizationId: ORG_ID
          }
        });
        console.log('✅ stream_access_logs: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_access_logs:', e.message.slice(0, 120)); }

  // 7. stream_relations
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
            relationType: 'RELATED',
            strength: 0.8,
            createdById: USER_ID,
            organizationId: ORG_ID
          }
        });
        console.log('✅ stream_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_relations:', e.message.slice(0, 120)); }

  // 8. user_relations
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
            accessLevel: 'MANAGER',
            dataScope: ['BASIC_INFO', 'TASKS'],
            createdById: USER_ID,
            organizationId: ORG_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ user_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ user_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_relations:', e.message.slice(0, 120)); }

  // 9. user_permissions
  try {
    const cnt = await prisma.user_permissions.count();
    if (cnt === 0) {
      await prisma.user_permissions.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          permissionType: 'ADMIN',
          resource: '*',
          accessLevel: 'MANAGER',
          grantedById: USER_ID,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_permissions: 1');
      created += 1;
    } else console.log('⏭️ user_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_permissions:', e.message.slice(0, 120)); }

  // 10. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          config: { showCompleted: false },
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_view_preferences: 1');
      created += 1;
    } else console.log('⏭️ user_view_preferences: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 120)); }

  // 11. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'LIST',
          viewName: 'Contacts',
          viewCount: 50,
          avgDuration: 120,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 120)); }

  // 12. energy_analytics
  try {
    const cnt = await prisma.energy_analytics.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ take: 1 });
      if (blocks.length > 0) {
        await prisma.energy_analytics.create({
          data: {
            id: crypto.randomUUID(),
            energyTimeBlockId: blocks[0].id,
            date: NOW,
            plannedEnergy: 0.9,
            actualEnergy: 0.85,
            tasksPlanned: 5,
            tasksCompleted: 4,
            organizationId: ORG_ID,
            userId: USER_ID
          }
        });
        console.log('✅ energy_analytics: 1');
        created += 1;
      }
    } else console.log('⏭️ energy_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 120)); }

  // 13. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.create({
        data: {
          id: crypto.randomUUID(),
          date: NOW,
          metricType: 'PRODUCTIVITY',
          metricName: 'daily_score',
          value: 85,
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ performance_metrics: 1');
      created += 1;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 120)); }

  // 14. processing_rules
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      const channels = await prisma.communicationChannel.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-archive',
          priority: 1,
          conditions: { age: 30 },
          actions: { archive: true },
          isActive: true,
          channelId: channels[0]?.id,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 120)); }

  // 15. message_processing_results
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
            matched: true,
            actionsApplied: ['categorize'],
            processingTime: 50
          }
        });
        console.log('✅ MessageProcessingResult: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageProcessingResult: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
