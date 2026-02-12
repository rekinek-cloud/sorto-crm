/**
 * RAG Reindexing Script - Fixed version
 * Run: node reindex-rag-fix.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Configuration - Demo Organization
const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';

const stats = {
  total: 0,
  indexed: 0,
  errors: 0,
  byType: {}
};

/**
 * Generate mock embedding (1536 dimensions)
 */
function generateMockEmbedding(text) {
  const dimension = 1536;
  const embedding = [];
  const hash = crypto.createHash('sha256').update(text).digest();

  for (let i = 0; i < dimension; i++) {
    embedding.push((hash[i % hash.length] - 128) / 128);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Generate content hash
 */
function generateContentHash(content) {
  return crypto.createHash('md5').update(content.trim().toLowerCase()).digest('hex');
}

/**
 * Create vector document
 */
async function createVectorDoc(title, content, entityType, entityId, source = 'reindex') {
  try {
    if (!content || content.trim().length < 10) {
      return false;
    }

    const contentHash = generateContentHash(content);

    // Check if exists
    const existing = await prisma.vector_documents.findUnique({
      where: { contentHash }
    });

    if (existing) {
      return true; // Already exists
    }

    const embedding = generateMockEmbedding(content);

    await prisma.vector_documents.create({
      data: {
        id: crypto.randomUUID(),
        title,
        content: content.substring(0, 10000),
        contentHash,
        embedding,
        entityType,
        entityId,
        source,
        language: 'pl',
        chunkIndex: 0,
        totalChunks: 1,
        chunkSize: content.length,
        processingModel: 'mock-embedding',
        organizationId: ORG_ID,
        lastUpdated: new Date()
      }
    });

    return true;
  } catch (error) {
    if (error.code !== 'P2002') {
      console.error(`Error indexing ${entityType}:${entityId}:`, error.message);
    }
    return false;
  }
}

/**
 * Index entity with stats tracking
 */
async function indexEntity(title, content, entityType, entityId, source) {
  stats.total++;
  stats.byType[entityType] = (stats.byType[entityType] || 0) + 1;

  const success = await createVectorDoc(title, content, entityType, entityId, source);
  if (success) {
    stats.indexed++;
  } else {
    stats.errors++;
  }
}

/**
 * Index Streams
 */
async function indexStreams() {
  console.log('\n📊 Indexing STREAMS...');

  const streams = await prisma.stream.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const stream of streams) {
    const content = [
      `Strumień: ${stream.name}`,
      stream.description || '',
      stream.streamType ? `Typ: ${stream.streamType}` : '',
      stream.gtdRole ? `Rola GTD: ${stream.gtdRole}` : '',
      stream.status ? `Status: ${stream.status}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(stream.name, content, 'STREAM', stream.id, 'stream-index');
  }

  console.log(`   ✅ Streams: ${streams.length}`);
}

/**
 * Index Tasks
 */
async function indexTasks() {
  console.log('\n📋 Indexing TASKS...');

  const tasks = await prisma.task.findMany({
    where: { organizationId: ORG_ID },
    include: { stream: { select: { name: true } } }
  });

  for (const task of tasks) {
    const content = [
      `Zadanie: ${task.title}`,
      task.description || '',
      task.status ? `Status: ${task.status}` : '',
      task.priority ? `Priorytet: ${task.priority}` : '',
      task.stream?.name ? `Strumień: ${task.stream.name}` : '',
      task.dueDate ? `Termin: ${task.dueDate.toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(task.title, content, 'TASK', task.id, 'task-index');
  }

  console.log(`   ✅ Tasks: ${tasks.length}`);
}

/**
 * Index Contacts
 */
async function indexContacts() {
  console.log('\n👤 Indexing CONTACTS...');

  const contacts = await prisma.contact.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const contact of contacts) {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Nieznany kontakt';
    const content = [
      `Kontakt: ${fullName}`,
      contact.email ? `Email: ${contact.email}` : '',
      contact.phone ? `Telefon: ${contact.phone}` : '',
      contact.position ? `Stanowisko: ${contact.position}` : '',
      contact.notes ? `Notatki: ${contact.notes}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(fullName, content, 'CONTACT', contact.id, 'contact-index');
  }

  console.log(`   ✅ Contacts: ${contacts.length}`);
}

/**
 * Index Companies
 */
async function indexCompanies() {
  console.log('\n🏢 Indexing COMPANIES...');

  const companies = await prisma.company.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const company of companies) {
    const content = [
      `Firma: ${company.name}`,
      company.industry ? `Branża: ${company.industry}` : '',
      company.website ? `Strona: ${company.website}` : '',
      company.phone ? `Telefon: ${company.phone}` : '',
      company.address ? `Adres: ${company.address}` : '',
      company.description ? `Opis: ${company.description}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(company.name, content, 'COMPANY', company.id, 'company-index');
  }

  console.log(`   ✅ Companies: ${companies.length}`);
}

/**
 * Index Deals
 */
async function indexDeals() {
  console.log('\n💰 Indexing DEALS...');

  const deals = await prisma.deal.findMany({
    where: { organizationId: ORG_ID },
    include: {
      company: { select: { name: true } }
    }
  });

  for (const deal of deals) {
    const content = [
      `Deal: ${deal.title}`,
      deal.company?.name ? `Firma: ${deal.company.name}` : '',
      deal.value ? `Wartość: ${deal.value} PLN` : '',
      deal.stage ? `Etap: ${deal.stage}` : '',
      deal.description ? `Opis: ${deal.description}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(deal.title, content, 'DEAL', deal.id, 'deal-index');
  }

  console.log(`   ✅ Deals: ${deals.length}`);
}

/**
 * Index Projects
 */
async function indexProjects() {
  console.log('\n📁 Indexing PROJECTS...');

  const projects = await prisma.project.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const project of projects) {
    const content = [
      `Projekt: ${project.name}`,
      project.description || '',
      project.status ? `Status: ${project.status}` : '',
      project.priority ? `Priorytet: ${project.priority}` : '',
      project.startDate ? `Start: ${project.startDate.toISOString().split('T')[0]}` : '',
      project.endDate ? `Koniec: ${project.endDate.toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(project.name, content, 'PROJECT', project.id, 'project-index');
  }

  console.log(`   ✅ Projects: ${projects.length}`);
}

/**
 * Index Messages (Emails)
 */
async function indexMessages() {
  console.log('\n📧 Indexing MESSAGES...');

  const messages = await prisma.message.findMany({
    where: { organizationId: ORG_ID },
    select: {
      id: true,
      subject: true,
      content: true,
      fromAddress: true,
      fromName: true,
      toAddress: true,
      messageType: true,
      receivedAt: true
    }
  });

  for (const msg of messages) {
    const content = [
      `Email: ${msg.subject || 'Bez tematu'}`,
      `Od: ${msg.fromName || msg.fromAddress}`,
      `Do: ${msg.toAddress}`,
      msg.receivedAt ? `Data: ${msg.receivedAt.toISOString().split('T')[0]}` : '',
      msg.content?.substring(0, 2000) || ''
    ].filter(Boolean).join('. ');

    await indexEntity(
      msg.subject || 'Email bez tematu',
      content,
      'MESSAGE',
      msg.id,
      'email-index'
    );
  }

  console.log(`   ✅ Messages: ${messages.length}`);
}

/**
 * Index Knowledge Base
 */
async function indexKnowledgeBase() {
  console.log('\n📚 Indexing KNOWLEDGE BASE...');

  try {
    const items = await prisma.knowledgeBase.findMany({
      where: { organizationId: ORG_ID }
    });

    for (const item of items) {
      const content = [
        `Wiedza: ${item.title}`,
        item.content || '',
        item.category ? `Kategoria: ${item.category}` : '',
        item.tags ? `Tagi: ${item.tags.join(', ')}` : ''
      ].filter(Boolean).join('. ');

      await indexEntity(item.title, content, 'KNOWLEDGE', item.id, 'knowledge-index');
    }

    console.log(`   ✅ Knowledge: ${items.length}`);
  } catch (e) {
    console.log(`   ⚠️ Knowledge: skipped (${e.message})`);
  }
}

/**
 * Index Leads
 */
async function indexLeads() {
  console.log('\n🎯 Indexing LEADS...');

  const leads = await prisma.lead.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const lead of leads) {
    const content = [
      `Lead: ${lead.name}`,
      lead.email ? `Email: ${lead.email}` : '',
      lead.phone ? `Telefon: ${lead.phone}` : '',
      lead.company ? `Firma: ${lead.company}` : '',
      lead.source ? `Źródło: ${lead.source}` : '',
      lead.status ? `Status: ${lead.status}` : '',
      lead.notes ? `Notatki: ${lead.notes}` : ''
    ].filter(Boolean).join('. ');

    await indexEntity(lead.name, content, 'LEAD', lead.id, 'lead-index');
  }

  console.log(`   ✅ Leads: ${leads.length}`);
}

/**
 * Index GTD Items
 */
async function indexGTDItems() {
  console.log('\n🎯 Indexing GTD ITEMS...');
  let count = 0;

  // Inbox Items
  try {
    const inboxItems = await prisma.inboxItem.findMany({
      where: { organizationId: ORG_ID }
    });
    for (const item of inboxItems) {
      const content = [
        `Inbox: ${item.title}`,
        item.content || '',
        item.sourceType ? `Źródło: ${item.sourceType}` : ''
      ].filter(Boolean).join('. ');
      await indexEntity(item.title, content, 'INBOX_ITEM', item.id, 'gtd-index');
      count++;
    }
  } catch (e) { /* table may not exist */ }

  // Next Actions
  try {
    const nextActions = await prisma.nextAction.findMany({
      where: { organizationId: ORG_ID }
    });
    for (const action of nextActions) {
      const content = [
        `Następna akcja: ${action.title}`,
        action.description || '',
        action.context ? `Kontekst: ${action.context}` : '',
        action.energy ? `Energia: ${action.energy}` : ''
      ].filter(Boolean).join('. ');
      await indexEntity(action.title, content, 'NEXT_ACTION', action.id, 'gtd-index');
      count++;
    }
  } catch (e) { /* table may not exist */ }

  // Someday Maybe
  try {
    const somedayItems = await prisma.somedayMaybe.findMany({
      where: { organizationId: ORG_ID }
    });
    for (const item of somedayItems) {
      const content = [
        `Kiedyś/Może: ${item.title}`,
        item.description || '',
        item.category ? `Kategoria: ${item.category}` : ''
      ].filter(Boolean).join('. ');
      await indexEntity(item.title, content, 'SOMEDAY_MAYBE', item.id, 'gtd-index');
      count++;
    }
  } catch (e) { /* table may not exist */ }

  // Waiting For
  try {
    const waitingItems = await prisma.waitingFor.findMany({
      where: { organizationId: ORG_ID }
    });
    for (const item of waitingItems) {
      const content = [
        `Oczekuję na: ${item.title}`,
        item.description || '',
        item.waitingFor ? `Od: ${item.waitingFor}` : ''
      ].filter(Boolean).join('. ');
      await indexEntity(item.title, content, 'WAITING_FOR', item.id, 'gtd-index');
      count++;
    }
  } catch (e) { /* table may not exist */ }

  console.log(`   ✅ GTD Items: ${count}`);
}

/**
 * Clear old documents
 */
async function clearOldDocuments() {
  console.log('\n🧹 Clearing old vector documents...');

  const result = await prisma.vector_documents.deleteMany({
    where: { organizationId: ORG_ID }
  });

  console.log(`   🗑️  Deleted ${result.count} old documents`);
  return result.count;
}

/**
 * Main
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🔄 RAG REINDEXING STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Organization: ${ORG_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    // Clear old documents
    await clearOldDocuments();

    // Index all entities
    await indexStreams();
    await indexTasks();
    await indexContacts();
    await indexCompanies();
    await indexDeals();
    await indexProjects();
    await indexMessages();
    await indexKnowledgeBase();
    await indexLeads();
    await indexGTDItems();

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('        📊 REINDEXING SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nTotal processed: ${stats.total}`);
    console.log(`Indexed: ${stats.indexed}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\nBy type:`);
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`\n✅ Completed in ${totalTime}s`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ REINDEXING FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
