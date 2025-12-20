const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMoreTables() {
  console.log('🔍 Sprawdzenie dodatkowych tabel nie sprawdzanych wcześniej...\n');

  try {
    const additional = [];
    
    // Sprawdź dodatkowe tabele które mogą istnieć w Prisma
    try {
      const recurringTasks = await prisma.recurringTask.count();
      if (recurringTasks > 0) additional.push({name: 'recurring_tasks', count: recurringTasks});
      else console.log('🔴 recurring_tasks: pusta');
    } catch (e) { console.log('⚠️  recurring_tasks: błąd model'); }

    try {
      const delegatedTasks = await prisma.delegatedTask.count();
      if (delegatedTasks > 0) additional.push({name: 'delegated_tasks', count: delegatedTasks});
      else console.log('🔴 delegated_tasks: pusta');
    } catch (e) { console.log('⚠️  delegated_tasks: błąd model'); }

    try {
      const inboxItems = await prisma.inboxItem.count();
      if (inboxItems > 0) additional.push({name: 'inbox_items', count: inboxItems});
      else console.log('🔴 inbox_items: pusta');
    } catch (e) { console.log('⚠️  inbox_items: błąd model'); }

    try {
      const focusModes = await prisma.focusMode.count();
      if (focusModes > 0) additional.push({name: 'focus_modes', count: focusModes});
      else console.log('🔴 focus_modes: pusta');
    } catch (e) { console.log('⚠️  focus_modes: błąd model'); }

    try {
      const activities = await prisma.activity.count();
      if (activities > 0) additional.push({name: 'activities', count: activities});
      else console.log('🔴 activities: pusta');
    } catch (e) { console.log('⚠️  activities: błąd model'); }

    try {
      const bugReports = await prisma.bugReport.count();
      if (bugReports > 0) additional.push({name: 'bug_reports', count: bugReports});
      else console.log('🔴 bug_reports: pusta');
    } catch (e) { console.log('⚠️  bug_reports: błąd model'); }

    try {
      const autoReplies = await prisma.autoReply.count();
      if (autoReplies > 0) additional.push({name: 'auto_replies', count: autoReplies});
      else console.log('🔴 auto_replies: pusta');
    } catch (e) { console.log('⚠️  auto_replies: błąd model'); }

    try {
      const wikiPages = await prisma.wikiPage.count();
      if (wikiPages > 0) additional.push({name: 'wiki_pages', count: wikiPages});
      else console.log('🔴 wiki_pages: pusta');
    } catch (e) { console.log('⚠️  wiki_pages: błąd model'); }

    try {
      const emailRules = await prisma.emailRule.count();
      if (emailRules > 0) additional.push({name: 'email_rules', count: emailRules});
      else console.log('🔴 email_rules: pusta');
    } catch (e) { console.log('⚠️  email_rules: błąd model'); }

    try {
      const smartMailboxes = await prisma.smartMailbox.count();
      if (smartMailboxes > 0) additional.push({name: 'smart_mailboxes', count: smartMailboxes});
      else console.log('🔴 smart_mailboxes: pusta');
    } catch (e) { console.log('⚠️  smart_mailboxes: błąd model'); }

    try {
      const subscriptions = await prisma.subscription.count();
      if (subscriptions > 0) additional.push({name: 'subscriptions', count: subscriptions});
      else console.log('🔴 subscriptions: pusta');
    } catch (e) { console.log('⚠️  subscriptions: błąd model'); }

    try {
      const streams = await prisma.stream.count();
      if (streams > 0) additional.push({name: 'streams', count: streams});
      else console.log('🔴 streams: pusta');
    } catch (e) { console.log('⚠️  streams: błąd model'); }

    console.log('\n✅ DODATKOWE TABELE WYPEŁNIONE:');
    additional.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name} (${table.count} rekordów)`);
    });

    const newTotal = 21 + additional.length;
    const newPercentage = ((newTotal / 27) * 100).toFixed(1);
    console.log(`\n📊 NOWY STAN: ${newTotal}/27 tabel (${newPercentage}%)`);

    if (newTotal >= 24) {
      console.log('🎉 OSIĄGNĘLIŚMY 90%! 🎉');
    } else {
      console.log(`🎯 Do 90%: trzeba jeszcze ${24 - newTotal} tabel`);
    }

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMoreTables();