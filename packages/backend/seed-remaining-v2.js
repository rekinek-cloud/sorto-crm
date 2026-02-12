/**
 * Seed Remaining Tables v2 with correct structures
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Seeding remaining tables v2...\n');
  let created = 0;

  // 1. agent_proactive_tasks
  try {
    const cnt = await prisma.agent_proactive_tasks.count();
    if (cnt === 0) {
      await prisma.agent_proactive_tasks.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          taskType: 'FOLLOW_UP_REMINDER',
          title: 'Follow-up z klientem ABC',
          description: 'Minęło 14 dni od ostatniego kontaktu',
          triggerCondition: { daysSinceContact: 14 },
          status: 'PENDING'
        }
      });
      console.log('✅ agent_proactive_tasks: 1');
      created += 1;
    } else console.log('⏭️ agent_proactive_tasks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_proactive_tasks:', e.message.slice(0, 120)); }

  // 2. ai_usage_stats
  try {
    const cnt = await prisma.ai_usage_stats.count();
    if (cnt === 0) {
      await prisma.ai_usage_stats.create({
        data: {
          id: crypto.randomUUID(),
          date: NOW,
          totalExecutions: 50,
          successfulExecutions: 48,
          failedExecutions: 2,
          totalTokensUsed: 15000,
          totalCost: 0.15,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ai_usage_stats: 1');
      created += 1;
    } else console.log('⏭️ ai_usage_stats: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_usage_stats:', e.message.slice(0, 120)); }

  // 3. context_priorities
  try {
    const cnt = await prisma.context_priorities.count();
    if (cnt === 0) {
      await prisma.context_priorities.createMany({
        data: [
          { id: crypto.randomUUID(), contextName: '@computer', timeSlot: 'MORNING', dayOfWeek: 'MONDAY', priority: 1, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
          { id: crypto.randomUUID(), contextName: '@office', timeSlot: 'AFTERNOON', dayOfWeek: 'MONDAY', priority: 2, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ context_priorities: 2');
      created += 2;
    } else console.log('⏭️ context_priorities: ' + cnt + ' exist');
  } catch (e) { console.log('❌ context_priorities:', e.message.slice(0, 120)); }

  // 4. energy_patterns
  try {
    const cnt = await prisma.energy_patterns.count();
    if (cnt === 0) {
      await prisma.energy_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), timeSlot: 'MORNING', dayOfWeek: 'MONDAY', energyLevel: 'HIGH', averageEnergy: 0.9, productivityScore: 0.85, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
          { id: crypto.randomUUID(), timeSlot: 'AFTERNOON', dayOfWeek: 'MONDAY', energyLevel: 'MEDIUM', averageEnergy: 0.7, productivityScore: 0.75, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ energy_patterns: 2');
      created += 2;
    } else console.log('⏭️ energy_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_patterns:', e.message.slice(0, 120)); }

  // 5. EmailAnalysis
  try {
    const cnt = await prisma.emailAnalysis.count();
    if (cnt === 0) {
      await prisma.emailAnalysis.create({
        data: {
          id: crypto.randomUUID(),
          emailFrom: 'partner@example.com',
          emailSubject: 'Propozycja współpracy',
          emailReceived: NOW,
          categories: ['BUSINESS', 'PARTNERSHIP'],
          confidenceScore: 0.92,
          summary: 'Firma XYZ proponuje współpracę w zakresie...',
          organizationId: ORG_ID
        }
      });
      console.log('✅ EmailAnalysis: 1');
      created += 1;
    } else console.log('⏭️ EmailAnalysis: ' + cnt + ' exist');
  } catch (e) { console.log('❌ EmailAnalysis:', e.message.slice(0, 120)); }

  // 6. energy_analytics
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
            focusMinutes: 120,
            breakMinutes: 20,
            organizationId: ORG_ID,
            userId: USER_ID
          }
        });
        console.log('✅ energy_analytics: 1');
        created += 1;
      }
    } else console.log('⏭️ energy_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 120)); }

  // 7. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.create({
        data: {
          id: crypto.randomUUID(),
          date: NOW,
          metricType: 'TASKS_COMPLETED',
          value: 25,
          previousValue: 20,
          change: 5,
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ performance_metrics: 1');
      created += 1;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 120)); }

  // 8. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          action: 'LOGIN',
          resource: '/dashboard',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_access_logs: 1');
      created += 1;
    } else console.log('⏭️ user_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 120)); }

  // 9. user_patterns
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          patternType: 'WORK_HOURS',
          patternData: { start: '08:00', end: '17:00', breaks: ['12:00-13:00'] },
          confidence: 0.9,
          sampleSize: 30,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 120)); }

  // 10. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          viewName: 'Tasks Board',
          accessCount: 50,
          avgTimeSpent: 120,
          lastAccess: NOW,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 120)); }

  // 11. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          preferences: { showCompleted: false, groupBy: 'status' },
          isDefault: true,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_view_preferences: 1');
      created += 1;
    } else console.log('⏭️ user_view_preferences: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 120)); }

  // 12. stream_permissions
  try {
    const cnt = await prisma.stream_permissions.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const stream of streams) {
        await prisma.stream_permissions.create({
          data: {
            id: crypto.randomUUID(),
            streamId: stream.id,
            userId: USER_ID,
            permission: 'ADMIN',
            grantedBy: USER_ID,
            updatedAt: NOW
          }
        });
      }
      console.log('✅ stream_permissions: ' + streams.length);
      created += streams.length;
    } else console.log('⏭️ stream_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_permissions:', e.message.slice(0, 120)); }

  // 13. stream_access_logs
  try {
    const cnt = await prisma.stream_access_logs.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const stream of streams) {
        await prisma.stream_access_logs.create({
          data: {
            id: crypto.randomUUID(),
            streamId: stream.id,
            userId: USER_ID,
            action: 'VIEW',
            metadata: { source: 'dashboard' }
          }
        });
      }
      console.log('✅ stream_access_logs: ' + streams.length);
      created += streams.length;
    } else console.log('⏭️ stream_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_access_logs:', e.message.slice(0, 120)); }

  // 14. stream_relations
  try {
    const cnt = await prisma.stream_relations.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (streams.length >= 2) {
        await prisma.stream_relations.create({
          data: {
            id: crypto.randomUUID(),
            sourceStreamId: streams[0].id,
            targetStreamId: streams[1].id,
            relationType: 'PARENT',
            metadata: {}
          }
        });
        console.log('✅ stream_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_relations:', e.message.slice(0, 120)); }

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
            metadata: {},
            organizationId: ORG_ID
          }
        });
        console.log('✅ user_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ user_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_relations:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
