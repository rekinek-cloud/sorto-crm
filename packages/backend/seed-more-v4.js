/**
 * Seed More Tables - Part 4
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';

async function main() {
  console.log('🌱 Seeding more tables (Part 4)...\n');
  let created = 0;

  // 1. agent_actions (with all required fields)
  try {
    const cnt = await prisma.agent_actions.count();
    if (cnt === 0) {
      const convs = await prisma.agent_conversations.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const conv of convs) {
        await prisma.agent_actions.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: conv.id,
            organizationId: ORG_ID,
            userId: USER_ID,
            actionType: 'CREATE_TASK',
            status: 'COMPLETED',
            parameters: { title: 'Nowe zadanie' },
            result: { success: true }
          }
        });
        c++;
      }
      console.log('✅ agent_actions: ' + c);
      created += c;
    } else console.log('⏭️ agent_actions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ agent_actions:', e.message.slice(0, 100)); }

  // 2. Dependencies
  try {
    const cnt = await prisma.dependency.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 4 });
      if (tasks.length >= 2) {
        await prisma.dependency.create({
          data: {
            id: crypto.randomUUID(),
            type: 'FINISH_TO_START',
            sourceId: tasks[0].id,
            sourceType: 'TASK',
            targetId: tasks[1].id,
            targetType: 'TASK'
          }
        });
        console.log('✅ Dependency: 1');
        created += 1;
      }
    } else console.log('⏭️ Dependency: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Dependency:', e.message.slice(0, 100)); }

  // 3. TaskRelationship
  try {
    const cnt = await prisma.taskRelationship.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 4 });
      if (tasks.length >= 2) {
        await prisma.taskRelationship.create({
          data: {
            id: crypto.randomUUID(),
            sourceTaskId: tasks[0].id,
            targetTaskId: tasks[1].id,
            relationshipType: 'BLOCKS'
          }
        });
        console.log('✅ TaskRelationship: 1');
        created += 1;
      }
    } else console.log('⏭️ TaskRelationship: ' + cnt + ' exist');
  } catch (e) { console.log('❌ TaskRelationship:', e.message.slice(0, 100)); }

  // 4. ProjectDependency
  try {
    const cnt = await prisma.projectDependency.count();
    if (cnt === 0) {
      const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      if (projects.length >= 2) {
        await prisma.projectDependency.create({
          data: {
            id: crypto.randomUUID(),
            sourceProjectId: projects[0].id,
            targetProjectId: projects[1].id,
            dependencyType: 'FINISH_TO_START'
          }
        });
        console.log('✅ ProjectDependency: 1');
        created += 1;
      }
    } else console.log('⏭️ ProjectDependency: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProjectDependency:', e.message.slice(0, 100)); }

  // 5. CriticalPath
  try {
    const cnt = await prisma.criticalPath.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (projects.length > 0) {
        await prisma.criticalPath.create({
          data: {
            id: crypto.randomUUID(),
            projectId: projects[0].id,
            tasks: [],
            totalDuration: 30,
            organizationId: ORG_ID
          }
        });
        console.log('✅ CriticalPath: 1');
        created += 1;
      }
    } else console.log('⏭️ CriticalPath: ' + cnt + ' exist');
  } catch (e) { console.log('❌ CriticalPath:', e.message.slice(0, 100)); }

  // 6. Document
  try {
    const cnt = await prisma.document.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.document.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Notatki ze spotkania', content: 'Omówiono plan na Q1...', type: 'NOTE', organizationId: ORG_ID, createdBy: USER_ID },
          { id: crypto.randomUUID(), title: 'Procedura sprzedażowa', content: 'Kroki do zamknięcia deala...', type: 'GUIDE', organizationId: ORG_ID, createdBy: USER_ID },
        ]
      });
      console.log('✅ Document: 2');
      created += 2;
    } else console.log('⏭️ Document: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Document:', e.message.slice(0, 100)); }

  // 7. Folder
  try {
    const cnt = await prisma.folder.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.folder.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Dokumenty', description: 'Główny folder', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: 'Raporty', description: 'Raporty miesięczne', organizationId: ORG_ID },
        ]
      });
      console.log('✅ Folder: 2');
      created += 2;
    } else console.log('⏭️ Folder: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Folder:', e.message.slice(0, 100)); }

  // 8. WikiCategory
  try {
    const cnt = await prisma.wikiCategory.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.wikiCategory.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Procedury', description: 'Procedury firmowe', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: 'FAQ', description: 'Często zadawane pytania', organizationId: ORG_ID },
        ]
      });
      console.log('✅ WikiCategory: 2');
      created += 2;
    } else console.log('⏭️ WikiCategory: ' + cnt + ' exist');
  } catch (e) { console.log('❌ WikiCategory:', e.message.slice(0, 100)); }

  // 9. WikiPage
  try {
    const cnt = await prisma.wikiPage.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const cats = await prisma.wikiCategory.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.wikiPage.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Jak dodać kontakt', content: 'Kliknij przycisk Dodaj...', slug: 'jak-dodac-kontakt', organizationId: ORG_ID, categoryId: cats[0]?.id, createdBy: USER_ID },
          { id: crypto.randomUUID(), title: 'Obsługa reklamacji', content: 'Procedura obsługi...', slug: 'obsluga-reklamacji', organizationId: ORG_ID, categoryId: cats[0]?.id, createdBy: USER_ID },
        ]
      });
      console.log('✅ WikiPage: 2');
      created += 2;
    } else console.log('⏭️ WikiPage: ' + cnt + ' exist');
  } catch (e) { console.log('❌ WikiPage:', e.message.slice(0, 100)); }

  // 10. CommunicationChannel
  try {
    const cnt = await prisma.communicationChannel.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.communicationChannel.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Email główny', type: 'EMAIL', isActive: true, organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: 'Telefon biuro', type: 'PHONE', isActive: true, organizationId: ORG_ID },
        ]
      });
      console.log('✅ CommunicationChannel: 2');
      created += 2;
    } else console.log('⏭️ CommunicationChannel: ' + cnt + ' exist');
  } catch (e) { console.log('❌ CommunicationChannel:', e.message.slice(0, 100)); }

  // 11. Message
  try {
    const cnt = await prisma.message.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      const channels = await prisma.communicationChannel.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (channels.length > 0) {
        await prisma.message.createMany({
          data: [
            { id: crypto.randomUUID(), subject: 'Zapytanie ofertowe', content: 'Proszę o ofertę...', direction: 'INBOUND', status: 'RECEIVED', channelId: channels[0].id, organizationId: ORG_ID },
            { id: crypto.randomUUID(), subject: 'Odpowiedź', content: 'W załączniku przesyłam...', direction: 'OUTBOUND', status: 'SENT', channelId: channels[0].id, organizationId: ORG_ID },
          ]
        });
        console.log('✅ Message: 2');
        created += 2;
      }
    } else console.log('⏭️ Message: ' + cnt + ' exist');
  } catch (e) { console.log('❌ Message:', e.message.slice(0, 100)); }

  // 12. GTDBucket
  try {
    const cnt = await prisma.gTDBucket.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.gTDBucket.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Inbox', description: 'Wszystko co wymaga przetworzenia', bucketType: 'INBOX', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: 'Next Actions', description: 'Następne działania', bucketType: 'NEXT_ACTIONS', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: 'Waiting For', description: 'Oczekujące na innych', bucketType: 'WAITING_FOR', organizationId: ORG_ID },
        ]
      });
      console.log('✅ GTDBucket: 3');
      created += 3;
    } else console.log('⏭️ GTDBucket: ' + cnt + ' exist');
  } catch (e) { console.log('❌ GTDBucket:', e.message.slice(0, 100)); }

  // 13. GTDHorizon
  try {
    const cnt = await prisma.gTDHorizon.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.gTDHorizon.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Runway', level: 0, description: 'Codzienne działania', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: '10,000 ft', level: 1, description: 'Projekty', organizationId: ORG_ID },
          { id: crypto.randomUUID(), name: '20,000 ft', level: 2, description: 'Obszary odpowiedzialności', organizationId: ORG_ID },
        ]
      });
      console.log('✅ GTDHorizon: 3');
      created += 3;
    } else console.log('⏭️ GTDHorizon: ' + cnt + ' exist');
  } catch (e) { console.log('❌ GTDHorizon:', e.message.slice(0, 100)); }

  // 14. AreaOfResponsibility
  try {
    const cnt = await prisma.areaOfResponsibility.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.areaOfResponsibility.createMany({
        data: [
          { id: crypto.randomUUID(), name: 'Sprzedaż', description: 'Zarządzanie procesem sprzedaży', organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), name: 'Marketing', description: 'Działania marketingowe', organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ AreaOfResponsibility: 2');
      created += 2;
    } else console.log('⏭️ AreaOfResponsibility: ' + cnt + ' exist');
  } catch (e) { console.log('❌ AreaOfResponsibility:', e.message.slice(0, 100)); }

  // 15. InboxItem
  try {
    const cnt = await prisma.inboxItem.count({ where: { organizationId: ORG_ID } });
    if (cnt === 0) {
      await prisma.inboxItem.createMany({
        data: [
          { id: crypto.randomUUID(), title: 'Sprawdzić ofertę konkurencji', content: 'Do analizy', source: 'MANUAL', status: 'PENDING', organizationId: ORG_ID, userId: USER_ID },
          { id: crypto.randomUUID(), title: 'Zaktualizować cennik', content: 'Na podstawie nowych kosztów', source: 'MANUAL', status: 'PENDING', organizationId: ORG_ID, userId: USER_ID },
        ]
      });
      console.log('✅ InboxItem: 2');
      created += 2;
    } else console.log('⏭️ InboxItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ InboxItem:', e.message.slice(0, 100)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
