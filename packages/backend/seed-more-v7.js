/**
 * Seed More Tables - Part 7 (with correct fields)
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables (Part 7)...\n');
  let created = 0;

  // 1. email_accounts (all required fields)
  try {
    const cnt = await prisma.email_accounts.count();
    if (cnt === 0) {
      await prisma.email_accounts.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Główne konto',
          email: 'kontakt@firma.pl',
          provider: 'GMAIL',
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          imapUsername: 'kontakt@firma.pl',
          imapPassword: 'xxx',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUsername: 'kontakt@firma.pl',
          smtpPassword: 'xxx',
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ email_accounts: 1');
      created += 1;
    } else console.log('⏭️ email_accounts: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_accounts:', e.message.slice(0, 100)); }

  // 2. day_templates
  try {
    const cnt = await prisma.day_templates.count();
    if (cnt === 0) {
      await prisma.day_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Dzień produktywny', description: 'Szablon dla dni skupienia', templateType: 'CUSTOM', dayIntensity: 'HIGH', focusStyle: 'DEEP', timeBlocks: [], userId: USER_ID, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() },
          { id: crypto.randomUUID(), name: 'Dzień spotkań', description: 'Szablon dla dni ze spotkaniami', templateType: 'CUSTOM', dayIntensity: 'MEDIUM', focusStyle: 'MIXED', timeBlocks: [], userId: USER_ID, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ day_templates: 2');
      created += 2;
    } else console.log('⏭️ day_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ day_templates:', e.message.slice(0, 100)); }

  // 3. energy_time_blocks first (needed by scheduled_tasks)
  try {
    const cnt = await prisma.energy_time_blocks.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.energy_time_blocks.createMany({
        data: [
          { id: crypto.randomUUID(), startTime: '09:00', endTime: '12:00', energyLevel: 'HIGH', blockType: 'FOCUS', organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
          { id: crypto.randomUUID(), startTime: '14:00', endTime: '17:00', energyLevel: 'MEDIUM', blockType: 'WORK', organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ energy_time_blocks: 2');
      created += 2;
    } else console.log('⏭️ energy_time_blocks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_time_blocks:', e.message.slice(0, 100)); }

  // 4. scheduled_tasks
  try {
    const cnt = await prisma.scheduled_tasks.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ where: { organizationId: ORG_ID }, take: 1 });
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
              priority: 'MEDIUM',
              status: 'PLANNED',
              scheduledDate: new Date(),
              organizationId: ORG_ID,
              userId: USER_ID
            }
          });
        }
        console.log('✅ scheduled_tasks: ' + tasks.length);
        created += tasks.length;
      }
    } else console.log('⏭️ scheduled_tasks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ scheduled_tasks:', e.message.slice(0, 100)); }

  // 5. break_templates
  try {
    const cnt = await prisma.break_templates.count();
    if (cnt === 0) {
      await prisma.break_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Kawa', description: 'Przerwa na kawę', durationMinutes: 10, breakType: 'REFRESHMENT', activities: ['coffee'], isActive: true, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
          { id: crypto.randomUUID(), name: 'Spacer', description: 'Krótki spacer', durationMinutes: 15, breakType: 'EXERCISE', activities: ['walk'], isActive: true, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ break_templates: 2');
      created += 2;
    } else console.log('⏭️ break_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ break_templates:', e.message.slice(0, 100)); }

  // 6. energy_patterns
  try {
    const cnt = await prisma.energy_patterns.count();
    if (cnt === 0) {
      await prisma.energy_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), date: new Date(), dayOfWeek: 'MONDAY', hourlyData: { '09': 0.9, '10': 0.95 }, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date() },
        ]
      });
      console.log('✅ energy_patterns: 1');
      created += 1;
    } else console.log('⏭️ energy_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_patterns:', e.message.slice(0, 100)); }

  // 7. energy_analytics
  try {
    const cnt = await prisma.energy_analytics.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.energy_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), date: new Date(), avgEnergy: 0.75, peakHours: ['09', '10', '14'], lowHours: ['13', '17'], focusScore: 85, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date() },
        ]
      });
      console.log('✅ energy_analytics: 1');
      created += 1;
    } else console.log('⏭️ energy_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 100)); }

  // 8. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.createMany({
        data: [
          { id: crypto.randomUUID(), date: new Date(), metricType: 'TASKS_COMPLETED', value: 25, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date() },
          { id: crypto.randomUUID(), date: new Date(), metricType: 'FOCUS_TIME', value: 180, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date() },
        ]
      });
      console.log('✅ performance_metrics: 2');
      created += 2;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 100)); }

  // 9. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.user_access_logs.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, action: 'LOGIN', resource: '/dashboard', ipAddress: '192.168.1.1', organizationId: ORG_ID, createdAt: new Date() },
          { id: crypto.randomUUID(), userId: USER_ID, action: 'VIEW', resource: '/tasks', ipAddress: '192.168.1.1', organizationId: ORG_ID, createdAt: new Date() },
        ]
      });
      console.log('✅ user_access_logs: 2');
      created += 2;
    } else console.log('⏭️ user_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 100)); }

  // 10. user_patterns
  try {
    const cnt = await prisma.user_patterns.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.user_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, patternType: 'WORK_HOURS', data: { start: '08:00', end: '17:00' }, confidence: 0.9, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 100)); }

  // 11. user_ai_patterns
  try {
    const cnt = await prisma.user_ai_patterns.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.user_ai_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, patternType: 'TASK_PREFERENCE', data: { preferMorning: true }, confidence: 0.85, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ user_ai_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_ai_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_ai_patterns:', e.message.slice(0, 100)); }

  // 12. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', viewName: 'Tasks', accessCount: 50, avgTimeSpent: 120, lastAccess: new Date(), createdAt: new Date() },
        ]
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 100)); }

  // 13. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', preferences: { showCompleted: false }, isDefault: true, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ user_view_preferences: 1');
      created += 1;
    } else console.log('⏭️ user_view_preferences: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 100)); }

  // 14. stream_channels
  try {
    const cnt = await prisma.stream_channels.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const stream of streams) {
        await prisma.stream_channels.create({
          data: { id: crypto.randomUUID(), name: 'Główny kanał', streamId: stream.id, channelType: 'GENERAL', isActive: true, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log('✅ stream_channels: ' + streams.length);
      created += streams.length;
    } else console.log('⏭️ stream_channels: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_channels:', e.message.slice(0, 100)); }

  // 15. stream_permissions
  try {
    const cnt = await prisma.stream_permissions.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_permissions.create({
          data: { id: crypto.randomUUID(), streamId: streams[0].id, userId: USER_ID, permission: 'ADMIN', createdAt: new Date() }
        });
        console.log('✅ stream_permissions: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_permissions:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
