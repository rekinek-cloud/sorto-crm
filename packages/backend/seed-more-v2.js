/**
 * Seed More Tables - Part 2
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables (Part 2)...\n');
  let created = 0;

  // 1. Complaint
  try {
    const cnt = await prisma.complaint.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.complaint.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Opóźniona dostawa', description: 'Paczka nie dotarła w terminie', customer: 'Jan Kowalski', product: 'Laptop Dell', status: 'IN_PROGRESS', priority: 'HIGH', organizationId: ORG_ID },
          { id: crypto.randomUUID(), title: 'Wadliwy produkt', description: 'Uszkodzone opakowanie', customer: 'Anna Nowak', product: 'Monitor', status: 'NEW', priority: 'MEDIUM', organizationId: ORG_ID },
        ]
      });
      console.log('✅ Complaint: 2');
      created += 2;
    } else console.log('⏭️ Complaint: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Complaint:', e.message.slice(0, 100)); }

  // 2. ErrorLog
  try {
    const cnt = await prisma.errorLog.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.errorLog.createMany({
        data: [
          { id: crypto.randomUUID(), message: 'Failed to fetch data', url: '/api/contacts', userAgent: 'Mozilla/5.0', severity: 'medium', sessionId: crypto.randomUUID(), timestamp: new Date(), organizationId: ORG_ID },
          { id: crypto.randomUUID(), message: 'Network timeout', url: '/api/tasks', userAgent: 'Chrome/120', severity: 'high', sessionId: crypto.randomUUID(), timestamp: new Date(), organizationId: ORG_ID },
        ]
      });
      console.log('✅ ErrorLog: 2');
      created += 2;
    } else console.log('⏭️ ErrorLog: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ErrorLog:', e.message.slice(0, 100)); }

  // 3. AutoReply
  try {
    const cnt = await prisma.autoReply.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.autoReply.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Potwierdzenie otrzymania', subject: 'Otrzymaliśmy Twoją wiadomość', content: 'Dziękujemy za kontakt. Odpowiemy najszybciej jak to możliwe.', triggerConditions: { type: 'all' }, status: 'ACTIVE', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: 'Poza godzinami pracy', subject: 'Jesteśmy niedostępni', content: 'Biuro jest czynne w godzinach 9-17.', triggerConditions: { afterHours: true }, status: 'ACTIVE', organizationId: ORG_ID },
        ]
      });
      console.log('✅ AutoReply: 2');
      created += 2;
    } else console.log('⏭️ AutoReply: ' + cnt + ' exist');
  } catch (e) { console.log('❌ AutoReply:', e.message.slice(0, 100)); }

  // 4. smart_mailboxes
  try {
    const cnt = await prisma.smart_mailboxes.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.smart_mailboxes.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Pilne', icon: '🔥', color: 'red', description: 'Pilne wiadomości', isBuiltIn: false, isActive: true, displayOrder: 0, organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), name: 'Newsletter', icon: '📰', color: 'blue', description: 'Newslettery do przeczytania', isBuiltIn: false, isActive: true, displayOrder: 1, organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), name: 'Faktury', icon: '💰', color: 'green', description: 'Faktury i rachunki', isBuiltIn: false, isActive: true, displayOrder: 2, organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ smart_mailboxes: 3');
      created += 3;
    } else console.log('⏭️ smart_mailboxes: ' + cnt + ' exist');
  } catch (e) { console.log('❌ smart_mailboxes:', e.message.slice(0, 100)); }

  // 5. InvoiceItem (with itemType)
  try {
    const cnt = await prisma.invoiceItem.count();
    if (cnt === 0) {
      const invoices = await prisma.invoice.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      const services = await prisma.service.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const invoice of invoices) {
        for (const service of services) {
          const unitPrice = service.price || 200;
          await prisma.invoiceItem.create({
            data: {
              id: crypto.randomUUID(),
              invoiceId: invoice.id,
              serviceId: service.id,
              itemType: 'SERVICE',
              quantity: 1,
              unitPrice: unitPrice,
              totalPrice: unitPrice,
              tax: 23
            }
          });
          c++;
        }
      }
      console.log('✅ InvoiceItem: ' + c);
      created += c;
    } else console.log('⏭️ InvoiceItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ InvoiceItem:', e.message.slice(0, 100)); }

  // 6. OrderItem (with itemType if needed)
  try {
    const cnt = await prisma.orderItem.count();
    if (cnt === 0) {
      const orders = await prisma.order.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      const products = await prisma.product.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const order of orders) {
        for (const product of products) {
          const unitPrice = product.price || 100;
          await prisma.orderItem.create({
            data: {
              id: crypto.randomUUID(),
              orderId: order.id,
              productId: product.id,
              quantity: 2,
              unitPrice: unitPrice,
              totalPrice: unitPrice * 2
            }
          });
          c++;
        }
      }
      console.log('✅ OrderItem: ' + c);
      created += c;
    } else console.log('⏭️ OrderItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ OrderItem:', e.message.slice(0, 100)); }

  // 7. user_profiles
  try {
    const cnt = await prisma.userProfiles.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID } });
      let c = 0;
      for (const user of users) {
        try {
          await prisma.userProfiles.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              organizationId: ORG_ID
            }
          });
          c++;
        } catch (e2) { /* skip */ }
      }
      console.log('✅ UserProfiles: ' + c);
      created += c;
    } else console.log('⏭️ UserProfiles: ' + cnt + ' exist');
  } catch (e) { console.log('❌ UserProfiles:', e.message.slice(0, 100)); }

  // 8. activities
  try {
    const cnt = await prisma.activities.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const contacts = await prisma.contact.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      let c = 0;
      for (const contact of contacts) {
        await prisma.activities.create({
          data: {
            id: crypto.randomUUID(),
            type: 'CALL',
            title: 'Rozmowa z klientem',
            description: 'Omówienie oferty',
            status: 'COMPLETED',
            contactId: contact.id,
            organizationId: ORG_ID,
            userId: USER_ID
          }
        });
        c++;
      }
      console.log('✅ Activities: ' + c);
      created += c;
    } else console.log('⏭️ Activities: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Activities:', e.message.slice(0, 100)); }

  // 9. agent_conversations
  try {
    const cnt = await prisma.agent_conversations.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_conversations.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Planowanie zadań', status: 'COMPLETED', messageCount: 5, organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), title: 'Analiza kontaktów', status: 'ACTIVE', messageCount: 3, organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ agent_conversations: 2');
      created += 2;
    } else console.log('⏭️ agent_conversations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_conversations:', e.message.slice(0, 100)); }

  // 10. agent_suggestions
  try {
    const cnt = await prisma.agent_suggestions.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.agent_suggestions.createMany({
        data: [
          { id: crypto.randomUUID(), type: 'TASK', content: 'Rozważ dodanie deadline do tego zadania', confidence: 0.85, status: 'PENDING', organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), type: 'CONTACT', content: 'Ten kontakt nie był kontaktowany od 30 dni', confidence: 0.92, status: 'PENDING', organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ agent_suggestions: 2');
      created += 2;
    } else console.log('⏭️ agent_suggestions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_suggestions:', e.message.slice(0, 100)); }

  // 11. ai_conversations
  try {
    const cnt = await prisma.ai_conversations.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.ai_conversations.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Pomoc z zadaniami', context: 'TASK_PLANNING', status: 'ACTIVE', organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ ai_conversations: 1');
      created += 1;
    } else console.log('⏭️ ai_conversations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_conversations:', e.message.slice(0, 100)); }

  // 12. bug_reports
  try {
    const cnt = await prisma.bug_reports.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.bug_reports.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Błąd przy zapisie', description: 'Formularz nie zapisuje danych', severity: 'HIGH', status: 'OPEN', reportedBy: USER_ID, organizationId: ORG_ID },
        ]
      });
      console.log('✅ bug_reports: 1');
      created += 1;
    } else console.log('⏭️ bug_reports: ' + cnt + ' exist');
  } catch (e) { console.log('❌ bug_reports:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
