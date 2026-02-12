/**
 * Seed More Tables - Part 6
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables (Part 6)...\n');
  let created = 0;

  // 1. user_profiles
  try {
    const cnt = await prisma.user_profiles.count();
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID } });
      for (const user of users) {
        await prisma.user_profiles.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            organizationId: ORG_ID,
            energyPeaks: ['09:00', '14:00'],
            energyValleys: ['13:00'],
            workStartTime: '08:00',
            workEndTime: '17:00',
            updatedAt: new Date()
          }
        });
      }
      console.log('✅ user_profiles: ' + users.length);
      created += users.length;
    } else console.log('⏭️ user_profiles: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_profiles:', e.message.slice(0, 100)); }

  // 2. Order
  try {
    const cnt = await prisma.order.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.order.createMany({
        data: [
          { id: crypto.randomUUID(), orderNumber: 'ORD-2024-001', title: 'Zamówienie laptopów', customer: 'ABC Sp. z o.o.', status: 'PENDING', priority: 'HIGH', value: 15000, currency: 'PLN', organizationId: ORG_ID },
          { id: crypto.randomUUID(), orderNumber: 'ORD-2024-002', title: 'Zamówienie monitorów', customer: 'XYZ S.A.', status: 'IN_PROGRESS', priority: 'MEDIUM', value: 8000, currency: 'PLN', organizationId: ORG_ID },
        ]
      });
      console.log('✅ Order: 2');
      created += 2;
    } else console.log('⏭️ Order: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Order:', e.message.slice(0, 100)); }

  // 3. OrderItem (after orders exist)
  try {
    const cnt = await prisma.orderItem.count();
    if (cnt === 0) {
      const orders = await prisma.order.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      const products = await prisma.product.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const order of orders) {
        for (const product of products) {
          await prisma.orderItem.create({
            data: {
              id: crypto.randomUUID(),
              orderId: order.id,
              productId: product.id,
              quantity: 2,
              unitPrice: product.price || 100,
              totalPrice: (product.price || 100) * 2
            }
          });
          c++;
        }
      }
      console.log('✅ OrderItem: ' + c);
      created += c;
    } else console.log('⏭️ OrderItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ OrderItem:', e.message.slice(0, 100)); }

  // 4. precise_goals
  try {
    const cnt = await prisma.precise_goals.count({ where: { organization_id: ORG_ID } });
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.precise_goals.createMany({
        data: [
          { id: crypto.randomUUID(), result: 'Zwiększenie sprzedaży', measurement: 'Przychód w PLN', current_value: 100000, target_value: 150000, unit: 'PLN', deadline: new Date('2024-12-31'), organization_id: ORG_ID, created_by_id: USER_ID, stream_id: streams[0]?.id },
          { id: crypto.randomUUID(), result: 'Pozyskanie nowych klientów', measurement: 'Liczba klientów', current_value: 50, target_value: 100, unit: 'szt', deadline: new Date('2024-12-31'), organization_id: ORG_ID, created_by_id: USER_ID },
        ]
      });
      console.log('✅ precise_goals: 2');
      created += 2;
    } else console.log('⏭️ precise_goals: ' + cnt + ' exist');
  } catch (e) { console.log('❌ precise_goals:', e.message.slice(0, 100)); }

  // 5. bug_reports
  try {
    const cnt = await prisma.bug_reports.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.bug_reports.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Błąd zapisu formularza', description: 'Formularz nie zapisuje danych kontaktu', priority: 'HIGH', status: 'OPEN', reporterId: USER_ID, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() },
          { id: crypto.randomUUID(), title: 'Problem z wyświetlaniem', description: 'Tabela nie ładuje się poprawnie na mobile', priority: 'MEDIUM', status: 'IN_PROGRESS', reporterId: USER_ID, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ bug_reports: 2');
      created += 2;
    } else console.log('⏭️ bug_reports: ' + cnt + ' exist');
  } catch (e) { console.log('❌ bug_reports:', e.message.slice(0, 100)); }

  // 6. email_accounts
  try {
    const cnt = await prisma.email_accounts.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.email_accounts.createMany({
        data: [
          { id: crypto.randomUUID(), email: 'kontakt@firma.pl', provider: 'GOOGLE', isActive: true, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ email_accounts: 1');
      created += 1;
    } else console.log('⏭️ email_accounts: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_accounts:', e.message.slice(0, 100)); }

  // 7. email_rules
  try {
    const cnt = await prisma.email_rules.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.email_rules.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Auto-tag pilne', conditions: { subject: 'pilne' }, actions: { addLabel: 'urgent' }, isActive: true, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ email_rules: 1');
      created += 1;
    } else console.log('⏭️ email_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 100)); }

  // 8. context_priorities
  try {
    const cnt = await prisma.context_priorities.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const contexts = await prisma.context.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      let c = 0;
      for (let i = 0; i < contexts.length; i++) {
        await prisma.context_priorities.create({
          data: { id: crypto.randomUUID(), contextId: contexts[i].id, priority: i + 1, timeOfDay: 'MORNING', organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }
        });
        c++;
      }
      console.log('✅ context_priorities: ' + c);
      created += c;
    } else console.log('⏭️ context_priorities: ' + cnt + ' exist');
  } catch (e) { console.log('❌ context_priorities:', e.message.slice(0, 100)); }

  // 9. day_templates
  try {
    const cnt = await prisma.day_templates.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.day_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Dzień produktywny', description: 'Szablon dla dni skupienia', blocks: [{ start: '09:00', end: '12:00', type: 'FOCUS' }], isDefault: true, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
          { id: crypto.randomUUID(), name: 'Dzień spotkań', description: 'Szablon dla dni ze spotkaniami', blocks: [{ start: '10:00', end: '16:00', type: 'MEETINGS' }], isDefault: false, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ day_templates: 2');
      created += 2;
    } else console.log('⏭️ day_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ day_templates:', e.message.slice(0, 100)); }

  // 10. break_templates
  try {
    const cnt = await prisma.break_templates.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.break_templates.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Kawa', description: 'Krótka przerwa na kawę', duration: 10, activityType: 'REFRESHMENT', organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
          { id: crypto.randomUUID(), name: 'Spacer', description: 'Spacer na świeżym powietrzu', duration: 15, activityType: 'EXERCISE', organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ break_templates: 2');
      created += 2;
    } else console.log('⏭️ break_templates: ' + cnt + ' exist');
  } catch (e) { console.log('❌ break_templates:', e.message.slice(0, 100)); }

  // 11. energy_patterns
  try {
    const cnt = await prisma.energy_patterns.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.energy_patterns.createMany({
        data: [
          { id: crypto.randomUUID(), dayOfWeek: 'MONDAY', hourlyPattern: { '09': 0.9, '10': 0.95, '14': 0.7, '15': 0.8 }, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() },
        ]
      });
      console.log('✅ energy_patterns: 1');
      created += 1;
    } else console.log('⏭️ energy_patterns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ energy_patterns:', e.message.slice(0, 100)); }

  // 12. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.performance_metrics.createMany({
        data: [
          { id: crypto.randomUUID(), metricType: 'TASKS_COMPLETED', value: 25, date: new Date(), organizationId: ORG_ID, userId: USER_ID, createdAt: new Date() },
          { id: crypto.randomUUID(), metricType: 'FOCUS_TIME', value: 180, date: new Date(), organizationId: ORG_ID, userId: USER_ID, createdAt: new Date() },
        ]
      });
      console.log('✅ performance_metrics: 2');
      created += 2;
    } else console.log('⏭️ performance_metrics: ' + cnt + ' exist');
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 100)); }

  // 13. user_permissions
  try {
    const cnt = await prisma.user_permissions.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.user_permissions.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, permission: 'ADMIN', resource: '*', organizationId: ORG_ID, createdAt: new Date() },
        ]
      });
      console.log('✅ user_permissions: 1');
      created += 1;
    } else console.log('⏭️ user_permissions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ user_permissions:', e.message.slice(0, 100)); }

  // 14. organization_branding
  try {
    const cnt = await prisma.organization_branding.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.organization_branding.create({
        data: { id: crypto.randomUUID(), organizationId: ORG_ID, primaryColor: '#3B82F6', secondaryColor: '#10B981', logoUrl: '/logo.png', createdAt: new Date(), updatedAt: new Date() }
      });
      console.log('✅ organization_branding: 1');
      created += 1;
    } else console.log('⏭️ organization_branding: ' + cnt + ' exist');
  } catch (e) { console.log('❌ organization_branding:', e.message.slice(0, 100)); }

  // 15. scheduled_tasks
  try {
    const cnt = await prisma.scheduled_tasks.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      let c = 0;
      for (const task of tasks) {
        await prisma.scheduled_tasks.create({
          data: { id: crypto.randomUUID(), taskId: task.id, scheduledFor: new Date(), duration: 60, organizationId: ORG_ID, userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }
        });
        c++;
      }
      console.log('✅ scheduled_tasks: ' + c);
      created += c;
    } else console.log('⏭️ scheduled_tasks: ' + cnt + ' exist');
  } catch (e) { console.log('❌ scheduled_tasks:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
