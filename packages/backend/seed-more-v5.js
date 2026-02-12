/**
 * Seed More Tables - Part 5
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables (Part 5)...\n');
  let created = 0;

  // 1. view_configurations
  try {
    const cnt = await prisma.view_configurations.count();
    if (cnt === 0) {
      await prisma.view_configurations.createMany({
        data: [
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'KANBAN', viewName: 'Tablica zadań', configuration: { columns: ['TODO', 'IN_PROGRESS', 'DONE'] }, isDefault: true, updatedAt: new Date() },
          { id: crypto.randomUUID(), userId: USER_ID, viewType: 'LIST', viewName: 'Lista kontaktów', configuration: { sortBy: 'name' }, isDefault: false, updatedAt: new Date() },
        ]
      });
      console.log('✅ view_configurations: 2');
      created += 2;
    } else console.log('⏭️ view_configurations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ view_configurations:', e.message.slice(0, 100)); }

  // 2. kanban_columns
  try {
    const cnt = await prisma.kanban_columns.count();
    if (cnt === 0) {
      const views = await prisma.view_configurations.findMany({ where: { viewType: 'KANBAN' }, take: 1 });
      if (views.length > 0) {
        const cols = ['Backlog', 'Do zrobienia', 'W trakcie', 'Review', 'Zakończone'];
        for (let i = 0; i < cols.length; i++) {
          await prisma.kanban_columns.create({
            data: { id: crypto.randomUUID(), viewId: views[0].id, title: cols[i], position: i, color: '#3B82F6' }
          });
        }
        console.log('✅ kanban_columns: 5');
        created += 5;
      }
    } else console.log('⏭️ kanban_columns: ' + cnt + ' exist');
  } catch (e) { console.log('❌ kanban_columns:', e.message.slice(0, 100)); }

  // 3. DocumentComment
  try {
    const cnt = await prisma.documentComment.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const doc of docs) {
        await prisma.documentComment.create({
          data: { id: crypto.randomUUID(), content: 'Świetny dokument!', documentId: doc.id, authorId: USER_ID }
        });
      }
      console.log('✅ DocumentComment: ' + docs.length);
      created += docs.length;
    } else console.log('⏭️ DocumentComment: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentComment:', e.message.slice(0, 100)); }

  // 4. DocumentLink
  try {
    const cnt = await prisma.documentLink.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (docs.length >= 2) {
        await prisma.documentLink.create({
          data: { id: crypto.randomUUID(), sourceDocumentId: docs[0].id, targetDocumentId: docs[1].id, linkType: 'REFERENCE' }
        });
        console.log('✅ DocumentLink: 1');
        created += 1;
      }
    } else console.log('⏭️ DocumentLink: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentLink:', e.message.slice(0, 100)); }

  // 5. DocumentShare
  try {
    const cnt = await prisma.documentShare.count();
    if (cnt === 0) {
      const docs = await prisma.document.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (docs.length > 0) {
        await prisma.documentShare.create({
          data: { id: crypto.randomUUID(), documentId: docs[0].id, sharedWithId: USER_ID, permission: 'VIEW' }
        });
        console.log('✅ DocumentShare: 1');
        created += 1;
      }
    } else console.log('⏭️ DocumentShare: ' + cnt + ' exist');
  } catch (e) { console.log('❌ DocumentShare:', e.message.slice(0, 100)); }

  // 6. WikiPageLink
  try {
    const cnt = await prisma.wikiPageLink.count();
    if (cnt === 0) {
      const pages = await prisma.wikiPage.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (pages.length >= 2) {
        await prisma.wikiPageLink.create({
          data: { id: crypto.randomUUID(), sourcePageId: pages[0].id, targetPageId: pages[1].id }
        });
        console.log('✅ WikiPageLink: 1');
        created += 1;
      }
    } else console.log('⏭️ WikiPageLink: ' + cnt + ' exist');
  } catch (e) { console.log('❌ WikiPageLink:', e.message.slice(0, 100)); }

  // 7. smart_mailbox_rules
  try {
    const cnt = await prisma.smart_mailbox_rules.count();
    if (cnt === 0) {
      const mailboxes = await prisma.smart_mailboxes.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const mb of mailboxes) {
        await prisma.smart_mailbox_rules.create({
          data: { id: crypto.randomUUID(), mailboxId: mb.id, field: 'subject', operator: 'CONTAINS', value: 'pilne', isActive: true }
        });
      }
      console.log('✅ smart_mailbox_rules: ' + mailboxes.length);
      created += mailboxes.length;
    } else console.log('⏭️ smart_mailbox_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ smart_mailbox_rules:', e.message.slice(0, 100)); }

  // 8. StreamChannel
  try {
    const cnt = await prisma.streamChannel.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const stream of streams) {
        await prisma.streamChannel.create({
          data: { id: crypto.randomUUID(), name: 'Główny kanał', streamId: stream.id, organizationId: ORG_ID }
        });
      }
      console.log('✅ StreamChannel: ' + streams.length);
      created += streams.length;
    } else console.log('⏭️ StreamChannel: ' + cnt + ' exist');
  } catch (e) { console.log('❌ StreamChannel:', e.message.slice(0, 100)); }

  // 9. MessageAttachment
  try {
    const cnt = await prisma.messageAttachment.count();
    if (cnt === 0) {
      const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const msg of messages) {
        await prisma.messageAttachment.create({
          data: { id: crypto.randomUUID(), messageId: msg.id, fileName: 'zalacznik.pdf', fileType: 'application/pdf', fileSize: 102400, filePath: '/attachments/zalacznik.pdf' }
        });
      }
      console.log('✅ MessageAttachment: ' + messages.length);
      created += messages.length;
    } else console.log('⏭️ MessageAttachment: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageAttachment:', e.message.slice(0, 100)); }

  // 10. RecurringTask
  try {
    const cnt = await prisma.recurringTask.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.recurringTask.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Tygodniowy raport', pattern: 'WEEKLY', frequency: 1, daysOfWeek: [1], startDate: new Date(), isActive: true, organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), title: 'Miesięczne podsumowanie', pattern: 'MONTHLY', frequency: 1, dayOfMonth: 1, startDate: new Date(), isActive: true, organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ RecurringTask: 2');
      created += 2;
    } else console.log('⏭️ RecurringTask: ' + cnt + ' exist');
  } catch (e) { console.log('❌ RecurringTask:', e.message.slice(0, 100)); }

  // 11. WeeklyReview
  try {
    const cnt = await prisma.weeklyReview.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.weeklyReview.createMany({
        data: [
          { id: crypto.randomUUID(), weekStartDate: new Date(), status: 'COMPLETED', accomplishments: ['Zakończono projekt X'], nextWeekGoals: ['Rozpocząć projekt Y'], organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ WeeklyReview: 1');
      created += 1;
    } else console.log('⏭️ WeeklyReview: ' + cnt + ' exist');
  } catch (e) { console.log('❌ WeeklyReview:', e.message.slice(0, 100)); }

  // 12. FocusMode
  try {
    const cnt = await prisma.focusMode.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.focusMode.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Deep Work', description: 'Praca głęboka bez rozpraszaczy', duration: 90, breakDuration: 15, isActive: true, organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), name: 'Pomodoro', description: '25 min pracy, 5 min przerwy', duration: 25, breakDuration: 5, isActive: true, organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ FocusMode: 2');
      created += 2;
    } else console.log('⏭️ FocusMode: ' + cnt + ' exist');
  } catch (e) { console.log('❌ FocusMode:', e.message.slice(0, 100)); }

  // 13. SMARTTemplate
  try {
    const cnt = await prisma.sMARTTemplate.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.sMARTTemplate.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Cel sprzedażowy', description: 'Szablon dla celów sprzedażowych', category: 'SALES', specificPrompt: 'Co dokładnie chcesz osiągnąć?', measurablePrompt: 'Jak zmierzysz sukces?', achievablePrompt: 'Czy cel jest realistyczny?', relevantPrompt: 'Dlaczego to ważne?', timeBoundPrompt: 'Kiedy chcesz to osiągnąć?', organizationId: ORG_ID },
        ]
      });
      console.log('✅ SMARTTemplate: 1');
      created += 1;
    } else console.log('⏭️ SMARTTemplate: ' + cnt + ' exist');
  } catch (e) { console.log('❌ SMARTTemplate:', e.message.slice(0, 100)); }

  // 14. SMARTAnalysisDetail
  try {
    const cnt = await prisma.sMARTAnalysisDetail.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const task of tasks) {
        await prisma.sMARTAnalysisDetail.create({
          data: { id: crypto.randomUUID(), taskId: task.id, specific: 'Jasno zdefiniowane', measurable: 'Mierzalne przez przychód', achievable: 'Realistyczne', relevant: 'Związane z celami firmy', timeBound: 'Do końca kwartału', overallScore: 85, organizationId: ORG_ID }
        });
      }
      console.log('✅ SMARTAnalysisDetail: ' + tasks.length);
      created += tasks.length;
    } else console.log('⏭️ SMARTAnalysisDetail: ' + cnt + ' exist');
  } catch (e) { console.log('❌ SMARTAnalysisDetail:', e.message.slice(0, 100)); }

  // 15. SMARTImprovement
  try {
    const cnt = await prisma.sMARTImprovement.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const details = await prisma.sMARTAnalysisDetail.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (details.length > 0) {
        await prisma.sMARTImprovement.create({
          data: { id: crypto.randomUUID(), analysisId: details[0].id, aspect: 'SPECIFIC', suggestion: 'Dodaj więcej szczegółów do opisu', priority: 'MEDIUM', organizationId: ORG_ID }
        });
        console.log('✅ SMARTImprovement: 1');
        created += 1;
      }
    } else console.log('⏭️ SMARTImprovement: ' + cnt + ' exist');
  } catch (e) { console.log('❌ SMARTImprovement:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
