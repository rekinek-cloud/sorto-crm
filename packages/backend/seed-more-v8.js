/**
 * Seed More Tables - Part 8 (with updatedAt)
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Seeding more tables (Part 8)...\n');
  let created = 0;

  // 1. email_accounts
  try {
    const cnt = await prisma.email_accounts.count();
    if (cnt === 0) {
      await prisma.email_accounts.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Główne konto firmowe',
          email: 'kontakt@firma.pl',
          provider: 'GMAIL',
          imapHost: 'imap.gmail.com',
          imapUsername: 'kontakt@firma.pl',
          imapPassword: 'xxx',
          smtpHost: 'smtp.gmail.com',
          smtpUsername: 'kontakt@firma.pl',
          smtpPassword: 'xxx',
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ email_accounts: 1');
      created += 1;
    } else console.log('⏭️ email_accounts: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_accounts:', e.message.slice(0, 120)); }

  // 2. day_templates
  try {
    const cnt = await prisma.day_templates.count();
    if (cnt === 0) {
      await prisma.day_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Dzień produktywny', userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
          { id: crypto.randomUUID(), name: 'Dzień spotkań', userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ day_templates: 2');
      created += 2;
    } else console.log('⏭️ day_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ day_templates:', e.message.slice(0, 120)); }

  // 3. energy_time_blocks
  try {
    const cnt = await prisma.energy_time_blocks.count();
    if (cnt === 0) {
      await prisma.energy_time_blocks.createMany({
        data: [
          { id: crypto.randomUUID(), startTime: '09:00', endTime: '12:00', energyLevel: 'HIGH', blockType: 'FOCUS', userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
          { id: crypto.randomUUID(), startTime: '14:00', endTime: '17:00', energyLevel: 'MEDIUM', blockType: 'WORK', userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ energy_time_blocks: 2');
      created += 2;
    } else console.log('⏭️ energy_time_blocks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_time_blocks:', e.message.slice(0, 120)); }

  // 4. break_templates
  try {
    const cnt = await prisma.break_templates.count();
    if (cnt === 0) {
      await prisma.break_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Kawa', durationMinutes: 10, breakType: 'REFRESHMENT', userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
          { id: crypto.randomUUID(), name: 'Spacer', durationMinutes: 15, breakType: 'EXERCISE', userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ break_templates: 2');
      created += 2;
    } else console.log('⏭️ break_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ break_templates:', e.message.slice(0, 120)); }

  // 5. energy_patterns
  try {
    const cnt = await prisma.energy_patterns.count();
    if (cnt === 0) {
      await prisma.energy_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), date: NOW, dayOfWeek: 'MONDAY', hourlyData: { '09': 0.9, '10': 0.95 }, userId: USER_ID, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ energy_patterns: 1');
      created += 1;
    } else console.log('⏭️ energy_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_patterns:', e.message.slice(0, 120)); }

  // 6. energy_analytics
  try {
    const cnt = await prisma.energy_analytics.count();
    if (cnt === 0) {
      await prisma.energy_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), date: NOW, avgEnergy: 0.75, peakHours: ['09', '10'], lowHours: ['13'], userId: USER_ID, organizationId: ORG_ID, createdAt: NOW },
        ]
      });
      console.log('✅ energy_analytics: 1');
      created += 1;
    } else console.log('⏭️ energy_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 120)); }

  // 7. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.createMany({
        data: [
          { id: crypto.randomUUID(), date: NOW, metricType: 'TASKS_COMPLETED', value: 25, userId: USER_ID, organizationId: ORG_ID, createdAt: NOW },
        ]
      });
      console.log('✅ performance_metrics: 1');
      created += 1;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 120)); }

  // 8. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, action: 'LOGIN', resource: '/dashboard', organizationId: ORG_ID, createdAt: NOW },
        ]
      });
      console.log('✅ user_access_logs: 1');
      created += 1;
    } else console.log('⏭️ user_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 120)); }

  // 9. user_patterns
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, patternType: 'WORK_HOURS', data: { start: '08:00' }, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 120)); }

  // 10. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', viewName: 'Tasks', organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 120)); }

  // 11. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', preferences: {}, organizationId: ORG_ID, createdAt: NOW, updatedAt: NOW },
        ]
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
          data: { id: crypto.randomUUID(), streamId: stream.id, userId: USER_ID, permission: 'ADMIN', createdAt: NOW, updatedAt: NOW }
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
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_access_logs.create({
          data: { id: crypto.randomUUID(), streamId: streams[0].id, userId: USER_ID, action: 'VIEW', createdAt: NOW }
        });
        console.log('✅ stream_access_logs: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_access_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ stream_access_logs:', e.message.slice(0, 120)); }

  // 14. stream_relations
  try {
    const cnt = await prisma.stream_relations.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (streams.length >= 2) {
        await prisma.stream_relations.create({
          data: { id: crypto.randomUUID(), sourceStreamId: streams[0].id, targetStreamId: streams[1].id, relationType: 'PARENT', createdAt: NOW }
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
          data: { id: crypto.randomUUID(), sourceUserId: users[0].id, targetUserId: users[1].id, relationType: 'MANAGER', organizationId: ORG_ID, createdAt: NOW }
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
