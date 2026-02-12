/**
 * Corrected Seed Script with proper field names
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';

async function main() {
  console.log('🌱 Seeding with correct fields...\n');
  let created = 0;

  // 1. DelegatedTask
  try {
    const cnt = await prisma.delegatedTask.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.delegatedTask.createMany({
        data: [
          { id: crypto.randomUUID(), description: 'Przygotować raport kwartalny', delegatedTo: 'Anna Nowak', status: 'IN_PROGRESS', organizationId: ORG_ID },
          { id: crypto.randomUUID(), description: 'Zweryfikować dane sprzedażowe', delegatedTo: 'Piotr Wiśniewski', status: 'NEW', organizationId: ORG_ID },
        ]
      });
      console.log('✅ DelegatedTask: 2');
      created += 2;
    } else console.log('⏭️ DelegatedTask: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DelegatedTask:', e.message.slice(0, 100)); }

  // 2. Info
  try {
    const cnt = await prisma.info.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.info.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Aktualizacja systemu', content: 'System został zaktualizowany do wersji 2.0', topic: 'SYSTEM', importance: 'HIGH', organizationId: ORG_ID },
          { id: crypto.randomUUID(), title: 'Nowy proces sprzedaży', content: 'Od przyszłego miesiąca zmieniamy proces...', topic: 'SALES', importance: 'MEDIUM', organizationId: ORG_ID },
        ]
      });
      console.log('✅ Info: 2');
      created += 2;
    } else console.log('⏭️ Info: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Info:', e.message.slice(0, 100)); }

  // 3. OfferItem (requires existing Offer)
  try {
    const cnt = await prisma.offerItem.count();
    if (cnt === 0) {
      const offers = await prisma.offer.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      const products = await prisma.product.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const offer of offers) {
        for (const product of products) {
          const unitPrice = product.price || 150;
          await prisma.offerItem.create({
            data: {
              id: crypto.randomUUID(),
              offerId: offer.id,
              productId: product.id,
              itemType: 'PRODUCT',
              quantity: 2,
              unitPrice: unitPrice,
              totalPrice: unitPrice * 2,
              discount: 0,
              tax: 23
            }
          });
          c++;
        }
      }
      console.log('✅ OfferItem: ' + c);
      created += c;
    } else console.log('⏭️ OfferItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ OfferItem:', e.message.slice(0, 100)); }

  // 4. Recommendation
  try {
    const cnt = await prisma.recommendation.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.recommendation.createMany({
        data: [
          { id: crypto.randomUUID(), content: 'Zwiększ liczbę follow-upów z klientami', status: 'OPEN', priority: 'HIGH', organizationId: ORG_ID },
          { id: crypto.randomUUID(), content: 'Rozważ automatyzację raportowania', status: 'ACCEPTED', priority: 'MEDIUM', organizationId: ORG_ID },
        ]
      });
      console.log('✅ Recommendation: 2');
      created += 2;
    } else console.log('⏭️ Recommendation: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Recommendation:', e.message.slice(0, 100)); }

  // 5. Unimportant
  try {
    const cnt = await prisma.unimportant.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.unimportant.createMany({
        data: [
          { id: crypto.randomUUID(), content: 'Stare newslettery do archiwizacji', type: 'EMAIL', source: 'INBOX', organizationId: ORG_ID },
          { id: crypto.randomUUID(), content: 'Nieaktualne promocje konkurencji', type: 'NOTE', source: 'WEB', organizationId: ORG_ID },
        ]
      });
      console.log('✅ Unimportant: 2');
      created += 2;
    } else console.log('⏭️ Unimportant: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Unimportant:', e.message.slice(0, 100)); }

  // 6. Metadata (no organizationId)
  try {
    const cnt = await prisma.metadata.count();
    if (cnt === 0) {
      await prisma.metadata.createMany({
        data: [
          { id: crypto.randomUUID(), confidence: 0.85, ambiguity: 'LOW', rawText: 'Spotkanie z klientem ABC', referenceType: 'TASK' },
          { id: crypto.randomUUID(), confidence: 0.92, ambiguity: 'NONE', rawText: 'Deadline projektu: 15.03', referenceType: 'PROJECT' },
        ]
      });
      console.log('✅ Metadata: 2');
      created += 2;
    } else console.log('⏭️ Metadata: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Metadata:', e.message.slice(0, 100)); }

  // 7. Smart (no organizationId - linked to tasks)
  try {
    const cnt = await prisma.smart.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      let c = 0;
      for (const task of tasks) {
        await prisma.smart.create({
          data: {
            id: crypto.randomUUID(),
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: Math.random() > 0.3,
            taskId: task.id
          }
        });
        c++;
      }
      console.log('✅ Smart: ' + c);
      created += c;
    } else console.log('⏭️ Smart: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Smart:', e.message.slice(0, 100)); }

  // 8. File
  try {
    const cnt = await prisma.file.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.file.createMany({
        data: [
          { id: crypto.randomUUID(), fileName: 'Raport_Q1_2024.pdf', fileType: 'application/pdf', urlPath: '/files/raport_q1.pdf', size: 1024000, organizationId: ORG_ID },
          { id: crypto.randomUUID(), fileName: 'Prezentacja_projekt.pptx', fileType: 'application/vnd.ms-powerpoint', urlPath: '/files/prezentacja.pptx', size: 2048000, organizationId: ORG_ID },
          { id: crypto.randomUUID(), fileName: 'Dane_klientow.xlsx', fileType: 'application/vnd.ms-excel', urlPath: '/files/dane.xlsx', size: 512000, organizationId: ORG_ID },
        ]
      });
      console.log('✅ File: 3');
      created += 3;
    } else console.log('⏭️ File: ' + cnt + ' exist');
  } catch (e) { console.log('❌ File:', e.message.slice(0, 100)); }

  // 9. SearchIndex
  try {
    const cnt = await prisma.searchIndex.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 5 });
      const contacts = await prisma.contact.findMany({ where: { organizationId: ORG_ID }, take: 5 });
      let c = 0;

      for (const task of tasks) {
        await prisma.searchIndex.create({
          data: {
            id: crypto.randomUUID(),
            entityType: 'TASK',
            entityId: task.id,
            title: task.title || 'Zadanie',
            content: task.description || task.title || '',
            organizationId: ORG_ID
          }
        });
        c++;
      }

      for (const contact of contacts) {
        await prisma.searchIndex.create({
          data: {
            id: crypto.randomUUID(),
            entityType: 'CONTACT',
            entityId: contact.id,
            title: contact.name || contact.email || 'Kontakt',
            content: `${contact.name || ''} ${contact.email || ''} ${contact.phone || ''}`.trim(),
            organizationId: ORG_ID
          }
        });
        c++;
      }

      console.log('✅ SearchIndex: ' + c);
      created += c;
    } else console.log('⏭️ SearchIndex: ' + cnt + ' exist');
  } catch (e) { console.log('❌ SearchIndex:', e.message.slice(0, 100)); }

  // 10. Completeness (no organizationId - linked to tasks/projects)
  try {
    const cnt = await prisma.completeness.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 5 });
      const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      let c = 0;

      for (const task of tasks) {
        await prisma.completeness.create({
          data: {
            id: crypto.randomUUID(),
            isComplete: Math.random() > 0.5,
            missingInfo: Math.random() > 0.7 ? 'Brak deadline' : null,
            clarity: 'HIGH',
            taskId: task.id
          }
        });
        c++;
      }

      for (const project of projects) {
        await prisma.completeness.create({
          data: {
            id: crypto.randomUUID(),
            isComplete: Math.random() > 0.3,
            missingInfo: Math.random() > 0.5 ? 'Brak budżetu' : null,
            clarity: 'MEDIUM',
            projectId: project.id
          }
        });
        c++;
      }

      console.log('✅ Completeness: ' + c);
      created += c;
    } else console.log('⏭️ Completeness: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Completeness:', e.message.slice(0, 100)); }

  // 11. Timeline
  try {
    const cnt = await prisma.timeline.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      let c = 0;

      for (const task of tasks) {
        await prisma.timeline.create({
          data: {
            id: crypto.randomUUID(),
            eventId: task.id,
            eventType: 'TASK',
            title: task.title || 'Zadanie',
            startDate: new Date(),
            status: 'SCHEDULED',
            organizationId: ORG_ID
          }
        });
        c++;
      }

      console.log('✅ Timeline: ' + c);
      created += c;
    } else console.log('⏭️ Timeline: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Timeline:', e.message.slice(0, 100)); }

  // 12. TaskHistory
  try {
    const cnt = await prisma.taskHistory.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 5 });
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const userId = users[0]?.id;
      let c = 0;

      for (const task of tasks) {
        await prisma.taskHistory.create({
          data: {
            id: crypto.randomUUID(),
            taskId: task.id,
            fieldName: 'status',
            oldValue: 'NEW',
            newValue: 'IN_PROGRESS',
            changedBy: userId
          }
        });
        c++;
      }

      console.log('✅ TaskHistory: ' + c);
      created += c;
    } else console.log('⏭️ TaskHistory: ' + cnt + ' exist');
  } catch (e) { console.log('❌ TaskHistory:', e.message.slice(0, 100)); }

  // 13. OrderItem
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

  // 14. InvoiceItem
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
              quantity: 1,
              unitPrice: unitPrice,
              totalPrice: unitPrice
            }
          });
          c++;
        }
      }

      console.log('✅ InvoiceItem: ' + c);
      created += c;
    } else console.log('⏭️ InvoiceItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ InvoiceItem:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
