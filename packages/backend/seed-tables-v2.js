/**
 * Seed Missing Tables Script v2
 * Wypełnia puste tabele zgodnie z rzeczywistą strukturą
 * Run: node seed-tables-v2.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

const stats = { created: 0, skipped: 0, errors: 0 };

function uuid() { return crypto.randomUUID(); }

/**
 * Seed Timeline
 */
async function seedTimeline() {
  console.log('\n📊 Seeding TIMELINE...');
  const count = await prisma.timeline.count({ where: { organizationId: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 3 });

  const entries = [
    { eventId: 'evt-001', eventType: 'TASK', title: 'Sprint Planning Q1', status: 'COMPLETED' },
    { eventId: 'evt-002', eventType: 'MEETING', title: 'Spotkanie z klientem ABC', status: 'SCHEDULED' },
    { eventId: 'evt-003', eventType: 'DEADLINE', title: 'Deadline projektu CRM', status: 'SCHEDULED' },
    { eventId: 'evt-004', eventType: 'MILESTONE', title: 'Wdrożenie v1.0', status: 'IN_PROGRESS' },
  ];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    await prisma.timeline.create({
      data: {
        id: uuid(),
        eventId: entry.eventId,
        eventType: entry.eventType,
        title: entry.title,
        status: entry.status,
        startDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        streamId: streams[i % streams.length]?.id || null,
        organizationId: ORG_ID,
        updatedAt: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${entries.length} timeline entries`);
}

/**
 * Seed AI Prompt Templates
 */
async function seedAIPromptTemplates() {
  console.log('\n🤖 Seeding AI_PROMPT_TEMPLATES...');
  const count = await prisma.ai_prompt_templates.count({ where: { organizationId: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const templates = [
    { code: 'TASK_SUMMARY', name: 'Podsumowanie zadania', category: 'TASK', template: 'Przeanalizuj zadanie: {{title}}.', variables: '["title","description"]', isActive: true, version: 1 },
    { code: 'EMAIL_REPLY', name: 'Sugestia odpowiedzi', category: 'EMAIL', template: 'Odpowiedz na email od {{sender}}.', variables: '["sender","subject"]', isActive: true, version: 1 },
    { code: 'DEAL_ANALYSIS', name: 'Analiza deal', category: 'CRM', template: 'Przeanalizuj deal {{name}}.', variables: '["name","value"]', isActive: true, version: 1 },
    { code: 'GTD_CLASSIFY', name: 'Klasyfikacja GTD', category: 'GTD', template: 'Sklasyfikuj: {{content}}.', variables: '["content"]', isActive: true, version: 1 },
  ];

  for (const tpl of templates) {
    await prisma.ai_prompt_templates.create({
      data: { id: uuid(), ...tpl, organizationId: ORG_ID, createdAt: new Date(), updatedAt: new Date() }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${templates.length} prompt templates`);
}

/**
 * Seed Task History
 */
async function seedTaskHistory() {
  console.log('\n📜 Seeding TASK_HISTORY...');
  const count = await prisma.task_history.count();
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID } });
  if (tasks.length === 0) { console.log(`   ⚠️  No tasks`); return; }

  const changes = [
    { fieldName: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
    { fieldName: 'priority', oldValue: 'MEDIUM', newValue: 'HIGH' },
    { fieldName: 'assignee', oldValue: null, newValue: 'Jan Kowalski' },
  ];

  let created = 0;
  for (const task of tasks) {
    for (const change of changes) {
      await prisma.task_history.create({
        data: {
          id: uuid(),
          taskId: task.id,
          fieldName: change.fieldName,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: USER_ID,
          changeDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
      created++;
    }
  }
  stats.created += created;
  console.log(`   ✅ Created ${created} task history entries`);
}

/**
 * Seed Delegated Tasks
 */
async function seedDelegatedTasks() {
  console.log('\n🔄 Seeding DELEGATED_TASKS...');
  const count = await prisma.delegated_tasks.count({ where: { organizationId: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const items = [
    { description: 'Przygotować prezentację kwartalną', delegatedTo: 'Anna Nowak', status: 'IN_PROGRESS' },
    { description: 'Zweryfikować dane klientów', delegatedTo: 'Piotr Wiśniewski', status: 'TODO' },
    { description: 'Aktualizacja dokumentacji API', delegatedTo: 'Marta Kowalczyk', status: 'DONE' },
  ];

  for (const item of items) {
    await prisma.delegated_tasks.create({
      data: {
        id: uuid(),
        description: item.description,
        delegatedTo: item.delegatedTo,
        status: item.status,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organizationId: ORG_ID,
        updatedAt: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${items.length} delegated tasks`);
}

/**
 * Seed User Profiles
 */
async function seedUserProfiles() {
  console.log('\n👤 Seeding USER_PROFILES...');
  const count = await prisma.user_profiles.count();
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const users = await prisma.user.findMany({ where: { organizationId: ORG_ID } });

  for (const user of users) {
    await prisma.user_profiles.create({
      data: {
        id: uuid(),
        userId: user.id,
        energyPeaks: ['09:00', '14:00'],
        energyValleys: ['13:00', '16:00'],
        energyPattern: { morning: 'HIGH', afternoon: 'MEDIUM', evening: 'LOW' },
        preferredContexts: ['@computer', '@calls'],
        contextTimeSlots: { '@computer': '08:00-12:00', '@calls': '14:00-16:00' },
        contextAvoidance: { '@admin': ['morning'] },
        focusModePrefs: { deepWork: true, pomodoro: false },
        optimalFocusLength: { min: 25, max: 90 },
        focusEnergyMap: { HIGH: 90, MEDIUM: 45, LOW: 25 },
        breakFrequency: 90,
        breakDuration: 15,
        breakTypes: ['coffee', 'walk', 'stretch'],
        lunchTime: '12:30',
        lunchDuration: 45,
        workStartTime: '08:00',
        workEndTime: '17:00',
        workdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        organizationId: ORG_ID,
        updatedAt: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${users.length} user profiles`);
}

/**
 * Seed Precise Goals
 */
async function seedPreciseGoals() {
  console.log('\n🎯 Seeding PRECISE_GOALS...');
  const count = await prisma.precise_goals.count({ where: { organization_id: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 3 });

  const goals = [
    { result: 'Zwiększenie sprzedaży o 20%', measurement: 'Przychód miesięczny', current_value: 100000, target_value: 120000, unit: 'PLN', background: 'Cel Q1', outlet: 'Dashboard' },
    { result: 'Pozyskanie 50 nowych klientów', measurement: 'Liczba klientów', current_value: 15, target_value: 50, unit: 'klientów', background: 'Ekspansja', outlet: 'CRM' },
    { result: 'Wdrożenie CRM', measurement: '% ukończenia', current_value: 60, target_value: 100, unit: '%', background: 'Transformacja', outlet: 'Raport' },
  ];

  for (let i = 0; i < goals.length; i++) {
    await prisma.precise_goals.create({
      data: {
        id: uuid(),
        ...goals[i],
        status: i === 2 ? 'COMPLETED' : 'IN_PROGRESS',
        deadline: new Date(Date.now() + (30 + i * 30) * 24 * 60 * 60 * 1000),
        stream_id: streams[i % streams.length]?.id,
        organization_id: ORG_ID,
        created_by: USER_ID,
        updated_at: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${goals.length} precise goals`);
}

/**
 * Seed Smart Mailboxes
 */
async function seedSmartMailboxes() {
  console.log('\n📬 Seeding SMART_MAILBOXES...');
  const count = await prisma.smart_mailboxes.count({ where: { organizationId: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const mailboxes = [
    { name: 'Pilne', description: 'Emaile pilne', color: '#ef4444', icon: 'flame', filterRules: { priority: 'HIGH' } },
    { name: 'Do przeczytania', description: 'Newslettery', color: '#3b82f6', icon: 'book', filterRules: { labels: ['newsletter'] } },
    { name: 'Oczekujące', description: 'Czekające na odpowiedź', color: '#f59e0b', icon: 'clock', filterRules: { status: 'WAITING' } },
  ];

  for (const mb of mailboxes) {
    await prisma.smart_mailboxes.create({
      data: {
        id: uuid(),
        name: mb.name,
        description: mb.description,
        color: mb.color,
        icon: mb.icon,
        filterRules: mb.filterRules,
        isSystem: false,
        sortOrder: 0,
        organizationId: ORG_ID,
        userId: USER_ID,
        updatedAt: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${mailboxes.length} smart mailboxes`);
}

/**
 * Seed Kanban Columns
 */
async function seedKanbanColumns() {
  console.log('\n📋 Seeding KANBAN_COLUMNS...');
  const count = await prisma.kanban_columns.count({ where: { organizationId: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const columns = [
    { name: 'Backlog', color: '#6b7280', position: 0 },
    { name: 'Do zrobienia', color: '#3b82f6', position: 1 },
    { name: 'W trakcie', color: '#f59e0b', position: 2 },
    { name: 'Review', color: '#8b5cf6', position: 3 },
    { name: 'Ukończone', color: '#22c55e', position: 4 },
  ];

  for (const col of columns) {
    await prisma.kanban_columns.create({
      data: {
        id: uuid(),
        name: col.name,
        color: col.color,
        position: col.position,
        wipLimit: col.position === 2 ? 5 : null,
        organizationId: ORG_ID,
        updatedAt: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${columns.length} kanban columns`);
}

/**
 * Seed Info
 */
async function seedInfo() {
  console.log('\n📢 Seeding INFO...');
  const count = await prisma.info.count({ where: { organizationId: ORG_ID } });
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const entries = [
    { title: 'Aktualizacja systemu', content: 'System zostanie zaktualizowany w weekend.', type: 'ANNOUNCEMENT', priority: 'HIGH' },
    { title: 'Nowa funkcja', content: 'Wprowadziliśmy Smart Mailboxes.', type: 'FEATURE', priority: 'MEDIUM' },
    { title: 'Porada', content: 'Użyj Ctrl+K do szybkiego wyszukiwania.', type: 'TIP', priority: 'LOW' },
  ];

  for (const entry of entries) {
    await prisma.info.create({
      data: {
        id: uuid(),
        title: entry.title,
        content: entry.content,
        type: entry.type,
        priority: entry.priority,
        isActive: true,
        organizationId: ORG_ID,
        createdBy: USER_ID,
        updatedAt: new Date()
      }
    });
    stats.created++;
  }
  console.log(`   ✅ Created ${entries.length} info entries`);
}

/**
 * Seed Order Items
 */
async function seedOrderItems() {
  console.log('\n📦 Seeding ORDER_ITEMS...');
  const count = await prisma.order_items.count();
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const orders = await prisma.order.findMany({ where: { organizationId: ORG_ID } });
  const products = await prisma.product.findMany({ where: { organizationId: ORG_ID } });

  if (orders.length === 0 || products.length === 0) { console.log(`   ⚠️  No orders or products`); return; }

  let created = 0;
  for (const order of orders) {
    for (let i = 0; i < Math.min(2, products.length); i++) {
      const product = products[i];
      const quantity = Math.floor(Math.random() * 5) + 1;
      await prisma.order_items.create({
        data: {
          id: uuid(),
          orderId: order.id,
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice: product.price || 100,
          totalPrice: (product.price || 100) * quantity,
          organizationId: ORG_ID
        }
      });
      created++;
    }
  }
  stats.created += created;
  console.log(`   ✅ Created ${created} order items`);
}

/**
 * Seed Invoice Items
 */
async function seedInvoiceItems() {
  console.log('\n🧾 Seeding INVOICE_ITEMS...');
  const count = await prisma.invoice_items.count();
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const invoices = await prisma.invoice.findMany({ where: { organizationId: ORG_ID } });
  const services = await prisma.service.findMany({ where: { organizationId: ORG_ID } });

  if (invoices.length === 0 || services.length === 0) { console.log(`   ⚠️  No invoices or services`); return; }

  let created = 0;
  for (const invoice of invoices) {
    for (let i = 0; i < Math.min(2, services.length); i++) {
      const service = services[i];
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = service.price || 200;
      await prisma.invoice_items.create({
        data: {
          id: uuid(),
          invoiceId: invoice.id,
          serviceId: service.id,
          name: service.name,
          description: service.description || '',
          quantity,
          unit: 'szt',
          unitPriceNet: unitPrice,
          vatRate: 23,
          totalNet: unitPrice * quantity,
          totalGross: unitPrice * quantity * 1.23,
          organizationId: ORG_ID
        }
      });
      created++;
    }
  }
  stats.created += created;
  console.log(`   ✅ Created ${created} invoice items`);
}

/**
 * Seed Offer Items
 */
async function seedOfferItems() {
  console.log('\n📝 Seeding OFFER_ITEMS...');
  const count = await prisma.offer_items.count();
  if (count > 0) { console.log(`   ⏭️  Skipped (${count} exist)`); stats.skipped++; return; }

  const offers = await prisma.offer.findMany({ where: { organizationId: ORG_ID } });
  const products = await prisma.product.findMany({ where: { organizationId: ORG_ID } });

  if (offers.length === 0 || products.length === 0) { console.log(`   ⚠️  No offers or products`); return; }

  let created = 0;
  for (const offer of offers) {
    for (let i = 0; i < Math.min(2, products.length); i++) {
      const product = products[i];
      const quantity = Math.floor(Math.random() * 3) + 1;
      await prisma.offer_items.create({
        data: {
          id: uuid(),
          offerId: offer.id,
          productId: product.id,
          name: product.name,
          description: product.description || '',
          quantity,
          unit: 'szt',
          unitPriceNet: product.price || 150,
          vatRate: 23,
          discount: 0,
          organizationId: ORG_ID
        }
      });
      created++;
    }
  }
  stats.created += created;
  console.log(`   ✅ Created ${created} offer items`);
}

/**
 * Main
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🌱 SEEDING MISSING TABLES v2');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Organization: ${ORG_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    await seedTimeline();
    await seedAIPromptTemplates();
    await seedTaskHistory();
    await seedDelegatedTasks();
    await seedUserProfiles();
    await seedPreciseGoals();
    await seedSmartMailboxes();
    await seedKanbanColumns();
    await seedInfo();
    await seedOrderItems();
    await seedInvoiceItems();
    await seedOfferItems();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('        📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Created: ${stats.created}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\n✅ Completed in ${totalTime}s`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
