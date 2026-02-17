/**
 * Full RAG Reindexing Script
 *
 * This script performs complete reindexing of all business data into the RAG vector database.
 * Run with: npx ts-node src/scripts/reindex-rag.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration
const ORG_ID = 'fe59f2b0-93d0-4193-9bab-aee778c1a449'; // Demo Organization
const CHUNK_SIZE = 500;
const BATCH_SIZE = 50;

interface IndexStats {
  type: string;
  total: number;
  indexed: number;
  errors: number;
}

const stats: IndexStats[] = [];

/**
 * Generate mock embedding (1536 dimensions like OpenAI ada-002)
 */
function generateMockEmbedding(text: string): number[] {
  const dimension = 1536;
  const embedding: number[] = [];
  const hash = crypto.createHash('sha256').update(text).digest();

  for (let i = 0; i < dimension; i++) {
    embedding.push((hash[i % hash.length] - 128) / 128);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Generate content hash for deduplication
 */
function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content.trim().toLowerCase()).digest('hex');
}

/**
 * Create vector document
 */
async function createVectorDoc(
  title: string,
  content: string,
  entityType: string,
  entityId: string,
  source: string = 'reindex'
): Promise<boolean> {
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
      // Update if different entity
      if (existing.entityId !== entityId) {
        await prisma.vector_documents.update({
          where: { id: existing.id },
          data: {
            title,
            entityType,
            entityId,
            lastUpdated: new Date()
          }
        });
      }
      return true;
    }

    const embedding = generateMockEmbedding(content);

    await prisma.vector_documents.create({
      data: {
        id: crypto.randomUUID(),
        title,
        content: content.substring(0, 10000), // Limit content size
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
  } catch (error: any) {
    if (error.code !== 'P2002') { // Ignore unique constraint violations
      console.error(`Error indexing ${entityType}:${entityId}:`, error.message);
    }
    return false;
  }
}

/**
 * Index Streams
 */
async function indexStreams(): Promise<IndexStats> {
  console.log('\n📊 Indexing STREAMS...');
  const stat: IndexStats = { type: 'STREAM', total: 0, indexed: 0, errors: 0 };

  const streams = await prisma.stream.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = streams.length;

  for (const stream of streams) {
    const content = [
      `Strumień: ${stream.name}`,
      stream.description || '',
      stream.streamType ? `Typ: ${stream.streamType}` : '',
      stream.streamRole ? `Rola GTD: ${stream.streamRole}` : '',
      stream.status ? `Status: ${stream.status}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(stream.name, content, 'STREAM', stream.id, 'stream-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Streams: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Tasks
 */
async function indexTasks(): Promise<IndexStats> {
  console.log('\n📋 Indexing TASKS...');
  const stat: IndexStats = { type: 'TASK', total: 0, indexed: 0, errors: 0 };

  const tasks = await prisma.task.findMany({
    where: { organizationId: ORG_ID },
    include: { stream: { select: { name: true } } }
  });

  stat.total = tasks.length;

  for (const task of tasks) {
    const content = [
      `Zadanie: ${task.title}`,
      task.description || '',
      task.status ? `Status: ${task.status}` : '',
      task.priority ? `Priorytet: ${task.priority}` : '',
      task.stream?.name ? `Strumień: ${task.stream.name}` : '',
      task.dueDate ? `Termin: ${task.dueDate.toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(task.title, content, 'TASK', task.id, 'task-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Tasks: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Messages (Emails)
 */
async function indexMessages(): Promise<IndexStats> {
  console.log('\n📧 Indexing MESSAGES (emails)...');
  const stat: IndexStats = { type: 'MESSAGE', total: 0, indexed: 0, errors: 0 };

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
      receivedAt: true,
      extractedContext: true
    }
  });

  stat.total = messages.length;

  for (const msg of messages) {
    const content = [
      `Email: ${msg.subject || 'Bez tematu'}`,
      `Od: ${msg.fromName || msg.fromAddress}`,
      `Do: ${msg.toAddress}`,
      `Data: ${msg.receivedAt?.toISOString().split('T')[0] || 'brak'}`,
      msg.content?.substring(0, 2000) || '',
      msg.extractedContext || ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(
      msg.subject || 'Email bez tematu',
      content,
      'MESSAGE',
      msg.id,
      'email-index'
    );
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Messages: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Contacts
 */
async function indexContacts(): Promise<IndexStats> {
  console.log('\n👤 Indexing CONTACTS...');
  const stat: IndexStats = { type: 'CONTACT', total: 0, indexed: 0, errors: 0 };

  const contacts = await prisma.contact.findMany({
    where: { organizationId: ORG_ID },
    include: { assignedCompany: { select: { name: true } } }
  });

  stat.total = contacts.length;

  for (const contact of contacts) {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Nieznany kontakt';
    const content = [
      `Kontakt: ${fullName}`,
      contact.email ? `Email: ${contact.email}` : '',
      contact.phone ? `Telefon: ${contact.phone}` : '',
      contact.position ? `Stanowisko: ${contact.position}` : '',
      contact.assignedCompany?.name ? `Firma: ${contact.assignedCompany.name}` : '',
      contact.notes ? `Notatki: ${contact.notes}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(fullName, content, 'CONTACT', contact.id, 'contact-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Contacts: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Companies
 */
async function indexCompanies(): Promise<IndexStats> {
  console.log('\n🏢 Indexing COMPANIES...');
  const stat: IndexStats = { type: 'COMPANY', total: 0, indexed: 0, errors: 0 };

  const companies = await prisma.company.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = companies.length;

  for (const company of companies) {
    const content = [
      `Firma: ${company.name}`,
      company.industry ? `Branża: ${company.industry}` : '',
      company.website ? `Strona: ${company.website}` : '',
      company.phone ? `Telefon: ${company.phone}` : '',
      company.address ? `Adres: ${company.address}` : '',
      company.description ? `Opis: ${company.description}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(company.name, content, 'COMPANY', company.id, 'company-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Companies: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Deals
 */
async function indexDeals(): Promise<IndexStats> {
  console.log('\n💰 Indexing DEALS...');
  const stat: IndexStats = { type: 'DEAL', total: 0, indexed: 0, errors: 0 };

  const deals = await prisma.deal.findMany({
    where: { organizationId: ORG_ID },
    include: {
      company: { select: { name: true } }
    }
  });

  stat.total = deals.length;

  for (const deal of deals) {
    const content = [
      `Deal: ${deal.title}`,
      deal.company?.name ? `Firma: ${deal.company.name}` : '',
      deal.value ? `Wartość: ${deal.value} PLN` : '',
      deal.stage ? `Etap: ${deal.stage}` : '',
      deal.description ? `Opis: ${deal.description}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(deal.title, content, 'DEAL', deal.id, 'deal-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Deals: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Projects
 */
async function indexProjects(): Promise<IndexStats> {
  console.log('\n📁 Indexing PROJECTS...');
  const stat: IndexStats = { type: 'PROJECT', total: 0, indexed: 0, errors: 0 };

  const projects = await prisma.project.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = projects.length;

  for (const project of projects) {
    const content = [
      `Projekt: ${project.name}`,
      project.description || '',
      project.status ? `Status: ${project.status}` : '',
      project.priority ? `Priorytet: ${project.priority}` : '',
      project.startDate ? `Start: ${project.startDate.toISOString().split('T')[0]}` : '',
      project.endDate ? `Koniec: ${project.endDate.toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(project.name, content, 'PROJECT', project.id, 'project-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Projects: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Meetings
 */
async function indexMeetings(): Promise<IndexStats> {
  console.log('\n📅 Indexing MEETINGS...');
  const stat: IndexStats = { type: 'MEETING', total: 0, indexed: 0, errors: 0 };

  const meetings = await prisma.meeting.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = meetings.length;

  for (const meeting of meetings) {
    const content = [
      `Spotkanie: ${meeting.title}`,
      meeting.description || '',
      meeting.location ? `Lokalizacja: ${meeting.location}` : '',
      meeting.startTime ? `Data: ${meeting.startTime.toISOString().split('T')[0]}` : '',
      meeting.status ? `Status: ${meeting.status}` : '',
      meeting.notes ? `Notatki: ${meeting.notes}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(meeting.title, content, 'MEETING', meeting.id, 'meeting-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Meetings: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Leads
 */
async function indexLeads(): Promise<IndexStats> {
  console.log('\n🎯 Indexing LEADS...');
  const stat: IndexStats = { type: 'LEAD', total: 0, indexed: 0, errors: 0 };

  const leads = await prisma.lead.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = leads.length;

  for (const lead of leads) {
    const content = [
      `Lead: ${lead.title}`,
      lead.contactPerson ? `Osoba kontaktowa: ${lead.contactPerson}` : '',
      lead.company ? `Firma: ${lead.company}` : '',
      lead.source ? `Źródło: ${lead.source}` : '',
      lead.status ? `Status: ${lead.status}` : '',
      lead.description ? `Opis: ${lead.description}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(lead.title, content, 'LEAD', lead.id, 'lead-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Leads: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Offers
 */
async function indexOffers(): Promise<IndexStats> {
  console.log('\n📄 Indexing OFFERS...');
  const stat: IndexStats = { type: 'OFFER', total: 0, indexed: 0, errors: 0 };

  const offers = await prisma.offer.findMany({
    where: { organizationId: ORG_ID },
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } }
    }
  });

  stat.total = offers.length;

  for (const offer of offers) {
    const contactName = offer.contact ? `${offer.contact.firstName || ''} ${offer.contact.lastName || ''}`.trim() : '';
    const content = [
      `Oferta: ${offer.offerNumber || offer.id}`,
      offer.company?.name ? `Firma: ${offer.company.name}` : '',
      contactName ? `Kontakt: ${contactName}` : '',
      offer.totalAmount ? `Wartość: ${offer.totalAmount} PLN` : '',
      offer.status ? `Status: ${offer.status}` : '',
      offer.validUntil ? `Ważna do: ${offer.validUntil.toISOString().split('T')[0]}` : '',
      offer.notes ? `Notatki: ${offer.notes}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(
      `Oferta ${offer.offerNumber || offer.id}`,
      content,
      'OFFER',
      offer.id,
      'offer-index'
    );
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Offers: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Orders
 */
async function indexOrders(): Promise<IndexStats> {
  console.log('\n📦 Indexing ORDERS...');
  const stat: IndexStats = { type: 'ORDER', total: 0, indexed: 0, errors: 0 };

  const orders = await prisma.order.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = orders.length;

  for (const order of orders) {
    const content = [
      `Zamówienie: ${order.orderNumber || order.id}`,
      order.customer ? `Klient: ${order.customer}` : '',
      order.totalAmount ? `Wartość: ${order.totalAmount} PLN` : '',
      order.status ? `Status: ${order.status}` : '',
      order.deliveryDate ? `Data dostawy: ${order.deliveryDate.toISOString().split('T')[0]}` : '',
      order.description ? `Opis: ${order.description}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(
      `Zamówienie ${order.orderNumber || order.id}`,
      content,
      'ORDER',
      order.id,
      'order-index'
    );
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Orders: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index Invoices
 */
async function indexInvoices(): Promise<IndexStats> {
  console.log('\n🧾 Indexing INVOICES...');
  const stat: IndexStats = { type: 'INVOICE', total: 0, indexed: 0, errors: 0 };

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: ORG_ID }
  });

  stat.total = invoices.length;

  for (const invoice of invoices) {
    const content = [
      `Faktura: ${invoice.invoiceNumber || invoice.id}`,
      invoice.amount ? `Kwota: ${invoice.amount} PLN` : '',
      invoice.totalAmount ? `Wartość całkowita: ${invoice.totalAmount} PLN` : '',
      invoice.status ? `Status: ${invoice.status}` : '',
      invoice.createdAt ? `Data wystawienia: ${invoice.createdAt.toISOString().split('T')[0]}` : '',
      invoice.dueDate ? `Termin płatności: ${invoice.dueDate.toISOString().split('T')[0]}` : '',
      invoice.description ? `Opis: ${invoice.description}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(
      `Faktura ${invoice.invoiceNumber || invoice.id}`,
      content,
      'INVOICE',
      invoice.id,
      'invoice-index'
    );
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Invoices: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Index GTD Items (Inbox, Someday/Maybe, Waiting For, Next Actions)
 */
async function indexGTDItems(): Promise<IndexStats> {
  console.log('\n🎯 Indexing GTD ITEMS...');
  const stat: IndexStats = { type: 'GTD', total: 0, indexed: 0, errors: 0 };

  // Inbox Items
  const inboxItems = await prisma.inboxItem.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const item of inboxItems) {
    stat.total++;
    const itemTitle = item.content?.substring(0, 100) || 'Inbox item';
    const content = [
      `Inbox: ${itemTitle}`,
      item.content || '',
      item.sourceType ? `Źródło: ${item.sourceType}` : '',
      item.processed ? `Status: przetworzony` : `Status: nieprzetworzony`
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(itemTitle, content, 'INBOX_ITEM', item.id, 'gtd-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  // Precise Goals
  const goals = await prisma.precise_goals.findMany({
    where: { organization_id: ORG_ID }
  });

  for (const goal of goals) {
    stat.total++;
    const goalTitle = goal.result || 'Cel RZUT';
    const content = [
      `Cel RZUT: ${goalTitle}`,
      goal.background || '',
      goal.measurement ? `Miara: ${goal.measurement}` : '',
      goal.deadline ? `Termin: ${goal.deadline.toISOString().split('T')[0]}` : '',
      goal.status ? `Status: ${goal.status}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(goalTitle, content, 'PRECISE_GOAL', goal.id, 'gtd-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  // Areas of Responsibility
  const areas = await prisma.areaOfResponsibility.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const area of areas) {
    stat.total++;
    const content = [
      `Obszar odpowiedzialności: ${area.name}`,
      area.description || '',
      area.purpose ? `Cel: ${area.purpose}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(area.name, content, 'AREA_OF_RESPONSIBILITY', area.id, 'gtd-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  // Someday Maybe
  const somedayItems = await prisma.somedayMaybe.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const item of somedayItems) {
    stat.total++;
    const content = [
      `Kiedyś/Może: ${item.title}`,
      item.description || '',
      item.category ? `Kategoria: ${item.category}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(item.title, content, 'SOMEDAY_MAYBE', item.id, 'gtd-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  // Waiting For
  const waitingItems = await prisma.waitingFor.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const item of waitingItems) {
    stat.total++;
    const waitingTitle = item.description?.substring(0, 100) || 'Oczekuję na';
    const content = [
      `Oczekuję na: ${waitingTitle}`,
      item.description || '',
      item.waitingForWho ? `Od: ${item.waitingForWho}` : '',
      item.expectedResponseDate ? `Termin: ${item.expectedResponseDate.toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(waitingTitle, content, 'WAITING_FOR', item.id, 'gtd-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  // Next Actions
  const nextActions = await prisma.next_actions.findMany({
    where: { organizationId: ORG_ID }
  });

  for (const action of nextActions) {
    stat.total++;
    const content = [
      `Następna akcja: ${action.title}`,
      action.description || '',
      action.context ? `Kontekst: ${action.context}` : '',
      action.energy ? `Energia: ${action.energy}` : '',
      action.estimatedTime ? `Czas: ${action.estimatedTime}` : ''
    ].filter(Boolean).join('. ');

    const success = await createVectorDoc(action.title, content, 'NEXT_ACTION', action.id, 'gtd-index');
    if (success) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ GTD Items: ${stat.indexed}/${stat.total}`);
  return stat;
}

/**
 * Clear old/orphaned vector documents
 */
async function clearOldDocuments(): Promise<number> {
  console.log('\n🧹 Clearing old vector documents...');

  const result = await prisma.vector_documents.deleteMany({
    where: { organizationId: ORG_ID }
  });

  console.log(`   🗑️  Deleted ${result.count} old documents`);
  return result.count;
}

/**
 * Main reindexing function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🔄 FULL RAG REINDEXING STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Organization: ${ORG_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    // Step 1: Clear old documents
    await clearOldDocuments();

    // Step 2: Index all entity types
    stats.push(await indexStreams());
    stats.push(await indexTasks());
    stats.push(await indexMessages());
    stats.push(await indexContacts());
    stats.push(await indexCompanies());
    stats.push(await indexDeals());
    stats.push(await indexProjects());
    stats.push(await indexMeetings());
    stats.push(await indexLeads());
    stats.push(await indexOffers());
    stats.push(await indexOrders());
    stats.push(await indexInvoices());
    stats.push(await indexGTDItems());

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalIndexed = stats.reduce((sum, s) => sum + s.indexed, 0);
    const totalErrors = stats.reduce((sum, s) => sum + s.errors, 0);
    const totalItems = stats.reduce((sum, s) => sum + s.total, 0);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('        📊 REINDEXING SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n| Type              | Total | Indexed | Errors |');
    console.log('|-------------------|-------|---------|--------|');
    for (const s of stats) {
      console.log(`| ${s.type.padEnd(17)} | ${String(s.total).padStart(5)} | ${String(s.indexed).padStart(7)} | ${String(s.errors).padStart(6)} |`);
    }
    console.log('|-------------------|-------|---------|--------|');
    console.log(`| TOTAL             | ${String(totalItems).padStart(5)} | ${String(totalIndexed).padStart(7)} | ${String(totalErrors).padStart(6)} |`);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Reindexing completed in ${totalTime}s`);
    console.log(`📈 ${totalIndexed} documents now in RAG database`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ REINDEXING FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();
