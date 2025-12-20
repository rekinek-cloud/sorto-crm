const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function countFilledTables() {
  console.log('📊 Sprawdzanie wypełnionych tabel poprzez Prisma models...\n');

  try {
    const filled = [];
    const empty = [];

    // Sprawdź każdy model Prisma
    console.log('🔍 Sprawdzanie podstawowych tabel...');

    // Core entities
    const organizations = await prisma.organization.count();
    if (organizations > 0) filled.push({name: 'organizations', count: organizations});
    else empty.push('organizations');

    const users = await prisma.user.count();
    if (users > 0) filled.push({name: 'users', count: users});
    else empty.push('users');

    const tasks = await prisma.task.count();
    if (tasks > 0) filled.push({name: 'tasks', count: tasks});
    else empty.push('tasks');

    const projects = await prisma.project.count();
    if (projects > 0) filled.push({name: 'projects', count: projects});
    else empty.push('projects');

    const contacts = await prisma.contact.count();
    if (contacts > 0) filled.push({name: 'contacts', count: contacts});
    else empty.push('contacts');

    const companies = await prisma.company.count();
    if (companies > 0) filled.push({name: 'companies', count: companies});
    else empty.push('companies');

    const deals = await prisma.deal.count();
    if (deals > 0) filled.push({name: 'deals', count: deals});
    else empty.push('deals');

    const nextActions = await prisma.nextAction.count();
    if (nextActions > 0) filled.push({name: 'next_actions', count: nextActions});
    else empty.push('next_actions');

    const contexts = await prisma.context.count();
    if (contexts > 0) filled.push({name: 'contexts', count: contexts});
    else empty.push('contexts');

    // Advanced models
    try {
      const products = await prisma.product.count();
      if (products > 0) filled.push({name: 'products', count: products});
      else empty.push('products');
    } catch (e) { empty.push('products'); }

    try {
      const services = await prisma.service.count();
      if (services > 0) filled.push({name: 'services', count: services});
      else empty.push('services');
    } catch (e) { empty.push('services'); }

    try {
      const messages = await prisma.message.count();
      if (messages > 0) filled.push({name: 'messages', count: messages});
      else empty.push('messages');
    } catch (e) { empty.push('messages'); }

    try {
      const folders = await prisma.folder.count();
      if (folders > 0) filled.push({name: 'folders', count: folders});
      else empty.push('folders');
    } catch (e) { empty.push('folders'); }

    try {
      const documents = await prisma.document.count();
      if (documents > 0) filled.push({name: 'documents', count: documents});
      else empty.push('documents');
    } catch (e) { empty.push('documents'); }

    try {
      const tags = await prisma.tag.count();
      if (tags > 0) filled.push({name: 'tags', count: tags});
      else empty.push('tags');
    } catch (e) { empty.push('tags'); }

    try {
      const habits = await prisma.habit.count();
      if (habits > 0) filled.push({name: 'habits', count: habits});
      else empty.push('habits');
    } catch (e) { empty.push('habits'); }

    try {
      const weeklyReviews = await prisma.weeklyReview.count();
      if (weeklyReviews > 0) filled.push({name: 'weekly_reviews', count: weeklyReviews});
      else empty.push('weekly_reviews');
    } catch (e) { empty.push('weekly_reviews'); }

    try {
      const meetings = await prisma.meeting.count();
      if (meetings > 0) filled.push({name: 'meetings', count: meetings});
      else empty.push('meetings');
    } catch (e) { empty.push('meetings'); }

    try {
      const waitingFor = await prisma.waitingFor.count();
      if (waitingFor > 0) filled.push({name: 'waiting_for', count: waitingFor});
      else empty.push('waiting_for');
    } catch (e) { empty.push('waiting_for'); }

    try {
      const somedayMaybe = await prisma.somedayMaybe.count();
      if (somedayMaybe > 0) filled.push({name: 'someday_maybe', count: somedayMaybe});
      else empty.push('someday_maybe');
    } catch (e) { empty.push('someday_maybe'); }

    // AI Models
    try {
      const aiProviders = await prisma.aIProvider.count();
      if (aiProviders > 0) filled.push({name: 'ai_providers', count: aiProviders});
      else empty.push('ai_providers');
    } catch (e) { empty.push('ai_providers'); }

    try {
      const aiModels = await prisma.aIModel.count();
      if (aiModels > 0) filled.push({name: 'ai_models', count: aiModels});
      else empty.push('ai_models');
    } catch (e) { empty.push('ai_models'); }

    try {
      const aiRules = await prisma.aIRule.count();
      if (aiRules > 0) filled.push({name: 'ai_rules', count: aiRules});
      else empty.push('ai_rules');
    } catch (e) { empty.push('ai_rules'); }

    // Business models
    try {
      const offers = await prisma.offer.count();
      if (offers > 0) filled.push({name: 'offers', count: offers});
      else empty.push('offers');
    } catch (e) { empty.push('offers'); }

    try {
      const orders = await prisma.order.count();
      if (orders > 0) filled.push({name: 'orders', count: orders});
      else empty.push('orders');
    } catch (e) { empty.push('orders'); }

    try {
      const invoices = await prisma.invoice.count();
      if (invoices > 0) filled.push({name: 'invoices', count: invoices});
      else empty.push('invoices');
    } catch (e) { empty.push('invoices'); }

    try {
      const leads = await prisma.lead.count();
      if (leads > 0) filled.push({name: 'leads', count: leads});
      else empty.push('leads');
    } catch (e) { empty.push('leads'); }

    console.log('\n' + '='.repeat(80));
    console.log('📊 AKTUALNY STAN BAZY DANYCH:');
    console.log('='.repeat(80));

    console.log('\n✅ TABELE WYPEŁNIONE:');
    filled
      .sort((a, b) => b.count - a.count)
      .forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.count} rekordów)`);
      });

    console.log('\n🔴 TABELE PUSTE:');
    empty.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

    const totalTables = filled.length + empty.length;
    const fillPercentage = ((filled.length / totalTables) * 100).toFixed(1);
    const totalRecords = filled.reduce((sum, table) => sum + table.count, 0);

    console.log('\n' + '='.repeat(80));
    console.log('📈 STATYSTYKI:');
    console.log(`🗄️  Sprawdzonych tabel: ${totalTables}`);
    console.log(`✅ Tabele wypełnione: ${filled.length} (${fillPercentage}%)`);
    console.log(`🔴 Tabele puste: ${empty.length} (${(100 - fillPercentage).toFixed(1)}%)`);
    console.log(`📋 Łączna liczba rekordów: ${totalRecords}`);
    console.log('='.repeat(80));

    // Cel 90%
    const tablesNeededFor90 = Math.ceil(totalTables * 0.9) - filled.length;
    console.log(`\n🎯 Do osiągnięcia 90%: trzeba wypełnić jeszcze ${tablesNeededFor90} tabel`);

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countFilledTables();