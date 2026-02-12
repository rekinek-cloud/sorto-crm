/**
 * Final Seed Script v2 - Complete fields
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Final seeding v2...\n');
  let created = 0;

  // 1. energy_time_blocks
  try {
    const cnt = await prisma.energy_time_blocks.count();
    if (cnt === 0) {
      await prisma.energy_time_blocks.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Poranek - wysoka energia', startTime: '09:00', endTime: '12:00', energyLevel: 'HIGH', primaryContext: '@computer', organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
          { id: crypto.randomUUID(), name: 'Popołudnie - średnia energia', startTime: '14:00', endTime: '17:00', energyLevel: 'MEDIUM', primaryContext: '@office', organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ energy_time_blocks: 2');
      created += 2;
    } else console.log('⏭️ energy_time_blocks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_time_blocks:', e.message.slice(0, 120)); }

  // 2. break_templates
  try {
    const cnt = await prisma.break_templates.count();
    if (cnt === 0) {
      await prisma.break_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Przerwa na kawę', duration: 10, breakType: 'COFFEE', description: 'Krótka przerwa', organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
          { id: crypto.randomUUID(), name: 'Spacer', duration: 15, breakType: 'WALK', description: 'Spacer po biurze', organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
          { id: crypto.randomUUID(), name: 'Lunch', duration: 45, breakType: 'MEAL', description: 'Przerwa obiadowa', organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ break_templates: 3');
      created += 3;
    } else console.log('⏭️ break_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ break_templates:', e.message.slice(0, 120)); }

  // 3. energy_patterns
  try {
    const cnt = await prisma.energy_patterns.count();
    if (cnt === 0) {
      await prisma.energy_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), date: NOW, dayOfWeek: 'MONDAY', hourlyData: { '09': 0.9, '10': 0.95 }, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ energy_patterns: 1');
      created += 1;
    } else console.log('⏭️ energy_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_patterns:', e.message.slice(0, 120)); }

  // 4. energy_analytics (uses energy_time_blocks)
  try {
    const cnt = await prisma.energy_analytics.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ take: 1 });
      if (blocks.length > 0) {
        await prisma.energy_analytics.create({
          data: { id: crypto.randomUUID(), date: NOW, energyTimeBlockId: blocks[0].id, actualEnergy: 0.85, plannedEnergy: 0.9, tasksCompleted: 5, organizationId: ORG_ID, userId: USER_ID }
        });
        console.log('✅ energy_analytics: 1');
        created += 1;
      }
    } else console.log('⏭️ energy_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 120)); }

  // 5. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.createMany({
        data: [
          { id: crypto.randomUUID(), date: NOW, metricType: 'TASKS_COMPLETED', value: 25, organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ performance_metrics: 1');
      created += 1;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 120)); }

  // 6. scheduled_tasks (uses energy_time_blocks)
  try {
    const cnt = await prisma.scheduled_tasks.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ take: 1 });
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (blocks.length > 0) {
        for (const task of tasks) {
          await prisma.scheduled_tasks.create({
            data: {
              id: crypto.randomUUID(),
              title: task.title || 'Zaplanowane zadanie',
              estimatedMinutes: 60,
              taskId: task.id,
              energyTimeBlockId: blocks[0].id,
              context: '@computer',
              energyRequired: 'MEDIUM',
              scheduledDate: NOW,
              organizationId: ORG_ID,
              userId: USER_ID,
              updatedAt: NOW
            }
          });
        }
        console.log('✅ scheduled_tasks: ' + tasks.length);
        created += tasks.length;
      }
    } else console.log('⏭️ scheduled_tasks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ scheduled_tasks:', e.message.slice(0, 120)); }

  // 7. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, action: 'LOGIN', resource: '/dashboard', organizationId: ORG_ID },
        ]
      });
      console.log('✅ user_access_logs: 1');
      created += 1;
    } else console.log('⏭️ user_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 120)); }

  // 8. user_patterns
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, patternType: 'WORK_HOURS', data: { start: '08:00' }, organizationId: ORG_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 120)); }

  // 9. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', viewName: 'Tasks', organizationId: ORG_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 120)); }

  // 10. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', preferences: {}, organizationId: ORG_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ user_view_preferences: 1');
      created += 1;
    } else console.log('⏭️ user_view_preferences: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 120)); }

  // 11. stream_permissions
  try {
    const cnt = await prisma.stream_permissions.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const stream of streams) {
        await prisma.stream_permissions.create({
          data: { id: crypto.randomUUID(), streamId: stream.id, userId: USER_ID, permission: 'ADMIN', updatedAt: NOW }
        });
      }
      console.log('✅ stream_permissions: ' + streams.length);
      created += streams.length;
    } else console.log('⏭️ stream_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_permissions:', e.message.slice(0, 120)); }

  // 12. stream_access_logs
  try {
    const cnt = await prisma.stream_access_logs.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_access_logs.create({
          data: { id: crypto.randomUUID(), streamId: streams[0].id, userId: USER_ID, action: 'VIEW' }
        });
        console.log('✅ stream_access_logs: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_access_logs:', e.message.slice(0, 120)); }

  // 13. stream_relations
  try {
    const cnt = await prisma.stream_relations.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (streams.length >= 2) {
        await prisma.stream_relations.create({
          data: { id: crypto.randomUUID(), sourceStreamId: streams[0].id, targetStreamId: streams[1].id, relationType: 'PARENT' }
        });
        console.log('✅ stream_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_relations:', e.message.slice(0, 120)); }

  // 14. user_relations
  try {
    const cnt = await prisma.user_relations.count();
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (users.length >= 2) {
        await prisma.user_relations.create({
          data: { id: crypto.randomUUID(), sourceUserId: users[0].id, targetUserId: users[1].id, relationType: 'MANAGER', organizationId: ORG_ID }
        });
        console.log('✅ user_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ user_relations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_relations:', e.message.slice(0, 120)); }

  // 15. user_permissions
  try {
    const cnt = await prisma.user_permissions.count();
    if (cnt === 0) {
      await prisma.user_permissions.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, permission: 'ADMIN', resource: '*', organizationId: ORG_ID },
        ]
      });
      console.log('✅ user_permissions: 1');
      created += 1;
    } else console.log('⏭️ user_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_permissions:', e.message.slice(0, 120)); }

  // 16. context_priorities
  try {
    const cnt = await prisma.context_priorities.count();
    if (cnt === 0) {
      const contexts = await prisma.context.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      for (let i = 0; i < contexts.length; i++) {
        await prisma.context_priorities.create({
          data: { id: crypto.randomUUID(), contextId: contexts[i].id, priority: i + 1, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW }
        });
      }
      console.log('✅ context_priorities: ' + contexts.length);
      created += contexts.length;
    } else console.log('⏭️ context_priorities: ' + cnt + ' exist');
  } catch (e) { console.log('❌ context_priorities:', e.message.slice(0, 120)); }

  // 17. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Auto-tag pilne', conditions: { subject: 'pilne' }, actions: { addLabel: 'urgent' }, organizationId: ORG_ID, userId: USER_ID, updatedAt: NOW },
        ]
      });
      console.log('✅ email_rules: 1');
      created += 1;
    } else console.log('⏭️ email_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 120)); }

  // 18. email_logs
  try {
    const cnt = await prisma.email_logs.count();
    if (cnt === 0) {
      await prisma.email_logs.createMany({
        data: [
          { id: crypto.randomUUID(), action: 'SENT', subject: 'Test email', recipient: 'test@example.com', status: 'SUCCESS', organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ email_logs: 1');
      created += 1;
    } else console.log('⏭️ email_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_logs:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
