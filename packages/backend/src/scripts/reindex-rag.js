/**
 * Full RAG Reindexing Script (JavaScript version)
 * Run with: node src/scripts/reindex-rag.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ORG_ID = 'fe59f2b0-93d0-4193-9bab-aee778c1a449';

const stats = [];

function generateMockEmbedding(text) {
  const dimension = 1536;
  const embedding = [];
  const hash = crypto.createHash('sha256').update(text || '').digest();

  for (let i = 0; i < dimension; i++) {
    embedding.push((hash[i % hash.length] - 128) / 128);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

function generateContentHash(content) {
  return crypto.createHash('md5').update((content || '').trim().toLowerCase()).digest('hex');
}

async function createVectorDoc(title, content, entityType, entityId, source = 'reindex') {
  try {
    if (!content || content.trim().length < 10) return false;

    const contentHash = generateContentHash(content);
    const existing = await prisma.vector_documents.findUnique({ where: { contentHash } });

    if (existing) {
      if (existing.entityId !== entityId) {
        await prisma.vector_documents.update({
          where: { id: existing.id },
          data: { title, entityType, entityId, lastUpdated: new Date() }
        });
      }
      return true;
    }

    const embedding = generateMockEmbedding(content);

    await prisma.vector_documents.create({
      data: {
        id: crypto.randomUUID(),
        title: (title || 'Untitled').substring(0, 500),
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

async function indexStreams() {
  console.log('\n📊 Indexing STREAMS...');
  const stat = { type: 'STREAM', total: 0, indexed: 0, errors: 0 };

  const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID } });
  stat.total = streams.length;

  for (const s of streams) {
    const content = [
      `Strumień: ${s.name}`,
      s.description || '',
      s.streamType ? `Typ: ${s.streamType}` : '',
      s.gtdRole ? `Rola GTD: ${s.gtdRole}` : '',
      s.status ? `Status: ${s.status}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(s.name, content, 'STREAM', s.id, 'stream-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Streams: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexTasks() {
  console.log('\n📋 Indexing TASKS...');
  const stat = { type: 'TASK', total: 0, indexed: 0, errors: 0 };

  const tasks = await prisma.task.findMany({
    where: { organizationId: ORG_ID },
    include: { stream: true }
  });
  stat.total = tasks.length;

  for (const t of tasks) {
    const content = [
      `Zadanie: ${t.title}`,
      t.description || '',
      t.status ? `Status: ${t.status}` : '',
      t.priority ? `Priorytet: ${t.priority}` : '',
      t.stream?.name ? `Strumień: ${t.stream.name}` : '',
      t.dueDate ? `Termin: ${new Date(t.dueDate).toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(t.title, content, 'TASK', t.id, 'task-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Tasks: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexMessages() {
  console.log('\n📧 Indexing MESSAGES...');
  const stat = { type: 'MESSAGE', total: 0, indexed: 0, errors: 0 };

  const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID } });
  stat.total = messages.length;

  for (const m of messages) {
    const content = [
      `Email: ${m.subject || 'Bez tematu'}`,
      `Od: ${m.fromName || m.fromAddress}`,
      `Do: ${m.toAddress}`,
      m.receivedAt ? `Data: ${new Date(m.receivedAt).toISOString().split('T')[0]}` : '',
      (m.content || '').substring(0, 2000),
      m.extractedContext || ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(m.subject || 'Email', content, 'MESSAGE', m.id, 'email-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Messages: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexContacts() {
  console.log('\n👤 Indexing CONTACTS...');
  const stat = { type: 'CONTACT', total: 0, indexed: 0, errors: 0 };

  const contacts = await prisma.contact.findMany({ where: { organizationId: ORG_ID } });
  stat.total = contacts.length;

  for (const c of contacts) {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Kontakt';
    const content = [
      `Kontakt: ${fullName}`,
      c.email ? `Email: ${c.email}` : '',
      c.phone ? `Telefon: ${c.phone}` : '',
      c.position ? `Stanowisko: ${c.position}` : '',
      c.notes ? `Notatki: ${c.notes}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(fullName, content, 'CONTACT', c.id, 'contact-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Contacts: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexCompanies() {
  console.log('\n🏢 Indexing COMPANIES...');
  const stat = { type: 'COMPANY', total: 0, indexed: 0, errors: 0 };

  const companies = await prisma.company.findMany({ where: { organizationId: ORG_ID } });
  stat.total = companies.length;

  for (const c of companies) {
    const content = [
      `Firma: ${c.name}`,
      c.industry ? `Branża: ${c.industry}` : '',
      c.website ? `Strona: ${c.website}` : '',
      c.phone ? `Telefon: ${c.phone}` : '',
      c.address ? `Adres: ${c.address}` : '',
      c.description ? `Opis: ${c.description}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(c.name, content, 'COMPANY', c.id, 'company-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Companies: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexDeals() {
  console.log('\n💰 Indexing DEALS...');
  const stat = { type: 'DEAL', total: 0, indexed: 0, errors: 0 };

  const deals = await prisma.deal.findMany({
    where: { organizationId: ORG_ID },
    include: { company: true }
  });
  stat.total = deals.length;

  for (const d of deals) {
    const content = [
      `Deal: ${d.title || d.name || 'Deal'}`,
      d.company?.name ? `Firma: ${d.company.name}` : '',
      d.value ? `Wartość: ${d.value} PLN` : '',
      d.stage ? `Etap: ${d.stage}` : '',
      d.description ? `Opis: ${d.description}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(d.title || d.name || 'Deal', content, 'DEAL', d.id, 'deal-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Deals: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexProjects() {
  console.log('\n📁 Indexing PROJECTS...');
  const stat = { type: 'PROJECT', total: 0, indexed: 0, errors: 0 };

  const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID } });
  stat.total = projects.length;

  for (const p of projects) {
    const content = [
      `Projekt: ${p.name}`,
      p.description || '',
      p.status ? `Status: ${p.status}` : '',
      p.priority ? `Priorytet: ${p.priority}` : '',
      p.startDate ? `Start: ${new Date(p.startDate).toISOString().split('T')[0]}` : '',
      p.endDate ? `Koniec: ${new Date(p.endDate).toISOString().split('T')[0]}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(p.name, content, 'PROJECT', p.id, 'project-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Projects: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexMeetings() {
  console.log('\n📅 Indexing MEETINGS...');
  const stat = { type: 'MEETING', total: 0, indexed: 0, errors: 0 };

  const meetings = await prisma.meeting.findMany({ where: { organizationId: ORG_ID } });
  stat.total = meetings.length;

  for (const m of meetings) {
    const content = [
      `Spotkanie: ${m.title}`,
      m.description || '',
      m.location ? `Lokalizacja: ${m.location}` : '',
      m.startTime ? `Data: ${new Date(m.startTime).toISOString().split('T')[0]}` : '',
      m.notes ? `Notatki: ${m.notes}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(m.title, content, 'MEETING', m.id, 'meeting-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Meetings: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexLeads() {
  console.log('\n🎯 Indexing LEADS...');
  const stat = { type: 'LEAD', total: 0, indexed: 0, errors: 0 };

  const leads = await prisma.lead.findMany({ where: { organizationId: ORG_ID } });
  stat.total = leads.length;

  for (const l of leads) {
    const content = [
      `Lead: ${l.name || l.firstName || 'Lead'}`,
      l.email ? `Email: ${l.email}` : '',
      l.phone ? `Telefon: ${l.phone}` : '',
      l.company ? `Firma: ${l.company}` : '',
      l.source ? `Źródło: ${l.source}` : '',
      l.status ? `Status: ${l.status}` : '',
      l.notes ? `Notatki: ${l.notes}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(l.name || l.firstName || 'Lead', content, 'LEAD', l.id, 'lead-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Leads: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexOffers() {
  console.log('\n📄 Indexing OFFERS...');
  const stat = { type: 'OFFER', total: 0, indexed: 0, errors: 0 };

  const offers = await prisma.offer.findMany({
    where: { organizationId: ORG_ID },
    include: { company: true }
  });
  stat.total = offers.length;

  for (const o of offers) {
    const title = `Oferta ${o.number || o.id}`;
    const content = [
      title,
      o.company?.name ? `Firma: ${o.company.name}` : '',
      o.totalNet ? `Wartość netto: ${o.totalNet} PLN` : '',
      o.status ? `Status: ${o.status}` : '',
      o.validUntil ? `Ważna do: ${new Date(o.validUntil).toISOString().split('T')[0]}` : '',
      o.notes ? `Notatki: ${o.notes}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(title, content, 'OFFER', o.id, 'offer-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Offers: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexOrders() {
  console.log('\n📦 Indexing ORDERS...');
  const stat = { type: 'ORDER', total: 0, indexed: 0, errors: 0 };

  const orders = await prisma.order.findMany({
    where: { organizationId: ORG_ID }
  });
  stat.total = orders.length;

  for (const o of orders) {
    const title = `Zamówienie ${o.number || o.id}`;
    const content = [
      title,
      o.totalNet ? `Wartość netto: ${o.totalNet} PLN` : '',
      o.status ? `Status: ${o.status}` : '',
      o.orderDate ? `Data: ${new Date(o.orderDate).toISOString().split('T')[0]}` : '',
      o.notes ? `Notatki: ${o.notes}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(title, content, 'ORDER', o.id, 'order-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Orders: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexInvoices() {
  console.log('\n🧾 Indexing INVOICES...');
  const stat = { type: 'INVOICE', total: 0, indexed: 0, errors: 0 };

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: ORG_ID }
  });
  stat.total = invoices.length;

  for (const i of invoices) {
    const title = `Faktura ${i.number || i.id}`;
    const content = [
      title,
      i.totalNet ? `Wartość netto: ${i.totalNet} PLN` : '',
      i.totalGross ? `Wartość brutto: ${i.totalGross} PLN` : '',
      i.status ? `Status: ${i.status}` : '',
      i.issueDate ? `Data wystawienia: ${new Date(i.issueDate).toISOString().split('T')[0]}` : '',
      i.dueDate ? `Termin płatności: ${new Date(i.dueDate).toISOString().split('T')[0]}` : '',
      i.notes ? `Notatki: ${i.notes}` : ''
    ].filter(Boolean).join('. ');

    if (await createVectorDoc(title, content, 'INVOICE', i.id, 'invoice-index')) stat.indexed++;
    else stat.errors++;
  }

  console.log(`   ✅ Invoices: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function indexGTDItems() {
  console.log('\n🎯 Indexing GTD ITEMS...');
  const stat = { type: 'GTD', total: 0, indexed: 0, errors: 0 };

  // Inbox Items
  try {
    const inboxItems = await prisma.inboxItem.findMany({ where: { organizationId: ORG_ID } });
    for (const item of inboxItems) {
      stat.total++;
      const content = [
        `Inbox: ${item.title}`,
        item.content || '',
        item.sourceType ? `Źródło: ${item.sourceType}` : '',
        item.status ? `Status: ${item.status}` : ''
      ].filter(Boolean).join('. ');

      if (await createVectorDoc(item.title, content, 'INBOX_ITEM', item.id, 'gtd-index')) stat.indexed++;
      else stat.errors++;
    }
  } catch (e) { console.log('   (inbox items skipped)'); }

  // Precise Goals
  try {
    const goals = await prisma.preciseGoal.findMany({ where: { organization_id: ORG_ID } });
    for (const g of goals) {
      stat.total++;
      const content = [
        `Cel RZUT: ${g.result || g.title || 'Cel'}`,
        g.background || g.description || '',
        g.deadline ? `Termin: ${new Date(g.deadline).toISOString().split('T')[0]}` : '',
        g.status ? `Status: ${g.status}` : ''
      ].filter(Boolean).join('. ');

      if (await createVectorDoc(g.result || g.title || 'Cel', content, 'PRECISE_GOAL', g.id, 'gtd-index')) stat.indexed++;
      else stat.errors++;
    }
  } catch (e) { console.log('   (precise goals skipped)'); }

  // Areas of Responsibility
  try {
    const areas = await prisma.areaOfResponsibility.findMany({ where: { organizationId: ORG_ID } });
    for (const a of areas) {
      stat.total++;
      const content = [
        `Obszar odpowiedzialności: ${a.name}`,
        a.description || '',
        a.category ? `Kategoria: ${a.category}` : ''
      ].filter(Boolean).join('. ');

      if (await createVectorDoc(a.name, content, 'AREA_OF_RESPONSIBILITY', a.id, 'gtd-index')) stat.indexed++;
      else stat.errors++;
    }
  } catch (e) { console.log('   (areas skipped)'); }

  // Someday Maybe
  try {
    const someday = await prisma.somedayMaybe.findMany({ where: { organizationId: ORG_ID } });
    for (const s of someday) {
      stat.total++;
      const content = [
        `Kiedyś/Może: ${s.title}`,
        s.description || '',
        s.category ? `Kategoria: ${s.category}` : ''
      ].filter(Boolean).join('. ');

      if (await createVectorDoc(s.title, content, 'SOMEDAY_MAYBE', s.id, 'gtd-index')) stat.indexed++;
      else stat.errors++;
    }
  } catch (e) { console.log('   (someday/maybe skipped)'); }

  // Waiting For
  try {
    const waiting = await prisma.waitingFor.findMany({ where: { organizationId: ORG_ID } });
    for (const w of waiting) {
      stat.total++;
      const content = [
        `Oczekuję na: ${w.title}`,
        w.description || '',
        w.waitingFor ? `Od: ${w.waitingFor}` : '',
        w.dueDate ? `Termin: ${new Date(w.dueDate).toISOString().split('T')[0]}` : ''
      ].filter(Boolean).join('. ');

      if (await createVectorDoc(w.title, content, 'WAITING_FOR', w.id, 'gtd-index')) stat.indexed++;
      else stat.errors++;
    }
  } catch (e) { console.log('   (waiting for skipped)'); }

  // Next Actions
  try {
    const nextActions = await prisma.nextAction.findMany({ where: { organizationId: ORG_ID } });
    for (const n of nextActions) {
      stat.total++;
      const content = [
        `Następna akcja: ${n.title}`,
        n.description || '',
        n.context ? `Kontekst: ${n.context}` : '',
        n.energy ? `Energia: ${n.energy}` : ''
      ].filter(Boolean).join('. ');

      if (await createVectorDoc(n.title, content, 'NEXT_ACTION', n.id, 'gtd-index')) stat.indexed++;
      else stat.errors++;
    }
  } catch (e) { console.log('   (next actions skipped)'); }

  console.log(`   ✅ GTD Items: ${stat.indexed}/${stat.total}`);
  return stat;
}

async function clearOldDocuments() {
  console.log('\n🧹 Clearing old vector documents...');
  const result = await prisma.vector_documents.deleteMany({ where: { organizationId: ORG_ID } });
  console.log(`   🗑️  Deleted ${result.count} old documents`);
  return result.count;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🔄 FULL RAG REINDEXING STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Organization: ${ORG_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    await clearOldDocuments();

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

main();
