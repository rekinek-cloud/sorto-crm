/**
 * Seed More Tables
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables...\n');
  let created = 0;

  // 1. Delegated Tasks
  try {
    const cnt = await prisma.delegated_tasks.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.delegated_tasks.create({
        data: { id: crypto.randomUUID(), description: 'Przygotować raport', delegatedTo: 'Anna Nowak', status: 'IN_PROGRESS', organizationId: ORG_ID, updatedAt: new Date() }
      });
      await prisma.delegated_tasks.create({
        data: { id: crypto.randomUUID(), description: 'Zweryfikować dane', delegatedTo: 'Piotr W.', status: 'TODO', organizationId: ORG_ID, updatedAt: new Date() }
      });
      console.log('✅ delegated_tasks: 2');
      created += 2;
    } else console.log('⏭️ delegated_tasks: skipped');
  } catch (e) { console.log('❌ delegated_tasks:', e.message.slice(0, 50)); }

  // 2. Precise Goals
  try {
    const cnt = await prisma.precise_goals.count({ where: { organization_id: ORG_ID } });
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.precise_goals.create({
        data: { id: crypto.randomUUID(), result: 'Zwiększenie sprzedaży', measurement: 'PLN', current_value: 100000, target_value: 120000, unit: 'PLN', background: 'Q1', outlet: 'Dashboard', status: 'IN_PROGRESS', deadline: new Date('2026-03-31'), stream_id: streams[0]?.id, organization_id: ORG_ID, created_by: USER_ID, updated_at: new Date() }
      });
      console.log('✅ precise_goals: 1');
      created++;
    } else console.log('⏭️ precise_goals: skipped');
  } catch (e) { console.log('❌ precise_goals:', e.message.slice(0, 50)); }

  // 3. Smart Mailboxes
  try {
    const cnt = await prisma.smart_mailboxes.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.smart_mailboxes.create({
        data: { id: crypto.randomUUID(), name: 'Pilne', description: 'Pilne emaile', color: '#ef4444', icon: 'flame', filterRules: { priority: 'HIGH' }, isSystem: false, sortOrder: 0, organizationId: ORG_ID, userId: USER_ID, updatedAt: new Date() }
      });
      await prisma.smart_mailboxes.create({
        data: { id: crypto.randomUUID(), name: 'Newsletter', description: 'Do przeczytania', color: '#3b82f6', icon: 'book', filterRules: {}, isSystem: false, sortOrder: 1, organizationId: ORG_ID, userId: USER_ID, updatedAt: new Date() }
      });
      console.log('✅ smart_mailboxes: 2');
      created += 2;
    } else console.log('⏭️ smart_mailboxes: skipped');
  } catch (e) { console.log('❌ smart_mailboxes:', e.message.slice(0, 50)); }

  // 4. Kanban Columns
  try {
    const cnt = await prisma.kanban_columns.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const cols = ['Backlog', 'Do zrobienia', 'W trakcie', 'Review', 'Ukończone'];
      for (let i = 0; i < cols.length; i++) {
        await prisma.kanban_columns.create({
          data: { id: crypto.randomUUID(), name: cols[i], color: '#6b7280', position: i, organizationId: ORG_ID, updatedAt: new Date() }
        });
      }
      console.log('✅ kanban_columns: 5');
      created += 5;
    } else console.log('⏭️ kanban_columns: skipped');
  } catch (e) { console.log('❌ kanban_columns:', e.message.slice(0, 50)); }

  // 5. Info
  try {
    const cnt = await prisma.info.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.info.create({
        data: { id: crypto.randomUUID(), title: 'Aktualizacja', content: 'System zaktualizowany.', type: 'ANNOUNCEMENT', priority: 'HIGH', isActive: true, organizationId: ORG_ID, createdBy: USER_ID, updatedAt: new Date() }
      });
      console.log('✅ info: 1');
      created++;
    } else console.log('⏭️ info: skipped');
  } catch (e) { console.log('❌ info:', e.message.slice(0, 50)); }

  // 6. taskHistory (camelCase!)
  try {
    const cnt = await prisma.taskHistory.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      for (const task of tasks) {
        await prisma.taskHistory.create({
          data: { id: crypto.randomUUID(), taskId: task.id, fieldName: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS', changedBy: USER_ID }
        });
      }
      console.log('✅ task_history: ' + tasks.length);
      created += tasks.length;
    } else console.log('⏭️ task_history: skipped');
  } catch (e) { console.log('❌ task_history:', e.message.slice(0, 50)); }

  // 7. userProfiles (camelCase!)
  try {
    const cnt = await prisma.userProfiles.count();
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID } });
      for (const user of users) {
        await prisma.userProfiles.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            energyPeaks: ['09:00', '14:00'],
            energyValleys: ['13:00'],
            energyPattern: {},
            preferredContexts: ['@computer'],
            contextTimeSlots: {},
            contextAvoidance: {},
            focusModePrefs: {},
            optimalFocusLength: {},
            focusEnergyMap: {},
            breakTypes: ['coffee'],
            workdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            organizationId: ORG_ID,
            updatedAt: new Date()
          }
        });
      }
      console.log('✅ user_profiles: ' + users.length);
      created += users.length;
    } else console.log('⏭️ user_profiles: skipped');
  } catch (e) { console.log('❌ user_profiles:', e.message.slice(0, 50)); }

  // 8. Order Items
  try {
    const cnt = await prisma.order_items.count();
    if (cnt === 0) {
      const orders = await prisma.order.findMany({ where: { organizationId: ORG_ID } });
      const products = await prisma.product.findMany({ where: { organizationId: ORG_ID } });
      let c = 0;
      for (const order of orders) {
        for (const product of products.slice(0, 2)) {
          await prisma.order_items.create({
            data: { id: crypto.randomUUID(), orderId: order.id, productId: product.id, name: product.name, quantity: 2, unitPrice: product.price || 100, totalPrice: (product.price || 100) * 2, organizationId: ORG_ID }
          });
          c++;
        }
      }
      console.log('✅ order_items: ' + c);
      created += c;
    } else console.log('⏭️ order_items: skipped');
  } catch (e) { console.log('❌ order_items:', e.message.slice(0, 50)); }

  // 9. Invoice Items
  try {
    const cnt = await prisma.invoice_items.count();
    if (cnt === 0) {
      const invoices = await prisma.invoice.findMany({ where: { organizationId: ORG_ID } });
      const services = await prisma.service.findMany({ where: { organizationId: ORG_ID } });
      let c = 0;
      for (const invoice of invoices) {
        for (const service of services.slice(0, 2)) {
          await prisma.invoice_items.create({
            data: { id: crypto.randomUUID(), invoiceId: invoice.id, serviceId: service.id, name: service.name, description: '', quantity: 1, unit: 'szt', unitPriceNet: service.price || 200, vatRate: 23, totalNet: service.price || 200, totalGross: (service.price || 200) * 1.23, organizationId: ORG_ID }
          });
          c++;
        }
      }
      console.log('✅ invoice_items: ' + c);
      created += c;
    } else console.log('⏭️ invoice_items: skipped');
  } catch (e) { console.log('❌ invoice_items:', e.message.slice(0, 50)); }

  // 10. Offer Items
  try {
    const cnt = await prisma.offer_items.count();
    if (cnt === 0) {
      const offers = await prisma.offer.findMany({ where: { organizationId: ORG_ID } });
      const products = await prisma.product.findMany({ where: { organizationId: ORG_ID } });
      let c = 0;
      for (const offer of offers) {
        for (const product of products.slice(0, 2)) {
          await prisma.offer_items.create({
            data: { id: crypto.randomUUID(), offerId: offer.id, productId: product.id, name: product.name, description: '', quantity: 1, unit: 'szt', unitPriceNet: product.price || 150, vatRate: 23, discount: 0, organizationId: ORG_ID }
          });
          c++;
        }
      }
      console.log('✅ offer_items: ' + c);
      created += c;
    } else console.log('⏭️ offer_items: skipped');
  } catch (e) { console.log('❌ offer_items:', e.message.slice(0, 50)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
