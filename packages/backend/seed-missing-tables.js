/**
 * Seed Missing Tables Script
 * Wypełnia puste tabele przykładowymi danymi
 * Run: node seed-missing-tables.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Demo Organization & User
const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

const stats = {
  created: 0,
  skipped: 0,
  errors: 0
};

function uuid() {
  return crypto.randomUUID();
}

/**
 * Seed Timeline entries
 */
async function seedTimeline() {
  console.log('\n📊 Seeding TIMELINE...');

  const count = await prisma.timeline.count({ where: { organizationId: ORG_ID } });
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const entries = [
    { action: 'CREATE', entityType: 'TASK', entityId: uuid(), description: 'Utworzono nowe zadanie: Przygotować raport Q1', metadata: {} },
    { action: 'UPDATE', entityType: 'DEAL', entityId: uuid(), description: 'Zaktualizowano deal: Zmiana etapu na Negocjacje', metadata: { oldStage: 'LEAD', newStage: 'NEGOTIATION' } },
    { action: 'CREATE', entityType: 'CONTACT', entityId: uuid(), description: 'Dodano nowy kontakt: Jan Kowalski', metadata: {} },
    { action: 'COMPLETE', entityType: 'TASK', entityId: uuid(), description: 'Ukończono zadanie: Review kodu', metadata: {} },
    { action: 'CREATE', entityType: 'MEETING', entityId: uuid(), description: 'Zaplanowano spotkanie: Weekly standup', metadata: {} },
    { action: 'UPDATE', entityType: 'PROJECT', entityId: uuid(), description: 'Zmieniono status projektu na W trakcie', metadata: {} },
    { action: 'CREATE', entityType: 'INVOICE', entityId: uuid(), description: 'Wystawiono fakturę FV/2026/001', metadata: { amount: 5000 } },
    { action: 'ASSIGN', entityType: 'TASK', entityId: uuid(), description: 'Przypisano zadanie do: Anna Nowak', metadata: {} },
  ];

  for (const entry of entries) {
    await prisma.timeline.create({
      data: {
        id: uuid(),
        ...entry,
        organizationId: ORG_ID,
        userId: USER_ID,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
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
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const templates = [
    {
      code: 'TASK_SUMMARY',
      name: 'Podsumowanie zadania',
      category: 'TASK',
      description: 'Generuje podsumowanie zadania z kontekstem',
      template: 'Przeanalizuj zadanie: {{title}}. Opis: {{description}}. Wygeneruj krótkie podsumowanie i sugestie.',
      variables: JSON.stringify(['title', 'description', 'dueDate']),
      isActive: true,
      version: 1
    },
    {
      code: 'EMAIL_REPLY',
      name: 'Sugestia odpowiedzi email',
      category: 'EMAIL',
      description: 'Sugeruje odpowiedź na email',
      template: 'Na podstawie emaila od {{sender}} o temacie "{{subject}}", zasugeruj profesjonalną odpowiedź.',
      variables: JSON.stringify(['sender', 'subject', 'content']),
      isActive: true,
      version: 1
    },
    {
      code: 'DEAL_ANALYSIS',
      name: 'Analiza szansy sprzedażowej',
      category: 'CRM',
      description: 'Analizuje deal i sugeruje następne kroki',
      template: 'Przeanalizuj deal: {{name}}. Wartość: {{value}} PLN. Etap: {{stage}}. Zasugeruj następne kroki.',
      variables: JSON.stringify(['name', 'value', 'stage', 'company']),
      isActive: true,
      version: 1
    },
    {
      code: 'MEETING_NOTES',
      name: 'Notatki ze spotkania',
      category: 'MEETING',
      description: 'Generuje strukturalne notatki ze spotkania',
      template: 'Na podstawie transkrypcji spotkania "{{title}}" z uczestnikami: {{participants}}, wygeneruj: 1) Kluczowe punkty, 2) Decyzje, 3) Action items.',
      variables: JSON.stringify(['title', 'participants', 'transcript']),
      isActive: true,
      version: 1
    },
    {
      code: 'GTD_CLASSIFY',
      name: 'Klasyfikacja GTD',
      category: 'GTD',
      description: 'Klasyfikuje element do odpowiedniego strumienia GTD',
      template: 'Sklasyfikuj element: "{{content}}" do odpowiedniej kategorii GTD: Inbox, Next Action, Waiting For, Someday/Maybe, lub Reference.',
      variables: JSON.stringify(['content', 'context']),
      isActive: true,
      version: 1
    }
  ];

  for (const tpl of templates) {
    await prisma.ai_prompt_templates.create({
      data: {
        id: uuid(),
        ...tpl,
        organizationId: ORG_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    stats.created++;
  }

  console.log(`   ✅ Created ${templates.length} prompt templates`);
}

/**
 * Seed Order Items (for existing orders)
 */
async function seedOrderItems() {
  console.log('\n📦 Seeding ORDER_ITEMS...');

  const count = await prisma.order_items.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  // Get existing orders
  const orders = await prisma.order.findMany({ where: { organizationId: ORG_ID } });
  if (orders.length === 0) {
    console.log(`   ⚠️  No orders found`);
    return;
  }

  // Get products
  const products = await prisma.product.findMany({ where: { organizationId: ORG_ID } });

  let created = 0;
  for (const order of orders) {
    // Add 1-3 items per order
    const itemCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < itemCount && i < products.length; i++) {
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
 * Seed Invoice Items (for existing invoices)
 */
async function seedInvoiceItems() {
  console.log('\n🧾 Seeding INVOICE_ITEMS...');

  const count = await prisma.invoice_items.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const invoices = await prisma.invoice.findMany({ where: { organizationId: ORG_ID } });
  if (invoices.length === 0) {
    console.log(`   ⚠️  No invoices found`);
    return;
  }

  const services = await prisma.service.findMany({ where: { organizationId: ORG_ID } });

  let created = 0;
  for (const invoice of invoices) {
    const itemCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < itemCount && i < services.length; i++) {
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
 * Seed Offer Items (for existing offers)
 */
async function seedOfferItems() {
  console.log('\n📝 Seeding OFFER_ITEMS...');

  const count = await prisma.offer_items.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const offers = await prisma.offer.findMany({ where: { organizationId: ORG_ID } });
  if (offers.length === 0) {
    console.log(`   ⚠️  No offers found`);
    return;
  }

  const products = await prisma.product.findMany({ where: { organizationId: ORG_ID } });
  const services = await prisma.service.findMany({ where: { organizationId: ORG_ID } });

  let created = 0;
  for (const offer of offers) {
    // Add products
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
    // Add services
    for (let i = 0; i < Math.min(1, services.length); i++) {
      const service = services[i];
      await prisma.offer_items.create({
        data: {
          id: uuid(),
          offerId: offer.id,
          serviceId: service.id,
          name: service.name,
          description: service.description || '',
          quantity: 1,
          unit: 'usł',
          unitPriceNet: service.price || 500,
          vatRate: 23,
          discount: 10,
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
 * Seed Task History
 */
async function seedTaskHistory() {
  console.log('\n📜 Seeding TASK_HISTORY...');

  const count = await prisma.task_history.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID } });
  if (tasks.length === 0) {
    console.log(`   ⚠️  No tasks found`);
    return;
  }

  let created = 0;
  for (const task of tasks) {
    // Create 2-4 history entries per task
    const historyCount = Math.floor(Math.random() * 3) + 2;
    const changes = [
      { field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS', action: 'STATUS_CHANGE' },
      { field: 'priority', oldValue: 'MEDIUM', newValue: 'HIGH', action: 'PRIORITY_CHANGE' },
      { field: 'assignee', oldValue: null, newValue: 'Jan Kowalski', action: 'ASSIGNED' },
      { field: 'dueDate', oldValue: null, newValue: '2026-02-15', action: 'DUE_DATE_SET' }
    ];

    for (let i = 0; i < Math.min(historyCount, changes.length); i++) {
      const change = changes[i];
      await prisma.task_history.create({
        data: {
          id: uuid(),
          taskId: task.id,
          userId: USER_ID,
          action: change.action,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          createdAt: new Date(Date.now() - (historyCount - i) * 24 * 60 * 60 * 1000),
          organizationId: ORG_ID
        }
      });
      created++;
    }
  }

  stats.created += created;
  console.log(`   ✅ Created ${created} task history entries`);
}

/**
 * Seed User Profiles
 */
async function seedUserProfiles() {
  console.log('\n👤 Seeding USER_PROFILES...');

  const count = await prisma.user_profiles.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const users = await prisma.user.findMany({ where: { organizationId: ORG_ID } });

  for (const user of users) {
    await prisma.user_profiles.create({
      data: {
        id: uuid(),
        userId: user.id,
        bio: 'Pracownik firmy',
        timezone: 'Europe/Warsaw',
        language: 'pl',
        theme: 'light',
        notifications: JSON.stringify({ email: true, push: true, desktop: false }),
        preferences: JSON.stringify({ defaultView: 'dashboard', compactMode: false }),
        organizationId: ORG_ID
      }
    });
    stats.created++;
  }

  console.log(`   ✅ Created ${users.length} user profiles`);
}

/**
 * Seed Delegated Tasks
 */
async function seedDelegatedTasks() {
  console.log('\n🔄 Seeding DELEGATED_TASKS...');

  const count = await prisma.delegated_tasks.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const items = [
    { title: 'Przygotować prezentację', delegatedTo: 'Anna Nowak', delegatedToEmail: 'anna@example.com', status: 'PENDING', priority: 'HIGH' },
    { title: 'Zweryfikować dane klientów', delegatedTo: 'Piotr Wiśniewski', delegatedToEmail: 'piotr@example.com', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { title: 'Aktualizacja dokumentacji', delegatedTo: 'Marta Kowalczyk', delegatedToEmail: 'marta@example.com', status: 'COMPLETED', priority: 'LOW' },
  ];

  for (const item of items) {
    await prisma.delegated_tasks.create({
      data: {
        id: uuid(),
        ...item,
        delegatedBy: USER_ID,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organizationId: ORG_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    stats.created++;
  }

  console.log(`   ✅ Created ${items.length} delegated tasks`);
}

/**
 * Seed Precise Goals (RZUT)
 */
async function seedPreciseGoals() {
  console.log('\n🎯 Seeding PRECISE_GOALS...');

  const count = await prisma.precise_goals.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 3 });

  const goals = [
    { result: 'Zwiększenie sprzedaży o 20%', measurement: 'Przychód miesięczny', current_value: 100000, target_value: 120000, unit: 'PLN', background: 'Cel kwartalny Q1', outlet: 'Dashboard sprzedaży' },
    { result: 'Pozyskanie 50 nowych klientów', measurement: 'Liczba nowych klientów', current_value: 15, target_value: 50, unit: 'klientów', background: 'Ekspansja rynkowa', outlet: 'CRM' },
    { result: 'Wdrożenie systemu CRM', measurement: 'Procent ukończenia', current_value: 60, target_value: 100, unit: '%', background: 'Projekt transformacji cyfrowej', outlet: 'Raport projektu' },
  ];

  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    await prisma.precise_goals.create({
      data: {
        id: uuid(),
        ...goal,
        status: i === 2 ? 'COMPLETED' : 'IN_PROGRESS',
        deadline: new Date(Date.now() + (30 + i * 30) * 24 * 60 * 60 * 1000),
        stream_id: streams[i % streams.length]?.id,
        organization_id: ORG_ID,
        created_by: USER_ID,
        created_at: new Date(),
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

  const count = await prisma.smart_mailboxes.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const mailboxes = [
    { name: 'Pilne', description: 'Emaile wymagające szybkiej odpowiedzi', color: '#ef4444', icon: 'flame', filterRules: JSON.stringify({ priority: 'HIGH', unread: true }) },
    { name: 'Do przeczytania', description: 'Newslettery i artykuły', color: '#3b82f6', icon: 'book', filterRules: JSON.stringify({ labels: ['newsletter', 'article'] }) },
    { name: 'Oczekujące', description: 'Emaile czekające na odpowiedź', color: '#f59e0b', icon: 'clock', filterRules: JSON.stringify({ status: 'WAITING' }) },
    { name: 'Klienci VIP', description: 'Korespondencja z kluczowymi klientami', color: '#8b5cf6', icon: 'star', filterRules: JSON.stringify({ contacts: 'VIP' }) },
  ];

  for (const mb of mailboxes) {
    await prisma.smart_mailboxes.create({
      data: {
        id: uuid(),
        ...mb,
        isSystem: false,
        sortOrder: 0,
        organizationId: ORG_ID,
        userId: USER_ID,
        createdAt: new Date(),
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

  const count = await prisma.kanban_columns.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const columns = [
    { name: 'Backlog', color: '#6b7280', position: 0, status: 'TODO' },
    { name: 'Do zrobienia', color: '#3b82f6', position: 1, status: 'TODO' },
    { name: 'W trakcie', color: '#f59e0b', position: 2, status: 'IN_PROGRESS' },
    { name: 'Review', color: '#8b5cf6', position: 3, status: 'IN_PROGRESS' },
    { name: 'Ukończone', color: '#22c55e', position: 4, status: 'DONE' },
  ];

  for (const col of columns) {
    await prisma.kanban_columns.create({
      data: {
        id: uuid(),
        ...col,
        wipLimit: col.status === 'IN_PROGRESS' ? 5 : null,
        organizationId: ORG_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    stats.created++;
  }

  console.log(`   ✅ Created ${columns.length} kanban columns`);
}

/**
 * Seed Info entries
 */
async function seedInfo() {
  console.log('\n📢 Seeding INFO...');

  const count = await prisma.info.count();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} exist)`);
    stats.skipped++;
    return;
  }

  const entries = [
    { title: 'Aktualizacja systemu', content: 'System zostanie zaktualizowany w weekend. Planowany przestój: 2h.', type: 'ANNOUNCEMENT', priority: 'HIGH' },
    { title: 'Nowa funkcja: Smart Mailboxes', content: 'Wprowadziliśmy inteligentne skrzynki pocztowe. Sprawdź w ustawieniach.', type: 'FEATURE', priority: 'MEDIUM' },
    { title: 'Porada dnia', content: 'Używaj skrótów klawiszowych Ctrl+K aby szybko wyszukiwać.', type: 'TIP', priority: 'LOW' },
  ];

  for (const entry of entries) {
    await prisma.info.create({
      data: {
        id: uuid(),
        ...entry,
        isActive: true,
        organizationId: ORG_ID,
        createdBy: USER_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    stats.created++;
  }

  console.log(`   ✅ Created ${entries.length} info entries`);
}

/**
 * Main function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🌱 SEEDING MISSING TABLES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Organization: ${ORG_ID}`);
  console.log(`User: ${USER_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    await seedTimeline();
    await seedAIPromptTemplates();
    await seedOrderItems();
    await seedInvoiceItems();
    await seedOfferItems();
    await seedTaskHistory();
    await seedUserProfiles();
    await seedDelegatedTasks();
    await seedPreciseGoals();
    await seedSmartMailboxes();
    await seedKanbanColumns();
    await seedInfo();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('        📊 SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nCreated: ${stats.created}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\n✅ Completed in ${totalTime}s`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
