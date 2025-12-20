const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalCountAll() {
  console.log('🏆 FINALNE PODSUMOWANIE - WSZYSTKIE TABELE...\n');

  try {
    const filled = [];

    // Core entities (sprawdzone wcześniej)
    const organizations = await prisma.organization.count();
    if (organizations > 0) filled.push({name: 'organizations', count: organizations});

    const users = await prisma.user.count();
    if (users > 0) filled.push({name: 'users', count: users});

    const tasks = await prisma.task.count();
    if (tasks > 0) filled.push({name: 'tasks', count: tasks});

    const projects = await prisma.project.count();
    if (projects > 0) filled.push({name: 'projects', count: projects});

    const contacts = await prisma.contact.count();
    if (contacts > 0) filled.push({name: 'contacts', count: contacts});

    const companies = await prisma.company.count();
    if (companies > 0) filled.push({name: 'companies', count: companies});

    const deals = await prisma.deal.count();
    if (deals > 0) filled.push({name: 'deals', count: deals});

    const nextActions = await prisma.nextAction.count();
    if (nextActions > 0) filled.push({name: 'next_actions', count: nextActions});

    const contexts = await prisma.context.count();
    if (contexts > 0) filled.push({name: 'contexts', count: contexts});

    const products = await prisma.product.count();
    if (products > 0) filled.push({name: 'products', count: products});

    const services = await prisma.service.count();
    if (services > 0) filled.push({name: 'services', count: services});

    const folders = await prisma.folder.count();
    if (folders > 0) filled.push({name: 'folders', count: folders});

    const documents = await prisma.document.count();
    if (documents > 0) filled.push({name: 'documents', count: documents});

    const tags = await prisma.tag.count();
    if (tags > 0) filled.push({name: 'tags', count: tags});

    const habits = await prisma.habit.count();
    if (habits > 0) filled.push({name: 'habits', count: habits});

    const meetings = await prisma.meeting.count();
    if (meetings > 0) filled.push({name: 'meetings', count: meetings});

    const waitingFor = await prisma.waitingFor.count();
    if (waitingFor > 0) filled.push({name: 'waiting_for', count: waitingFor});

    const somedayMaybe = await prisma.somedayMaybe.count();
    if (somedayMaybe > 0) filled.push({name: 'someday_maybe', count: somedayMaybe});

    const aiProviders = await prisma.aIProvider.count();
    if (aiProviders > 0) filled.push({name: 'ai_providers', count: aiProviders});

    const leads = await prisma.lead.count();
    if (leads > 0) filled.push({name: 'leads', count: leads});

    const orders = await prisma.order.count();
    if (orders > 0) filled.push({name: 'orders', count: orders});

    // Nowo odkryte
    const inboxItems = await prisma.inboxItem.count();
    if (inboxItems > 0) filled.push({name: 'inbox_items', count: inboxItems});

    const subscriptions = await prisma.subscription.count();
    if (subscriptions > 0) filled.push({name: 'subscriptions', count: subscriptions});

    const streams = await prisma.stream.count();
    if (streams > 0) filled.push({name: 'streams', count: streams});

    // Pozostałe do sprawdzenia
    try {
      const recurringTasks = await prisma.recurringTask.count();
      if (recurringTasks > 0) filled.push({name: 'recurring_tasks', count: recurringTasks});
    } catch (e) {}

    try {
      const wikiPages = await prisma.wikiPage.count();
      if (wikiPages > 0) filled.push({name: 'wiki_pages', count: wikiPages});
    } catch (e) {}

    try {
      const emailRules = await prisma.emailRule.count();
      if (emailRules > 0) filled.push({name: 'email_rules', count: emailRules});
    } catch (e) {}

    console.log('=' .repeat(80));
    console.log('🏆 FINALNE PODSUMOWANIE WYPEŁNIENIA BAZY DANYCH');
    console.log('='.repeat(80));

    console.log('\n✅ TABELE WYPEŁNIONE:');
    filled
      .sort((a, b) => b.count - a.count)
      .forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.count} rekordów)`);
      });

    const totalTables = 27; // Known from previous analysis
    const fillPercentage = ((filled.length / totalTables) * 100).toFixed(1);
    const totalRecords = filled.reduce((sum, table) => sum + table.count, 0);

    console.log('\n' + '='.repeat(80));
    console.log('📊 STATYSTYKI FINALNE:');
    console.log(`🗄️  Łączna liczba tabel sprawdzonych: ${totalTables}`);
    console.log(`✅ Tabele wypełnione: ${filled.length} (${fillPercentage}%)`);
    console.log(`🔴 Tabele puste: ${totalTables - filled.length} (${(100 - fillPercentage).toFixed(1)}%)`);
    console.log(`📋 Łączna liczba rekordów: ${totalRecords}`);
    console.log('='.repeat(80));

    if (fillPercentage >= 90) {
      console.log('🎉🎉🎉 OSIĄGNĘLIŚMY 90% WYPEŁNIENIA! 🎉🎉🎉');
    } else {
      console.log(`🎯 Do osiągnięcia 90%: trzeba wypełnić jeszcze ${Math.ceil(totalTables * 0.9) - filled.length} tabel`);
    }

    console.log(`\n📈 WZROST: z początkowych ~30% do ${fillPercentage}%`);
    console.log(`🚀 SUKCES: +${filled.length - 13} nowych tabel wypełnionych!`);
    console.log(`📊 REKORDY: +${totalRecords - 96} nowych realistycznych rekordów!`);

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCountAll();